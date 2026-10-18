import * as THREE from 'three';
import {
  CollectibleType,
  ObstacleType,
  RunnerCharacter,
} from '../types/game';

export interface ProceduralTexturePack {
  brickWall: THREE.CanvasTexture;
  brickRoad: THREE.CanvasTexture;
  carvedWood: THREE.CanvasTexture;
  pagodaRoof: THREE.CanvasTexture;
  palaceGold: THREE.CanvasTexture;
}

export function createProceduralTextures(
  renderer: THREE.WebGLRenderer
): ProceduralTexturePack {
  const maxAniso = renderer.capabilities.getMaxAnisotropy();

  // 1. Newa Dachi Appa Terracotta Brick Wall Texture
  const brickCanvas = document.createElement('canvas');
  brickCanvas.width = 512;
  brickCanvas.height = 512;
  const bCtx = brickCanvas.getContext('2d')!;
  bCtx.fillStyle = '#6E2818';
  bCtx.fillRect(0, 0, 512, 512);

  const rows = 16;
  const cols = 8;
  const rowH = 512 / rows;
  const colW = 512 / cols;

  for (let r = 0; r < rows; r++) {
    const offset = (r % 2) * (colW / 2);
    for (let c = -1; c <= cols; c++) {
      const x = c * colW + offset;
      const y = r * rowH;
      const shade = ((r * 7 + c * 13) % 24) - 12;
      const red = Math.min(255, Math.max(90, 158 + shade));
      const green = Math.min(255, Math.max(35, 62 + Math.floor(shade * 0.5)));
      const blue = Math.min(255, Math.max(25, 42 + Math.floor(shade * 0.3)));
      bCtx.fillStyle = `rgb(${red}, ${green}, ${blue})`;
      bCtx.fillRect(x + 2, y + 2, colW - 4, rowH - 4);

      // Kiln highlight
      bCtx.fillStyle = 'rgba(255, 200, 160, 0.08)';
      bCtx.fillRect(x + 3, y + 3, colW - 6, 4);
    }
  }
  const brickWall = new THREE.CanvasTexture(brickCanvas);
  brickWall.colorSpace = THREE.SRGBColorSpace;
  brickWall.wrapS = THREE.RepeatWrapping;
  brickWall.wrapT = THREE.RepeatWrapping;
  brickWall.repeat.set(2, 2);
  brickWall.anisotropy = maxAniso;

  // 2. Bhaktapur Herringbone Brick Street Pavement (3 Lanes + Stone Channels)
  const roadCanvas = document.createElement('canvas');
  roadCanvas.width = 512;
  roadCanvas.height = 512;
  const rCtx = roadCanvas.getContext('2d')!;
  rCtx.fillStyle = '#52251A';
  rCtx.fillRect(0, 0, 512, 512);

  for (let y = 0; y < 512; y += 16) {
    for (let x = 0; x < 512; x += 32) {
      const tint = ((x + y) % 48) - 24;
      rCtx.fillStyle = `rgb(${128 + tint * 0.6}, ${58 + tint * 0.3}, ${42 + tint * 0.25})`;
      rCtx.fillRect(x + 1, y + 1, 14, 14);
      rCtx.fillStyle = `rgb(${114 + tint * 0.5}, ${50 + tint * 0.3}, ${36 + tint * 0.2})`;
      rCtx.fillRect(x + 17, y + 1, 14, 14);
    }
  }

  // Stone curbs and lane dividers
  rCtx.fillStyle = '#38343A';
  rCtx.fillRect(0, 0, 34, 512);
  rCtx.fillRect(478, 0, 34, 512);
  rCtx.fillStyle = 'rgba(220, 180, 130, 0.25)';
  rCtx.fillRect(178, 0, 6, 512);
  rCtx.fillRect(328, 0, 6, 512);

  const brickRoad = new THREE.CanvasTexture(roadCanvas);
  brickRoad.colorSpace = THREE.SRGBColorSpace;
  brickRoad.wrapS = THREE.RepeatWrapping;
  brickRoad.wrapT = THREE.RepeatWrapping;
  brickRoad.repeat.set(1, 3);
  brickRoad.anisotropy = maxAniso;

  // 3. Carved Sal Wood (Jhya Lattice Windows)
  const woodCanvas = document.createElement('canvas');
  woodCanvas.width = 256;
  woodCanvas.height = 256;
  const wCtx = woodCanvas.getContext('2d')!;
  wCtx.fillStyle = '#2B160C';
  wCtx.fillRect(0, 0, 256, 256);
  wCtx.strokeStyle = '#4B2816';
  wCtx.lineWidth = 4;
  for (let i = 0; i < 256; i += 32) {
    wCtx.strokeRect(i + 4, 4, 24, 248);
    wCtx.beginPath();
    wCtx.moveTo(0, i);
    wCtx.lineTo(256, i);
    wCtx.stroke();
  }
  const carvedWood = new THREE.CanvasTexture(woodCanvas);
  carvedWood.colorSpace = THREE.SRGBColorSpace;
  carvedWood.wrapS = THREE.RepeatWrapping;
  carvedWood.wrapT = THREE.RepeatWrapping;
  carvedWood.anisotropy = maxAniso;

  // 4. Pagoda Terracotta & Brass Roof Tiles
  const roofCanvas = document.createElement('canvas');
  roofCanvas.width = 256;
  roofCanvas.height = 256;
  const pCtx = roofCanvas.getContext('2d')!;
  pCtx.fillStyle = '#7C2D12';
  pCtx.fillRect(0, 0, 256, 256);
  for (let x = 0; x < 256; x += 16) {
    pCtx.fillStyle = x % 32 === 0 ? '#9A3412' : '#65210B';
    pCtx.fillRect(x, 0, 14, 256);
  }
  pCtx.fillStyle = '#D97706';
  pCtx.fillRect(0, 236, 256, 20);

  const pagodaRoof = new THREE.CanvasTexture(roofCanvas);
  pagodaRoof.colorSpace = THREE.SRGBColorSpace;
  pagodaRoof.wrapS = THREE.RepeatWrapping;
  pagodaRoof.wrapT = THREE.RepeatWrapping;
  pagodaRoof.repeat.set(3, 1);
  pagodaRoof.anisotropy = maxAniso;

  // 5. Gilded Royal Palace Window Grid
  const goldCanvas = document.createElement('canvas');
  goldCanvas.width = 256;
  goldCanvas.height = 256;
  const gCtx = goldCanvas.getContext('2d')!;
  gCtx.fillStyle = '#18181B';
  gCtx.fillRect(0, 0, 256, 256);
  gCtx.strokeStyle = '#D97706';
  gCtx.lineWidth = 6;
  for (let y = 16; y < 256; y += 48) {
    for (let x = 16; x < 256; x += 32) {
      gCtx.strokeRect(x, y, 22, 36);
      gCtx.fillStyle = '#F59E0B';
      gCtx.fillRect(x + 4, y + 4, 14, 28);
    }
  }
  const palaceGold = new THREE.CanvasTexture(goldCanvas);
  palaceGold.colorSpace = THREE.SRGBColorSpace;
  palaceGold.anisotropy = maxAniso;

  return { brickWall, brickRoad, carvedWood, pagodaRoof, palaceGold };
}

