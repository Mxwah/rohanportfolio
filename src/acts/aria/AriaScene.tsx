import { Suspense, useEffect, useMemo, useRef, type MutableRefObject } from "react";
import { Canvas, useFrame, useLoader } from "@react-three/fiber";
import { Environment, Lightformer } from "@react-three/drei";
import * as THREE from "three";
import { SVGLoader } from "three-stdlib";

// The ARIA mark as a machined object. The look comes from a procedural studio
// environment (soft light panels rendered into a local env map, no network
// fetch): the blades are polished metal that picks up moving reflections, the
// ring is anodized in ARIA Brand Violet. That environment light, not lamps, is
// what separates this from gray-plastic 3D.
//
// Motion: shutter bloom, driven by the visitor's scroll. The mark appears as a
// radial skeleton of edge-on slivers, then all eight blades pivot open about
// their own spines in unison with a small ripple sweeping around the circle,
// like shutter leaves. Every intermediate frame keeps the mark's 8-fold
// symmetry (a scattered asymmetric assembly reads as broken, not in-progress).
// The ring snaps in last. Assembled, the object hangs with a slow bounded sway
// and float. Never a full rotation: an extruded logo edge-on reads as a
// cardboard cutout. Cursor parallax layers on top.

const MARK_URL = "/aria/ARIA_mark_mono_white.svg";
const VIOLET = "#6d3af2";

