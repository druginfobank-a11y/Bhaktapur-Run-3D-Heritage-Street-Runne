import {
  BhaktapurLandmark,
  DailyMission,
  ExtractedRoute,
  HeritageRelic,
  LatLng,
  RunnerCharacter,
  StreetSegment,
  TurnDirection,
} from '../types/game';

export const BHAKTAPUR_LANDMARKS: BhaktapurLandmark[] = [
  {
    id: 'durbar-square',
    name: 'Bhaktapur Durbar Square',
    newaName: 'Layaku (लयेकू)',
    coords: { lat: 27.67222, lng: 85.42785 },
    architecture: 'DURBAR_PALACE',
    description: 'Royal Malla courtyard featuring the 55-Window Palace (Pachpanna Jhyale Durbar), Golden Gate (Lu Dhowka), and Taleju Bell.',
    elevationMeters: 1341,
  },
  {
    id: 'taumadhi-nyatapola',
    name: 'Taumadhi Square (Nyatapola)',
    newaName: 'Taumadhi Twā (तौमढी त्वाः)',
    coords: { lat: 27.67132, lng: 85.42931 },
    architecture: 'NYATAPOLA_PAGODA',
    description: 'Home to the towering 5-tiered Nyatapola Pagoda (1702 CE) guarded by wrestlers, elephants, lions, griffins, and goddesses, alongside Bhairavnath Temple.',
    elevationMeters: 1336,
  },
  {
    id: 'pottery-square',
    name: 'Pottery Square (Talako)',
    newaName: 'Talāko Twā (तलाको त्वाः)',
    coords: { lat: 27.67008, lng: 85.42718 },
    architecture: 'POTTERY_SQUARE',
    description: 'Open brick courtyard lined with thousands of sun-drying clay pots, traditional spinning wheels, and the solid-stone Jeth गणेश shrine.',
    elevationMeters: 1331,
  },
  {
    id: 'dattatreya-square',
    name: 'Dattatreya Square (Tachupal)',
    newaName: 'Tachupāl Twā (तचुपाल त्वाः)',
    coords: { lat: 27.67335, lng: 85.43528 },
    architecture: 'DATTATREYA_TEMPLE',
    description: 'Bhaktapur’s oldest royal square, renowned for the 15th-century Dattatreya Temple and the world-famous carved wooden Peacock Window (Mhaykha Jhya).',
    elevationMeters: 1348,
  },
  {
    id: 'siddha-pokhari',
    name: 'Siddha Pokhari Royal Pond',
    newaName: 'Taः Pukhu (तः पुखू)',
    coords: { lat: 27.67185, lng: 85.42092 },
    architecture: 'SIDDHA_POKHARI',
    description: 'Vast 15th-century rectangular brick-walled reservoir at the western gateway of Bhaktapur reflecting the snow-capped Langtang Himalayas.',
    elevationMeters: 1338,
  },
  {
    id: 'suryamadhi-tole',
    name: 'Suryamadhi & Wakupani Tole',
    newaName: 'Sūryamādhi (सूर्यमढी)',
    coords: { lat: 27.67295, lng: 85.43835 },
    architecture: 'SURYAMADHI_TOLE',
    description: 'Eastern heritage gateway where the morning sun first illuminates Bhaktapur’s brick-paved processional road and sunken stone water spouts (Hiti).',
    elevationMeters: 1352,
  },
];

export const HERITAGE_RELICS: Record<string, HeritageRelic> = {
  'peacock-window-amulet': {
    id: 'peacock-window-amulet',
    name: 'Gilded Peacock Window Amulet',
    newaName: 'Mhaykha Jhya Relic (म्हायखा झ्याः)',
    description: 'Forged in 15th-century Tachupal, this ancient wood-and-gold amulet depicts the sacred peacock of Dattatreya.',
    perkDescription: '+20% Permanent Base Score Multiplier on all routes',
    iconName: 'PEACOCK_WINDOW',
  },
  'king-curd-chalice': {
    id: 'king-curd-chalice',
    name: 'King Curd Royal Chalice',
    newaName: 'Juju Dhau Beka (जुजू धौ मन्दिर)',
    description: 'A sacred terracotta chalice from Pottery Square blessed by Talako masters.',
    perkDescription: 'Start every run with +40% Surge Meter pre-charged',
    iconName: 'KING_CHALICE',
  },
  'taleju-bell-pendant': {
    id: 'taleju-bell-pendant',
    name: 'Sacred Taleju Bell Pendant',
    newaName: 'Lu Dhowka Bell (तलेजु घण्टा)',
    description: 'Cast from the bronze curfew bell of King Bhupatindra Malla in Layaku Durbar Square.',
    perkDescription: '+3.5 seconds extended Garuda Shield duration',
    iconName: 'TALEJU_BELL',
  },
  'bhupatindra-scroll': {
    id: 'bhupatindra-scroll',
    name: 'King Bhupatindra Royal Scroll',
    newaName: 'Malla Royal Decree (मल्ल लालमोहर)',
    description: 'An ancient royal decree granting passage across all 24 traditional neighborhood Toles of Bhaktapur.',
    perkDescription: 'Unlocks +1.5x Malla Coin value on all daily missions',
    iconName: 'MALLA_SCROLL',
  },
};

