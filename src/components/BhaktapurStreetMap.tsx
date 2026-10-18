import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import {
  BhaktapurLandmark,
  ExtractedRoute,
  LatLng,
  MapTileStyle,
} from '../types/game';
import {
  BHAKTAPUR_LANDMARKS,
  extractLiveBhaktapurStreetRoute,
  INITIAL_EXTRACTED_ROUTES,
} from '../data/bhaktapurData';
import {
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Navigation,
  Route as RouteIcon,
  Sparkles,
} from 'lucide-react';

interface BhaktapurStreetMapProps {
  activeRoute: ExtractedRoute;
  runnerCoords: LatLng;
  runnerBearing: number;
  tileStyle: MapTileStyle;
  mapTilerKey?: string;
  onSelectRoute: (route: ExtractedRoute) => void;
  onChangeTileStyle: (style: MapTileStyle) => void;
  onSaveMapTilerKey: (key: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

function getTileLayerConfig(
  style: MapTileStyle,
  mapTilerKey?: string
): { url: string; attribution: string } {
  const cleanKey = mapTilerKey?.trim();
  if (style === 'MAPTILER_STREETS' && cleanKey) {
    return {
      url: `https://api.maptiler.com/maps/streets-v2/{z}/{x}/{y}.png?key=${encodeURIComponent(cleanKey)}`,
      attribution: '&copy; MapTiler &copy; OpenStreetMap contributors',
    };
  }
  if (style === 'SATELLITE_AERIAL') {
    return {
      url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
      attribution: '&copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics',
    };
  }
  if (style === 'DARK_OBSIDIAN') {
    return {
      url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      attribution: '&copy; OpenStreetMap &copy; CARTO',
    };
  }
  // Default OSM_HERITAGE (or MAPTILER_STREETS fallback when no key entered yet)
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
  };
}

export const BhaktapurStreetMap: React.FC<BhaktapurStreetMapProps> = ({
  activeRoute,
  runnerCoords,
  runnerBearing,
  tileStyle,
  mapTilerKey,
  onSelectRoute,
  onChangeTileStyle,
  onSaveMapTilerKey,
  isExpanded,
  onToggleExpand,
}) => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);
  const routePolylineRef = useRef<L.Polyline | null>(null);
  const runnerMarkerRef = useRef<L.Marker | null>(null);
  const landmarkMarkersRef = useRef<L.LayerGroup | null>(null);

  const [customOriginId, setCustomOriginId] = useState<string>(
    activeRoute.origin.id
  );
  const [customDestId, setCustomDestId] = useState<string>(
    activeRoute.destination.id
  );
  const [isExtracting, setIsExtracting] = useState(false);
  const [keyInput, setKeyInput] = useState(mapTilerKey || '');
  const [showKeyForm, setShowKeyForm] = useState(false);
  const [mapClickMode, setMapClickMode] = useState<'NONE' | 'START' | 'END'>('NONE');
  const [customStartCoord, setCustomStartCoord] = useState<LatLng | null>(null);
  const [customEndCoord, setCustomEndCoord] = useState<LatLng | null>(null);

  const mapClickModeRef = useRef(mapClickMode);
  mapClickModeRef.current = mapClickMode;

  // Initialize Leaflet Map once
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [runnerCoords.lat, runnerCoords.lng],
      zoom: 16,
      zoomControl: false,
    });

    const cfg = getTileLayerConfig(tileStyle, mapTilerKey);
    const tileLayer = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
    }).addTo(map);

    const landmarkGroup = L.layerGroup().addTo(map);

    const polyline = L.polyline(
      activeRoute.polyline.map((c): L.LatLngTuple => [c.lat, c.lng]),
      {
        color: '#06B6D4',
        weight: 5,
        opacity: 0.92,
      }
    ).addTo(map);

    // Runner live directional marker
    const runnerIcon = L.divIcon({
      className: 'bhaktapur-runner-pin',
      html: `<div style="width:20px;height:20px;border-radius:9999px;background:#D94E28;border:3px solid #FEF08A;box-shadow:0 0 12px rgba(245,158,11,0.9);"></div>`,
      iconSize: [20, 20],
      iconAnchor: [10, 10],
    });
    const runnerMarker = L.marker([runnerCoords.lat, runnerCoords.lng], {
      icon: runnerIcon,
      zIndexOffset: 1000,
    }).addTo(map);

    // Click on map to pick custom street coordinates
    map.on('click', (e: L.LeafletMouseEvent) => {
      if (mapClickModeRef.current === 'START') {
        setCustomStartCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
        setMapClickMode('END');
      } else if (mapClickModeRef.current === 'END') {
        setCustomEndCoord({ lat: e.latlng.lat, lng: e.latlng.lng });
        setMapClickMode('NONE');
      }
    });

    mapInstanceRef.current = map;
    tileLayerRef.current = tileLayer;
    routePolylineRef.current = polyline;
    runnerMarkerRef.current = runnerMarker;
    landmarkMarkersRef.current = landmarkGroup;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when style or MapTiler key changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    if (tileLayerRef.current) {
      map.removeLayer(tileLayerRef.current);
    }
    const cfg = getTileLayerConfig(tileStyle, mapTilerKey);
    tileLayerRef.current = L.tileLayer(cfg.url, {
      maxZoom: 19,
      attribution: cfg.attribution,
    }).addTo(map);
  }, [tileStyle, mapTilerKey]);

  // Render Landmark Markers & Route Polyline when route changes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const poly = routePolylineRef.current;
    const lmGroup = landmarkMarkersRef.current;
    if (!map || !poly || !lmGroup) return;

    poly.setLatLngs(
      activeRoute.polyline.map((c): L.LatLngTuple => [c.lat, c.lng])
    );
    lmGroup.clearLayers();

    BHAKTAPUR_LANDMARKS.forEach((lm) => {
      const isOrigin = lm.id === activeRoute.origin.id;
      const isDest = lm.id === activeRoute.destination.id;
      const badgeColor = isOrigin
        ? '#10B981'
        : isDest
        ? '#F59E0B'
        : '#64748B';

      const icon = L.divIcon({
        className: 'bhaktapur-landmark-pin',
        html: `<div style="display:flex;align-items:center;gap:4px;background:rgba(13,11,16,0.9);border:1.5px solid ${badgeColor};color:#F8FAFC;padding:2px 6px;border-radius:6px;font-size:10px;font-weight:600;white-space:nowrap;box-shadow:0 2px 6px rgba(0,0,0,0.5);">
          <span style="width:7px;height:7px;border-radius:9999px;background:${badgeColor};display:inline-block;"></span>
          ${lm.name.split(' (')[0]}
        </div>`,
        iconSize: [110, 22],
        iconAnchor: [55, 11],
      });

      L.marker([lm.coords.lat, lm.coords.lng], { icon })
        .bindPopup(
          `<div style="font-size:12px;color:#111"><strong>${lm.name}</strong><br/><em>${lm.newaName}</em><br/>${lm.description}</div>`
        )
        .addTo(lmGroup);
    });

    if (activeRoute.polyline.length > 1) {
      map.fitBounds(poly.getBounds(), { padding: [24, 24] });
    }
  }, [activeRoute]);

  // Update Runner Live Position on Map
  useEffect(() => {
    const map = mapInstanceRef.current;
    const marker = runnerMarkerRef.current;
    if (!map || !marker) return;

    marker.setLatLng([runnerCoords.lat, runnerCoords.lng]);
    if (!isExpanded) {
      map.panTo([runnerCoords.lat, runnerCoords.lng], { animate: true, duration: 0.25 });
    }
  }, [runnerCoords, runnerBearing, isExpanded]);

  // Invalidate map size when toggling between mini-map and expanded modal
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (routePolylineRef.current && isExpanded) {
        map.fitBounds(routePolylineRef.current.getBounds(), { padding: [36, 36] });
      }
    }, 120);
    return () => clearTimeout(timer);
  }, [isExpanded]);

  const handleExtractLandmarkRoute = async () => {
    if (customOriginId === customDestId) return;
    setIsExtracting(true);
    try {
      const origin =
        BHAKTAPUR_LANDMARKS.find((l) => l.id === customOriginId) ||
        BHAKTAPUR_LANDMARKS[0];
      const dest =
        BHAKTAPUR_LANDMARKS.find((l) => l.id === customDestId) ||
        BHAKTAPUR_LANDMARKS[1];
      const extracted = await extractLiveBhaktapurStreetRoute(origin, dest);
      onSelectRoute(extracted);
    } finally {
      setIsExtracting(false);
    }
  };

  const handleExtractClickedPoints = async () => {
    if (!customStartCoord || !customEndCoord) return;
    setIsExtracting(true);
    try {
      const startLm: BhaktapurLandmark = {
        id: 'custom-start',
        name: 'Custom Street Start',
        newaName: 'Bhaktapur Galli',
        coords: customStartCoord,
        architecture: 'DURBAR_PALACE',
        description: 'Custom starting street point selected on Bhaktapur map.',
        elevationMeters: 1338,
      };
      const endLm: BhaktapurLandmark = {
        id: 'custom-end',
        name: 'Custom Street Finish',
        newaName: 'Heritage Checkpoint',
        coords: customEndCoord,
        architecture: 'NYATAPOLA_PAGODA',
        description: 'Custom destination street point selected on Bhaktapur map.',
        elevationMeters: 1342,
      };
      const extracted = await extractLiveBhaktapurStreetRoute(
        startLm,
        endLm,
        [],
        'Custom Extracted Bhaktapur Street Run'
      );
      onSelectRoute(extracted);
    } finally {
      setIsExtracting(false);
    }
  };

  return (
    <div
      className={
        isExpanded
          ? 'fixed inset-3 sm:inset-6 md:inset-8 z-40 bg-[#0D0B10]/95 border border-stone-700/80 rounded-2xl shadow-2xl flex flex-col lg:flex-row overflow-hidden'
          : 'fixed top-3 right-3 z-30 w-24 h-24 sm:w-64 sm:h-36 bg-[#0D0B10]/90 border-2 border-stone-700/80 rounded-2xl shadow-2xl overflow-hidden cursor-pointer group hover:border-amber-400 transition-all'
      }
      onClick={!isExpanded ? onToggleExpand : undefined}
    >
      {/* Left/Main Map Viewport */}
      <div className={isExpanded ? 'relative flex-1 min-h-[280px]' : 'relative h-full w-full'}>
        <div ref={mapContainerRef} className="w-full h-full" />

        {/* Top Map Expand Button for Small Mobile Corner Map */}
        {!isExpanded && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand();
            }}
            className="absolute top-1.5 right-1.5 z-[400] bg-black/80 hover:bg-black text-amber-400 p-1.5 rounded-full shadow-lg border border-stone-700/80 transition-transform active:scale-90"
            title="Expand Bhaktapur Street Map"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}

        {/* Top Map Header Overlay (Desktop / Expanded view) */}
        {isExpanded && (
          <div className="absolute top-2.5 left-2.5 right-2.5 z-[400] flex items-center justify-between gap-2 pointer-events-none">
            <div className="bg-[#0D0B10]/90 border border-stone-700/80 px-2.5 py-1 rounded-lg text-[11px] font-medium text-stone-200 flex items-center gap-1.5 pointer-events-auto">
              <Compass className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
              <span className="truncate max-w-[145px] sm:max-w-[220px]">
                {activeRoute.name}
              </span>
            </div>

            <button
              type="button"
              onClick={onToggleExpand}
              className="pointer-events-auto bg-[#0D0B10]/90 hover:bg-stone-800 border border-stone-700/80 text-stone-200 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap shrink-0"
              title="Close Map"
            >
              <Minimize2 className="w-3.5 h-3.5 text-amber-400" />
              <span>Close Map</span>
            </button>
          </div>
        )}

        {/* Desktop Mini-Map Header Overlay */}
        {!isExpanded && (
          <div className="hidden sm:flex absolute top-2 left-2 z-[400] items-center gap-1.5 bg-[#0D0B10]/85 border border-stone-700/80 px-2 py-0.5 rounded-md text-[10px] text-stone-200 pointer-events-none max-w-[calc(100%-40px)] truncate">
            <Compass className="w-3 h-3 text-[#06B6D4] shrink-0" />
            <span className="truncate">{activeRoute.name}</span>
          </div>
        )}

        {/* Bottom Live Coordinates Strip on Desktop Mini-Map */}
        {!isExpanded && (
          <div className="hidden sm:flex absolute bottom-0 inset-x-0 z-[400] bg-gradient-to-t from-[#0D0B10] via-[#0D0B10]/85 to-transparent px-2.5 py-1 items-center justify-between text-[10px]">
            <span className="font-mono-tabular text-stone-300">
              {runnerCoords.lat.toFixed(4)}°N, {runnerCoords.lng.toFixed(4)}°E
            </span>
            <span className="text-[#06B6D4] font-medium">
              {activeRoute.segments.length} Segs
            </span>
          </div>
        )}
      </div>

      {/* Right Control Sidebar when Expanded */}
      {isExpanded && (
        <div className="w-full lg:w-[410px] border-t lg:border-t-0 lg:border-l border-stone-800 bg-[#120F16] p-5 overflow-y-auto flex flex-col gap-5">
          <div>
            <h2 className="font-display text-lg font-bold text-stone-100">
              Bhaktapur Street Route Extractor
            </h2>
            <p className="text-xs text-stone-400 mt-0.5">
              Powered by Free OpenStreetMap, OSRM Pedestrian Routing &amp; MapTiler Cloud layers. Extracted streets dynamically generate 3D temples, turns, and landmarks.
            </p>
          </div>

          {/* Map Tile Style Selector */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                Map Tile Provider (100% Free)
              </span>
              <button
                type="button"
                onClick={() => setShowKeyForm(!showKeyForm)}
                className="text-[11px] text-[#06B6D4] hover:underline"
              >
                {mapTilerKey ? 'MapTiler Key Active' : '+ Optional MapTiler Key'}
              </button>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {(
                [
                  { id: 'OSM_HERITAGE', label: 'OSM Bhaktapur Streets' },
                  { id: 'DARK_OBSIDIAN', label: 'Dark Heritage Vector' },
                  { id: 'SATELLITE_AERIAL', label: 'Aerial Satellite' },
                  { id: 'MAPTILER_STREETS', label: 'MapTiler Cloud' },
                ] as { id: MapTileStyle; label: string }[]
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => onChangeTileStyle(t.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium text-left transition-colors border whitespace-nowrap truncate ${
                    tileStyle === t.id
                      ? 'bg-[#D94E28]/20 border-[#D94E28] text-amber-300'
                      : 'bg-stone-900/80 border-stone-800 text-stone-400 hover:text-stone-200'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {showKeyForm && (
              <div className="p-3 rounded-lg bg-stone-900/90 border border-stone-800 space-y-2">
                <label className="block text-[11px] text-stone-300">
                  Optional MapTiler Cloud Free API Key (leave blank to use free OSM/CARTO/Satellite tiles):
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={keyInput}
                    onChange={(e) => setKeyInput(e.target.value)}
                    placeholder="Paste free MapTiler key..."
                    className="flex-1 bg-stone-950 border border-stone-700 rounded-md px-2.5 py-1.5 text-xs text-stone-100 focus:outline-none focus:border-amber-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onSaveMapTilerKey(keyInput);
                      if (keyInput.trim()) onChangeTileStyle('MAPTILER_STREETS');
                      setShowKeyForm(false);
                    }}
                    className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-stone-950 font-semibold text-xs rounded-md whitespace-nowrap shrink-0"
                  >
                    Apply
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Preset Heritage Street Corridors */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
              <RouteIcon className="w-3.5 h-3.5 text-amber-400" />
              Iconic Bhaktapur Street Trails
            </span>
            <div className="space-y-1.5">
              {INITIAL_EXTRACTED_ROUTES.map((preset) => {
                const active = activeRoute.id === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onSelectRoute(preset)}
                    className={`w-full text-left p-2.5 rounded-lg border transition-colors ${
                      active
                        ? 'bg-[#D94E28]/15 border-[#D94E28] text-stone-100'
                        : 'bg-stone-900/60 border-stone-800/90 text-stone-300 hover:bg-stone-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold truncate">
                        {preset.name}
                      </span>
                      <span className="font-mono-tabular text-[11px] text-amber-400 shrink-0">
                        {preset.totalDistanceMeters}m
                      </span>
                    </div>
                    <p className="text-[11px] text-stone-400 mt-0.5 truncate">
                      {preset.subtitle}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Landmark-to-Landmark OSM Street Extractor */}
          <div className="p-3.5 rounded-xl bg-stone-900/75 border border-stone-800 space-y-3">
            <span className="text-xs font-semibold text-stone-200 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#06B6D4]" />
              Live Landmark Street Extraction (OSRM / OSM)
            </span>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">
                  Start Square
                </label>
                <select
                  value={customOriginId}
                  onChange={(e) => setCustomOriginId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                >
                  {BHAKTAPUR_LANDMARKS.map((lm) => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name.split(' (')[0]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[11px] text-stone-400 mb-1">
                  Destination Square
                </label>
                <select
                  value={customDestId}
                  onChange={(e) => setCustomDestId(e.target.value)}
                  className="w-full bg-stone-950 border border-stone-700 rounded-lg px-2 py-1.5 text-xs text-stone-100"
                >
                  {BHAKTAPUR_LANDMARKS.map((lm) => (
                    <option key={lm.id} value={lm.id}>
                      {lm.name.split(' (')[0]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="button"
              disabled={isExtracting || customOriginId === customDestId}
              onClick={handleExtractLandmarkRoute}
              className="w-full py-2 px-4 rounded-lg bg-[#D94E28] hover:bg-[#ea580c] disabled:opacity-40 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-colors whitespace-nowrap"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>
                {isExtracting
                  ? 'Extracting Real Bhaktapur Streets...'
                  : 'Extract Live Street Route & Load 3D Track'}
              </span>
            </button>
          </div>

          {/* Click Custom Start/End Points on Map */}
          <div className="p-3.5 rounded-xl bg-stone-900/50 border border-stone-800/80 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                Pick Any Custom Alley on Map
              </span>
              <button
                type="button"
                onClick={() => {
                  setCustomStartCoord(null);
                  setCustomEndCoord(null);
                  setMapClickMode('START');
                }}
                className="px-2.5 py-1 rounded bg-stone-800 hover:bg-stone-700 text-[11px] text-amber-300 font-medium whitespace-nowrap"
              >
                {mapClickMode === 'START'
                  ? 'Click Start Point on Map...'
                  : mapClickMode === 'END'
                  ? 'Now Click Finish Point...'
                  : 'Pick on Map'}
              </button>
            </div>

            {customStartCoord && customEndCoord && (
              <button
                type="button"
                onClick={handleExtractClickedPoints}
                className="w-full py-1.5 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold"
              >
                Load Custom Map Alley into 3D Runner
              </button>
            )}
          </div>

          {/* Extracted Street Segment Breakdown */}
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-stone-300">
              Extracted 3D Street Segments ({activeRoute.segments.length})
            </span>
            <div className="max-h-36 overflow-y-auto space-y-1 pr-1">
              {activeRoute.segments.map((seg) => (
                <div
                  key={seg.id}
                  className="flex items-center justify-between text-[11px] py-1 px-2 rounded bg-stone-900/60 text-stone-300"
                >
                  <span className="truncate max-w-[210px]">
                    {seg.index + 1}. {seg.streetName}
                  </span>
                  <span className="font-mono-tabular text-stone-400 shrink-0">
                    {seg.distanceMeters}m · {seg.turnDirection}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
