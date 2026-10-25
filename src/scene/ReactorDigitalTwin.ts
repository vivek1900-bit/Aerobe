import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';
import { SMAAPass } from 'three/addons/postprocessing/SMAAPass.js';
import { createVortexMaterial, createDashedLineMaterial } from './fluidShader';
import { useConsoleStore } from '../console/store';
import { clamp01, smootherstep, BOUNDARIES, WINDOW } from './scroll';

// ─────────────────────────────────────────────────────────────────────────────
// Aerobe // 300L Bioreactor Digital Twin — dark studio product render.
// §1 renderer (#04070d void + linear fog, ACES 1.1, dpr [1,1.75]) · §2 procedural
// drei-style Lightformer environment (no downloaded HDRs) · §3 PBR materials ·
// §4 headplate/impeller/baffle detail + bubbles/probes/leader-lines · §5 camera
// fov 35 @ [0,1.4,10] · §6 grid. Scroll inertia loop + chapter crossfade kept.
// ─────────────────────────────────────────────────────────────────────────────

export interface TwinCallbacks {
  /** Called every frame with the damped scroll scalar (0..1). */
  onProgress?: (progress: number) => void;
}

export interface TwinOptions {
  /** 'high' = full transmission glass + MSAA; 'low' = cheap transparent fallback. */
  quality?: 'high' | 'low';
}

interface ProbeData {
  baseX: number;
  baseZ: number;
  baseY: number;
}

// Lathe a chamfered (bevelled) disc — a thick cylinder with a crisp 45° chamfer and a
// slight bevel on every edge (≥12 profile points so edges catch highlights, not blocky).
function bevelledDisc(radius: number, height: number, chamfer: number, segments: number) {
  const r = radius;
  const h = height / 2;
  const c = chamfer;
  const pts = [
    new THREE.Vector2(0, -h), // 1  bottom centre
    new THREE.Vector2(r - c, -h), // 2  bottom face (outer)
    new THREE.Vector2(r - c * 0.6, -h + c * 0.4), // 3  bottom bevel arc
    new THREE.Vector2(r, -h + c), // 4  bottom chamfer outer
    new THREE.Vector2(r, -h + 2 * c), // 5  side (lower)
    new THREE.Vector2(r, -h / 2), // 6  side (mid-lower)
    new THREE.Vector2(r, 0), // 7  side (mid)
    new THREE.Vector2(r, h / 2), // 8  side (mid-upper)
    new THREE.Vector2(r, h - 2 * c), // 9  side (upper)
    new THREE.Vector2(r, h - c), // 10 top chamfer outer
    new THREE.Vector2(r - c * 0.6, h - c * 0.4), // 11 top bevel arc
    new THREE.Vector2(r - c, h), // 12 top face (outer)
    new THREE.Vector2(0, h), // 13 top centre
  ];
  return new THREE.LatheGeometry(pts, segments);
}

