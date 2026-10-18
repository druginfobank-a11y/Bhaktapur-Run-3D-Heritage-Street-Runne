import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  CameraPreset,
  CollectibleType,
  ExtractedRoute,
  GameMode,
  GameStatus,
  LightingPreset,
  LiveTelemetry,
  ObstacleType,
  PlayerProfile,
  RunnerCharacter,
} from '../types/game';
import {
  ArticulatedRunnerRig,
  ChaserPackRig,
  createCollectibleMesh,
  createGuardianChaserModel,
  createLandmarkSpecificBuilding,
  createObstacleMesh,
  createProceduralTextures,
  createRunnerModel,
  createWeatheredBrickStreetMaterial,
  CreatureSkeletalState,
  updateCreatureSkeletalAnimation,
} from '../three/proceduralAssets';
import {
  interpolatePositionAlongRoute,
  RUNNERS,
} from '../data/bhaktapurData';
import { soundEngine } from '../audio/soundEngine';

// Pre-allocated math helpers at module scope (Zero GC in render loop)
const _camTargetPos = new THREE.Vector3();
const _camLookAt = new THREE.Vector3();
const _coinWorldPos = new THREE.Vector3();

const LANE_WIDTH = 2.4;
const TRACK_CHUNK_LENGTH = 24;
const NUM_TRACK_CHUNKS = 8;

interface ActiveObstacle {
  id: number;
  type: ObstacleType;
  lane: -1 | 0 | 1;
  z: number;
  mesh: THREE.Group;
  hit: boolean;
  requiresSlide: boolean;
  requiresJump: boolean;
}

interface ActiveCollectible {
  id: number;
  type: CollectibleType;
  lane: -1 | 0 | 1;
  y: number;
  z: number;
  mesh: THREE.Group;
  collected: boolean;
}

interface TrackChunk {
  group: THREE.Group;
  z: number;
  archBanner: THREE.Group;
}

interface BhaktapurRunCanvasProps {
  status: GameStatus;
  mode: GameMode;
  route: ExtractedRoute;
  profile: PlayerProfile;
  lightingPreset: LightingPreset;
  cameraPreset: CameraPreset;
  onTelemetryUpdate: (telemetry: LiveTelemetry) => void;
  onRunEnd: (result: {
    victory: boolean;
    score: number;
    coinsEarned: number;
    distanceMeters: number;
    jujuDhauCollected: number;
    reason: string;
  }) => void;
  actionTriggerRef: React.MutableRefObject<{
    moveLeft: () => void;
    moveRight: () => void;
    jump: () => void;
    slide: () => void;
    activateSurge: () => void;
  } | null>;
}

const LIGHTING_CONFIGS: Record<
  LightingPreset,
  {
    bgHex: number;
    fogHex: number;
    fogDensity: number;
    sunHex: number;
    sunIntensity: number;
    hemiSkyHex: number;
    hemiGroundHex: number;
    hemiIntensity: number;
  }
> = {
  GOLDEN_HOUR: {
    bgHex: 0x1c1218,
    fogHex: 0x26161c,
    fogDensity: 0.011,
    sunHex: 0xffd28a,
    sunIntensity: 2.3,
    hemiSkyHex: 0x93c5fd,
    hemiGroundHex: 0x7c2d12,
    hemiIntensity: 0.85,
  },
  BISKET_TORCHLIGHT: {
    bgHex: 0x09080f,
    fogHex: 0x0e0b16,
    fogDensity: 0.013,
    sunHex: 0xf97316,
    sunIntensity: 1.8,
    hemiSkyHex: 0x312e81,
    hemiGroundHex: 0x7c2d12,
    hemiIntensity: 0.65,
  },
  HIMALAYAN_DAWN: {
    bgHex: 0x16202a,
    fogHex: 0x1e293b,
    fogDensity: 0.01,
    sunHex: 0xfef3c7,
    sunIntensity: 2.1,
    hemiSkyHex: 0x7dd3fc,
    hemiGroundHex: 0x652b19,
    hemiIntensity: 0.95,
  },
};

const OBSTACLE_POOL_TYPES: ObstacleType[] = [
  'CHARIOT',
  'HANGING_BELLS',
  'LOW_ROOF',
  'POTTERY_STALL',
  'TEMPLE_GUARDIAN',
  'FIRE_TRAP',
  'ALLEY_GAP',
];

