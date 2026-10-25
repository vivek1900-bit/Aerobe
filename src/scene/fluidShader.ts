import * as THREE from 'three';

// Custom GLSL "vortex cage" — an internal animated overlay rendered inside the
// golden-amber broth volume. Driven per-frame by uTime (s), uRpm (rev/min) and
// uCadBlend (0 = photoreal solid broth, 1 = CAD/blueprint inspection) so the
// internal circulation becomes visible exactly when the X-ray chapter opens.
// (08 §2 / brief §2: "animated glowing streamlines and vertical circulation loops".)

export const vortexVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vUv = uv;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const vortexFragment = /* glsl */ `
  uniform float uTime;
  uniform float uRpm;
  uniform float uCadBlend;
  uniform vec3 uColorDeep;
  uniform vec3 uColorGlow;

  varying vec2 vUv;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float rpm = uRpm / 60.0;              // revolutions per second
    float turns = 3.0 + uCadBlend * 2.5;  // helical turns up the vessel
    float speed = 0.55 + rpm * 0.85;

    // Vertical circulation loops (slow counter-current rise / fall bands)
    float loop = sin(vUv.y * 6.2831853 * 2.0 - uTime * speed * 0.8);

    // Helical streamline bands wrapping the vessel (impeller-driven swirl)
    float helix = sin(vUv.x * 6.2831853 * turns - uTime * speed * 2.0 + vUv.y * 12.0);

    // Blend the two motion fields into thin glowing streaks
    float streak = smoothstep(0.52, 0.96, abs(helix * 0.72 + loop * 0.28));

    // Fresnel rim — brightens the grazing edges so the cage reads as a shell
    float fresnel = pow(1.0 - abs(dot(normalize(vNormal), normalize(vViewDir))), 2.4);

    vec3 col = mix(uColorDeep, uColorGlow, streak);
    float alpha = (streak * 0.55 + fresnel * 0.30) * (0.38 + 0.62 * uCadBlend);

    gl_FragColor = vec4(col, alpha);
  }
`;

export function createVortexMaterial(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    vertexShader: vortexVertex,
    fragmentShader: vortexFragment,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uTime: { value: 0 },
      uRpm: { value: 420 },
      uCadBlend: { value: 0.0 },
      uColorDeep: { value: new THREE.Color(0xd98a1f) },
      uColorGlow: { value: new THREE.Color(0xffc766) },
    },
  });
}

// ── Dashed leader-line material (drei <Line dashed> equivalent) ──────────────
// A thin line with a marching dashes pattern driven by uDashOffset. three's
// LineDashedMaterial has no dashOffset, so this small shader supplies it.
export const dashedLineVertex = /* glsl */ `
  attribute float lineDistance;
  varying float vLineDistance;

  void main() {
    vLineDistance = lineDistance;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dashedLineFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uDashSize;
  uniform float uGapSize;
  uniform float uDashOffset;
  varying float vLineDistance;

  void main() {
    float d = mod(vLineDistance + uDashOffset, uDashSize + uGapSize);
    if (d > uDashSize) discard;
    gl_FragColor = vec4(uColor, 1.0);
  }
`;

export function createDashedLineMaterial(color: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uColor: { value: new THREE.Color(color) },
      uDashSize: { value: 0.08 },
      uGapSize: { value: 0.06 },
      uDashOffset: { value: 0 },
    },
    vertexShader: dashedLineVertex,
    fragmentShader: dashedLineFragment,
  });
}
