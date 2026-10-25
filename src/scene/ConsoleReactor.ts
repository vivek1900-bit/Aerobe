// Console 3D reactor — ported from the Console .zip's embedded Three.js vessel
// (camera fov 40 @ [0,1.1,5.4], glass/jacket/broth, dual Rushton, baffles, sparger,
// 3 probes, bubble points). State-reactive: STANDBY (frozen) / ACTIVE (spin) / FAULT
// (red thermal glow) + X-Ray wireframe toggle.
import * as THREE from 'three';

export interface ConsoleReactorOptions {
  running?: boolean;
}

export class ConsoleReactor {
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement;
  private clock = new THREE.Clock();
  private rafId = 0;
  private disposed = false;

  private reactorGroup = new THREE.Group();
  private shaftGroup = new THREE.Group();

  private glassMat!: THREE.MeshPhysicalMaterial;
  private jacketMat!: THREE.MeshPhysicalMaterial;
  private steelMat!: THREE.MeshStandardMaterial;
  private darkSteelMat!: THREE.MeshStandardMaterial;
  private wireframeMats: THREE.Material[] = [];

  private bubbleSystem!: THREE.Points;
  private bubbleGeo!: THREE.BufferGeometry;
  private bubbleSpeeds!: Float32Array;
  private readonly bubbleCount = 140;

  private spargerLight!: THREE.PointLight;
  private doProbeMat!: THREE.MeshStandardMaterial;

  private running: boolean;
  private rpm = 400;
  private vvm = 1.0;

  private mouseX = 0;
  private mouseY = 0;

  constructor(container: HTMLElement, options: ConsoleReactorOptions = {}) {
    this.container = container;
    this.running = options.running ?? false;
    const width = container.clientWidth || 640;
    const height = container.clientHeight || 560;

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.setSize(width, height);
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.25;
    this.renderer.domElement.style.position = 'absolute';
    this.renderer.domElement.style.inset = '0';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    this.scene.background = null; // transparent — bento card shows through

    this.camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    this.camera.position.set(0, 1.1, 5.4);
    this.camera.lookAt(0, 0, 0);

    this.buildLights();
    this.buildReactor();

    this.onMouseMove = this.onMouseMove.bind(this);
    window.addEventListener('mousemove', this.onMouseMove, { passive: true });
    this.onResize = this.onResize.bind(this);
    window.addEventListener('resize', this.onResize);
  }

  private buildLights() {
    this.scene.add(new THREE.AmbientLight(0x0d1b2a, 1.8));
    const key = new THREE.DirectionalLight(0x4099ff, 3.5);
    key.position.set(4, 5, 4);
    this.scene.add(key);
    const fill = new THREE.DirectionalLight(0xffaa33, 2.0);
    fill.position.set(-4, -2, 3);
    this.scene.add(fill);
    const rim = new THREE.PointLight(0x2f8cff, 4.0, 12);
    rim.position.set(0, 3, -3);
    this.scene.add(rim);
    this.spargerLight = new THREE.PointLight(0x22c55e, 2.2, 7);
    this.spargerLight.position.set(0, -1.8, 0);
    this.scene.add(this.spargerLight);
  }