export const DAILY_MISSIONS: DailyMission[] = [
  {
    id: 'daily-nyatapola-dattatreya',
    title: 'The Grand Procession: Nyatapola → Dattatreya Square',
    description: 'Run from the 5-tiered Nyatapola Pagoda in Taumadhi Square along Sukuldhoka Bazaar to the Peacock Window in Dattatreya Square.',
    routeId: 'grand-pagoda-axis',
    targetDistanceMeters: 750,
    targetJujuDhau: 2,
    rewardCoins: 350,
    rewardRelic: HERITAGE_RELICS['peacock-window-amulet'],
  },
  {
    id: 'daily-pottery-siddha',
    title: 'Artisan Circuit: Royal Durbar → Pottery Square',
    description: 'Sprint from Layaku Palace through Nasamana Tole down into the open clay drying yards of Talako Pottery Square.',
    routeId: 'royal-nyatapola-pottery',
    targetDistanceMeters: 550,
    targetJujuDhau: 1,
    rewardCoins: 250,
    rewardRelic: HERITAGE_RELICS['king-curd-chalice'],
  },
  {
    id: 'daily-kingdom-circuit',
    title: 'Full Kingdom Traverse: Siddha Pokhari → Suryamadhi Gate',
    description: 'Complete the full west-to-east kingdom sprint across Siddha Pokhari, Pottery Square, Durbar Square, Taumadhi, and Tachupal.',
    routeId: 'full-bhaktapur-traverse',
    targetDistanceMeters: 1200,
    targetJujuDhau: 3,
    rewardCoins: 600,
    rewardRelic: HERITAGE_RELICS['taleju-bell-pendant'],
  },
];

export const RUNNERS: RunnerCharacter[] = [
  {
    id: 'explorer',
    name: 'Aarav Shrestha',
    title: 'Newa Heritage Runner',
    description: 'Agile parkour runner wearing a traditional Dhaka Topi and crimson waistcoat, trained on the steep steps of Nyatapola.',
    cost: 0,
    primaryColor: 0xd94e28, // Terracotta Vermilion
    secondaryColor: 0x1f242d, // Slate Tunic
    accentColor: 0xf59e0b, // Temple Gold
    headgear: 'DHAKA_TOPI',
    perkLabel: 'Balanced Agility · Standard Surge',
    speedBonus: 1.0,
    coinMultiplier: 1,
  },
  {
    id: 'artisan',
    name: 'Mayju Prajapati',
    title: 'Talako Master Potter',
    description: 'Dressed in traditional black-and-crimson Haku Patasi, she glides effortlessly past clay stalls and brick trenches.',
    cost: 150,
    primaryColor: 0x18181b, // Haku Patasi Black
    secondaryColor: 0xb91c1c, // Crimson Border
    accentColor: 0xd97706, // Fired Terracotta Gold
    headgear: 'ARTISAN_WRAP',
    perkLabel: '+25% Juju Dhau Surge Charge · +1.2x Score',
    speedBonus: 1.05,
    coinMultiplier: 1,
  },
  {
    id: 'lakhey',
    name: 'Majipa Lakhey',
    title: 'Sacred Festival Guardian',
    description: 'Adorned in a fierce crimson-and-gold Lakhey mask with flowing yak-hair mane and thundering bronze ankle bells.',
    cost: 350,
    primaryColor: 0xdc2626, // Ritual Scarlet
    secondaryColor: 0x7c2d12, // Deep Ochre
    accentColor: 0xfbbf24, // Gilded Brass
    headgear: 'LAKHEY_MASK',
    perkLabel: '2x Malla Coin Value · Longer Garuda Shield',
    speedBonus: 1.1,
    coinMultiplier: 2,
  },
  {
    id: 'courier',
    name: 'Bhupatindra Envoy',
    title: 'Royal Malla Messenger',
    description: 'Clad in hammered brass shoulder guards and peacock-turquoise silk, sprinting between Durbar Square and Tachupal.',
    cost: 600,
    primaryColor: 0x0891b2, // Peacock Turquoise
    secondaryColor: 0x451a03, // Dark Sal Timber
    accentColor: 0xfcd34d, // Royal Gold
    headgear: 'MALLA_HELM',
    perkLabel: '2x Malla Coin Value · +15% Sprint Speed',
    speedBonus: 1.15,
    coinMultiplier: 2,
  },
];

