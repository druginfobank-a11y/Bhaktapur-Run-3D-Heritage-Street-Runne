export interface LatLng {
  lat: number;
  lng: number;
}

export type LandmarkArchitectureType =
  | 'DURBAR_PALACE'
  | 'NYATAPOLA_PAGODA'
  | 'POTTERY_SQUARE'
  | 'DATTATREYA_TEMPLE'
  | 'SIDDHA_POKHARI'
  | 'SURYAMADHI_TOLE';

export interface BhaktapurLandmark {
  id: string;
  name: string;
  newaName: string;
  coords: LatLng;
  architecture: LandmarkArchitectureType;
  description: string;
  elevationMeters: number;
}

export type TurnDirection = 'STRAIGHT' | 'LEFT' | 'RIGHT';

export interface StreetSegment {
  id: string;
  index: number;
  startCoord: LatLng;
  endCoord: LatLng;
  distanceMeters: number;
  cumulativeStartMeters: number;
  cumulativeEndMeters: number;
  bearingDeg: number;
  turnDirection: TurnDirection;
  turnAngleDeg: number;
  streetName: string;
  landmarkReached?: BhaktapurLandmark;
}

export interface ExtractedRoute {
  id: string;
  name: string;
  subtitle: string;
  origin: BhaktapurLandmark;
  destination: BhaktapurLandmark;
  waypoints: BhaktapurLandmark[];
  polyline: LatLng[];
  segments: StreetSegment[];
  totalDistanceMeters: number;
  source: 'LIVE_OSM_OSRM' | 'MAPTILER_CLOUD' | 'HERITAGE_PRESET';
}

export type GameMode = 'ENDLESS' | 'LANDMARK_ROUTE';
export type GameStatus = 'MENU' | 'RUNNING' | 'PAUSED' | 'GAME_OVER' | 'VICTORY';

export type ObstacleType =
  | 'CHARIOT'          // Rolling Bisket Jatra wooden chariot wheel/frame
  | 'HANGING_BELLS'    // Low hanging bronze temple bells (Slide under)
  | 'LOW_ROOF'         // Carved Newa wooden Jhya arch lintel (Slide under)
  | 'POTTERY_STALL'    // Clay pots & spinning wheel table (Jump or Dodge)
  | 'TEMPLE_GUARDIAN'  // Stone Singha guardian lion statue (Dodge or Jump)
  | 'FIRE_TRAP'        // Classic Temple Run oil fire brazier (Jump over)
  | 'ALLEY_GAP';       // Broken brick alley trench over Hiti water channel (Jump over)

export type CollectibleType =
  | 'MALLA_COIN'       // Ancient Newa gold/copper coin
  | 'JUJU_DHAU'        // King Curd clay bowl (+Multiplier & Surge meter)
  | 'SUKUNDA_LAMP';    // Sacred brass oil lamp (Triggers Magnet + Shield power-up)

export type RunnerId = 'explorer' | 'artisan' | 'lakhey' | 'courier';

export interface RunnerCharacter {
  id: RunnerId;
  name: string;
  title: string;
  description: string;
  cost: number;
  primaryColor: number;
  secondaryColor: number;
  accentColor: number;
  headgear: 'DHAKA_TOPI' | 'ARTISAN_WRAP' | 'LAKHEY_MASK' | 'MALLA_HELM';
  perkLabel: string;
  speedBonus: number;
  coinMultiplier: number;
}

export type PowerUpType = 'MAGNET' | 'SHIELD' | 'SURGE';

export interface HeritageRelic {
  id: string;
  name: string;
  newaName: string;
  description: string;
  perkDescription: string;
  iconName: 'PEACOCK_WINDOW' | 'TALEJU_BELL' | 'KING_CHALICE' | 'MALLA_SCROLL';
}

export interface DailyMission {
  id: string;
  title: string;
  description: string;
  routeId: string;
  targetDistanceMeters: number;
  targetJujuDhau: number;
  rewardCoins: number;
  rewardRelic: HeritageRelic;
}

export interface PlayerProfile {
  totalCoins: number;
  highScore: number;
  longestDistanceMeters: number;
  unlockedRunners: RunnerId[];
  selectedRunner: RunnerId;
  completedRouteIds: string[];
  upgrades: {
    magnetLevel: number;
    shieldLevel: number;
    surgeLevel: number;
  };
  dailyMissionsCompleted: string[];
  earnedRelics: string[];
  lastDailyResetDate: string;
  mapTilerKey?: string;
}

export type LightingPreset = 'GOLDEN_HOUR' | 'BISKET_TORCHLIGHT' | 'HIMALAYAN_DAWN';
export type CameraPreset = 'CHASE_DYNAMIC' | 'HIGH_PAGODA' | 'CLOSE_ACTION' | 'DRONE_AERIAL';
export type MapTileStyle = 'OSM_HERITAGE' | 'DARK_OBSIDIAN' | 'SATELLITE_AERIAL' | 'MAPTILER_STREETS';

export interface LiveTelemetry {
  score: number;
  coins: number;
  jujuDhauCount: number;
  multiplier: number;
  distanceMeters: number;
  speedMps: number;
  currentStreetName: string;
  nextLandmarkName: string;
  distanceToNextLandmark: number;
  currentCoords: LatLng;
  currentBearing: number;
  upcomingTurn: {
    direction: TurnDirection;
    inMeters: number;
    streetName: string;
  } | null;
  activePowerUps: {
    magnetRemaining: number;
    shieldRemaining: number;
    surgeRemaining: number;
  };
  surgeCharge: number; // 0 to 100
  guardianProximity: number; // 0 (far) to 1 (right behind player after stumble)
  monsterState: 'STALKING' | 'FRENZY_HUNT' | 'LUNGING' | 'REPELLED';
  stumbleWarning: string | null;
}