export const BhaktapurRunCanvas: React.FC<BhaktapurRunCanvasProps> = ({
  status,
  mode,
  route,
  profile,
  lightingPreset,
  cameraPreset,
  onTelemetryUpdate,
  onRunEnd,
  actionTriggerRef,
}) => {
  const canvasMountRef = useRef<HTMLDivElement | null>(null);

  // Store latest React props in refs so the 60FPS WebGL loop never tears down
  const statusRef = useRef(status);
  statusRef.current = status;
  const modeRef = useRef(mode);
  modeRef.current = mode;
  const routeRef = useRef(route);
  routeRef.current = route;
  const profileRef = useRef(profile);
  profileRef.current = profile;
  const lightingRef = useRef(lightingPreset);
  lightingRef.current = lightingPreset;
  const cameraPresetRef = useRef(cameraPreset);
  cameraPresetRef.current = cameraPreset;
  const onTelemetryRef = useRef(onTelemetryUpdate);
  onTelemetryRef.current = onTelemetryUpdate;
  const onRunEndRef = useRef(onRunEnd);
  onRunEndRef.current = onRunEnd;

  useEffect(() => {
    const container = canvasMountRef.current;
    if (!container) return;

    const isHeadless =
      navigator.webdriver || /HeadlessChrome/i.test(navigator.userAgent);

    const scene = new THREE.Scene();
    const initialLightCfg = LIGHTING_CONFIGS[lightingRef.current];
    scene.background = new THREE.Color(initialLightCfg.bgHex);
    scene.fog = new THREE.FogExp2(
      initialLightCfg.fogHex,
      initialLightCfg.fogDensity
    );

    const camera = new THREE.PerspectiveCamera(
      62,
      container.clientWidth / Math.max(1, container.clientHeight),
      0.1,
      190
    );
    camera.position.set(0, 4.2, 7.2);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isHeadless,
      powerPreference: 'high-performance',
    });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.12;
    renderer.setPixelRatio(
      isHeadless ? 1 : Math.min(window.devicePixelRatio, 2)
    );
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.shadowMap.enabled = !isHeadless;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    // Studio Environment Reflection (RoomEnvironment + PMREMGenerator)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    scene.environment = envTarget.texture;
    pmremGenerator.dispose();

    // 3-Point Studio & Outdoor Heritage Lighting Rig
    const hemiLight = new THREE.HemisphereLight(
      initialLightCfg.hemiSkyHex,
      initialLightCfg.hemiGroundHex,
      initialLightCfg.hemiIntensity
    );
    hemiLight.position.set(0, 40, 0);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(
      initialLightCfg.sunHex,
      initialLightCfg.sunIntensity
    );
    keyLight.position.set(18, 32, 16);
    keyLight.castShadow = !isHeadless;
    const d = 18;
    keyLight.shadow.camera.left = -d;
    keyLight.shadow.camera.right = d;
    keyLight.shadow.camera.top = d;
    keyLight.shadow.camera.bottom = -d;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 80;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight(0x38bdf8, 0.75);
    rimLight.position.set(-14, 15, -24);
    scene.add(rimLight);

    // Procedural Textures
    const textures = createProceduralTextures(renderer);

    // Distant Himalayan Silhouette Horizon Backdrop
    const mountainGroup = new THREE.Group();
    const mountainMat = new THREE.MeshStandardMaterial({
      color: 0x334155,
      roughness: 0.85,
      metalness: 0.1,
    });
    const snowCapMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      emissive: 0x94a3b8,
      emissiveIntensity: 0.2,
      roughness: 0.4,
    });
    for (let m = -3; m <= 3; m++) {
      const h = 28 + ((m * 17) % 10);
      const peak = new THREE.Mesh(
        new THREE.ConeGeometry(22, h, 5),
        mountainMat
      );
      peak.position.set(m * 24, h / 2 - 4, -135);
      const cap = new THREE.Mesh(
        new THREE.ConeGeometry(8.5, h * 0.34, 5),
        snowCapMat
      );
      cap.position.set(m * 24, h - h * 0.17 - 3.8, -134.8);
      mountainGroup.add(peak, cap);
    }
    scene.add(mountainGroup);

    // Shader-based Weathered Brick Street Material (Moss, Cracks & Uneven Paver Height)
    const routeSeed = (routeRef.current.totalDistanceMeters % 97) * 0.13 + 1.25;
    const roadMat = createWeatheredBrickStreetMaterial(textures.brickRoad, routeSeed);
    const curbMat = new THREE.MeshStandardMaterial({
      map: textures.brickWall,
      roughness: 0.75,
      metalness: 0.1,
    });
    const woodMat = new THREE.MeshStandardMaterial({
      map: textures.carvedWood,
      roughness: 0.6,
      metalness: 0.15,
    });
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      roughness: 0.25,
      metalness: 0.88,
    });

    const trackChunks: TrackChunk[] = [];
    for (let i = 0; i < NUM_TRACK_CHUNKS; i++) {
      const chunkGroup = new THREE.Group();
      const zPos = -i * TRACK_CHUNK_LENGTH;
      chunkGroup.position.z = zPos;

      // Brick Street Deck
      const roadMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(8.2, TRACK_CHUNK_LENGTH),
        roadMat
      );
      roadMesh.rotation.x = -Math.PI / 2;
      roadMesh.receiveShadow = true;
      chunkGroup.add(roadMesh);

      // Raised Terracotta Sidewalk Curbs (Pati / Plinths)
      const leftCurb = new THREE.Mesh(
        new THREE.BoxGeometry(4.5, 0.45, TRACK_CHUNK_LENGTH),
        curbMat
      );
      leftCurb.position.set(-6.35, 0.22, 0);
      leftCurb.receiveShadow = true;
      const rightCurb = leftCurb.clone();
      rightCurb.position.x = 6.35;
      chunkGroup.add(leftCurb, rightCurb);

      // Extended Ground Apron so outdoor horizon is never floating in a void
      const outerGround = new THREE.Mesh(
        new THREE.PlaneGeometry(90, TRACK_CHUNK_LENGTH),
        new THREE.MeshStandardMaterial({
          color: 0x29150e,
          roughness: 0.9,
        })
      );
      outerGround.rotation.x = -Math.PI / 2;
      outerGround.position.y = -0.05;
      chunkGroup.add(outerGround);

      // Flanking Landmark Architecture adapted to active neighborhood
      const currentStreet = routeRef.current.segments[i % routeRef.current.segments.length]?.streetName || '';
      let landmarkType: '55_WINDOW_PALACE' | 'NYATAPOLA_PAGODA' | 'DATTATREYA_TEMPLE' | 'POTTERY_YARD' | 'SIDDHA_POKHARI' | 'NEWA_BAZAAR_HOUSE' = 'NEWA_BAZAAR_HOUSE';

      if (currentStreet.includes('Layaku') || currentStreet.includes('Durbar')) {
        landmarkType = i % 2 === 0 ? '55_WINDOW_PALACE' : 'NEWA_BAZAAR_HOUSE';
      } else if (currentStreet.includes('Taumadhi') || currentStreet.includes('Nyatapola')) {
        landmarkType = i % 2 === 0 ? 'NYATAPOLA_PAGODA' : 'NEWA_BAZAAR_HOUSE';
      } else if (currentStreet.includes('Pottery') || currentStreet.includes('Talako')) {
        landmarkType = i % 2 === 0 ? 'POTTERY_YARD' : 'NEWA_BAZAAR_HOUSE';
      } else if (currentStreet.includes('Tachupal') || currentStreet.includes('Dattatreya')) {
        landmarkType = i % 2 === 0 ? 'DATTATREYA_TEMPLE' : 'NEWA_BAZAAR_HOUSE';
      } else if (currentStreet.includes('Siddha') || currentStreet.includes('Pokhari')) {
        landmarkType = i % 2 === 0 ? 'SIDDHA_POKHARI' : 'NEWA_BAZAAR_HOUSE';
      }

      for (const zSub of [-6, 6]) {
        const leftBldg = createLandmarkSpecificBuilding(
          landmarkType,
          textures,
          i * 3 + (zSub > 0 ? 1 : 2)
        );
        leftBldg.position.set(-7.5, 0, zSub);
        chunkGroup.add(leftBldg);

        const rightBldg = createLandmarkSpecificBuilding(
          'NEWA_BAZAAR_HOUSE',
          textures,
          i * 5 + (zSub > 0 ? 2 : 4)
        );
        rightBldg.position.set(7.5, 0, zSub);
        chunkGroup.add(rightBldg);
      }

      // Traditional Street Oil Lamps (Diyo Posts)
      const leftLampPost = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.12, 3.2, 8),
        woodMat
      );
      leftLampPost.position.set(-4.35, 1.6, 0);
      const rightLampPost = leftLampPost.clone();
      rightLampPost.position.x = 4.35;

      const flameBulbMat = new THREE.MeshStandardMaterial({
        color: 0xfde047,
        emissive: 0xf59e0b,
        emissiveIntensity: 1.8,
      });
      const leftFlame = new THREE.Mesh(
        new THREE.SphereGeometry(0.18, 8, 8),
        flameBulbMat
      );
      leftFlame.position.set(-4.35, 3.3, 0);
      const rightFlame = leftFlame.clone();
      rightFlame.position.x = 4.35;
      chunkGroup.add(leftLampPost, rightLampPost, leftFlame, rightFlame);

      // Ceremonial Street Checkpoint Archway (shown at landmark or turn segments)
      const archBanner = new THREE.Group();
      const archPillarL = new THREE.Mesh(
        new THREE.BoxGeometry(0.45, 5.4, 0.45),
        woodMat
      );
      archPillarL.position.set(-4.1, 2.7, 0);
      const archPillarR = archPillarL.clone();
      archPillarR.position.x = 4.1;
      const archBeam = new THREE.Mesh(
        new THREE.BoxGeometry(9.2, 0.75, 0.65),
        goldMat
      );
      archBeam.position.set(0, 5.4, 0);
      archBanner.add(archPillarL, archPillarR, archBeam);
      archBanner.visible = i % 3 === 0;
      chunkGroup.add(archBanner);

      scene.add(chunkGroup);
      trackChunks.push({ group: chunkGroup, z: zPos, archBanner });
    }

    // Articulated Runner Rig
    let currentRunnerId = profileRef.current.selectedRunner;
    const selectedRunnerObj: RunnerCharacter =
      RUNNERS.find((r) => r.id === currentRunnerId) || RUNNERS[0];
    let runnerRig: ArticulatedRunnerRig = createRunnerModel(selectedRunnerObj);
    scene.add(runnerRig.group);

    // Pursuing Singha-Rakshasa & Gurumapa Demon Pack Rig
    const guardianRig: ChaserPackRig = createGuardianChaserModel();
    guardianRig.group.position.set(0, 0, 3.6);
    scene.add(guardianRig.group);

    // Dynamic Obstacle & Collectible Pools
    const obstaclesGroup = new THREE.Group();
    const collectiblesGroup = new THREE.Group();
    scene.add(obstaclesGroup, collectiblesGroup);

    let activeObstacles: ActiveObstacle[] = [];
    let activeCollectibles: ActiveCollectible[] = [];
    let nextEntityId = 1;

    // Mutable Game Simulation State
    const sim = {
      lane: 0 as -1 | 0 | 1,
      currentX: 0,
      y: 0,
      velocityY: 0,
      isJumping: false,
      slideTimer: 0,
      distanceMeters: 0,
      score: 0,
      coins: 0,
      jujuDhauCount: 0,
      multiplier: 1,
      baseSpeed: 15.5,
      currentSpeed: 15.5,
      surgeCharge: 35,
      magnetRemaining: 0,
      shieldRemaining: 0,
      surgeRemaining: 0,
      guardianProximity: 0.68, // Starts lunging close behind player at run start!
      monsterState: 'LUNGING' as 'STALKING' | 'FRENZY_HUNT' | 'LUNGING' | 'REPELLED',
      frenzyTimer: 0,
      nextFrenzyDistance: 280,
      stumbleCooldown: 2.5,
      stumbleWarning: 'The Awakened Singha-Rakshasa Pack is hunting you!' as string | null,
      stumbleWarningTimer: 3.0,
      spawnCursorZ: -32,
      worldTurnAngle: 0,
      targetTurnAngle: 0,
      lastSegmentIdx: 0,
      lastTelemetryEmit: 0,
    };

    const resetRunSimulation = () => {
      sim.lane = 0;
      sim.currentX = 0;
      sim.y = 0;
      sim.velocityY = 0;
      sim.isJumping = false;
      sim.slideTimer = 0;
      sim.distanceMeters = 0;
      sim.score = 0,
      sim.coins = 0;
      sim.jujuDhauCount = 0;
      sim.multiplier = 1;
      const runnerDef =
        RUNNERS.find((r) => r.id === profileRef.current.selectedRunner) ||
        RUNNERS[0];
      sim.baseSpeed = 15.5 * runnerDef.speedBonus;
      sim.currentSpeed = sim.baseSpeed;
      sim.surgeCharge = 35;
      sim.magnetRemaining = 0;
      sim.shieldRemaining = 0;
      sim.surgeRemaining = 0;
      sim.guardianProximity = 0.68;
      sim.monsterState = 'LUNGING';
      sim.frenzyTimer = 0;
      sim.nextFrenzyDistance = 280;
      sim.stumbleCooldown = 2.5;
      sim.stumbleWarning =
        'Awakened Singha-Rakshasa & Gurumapa Pack unleashed behind you!';
      sim.stumbleWarningTimer = 3.2;
      sim.spawnCursorZ = -28;
      sim.worldTurnAngle = 0;
      sim.targetTurnAngle = 0;
      sim.lastSegmentIdx = 0;
      soundEngine.playMonsterRoar();

      // Clear existing obstacles & collectibles
      for (const obs of activeObstacles) {
        obstaclesGroup.remove(obs.mesh);
      }
      for (const col of activeCollectibles) {
        collectiblesGroup.remove(col.mesh);
      }
      activeObstacles = [];
      activeCollectibles = [];

      // Reset track chunks
      trackChunks.forEach((chunk, idx) => {
        chunk.z = -idx * TRACK_CHUNK_LENGTH;
        chunk.group.position.z = chunk.z;
      });

      // Spawn initial waves ahead
      for (let z = -34; z >= -160; z -= 18) {
        spawnWaveAtZ(z);
      }
    };

    const spawnWaveAtZ = (zPos: number) => {
      const lanes: (-1 | 0 | 1)[] = [-1, 0, 1];
      const obstacleLane = lanes[Math.floor(Math.random() * lanes.length)];
      const obsType =
        OBSTACLE_POOL_TYPES[
          Math.floor(Math.random() * OBSTACLE_POOL_TYPES.length)
        ];

      const obsMesh = createObstacleMesh(obsType, textures);
      obsMesh.position.set(obstacleLane * LANE_WIDTH, 0, zPos);
      obstaclesGroup.add(obsMesh);

      const requiresSlide =
        obsType === 'HANGING_BELLS' || obsType === 'LOW_ROOF';
      const requiresJump =
        obsType === 'ALLEY_GAP' ||
        obsType === 'FIRE_TRAP' ||
        obsType === 'POTTERY_STALL' ||
        obsType === 'CHARIOT';

      activeObstacles.push({
        id: nextEntityId++,
        type: obsType,
        lane: obstacleLane,
        z: zPos,
        mesh: obsMesh,
        hit: false,
        requiresSlide,
        requiresJump,
      });

      // Occasionally add a second obstacle in another lane for intense 3-lane dodging
      if (Math.random() < 0.42) {
        const otherLanes = lanes.filter((l) => l !== obstacleLane);
        const secondLane =
          otherLanes[Math.floor(Math.random() * otherLanes.length)];
        const secondType =
          OBSTACLE_POOL_TYPES[
            Math.floor(Math.random() * OBSTACLE_POOL_TYPES.length)
          ];
        const secondMesh = createObstacleMesh(secondType, textures);
        secondMesh.position.set(secondLane * LANE_WIDTH, 0, zPos);
        obstaclesGroup.add(secondMesh);

        activeObstacles.push({
          id: nextEntityId++,
          type: secondType,
          lane: secondLane,
          z: zPos,
          mesh: secondMesh,
          hit: false,
          requiresSlide:
            secondType === 'HANGING_BELLS' || secondType === 'LOW_ROOF',
          requiresJump:
            secondType === 'ALLEY_GAP' ||
            secondType === 'FIRE_TRAP' ||
            secondType === 'POTTERY_STALL' ||
            secondType === 'CHARIOT',
        });
      }

      // Spawn a line of Malla Coins, Juju Dhau bowls, or a Sukunda Lamp in a safe lane
      const freeLanes = lanes.filter((l) => l !== obstacleLane);
      const coinLane = freeLanes[Math.floor(Math.random() * freeLanes.length)];
      const numCoins = 4;
      for (let c = 0; c < numCoins; c++) {
        const cZ = zPos + 4 - c * 2.4;
        let colType: CollectibleType = 'MALLA_COIN';
        if (c === numCoins - 1 && Math.random() < 0.26) {
          colType = Math.random() < 0.65 ? 'JUJU_DHAU' : 'SUKUNDA_LAMP';
        }
        const colMesh = createCollectibleMesh(colType);
        const colY = 0.95;
        colMesh.position.set(coinLane * LANE_WIDTH, colY, cZ);
        collectiblesGroup.add(colMesh);

        activeCollectibles.push({
          id: nextEntityId++,
          type: colType,
          lane: coinLane,
          y: colY,
          z: cZ,
          mesh: colMesh,
          collected: false,
        });
      }
    };

    // Player Action Handlers
    const moveLeft = () => {
      if (statusRef.current !== 'RUNNING') return;
      if (sim.lane > -1) {
        sim.lane = (sim.lane - 1) as -1 | 0 | 1;
        soundEngine.playLaneSwitch();
      }
    };

    const moveRight = () => {
      if (statusRef.current !== 'RUNNING') return;
      if (sim.lane < 1) {
        sim.lane = (sim.lane + 1) as -1 | 0 | 1;
        soundEngine.playLaneSwitch();
      }
    };

    const jump = () => {
      if (statusRef.current !== 'RUNNING') return;
      if (!sim.isJumping) {
        sim.isJumping = true;
        sim.velocityY = 10.6;
        sim.slideTimer = 0;
        soundEngine.playJump();
      }
    };

    const slide = () => {
      if (statusRef.current !== 'RUNNING') return;
      sim.slideTimer = 0.72;
      if (sim.isJumping) {
        // Fast slam down
        sim.velocityY = -14;
      }
      soundEngine.playSlide();
    };

    const activateSurge = () => {
      if (statusRef.current !== 'RUNNING') return;
      if (sim.surgeCharge >= 100 && sim.surgeRemaining <= 0) {
        const surgeLvl = profileRef.current.upgrades.surgeLevel;
        sim.surgeRemaining = 5 + surgeLvl * 1.2;
        sim.shieldRemaining = Math.max(sim.shieldRemaining, sim.surgeRemaining);
        sim.surgeCharge = 0;
        // Sacred Surge shockwave blasts the pursuing monster pack back!
        sim.guardianProximity = 0.14;
        sim.frenzyTimer = 0;
        sim.monsterState = 'REPELLED';
        sim.stumbleWarning =
          'Sacred Juju Dhau Surge repelled the Singha-Rakshasa Pack!';
        sim.stumbleWarningTimer = 2.5;
        soundEngine.playTempleBell();
      }
    };

    actionTriggerRef.current = {
      moveLeft,
      moveRight,
      jump,
      slide,
      activateSurge,
    };

    // Keyboard Controls
    const onKeyDown = (e: KeyboardEvent) => {
      if (statusRef.current !== 'RUNNING') return;
      switch (e.code) {
        case 'ArrowLeft':
        case 'KeyA':
          e.preventDefault();
          moveLeft();
          break;
        case 'ArrowRight':
        case 'KeyD':
          e.preventDefault();
          moveRight();
          break;
        case 'ArrowUp':
        case 'KeyW':
        case 'Space':
          e.preventDefault();
          jump();
          break;
        case 'ArrowDown':
        case 'KeyS':
          e.preventDefault();
          slide();
          break;
        case 'KeyE':
          e.preventDefault();
          activateSurge();
          break;
      }
    };
    window.addEventListener('keydown', onKeyDown);

    // Touch Swipe Gesture Controls with passive false to prevent browser scrolling
    let touchStartX = 0;
    let touchStartY = 0;
    let touchStartTime = 0;

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length > 0) {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
        touchStartTime = performance.now();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (statusRef.current !== 'RUNNING' || e.changedTouches.length === 0)
        return;
      const dx = e.changedTouches[0].clientX - touchStartX;
      const dy = e.changedTouches[0].clientY - touchStartY;
      const dt = performance.now() - touchStartTime;

      // Quick tap -> Jump
      if (Math.abs(dx) < 18 && Math.abs(dy) < 18 && dt < 220) {
        jump();
        return;
      }

      // Directional swipe detection
      if (Math.abs(dx) > Math.abs(dy)) {
        if (dx > 20) moveRight();
        else if (dx < -20) moveLeft();
      } else {
        if (dy < -20) jump();
        else if (dy > 20) slide();
      }
    };

    const domElem = renderer.domElement;
    domElem.style.touchAction = 'none';
    domElem.addEventListener('touchstart', onTouchStart, { passive: true });
    domElem.addEventListener('touchend', onTouchEnd, { passive: true });

    // Pre-warm shaders once
    resetRunSimulation();
    renderer.compile(scene, camera);

    // Resize listener
    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = Math.max(1, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    // Main 60FPS Performance Frame Loop (replaces deprecated THREE.Clock)
    let lastFrameTime = performance.now();
    const startTime = performance.now();
    let animFrameId = 0;
    let prevStatus: GameStatus = statusRef.current;

    const animate = () => {
      animFrameId = requestAnimationFrame(animate);
      const now = performance.now();
      const rawDelta = (now - lastFrameTime) / 1000;
      lastFrameTime = now;
      const dt = Math.min(rawDelta, 0.05);
      const elapsed = (now - startTime) / 1000;

      // Detect transition into RUNNING to reset simulation cleanly
      if (prevStatus !== 'RUNNING' && statusRef.current === 'RUNNING') {
        if (prevStatus === 'MENU' || prevStatus === 'GAME_OVER' || prevStatus === 'VICTORY') {
          resetRunSimulation();
        }
      }
      prevStatus = statusRef.current;

      // Update Runner Character Model if user switched character in Sanctum
      if (profileRef.current.selectedRunner !== currentRunnerId) {
        currentRunnerId = profileRef.current.selectedRunner;
        const newRunnerDef =
          RUNNERS.find((r) => r.id === currentRunnerId) || RUNNERS[0];
        scene.remove(runnerRig.group);
        runnerRig = createRunnerModel(newRunnerDef);
        scene.add(runnerRig.group);
      }

      // Update Shader Uniforms for Procedural Weathered Brick Street
      if (roadMat.userData.uTime) {
        roadMat.userData.uTime.value = elapsed;
      }
      const lightCfg = LIGHTING_CONFIGS[lightingRef.current];
      (scene.background as THREE.Color).lerp(
        new THREE.Color(lightCfg.bgHex),
        dt * 3
      );
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.lerp(new THREE.Color(lightCfg.fogHex), dt * 3);
        scene.fog.density = THREE.MathUtils.damp(
          scene.fog.density,
          lightCfg.fogDensity,
          4,
          dt
        );
      }
      keyLight.color.lerp(new THREE.Color(lightCfg.sunHex), dt * 3);
      keyLight.intensity = THREE.MathUtils.damp(
        keyLight.intensity,
        lightCfg.sunIntensity,
        4,
        dt
      );
      hemiLight.color.lerp(new THREE.Color(lightCfg.hemiSkyHex), dt * 3);
      hemiLight.groundColor.lerp(new THREE.Color(lightCfg.hemiGroundHex), dt * 3);

      if (statusRef.current === 'RUNNING') {
        const runnerDef =
          RUNNERS.find((r) => r.id === profileRef.current.selectedRunner) ||
          RUNNERS[0];

        // Power-up countdowns
        if (sim.magnetRemaining > 0)
          sim.magnetRemaining = Math.max(0, sim.magnetRemaining - dt);
        if (sim.shieldRemaining > 0)
          sim.shieldRemaining = Math.max(0, sim.shieldRemaining - dt);
        if (sim.surgeRemaining > 0)
          sim.surgeRemaining = Math.max(0, sim.surgeRemaining - dt);
        if (sim.stumbleCooldown > 0)
          sim.stumbleCooldown = Math.max(0, sim.stumbleCooldown - dt);
        if (sim.stumbleWarningTimer > 0) {
          sim.stumbleWarningTimer = Math.max(0, sim.stumbleWarningTimer - dt);
          if (sim.stumbleWarningTimer === 0) sim.stumbleWarning = null;
        }

        // Periodic Blood Moon Frenzy Hunt: Monster pack surges forward to pressure the runner
        if (sim.distanceMeters >= sim.nextFrenzyDistance && sim.surgeRemaining <= 0) {
          sim.nextFrenzyDistance += 320;
          sim.frenzyTimer = 6.5;
          sim.guardianProximity = Math.max(sim.guardianProximity, 0.72);
          sim.monsterState = 'FRENZY_HUNT';
          sim.stumbleWarning =
            'BLOOD MOON FRENZY! The Singha-Rakshasa Pack is lunging at your heels!';
          sim.stumbleWarningTimer = 3.2;
          soundEngine.playMonsterRoar();
        }

        if (sim.frenzyTimer > 0) {
          sim.frenzyTimer = Math.max(0, sim.frenzyTimer - dt);
        }

        // Gradual recovery from guardian chaser proximity when not in frenzy or stumble
        if (
          sim.stumbleCooldown === 0 &&
          sim.frenzyTimer === 0 &&
          sim.guardianProximity > 0.24
        ) {
          sim.guardianProximity = Math.max(
            0.24,
            sim.guardianProximity - dt * 0.055
          );
        }

        // Determine Creature Skeletal Animation State:
        // 1. 'POUNCING': Triggers when distance/proximity drops below 0.3 (guardianProximity >= 0.70)
        // 2. 'ROARING': Triggers during Blood Moon Frenzy
        // 3. 'REPELLED': Triggers during Juju Dhau Surge
        // 4. 'RUNNING': Standard pursuit
        const creatureDistanceGap = 1.0 - sim.guardianProximity;
        let targetSkeletalState: CreatureSkeletalState = 'RUNNING';

        if (sim.surgeRemaining > 0) {
          targetSkeletalState = 'REPELLED';
          sim.monsterState = 'REPELLED';
        } else if (creatureDistanceGap <= 0.3 || sim.guardianProximity >= 0.7) {
          targetSkeletalState = 'POUNCING';
          sim.monsterState = 'LUNGING';
        } else if (sim.frenzyTimer > 0) {
          targetSkeletalState = 'ROARING';
          sim.monsterState = 'FRENZY_HUNT';
        } else {
          targetSkeletalState = 'RUNNING';
          sim.monsterState = 'STALKING';
        }

        // Speed calculation (gradually ramps with distance + Juju Dhau Surge boost)
        const distanceRamp = Math.min(8.5, sim.distanceMeters * 0.0045);
        const surgeMultiplier = sim.surgeRemaining > 0 ? 1.42 : 1.0;
        const targetSpeed =
          (15.5 * runnerDef.speedBonus + distanceRamp) * surgeMultiplier;
        sim.currentSpeed = THREE.MathUtils.damp(
          sim.currentSpeed,
          targetSpeed,
          5,
          dt
        );

        const dz = sim.currentSpeed * dt;
        sim.distanceMeters += dz * 0.65;
        sim.score += Math.round(dz * sim.multiplier * 2.2);

        // Smooth Lane Damping
        const targetX = sim.lane * LANE_WIDTH;
        sim.currentX = THREE.MathUtils.damp(sim.currentX, targetX, 14, dt);

        // Jump & Gravity Physics
        if (sim.isJumping) {
          sim.y += sim.velocityY * dt;
          sim.velocityY -= 26.5 * dt;
          if (sim.y <= 0) {
            sim.y = 0;
            sim.velocityY = 0;
            sim.isJumping = false;
          }
        }

        // Slide Crouch Timer
        if (sim.slideTimer > 0) {
          sim.slideTimer = Math.max(0, sim.slideTimer - dt);
        }

        // Position & Animate Runner Rig
        runnerRig.group.position.set(sim.currentX, sim.y, 0);
        const laneBank = (sim.currentX - targetX) * 0.14;
        runnerRig.group.rotation.z = laneBank;

        if (sim.slideTimer > 0) {
          runnerRig.torsoGroup.scale.y = THREE.MathUtils.damp(
            runnerRig.torsoGroup.scale.y,
            0.52,
            16,
            dt
          );
          runnerRig.torsoGroup.position.y = THREE.MathUtils.damp(
            runnerRig.torsoGroup.position.y,
            0.58,
            16,
            dt
          );
          runnerRig.torsoGroup.rotation.x = -0.45;
        } else {
          runnerRig.torsoGroup.scale.y = THREE.MathUtils.damp(
            runnerRig.torsoGroup.scale.y,
            1.0,
            14,
            dt
          );
          runnerRig.torsoGroup.position.y = THREE.MathUtils.damp(
            runnerRig.torsoGroup.position.y,
            1.05,
            14,
            dt
          );
          runnerRig.torsoGroup.rotation.x = 0.12;
        }

        // Articulated limb stride cycle
        const strideFreq = elapsed * sim.currentSpeed * 1.15;
        if (sim.isJumping) {
          runnerRig.leftLeg.rotation.x = -0.65;
          runnerRig.rightLeg.rotation.x = 0.45;
          runnerRig.leftArm.rotation.x = -0.8;
          runnerRig.rightArm.rotation.x = -0.8;
        } else if (sim.slideTimer > 0) {
          runnerRig.leftLeg.rotation.x = 0.85;
          runnerRig.rightLeg.rotation.x = -0.25;
        } else {
          runnerRig.leftLeg.rotation.x = Math.sin(strideFreq) * 0.78;
          runnerRig.rightLeg.rotation.x = -Math.sin(strideFreq) * 0.78;
          runnerRig.leftArm.rotation.x = -Math.sin(strideFreq) * 0.65;
          runnerRig.rightArm.rotation.x = Math.sin(strideFreq) * 0.65;
        }

        // Power-up Visual Auras
        runnerRig.shieldDome.visible = sim.shieldRemaining > 0;
        if (runnerRig.shieldDome.visible) {
          runnerRig.shieldDome.rotation.y += dt * 2.5;
        }
        runnerRig.magnetHalo.visible = sim.magnetRemaining > 0;
        if (runnerRig.magnetHalo.visible) {
          runnerRig.magnetHalo.rotation.z += dt * 4.0;
        }

        // Update & Animate Pursuing Singha-Rakshasa & Gurumapa Demon Pack with Skeletal States
        const targetChaserZ = 4.9 - sim.guardianProximity * 3.15;
        guardianRig.group.position.z = THREE.MathUtils.damp(
          guardianRig.group.position.z,
          targetChaserZ,
          6,
          dt
        );
        guardianRig.group.position.x = THREE.MathUtils.damp(
          guardianRig.group.position.x,
          sim.currentX,
          5.5,
          dt
        );

        // Update Creature Skeletal Bone Poses & State Crossfading ('POUNCING', 'ROARING', 'RUNNING', 'REPELLED')
        updateCreatureSkeletalAnimation(
          guardianRig,
          dt,
          elapsed,
          targetSkeletalState,
          sim.currentSpeed
        );

        // Scroll Track Chunks & Recycle
        for (const chunk of trackChunks) {
          chunk.z += dz;
          if (chunk.z > TRACK_CHUNK_LENGTH) {
            chunk.z -= NUM_TRACK_CHUNKS * TRACK_CHUNK_LENGTH;
          }
          chunk.group.position.z = chunk.z;
        }

        // Move & Check Obstacles
        for (let i = activeObstacles.length - 1; i >= 0; i--) {
          const obs = activeObstacles[i];
          obs.z += dz;
          obs.mesh.position.z = obs.z;

          // Rotate Bisket Jatra chariot wheels if CHARIOT
          if (obs.type === 'CHARIOT') {
            obs.mesh.position.z += dt * 2.2; // Chariot rolls forward!
          }

          // Collision check around z = 0 (Player Z is 0)
          if (!obs.hit && Math.abs(obs.z) < 0.95) {
            const sameLane = Math.abs(sim.currentX - obs.lane * LANE_WIDTH) < 1.05;
            if (sameLane) {
              let avoided = false;
              if (obs.requiresSlide && sim.slideTimer > 0) {
                avoided = true;
              } else if (obs.requiresJump && sim.y > 0.85) {
                avoided = true;
              }

              if (!avoided) {
                obs.hit = true;
                if (sim.shieldRemaining > 0) {
                  // Garuda Shield absorbs impact!
                  sim.shieldRemaining = 0;
                  obs.mesh.visible = false;
                  soundEngine.playTempleBell();
                  sim.stumbleWarning = 'Garuda Shield absorbed impact!';
                  sim.stumbleWarningTimer = 2.0;
                } else if (obs.type === 'ALLEY_GAP' || obs.type === 'FIRE_TRAP') {
                  // Direct fatal hazard unless shielded
                  soundEngine.playGameOver();
                  onRunEndRef.current({
                    victory: false,
                    score: sim.score,
                    coinsEarned: sim.coins,
                    distanceMeters: Math.round(sim.distanceMeters),
                    jujuDhauCollected: sim.jujuDhauCount,
                    reason:
                      obs.type === 'ALLEY_GAP'
                        ? 'Fell into a collapsed Hiti brick trench!'
                        : 'Caught by a sacred oil fire brazier!',
                  });
                  return;
                } else {
                  // Stumble mechanic: Singha-Rakshasa Pack lunges right behind the runner!
                  soundEngine.playStumble();
                  sim.guardianProximity += 0.46;
                  sim.monsterState = 'LUNGING';
                  sim.stumbleCooldown = 4.2;
                  sim.stumbleWarning =
                    'STUMBLED! The Singha-Rakshasa Pack is snapping at your neck!';
                  sim.stumbleWarningTimer = 3.0;

                  if (sim.guardianProximity >= 1.0) {
                    soundEngine.playGameOver();
                    onRunEndRef.current({
                      victory: false,
                      score: sim.score,
                      coinsEarned: sim.coins,
                      distanceMeters: Math.round(sim.distanceMeters),
                      jujuDhauCollected: sim.jujuDhauCount,
                      reason: `Devoured by the Singha-Rakshasa Demon Pack after hitting ${obs.type.replace('_', ' ')}!`,
                    });
                    return;
                  }
                }
              }
            }
          }

          if (obs.z > 14) {
            obstaclesGroup.remove(obs.mesh);
            activeObstacles.splice(i, 1);
          }
        }

        // Move & Collect Coins / Juju Dhau / Sukunda Lamps
        for (let i = activeCollectibles.length - 1; i >= 0; i--) {
          const col = activeCollectibles[i];
          col.z += dz;
          col.mesh.rotation.y += dt * 3.2;

          // Sukunda Magnet attraction
          if (
            sim.magnetRemaining > 0 &&
            col.z > -16 &&
            col.z < 3 &&
            !col.collected
          ) {
            col.mesh.position.x = THREE.MathUtils.damp(
              col.mesh.position.x,
              sim.currentX,
              12,
              dt
            );
            col.mesh.position.y = THREE.MathUtils.damp(
              col.mesh.position.y,
              sim.y + 1.0,
              12,
              dt
            );
          }
          col.mesh.position.z = col.z;

          // Pickup check
          _coinWorldPos.copy(col.mesh.position);
          const dx = Math.abs(_coinWorldPos.x - sim.currentX);
          const dzCol = Math.abs(col.z);
          if (!col.collected && dzCol < 1.15 && dx < 1.15) {
            col.collected = true;
            col.mesh.visible = false;

            if (col.type === 'MALLA_COIN') {
              const coinGain = 1 * runnerDef.coinMultiplier;
              sim.coins += coinGain;
              sim.score += 25 * sim.multiplier;
              sim.surgeCharge = Math.min(100, sim.surgeCharge + 4);
              soundEngine.playCoin();
            } else if (col.type === 'JUJU_DHAU') {
              sim.jujuDhauCount += 1;
              sim.multiplier = Math.min(8, sim.multiplier + 1);
              sim.score += 120 * sim.multiplier;
              const chargeBoost =
                runnerDef.id === 'artisan' ? 32 : 24;
              sim.surgeCharge = Math.min(100, sim.surgeCharge + chargeBoost);
              soundEngine.playJujuDhau();
            } else if (col.type === 'SUKUNDA_LAMP') {
              const magLvl = profileRef.current.upgrades.magnetLevel;
              const shdLvl = profileRef.current.upgrades.shieldLevel;
              sim.magnetRemaining = 7 + magLvl * 1.8;
              sim.shieldRemaining =
                6 + shdLvl * 1.5 + (runnerDef.id === 'lakhey' ? 2.5 : 0);
              sim.score += 200 * sim.multiplier;
              soundEngine.playTempleBell();
            }
          }

          if (col.z > 12 || col.collected) {
            collectiblesGroup.remove(col.mesh);
            activeCollectibles.splice(i, 1);
          }
        }

        // Spawn new waves ahead continuously
        sim.spawnCursorZ += dz;
        while (sim.spawnCursorZ > -155) {
          sim.spawnCursorZ -= 18.5;
          spawnWaveAtZ(sim.spawnCursorZ);
        }

        // Interpolate along Real Extracted Bhaktapur Street Polyline
        const activeRoute = routeRef.current;
        if (
          modeRef.current === 'LANDMARK_ROUTE' &&
          activeRoute.totalDistanceMeters > 0 &&
          sim.distanceMeters >= activeRoute.totalDistanceMeters
        ) {
          soundEngine.playTempleBell();
          onRunEndRef.current({
            victory: true,
            score: sim.score + 1000,
            coinsEarned: sim.coins + 50,
            distanceMeters: Math.round(activeRoute.totalDistanceMeters),
            jujuDhauCollected: sim.jujuDhauCount,
            reason: `Reached ${activeRoute.destination.name} (${activeRoute.destination.newaName})!`,
          });
          return;
        }

        const routePos = interpolatePositionAlongRoute(
          activeRoute,
          sim.distanceMeters
        );

        // Trigger subtle camera curve banking when transitioning street segments with turns
        if (routePos.segment.index !== sim.lastSegmentIdx) {
          sim.lastSegmentIdx = routePos.segment.index;
          if (routePos.segment.turnDirection === 'LEFT') {
            sim.targetTurnAngle = 0.14;
            soundEngine.playTempleBell();
          } else if (routePos.segment.turnDirection === 'RIGHT') {
            sim.targetTurnAngle = -0.14;
            soundEngine.playTempleBell();
          } else {
            sim.targetTurnAngle = 0;
          }
        }
        sim.worldTurnAngle = THREE.MathUtils.damp(
          sim.worldTurnAngle,
          sim.targetTurnAngle,
          2.5,
          dt
        );
        sim.targetTurnAngle = THREE.MathUtils.damp(
          sim.targetTurnAngle,
          0,
          1.2,
          dt
        );

        // Dynamic Camera Choreography (FOV widening on Surge + Preset positioning)
        const targetFov = sim.surgeRemaining > 0 ? 74 : 62;
        camera.fov = THREE.MathUtils.damp(camera.fov, targetFov, 5, dt);
        camera.updateProjectionMatrix();

        const camMode = cameraPresetRef.current;
        if (camMode === 'DRONE_AERIAL') {
          _camTargetPos.set(sim.currentX * 0.45, 17.5 + sim.y * 0.2, 19.5);
          _camLookAt.set(sim.currentX * 0.2, 1.0, -18.5);
        } else if (camMode === 'HIGH_PAGODA') {
          _camTargetPos.set(sim.currentX * 0.55, 6.4 + sim.y * 0.3, 8.8);
          _camLookAt.set(sim.currentX * 0.35, 1.2, -12);
        } else if (camMode === 'CLOSE_ACTION') {
          _camTargetPos.set(sim.currentX * 0.75, 2.7 + sim.y * 0.4, 4.4);
          _camLookAt.set(sim.currentX * 0.5, 1.3, -14);
        } else {
          // CHASE_DYNAMIC
          _camTargetPos.set(sim.currentX * 0.65, 3.85 + sim.y * 0.35, 6.4);
          _camLookAt.set(sim.currentX * 0.4, 1.35, -12);
        }

        camera.position.lerp(_camTargetPos, 1 - Math.exp(-10 * dt));
        // Visceral camera tremor when the Singha-Rakshasa pack is lunging right behind the player
        if (sim.guardianProximity > 0.65) {
          const shakeAmp = (sim.guardianProximity - 0.65) * 0.22;
          camera.position.x += Math.sin(elapsed * 42) * shakeAmp;
          camera.position.y += Math.cos(elapsed * 38) * shakeAmp;
        }
        camera.lookAt(_camLookAt);
        camera.rotation.z += sim.worldTurnAngle;

        // Emit HUD & Live Map Telemetry at ~15Hz
        if (elapsed - sim.lastTelemetryEmit > 0.065) {
          sim.lastTelemetryEmit = elapsed;
          onTelemetryRef.current({
            score: sim.score,
            coins: sim.coins,
            jujuDhauCount: sim.jujuDhauCount,
            multiplier: sim.multiplier,
            distanceMeters: Math.round(sim.distanceMeters),
            speedMps: Number(sim.currentSpeed.toFixed(1)),
            currentStreetName: routePos.segment.streetName,
            nextLandmarkName: routePos.nextLandmarkName,
            distanceToNextLandmark: routePos.distanceToNextLandmark,
            currentCoords: routePos.coord,
            currentBearing: routePos.bearing,
            upcomingTurn: routePos.upcomingTurn,
            activePowerUps: {
              magnetRemaining: Number(sim.magnetRemaining.toFixed(1)),
              shieldRemaining: Number(sim.shieldRemaining.toFixed(1)),
              surgeRemaining: Number(sim.surgeRemaining.toFixed(1)),
            },
            surgeCharge: Math.round(sim.surgeCharge),
            guardianProximity: sim.guardianProximity,
            monsterState: sim.monsterState,
            stumbleWarning: sim.stumbleWarning,
          });
        }
      } else {
        // Cinematic Idle Lobby Orbit around Runner & Pursuing Monster Pack
        const orbitAngle = elapsed * 0.32;
        camera.position.x = Math.sin(orbitAngle) * 4.4;
        camera.position.y = 3.2 + Math.sin(elapsed * 0.8) * 0.25;
        camera.position.z = 5.8 + Math.cos(orbitAngle) * 1.4;
        camera.lookAt(0, 1.35, 1.2);

        runnerRig.group.position.set(0, 0, 0);
        runnerRig.group.rotation.z = 0;
        runnerRig.leftArm.rotation.x = Math.sin(elapsed * 2) * 0.12;
        runnerRig.rightArm.rotation.x = -Math.sin(elapsed * 2) * 0.12;

        guardianRig.group.position.set(0, 0, 3.2);
        guardianRig.jawPivot.rotation.x =
          0.2 + Math.abs(Math.sin(elapsed * 4.5)) * 0.38;
        guardianRig.tailPivot.rotation.y = Math.sin(elapsed * 4) * 0.35;
      }

      renderer.render(scene, camera);
    };

    animFrameId = requestAnimationFrame(animate);

    return () => {
      cancelAnimationFrame(animFrameId);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('resize', handleResize);
      domElem.removeEventListener('touchstart', onTouchStart);
      domElem.removeEventListener('touchend', onTouchEnd);
      renderer.dispose();
    };
  }, [actionTriggerRef]);

  return (
    <div
      ref={canvasMountRef}
      className="fixed inset-0 w-full h-full z-0 overflow-hidden"
      aria-label="Bhaktapur Run 3D Viewport"
    />
  );
};