// Canvas-generated brushed-metal roughness map (1024², fine horizontal streaks).
// Grey values encode roughness 0.28 → 0.40; used as a data map (linear, not sRGB).
function createBrushedMetalRoughness(): THREE.CanvasTexture {
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  for (let y = 0; y < size; y++) {
    const v = Math.round((0.28 + Math.random() * 0.12) * 255);
    ctx.fillStyle = `rgb(${v},${v},${v})`;
    ctx.fillRect(0, y, size, 1);
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace; // roughness is linear data, not sRGB
  tex.needsUpdate = true;
  return tex;
}

// Subtle concentric-ripple normal map for the liquid top surface.
function createRippleNormal(): THREE.CanvasTexture {
  const size = 256;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = 'rgb(128,128,255)'; // flat normal
  ctx.fillRect(0, 0, size, size);
  for (let r = 12; r < size * 0.72; r += 9) {
    ctx.strokeStyle = 'rgba(118,118,255,0.9)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, r, 0, Math.PI * 2);
    ctx.stroke();
  }
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.colorSpace = THREE.NoColorSpace;
  return tex;
}

// Soft radial glow texture for additive halo sprites (probe tips).
function createGlowTexture(): THREE.CanvasTexture {
  const size = 128;
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 4, 64, 64, 64);
  g.addColorStop(0, 'rgba(255,255,255,1)');
  g.addColorStop(0.35, 'rgba(255,255,255,0.45)');
  g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

export class ReactorDigitalTwin {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private composer: EffectComposer;
  private pmrem!: THREE.PMREMGenerator;
  private envRT!: THREE.WebGLRenderTarget;
  private clock = new THREE.Clock();

  private borosilicateGlass: THREE.MeshPhysicalMaterial;
  private wireframeCyan: THREE.MeshBasicMaterial;
  private vortexMaterial: THREE.ShaderMaterial;

  private masterRig = new THREE.Group();
  private headplateGroup = new THREE.Group();
  private impellerGroup = new THREE.Group();
  private basePlinthGroup = new THREE.Group();
  private probeSensors: THREE.Group[] = [];

  private baseHeadplateY = 0;
  private baseImpellerY = 0;
  private basePlinthY = 0;

  private instancedBubbles!: THREE.InstancedMesh;
  private bubbleData: { theta: number; rad: number; y: number; radius: number; phase: number }[] = [];
  private bubbleDummy = new THREE.Object3D();
  private readonly bubbleCount: number;
  private leaderLines: { material: THREE.ShaderMaterial }[] = [];

  private cameraSpline: THREE.CatmullRomCurve3;
  private targetSpline: THREE.CatmullRomCurve3;

  private smoothProgress = 0;
  private targetProgress = 0;
  private rpm = 420;
  private wireframeActive = false;
  private running = false; // STANDBY by default — the tour demo opts in via setRunning(true)
  private mouseX = 0;
  private mouseY = 0;
  private rafId = 0;
  private disposed = false;
  private readonly reducedMotion: boolean;
  private readonly quality: 'high' | 'low';

  private container: HTMLElement;
  private callbacks: TwinCallbacks;
  private resizeObserver: ResizeObserver | null = null;
  private pixelRatio = 1;

  constructor(
    container: HTMLElement,
    callbacks: TwinCallbacks = {},
    options: TwinOptions = {},
  ) {
    this.container = container;
    this.callbacks = callbacks;
    this.quality = options.quality ?? 'high';
    this.bubbleCount = this.quality === 'high' ? 160 : 40;
    this.reducedMotion =
      typeof window !== 'undefined' &&
      !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    // §1 renderer — high-performance, ACES 1.1, DPR [1,2] high / 1 low, MSAA via composer.
    this.pixelRatio = this.quality === 'high' ? Math.min(window.devicePixelRatio, 2) : 1;
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setPixelRatio(this.pixelRatio);
    this.renderer.setSize(width, height, false); // canvas CSS stays 100% (stylesheet)
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null; // transparent — .hero-glow shows through
    this.scene.fog = new THREE.Fog(0x0b0c0e, 12, 30);

    // §5 camera — fov 35, hero [0, 1.4, 10] looking at [0, 0.7, 0]
    this.camera = new THREE.PerspectiveCamera(35, width / height, 0.1, 100);
    this.camera.position.set(0, 1.4, 10);

    // §2 procedural studio environment (drei Environment + Lightformer equivalent)
    this.buildEnvironment();

    // §3 materials
    this.borosilicateGlass =
      this.quality === 'low'
        ? new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transparent: true,
            opacity: 0.18,
            roughness: 0.05,
          })
        : new THREE.MeshPhysicalMaterial({
            color: 0xffffff,
            transmission: 1,
            thickness: 0.3,
            roughness: 0.04,
            ior: 1.45,
            clearcoat: 1,
            clearcoatRoughness: 0.05,
            attenuationColor: new THREE.Color(0xffd9a0),
            attenuationDistance: 3,
            transparent: true,
          });
    this.wireframeCyan = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      wireframe: true,
      transparent: true,
      opacity: 0,
    });
    this.vortexMaterial = createVortexMaterial();

    this.buildLights();
    this.buildReactor();

    // Scroll camera — rebased around the fov-35 hero framing
    this.cameraSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 1.4, 10), // 01 overview — hero
      new THREE.Vector3(3.2, 1.7, 9), // 02 exploded oblique
      new THREE.Vector3(-2.8, 0.7, 8.6), // 03 CAD inspection
      new THREE.Vector3(0, 1.2, 9.4), // 04 operations
    ]);
    this.targetSpline = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.7, 0), // 01 look at vessel centre
      new THREE.Vector3(0, 1.0, 0), // 02 raised toward the headplate
      new THREE.Vector3(0, 0.5, 0), // 03 lower toward the broth
      new THREE.Vector3(0, 0.7, 0), // 04 back to centre
    ]);

    // Post-processing — MSAA (high) / SMAA (low); no bloom (keeps the canvas transparent).
    const composerTarget = new THREE.WebGLRenderTarget(width, height, {
      type: THREE.HalfFloatType,
      samples: this.quality === 'high' ? 4 : 0,
    });
    this.composer = new EffectComposer(this.renderer, composerTarget);
    this.composer.addPass(new RenderPass(this.scene, this.camera));
    this.composer.addPass(new OutputPass());
    if (this.quality === 'low') {
      this.composer.addPass(new SMAAPass(width, height));
    }
    this.composer.setPixelRatio(this.pixelRatio);
    this.composer.setSize(width, height);

    this.applyResponsiveShift(width);
    this.bindEvents();
  }

  // ── §2 procedural Lightformer environment ──────────────────────────────────
  private buildEnvironment() {
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color(0x02040a); // near-black void — steel reflects dark space

    // Narrow emissive strips only (no softboxes) so the steel picks up crisp strips.
    const addStrip = (
      w: number,
      h: number,
      color: number,
      intensity: number,
      x: number,
      y: number,
      z: number,
    ) => {
      const mat = new THREE.MeshBasicMaterial({
        color: new THREE.Color(color).multiplyScalar(intensity),
        side: THREE.DoubleSide,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
      mesh.position.set(x, y, z);
      mesh.lookAt(0, 0, 0);
      envScene.add(mesh);
    };

    // (a) tall thin cool-white strip — top-left
    addStrip(0.4, 10, 0xdbe9ff, 6, -6, 5, 2);
    // (b) long thin horizontal strip — above
    addStrip(12, 0.4, 0xffffff, 4, 0, 8, 0);
    // (c) thin cool-blue strip — low right
    addStrip(0.4, 6, 0x2f8cff, 2, 6, -2, 1);
    // (d) small warm strip — low left
    addStrip(0.5, 2, 0xf2a93b, 3, -5, -2, 0);

    this.pmrem = new THREE.PMREMGenerator(this.renderer);
    this.envRT = this.pmrem.fromScene(envScene, 0.04); // 256px cubemap (three default)
    this.scene.environment = this.envRT.texture;
    this.scene.environmentIntensity = 0.9;

    // Dispose the one-shot env scene resources
    envScene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry.dispose();
        (mesh.material as THREE.Material).dispose();
      }
    });
  }

  // ── §2 lighting rig ────────────────────────────────────────────────────────
  private buildLights() {
    // Key — cool-white directional, front-left-top, tight 2048 shadow frustum.
    const key = new THREE.DirectionalLight(0xcfe3ff, 1.6);
    key.position.set(5, 7, 5);
    key.castShadow = true;
    key.shadow.mapSize.set(2048, 2048);
    key.shadow.camera.near = 1;
    key.shadow.camera.far = 20;
    key.shadow.camera.left = -4;
    key.shadow.camera.right = 4;
    key.shadow.camera.top = 4;
    key.shadow.camera.bottom = -4;
    key.shadow.bias = -0.0004;
    key.shadow.normalBias = 0.02;
    this.scene.add(key);

    // Rim — cool blue directional, back-right (thin specular edge, no wash).
    const rim = new THREE.DirectionalLight(0x2f8cff, 1.2);
    rim.position.set(-6, 2, -6);
    this.scene.add(rim);

    // Back-top white spotlight, narrow angle, aimed at the headplate edge (rim line).
    const edgeSpot = new THREE.SpotLight(0xffffff, 3, 40, 0.35, 0.5, 2);
    edgeSpot.position.set(0, 8, -6);
    edgeSpot.target.position.set(0, 1.85, 0);
    this.scene.add(edgeSpot);
    this.scene.add(edgeSpot.target);

    // Warm amber point light at the liquid centre (≥0.6 from every wall, no hot spot).
    const broth = new THREE.PointLight(0xf2a93b, 6, 5);
    broth.position.set(0, -0.5, 0);
    this.scene.add(broth);
  }

  // ── §3/§4 reactor CAD assembly ─────────────────────────────────────────────
  private buildReactor() {
    // Steel — brushed-metal roughness map (0.28–0.40) + max anisotropy for crisp streaks.
    const brushedRoughness = createBrushedMetalRoughness();
    brushedRoughness.anisotropy = this.renderer.capabilities.getMaxAnisotropy();
    brushedRoughness.needsUpdate = true;
    const steel = new THREE.MeshStandardMaterial({
      color: 0xaeb7c0,
      metalness: 1,
      roughness: 1, // fully driven by roughnessMap (0.28–0.40)
      envMapIntensity: 1.6,
      roughnessMap: brushedRoughness,
    });
    // Dark matte steel — drive housing & baffles (#3a4048, roughness 0.45).
    const darkSteel = new THREE.MeshStandardMaterial({
      color: 0x3a4048,
      metalness: 1,
      roughness: 0.45,
      envMapIntensity: 1.6,
    });
    const rubberEPDM = new THREE.MeshStandardMaterial({
      color: 0x14161a,
      roughness: 0.7,
      metalness: 0,
    });

    // Liquid — inner cylinder #d98a1f, amber emissive, semi-transparent
    const liquid = new THREE.MeshStandardMaterial({
      color: 0xd98a1f,
      emissive: 0x8a4a05,
      emissiveIntensity: 0.5,
      roughness: 0.2,
      transparent: true,
      opacity: 0.7,
    });

    const spargerMat = new THREE.MeshStandardMaterial({
      color: 0x8a93a0,
      metalness: 1,
      roughness: 0.3,
      emissive: 0x38bdf8,
      emissiveIntensity: 0.5,
    });

    this.scene.add(this.masterRig);
    this.masterRig.add(this.basePlinthGroup, this.headplateGroup, this.impellerGroup);

    this.buildPlinth(steel);
    this.buildVessel(steel, liquid);
    this.buildHeadplate(steel, darkSteel, rubberEPDM);
    this.buildImpellers(steel);
    this.buildSpargerAndBubbles(spargerMat);
    this.buildProbes(steel);
    this.buildBaffles(darkSteel);

    // §6 floor grid — dark, low opacity.
    const grid = new THREE.GridHelper(40, 40, 0x1b2a44, 0x0b1220);
    grid.position.y = -2.6;
    const gridMat = grid.material as THREE.Material;
    gridMat.transparent = true;
    gridMat.opacity = 0.5;
    this.scene.add(grid);

    // Soft contact shadow — dark radial-gradient plane under the base.
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = shadowCanvas.height = 256;
    const sctx = shadowCanvas.getContext('2d')!;
    const grad = sctx.createRadialGradient(128, 128, 8, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.55)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    sctx.fillStyle = grad;
    sctx.fillRect(0, 0, 256, 256);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    shadowTex.colorSpace = THREE.SRGBColorSpace;
    const shadowPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(4, 4),
      new THREE.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }),
    );
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.58;
    this.scene.add(shadowPlane);

    // Faint circular amber reflection under the vessel base.
    const amberCanvas = document.createElement('canvas');
    amberCanvas.width = amberCanvas.height = 256;
    const actx = amberCanvas.getContext('2d')!;
    const agrad = actx.createRadialGradient(128, 128, 4, 128, 128, 128);
    agrad.addColorStop(0, 'rgba(242,169,59,0.35)');
    agrad.addColorStop(0.5, 'rgba(242,169,59,0.12)');
    agrad.addColorStop(1, 'rgba(242,169,59,0)');
    actx.fillStyle = agrad;
    actx.fillRect(0, 0, 256, 256);
    const amberTex = new THREE.CanvasTexture(amberCanvas);
    amberTex.colorSpace = THREE.SRGBColorSpace;
    const amberReflection = new THREE.Mesh(
      new THREE.PlaneGeometry(3.2, 3.2),
      new THREE.MeshBasicMaterial({
        map: amberTex,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    );
    amberReflection.rotation.x = -Math.PI / 2;
    amberReflection.position.y = -2.56;
    this.scene.add(amberReflection);
  }

  private buildPlinth(steel: THREE.Material) {
    const plinth = new THREE.Mesh(new THREE.CylinderGeometry(1.58, 1.76, 0.42, 128), steel);
    plinth.position.y = -1.91;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    this.basePlinthGroup.add(plinth);

    const collar = new THREE.Mesh(new THREE.CylinderGeometry(1.42, 1.58, 0.16, 128), steel);
    collar.position.y = -1.78;
    this.basePlinthGroup.add(collar);
  }

  private buildVessel(steel: THREE.Material, liquid: THREE.Material) {
    const vesselGroup = new THREE.Group();
    this.masterRig.add(vesselGroup);

    // Ultra-clear borosilicate outer wall + dished bottom
    const glassCylGeo = new THREE.CylinderGeometry(1.35, 1.35, 3.4, 128, 64, true);
    const glass = new THREE.Mesh(glassCylGeo, this.borosilicateGlass);
    vesselGroup.add(glass);

    const dishGeo = new THREE.SphereGeometry(1.35, 128, 64, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5);
    const dish = new THREE.Mesh(dishGeo, this.borosilicateGlass);
    dish.position.y = -1.7;
    vesselGroup.add(dish);

    // Amber culture broth (inner cylinder) — fills 70% of the vessel height.
    const brothMesh = new THREE.Mesh(new THREE.CylinderGeometry(1.31, 1.31, 2.38, 128, 64), liquid);
    brothMesh.position.y = -0.51;
    vesselGroup.add(brothMesh);

    // Brighter top-surface disc (emissive 0.9, subtle ripple normal).
    const rippleNormal = createRippleNormal();
    const meniscus = new THREE.Mesh(
      new THREE.RingGeometry(0.12, 1.3, 96),
      new THREE.MeshPhysicalMaterial({
        color: 0xd98a1f,
        emissive: 0xd98a1f,
        emissiveIntensity: 0.9,
        roughness: 0.1,
        metalness: 0,
        normalMap: rippleNormal,
        normalScale: new THREE.Vector2(0.15, 0.15),
      }),
    );
    meniscus.rotation.x = -Math.PI / 2;
    meniscus.position.y = 0.68;
    vesselGroup.add(meniscus);

    // Thin bright rim — slightly larger BackSide cylinder (faint blue tint).
    const rimMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.36, 1.36, 3.42, 128, 64, true),
      new THREE.MeshBasicMaterial({
        color: 0x7fb2ff,
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.08,
        depthWrite: false,
      }),
    );
    vesselGroup.add(rimMesh);

    // Internal GLSL vortex cage (subtle; only prominent in CAD chapter)
    const vortexMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(1.3, 1.3, 2.35, 96, 48, true),
      this.vortexMaterial,
    );
    vortexMesh.position.y = -0.525;
    vesselGroup.add(vortexMesh);

    // CAD wireframe overlay (crossfaded in chapter 03)
    const wireframeVessel = new THREE.Mesh(glassCylGeo, this.wireframeCyan);
    wireframeVessel.scale.setScalar(1.002);
    vesselGroup.add(wireframeVessel);

    // Steel top ring where the headplate seats
    const seat = new THREE.Mesh(new THREE.CylinderGeometry(1.38, 1.38, 0.12, 128), steel);
    seat.position.y = 1.7;
    vesselGroup.add(seat);
  }

  private buildHeadplate(steel: THREE.Material, darkSteel: THREE.Material, rubber: THREE.Material) {
    // Thick bevelled disc (chamfered edges)
    const plate = new THREE.Mesh(bevelledDisc(1.52, 0.3, 0.01, 128), steel);
    plate.position.y = 1.85;
    plate.castShadow = true;
    plate.receiveShadow = true;
    this.headplateGroup.add(plate);

    // 12 perimeter hex bolts
    const boltGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.06, 64);
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const bolt = new THREE.Mesh(boltGeo, steel);
      bolt.position.set(Math.cos(a) * 1.44, 2.02, Math.sin(a) * 1.44);
      this.headplateGroup.add(bolt);
    }

    // 8 sanitary port stubs
    const portGeo = new THREE.CylinderGeometry(0.08, 0.08, 0.16, 64);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2 + Math.PI / 8;
      const port = new THREE.Mesh(portGeo, steel);
      port.position.set(Math.cos(a) * 1.0, 2.06, Math.sin(a) * 1.0);
      this.headplateGroup.add(port);
    }

    // Taller servo drive housing + cooling fins (dark matte steel)
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.9, 128), darkSteel);
    motor.position.y = 2.55;
    motor.castShadow = true;
    this.headplateGroup.add(motor);

    const finGeo = new THREE.BoxGeometry(0.04, 0.5, 0.8);
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const fin = new THREE.Mesh(finGeo, darkSteel);
      fin.position.set(Math.cos(a) * 0.44, 2.55, Math.sin(a) * 0.44);
      fin.rotation.y = a;
      this.headplateGroup.add(fin);
    }

    const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.32, 0.22, 64), darkSteel);
    cap.position.y = 3.05;
    this.headplateGroup.add(cap);

    // EPDM O-ring seal at the headplate/vessel junction
    const oRing = new THREE.Mesh(new THREE.TorusGeometry(1.36, 0.025, 32, 128), rubber);
    oRing.rotation.x = Math.PI / 2;
    oRing.position.y = 1.7;
    this.headplateGroup.add(oRing);
  }

  private buildImpellers(steel: THREE.Material) {
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, 4.1, 128), steel);
    shaft.castShadow = true;
    this.impellerGroup.add(shaft);

    this.addRushtonTurbine(steel, -0.65);
    this.addRushtonTurbine(steel, 0.35);
  }

  private addRushtonTurbine(steel: THREE.Material, y: number) {
    const t = new THREE.Group();
    t.position.y = y;

    const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, 0.16, 128), steel);
    t.add(hub);

    const boltGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.05, 64);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + Math.PI / 4;
      const b = new THREE.Mesh(boltGeo, steel);
      b.position.set(Math.cos(a) * 0.14, 0, Math.sin(a) * 0.14);
      t.add(b);
    }

    const disc = new THREE.Mesh(new THREE.CylinderGeometry(0.68, 0.68, 0.032, 128), steel);
    t.add(disc);

    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.24, 0.32, 0.034), steel);
      blade.position.set(Math.cos(a) * 0.42, 0, Math.sin(a) * 0.42);
      blade.rotation.y = a;
      blade.castShadow = true;
      t.add(blade);
    }

    this.impellerGroup.add(t);
  }

  private buildSpargerAndBubbles(spargerMat: THREE.Material) {
    const sparger = new THREE.Mesh(new THREE.TorusGeometry(0.55, 0.035, 32, 128), spargerMat);
    sparger.rotation.x = Math.PI / 2;
    sparger.position.y = -1.4;
    this.masterRig.add(sparger);

    // Bubbles — one InstancedMesh of small warm spheres (#ffd08a, dim emissive)
    const bubbleMat = new THREE.MeshStandardMaterial({
      color: 0xffd08a,
      emissive: 0xa86b12,
      emissiveIntensity: 0.9,
      roughness: 0.3,
      transparent: true,
      opacity: 0.8,
    });

    this.instancedBubbles = new THREE.InstancedMesh(
      new THREE.SphereGeometry(1, 16, 16), // unit sphere, scaled per-instance 0.02–0.05
      bubbleMat,
      this.bubbleCount,
    );
    this.instancedBubbles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    for (let i = 0; i < this.bubbleCount; i++) {
      this.bubbleData.push({
        theta: Math.random() * Math.PI * 2,
        rad: 0.15 + Math.random() * 0.92,
        y: -1.35 + Math.random() * 2.1,
        radius: 0.012 + Math.random() * 0.018,
        phase: Math.random() * Math.PI * 2,
      });
    }
    this.masterRig.add(this.instancedBubbles);
  }

  private buildProbes(steel: THREE.Material) {
    // Three emissive probe spheres (radius 0.12, emissiveIntensity 2.2) on thin tubes
    const glowTex = createGlowTexture();
    const specs = [
      { color: 0x34d399, angle: 2.12, radius: 0.84, len: 2.65 }, // pH green
      { color: 0x38bdf8, angle: 3.72, radius: 0.74, len: 2.85 }, // DO blue
      { color: 0xfbbf24, angle: 5.18, radius: 0.82, len: 1.45 }, // RTD amber
    ];

    specs.forEach((spec) => {
      const p = new THREE.Group();
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, spec.len, 64), steel);
      tube.position.y = 1.95 - spec.len / 2;
      p.add(tube);

      const tipMat = new THREE.MeshStandardMaterial({
        color: spec.color,
        emissive: spec.color,
        emissiveIntensity: 2.2,
        roughness: 0.15,
      });
      const tipY = 1.95 - spec.len;
      const tip = new THREE.Mesh(new THREE.SphereGeometry(0.12, 32, 32), tipMat);
      tip.position.y = tipY;
      p.add(tip);

      // Faint additive halo sprite around the glowing tip.
      const halo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: glowTex,
          color: spec.color,
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        }),
      );
      halo.scale.setScalar(0.5);
      halo.position.y = tipY;
      p.add(halo);

      // Leader line (dashed, marching) from the probe sphere to a small end dot
      const dirX = Math.cos(spec.angle);
      const dirZ = Math.sin(spec.angle);
      const start = new THREE.Vector3(0, tipY, 0);
      const end = new THREE.Vector3(dirX * 0.4, tipY + 0.05, dirZ * 0.4);
      const lineLen = start.distanceTo(end);
      const lineGeo = new THREE.BufferGeometry().setFromPoints([start, end]);
      lineGeo.setAttribute('lineDistance', new THREE.BufferAttribute(new Float32Array([0, lineLen]), 1));
      const lineMat = createDashedLineMaterial(0x38bdf8);
      const line = new THREE.Line(lineGeo, lineMat);
      p.add(line);
      this.leaderLines.push({ material: lineMat });

      const dot = new THREE.Mesh(
        new THREE.SphereGeometry(0.03, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0x38bdf8 }),
      );
      dot.position.copy(end);
      p.add(dot);

      const x = Math.cos(spec.angle) * spec.radius;
      const z = Math.sin(spec.angle) * spec.radius;
      p.position.set(x, 0, z);
      p.userData = { baseX: x, baseZ: z, baseY: 0 } satisfies ProbeData;

      this.probeSensors.push(p);
      this.masterRig.add(p);
    });
  }

  private buildBaffles(darkSteel: THREE.Material) {
    const baffleGeo = new THREE.BoxGeometry(0.17, 2.9, 0.035);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2;
      const b = new THREE.Mesh(baffleGeo, darkSteel);
      b.position.set(Math.cos(a) * 1.2, -0.2, Math.sin(a) * 1.2);
      b.rotation.y = -a;
      this.masterRig.add(b);
    }
  }

  // ── Responsive: shift reactor +0.9 on x at ≥1024px so left text stays readable ──
  private applyResponsiveShift(width: number) {
    this.masterRig.position.x = width >= 1024 ? 0.9 : 0;
  }

  // ── Events ─────────────────────────────────────────────────────────────────
  private onMouseMove = (e: MouseEvent) => {
    this.mouseX = (e.clientX / window.innerWidth) * 2 - 1;
    this.mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
  };

  private onResize = () => {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h, false);
    this.composer.setSize(w, h);
    this.applyResponsiveShift(w);
  };

  private bindEvents() {
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    this.resizeObserver = new ResizeObserver(() => this.onResize());
    this.resizeObserver.observe(this.container);
  }

  // ── Master 60fps inertia loop (500vh scroll engine) ────────────────────────
  private animate = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);

    const dt = Math.min(this.clock.getDelta(), 0.1);
    const time = this.clock.getElapsedTime();
    const frameScale = dt * 60; // ≈1 at 60fps; frame-rate independent

    // 1. Damped continuous scroll scalar p (0..1)
    const doc = document.documentElement;
    const total = doc.scrollHeight - window.innerHeight;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    this.targetProgress = total > 0 ? clamp01(scrollY / total) : 0;
    // Frame-rate-independent exponential damping; per-frame change capped to 0.02.
    if (this.reducedMotion) {
      this.smoothProgress = this.targetProgress;
    } else {
      const delta = (this.targetProgress - this.smoothProgress) * (1 - Math.exp(-dt * 5));
      this.smoothProgress += Math.max(-0.02, Math.min(0.02, delta));
    }
    const sp = this.smoothProgress;

    // 2. Impeller rotation — strictly gated to active running state (still in STANDBY).
    if (!this.reducedMotion && this.running) {
      this.impellerGroup.rotation.y += (this.rpm / 60) * 0.05 * frameScale;
    }

    // 3–5. Continuous state functions of the smoothed p (no instant switching).
    const [b0, b1, b2] = BOUNDARIES;

    const explode =
      smootherstep(b0 - WINDOW, b0 + WINDOW, sp) *
      (1 - smootherstep(b1 - WINDOW, b1 + WINDOW, sp));
    this.headplateGroup.position.y = this.baseHeadplateY + explode * 1.15;
    this.impellerGroup.position.y = this.baseImpellerY + explode * 0.55;
    this.basePlinthGroup.position.y = this.basePlinthY - explode * 0.28;
    this.probeSensors.forEach((p) => {
      const u = p.userData as ProbeData;
      p.position.x = u.baseX * (1 + explode * 0.65);
      p.position.z = u.baseZ * (1 + explode * 0.65);
      p.position.y = u.baseY + explode * 0.42;
    });

    const cad =
      smootherstep(b1 - WINDOW, b1 + WINDOW, sp) *
      (1 - smootherstep(b2 - WINDOW, b2 + WINDOW, sp));
    const effCad = this.wireframeActive ? 1 : cad;
    this.wireframeCyan.opacity = effCad * 0.65;
    this.vortexMaterial.uniforms.uCadBlend.value = clamp01(0.15 + effCad * 0.85);
    this.vortexMaterial.uniforms.uTime.value = time;
    this.vortexMaterial.uniforms.uRpm.value = this.rpm;

    // Camera — centripetal splines for position and target; pure function of sp.
    const t = clamp01(sp);
    const camPos = this.cameraSpline.getPoint(t);
    const target = this.targetSpline.getPoint(t);
    this.camera.position.set(
      camPos.x + this.mouseX * 0.22,
      camPos.y + this.mouseY * 0.14,
      camPos.z,
    );
    this.camera.lookAt(target);

    // 6. Instanced bubble rise (vvm-driven, sine wobble, wrap) — gated to running.
    if (!this.reducedMotion && this.running) {
      const vvm = useConsoleStore.getState().controls.vvm;
      const riseSpeed = 0.4 + 0.8 * (vvm / 2);
      for (let i = 0; i < this.bubbleCount; i++) {
        const b = this.bubbleData[i];
        b.y += riseSpeed * dt;
        if (b.y > 0.6) b.y = -1.35;
        const wob = Math.sin(time * 3 + b.phase) * 0.08;
        this.bubbleDummy.position.set(
          Math.cos(b.theta) * b.rad + wob,
          b.y,
          Math.sin(b.theta) * b.rad + wob * 0.6,
        );
        this.bubbleDummy.scale.setScalar(b.radius);
        this.bubbleDummy.updateMatrix();
        this.instancedBubbles.setMatrixAt(i, this.bubbleDummy.matrix);
      }
      this.instancedBubbles.instanceMatrix.needsUpdate = true;
    }

    // 6b. Leader-line dashOffset animation (slow marching dashes)
    for (const l of this.leaderLines) {
      l.material.uniforms.uDashOffset.value -= dt * 0.25;
    }

    // 7. Gentle turntable drift
    if (!this.reducedMotion) {
      this.masterRig.rotation.y = sp * 1.8 + Math.sin(time * 0.4) * 0.08;
    }

    // 8. Render + publish damped progress
    this.composer.render();
    this.callbacks.onProgress?.(sp);
  };

  // ── Public API ─────────────────────────────────────────────────────────────
  start() {
    this.clock.start();
    this.rafId = requestAnimationFrame(this.animate);
  }

  setRpm(rpm: number) {
    this.rpm = Math.max(100, Math.min(1000, rpm));
  }

  getRpm() {
    return this.rpm;
  }

  setWireframe(active: boolean) {
    this.wireframeActive = active;
  }

  setRunning(running: boolean) {
    this.running = running;
  }

  getWireframe() {
    return this.wireframeActive;
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this.onMouseMove);
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;

    this.scene.traverse((obj) => {
      const mesh = obj as THREE.Mesh;
      if (mesh.isMesh) {
        mesh.geometry?.dispose();
        const mat = mesh.material;
        if (Array.isArray(mat)) mat.forEach((m) => m.dispose());
        else mat?.dispose();
      }
    });

    this.envRT.dispose();
    this.pmrem.dispose();
    this.composer.dispose();
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }
}