// Geodesic helpers for turning raw polyline coordinates into 3D runner segments
export function haversineDistanceMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function computeBearingDeg(a: LatLng, b: LatLng): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const toDeg = (rad: number) => (rad * 180) / Math.PI;
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const dLng = toRad(b.lng - a.lng);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

export function normalizeAngleDelta(prevBearing: number, nextBearing: number): number {
  let diff = ((nextBearing - prevBearing + 540) % 360) - 180;
  return diff;
}

const BHAKTAPUR_STREET_NAMES = [
  'Layaku Durbar Marg',
  'Taumadhi Brick Galli',
  'Talako Pottery Alley',
  'Sukuldhoka Heritage Bazaar',
  'Golmadhi Tole Marg',
  'Inacho Brick Corridor',
  'Tachupal Peacock Lane',
  'Bhelukhel Chariot Path',
  'Nasamana Courtyard',
  'Itachhen Heritage Street',
];

export function inferBhaktapurStreetName(coord: LatLng, index: number): string {
  // Match real Bhaktapur neighborhoods by longitude/latitude zones
  if (coord.lng < 85.4245) return 'Siddha Pokhari — Itachhen Marg';
  if (coord.lng < 85.4275 && coord.lat < 27.6708) return 'Talako Pottery Square Galli';
  if (coord.lng < 85.4285 && coord.lat >= 27.6716) return 'Layaku Royal Durbar Marg';
  if (coord.lng < 85.4302 && coord.lat < 27.6719) return 'Taumadhi Nyatapola Bazaar';
  if (coord.lng < 85.4325) return 'Sukuldhoka — Golmadhi Heritage Street';
  if (coord.lng < 85.4342) return 'Inacho Brick Processional Alley';
  if (coord.lng < 85.4365) return 'Tachupal Dattatreya Square Marg';
  return BHAKTAPUR_STREET_NAMES[index % BHAKTAPUR_STREET_NAMES.length];
}

export function buildSegmentsFromPolyline(
  polyline: LatLng[],
  landmarks: BhaktapurLandmark[],
  stepNameOverrides?: string[]
): { segments: StreetSegment[]; totalDistanceMeters: number } {
  if (polyline.length < 2) {
    return { segments: [], totalDistanceMeters: 0 };
  }

  // Simplify/consolidate very tiny sub-5m points so each 3D segment represents a meaningful street block (35m - 95m)
  const simplified: LatLng[] = [polyline[0]];
  for (let i = 1; i < polyline.length; i++) {
    const prev = simplified[simplified.length - 1];
    const dist = haversineDistanceMeters(prev, polyline[i]);
    if (dist >= 28 || i === polyline.length - 1) {
      simplified.push(polyline[i]);
    }
  }

  const segments: StreetSegment[] = [];
  let cumulative = 0;
  let prevBearing = computeBearingDeg(simplified[0], simplified[1]);

  for (let i = 0; i < simplified.length - 1; i++) {
    const startCoord = simplified[i];
    const endCoord = simplified[i + 1];
    // Scale game meters slightly so a 600m real walk feels like a thrilling 900m 3D parkour sprint
    const rawDist = Math.max(35, haversineDistanceMeters(startCoord, endCoord));
    const distanceMeters = Math.round(rawDist * 1.35);
    const bearingDeg = computeBearingDeg(startCoord, endCoord);
    const angleDelta = i === 0 ? 0 : normalizeAngleDelta(prevBearing, bearingDeg);

    let turnDirection: TurnDirection = 'STRAIGHT';
    if (angleDelta <= -26) {
      turnDirection = 'LEFT';
    } else if (angleDelta >= 26) {
      turnDirection = 'RIGHT';
    }

    // Check if endCoord is near one of the Bhaktapur landmarks
    let landmarkReached: BhaktapurLandmark | undefined;
    for (const lm of landmarks) {
      if (haversineDistanceMeters(endCoord, lm.coords) < 65) {
        landmarkReached = lm;
        break;
      }
    }

    const streetName =
      stepNameOverrides?.[i] ||
      (landmarkReached
        ? `${landmarkReached.name} (${landmarkReached.newaName})`
        : inferBhaktapurStreetName(startCoord, i));

    segments.push({
      id: `seg-${i}`,
      index: i,
      startCoord,
      endCoord,
      distanceMeters,
      cumulativeStartMeters: cumulative,
      cumulativeEndMeters: cumulative + distanceMeters,
      bearingDeg,
      turnDirection,
      turnAngleDeg: Math.round(angleDelta),
      streetName,
      landmarkReached,
    });

    cumulative += distanceMeters;
    prevBearing = bearingDeg;
  }

  return { segments, totalDistanceMeters: cumulative };
}

