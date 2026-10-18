import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  CameraPreset,
  ExtractedRoute,
  GameMode,
  GameStatus,
  LightingPreset,
  LiveTelemetry,
  MapTileStyle,
  PlayerProfile,
  RunnerId,
} from './types/game';
import {
  DAILY_MISSIONS,
  INITIAL_EXTRACTED_ROUTES,
  RUNNERS,
} from './data/bhaktapurData';
import { BhaktapurRunCanvas } from './components/BhaktapurRunCanvas';
import { BhaktapurStreetMap } from './components/BhaktapurStreetMap';
import { RunnerSanctumModal } from './components/RunnerSanctumModal';
import { DailyMissionsModal } from './components/DailyMissionsModal';
import { soundEngine } from './audio/soundEngine';
import {
  Award,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Camera,
  ChevronDown,
  ChevronUp,
  Coins,
  Compass,
  Flame,
  Map,
  Pause,
  Play,
  RotateCcw,
  Shield,
  Sun,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Zap,
} from 'lucide-react';

const PROFILE_STORAGE_KEY = 'bhaktapur_run_profile_v1';

const DEFAULT_PROFILE: PlayerProfile = {
  totalCoins: 250,
  highScore: 0,
  longestDistanceMeters: 0,
  unlockedRunners: ['explorer'],
  selectedRunner: 'explorer',
  completedRouteIds: [],
  upgrades: {
    magnetLevel: 1,
    shieldLevel: 1,
    surgeLevel: 1,
  },
  dailyMissionsCompleted: [],
  earnedRelics: [],
  lastDailyResetDate: new Date().toISOString().split('T')[0],
  mapTilerKey: '',
};

function loadProfile(): PlayerProfile {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_PROFILE;
    return { ...DEFAULT_PROFILE, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PROFILE;
  }
}

