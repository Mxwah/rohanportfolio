import { useEffect, useRef } from "react";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";
import { useReducedMotion } from "../../lib/useReducedMotion";
import { heroCurve } from "../../lib/field-link";

// The river of value. Tens of thousands of luminous particles flow along a
// spline whose course IS the live DCF's 5-year cash-flow curve (field-link):
// drag a slider and the river re-routes. The cursor is a physical presence
// that particles burst away from and heal behind. A small fraction of the
// particles are bright embers that drive a real bloom pass, which is what
// separates "white dots" from spectacle. On load the river ignites, streaming
// in from the left.
//
// The river never dies: it changes mood per act. Full glory in the hero; low,
// slow, and dim beneath experience and work (a quiet undercurrent under the
// numbers); parked only inside ARIA's act (that stage belongs to the mark);
// back calm for contact. Mode is read from which section covers the viewport
// center, and every property lerps so mood changes read as the current
// shifting, never a cut.
//
// Engineering notes:
// - Particles are STATELESS: every position derives from (seed, time) in the
//   vertex shader. No GPGPU ping-pong, nothing to corrupt, trivially robust.
// - The canvas renders its own opaque near-black (same hex as the site bg) so
//   the bloom composer never fights alpha compositing.
// - The loop early-returns once fully parked, so ARIA's canvas gets the GPU
//   to itself during its act.
// - Reduced motion renders a single lit frame. WebGL failure leaves the flat
//   background. DPR capped, bloom at half resolution.

const BG = 0x0b0b0d;

const VERT = /* glsl */ `
  attribute float aSeed;
  attribute float aSeed2;
  attribute float aSize;
  attribute float aAlpha;
  uniform float uTime;
  uniform float uIgnite;
  uniform float uYOff;
  uniform float uDrink;
  uniform vec3 uMouse;
  uniform vec3 uPts[5];
  varying float vAlpha;

  vec3 catmull(vec3 p0, vec3 p1, vec3 p2, vec3 p3, float t) {
    float t2 = t * t;
    float t3 = t2 * t;
    return 0.5 * ((2.0 * p1) + (-p0 + p2) * t
      + (2.0 * p0 - 5.0 * p1 + 4.0 * p2 - p3) * t2
      + (-p0 + 3.0 * p1 - 3.0 * p2 + p3) * t3);
  }

  vec3 splineAt(float t) {
    float f = clamp(t, 0.0, 0.9999) * 4.0;
    int i = int(floor(f));
    float u = f - float(i);
    vec3 p0 = uPts[i > 0 ? i - 1 : 0];
    vec3 p1 = uPts[i];
    vec3 p2 = uPts[i < 4 ? i + 1 : 4];
    vec3 p3 = uPts[i < 3 ? i + 2 : 4];
    return catmull(p0, p1, p2, p3, u);
  }

  void main() {
    float speed = 0.018 + 0.045 * aSeed2;
    float t = fract(aSeed + uTime * speed);
    vec3 pos = splineAt(t);

    // Living meander: surges that travel downstream, so the course always
    // reads as a river and never settles into a straight channel. The FCF
    // curve stays the macro trend; these waves are the water.
    pos.y += sin(t * 9.0 - uTime * 0.35) * 0.55;
    pos.z += cos(t * 6.0 + uTime * 0.22) * 0.8;

    vec3 tang = normalize(splineAt(min(t + 0.02, 1.0)) - splineAt(max(t - 0.02, 0.0)) + vec3(1e-4));
    vec3 side = normalize(cross(tang, vec3(0.0, 0.0, 1.0)));
    vec3 upv = normalize(cross(side, tang));

    float ang = aSeed2 * 6.2831 + uTime * (0.05 + 0.2 * aSeed);
    // Width swells and narrows along the course, like pools and narrows.
    float rad = (0.22 + 1.5 * aSeed * aSeed)
      * (0.75 + 0.25 * sin(uTime * 0.4 + aSeed * 40.0))
      * (0.8 + 0.35 * sin(t * 7.0 - uTime * 0.3));
    vec3 off = (side * cos(ang) + upv * sin(ang)) * rad;
    off.x += sin(uTime * 0.7 + aSeed * 90.0) * 0.12;
    off.y += cos(uTime * 0.9 + aSeed * 70.0) * 0.12;

    vec3 wp = pos + off;

    // The cursor as a physical presence: burst away, heal behind.
    vec3 d = wp - uMouse;
    float md = exp(-dot(d, d) * 0.3);
    wp += normalize(d + vec3(1e-3)) * md * 1.8;

    wp.y += uYOff; // per-act mood: the river sinks low under later acts

    // Aperture drink: as the ARIA act rises, the current drains toward it,
    // each particle pulled at its own rate and shrinking as it goes.
    vec3 toDrain = vec3(0.0, -4.5, -3.0) - wp;
    wp += toDrain * uDrink * (0.3 + 0.7 * aSeed2);

    vec4 mv = modelViewMatrix * vec4(wp, 1.0);
    gl_Position = projectionMatrix * mv;
    float dist = max(-mv.z, 0.1);
    gl_PointSize = aSize * (26.0 / dist) * (1.0 - 0.55 * uDrink);

    // Ignition front sweeps downstream; stream ends stay feathered.
    float ignite = smoothstep(t, t + 0.06, uIgnite);
    float ends = smoothstep(0.0, 0.05, t) * (1.0 - smoothstep(0.95, 1.0, t));
    vAlpha = aAlpha * ignite * ends;
  }
`;