export function interpolatePositionAlongRoute(
  route: ExtractedRoute,
  distanceMeters: number
): {
  coord: LatLng;
  bearing: number;
  segment: StreetSegment;
  upcomingTurn: { direction: TurnDirection; inMeters: number; streetName: string } | null;
  nextLandmarkName: string;
  distanceToNextLandmark: number;
} {
  const { segments, totalDistanceMeters } = route;
  if (segments.length === 0) {
    return {
      coord: route.origin.coords,
      bearing: 90,
      segment: {
        id: 'fallback',
        index: 0,
        startCoord: route.origin.coords,
        endCoord: route.destination.coords,
        distanceMeters: 500,
        cumulativeStartMeters: 0,
        cumulativeEndMeters: 500,
        bearingDeg: 90,
        turnDirection: 'STRAIGHT',
        turnAngleDeg: 0,
        streetName: 'Layaku Royal Durbar Marg',
      },
      upcomingTurn: null,
      nextLandmarkName: route.destination.name,
      distanceToNextLandmark: 500,
    };
  }

  // Loop smoothly in Endless mode or clamp in Landmark Route mode
  const wrappedDist =
    totalDistanceMeters > 0 ? distanceMeters % totalDistanceMeters : 0;

  let activeSeg = segments[segments.length - 1];
  for (const seg of segments) {
    if (
      wrappedDist >= seg.cumulativeStartMeters &&
      wrappedDist <= seg.cumulativeEndMeters
    ) {
      activeSeg = seg;
      break;
    }
  }

  const segProgress = Math.max(
    0,
    Math.min(
      1,
      (wrappedDist - activeSeg.cumulativeStartMeters) /
        Math.max(1, activeSeg.distanceMeters)
    )
  );

  const coord: LatLng = {
    lat:
      activeSeg.startCoord.lat +
      (activeSeg.endCoord.lat - activeSeg.startCoord.lat) * segProgress,
    lng:
      activeSeg.startCoord.lng +
      (activeSeg.endCoord.lng - activeSeg.startCoord.lng) * segProgress,
  };

  // Find next turn within 140m
  let upcomingTurn: {
    direction: TurnDirection;
    inMeters: number;
    streetName: string;
  } | null = null;
  for (let i = activeSeg.index + 1; i < segments.length; i++) {
    const candidate = segments[i];
    if (candidate.turnDirection !== 'STRAIGHT') {
      const distToTurn = Math.round(candidate.cumulativeStartMeters - wrappedDist);
      if (distToTurn > 0 && distToTurn <= 160) {
        upcomingTurn = {
          direction: candidate.turnDirection,
          inMeters: distToTurn,
          streetName: candidate.streetName,
        };
      }
      break;
    }
  }

  // Find next landmark ahead
  let nextLandmarkName = route.destination.name;
  let distanceToNextLandmark = Math.max(0, Math.round(totalDistanceMeters - wrappedDist));
  for (let i = activeSeg.index; i < segments.length; i++) {
    const candidate = segments[i];
    if (candidate.landmarkReached) {
      nextLandmarkName = candidate.landmarkReached.name;
      distanceToNextLandmark = Math.max(
        0,
        Math.round(candidate.cumulativeEndMeters - wrappedDist)
      );
      break;
    }
  }

  return {
    coord,
    bearing: activeSeg.bearingDeg,
    segment: activeSeg,
    upcomingTurn,
    nextLandmarkName,
    distanceToNextLandmark,
  };
}

// High-precision real-world Bhaktapur heritage trail definitions
const PRESET_TRAIL_COORDS: Record<
  string,
  {
    id: string;
    name: string;
    subtitle: string;
    originId: string;
    destinationId: string;
    waypointIds: string[];
    polyline: LatLng[];
  }