export default function App() {
  const [profile, setProfile] = useState<PlayerProfile>(loadProfile);
  const [status, setStatus] = useState<GameStatus>('MENU');
  const [mode, setMode] = useState<GameMode>('LANDMARK_ROUTE');
  const [activeRoute, setActiveRoute] = useState<ExtractedRoute>(
    INITIAL_EXTRACTED_ROUTES[0]
  );
  const [lightingPreset, setLightingPreset] =
    useState<LightingPreset>('GOLDEN_HOUR');
  const [cameraPreset, setCameraPreset] =
    useState<CameraPreset>('CHASE_DYNAMIC');
  const [tileStyle, setTileStyle] = useState<MapTileStyle>('OSM_HERITAGE');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [isMapExpanded, setIsMapExpanded] = useState<boolean>(false);
  const [isSanctumOpen, setIsSanctumOpen] = useState<boolean>(false);
  const [isMissionsOpen, setIsMissionsOpen] = useState<boolean>(false);
  const [isDockCollapsed, setIsDockCollapsed] = useState<boolean>(false);

  const [lastRunResult, setLastRunResult] = useState<{
    victory: boolean;
    score: number;
    coinsEarned: number;
    distanceMeters: number;
    jujuDhauCollected: number;
    reason: string;
  } | null>(null);

  const [telemetry, setTelemetry] = useState<LiveTelemetry>({
    score: 0,
    coins: 0,
    jujuDhauCount: 0,
    multiplier: 1,
    distanceMeters: 0,
    speedMps: 15.5,
    currentStreetName: INITIAL_EXTRACTED_ROUTES[0].segments[0]?.streetName || 'Layaku Royal Durbar Marg',
    nextLandmarkName: INITIAL_EXTRACTED_ROUTES[0].destination.name,
    distanceToNextLandmark: INITIAL_EXTRACTED_ROUTES[0].totalDistanceMeters,
    currentCoords: INITIAL_EXTRACTED_ROUTES[0].origin.coords,
    currentBearing: 90,
    upcomingTurn: null,
    activePowerUps: {
      magnetRemaining: 0,
      shieldRemaining: 0,
      surgeRemaining: 0,
    },
    surgeCharge: 35,
    guardianProximity: 0.68,
    monsterState: 'LUNGING',
    stumbleWarning: null,
  });

  const actionTriggerRef = useRef<{
    moveLeft: () => void;
    moveRight: () => void;
    jump: () => void;
    slide: () => void;
    activateSurge: () => void;
  } | null>(null);

  // Persist profile changes
  useEffect(() => {
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      // Ignore storage quota errors
    }
  }, [profile]);

  // Keyboard shortcut 'H' for collapsing/expanding the bottom HUD dock (Zen/Cinema Mode)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }
      if (e.code === 'KeyH') {
        setIsDockCollapsed((prev) => !prev);
      } else if (e.code === 'Escape' && status === 'RUNNING') {
        setStatus('PAUSED');
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [status]);

  const handleRunEnd = useCallback(
    (result: {
      victory: boolean;
      score: number;
      coinsEarned: number;
      distanceMeters: number;
      jujuDhauCollected: number;
      reason: string;
    }) => {
      setStatus(result.victory ? 'VICTORY' : 'GAME_OVER');
      setLastRunResult(result);

      // Check if run completed any active Daily Mission
      let coinsMultiplier = 1.0;
      if (profile.earnedRelics.includes('bhupatindra-scroll')) {
        coinsMultiplier = 1.5;
      }
      const finalCoinsEarned = Math.round(result.coinsEarned * coinsMultiplier);

      const newlyCompletedMissionIds: string[] = [];
      const newRelicsToUnlock: string[] = [];

      DAILY_MISSIONS.forEach((mission) => {
        if (!profile.dailyMissionsCompleted.includes(mission.id)) {
          if (
            activeRoute.id === mission.routeId &&
            result.distanceMeters >= mission.targetDistanceMeters &&
            result.jujuDhauCollected >= mission.targetJujuDhau
          ) {
            newlyCompletedMissionIds.push(mission.id);
            if (!profile.earnedRelics.includes(mission.rewardRelic.id)) {
              newRelicsToUnlock.push(mission.rewardRelic.id);
            }
          }
        }
      });

      if (newRelicsToUnlock.length > 0) {
        soundEngine.playJujuDhau();
      }

      setProfile((prev) => ({
        ...prev,
        totalCoins: prev.totalCoins + finalCoinsEarned,
        highScore: Math.max(prev.highScore, result.score),
        longestDistanceMeters: Math.max(
          prev.longestDistanceMeters,
          result.distanceMeters
        ),
        completedRouteIds:
          result.victory && !prev.completedRouteIds.includes(activeRoute.id)
            ? [...prev.completedRouteIds, activeRoute.id]
            : prev.completedRouteIds,
        dailyMissionsCompleted: Array.from(
          new Set([...prev.dailyMissionsCompleted, ...newlyCompletedMissionIds])
        ),
        earnedRelics: Array.from(
          new Set([...prev.earnedRelics, ...newRelicsToUnlock])
        ),
      }));
    },
    [activeRoute.id, profile.dailyMissionsCompleted, profile.earnedRelics]
  );

  const handleSelectOrUnlockRunner = (runnerId: RunnerId) => {
    const runner = RUNNERS.find((r) => r.id === runnerId);
    if (!runner) return;

    if (profile.unlockedRunners.includes(runnerId)) {
      setProfile((prev) => ({ ...prev, selectedRunner: runnerId }));
      soundEngine.playTempleBell();
    } else if (profile.totalCoins >= runner.cost) {
      setProfile((prev) => ({
        ...prev,
        totalCoins: prev.totalCoins - runner.cost,
        unlockedRunners: [...prev.unlockedRunners, runnerId],
        selectedRunner: runnerId,
      }));
      soundEngine.playTempleBell();
    }
  };

  const handleUpgradeRelic = (
    relic: 'magnetLevel' | 'shieldLevel' | 'surgeLevel'
  ) => {
    const baseCost =
      relic === 'magnetLevel' ? 80 : relic === 'shieldLevel' ? 100 : 120;
    const currentLvl = profile.upgrades[relic];
    if (currentLvl >= 5) return;
    const cost = baseCost * currentLvl;
    if (profile.totalCoins < cost) return;

    setProfile((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins - cost,
      upgrades: {
        ...prev.upgrades,
        [relic]: currentLvl + 1,
      },
    }));
    soundEngine.playJujuDhau();
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    soundEngine.enabled = next;
  };

  const startRun = () => {
    setIsMapExpanded(false);
    setIsSanctumOpen(false);
    setIsMissionsOpen(false);
    setIsDockCollapsed(true);
    setLastRunResult(null);
    soundEngine.playTempleBell();
    setStatus('RUNNING');
  };

  const currentRunner =
    RUNNERS.find((r) => r.id === profile.selectedRunner) || RUNNERS[0];

  const routeProgressPct =
    mode === 'LANDMARK_ROUTE' && activeRoute.totalDistanceMeters > 0
      ? Math.min(
          100,
          Math.round(
            (telemetry.distanceMeters / activeRoute.totalDistanceMeters) * 100
          )
        )
      : 0;

  return (
    <div className="relative w-screen h-screen overflow-hidden select-none bg-[#0D0B10]">
      {/* 1. Full-Viewport 3D Three.js WebGL Game Engine */}
      <BhaktapurRunCanvas
        status={status}
        mode={mode}
        route={activeRoute}
        profile={profile}
        lightingPreset={lightingPreset}
        cameraPreset={cameraPreset}
        onTelemetryUpdate={setTelemetry}
        onRunEnd={handleRunEnd}
        actionTriggerRef={actionTriggerRef}
      />

      {/* 2. Top-Left Telemetry & Mobile Compact Bar */}
      {/* Mobile Ultra-Compact Top Bar (RUNNING State) */}
      {status === 'RUNNING' && (
        <div className="sm:hidden fixed top-3 left-3 z-20 flex items-center gap-1.5 pointer-events-auto">
          <div className="bg-[#0D0B10]/85 backdrop-blur-md border border-stone-700/80 rounded-full px-3 py-1 text-xs text-stone-200 shadow-xl flex items-center gap-2 font-mono-tabular">
            <span className="font-arcade text-amber-400 font-bold text-sm">
              {telemetry.score.toLocaleString()}
            </span>
            <span className="text-stone-600">|</span>
            <span className="flex items-center gap-1 text-amber-300 font-semibold">
              <Coins className="w-3.5 h-3.5 text-amber-400" />
              {telemetry.coins}
            </span>
            <span className="text-stone-600">|</span>
            <span className="text-stone-300 font-medium">
              🚩 {telemetry.distanceMeters}m
            </span>
          </div>

          <button
            type="button"
            onClick={() => actionTriggerRef.current?.activateSurge()}
            disabled={telemetry.surgeCharge < 100}
            className={`px-2.5 py-1 rounded-full border text-[11px] font-bold flex items-center gap-1 shadow-md transition-all font-mono-tabular ${
              telemetry.surgeCharge >= 100
                ? 'bg-amber-500 border-amber-300 text-stone-950 animate-bounce'
                : 'bg-[#0D0B10]/85 border-stone-700/80 text-amber-400'
            }`}
          >
            <Zap className="w-3 h-3 text-amber-400 fill-current" />
            <span>{telemetry.surgeCharge >= 100 ? 'SURGE!' : `${telemetry.surgeCharge}%`}</span>
          </button>

          <button
            type="button"
            onClick={() => setStatus('PAUSED')}
            className="bg-[#0D0B10]/85 hover:bg-stone-800 border border-stone-700 text-stone-200 p-1.5 rounded-full shadow-lg transition-colors"
            aria-label="Pause Game"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Desktop / Non-Mobile Full Header Card */}
      <div className="hidden sm:flex fixed top-4 left-4 z-20 flex-col gap-2 max-w-md pointer-events-none">
        {/* Brand & Active Street Header */}
        <div className="bg-[#0D0B10]/90 border border-stone-700/80 rounded-xl px-4 py-2.5 shadow-xl pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="font-display text-sm sm:text-base font-bold tracking-wide text-stone-100 whitespace-nowrap">
                BHAKTAPUR RUN
              </h1>
              <div className="flex items-center gap-1.5 text-[11px] text-stone-400 mt-0.5">
                <Compass className="w-3.5 h-3.5 text-[#06B6D4] shrink-0" />
                <span className="truncate max-w-[180px] sm:max-w-[260px] text-stone-200 font-medium">
                  {telemetry.currentStreetName}
                </span>
              </div>
            </div>

            <div className="text-right shrink-0">
              <div className="font-arcade text-xl sm:text-2xl font-bold text-amber-400 font-mono-tabular leading-none">
                {telemetry.score.toLocaleString()}
              </div>
              <div className="text-[11px] text-stone-400 font-mono-tabular mt-0.5">
                {telemetry.multiplier}x Multiplier · {telemetry.distanceMeters}m
              </div>
            </div>
          </div>

          {/* Landmark Route Progress Bar */}
          {mode === 'LANDMARK_ROUTE' && (
            <div className="mt-2.5 pt-2 border-t border-stone-800/90 space-y-1">
              <div className="flex items-center justify-between text-[11px] text-stone-300">
                <span className="truncate">
                  Goal: {activeRoute.destination.name.split(' (')[0]}
                </span>
                <span className="font-mono-tabular text-[#06B6D4] shrink-0">
                  {telemetry.distanceToNextLandmark}m left ({routeProgressPct}%)
                </span>
              </div>
              <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#D94E28] via-amber-400 to-[#06B6D4] transition-all duration-150"
                  style={{ width: `${routeProgressPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Singha-Rakshasa & Gurumapa Monster Pursuit Threat Meter */}
          <div className="mt-2 pt-2 border-t border-stone-800/90 space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-stone-300 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-red-500 shrink-0" />
                <span>Singha-Rakshasa Demon Pack</span>
              </span>
              <span
                className={`font-mono-tabular font-semibold ${
                  telemetry.monsterState === 'LUNGING' ||
                  telemetry.monsterState === 'FRENZY_HUNT'
                    ? 'text-red-400'
                    : telemetry.monsterState === 'REPELLED'
                    ? 'text-emerald-400'
                    : 'text-amber-400'
                }`}
              >
                {telemetry.monsterState === 'LUNGING'
                  ? 'JAWS AT YOUR NECK!'
                  : telemetry.monsterState === 'FRENZY_HUNT'
                  ? 'BLOOD MOON FRENZY'
                  : telemetry.monsterState === 'REPELLED'
                  ? 'REPELLED BY SURGE'
                  : 'STALKING BEHIND'}
              </span>
            </div>
            <div className="w-full h-1.5 bg-stone-800 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-150 ${
                  telemetry.guardianProximity > 0.65
                    ? 'bg-gradient-to-r from-amber-500 to-red-600'
                    : 'bg-gradient-to-r from-emerald-500 to-amber-500'
                }`}
                style={{
                  width: `${Math.min(
                    100,
                    Math.max(8, Math.round(telemetry.guardianProximity * 100))
                  )}%`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Live Coins, Juju Dhau Surge Meter & Active Power-ups Strip */}
        <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
          <div className="bg-[#0D0B10]/90 border border-stone-700/80 rounded-lg px-3 py-1.5 flex items-center gap-3 text-xs font-mono-tabular">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Coins className="w-3.5 h-3.5" />
              {status === 'RUNNING' ? telemetry.coins : profile.totalCoins}
            </span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-200">
              Juju Dhau: {telemetry.jujuDhauCount}
            </span>
            <span className="text-stone-600">·</span>
            <span className="text-stone-400">{telemetry.speedMps} m/s</span>
          </div>

          {/* Surge Ready / Charge Button */}
          <button
            type="button"
            onClick={() => actionTriggerRef.current?.activateSurge()}
            disabled={status !== 'RUNNING' || telemetry.surgeCharge < 100}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 transition-colors font-mono-tabular whitespace-nowrap ${
              telemetry.surgeCharge >= 100
                ? 'bg-amber-500 border-amber-300 text-stone-950 shadow-lg'
                : 'bg-[#0D0B10]/90 border-stone-700/80 text-stone-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {telemetry.surgeCharge >= 100
                ? 'SURGE READY (Press E)'
                : `Surge ${telemetry.surgeCharge}%`}
            </span>
          </button>

          {telemetry.activePowerUps.shieldRemaining > 0 && (
            <div className="bg-[#0D0B10]/90 border border-[#06B6D4] rounded-lg px-2.5 py-1 text-xs text-[#06B6D4] font-mono-tabular flex items-center gap-1">
              <Shield className="w-3.5 h-3.5" />
              <span>Shield {telemetry.activePowerUps.shieldRemaining}s</span>
            </div>
          )}

          {telemetry.activePowerUps.magnetRemaining > 0 && (
            <div className="bg-[#0D0B10]/90 border border-amber-500 rounded-lg px-2.5 py-1 text-xs text-amber-400 font-mono-tabular flex items-center gap-1">
              <Flame className="w-3.5 h-3.5" />
              <span>Sukunda {telemetry.activePowerUps.magnetRemaining}s</span>
            </div>
          )}
        </div>

      </div>

      {/* Floating Center Warning Banners for Mobile & Desktop */}
      {status === 'RUNNING' && telemetry.stumbleWarning && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-30 bg-red-950/90 backdrop-blur-md border border-red-500/80 rounded-full px-4 py-1.5 text-xs text-red-200 font-semibold shadow-2xl animate-pulse text-center whitespace-nowrap truncate max-w-[92vw] pointer-events-none">
          ⚠️ {telemetry.stumbleWarning}
        </div>
      )}

      {status === 'RUNNING' && telemetry.upcomingTurn && !telemetry.stumbleWarning && (
        <div className="fixed top-14 left-1/2 -translate-x-1/2 z-20 bg-[#0D0B10]/85 backdrop-blur-md border border-amber-500/80 rounded-full px-3.5 py-1 text-xs text-amber-200 flex items-center gap-1.5 shadow-xl pointer-events-none">
          {telemetry.upcomingTurn.direction === 'LEFT' ? (
            <ArrowLeft className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          ) : (
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          )}
          <span>
            Turn <strong>{telemetry.upcomingTurn.direction}</strong> in{' '}
            <strong className="font-mono-tabular">{telemetry.upcomingTurn.inMeters}m</strong> onto {telemetry.upcomingTurn.streetName}
          </span>
        </div>
      )}

      {/* 3. Top-Right Live Interactive Bhaktapur Map & Street Extractor */}
      <BhaktapurStreetMap
        activeRoute={activeRoute}
        runnerCoords={telemetry.currentCoords}
        runnerBearing={telemetry.currentBearing}
        tileStyle={tileStyle}
        mapTilerKey={profile.mapTilerKey}
        onSelectRoute={(route) => {
          setActiveRoute(route);
          setIsMapExpanded(false);
        }}
        onChangeTileStyle={setTileStyle}
        onSaveMapTilerKey={(k) =>
          setProfile((prev) => ({ ...prev, mapTilerKey: k }))
        }
        isExpanded={isMapExpanded}
        onToggleExpand={() => setIsMapExpanded((prev) => !prev)}
      />

      {/* 4. Center Hero Brief Banner (Shown ONLY in MENU state, keeping 3D temple view visible) */}
      {status === 'MENU' && !isMapExpanded && !isSanctumOpen && (
        <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 w-[min(560px,92vw)] bg-[#0D0B10]/90 border border-stone-700/80 rounded-2xl p-6 shadow-2xl text-center">
          <p className="text-xs font-medium tracking-widest text-amber-400">
            NEWA HERITAGE 3D STREET RUNNER · BHAKTAPUR, NEPAL
          </p>
          <h2
            className="font-display text-2xl sm:text-3xl font-bold text-stone-100 mt-1"
            style={{ textWrap: 'balance' }}
          >
            Sprint the Brick Streets of Ancient Bhaktapur
          </h2>
          <p className="text-xs sm:text-sm text-stone-300 mt-2 leading-relaxed">
            Dodge rolling <strong>Bisket Jatra chariots</strong>, slide beneath{' '}
            <strong>hanging bronze temple bells</strong> and carved{' '}
            <em>Jhya</em> roofs, leap over <strong>Pottery Square clay stalls</strong>{' '}
            and <strong>fire braziers</strong>, and outrun the stone{' '}
            <strong>Singha Temple Guardian</strong> along real extracted street routes.
          </p>

          {/* Active Route & Runner Summary Line */}
          <div className="mt-4 pt-3 border-t border-stone-800 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-stone-300">
            <span>
              Route: <strong className="text-[#06B6D4]">{activeRoute.name}</strong>
            </span>
            <span>·</span>
            <span className="font-mono-tabular">
              {activeRoute.totalDistanceMeters}m ({activeRoute.segments.length} Street Segments)
            </span>
            <span>·</span>
            <span>
              Runner: <strong className="text-amber-400">{currentRunner.name}</strong>
            </span>
          </div>

          {/* Primary Launch Controls */}
          <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={startRun}
              className="px-6 py-2.5 rounded-xl bg-[#D94E28] hover:bg-[#ea580c] text-white font-bold text-sm flex items-center gap-2 shadow-lg transition-colors whitespace-nowrap"
            >
              <Play className="w-4 h-4 fill-current" />
              <span>Start 3D Street Run</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMissionsOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-amber-500/20 border border-amber-500/60 hover:bg-amber-500/30 text-amber-300 font-bold text-xs flex items-center gap-2 transition-colors whitespace-nowrap"
            >
              <Award className="w-4 h-4 text-amber-400" />
              <span>Daily Missions ({profile.earnedRelics.length}/4 Relics)</span>
            </button>

            <button
              type="button"
              onClick={() => setIsMapExpanded(true)}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs flex items-center gap-2 border border-stone-700 transition-colors whitespace-nowrap"
            >
              <Map className="w-4 h-4 text-[#06B6D4]" />
              <span>Extract Map Streets</span>
            </button>

            <button
              type="button"
              onClick={() => setIsSanctumOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs flex items-center gap-2 border border-stone-700 transition-colors whitespace-nowrap"
            >
              <Users className="w-4 h-4 text-amber-400" />
              <span>Runners</span>
            </button>
          </div>

          <div className="mt-4 text-[11px] text-stone-400">
            Controls: <span className="text-stone-200 font-mono-tabular">A / D</span> or{' '}
            <span className="text-stone-200 font-mono-tabular">← / →</span> Switch Lanes ·{' '}
            <span className="text-stone-200 font-mono-tabular">W / ↑ / Space</span> Jump ·{' '}
            <span className="text-stone-200 font-mono-tabular">S / ↓</span> Slide ·{' '}
            <span className="text-stone-200 font-mono-tabular">E</span> Juju Dhau Surge
          </div>
        </div>
      )}

      {/* 5. On-Screen Touch D-Pad Controls For Mobile Smartphones & Tablets */}
      {status === 'RUNNING' && (
        <div className="fixed bottom-3 sm:bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-1.5 pointer-events-auto opacity-90 hover:opacity-100 transition-opacity">
          {/* Top Jump & Surge Row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                actionTriggerRef.current?.jump();
              }}
              onClick={() => actionTriggerRef.current?.jump()}
              className="px-4 py-2.5 rounded-xl bg-[#0D0B10]/90 hover:bg-stone-800 border border-amber-500/60 text-amber-400 font-bold text-xs flex items-center gap-1.5 shadow-xl active:scale-95 transition-transform"
              aria-label="Jump (Swipe Up)"
            >
              <ArrowUp className="w-4 h-4" />
              <span>JUMP</span>
            </button>

            {telemetry.surgeCharge >= 100 && (
              <button
                type="button"
                onTouchStart={(e) => {
                  e.preventDefault();
                  actionTriggerRef.current?.activateSurge();
                }}
                onClick={() => actionTriggerRef.current?.activateSurge()}
                className="px-4 py-2.5 rounded-xl bg-amber-500 text-stone-950 font-extrabold text-xs flex items-center gap-1.5 shadow-xl active:scale-95 transition-transform animate-bounce"
                aria-label="Activate Surge"
              >
                <Zap className="w-4 h-4 fill-current" />
                <span>SURGE!</span>
              </button>
            )}
          </div>

          {/* Left - Slide - Right Row */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                actionTriggerRef.current?.moveLeft();
              }}
              onClick={() => actionTriggerRef.current?.moveLeft()}
              className="w-14 h-12 rounded-xl bg-[#0D0B10]/90 hover:bg-stone-800 border border-stone-700 text-stone-100 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-xl"
              aria-label="Move Left"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>LEFT</span>
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                actionTriggerRef.current?.slide();
              }}
              onClick={() => actionTriggerRef.current?.slide()}
              className="px-4 py-2.5 rounded-xl bg-[#0D0B10]/90 hover:bg-stone-800 border border-[#06B6D4]/60 text-[#06B6D4] font-bold text-xs flex items-center gap-1.5 shadow-xl active:scale-95 transition-transform"
              aria-label="Slide (Swipe Down)"
            >
              <ArrowDown className="w-4 h-4" />
              <span>SLIDE</span>
            </button>

            <button
              type="button"
              onTouchStart={(e) => {
                e.preventDefault();
                actionTriggerRef.current?.moveRight();
              }}
              onClick={() => actionTriggerRef.current?.moveRight()}
              className="w-14 h-12 rounded-xl bg-[#0D0B10]/90 hover:bg-stone-800 border border-stone-700 text-stone-100 font-bold text-xs flex items-center justify-center gap-1 active:scale-95 transition-transform shadow-xl"
              aria-label="Move Right"
            >
              <span>RIGHT</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 6. Pause Modal */}
      {status === 'PAUSED' && (
        <div className="fixed inset-0 z-40 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-[#120F16] border border-stone-700 rounded-2xl p-6 max-w-sm w-full text-center space-y-4">
            <h3 className="font-display text-xl font-bold text-stone-100">
              Run Paused
            </h3>
            <p className="text-xs text-stone-400">
              Current Street: {telemetry.currentStreetName}
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setStatus('RUNNING')}
                className="w-full py-2.5 px-4 rounded-xl bg-[#D94E28] hover:bg-[#ea580c] text-white font-semibold text-xs"
              >
                Resume Sprint
              </button>
              <button
                type="button"
                onClick={startRun}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs"
              >
                Restart Street Route
              </button>
              <button
                type="button"
                onClick={() => setStatus('MENU')}
                className="w-full py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-400 font-semibold text-xs"
              >
                Return to Courtyard Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 7. Run Complete / Game Over Summary Modal */}
      {(status === 'GAME_OVER' || status === 'VICTORY') && lastRunResult && (
        <div className="fixed inset-0 z-40 bg-black/75 flex items-center justify-center p-4">
          <div className="bg-[#120F16] border border-stone-700 rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-amber-500/15 border border-amber-500/40 text-amber-400 mx-auto">
              <Trophy className="w-6 h-6" />
            </div>

            <div>
              <p className="text-xs font-semibold text-amber-400">
                {lastRunResult.victory
                  ? 'HERITAGE LANDMARK ROUTE COMPLETED'
                  : 'PURSUED BY THE TEMPLE GUARDIAN'}
              </p>
              <h3 className="font-display text-2xl font-bold text-stone-100 mt-1">
                {lastRunResult.victory
                  ? 'Victory in Bhaktapur!'
                  : 'Run Ended in the Alley'}
              </h3>
              <p className="text-xs text-stone-300 mt-1">
                {lastRunResult.reason}
              </p>
            </div>

            <div className="grid grid-cols-3 gap-2 py-3 border-y border-stone-800 font-mono-tabular">
              <div>
                <div className="text-[11px] text-stone-400">Final Score</div>
                <div className="text-base font-bold text-stone-100">
                  {lastRunResult.score.toLocaleString()}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-400">Malla Coins</div>
                <div className="text-base font-bold text-amber-400">
                  +{lastRunResult.coinsEarned}
                </div>
              </div>
              <div>
                <div className="text-[11px] text-stone-400">Street Distance</div>
                <div className="text-base font-bold text-[#06B6D4]">
                  {lastRunResult.distanceMeters}m
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
              <button
                type="button"
                onClick={startRun}
                className="flex-1 py-2.5 px-4 rounded-xl bg-[#D94E28] hover:bg-[#ea580c] text-white font-bold text-xs flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Run Again</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setStatus('MENU');
                  setIsSanctumOpen(true);
                }}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-amber-300 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap"
              >
                <Users className="w-4 h-4" />
                <span>Sanctum Shop</span>
              </button>

              <button
                type="button"
                onClick={() => setStatus('MENU')}
                className="py-2.5 px-4 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 font-semibold text-xs whitespace-nowrap"
              >
                Lobby
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Runner Sanctum & Upgrades Modal */}
      <RunnerSanctumModal
        isOpen={isSanctumOpen}
        onClose={() => setIsSanctumOpen(false)}
        profile={profile}
        onSelectOrUnlockRunner={handleSelectOrUnlockRunner}
        onUpgradeRelic={handleUpgradeRelic}
      />

      {/* 9. Daily Missions & Heritage Relic Vault Modal */}
      <DailyMissionsModal
        isOpen={isMissionsOpen}
        onClose={() => setIsMissionsOpen(false)}
        profile={profile}
        activeRoute={activeRoute}
        onSelectRoute={setActiveRoute}
        onStartMissionRun={(targetRoute) => {
          setActiveRoute(targetRoute);
          startRun();
        }}
      />

      {/* 9. Unified Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30 w-[min(940px,95vw)] flex flex-col items-center pointer-events-none">
        {/* Collapse / Expand Cinema Mode Toggle Tab */}
        <button
          type="button"
          onClick={() => setIsDockCollapsed((prev) => !prev)}
          className="pointer-events-auto mb-1.5 px-3 py-1 rounded-full bg-[#0D0B10]/90 border border-stone-700/80 text-[11px] font-medium text-stone-300 hover:text-white flex items-center gap-1 shadow-md transition-colors"
        >
          {isDockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5 text-amber-400" />
              <span>Show Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5 text-amber-400" />
              <span>Hide HUD · Cinema Mode (H)</span>
            </>
          )}
        </button>

        {!isDockCollapsed && (
          <div className="pointer-events-auto w-full bg-[#0D0B10]/95 border border-stone-700/90 rounded-2xl px-4 py-2.5 shadow-2xl flex flex-wrap items-center justify-between gap-3">
            {/* Game Mode Segmented Control */}
            <div className="flex items-center gap-1 p-1 bg-stone-900 rounded-xl border border-stone-800">
              <button
                type="button"
                onClick={() => setMode('LANDMARK_ROUTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'LANDMARK_ROUTE'
                    ? 'bg-[#D94E28] text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Landmark Route
              </button>
              <button
                type="button"
                onClick={() => setMode('ENDLESS')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                  mode === 'ENDLESS'
                    ? 'bg-[#D94E28] text-white'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                Endless Heritage
              </button>
            </div>

            {/* Quick Street Trail Switcher */}
            <div className="flex items-center gap-2">
              <select
                aria-label="Select Bhaktapur Street Route"
                value={activeRoute.id}
                onChange={(e) => {
                  const found = INITIAL_EXTRACTED_ROUTES.find(
                    (r) => r.id === e.target.value
                  );
                  if (found) setActiveRoute(found);
                }}
                className="bg-stone-900 border border-stone-700 rounded-xl px-3 py-1.5 text-xs text-stone-200 max-w-[210px] truncate"
              >
                {INITIAL_EXTRACTED_ROUTES.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.totalDistanceMeters}m)
                  </option>
                ))}
                {!INITIAL_EXTRACTED_ROUTES.some(
                  (r) => r.id === activeRoute.id
                ) && (
                  <option value={activeRoute.id}>
                    {activeRoute.name} ({activeRoute.totalDistanceMeters}m)
                  </option>
                )}
              </select>

              <button
                type="button"
                onClick={() => setIsMapExpanded(true)}
                className="px-3 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs font-medium text-[#06B6D4] flex items-center gap-1.5 transition-colors whitespace-nowrap shrink-0"
              >
                <Map className="w-3.5 h-3.5" />
                <span>Extract Streets</span>
              </button>
            </div>

            {/* Environment Lighting, Camera & Sanctum Controls */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setLightingPreset((prev) =>
                    prev === 'GOLDEN_HOUR'
                      ? 'BISKET_TORCHLIGHT'
                      : prev === 'BISKET_TORCHLIGHT'
                      ? 'HIMALAYAN_DAWN'
                      : 'GOLDEN_HOUR'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title="Cycle Time of Day Lighting"
              >
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">
                  {lightingPreset === 'GOLDEN_HOUR'
                    ? 'Golden Hour'
                    : lightingPreset === 'BISKET_TORCHLIGHT'
                    ? 'Bisket Night'
                    : 'Himalayan Dawn'}
                </span>
              </button>

              <button
                type="button"
                onClick={() =>
                  setCameraPreset((prev) =>
                    prev === 'CHASE_DYNAMIC'
                      ? 'DRONE_AERIAL'
                      : prev === 'DRONE_AERIAL'
                      ? 'HIGH_PAGODA'
                      : prev === 'HIGH_PAGODA'
                      ? 'CLOSE_ACTION'
                      : 'CHASE_DYNAMIC'
                  )
                }
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-stone-200 flex items-center gap-1.5 transition-colors whitespace-nowrap"
                title="Switch 3D Camera Angle"
              >
                <Camera className="w-3.5 h-3.5 text-[#06B6D4]" />
                <span className="hidden sm:inline">
                  {cameraPreset === 'DRONE_AERIAL'
                    ? 'Drone View 🚁'
                    : cameraPreset === 'CHASE_DYNAMIC'
                    ? 'Chase Cam'
                    : cameraPreset === 'HIGH_PAGODA'
                    ? 'Pagoda Cam'
                    : 'Action Cam'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setIsSanctumOpen(true)}
                className="px-2.5 py-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-xs text-amber-300 font-medium flex items-center gap-1.5 transition-colors whitespace-nowrap"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Runners</span>
              </button>

              <button
                type="button"
                onClick={toggleSound}
                className="p-1.5 rounded-xl bg-stone-900 hover:bg-stone-800 border border-stone-700 text-stone-300"
                aria-label="Toggle Sound"
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-amber-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-stone-500" />
                )}
              </button>
            </div>

            {/* Primary Play / Pause CTA */}
            <div>
              {status === 'RUNNING' ? (
                <button
                  type="button"
                  onClick={() => setStatus('PAUSED')}
                  className="px-4 py-1.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-100 font-semibold text-xs flex items-center gap-1.5 whitespace-nowrap"
                >
                  <Pause className="w-3.5 h-3.5" />
                  <span>Pause</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={startRun}
                  className="px-4 py-1.5 rounded-xl bg-[#D94E28] hover:bg-[#ea580c] text-white font-bold text-xs flex items-center gap-1.5 shadow-md whitespace-nowrap"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Run Now</span>
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