  private buildReactor() {
    this.scene.add(this.reactorGroup);
    this.reactorGroup.position.y = 0.05;

    const grid = new THREE.GridHelper(6, 24, 0x1e3a5f, 0x0c192c);
    grid.position.y = -2.25;
    this.scene.add(grid);

    this.glassMat = new THREE.MeshPhysicalMaterial({
      color: 0x99ccff, transparent: true, opacity: 0.24, roughness: 0.06, metalness: 0.1,
      transmission: 0.9, ior: 1.52, reflectivity: 0.9, side: THREE.DoubleSide, depthWrite: false,
    });
    const glass = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 3.0, 48, 1, true), this.glassMat);
    this.reactorGroup.add(glass);

    this.jacketMat = new THREE.MeshPhysicalMaterial({
      color: 0x2f8cff, transparent: true, opacity: 0.12, roughness: 0.08,
      transmission: 0.95, ior: 1.33, side: THREE.DoubleSide, depthWrite: false,
    });
    const jacket = new THREE.Mesh(new THREE.CylinderGeometry(1.22, 1.22, 2.3, 48, 1, true), this.jacketMat);
    jacket.position.y = -0.3;
    this.reactorGroup.add(jacket);

    const dish = new THREE.Mesh(
      new THREE.SphereGeometry(1.08, 36, 18, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5),
      new THREE.MeshPhysicalMaterial({ color: 0x88c0ee, transparent: true, opacity: 0.35, roughness: 0.12, transmission: 0.85, side: THREE.DoubleSide }),
    );
    dish.position.y = -1.5;
    this.reactorGroup.add(dish);

    const brothHeight = 2.25;
    const brothMat = new THREE.MeshPhysicalMaterial({
      color: 0xf2a93b, emissive: 0x442200, emissiveIntensity: 0.4, transparent: true, opacity: 0.72,
      roughness: 0.15, metalness: 0.08, transmission: 0.52, ior: 1.38,
    });
    const broth = new THREE.Mesh(new THREE.CylinderGeometry(1.04, 1.04, brothHeight, 48), brothMat);
    broth.position.y = -1.5 + brothHeight / 2;
    this.reactorGroup.add(broth);
    const brothDish = new THREE.Mesh(new THREE.SphereGeometry(1.04, 36, 16, 0, Math.PI * 2, Math.PI * 0.5, Math.PI * 0.5), brothMat);
    brothDish.position.y = -1.5;
    this.reactorGroup.add(brothDish);

    const meniscus = new THREE.Mesh(
      new THREE.RingGeometry(0.08, 1.04, 48),
      new THREE.MeshBasicMaterial({ color: 0xffd17a, transparent: true, opacity: 0.55, side: THREE.DoubleSide }),
    );
    meniscus.rotation.x = Math.PI / 2;
    meniscus.position.y = -1.5 + brothHeight;
    this.reactorGroup.add(meniscus);

    this.steelMat = new THREE.MeshStandardMaterial({ color: 0xdde4ed, metalness: 0.88, roughness: 0.26 });
    this.darkSteelMat = new THREE.MeshStandardMaterial({ color: 0x485566, metalness: 0.85, roughness: 0.35 });
    const cyanEdgeMat = new THREE.MeshStandardMaterial({ color: 0x82b9e9, metalness: 0.75, roughness: 0.22, emissive: 0x143555 });

    this.wireframeMats = [this.glassMat, this.jacketMat, this.steelMat, this.darkSteelMat, cyanEdgeMat];

    const headplate = new THREE.Mesh(new THREE.CylinderGeometry(1.24, 1.24, 0.16, 48), this.steelMat);
    headplate.position.y = 1.52;
    this.reactorGroup.add(headplate);

    const flange = new THREE.Mesh(new THREE.TorusGeometry(1.22, 0.045, 16, 48), this.darkSteelMat);
    flange.rotation.x = Math.PI / 2;
    flange.position.y = 1.46;
    this.reactorGroup.add(flange);

    const motorBase = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.44, 0.3, 32), this.darkSteelMat);
    motorBase.position.y = 1.74;
    this.reactorGroup.add(motorBase);
    const motorHousing = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.65, 32), this.steelMat);
    motorHousing.position.y = 2.2;
    this.reactorGroup.add(motorHousing);

    this.reactorGroup.add(this.shaftGroup);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 3.25, 24), this.steelMat);
    this.shaftGroup.add(shaft);

    const createTurbine = (y: number) => {
      const t = new THREE.Group();
      t.position.y = y;
      t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.34, 0.34, 0.028, 32), cyanEdgeMat));
      t.add(new THREE.Mesh(new THREE.CylinderGeometry(0.088, 0.088, 0.13, 16), this.darkSteelMat));
      const bladeGeo = new THREE.BoxGeometry(0.26, 0.19, 0.022);
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        const b = new THREE.Mesh(bladeGeo, cyanEdgeMat);
        b.position.set(Math.cos(a) * 0.35, 0, Math.sin(a) * 0.35);
        b.rotation.y = -a;
        t.add(b);
      }
      return t;
    };
    this.shaftGroup.add(createTurbine(-1.18));
    this.shaftGroup.add(createTurbine(-0.28));

    const baffleGeo = new THREE.BoxGeometry(0.18, 2.5, 0.022);
    for (let i = 0; i < 4; i++) {
      const a = (i / 4) * Math.PI * 2 + 0.35;
      const b = new THREE.Mesh(baffleGeo, this.steelMat);
      b.position.set(Math.cos(a) * 0.96, -0.15, Math.sin(a) * 0.96);
      b.rotation.y = -a;
      this.reactorGroup.add(b);
    }

    const spargerMat = new THREE.MeshStandardMaterial({ color: 0x66ccff, metalness: 0.9, roughness: 0.2 });
    const sparger = new THREE.Mesh(new THREE.TorusGeometry(0.48, 0.032, 16, 36), spargerMat);
    sparger.rotation.x = Math.PI / 2;
    sparger.position.y = -1.38;
    this.reactorGroup.add(sparger);

    // Probes: pH (green), DO (blue → red on fault), Temp (amber)
    const addProbe = (r: number, len: number, mat: THREE.Material, rx: number, rz: number) => {
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.038, 0.038, len, 16), mat);
      tube.position.set(r, -0.35, 0);
      tube.rotation.z = rx;
      tube.rotation.x = rz;
      this.reactorGroup.add(tube);
    };
    addProbe(-0.66, 2.0, new THREE.MeshStandardMaterial({ color: 0x22c55e, roughness: 0.3, metalness: 0.5 }), 0.24, 0.12);
    this.doProbeMat = new THREE.MeshStandardMaterial({ color: 0x38bdf8, roughness: 0.3, metalness: 0.5 });
    addProbe(-0.25, 2.2, this.doProbeMat, 0.08, 0);
    addProbe(0.68, 2.1, new THREE.MeshStandardMaterial({ color: 0xf59e0b, roughness: 0.2, metalness: 0.8 }), -0.22, 0);

    // Bubbles (points, additive)
    const bubbleCount = this.bubbleCount;
    this.bubbleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(bubbleCount * 3);
    this.bubbleSpeeds = new Float32Array(bubbleCount);
    for (let i = 0; i < bubbleCount; i++) {
      const a = Math.random() * Math.PI * 2;
      const rad = 0.12 + Math.random() * 0.72;
      positions[i * 3] = Math.cos(a) * rad;
      positions[i * 3 + 1] = -1.38 + Math.random() * 2.0;
      positions[i * 3 + 2] = Math.sin(a) * rad;
      this.bubbleSpeeds[i] = 0.009 + Math.random() * 0.018;
    }
    this.bubbleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    const canvas = document.createElement('canvas');
    canvas.width = canvas.height = 32;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(16, 16, 0, 16, 16, 16);
    grad.addColorStop(0, 'rgba(255,255,255,0.95)');
    grad.addColorStop(0.4, 'rgba(120,210,255,0.65)');
    grad.addColorStop(1, 'rgba(47,140,255,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 32, 32);
    const bubbleMat = new THREE.PointsMaterial({
      size: 0.08, map: new THREE.CanvasTexture(canvas), transparent: true, opacity: 0.85,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    this.bubbleSystem = new THREE.Points(this.bubbleGeo, bubbleMat);
    this.reactorGroup.add(this.bubbleSystem);
  }

  private onMouseMove(e: MouseEvent) {
    const rect = this.container.getBoundingClientRect();
    if (rect.width > 0 && rect.height > 0) {
      this.mouseX = ((e.clientX - rect.left) / rect.width - 0.5) * 0.5;
      this.mouseY = ((e.clientY - rect.top) / rect.height - 0.5) * 0.3;
    }
  }

  private onResize() {
    const w = this.container.clientWidth || 640;
    const h = this.container.clientHeight || 560;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  }

  start() {
    this.clock.start();
    this.rafId = requestAnimationFrame(this.animate);
  }

  dispose() {
    this.disposed = true;
    cancelAnimationFrame(this.rafId);
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('resize', this.onResize);
    this.scene.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh) {
        m.geometry?.dispose();
        const mat = m.material;
        if (Array.isArray(mat)) mat.forEach((x) => x.dispose());
        else mat?.dispose();
      }
    });
    this.renderer.dispose();
    this.renderer.domElement.remove();
  }

  setRunning(r: boolean) {
    this.running = r;
  }

  setRpm(rpm: number) {
    this.rpm = rpm;
  }

  setVvm(vvm: number) {
    this.vvm = vvm;
  }

  setXRay(xray: boolean) {
    for (const m of this.wireframeMats) {
      const sm = m as THREE.MeshStandardMaterial;
      sm.wireframe = xray;
      if (xray) sm.opacity = 0.5;
    }
    this.glassMat.opacity = xray ? 0.4 : 0.24;
    this.jacketMat.opacity = xray ? 0.2 : 0.12;
  }

  setFault(fault: boolean) {
    this.spargerLight.color.setHex(fault ? 0xf43f5e : 0x22c55e);
    this.spargerLight.intensity = fault ? 2.5 : 2.2;
    this.doProbeMat.color.setHex(fault ? 0xf43f5e : 0x38bdf8);
    this.doProbeMat.emissive?.setHex(fault ? 0x440000 : 0x000000);
    this.doProbeMat.emissiveIntensity = fault ? 0.8 : 0;
  }

  private animate = () => {
    if (this.disposed) return;
    this.rafId = requestAnimationFrame(this.animate);
    const delta = Math.min(this.clock.getDelta(), 0.1);

    // Impeller rotation — gated to running, proportional to rpm.
    if (this.running) {
      const rate = (this.rpm / 60) * Math.PI * 2 * 0.25;
      this.shaftGroup.rotation.y += rate * delta;
    }

    // Bubbles — gated to running, scaled by vvm.
    if (this.running) {
      const pos = this.bubbleGeo.attributes.position.array as Float32Array;
      const rise = this.vvm * 1.0;
      for (let i = 0; i < this.bubbleCount; i++) {
        pos[i * 3 + 1] += this.bubbleSpeeds[i] * rise;
        if (pos[i * 3 + 1] > 0.72) pos[i * 3 + 1] = -1.38;
      }
      this.bubbleGeo.attributes.position.needsUpdate = true;
    }

    // Mouse parallax turntable
    const targetY = this.mouseX * 0.6;
    const targetX = this.mouseY * 0.25;
    this.reactorGroup.rotation.y += (targetY - this.reactorGroup.rotation.y) * 0.05 + 0.0015;
    this.reactorGroup.rotation.x += (targetX - this.reactorGroup.rotation.x) * 0.05;

    this.renderer.render(this.scene, this.camera);
  };
}