> = {
  'royal-nyatapola-pottery': {
    id: 'royal-nyatapola-pottery',
    name: 'Royal Durbar → Nyatapola → Pottery Square',
    subtitle: 'Heart of Bhaktapur: 55-Window Palace to 5-Tiered Pagoda & Clay Artisans',
    originId: 'durbar-square',
    destinationId: 'pottery-square',
    waypointIds: ['taumadhi-nyatapola'],
    polyline: [
      { lat: 27.67222, lng: 85.42785 }, // Durbar Square East Gate
      { lat: 27.67205, lng: 85.42838 }, // Layaku Marg
      { lat: 27.67178, lng: 85.42882 }, // Turn South toward Taumadhi
      { lat: 27.67132, lng: 85.42931 }, // Taumadhi Square (Nyatapola Temple)
      { lat: 27.67092, lng: 85.42895 }, // Southwest Taumadhi Alley
      { lat: 27.67058, lng: 85.42832 }, // Nasamana Tole Junction
      { lat: 27.67028, lng: 85.42775 }, // Talako Brick Approach
      { lat: 27.67008, lng: 85.42718 }, // Pottery Square (Talako)
    ],
  },
  'grand-pagoda-axis': {
    id: 'grand-pagoda-axis',
    name: 'Grand Heritage Axis: Durbar → Taumadhi → Dattatreya',
    subtitle: 'Ancient Bisket Jatra Processional Route along Sukuldhoka & Tachupal',
    originId: 'durbar-square',
    destinationId: 'dattatreya-square',
    waypointIds: ['taumadhi-nyatapola'],
    polyline: [
      { lat: 27.67222, lng: 85.42785 }, // Bhaktapur Durbar Square
      { lat: 27.67182, lng: 85.42865 }, // Layaku to Taumadhi Connector
      { lat: 27.67132, lng: 85.42931 }, // Taumadhi Square (Nyatapola)
      { lat: 27.67154, lng: 85.43018 }, // Sukuldhoka Bazaar West
      { lat: 27.67188, lng: 85.43125 }, // Sukuldhoka Main Brick Street
      { lat: 27.67221, lng: 85.43235 }, // Golmadhi Tole Courtyard
      { lat: 27.67268, lng: 85.43342 }, // Inacho Galli Turn
      { lat: 27.67305, lng: 85.43438 }, // Tachupal West Approach
      { lat: 27.67335, lng: 85.43528 }, // Dattatreya Square (Peacock Window)
    ],
  },
  'full-bhaktapur-traverse': {
    id: 'full-bhaktapur-traverse',
    name: 'Full Kingdom Traverse: Siddha Pokhari → Suryamadhi',
    subtitle: 'Complete West-to-East Sprint Across Every Historic Square of Bhaktapur',
    originId: 'siddha-pokhari',
    destinationId: 'suryamadhi-tole',
    waypointIds: ['pottery-square', 'durbar-square', 'taumadhi-nyatapola', 'dattatreya-square'],
    polyline: [
      { lat: 27.67185, lng: 85.42092 }, // Siddha Pokhari
      { lat: 27.67162, lng: 85.42265 }, // Tepucho - Itachhen Gate
      { lat: 27.67135, lng: 85.42448 }, // Bharvaccho Brick Road
      { lat: 27.67065, lng: 85.42595 }, // Approach to Talako
      { lat: 27.67008, lng: 85.42718 }, // Pottery Square
      { lat: 27.67115, lng: 85.42752 }, // Climb to Royal Layaku
      { lat: 27.67222, lng: 85.42785 }, // Bhaktapur Durbar Square
      { lat: 27.67132, lng: 85.42931 }, // Taumadhi Square (Nyatapola)
      { lat: 27.67205, lng: 85.43185 }, // Sukuldhoka - Golmadhi
      { lat: 27.67335, lng: 85.43528 }, // Dattatreya Square
      { lat: 27.67312, lng: 85.43688 }, // Wakupani Hiti Lane
      { lat: 27.67295, lng: 85.43835 }, // Suryamadhi Eastern Square
    ],
  },
};