export interface AriaSceneProps {
  progressRef: MutableRefObject<number>; // assembly progress, 0..1, scroll-driven
  running: boolean; // act is on screen; drives the render loop
  onAssembled: () => void; // fires once when the mark locks in
}

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
// Slight overshoot for the ring's snap-in.
const easeOutBack = (t: number) => {
  const c1 = 1.4;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
const clamp01 = (v: number) => Math.min(1, Math.max(0, v));

const BASE_SCALE = 0.062;

function Mark({
  progressRef,
  onAssembled,
}: Pick<AriaSceneProps, "progressRef" | "onAssembled">) {
  const root = useRef<THREE.Group>(null);
  const blades = useRef<Array<THREE.Group | null>>([]);
  const ring = useRef<THREE.Group>(null);
  const assembled = useRef(false);
  const swayT = useRef(0);
  const tilt = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const svg = useLoader(SVGLoader, MARK_URL);

  const { bladeGeos, ringGeo, spines } = useMemo(() => {
    const fillPaths = svg.paths.filter((p) => {
      const fill = (p.userData as { style?: { fill?: string } } | undefined)?.style?.fill;
      return Boolean(fill) && fill !== "none";
    });
    const shapes = fillPaths.flatMap((p) => SVGLoader.createShapes(p));
    // Shallow extrusion with a generous bevel reads as machined; deep extrusion
    // reads as foam board.
    const opts = {
      depth: 3.5,
      bevelEnabled: true,
      bevelThickness: 0.35,
      bevelSize: 0.35,
      bevelSegments: 3,
      curveSegments: 24,
    };
    const geos = shapes.map((shape) => {
      const g = new THREE.ExtrudeGeometry(shape, opts);
      g.translate(-50, -50, -opts.depth / 2);
      return g;
    });

    // Each blade's spine: the radial axis from the mark's center through the
    // blade. Pivoting about this axis flips the blade open like a shutter leaf.
    const axes = geos.map((g) => {
      g.computeBoundingBox();
      const c = new THREE.Vector3();
      g.boundingBox?.getCenter(c);
      c.z = 0;
      return c.normalize();
    });

    // Brand ring: r 6.8, stroke 2.3 in SVG units, so annulus 5.65 to 7.95.
    // Very high segment count and a small bevel so it is a circle, not a gear.
    const ringShape = new THREE.Shape();
    ringShape.absarc(0, 0, 7.95, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, 5.65, 0, Math.PI * 2, true);
    ringShape.holes.push(hole);
    const rg = new THREE.ExtrudeGeometry(ringShape, {
      ...opts,
      curveSegments: 96,
      bevelThickness: 0.2,
      bevelSize: 0.18,
    });
    rg.translate(0, 0, -opts.depth / 2);

    return { bladeGeos: geos, ringGeo: rg, spines: axes };
  }, [svg]);

  // One shared material for all blades so the arrival fade is a single knob.
  const bladeMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ffffff",
        metalness: 1,
        roughness: 0.24,
        envMapIntensity: 1.15,
        transparent: true,
        opacity: 0,
      }),
    [],
  );

  useEffect(
    () => () => {
      bladeGeos.forEach((g) => g.dispose());
      ringGeo.dispose();
      bladeMat.dispose();
    },
    [bladeGeos, ringGeo, bladeMat],
  );

  // Cursor parallax, fine pointers only.
  useEffect(() => {
    if (!window.matchMedia("(pointer: fine)").matches) return;
    const onMove = (e: PointerEvent) => {
      tilt.current.tx = (e.clientY / window.innerHeight - 0.5) * 0.12;
      tilt.current.ty = (e.clientX / window.innerWidth - 0.5) * 0.2;
    };
    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  useFrame((_, delta) => {
    const g = root.current;
    if (!g) return;
    const dt = Math.min(delta, 1 / 30);
    const P = clamp01(progressRef.current);

    // Arrival: the edge-on skeleton fades in and approaches from a short depth.
    const arrive = easeOutCubic(clamp01(P / 0.25));
    bladeMat.opacity = arrive;
    const wantTransparent = arrive < 1;
    if (bladeMat.transparent !== wantTransparent) {
      bladeMat.transparent = wantTransparent;
      bladeMat.needsUpdate = true;
    }

    // Shutter bloom: every blade pivots open about its own spine, with a small
    // ripple sweeping around the circle. Identical local motion per blade
    // keeps every frame 8-fold symmetric.
    blades.current.forEach((blade, i) => {
      if (!blade) return;
      const local = easeInOutCubic(clamp01((P - 0.15 - i * 0.028) / 0.5));
      const phi = (1 - local) * (Math.PI / 2);
      blade.quaternion.setFromAxisAngle(spines[i], phi);
    });

    // The aperture ring locks in over the last stretch, with a small snap.
    if (ring.current) {
      const rp = clamp01((P - 0.72) / 0.28);
      const eased = rp > 0 ? easeOutBack(rp) : 0;
      ring.current.scale.setScalar(Math.max(0.0001, eased));
      ring.current.rotation.z = (1 - rp) * -1.2;
    }

    if (P >= 0.92 && !assembled.current) {
      assembled.current = true;
      onAssembled();
    }

    // Assembled: hang in space. Bounded sway and a slow float, so reflections
    // travel across the metal without ever showing the edge-on view.
    if (P >= 0.995) swayT.current += dt;
    const t = tilt.current;
    t.x += (t.tx - t.x) * 0.06;
    t.y += (t.ty - t.y) * 0.06;
    const sway = swayT.current;
    const approach = easeOutCubic(clamp01(P / 0.5));
    const s = THREE.MathUtils.lerp(0.85, 1, approach) * BASE_SCALE;
    g.scale.set(s, -s, s);
    g.position.z = THREE.MathUtils.lerp(-3, 0, approach);
    g.rotation.x = THREE.MathUtils.lerp(0.3, 0, easeOutCubic(P)) + Math.sin(sway * 0.22 + 1.2) * 0.1 + t.x;
    g.rotation.y = THREE.MathUtils.lerp(0.7, 0, easeOutCubic(P)) + Math.sin(sway * 0.32) * 0.28 + t.y;
    g.position.y = Math.sin(sway * 0.42) * 0.28;
  });

  return (
    // Negative y scale flips the SVG's y-down coordinates into world space.
    <group ref={root} scale={[BASE_SCALE, -BASE_SCALE, BASE_SCALE]}>
      {bladeGeos.map((geo, i) => (
        <group
          key={i}
          ref={(el) => {
            blades.current[i] = el;
          }}
        >
          <mesh geometry={geo} material={bladeMat} />
        </group>
      ))}
      <group ref={ring}>
        <mesh geometry={ringGeo}>
          <meshStandardMaterial
            color={VIOLET}
            metalness={0.85}
            roughness={0.3}
            emissive={VIOLET}
            emissiveIntensity={0.28}
            envMapIntensity={1}
          />
        </mesh>
      </group>
    </group>
  );
}

export default function AriaScene(props: AriaSceneProps) {
  return (
    <Canvas
      frameloop={props.running ? "always" : "never"}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ position: [0, 0, 11], fov: 38 }}
    >
      {/* Procedural studio: light panels rendered into a local environment map.
          This is what the metal reflects; no HDRI download, fully offline. */}
      <Environment resolution={256}>
        <Lightformer form="rect" intensity={3} position={[0, 6, 4]} scale={[12, 5, 1]} rotation-x={-Math.PI / 4} />
        <Lightformer form="rect" intensity={1.6} position={[0, 2, 9]} scale={[10, 4, 1]} />
        <Lightformer form="rect" intensity={0.7} position={[-9, -1, 2]} scale={[3, 8, 1]} rotation-y={Math.PI / 3} />
        <Lightformer form="rect" intensity={0.5} position={[9, -2, 1]} scale={[2, 7, 1]} rotation-y={-Math.PI / 3} />
      </Environment>
      <directionalLight position={[4, 6, 8]} intensity={0.6} />
      <Suspense fallback={null}>
        <Mark progressRef={props.progressRef} onAssembled={props.onAssembled} />
      </Suspense>
    </Canvas>
  );
}