const FRAG = /* glsl */ `
  precision mediump float;
  uniform float uGlobal;
  varying float vAlpha;

  void main() {
    vec2 c = gl_PointCoord - 0.5;
    float a = exp(-dot(c, c) * 14.0) * vAlpha * uGlobal;
    gl_FragColor = vec4(vec3(1.0), a);
  }
`;

const SPLINE_X = [-16, -8, 0, 8, 16];
const SPLINE_Z = [-3, -5.5, -2.5, -6, -4];

function targetY(i: number): number {
  return -1.6 + heroCurve[i] * 3.0;
}

export function FlowField() {
  const mountRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();

  useEffect(() => {
    const mount = mountRef.current;
    if (!mount) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" });
    } catch {
      return; // No WebGL: the flat background stands on its own.
    }

    // Mobile GPUs pay for both the particle count and the bloom pass's own
    // resolution (a multi-pass blur chain, the single most expensive thing
    // in this scene); capping DPR harder there is a bigger win than it looks
    // since fill-rate cost scales with the square of pixel ratio.
    const isMobile = window.innerWidth < 768;
    const dpr = Math.min(window.devicePixelRatio || 1, isMobile ? 1 : 1.5);
    renderer.setPixelRatio(dpr);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(BG, 1);
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BG);
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 80);
    camera.position.set(0, 0.4, 10);
    camera.lookAt(0, 0, -3);

    // Stateless particles: seeds in, positions out (vertex shader).
    const count = isMobile ? 9000 : 42000;
    const positions = new Float32Array(count * 3); // required by three, unused by the shader
    const seeds = new Float32Array(count);
    const seeds2 = new Float32Array(count);
    const sizes = new Float32Array(count);
    const alphas = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      seeds[i] = Math.random();
      seeds2[i] = Math.random();
      const ember = Math.random() < 0.025;
      sizes[i] = ember ? 3.2 + Math.random() * 1.8 : 0.9 + Math.random() * 1.1;
      alphas[i] = ember ? 0.7 + Math.random() * 0.3 : 0.1 + Math.random() * 0.2;
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
    geometry.setAttribute("aSeed2", new THREE.BufferAttribute(seeds2, 1));
    geometry.setAttribute("aSize", new THREE.BufferAttribute(sizes, 1));
    geometry.setAttribute("aAlpha", new THREE.BufferAttribute(alphas, 1));
    geometry.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 0, -4), 40); // never frustum-culled

    const splinePts = SPLINE_X.map((x, i) => new THREE.Vector3(x, targetY(i), SPLINE_Z[i]));
    const material = new THREE.ShaderMaterial({
      vertexShader: VERT,
      fragmentShader: FRAG,
      uniforms: {
        uTime: { value: 0 },
        uIgnite: { value: 0 },
        uGlobal: { value: 1 },
        uYOff: { value: 0 },
        uDrink: { value: 0 },
        uMouse: { value: new THREE.Vector3(0, 0, -60) },
        uPts: { value: splinePts },
      },
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
    });

    scene.add(new THREE.Points(geometry, material));

    // Bloom resolution: half on desktop, a quarter on mobile (the bloom pass's
    // own multi-pass blur chain is the single most expensive part of this
    // scene, independent of the particle count above it).
    const bloomDiv = isMobile ? 4 : 2;
    const composer = new EffectComposer(renderer);
    composer.setPixelRatio(dpr);
    composer.setSize(window.innerWidth, window.innerHeight);
    composer.addPass(new RenderPass(scene, camera));
    const bloom = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth / bloomDiv, window.innerHeight / bloomDiv),
      0.9,
      0.65,
      0.12,
    );
    composer.addPass(bloom);
    composer.addPass(new OutputPass());

    // Cursor: repulsion target in world space near the river plane.
    const mouseNdc = new THREE.Vector2(0, 0);
    const mouseWorld = new THREE.Vector3(0, 0, -60);
    let hasMouse = false;
    const onMove = (e: MouseEvent) => {
      hasMouse = true;
      mouseNdc.set((e.clientX / window.innerWidth) * 2 - 1, -((e.clientY / window.innerHeight) * 2 - 1));
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const onResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      composer.setSize(window.innerWidth, window.innerHeight);
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
    };
    window.addEventListener("resize", onResize);

    // Per-act moods. Whichever section covers the viewport center sets the
    // river's target: alpha, vertical offset, and flow speed all lerp there.
    const MODES: Array<{ id: string; a: number; y: number; s: number }> = [
      { id: "model", a: 1, y: 0, s: 1 },
      { id: "education", a: 0.18, y: -2.6, s: 0.45 },
      { id: "experience", a: 0.18, y: -2.6, s: 0.45 },
      { id: "simulator", a: 0.18, y: -2.6, s: 0.45 },
      { id: "macro", a: 0.18, y: -2.6, s: 0.45 },
      { id: "mont-ai", a: 0.18, y: -2.6, s: 0.45 },
      { id: "aria", a: 0, y: -2.6, s: 0.4 },
      { id: "leadership", a: 0.35, y: -1.6, s: 0.6 },
      { id: "contact", a: 0.6, y: -0.9, s: 0.7 },
    ];
    const sectionEls = new Map<string, HTMLElement>();
    const target = { a: 1, y: 0, s: 1 };
    const state = { a: 1, y: 0, s: 1 };
    let drinkTarget = 0;
    let scanCounter = 0;

    const scanMode = () => {
      const vh = window.innerHeight;
      const mid = vh * 0.5;
      for (const m of MODES) {
        let el = sectionEls.get(m.id);
        if (!el) {
          const found = document.getElementById(m.id);
          if (!found) continue;
          sectionEls.set(m.id, found);
          el = found;
        }
        const rect = el.getBoundingClientRect();
        if (rect.top <= mid && rect.bottom >= mid) {
          target.a = m.a;
          target.y = m.y;
          target.s = m.s;
          break;
        }
      }
      // Between sections, or on a route without them: stay quietly present.
      if (sectionEls.size === 0) {
        target.a = 0.45;
        target.y = -0.6;
        target.s = 0.6;
      }

      // The aperture drink: ramps as the ARIA act rises into view, holds
      // while its stage owns the screen, releases once it has passed.
      const ariaEl = sectionEls.get("aria");
      if (ariaEl) {
        const rect = ariaEl.getBoundingClientRect();
        if (rect.bottom < vh * 0.3) {
          drinkTarget = 0; // past the act: the river returns
        } else if (rect.top < vh) {
          drinkTarget = Math.min(1, Math.max(0, 1 - rect.top / vh));
        } else {
          drinkTarget = 0;
        }
      }
    };

    let frame = 0;
    let running = true;
    let last = performance.now();
    let flowTime = 0;
    let elapsed = 0;
    const u = material.uniforms;

    const renderFrame = (now: number) => {
      if (running && !reduced) frame = requestAnimationFrame(renderFrame);
      const dt = Math.min((now - last) / 1000, 1 / 20);
      last = now;
      elapsed += dt;

      if (scanCounter++ % 6 === 0) scanMode();
      state.a += (target.a - state.a) * 0.05;
      state.y += (target.y - state.y) * 0.05;
      state.s += (target.s - state.s) * 0.05;
      u.uGlobal.value = state.a;
      u.uYOff.value = state.y;
      const dk = u.uDrink.value as number;
      u.uDrink.value = dk + (drinkTarget - dk) * 0.07;
      if (target.a === 0 && state.a < 0.02) return; // parked: no GPU work

      flowTime += dt * state.s;
      u.uTime.value = flowTime;
      const ig = Math.min(1, Math.max(0, (elapsed - 0.35) / 2.2));
      u.uIgnite.value = 1 - Math.pow(1 - ig, 3);

      // River re-routes toward the live model's curve.
      const pts = u.uPts.value as THREE.Vector3[];
      for (let k = 0; k < 5; k++) {
        pts[k].y += (targetY(k) - pts[k].y) * 0.06;
      }

      // Cursor world position on the river plane, smoothed.
      if (hasMouse) {
        const planeZ = -3;
        const halfH = Math.tan((camera.fov * Math.PI) / 360) * (camera.position.z - planeZ);
        const halfW = halfH * camera.aspect;
        mouseWorld.set(mouseNdc.x * halfW, mouseNdc.y * halfH, planeZ);
      }
      (u.uMouse.value as THREE.Vector3).lerp(mouseWorld, 0.12);

      // Slow camera drift plus cursor lean.
      camera.position.x += (mouseNdc.x * 0.7 - camera.position.x) * 0.02;
      camera.position.y += (0.4 + mouseNdc.y * 0.3 - camera.position.y) * 0.02;
      camera.lookAt(0, 0, -3);

      composer.render();
    };

    if (reduced) {
      u.uIgnite.value = 1;
      u.uTime.value = 12;
      composer.render(); // one still, fully lit frame
    } else {
      frame = requestAnimationFrame(renderFrame);
    }

    const onVisibility = () => {
      if (document.hidden) {
        running = false;
        cancelAnimationFrame(frame);
      } else if (!reduced && !running) {
        running = true;
        frame = requestAnimationFrame(renderFrame);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      running = false;
      cancelAnimationFrame(frame);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("visibilitychange", onVisibility);
      geometry.dispose();
      material.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement);
    };
  }, [reduced]);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: "var(--z-bg)" as unknown as number }}
    />
  );
}