export const INITIAL_EXTRACTED_ROUTES: ExtractedRoute[] = Object.values(
  PRESET_TRAIL_COORDS
).map((preset) => {
  const origin =
    BHAKTAPUR_LANDMARKS.find((l) => l.id === preset.originId) ||
    BHAKTAPUR_LANDMARKS[0];
  const destination =
    BHAKTAPUR_LANDMARKS.find((l) => l.id === preset.destinationId) ||
    BHAKTAPUR_LANDMARKS[1];
  const waypoints = preset.waypointIds
    .map((id) => BHAKTAPUR_LANDMARKS.find((l) => l.id === id))
    .filter((l): l is BhaktapurLandmark => Boolean(l));

  const { segments, totalDistanceMeters } = buildSegmentsFromPolyline(
    preset.polyline,
    BHAKTAPUR_LANDMARKS
  );

  return {
    id: preset.id,
    name: preset.name,
    subtitle: preset.subtitle,
    origin,
    destination,
    waypoints,
    polyline: preset.polyline,
    segments,
    totalDistanceMeters,
    source: 'HERITAGE_PRESET',
  };
});

/**
 * Live Free OpenStreetMap / OSRM Foot Route Extractor for Bhaktapur Streets.
 * Extracts real walking street geometry, turn bearings, and street names between any
 * two or more coordinates in Bhaktapur without requiring a paid Google Cloud key.
 */
export async function extractLiveBhaktapurStreetRoute(
  origin: BhaktapurLandmark,
  destination: BhaktapurLandmark,
  waypoints: BhaktapurLandmark[] = [],
  customName?: string
): Promise<ExtractedRoute> {
  const allStops = [origin, ...waypoints, destination];
  const coordString = allStops
    .map((stop) => `${stop.coords.lng.toFixed(5)},${stop.coords.lat.toFixed(5)}`)
    .join(';');

  try {
    const url = `https://router.project-osrm.org/route/v1/foot/${coordString}?overview=full&geometries=geojson&steps=true`;
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`OSRM status ${response.status}`);
    }
    const data = await response.json();
    const routeObj = data?.routes?.[0];
    const rawCoords: [number, number][] | undefined =
      routeObj?.geometry?.coordinates;

    if (rawCoords && rawCoords.length >= 2) {
      const polyline: LatLng[] = rawCoords.map(([lng, lat]) => ({ lat, lng }));

      // Extract real street names from OSRM steps when available
      const stepNames: string[] = [];
      if (Array.isArray(routeObj.legs)) {
        for (const leg of routeObj.legs) {
          if (Array.isArray(leg.steps)) {
            for (const step of leg.steps) {
              if (step.name && typeof step.name === 'string' && step.name.trim().length > 1) {
                stepNames.push(step.name.trim());
              }
            }
          }
        }
      }

      const { segments, totalDistanceMeters } = buildSegmentsFromPolyline(
        polyline,
        BHAKTAPUR_LANDMARKS,
        stepNames.length > 0 ? stepNames : undefined
      );

      return {
        id: `live-${origin.id}-${destination.id}-${Date.now()}`,
        name: customName || `${origin.name} → ${destination.name}`,
        subtitle: `Live Extracted OpenStreetMap Foot Route · ${segments.length} Street Segments`,
        origin,
        destination,
        waypoints,
        polyline,
        segments,
        totalDistanceMeters,
        source: 'LIVE_OSM_OSRM',
      };
    }
  } catch {
    // Graceful fallback to interpolated heritage corridor if offline
  }

  // Fallback high-precision interpolation through Bhaktapur street grid
  const fallbackPolyline: LatLng[] = [];
  for (let i = 0; i < allStops.length - 1; i++) {
    const a = allStops[i].coords;
    const b = allStops[i + 1].coords;
    const steps = 6;
    for (let s = 0; s < steps; s++) {
      const t = s / steps;
      // Add slight authentic street-grid jogs
      const jog = s > 0 && s < steps ? (s % 2 === 0 ? 0.00018 : -0.00014) : 0;
      fallbackPolyline.push({
        lat: a.lat + (b.lat - a.lat) * t + jog,
        lng: a.lng + (b.lng - a.lng) * t,
      });
    }
  }
  fallbackPolyline.push(destination.coords);

  const { segments, totalDistanceMeters } = buildSegmentsFromPolyline(
    fallbackPolyline,
    BHAKTAPUR_LANDMARKS
  );

  return {
    id: `custom-${origin.id}-${destination.id}`,
    name: customName || `${origin.name} → ${destination.name}`,
    subtitle: `Bhaktapur Brick Street Corridor · ${segments.length} Street Segments`,
    origin,
    destination,
    waypoints,
    polyline: fallbackPolyline,
    segments,
    totalDistanceMeters,
    source: 'HERITAGE_PRESET',
  };
}