/**
 * Creates a custom PBR MeshStandardMaterial shader extension using onBeforeCompile
 * that injects procedurally generated moss, weathering cracks, and uneven paver height
 * displacement GLSL noise into the 3D brick street track.
 */
export function createWeatheredBrickStreetMaterial(
  roadTexture: THREE.CanvasTexture,
  routeSeed: number = 1.0
): THREE.MeshStandardMaterial {
  const roadMat = new THREE.MeshStandardMaterial({
    map: roadTexture,
    roughness: 0.76,
    metalness: 0.08,
  });

  roadMat.userData.uTime = { value: 0 };
  roadMat.userData.uRouteSeed = { value: routeSeed };

  roadMat.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = roadMat.userData.uTime;
    shader.uniforms.uRouteSeed = roadMat.userData.uRouteSeed;

    shader.fragmentShader = `
      uniform float uTime;
      uniform float uRouteSeed;

      vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
      vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }

      float snoise(vec2 v) {
        const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                            -0.577350269189626, 0.024390243902439);
        vec2 i  = floor(v + dot(v, C.yy) );
        vec2 x0 = v -   i + dot(i, C.xx);
        vec2 i1;
        i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
        vec4 x12 = x0.xyxy + C.xxzz;
        x12.xy -= i1;
        i = mod289(i);
        vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
          + i.x + vec3(0.0, i1.x, 1.0 ));
        vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
        m = m*m ;
        m = m*m ;
        vec3 x = 2.0 * fract(p * C.www) - 1.0;
        vec3 h = abs(x) - 0.5;
        vec3 ox = floor(x + 0.5);
        vec3 a0 = x - ox;
        m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
        vec3 g;
        g.x  = a0.x  * x0.x  + h.x  * x0.y;
        g.yz = a0.yz * x12.xz + h.yz * x12.yw;
        return 130.0 * dot(m, g);
      }

      ${shader.fragmentShader}
    `;

    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <map_fragment>',
      `
      #include <map_fragment>

      #ifdef USE_MAP
        vec2 streetUv = vMapUv;
      #else
        vec2 streetUv = vec2(0.0);
      #endif

      // Procedural Newa street moss and weathering cracks
      vec2 st = streetUv * vec2(12.0, 36.0) + vec2(uRouteSeed * 7.1, uRouteSeed * 13.3);
      float mossNoise = snoise(st * 0.45);
      float detailNoise = snoise(st * 1.8);
      float crackNoise = smoothstep(0.68, 0.75, abs(snoise(st * 3.5)));

      vec3 mossColor = vec3(0.18, 0.38, 0.12);
      float mossMask = smoothstep(0.15, 0.65, mossNoise + detailNoise * 0.25);

      diffuseColor.rgb = mix(diffuseColor.rgb, mossColor, mossMask * 0.68);
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.05, 0.04), crackNoise * 0.55);
      `
    );

    shader.vertexShader = `
      uniform float uRouteSeed;
      ${shader.vertexShader}
    `;

    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
      #include <begin_vertex>
      #ifdef USE_UV
        float bump = sin(uv.x * 64.0 + uRouteSeed) * cos(uv.y * 64.0 + uRouteSeed) * 0.028;
        transformed.z += bump;
      #endif
      `
    );
  };

  return roadMat;
}

export type CreatureSkeletalState = 'RUNNING' | 'ROARING' | 'POUNCING' | 'REPELLED';

export interface ArticulatedRunnerRig {
  group: THREE.Group;
  torsoGroup: THREE.Group;
  headGroup: THREE.Group;
  leftArm: THREE.Group;
  rightArm: THREE.Group;
  leftLeg: THREE.Group;
  rightLeg: THREE.Group;
  shieldDome: THREE.Mesh;
  magnetHalo: THREE.Mesh;
}

export function createRunnerModel(runner: RunnerCharacter): ArticulatedRunnerRig {
  const group = new THREE.Group();

  const primaryMat = new THREE.MeshStandardMaterial({
    color: runner.primaryColor,
    roughness: 0.45,
    metalness: 0.15,
  });
  const secondaryMat = new THREE.MeshStandardMaterial({
    color: runner.secondaryColor,
    roughness: 0.65,
    metalness: 0.1,
  });
  const accentMat = new THREE.MeshStandardMaterial({
    color: runner.accentColor,
    roughness: 0.25,
    metalness: 0.78,
  });
  const skinMat = new THREE.MeshStandardMaterial({
    color: 0xd69e72,
    roughness: 0.55,
    metalness: 0.05,
  });

  // Soft contact shadow disc
  const shadowGeo = new THREE.CircleGeometry(0.62, 20);
  shadowGeo.rotateX(-Math.PI / 2);
  const shadowMat = new THREE.MeshBasicMaterial({
    color: 0x000000,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });
  const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
  contactShadow.position.y = 0.02;
  group.add(contactShadow);

  // Torso group
  const torsoGroup = new THREE.Group();
  torsoGroup.position.y = 1.05;
  group.add(torsoGroup);

  const torsoMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.58, 0.72, 0.34),
    primaryMat
  );
  torsoMesh.castShadow = true;
  torsoGroup.add(torsoMesh);

  const beltMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.61, 0.14, 0.37),
    accentMat
  );
  beltMesh.position.y = -0.25;
  torsoGroup.add(beltMesh);

  const packMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.42, 0.48, 0.22),
    secondaryMat
  );
  packMesh.position.set(0, 0.04, 0.26);
  packMesh.castShadow = true;
  torsoGroup.add(packMesh);

  const scrollCylinder = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.06, 0.54, 12),
    accentMat
  );
  scrollCylinder.rotation.z = Math.PI / 2;
  scrollCylinder.position.set(0, 0.32, 0.26);
  torsoGroup.add(scrollCylinder);

  // Head Group
  const headGroup = new THREE.Group();
  headGroup.position.set(0, 0.58, 0);
  torsoGroup.add(headGroup);

  const headMesh = new THREE.Mesh(
    new THREE.BoxGeometry(0.38, 0.38, 0.38),
    skinMat
  );
  headMesh.castShadow = true;
  headGroup.add(headMesh);

  if (runner.headgear === 'DHAKA_TOPI') {
    const topi = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.22, 0.22, 8),
      accentMat
    );
    topi.position.set(0, 0.24, 0);
    topi.rotation.z = 0.08;
    headGroup.add(topi);
  } else if (runner.headgear === 'ARTISAN_WRAP') {
    const headband = new THREE.Mesh(
      new THREE.TorusGeometry(0.21, 0.05, 8, 16),
      accentMat
    );
    headband.rotation.x = Math.PI / 2;
    headband.position.y = 0.14;
    headGroup.add(headband);
  } else if (runner.headgear === 'LAKHEY_MASK') {
    const maskCrown = new THREE.Mesh(
      new THREE.ConeGeometry(0.32, 0.38, 6),
      accentMat
    );
    maskCrown.position.set(0, 0.28, 0);
    headGroup.add(maskCrown);
    const mane = new THREE.Mesh(
      new THREE.BoxGeometry(0.54, 0.48, 0.26),
      primaryMat
    );
    mane.position.set(0, 0.06, 0.14);
    headGroup.add(mane);
  } else if (runner.headgear === 'MALLA_HELM') {
    const helm = new THREE.Mesh(
      new THREE.SphereGeometry(0.24, 14, 12),
      accentMat
    );
    helm.position.y = 0.12;
    headGroup.add(helm);
    const spire = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.26, 8),
      accentMat
    );
    spire.position.y = 0.36;
    headGroup.add(spire);
  }

  // Arms & Legs
  const makeArm = (xOffset: number) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(xOffset, 0.28, 0);
    const upper = new THREE.Mesh(
      new THREE.BoxGeometry(0.18, 0.56, 0.18),
      secondaryMat
    );
    upper.position.y = -0.22;
    upper.castShadow = true;
    armPivot.add(upper);

    const hand = new THREE.Mesh(
      new THREE.BoxGeometry(0.15, 0.16, 0.15),
      skinMat
    );
    hand.position.y = -0.52;
    armPivot.add(hand);
    torsoGroup.add(armPivot);
    return armPivot;
  };

  const leftArm = makeArm(-0.39);
  const rightArm = makeArm(0.39);

  const makeLeg = (xOffset: number) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(xOffset, 0.72, 0);
    const thigh = new THREE.Mesh(
      new THREE.BoxGeometry(0.22, 0.64, 0.22),
      secondaryMat
    );
    thigh.position.y = -0.3;
    thigh.castShadow = true;
    legPivot.add(thigh);

    const boot = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.16, 0.32),
      accentMat
    );
    boot.position.set(0, -0.64, -0.04);
    legPivot.add(boot);
    group.add(legPivot);
    return legPivot;
  };

  const leftLeg = makeLeg(-0.16);
  const rightLeg = makeLeg(0.16);

  const shieldDome = new THREE.Mesh(
    new THREE.SphereGeometry(1.15, 20, 16),
    new THREE.MeshPhysicalMaterial({
      color: 0x06b6d4,
      roughness: 0.1,
      metalness: 0.1,
      transmission: 0.85,
      transparent: true,
      opacity: 0.38,
      depthWrite: false,
    })
  );
  shieldDome.position.y = 1.05;
  shieldDome.visible = false;
  group.add(shieldDome);

  const magnetHalo = new THREE.Mesh(
    new THREE.TorusGeometry(0.9, 0.045, 10, 28),
    new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xd97706,
      emissiveIntensity: 0.8,
      roughness: 0.2,
      metalness: 0.9,
    })
  );
  magnetHalo.rotation.x = Math.PI / 2;
  magnetHalo.position.y = 0.15;
  magnetHalo.visible = false;
  group.add(magnetHalo);

  return {
    group,
    torsoGroup,
    headGroup,
    leftArm,
    rightArm,
    leftLeg,
    rightLeg,
    shieldDome,
    magnetHalo,
  };
}

export interface ChaserPackRig {
  group: THREE.Group;
  alphaGroup: THREE.Group;
  headGroup: THREE.Group;
  jawPivot: THREE.Group;
  leftClawArm: THREE.Group;
  rightClawArm: THREE.Group;
  leftHindLeg: THREE.Group;
  rightHindLeg: THREE.Group;
  tailPivot: THREE.Group;
  leftStalker: THREE.Group;
  rightStalker: THREE.Group;
  auraLight: THREE.PointLight;
  currentState: CreatureSkeletalState;
  stateTimer: number;
}

export function updateCreatureSkeletalAnimation(
  rig: ChaserPackRig,
  dt: number,
  elapsed: number,
  targetState: CreatureSkeletalState,
  speed: number
): void {
  if (rig.currentState !== targetState) {
    rig.currentState = targetState;
    rig.stateTimer = 0;
  }
  rig.stateTimer += dt;
  const strideFreq = elapsed * speed * 1.25;

  if (targetState === 'POUNCING') {
    rig.alphaGroup.position.y = THREE.MathUtils.damp(rig.alphaGroup.position.y, 0.12, 14, dt);
    rig.alphaGroup.rotation.x = THREE.MathUtils.damp(rig.alphaGroup.rotation.x, 0.32, 14, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0.28, 14, dt);
    rig.headGroup.rotation.z = Math.sin(elapsed * 16) * 0.08;
    rig.jawPivot.rotation.x = 0.62 + Math.abs(Math.sin(elapsed * 26)) * 0.32;

    rig.leftClawArm.rotation.x = THREE.MathUtils.damp(rig.leftClawArm.rotation.x, 0.72, 14, dt);
    rig.rightClawArm.rotation.x = THREE.MathUtils.damp(rig.rightClawArm.rotation.x, 0.72, 14, dt);

    rig.leftHindLeg.rotation.x = THREE.MathUtils.damp(rig.leftHindLeg.rotation.x, -0.65, 14, dt);
    rig.rightHindLeg.rotation.x = THREE.MathUtils.damp(rig.rightHindLeg.rotation.x, -0.65, 14, dt);

    rig.tailPivot.rotation.x = THREE.MathUtils.damp(rig.tailPivot.rotation.x, 0.45, 14, dt);
    rig.tailPivot.rotation.y = Math.sin(elapsed * 18) * 0.45;

    rig.leftStalker.position.set(-0.85, 0.32 + Math.abs(Math.sin(elapsed * 18)) * 0.25, -0.2);
    rig.rightStalker.position.set(0.85, 0.32 + Math.abs(Math.cos(elapsed * 18)) * 0.25, -0.2);

    rig.auraLight.intensity = 5.5 + Math.sin(elapsed * 30) * 1.5;
  } else if (targetState === 'ROARING') {
    rig.alphaGroup.position.y = THREE.MathUtils.damp(
      rig.alphaGroup.position.y,
      0.55 + Math.sin(elapsed * 10) * 0.1,
      12,
      dt
    );
    rig.alphaGroup.rotation.x = THREE.MathUtils.damp(rig.alphaGroup.rotation.x, -0.48, 12, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, -0.58, 12, dt);
    rig.headGroup.rotation.z = Math.sin(elapsed * 8) * 0.12;
    rig.jawPivot.rotation.x = THREE.MathUtils.damp(rig.jawPivot.rotation.x, 0.88, 14, dt);

    rig.leftClawArm.rotation.x = THREE.MathUtils.damp(rig.leftClawArm.rotation.x, -1.35, 12, dt);
    rig.rightClawArm.rotation.x = THREE.MathUtils.damp(rig.rightClawArm.rotation.x, -1.35, 12, dt);

    rig.leftHindLeg.rotation.x = THREE.MathUtils.damp(rig.leftHindLeg.rotation.x, 0.35, 12, dt);
    rig.rightHindLeg.rotation.x = THREE.MathUtils.damp(rig.rightHindLeg.rotation.x, 0.35, 12, dt);

    rig.tailPivot.rotation.y = Math.sin(elapsed * 22) * 0.75;

    rig.leftStalker.position.set(-1.65, 0.48, 0.85);
    rig.leftStalker.rotation.x = -0.4;
    rig.rightStalker.position.set(1.65, 0.48, 0.85);
    rig.rightStalker.rotation.x = -0.4;

    rig.auraLight.intensity = 4.2 + Math.sin(elapsed * 20) * 1.2;
  } else if (targetState === 'REPELLED') {
    rig.alphaGroup.position.y = THREE.MathUtils.damp(rig.alphaGroup.position.y, 0.08, 10, dt);
    rig.alphaGroup.rotation.x = THREE.MathUtils.damp(rig.alphaGroup.rotation.x, -0.28, 10, dt);
    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0.35, 10, dt);
    rig.jawPivot.rotation.x = THREE.MathUtils.damp(rig.jawPivot.rotation.x, 0.08, 10, dt);

    rig.leftClawArm.rotation.x = THREE.MathUtils.damp(rig.leftClawArm.rotation.x, -0.15, 10, dt);
    rig.rightClawArm.rotation.x = THREE.MathUtils.damp(rig.rightClawArm.rotation.x, -0.15, 10, dt);

    rig.leftStalker.position.set(-1.85, 0.15, 1.4);
    rig.rightStalker.position.set(1.85, 0.15, 1.4);

    rig.auraLight.intensity = 1.0;
  } else {
    rig.alphaGroup.position.y = Math.abs(Math.sin(strideFreq)) * 0.36;
    rig.alphaGroup.rotation.x = Math.cos(strideFreq) * 0.16;

    rig.headGroup.rotation.x = THREE.MathUtils.damp(rig.headGroup.rotation.x, 0.05, 10, dt);
    rig.headGroup.rotation.z = Math.sin(elapsed * 5.5) * 0.14;
    rig.jawPivot.rotation.x = 0.25 + Math.abs(Math.sin(elapsed * 8)) * 0.35;

    rig.leftClawArm.rotation.x = -0.5 + Math.sin(strideFreq) * 0.85;
    rig.rightClawArm.rotation.x = -0.5 - Math.sin(strideFreq) * 0.85;

    rig.leftHindLeg.rotation.x = -Math.sin(strideFreq) * 0.7;
    rig.rightHindLeg.rotation.x = Math.sin(strideFreq) * 0.7;

    rig.tailPivot.rotation.x = 0;
    rig.tailPivot.rotation.y = Math.sin(elapsed * 9) * 0.55;

    rig.leftStalker.position.set(-1.45, Math.abs(Math.cos(strideFreq * 1.15)) * 0.42, 0.85 + Math.sin(elapsed * 3.5) * 0.45);
    rig.leftStalker.rotation.x = 0;
    rig.rightStalker.position.set(1.45, Math.abs(Math.sin(strideFreq * 1.15)) * 0.42, 0.85 + Math.cos(elapsed * 3.5) * 0.45);
    rig.rightStalker.rotation.x = 0;

    rig.auraLight.intensity = 2.0 + Math.sin(elapsed * 12) * 0.5;
  }
}

export function createGuardianChaserModel(): ChaserPackRig {
  const group = new THREE.Group();

  const obsidianArmorMat = new THREE.MeshStandardMaterial({
    color: 0x1c1917,
    roughness: 0.35,
    metalness: 0.72,
  });
  const moltenCoreMat = new THREE.MeshStandardMaterial({
    color: 0xdc2626,
    emissive: 0xb91c1c,
    emissiveIntensity: 1.6,
    roughness: 0.25,
  });
  const maneGoldMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    emissive: 0x9a3412,
    emissiveIntensity: 0.55,
    roughness: 0.28,
    metalness: 0.85,
  });
  const eyeGlowMat = new THREE.MeshStandardMaterial({
    color: 0xfef08a,
    emissive: 0xef4444,
    emissiveIntensity: 3.0,
  });
  const fangMat = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.3,
  });

  const alphaGroup = new THREE.Group();
  group.add(alphaGroup);

  const auraLight = new THREE.PointLight(0xef4444, 3.2, 9.5, 1.8);
  auraLight.position.set(0, 1.6, -0.8);
  alphaGroup.add(auraLight);

  const chest = new THREE.Mesh(
    new THREE.BoxGeometry(1.38, 1.05, 1.65),
    obsidianArmorMat
  );
  chest.position.set(0, 1.15, 0);
  chest.castShadow = true;
  alphaGroup.add(chest);

  const magmaRibs = new THREE.Mesh(
    new THREE.BoxGeometry(1.42, 0.42, 1.1),
    moltenCoreMat
  );
  magmaRibs.position.set(0, 1.1, -0.1);
  alphaGroup.add(magmaRibs);

  for (let s = 0; s < 4; s++) {
    const spike = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.52, 6),
      maneGoldMat
    );
    spike.position.set(0, 1.82 - s * 0.06, -0.45 + s * 0.38);
    spike.rotation.x = -0.35;
    alphaGroup.add(spike);
  }

  const headGroup = new THREE.Group();
  headGroup.position.set(0, 1.48, -0.95);
  alphaGroup.add(headGroup);

  const flameMane = new THREE.Mesh(
    new THREE.DodecahedronGeometry(0.78, 1),
    maneGoldMat
  );
  flameMane.scale.set(1.15, 1.1, 0.65);
  flameMane.position.set(0, 0.08, 0.22);
  headGroup.add(flameMane);

  const upperSkull = new THREE.Mesh(
    new THREE.BoxGeometry(0.86, 0.58, 0.82),
    obsidianArmorMat
  );
  upperSkull.position.set(0, 0.12, -0.18);
  headGroup.add(upperSkull);

  for (const side of [-1, 1]) {
    const horn = new THREE.Mesh(
      new THREE.ConeGeometry(0.14, 0.78, 8),
      maneGoldMat
    );
    horn.position.set(side * 0.44, 0.52, -0.05);
    horn.rotation.z = side * -0.45;
    horn.rotation.x = 0.35;
    headGroup.add(horn);
  }

  const leftEye = new THREE.Mesh(
    new THREE.SphereGeometry(0.11, 10, 10),
    eyeGlowMat
  );
  leftEye.position.set(-0.24, 0.2, -0.58);
  const rightEye = leftEye.clone();
  rightEye.position.x = 0.24;
  const thirdEye = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.13, 0),
    eyeGlowMat
  );
  thirdEye.position.set(0, 0.36, -0.59);
  headGroup.add(leftEye, rightEye, thirdEye);

  for (const fx of [-0.28, -0.1, 0.1, 0.28]) {
    const fang = new THREE.Mesh(
      new THREE.ConeGeometry(0.06, 0.26, 6),
      fangMat
    );
    fang.rotation.x = Math.PI;
    fang.position.set(fx, -0.18, -0.52);
    headGroup.add(fang);
  }

  const jawPivot = new THREE.Group();
  jawPivot.position.set(0, -0.12, -0.05);
  headGroup.add(jawPivot);

  const lowerJaw = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.24, 0.76),
    moltenCoreMat
  );
  lowerJaw.position.set(0, -0.12, -0.28);
  jawPivot.add(lowerJaw);

  for (const fx of [-0.24, 0.24]) {
    const lowerTusk = new THREE.Mesh(
      new THREE.ConeGeometry(0.07, 0.3, 6),
      fangMat
    );
    lowerTusk.position.set(fx, 0.08, -0.58);
    jawPivot.add(lowerTusk);
  }

  const makeClawArm = (side: -1 | 1) => {
    const armPivot = new THREE.Group();
    armPivot.position.set(side * 0.78, 1.15, -0.55);
    const shoulder = new THREE.Mesh(
      new THREE.BoxGeometry(0.36, 0.88, 0.36),
      obsidianArmorMat
    );
    shoulder.position.y = -0.35;
    shoulder.castShadow = true;
    armPivot.add(shoulder);

    for (const cx of [-0.09, 0, 0.09]) {
      const claw = new THREE.Mesh(
        new THREE.ConeGeometry(0.045, 0.28, 6),
        fangMat
      );
      claw.rotation.x = -Math.PI / 2.2;
      claw.position.set(cx, -0.78, -0.22);
      armPivot.add(claw);
    }
    alphaGroup.add(armPivot);
    return armPivot;
  };
  const leftClawArm = makeClawArm(-1);
  const rightClawArm = makeClawArm(1);

  const makeHindLeg = (side: -1 | 1) => {
    const legPivot = new THREE.Group();
    legPivot.position.set(side * 0.62, 0.95, 0.58);
    const haunch = new THREE.Mesh(
      new THREE.BoxGeometry(0.34, 0.85, 0.38),
      obsidianArmorMat
    );
    haunch.position.y = -0.35;
    haunch.castShadow = true;
    legPivot.add(haunch);
    alphaGroup.add(legPivot);
    return legPivot;
  };
  const leftHindLeg = makeHindLeg(-1);
  const rightHindLeg = makeHindLeg(1);

  const tailPivot = new THREE.Group();
  tailPivot.position.set(0, 1.25, 0.82);
  const tailRod = new THREE.Mesh(
    new THREE.CylinderGeometry(0.06, 0.14, 1.35, 8),
    obsidianArmorMat
  );
  tailRod.rotation.x = Math.PI / 3;
  tailRod.position.set(0, 0.35, 0.55);
  const tailMace = new THREE.Mesh(
    new THREE.OctahedronGeometry(0.26, 0),
    moltenCoreMat
  );
  tailMace.position.set(0, 0.72, 1.05);
  tailPivot.add(tailRod, tailMace);
  alphaGroup.add(tailPivot);

  const makeShadowStalker = (xOffset: number) => {
    const stalker = new THREE.Group();
    stalker.position.set(xOffset, 0, 0.85);

    const sBody = new THREE.Mesh(
      new THREE.BoxGeometry(0.62, 0.52, 0.98),
      obsidianArmorMat
    );
    sBody.position.y = 0.58;
    sBody.castShadow = true;

    const sHead = new THREE.Mesh(
      new THREE.ConeGeometry(0.36, 0.58, 6),
      obsidianArmorMat
    );
    sHead.rotation.x = -Math.PI / 2;
    sHead.position.set(0, 0.76, -0.58);

    const sEyeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.065, 8, 8),
      eyeGlowMat
    );
    sEyeL.position.set(-0.14, 0.84, -0.68);
    const sEyeR = sEyeL.clone();
    sEyeR.position.x = 0.14;

    const sCrest = new THREE.Mesh(
      new THREE.BoxGeometry(0.12, 0.28, 0.72),
      moltenCoreMat
    );
    sCrest.position.set(0, 0.88, -0.05);

    stalker.add(sBody, sHead, sEyeL, sEyeR, sCrest);
    group.add(stalker);
    return stalker;
  };

  const leftStalker = makeShadowStalker(-1.45);
  const rightStalker = makeShadowStalker(1.45);

  return {
    group,
    alphaGroup,
    headGroup,
    jawPivot,
    leftClawArm,
    rightClawArm,
    leftHindLeg,
    rightHindLeg,
    tailPivot,
    leftStalker,
    rightStalker,
    auraLight,
    currentState: 'RUNNING',
    stateTimer: 0,
  };
}

/**
 * Creates distinct 3D architectural archetypes per Bhaktapur landmark:
 * - 55-Window Malla Royal Palace (Layaku)
 * - 5-Tiered Nyatapola Pagoda (Taumadhi)
 * - 3-Tiered Dattatreya Temple with Peacock Window (Tachupal)
 * - Open Pottery Drying Yard with 50+ pots (Talako)
 * - Siddha Pokhari Royal Reflection Pond
 * - Standard Newa Bazaar Row Houses with ground-floor shops
 */
export function createLandmarkSpecificBuilding(
  type: '55_WINDOW_PALACE' | 'NYATAPOLA_PAGODA' | 'DATTATREYA_TEMPLE' | 'POTTERY_YARD' | 'SIDDHA_POKHARI' | 'NEWA_BAZAAR_HOUSE',
  textures: ProceduralTexturePack,
  seed: number
): THREE.Group {
  const group = new THREE.Group();

  const brickMat = new THREE.MeshStandardMaterial({
    map: textures.brickWall,
    roughness: 0.78,
    metalness: 0.08,
  });
  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.carvedWood,
    roughness: 0.62,
    metalness: 0.12,
  });
  const roofMat = new THREE.MeshStandardMaterial({
    map: textures.pagodaRoof,
    roughness: 0.48,
    metalness: 0.32,
  });
  const goldMat = new THREE.MeshStandardMaterial({
    map: textures.palaceGold,
    color: 0xf59e0b,
    roughness: 0.22,
    metalness: 0.88,
  });
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.7,
    metalness: 0.1,
  });

  if (type === '55_WINDOW_PALACE') {
    // Royal Malla 55-Window Palace Facade
    const palace = new THREE.Mesh(
      new THREE.BoxGeometry(16, 7.5, 3.8),
      brickMat
    );
    palace.position.y = 3.75;
    palace.castShadow = true;
    group.add(palace);

    // Continuous 55-Window Gold & Black Lattice Gallery
    const gallery = new THREE.Mesh(
      new THREE.BoxGeometry(15.2, 1.8, 4.1),
      goldMat
    );
    gallery.position.y = 5.2;
    group.add(gallery);

    // Golden Gate (Lu Dhowka) Portal
    const goldenGate = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 3.5, 4.2),
      goldMat
    );
    goldenGate.position.set(0, 1.75, 0.1);
    group.add(goldenGate);

    // Twin Brass Guard Lions on Plinths
    for (const lx of [-2.4, 2.4]) {
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(0.9, 0.6, 0.9),
        brickMat
      );
      plinth.position.set(lx, 0.3, 2.3);
      const lion = new THREE.Mesh(
        new THREE.DodecahedronGeometry(0.38),
        goldMat
      );
      lion.position.set(lx, 0.88, 2.3);
      group.add(plinth, lion);
    }
  } else if (type === 'NYATAPOLA_PAGODA') {
    // 5-Tiered Nyatapola Pagoda on 5 Stepped Plinths
    for (let p = 0; p < 5; p++) {
      const w = 8.5 - p * 0.95;
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(w, 0.6, w),
        brickMat
      );
      plinth.position.y = p * 0.6 + 0.3;
      plinth.castShadow = true;
      group.add(plinth);

      // Guardian Statue pairs on each plinth step (Wrestlers, Elephants, Lions, Griffins, Goddesses)
      for (const sx of [-w * 0.38, w * 0.38]) {
        const guardian = new THREE.Mesh(
          new THREE.BoxGeometry(0.42, 0.65, 0.42),
          new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.8 })
        );
        guardian.position.set(sx, p * 0.6 + 0.88, w * 0.38);
        group.add(guardian);
      }
    }

    let currY = 3.0;
    for (let t = 0; t < 5; t++) {
      const coreW = 4.2 - t * 0.55;
      const coreH = 1.6;
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(coreW, coreH, coreW),
        t === 0 ? woodMat : brickMat
      );
      core.position.y = currY + coreH / 2;
      core.castShadow = true;
      group.add(core);

      const roofCone = new THREE.Mesh(
        new THREE.ConeGeometry((coreW + 1.8) * 0.72, 1.1, 4),
        roofMat
      );
      roofCone.rotation.y = Math.PI / 4;
      roofCone.position.y = currY + coreH + 0.42;
      roofCone.castShadow = true;
      group.add(roofCone);

      currY += coreH + 0.68;
    }

    const gajur = new THREE.Mesh(
      new THREE.ConeGeometry(0.48, 1.6, 12),
      goldMat
    );
    gajur.position.y = currY + 0.75;
    group.add(gajur);
  } else if (type === 'DATTATREYA_TEMPLE') {
    // 3-Tiered Dattatreya Temple + Peacock Window Bay
    for (let p = 0; p < 2; p++) {
      const plinth = new THREE.Mesh(
        new THREE.BoxGeometry(7.2 - p * 0.8, 0.6, 7.2 - p * 0.8),
        brickMat
      );
      plinth.position.y = p * 0.6 + 0.3;
      group.add(plinth);
    }

    let currY = 1.2;
    for (let t = 0; t < 3; t++) {
      const coreW = 4.5 - t * 0.65;
      const coreH = 1.7;
      const core = new THREE.Mesh(
        new THREE.BoxGeometry(coreW, coreH, coreW),
        woodMat
      );
      core.position.y = currY + coreH / 2;
      group.add(core);

      const roofCone = new THREE.Mesh(
        new THREE.ConeGeometry((coreW + 1.6) * 0.75, 1.2, 4),
        roofMat
      );
      roofCone.rotation.y = Math.PI / 4;
      roofCone.position.y = currY + coreH + 0.45;
      group.add(roofCone);

      currY += coreH + 0.75;
    }

    // World Famous Peacock Window (Mhaykha Jhya) attached to side
    const peacockWindow = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 1.8, 0.35),
      woodMat
    );
    peacockWindow.position.set(0, 2.8, 2.4);
    group.add(peacockWindow);
  } else if (type === 'POTTERY_YARD') {
    // Open Talako Pottery Square Drying Yard with 50+ Pots
    const yardFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 18),
      new THREE.MeshStandardMaterial({ map: textures.brickWall, roughness: 0.8 })
    );
    yardFloor.rotation.x = -Math.PI / 2;
    yardFloor.position.y = 0.05;
    group.add(yardFloor);

    // Rows of sun-drying clay pots
    for (let px = -4.5; px <= 4.5; px += 1.2) {
      for (let pz = -7; pz <= 7; pz += 1.4) {
        const pot = new THREE.Mesh(
          new THREE.SphereGeometry(0.24, 8, 8),
          clayMat
        );
        pot.position.set(px + ((pz * 3) % 0.3), 0.22, pz);
        pot.castShadow = true;
        group.add(pot);
      }
    }

    // Potter's wheel pavilion
    const pavilion = new THREE.Mesh(
      new THREE.BoxGeometry(3.2, 2.4, 3.2),
      woodMat
    );
    pavilion.position.set(0, 1.2, -6.5);
    group.add(pavilion);
  } else if (type === 'SIDDHA_POKHARI') {
    // Siddha Pokhari Royal Pond
    const pondWater = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 22),
      new THREE.MeshStandardMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.35,
        roughness: 0.08,
        metalness: 0.3,
      })
    );
    pondWater.rotation.x = -Math.PI / 2;
    pondWater.position.y = 0.04;
    group.add(pondWater);

    // Carved Stone Balustrades along Pond Edge
    for (let z = -10; z <= 10; z += 2.5) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.32, 0.85, 0.32),
        new THREE.MeshStandardMaterial({ color: 0x78716c, roughness: 0.7 })
      );
      post.position.set(6.8, 0.42, z);
      group.add(post);
    }
  } else {
    // Standard Newa Bazaar Row House with Ground Floor Shops (Pati)
    const width = 4.8 + (seed % 3) * 0.8;
    const height = 7.2 + (seed % 3) * 1.5;

    const groundShop = new THREE.Mesh(
      new THREE.BoxGeometry(width, 2.4, 4.5),
      woodMat
    );
    groundShop.position.y = 1.2;
    group.add(groundShop);

    const upperBrick = new THREE.Mesh(
      new THREE.BoxGeometry(width + 0.1, height - 2.4, 4.6),
      brickMat
    );
    upperBrick.position.y = 2.4 + (height - 2.4) / 2;
    group.add(upperBrick);

    // Protruding Carved Lattice Window Bay
    const windowBay = new THREE.Mesh(
      new THREE.BoxGeometry(width * 0.7, 1.4, 4.9),
      woodMat
    );
    windowBay.position.y = 4.4;
    group.add(windowBay);

    const roof = new THREE.Mesh(
      new THREE.ConeGeometry(width * 0.8, 1.5, 4),
      roofMat
    );
    roof.rotation.y = Math.PI / 4;
    roof.position.y = height + 0.65;
    group.add(roof);
  }

  return group;
}

export function createObstacleMesh(
  type: ObstacleType,
  textures: ProceduralTexturePack
): THREE.Group {
  const group = new THREE.Group();

  const woodMat = new THREE.MeshStandardMaterial({
    map: textures.carvedWood,
    roughness: 0.6,
    metalness: 0.15,
  });
  const brassMat = new THREE.MeshStandardMaterial({
    color: 0xd97706,
    roughness: 0.25,
    metalness: 0.88,
  });
  const clayMat = new THREE.MeshStandardMaterial({
    color: 0xc2410c,
    roughness: 0.68,
    metalness: 0.08,
  });
  const stoneMat = new THREE.MeshStandardMaterial({
    color: 0x78716c,
    roughness: 0.75,
    metalness: 0.15,
  });

  if (type === 'CHARIOT') {
    const deck = new THREE.Mesh(
      new THREE.BoxGeometry(2.0, 0.35, 1.8),
      woodMat
    );
    deck.position.y = 0.72;
    deck.castShadow = true;
    group.add(deck);

    const shrine = new THREE.Mesh(
      new THREE.BoxGeometry(1.1, 0.65, 1.1),
      new THREE.MeshStandardMaterial({ color: 0xb91c1c, roughness: 0.5 })
    );
    shrine.position.y = 1.2;
    group.add(shrine);

    const canopy = new THREE.Mesh(
      new THREE.ConeGeometry(0.95, 0.5, 4),
      brassMat
    );
    canopy.rotation.y = Math.PI / 4;
    canopy.position.y = 1.72;
    group.add(canopy);

    const wheelOffsets = [
      [-1.02, 0.62, -0.6],
      [1.02, 0.62, -0.6],
      [-1.02, 0.62, 0.6],
      [1.02, 0.62, 0.6],
    ];
    for (const [wx, wy, wz] of wheelOffsets) {
      const wheel = new THREE.Mesh(
        new THREE.CylinderGeometry(0.62, 0.62, 0.16, 16),
        woodMat
      );
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(wx, wy, wz);
      wheel.castShadow = true;
      group.add(wheel);

      const hub = new THREE.Mesh(
        new THREE.CylinderGeometry(0.18, 0.18, 0.22, 12),
        brassMat
      );
      hub.rotation.z = Math.PI / 2;
      hub.position.set(wx, wy, wz);
      group.add(hub);
    }
  } else if (type === 'HANGING_BELLS') {
    const leftPost = new THREE.Mesh(
      new THREE.BoxGeometry(0.28, 3.2, 0.28),
      woodMat
    );
    leftPost.position.set(-1.15, 1.6, 0);
    const rightPost = leftPost.clone();
    rightPost.position.x = 1.15;

    const lintel = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 0.36, 0.38),
      woodMat
    );
    lintel.position.set(0, 2.95, 0);
    group.add(leftPost, rightPost, lintel);

    for (const bx of [-0.65, 0, 0.65]) {
      const chain = new THREE.Mesh(
        new THREE.CylinderGeometry(0.03, 0.03, 0.9, 8),
        brassMat
      );
      chain.position.set(bx, 2.4, 0);
      const bell = new THREE.Mesh(
        new THREE.ConeGeometry(0.34, 0.72, 14),
        brassMat
      );
      bell.position.set(bx, 1.62, 0);
      bell.castShadow = true;
      const clapper = new THREE.Mesh(
        new THREE.SphereGeometry(0.1, 8, 8),
        brassMat
      );
      clapper.position.set(bx, 1.22, 0);
      group.add(chain, bell, clapper);
    }
  } else if (type === 'LOW_ROOF') {
    const leftPillar = new THREE.Mesh(
      new THREE.BoxGeometry(0.32, 3.0, 0.32),
      woodMat
    );
    leftPillar.position.set(-1.15, 1.5, 0);
    const rightPillar = leftPillar.clone();
    rightPillar.position.x = 1.15;

    const carvedArch = new THREE.Mesh(
      new THREE.BoxGeometry(2.6, 1.25, 0.55),
      woodMat
    );
    carvedArch.position.set(0, 2.05, 0);
    carvedArch.castShadow = true;

    const toranBanner = new THREE.Mesh(
      new THREE.BoxGeometry(2.2, 0.35, 0.6),
      new THREE.MeshStandardMaterial({
        color: 0xdc2626,
        roughness: 0.4,
        metalness: 0.2,
      })
    );
    toranBanner.position.set(0, 1.38, 0);
    group.add(leftPillar, rightPillar, carvedArch, toranBanner);
  } else if (type === 'POTTERY_STALL') {
    const table = new THREE.Mesh(
      new THREE.BoxGeometry(2.1, 0.55, 1.2),
      woodMat
    );
    table.position.y = 0.28;
    table.castShadow = true;
    group.add(table);

    const potterWheel = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.42, 0.12, 16),
      stoneMat
    );
    potterWheel.position.set(-0.45, 0.62, 0);
    group.add(potterWheel);

    const potPositions = [
      [-0.45, 0.92, 0, 0.26, 0.48],
      [0.35, 0.85, -0.2, 0.32, 0.58],
      [0.68, 0.78, 0.22, 0.24, 0.42],
      [0.05, 0.82, 0.28, 0.28, 0.5],
    ];
    for (const [px, py, pz, r, h] of potPositions) {
      const potBody = new THREE.Mesh(
        new THREE.SphereGeometry(r, 12, 10),
        clayMat
      );
      potBody.scale.y = h / (r * 2);
      potBody.position.set(px, py, pz);
      potBody.castShadow = true;

      const potRim = new THREE.Mesh(
        new THREE.TorusGeometry(r * 0.55, 0.04, 8, 12),
        clayMat
      );
      potRim.rotation.x = Math.PI / 2;
      potRim.position.set(px, py + h * 0.45, pz);
      group.add(potBody, potRim);
    }
  } else if (type === 'TEMPLE_GUARDIAN') {
    const plinth = new THREE.Mesh(
      new THREE.BoxGeometry(1.6, 0.55, 1.6),
      stoneMat
    );
    plinth.position.y = 0.28;
    group.add(plinth);

    const torso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.55, 1.15, 10),
      stoneMat
    );
    torso.position.y = 1.1;
    torso.castShadow = true;
    group.add(torso);

    const lionHead = new THREE.Mesh(
      new THREE.DodecahedronGeometry(0.48, 0),
      stoneMat
    );
    lionHead.position.set(0, 1.82, -0.1);
    lionHead.castShadow = true;
    group.add(lionHead);

    const collar = new THREE.Mesh(
      new THREE.TorusGeometry(0.44, 0.06, 8, 16),
      brassMat
    );
    collar.rotation.x = Math.PI / 2;
    collar.position.y = 1.52;
    group.add(collar);
  } else if (type === 'FIRE_TRAP') {
    const basin = new THREE.Mesh(
      new THREE.CylinderGeometry(0.85, 0.58, 0.55, 12),
      brassMat
    );
    basin.position.y = 0.28;
    basin.castShadow = true;
    group.add(basin);

    const outerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xf97316,
      emissive: 0xea580c,
      emissiveIntensity: 1.9,
      roughness: 0.2,
    });
    const innerFlameMat = new THREE.MeshStandardMaterial({
      color: 0xfef08a,
      emissive: 0xfacc15,
      emissiveIntensity: 2.5,
      roughness: 0.1,
    });

    for (const fx of [-0.38, 0, 0.38]) {
      const flame = new THREE.Mesh(
        new THREE.ConeGeometry(0.32, 1.05, 8),
        outerFlameMat
      );
      flame.position.set(fx, 0.95, 0);
      const core = new THREE.Mesh(
        new THREE.ConeGeometry(0.18, 0.75, 8),
        innerFlameMat
      );
      core.position.set(fx, 0.85, 0.05);
      group.add(flame, core);
    }
  } else if (type === 'ALLEY_GAP') {
    const pitVoid = new THREE.Mesh(
      new THREE.BoxGeometry(2.35, 0.12, 2.8),
      new THREE.MeshBasicMaterial({ color: 0x050507 })
    );
    pitVoid.position.y = 0.03;
    group.add(pitVoid);

    const waterStrip = new THREE.Mesh(
      new THREE.BoxGeometry(1.9, 0.08, 1.6),
      new THREE.MeshStandardMaterial({
        color: 0x06b6d4,
        emissive: 0x0891b2,
        emissiveIntensity: 0.7,
        roughness: 0.15,
      })
    );
    waterStrip.position.y = 0.06;
    group.add(waterStrip);

    const frontLip = new THREE.Mesh(
      new THREE.BoxGeometry(2.4, 0.26, 0.25),
      clayMat
    );
    frontLip.position.set(0, 0.13, 1.35);
    const backLip = frontLip.clone();
    backLip.position.z = -1.35;
    group.add(frontLip, backLip);
  }

  return group;
}

export function createCollectibleMesh(type: CollectibleType): THREE.Group {
  const group = new THREE.Group();

  if (type === 'MALLA_COIN') {
    const goldMat = new THREE.MeshStandardMaterial({
      color: 0xfbbf24,
      emissive: 0xd97706,
      emissiveIntensity: 0.45,
      roughness: 0.18,
      metalness: 0.92,
    });
    const coinDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(0.38, 0.38, 0.09, 16),
      goldMat
    );
    coinDisc.rotation.x = Math.PI / 2;

    const innerSquare = new THREE.Mesh(
      new THREE.BoxGeometry(0.24, 0.24, 0.12),
      new THREE.MeshStandardMaterial({
        color: 0x92400e,
        roughness: 0.3,
        metalness: 0.8,
      })
    );
    group.add(coinDisc, innerSquare);
  } else if (type === 'JUJU_DHAU') {
    const clayBowl = new THREE.Mesh(
      new THREE.CylinderGeometry(0.42, 0.28, 0.34, 14),
      new THREE.MeshStandardMaterial({
        color: 0xc2410c,
        roughness: 0.65,
        metalness: 0.1,
      })
    );
    const curdTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.38, 14, 10),
      new THREE.MeshStandardMaterial({
        color: 0xfef3c7,
        emissive: 0xfde68a,
        emissiveIntensity: 0.35,
        roughness: 0.3,
      })
    );
    curdTop.scale.y = 0.45;
    curdTop.position.y = 0.14;
    group.add(clayBowl, curdTop);
  } else if (type === 'SUKUNDA_LAMP') {
    const brassMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      emissive: 0xb45309,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      metalness: 0.92,
    });
    const base = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.34, 0.22, 12),
      brassMat
    );
    const vessel = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 12, 10),
      brassMat
    );
    vessel.position.y = 0.24;

    const flame = new THREE.Mesh(
      new THREE.ConeGeometry(0.16, 0.42, 8),
      new THREE.MeshStandardMaterial({
        color: 0x38bdf8,
        emissive: 0x06b6d4,
        emissiveIntensity: 2.2,
      })
    );
    flame.position.set(0, 0.56, 0);
    group.add(base, vessel, flame);
  }

  return group;
}
