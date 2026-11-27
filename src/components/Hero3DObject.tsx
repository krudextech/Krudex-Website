"use client";

import React, { useRef, useMemo, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Edges, Text } from '@react-three/drei';
import * as THREE from 'three';
import { useInView } from 'framer-motion';

/* ─────────────────────────────────────────────
   Pillar Material — Vertical Gradient Shader
   ───────────────────────────────────────────── */
const pillarMaterial = new THREE.ShaderMaterial({
  uniforms: {
    colorTop: { value: new THREE.Color("#1A1A1A") }, // near black
    colorBottom: { value: new THREE.Color("#000000") }, // page black
    height: { value: 30.0 }, // default depth
  },
  vertexShader: `
    varying vec3 vPosition;
    void main() {
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 colorTop;
    uniform vec3 colorBottom;
    uniform float height;
    varying vec3 vPosition;
    void main() {
      // vPosition.y goes from -height/2 to height/2
      float normalizedY = (vPosition.y + (height / 2.0)) / height; 
      vec3 color = mix(colorBottom, colorTop, normalizedY);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

type PillarKind = 'web' | 'app' | 'ai';

const BLUE = '#2B7BB4';
const BLUE_GLOW = 'rgba(43, 123, 180, 0.45)';
const WHITE = '#FAFAFA';
const MUTED_LINE = 'rgba(250, 250, 250, 0.22)';

function drawGlow(ctx: CanvasRenderingContext2D, cx: number, cy: number, r: number) {
  const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
  grad.addColorStop(0, 'rgba(43, 123, 180, 0.26)');
  grad.addColorStop(0.55, 'rgba(43, 123, 180, 0.08)');
  grad.addColorStop(1, 'rgba(43, 123, 180, 0)');
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
}

function createTopIconTexture(kind: PillarKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 512;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  const cx = size / 2;
  const cy = size / 2;
  drawGlow(ctx, cx, cy, 220);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'web') {
    // Sleek browser frame + </> code emblem
    const x = 96;
    const y = 120;
    const w = 320;
    const h = 272;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 28);
    ctx.stroke();

    // Top bar line
    ctx.strokeStyle = 'rgba(250, 250, 250, 0.35)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + 12, y + 66);
    ctx.lineTo(x + w - 12, y + 66);
    ctx.stroke();

    // Window dots
    [0, 1, 2].forEach((i) => {
      ctx.fillStyle = i === 0 ? BLUE : 'rgba(250, 250, 250, 0.45)';
      ctx.beginPath();
      ctx.arc(x + 42 + i * 28, y + 36, 8, 0, Math.PI * 2);
      ctx.fill();
    });

    // </> code brackets in signature blue
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 18;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 16;
    // <
    ctx.beginPath();
    ctx.moveTo(210, 246);
    ctx.lineTo(166, 288);
    ctx.lineTo(210, 330);
    ctx.stroke();
    // >
    ctx.beginPath();
    ctx.moveTo(302, 246);
    ctx.lineTo(346, 288);
    ctx.lineTo(302, 330);
    ctx.stroke();
    // /
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 13;
    ctx.beginPath();
    ctx.moveTo(272, 238);
    ctx.lineTo(240, 338);
    ctx.stroke();
    ctx.restore();
  } else if (kind === 'app') {
    // Sleek mobile device + modular app UI blocks
    const x = 152;
    const y = 76;
    const w = 208;
    const h = 360;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 14;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 36);
    ctx.stroke();

    // Dynamic island pill
    ctx.fillStyle = 'rgba(250, 250, 250, 0.55)';
    ctx.beginPath();
    ctx.roundRect(cx - 32, y + 24, 64, 14, 7);
    ctx.fill();

    // Featured blue app card
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 20;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.roundRect(x + 28, y + 66, w - 56, 106, 18);
    ctx.fill();
    ctx.restore();

    // Subtle white shine line inside card
    ctx.fillStyle = 'rgba(250, 250, 250, 0.75)';
    ctx.beginPath();
    ctx.roundRect(x + 46, y + 92, 68, 12, 6);
    ctx.fill();
    ctx.fillStyle = 'rgba(250, 250, 250, 0.4)';
    ctx.beginPath();
    ctx.roundRect(x + 46, y + 118, 96, 10, 5);
    ctx.fill();

    // App grid tiles below
    ctx.fillStyle = 'rgba(250, 250, 250, 0.22)';
    ctx.beginPath();
    ctx.roundRect(x + 28, y + 194, 68, 72, 14);
    ctx.roundRect(x + 112, y + 194, 68, 72, 14);
    ctx.fill();

    // Home bar
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.roundRect(cx - 34, y + h - 34, 68, 10, 5);
    ctx.fill();
  } else {
    // AI neural spark + orbital circuit ring
    ctx.strokeStyle = 'rgba(43, 123, 180, 0.55)';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(cx, cy, 148, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dashed ring
    ctx.save();
    ctx.setLineDash([16, 18]);
    ctx.strokeStyle = 'rgba(250, 250, 250, 0.35)';
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.arc(cx, cy, 112, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 orbital nodes
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang, idx) => {
      const nx = cx + Math.cos(ang + Math.PI / 4) * 148;
      const ny = cy + Math.sin(ang + Math.PI / 4) * 148;
      ctx.fillStyle = idx % 2 === 0 ? BLUE : WHITE;
      ctx.beginPath();
      ctx.arc(nx, ny, 14, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crisp 4-point AI spark star
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 22;
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.moveTo(cx, cy - 86);
    ctx.quadraticCurveTo(cx + 14, cy - 14, cx + 86, cy);
    ctx.quadraticCurveTo(cx + 14, cy + 14, cx, cy + 86);
    ctx.quadraticCurveTo(cx - 14, cy + 14, cx - 86, cy);
    ctx.quadraticCurveTo(cx - 14, cy - 14, cx, cy - 86);
    ctx.closePath();
    ctx.fill();

    // Blue inner core diamond
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(cx, cy, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

function createSideLogoTexture(kind: PillarKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const w = 512;
  const h = 192;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const drawDivider = () => {
    ctx.strokeStyle = MUTED_LINE;
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2, 46);
    ctx.lineTo(w / 2, h - 46);
    ctx.stroke();
  };

  if (kind === 'web') {
    // React atom (left) + Next.js N circle mark (right)
    const rx = 166;
    const ry = h / 2;
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 14;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 6.5;
    [0, Math.PI / 3, -Math.PI / 3].forEach((rot) => {
      ctx.save();
      ctx.translate(rx, ry);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 56, 21, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = WHITE;
    ctx.beginPath();
    ctx.arc(rx, ry, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    drawDivider();

    // Next.js circular N emblem
    const nx = 346;
    const ny = h / 2;
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(nx, ny, 48, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(nx - 20, ny + 22);
    ctx.lineTo(nx - 20, ny - 22);
    ctx.lineTo(nx + 21, ny + 29);
    ctx.stroke();

    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 8.5;
    ctx.beginPath();
    ctx.moveTo(nx + 20, ny - 22);
    ctx.lineTo(nx + 20, ny + 6);
    ctx.stroke();
  } else if (kind === 'app') {
    // Minimal Apple/iOS icon (left) + Android droid head (right)
    ctx.save();
    ctx.translate(120, 50);
    ctx.scale(3.8, 3.8);
    ctx.fillStyle = WHITE;
    const appleBody = new Path2D(
      'M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z'
    );
    ctx.fill(appleBody);
    ctx.restore();

    drawDivider();

    // Geometric Android droid head
    const ax = 346;
    const ay = 130;
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 14;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.arc(ax, ay, 46, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Antennae
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.moveTo(ax - 22, ay - 36);
    ctx.lineTo(ax - 36, ay - 62);
    ctx.moveTo(ax + 22, ay - 36);
    ctx.lineTo(ax + 36, ay - 62);
    ctx.stroke();

    // Cutout eyes
    ctx.fillStyle = '#0A0A0A';
    ctx.beginPath();
    ctx.arc(ax - 20, ay - 18, 5.5, 0, Math.PI * 2);
    ctx.arc(ax + 20, ay - 18, 5.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  } else {
    // 3-layer Neural Network graph
    const layers = [
      { x: 146, ys: [58, 96, 134] },
      { x: 256, ys: [42, 78, 114, 150] },
      { x: 366, ys: [72, 120] },
    ];
    ctx.strokeStyle = 'rgba(43, 123, 180, 0.55)';
    ctx.lineWidth = 3.5;
    for (let l = 0; l < layers.length - 1; l++) {
      for (const y1 of layers[l].ys) {
        for (const y2 of layers[l + 1].ys) {
          ctx.beginPath();
          ctx.moveTo(layers[l].x, y1);
          ctx.lineTo(layers[l + 1].x, y2);
          ctx.stroke();
        }
      }
    }
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 12;
    layers.forEach((layer, li) => {
      layer.ys.forEach((ny, ni) => {
        ctx.fillStyle = li === 2 ? WHITE : ni % 2 === 0 ? BLUE : '#4FA3DC';
        ctx.beginPath();
        ctx.arc(layer.x, ny, li === 2 ? 10 : 8, 0, Math.PI * 2);
        ctx.fill();
      });
    });
    ctx.restore();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 8;
  return tex;
}

/* ─────────────────────────────────────────────
   Platform — Flat diamond with seamless neon edge and solid base
   ───────────────────────────────────────────── */
interface PlatformProps {
  position: [number, number, number];
  size: [number, number]; // width, depth (square)
  kind: PillarKind;
  label?: string;
  sideLabel?: string;
}

const Platform = ({ position, size, kind, label, sideLabel }: PlatformProps) => {
  const [w, d] = size;
  const depth = 18; // Depth of the pillar body for fading into fog

  const groupRef = useRef<THREE.Group>(null);
  const topIconTex = useMemo(() => createTopIconTexture(kind), [kind]);
  const sideLogoTex = useMemo(() => createSideLogoTexture(kind), [kind]);

  // Create a seamless frame geometry using a Shape with a hole
  const frameGeometry = useMemo(() => {
    const t = 0.015; // Thinner neon tube
    const shape = new THREE.Shape();
    // Outer rectangle
    shape.moveTo(-w / 2 - t, -d / 2 - t);
    shape.lineTo(w / 2 + t, -d / 2 - t);
    shape.lineTo(w / 2 + t, d / 2 + t);
    shape.lineTo(-w / 2 - t, d / 2 + t);
    shape.lineTo(-w / 2 - t, -d / 2 - t);

    // Inner rectangle (hole)
    const hole = new THREE.Path();
    hole.moveTo(-w / 2, -d / 2);
    hole.lineTo(-w / 2, d / 2);
    hole.lineTo(w / 2, d / 2);
    hole.lineTo(w / 2, -d / 2);
    hole.lineTo(-w / 2, -d / 2);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }, [w, d]);

  // Create a larger, softer frame geometry for the bloom effect
  const bloomGeometry = useMemo(() => {
    const t = 0.1; // Thinner bloom spread
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - t, -d / 2 - t);
    shape.lineTo(w / 2 + t, -d / 2 - t);
    shape.lineTo(w / 2 + t, d / 2 + t);
    shape.lineTo(-w / 2 - t, d / 2 + t);
    shape.lineTo(-w / 2 - t, -d / 2 - t);

    const hole = new THREE.Path();
    hole.moveTo(-w / 2, -d / 2);
    hole.lineTo(-w / 2, d / 2);
    hole.lineTo(w / 2, d / 2);
    hole.lineTo(w / 2, -d / 2);
    hole.lineTo(-w / 2, -d / 2);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }, [w, d]);

  // Create an even larger, much softer frame for the outer glow
  const outerGlowGeometry = useMemo(() => {
    const t = 0.25; // Thinner outer glow spread
    const shape = new THREE.Shape();
    shape.moveTo(-w / 2 - t, -d / 2 - t);
    shape.lineTo(w / 2 + t, -d / 2 - t);
    shape.lineTo(w / 2 + t, d / 2 + t);
    shape.lineTo(-w / 2 - t, d / 2 + t);
    shape.lineTo(-w / 2 - t, -d / 2 - t);

    const hole = new THREE.Path();
    hole.moveTo(-w / 2, -d / 2);
    hole.lineTo(-w / 2, d / 2);
    hole.lineTo(w / 2, d / 2);
    hole.lineTo(w / 2, -d / 2);
    hole.lineTo(-w / 2, -d / 2);
    shape.holes.push(hole);

    return new THREE.ShapeGeometry(shape);
  }, [w, d]);

  useFrame(({ clock }) => {
    if (groupRef.current) {
      // Very subtle floating motion for the whole platform
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.05;
    }
  });

  return (
    // Rotated 45 degrees to create the isometric diamond shape from the camera's perspective
    <group ref={groupRef} position={position} rotation={[0, Math.PI / 4, 0]}>

      {/* 1. Neon Glowing Edge Frame (Seamless) */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        {/* Core solid bright accent frame */}
        <mesh geometry={frameGeometry}>
          <meshBasicMaterial color="#2B7BB4" />
        </mesh>

        {/* Soft Bloom layers (transparent, additive blending) */}
        <mesh geometry={bloomGeometry} position={[0, 0, -0.01]}>
          <meshBasicMaterial color="#2B7BB4" transparent opacity={0.3} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* Outer large diffuse glow */}
        <mesh geometry={outerGlowGeometry} position={[0, 0, -0.02]}>
          <meshBasicMaterial color="#2B7BB4" transparent opacity={0.12} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* 2. Top Dark Surface (inside the neon frame) */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#141414" />
      </mesh>

      {/* Top Icon Emblem + Label Text on top of the platform */}
      {topIconTex && (
        <mesh
          position={[w * 0.08, 0.04, -d * 0.08]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
        >
          <planeGeometry args={[w * 0.44, w * 0.44]} />
          <meshBasicMaterial map={topIconTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {label && (
        <Text
          position={[-w * 0.22, 0.05, d * 0.22]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
          font="/fonts/outfit-600.woff"
          fontSize={w * 0.16}
          color="#FAFAFA"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.95}
          letterSpacing={0.14}
        >
          {label}
        </Text>
      )}

      {/* 3. Pillar Body extending downwards into the fog */}
      <mesh position={[0, -depth / 2 - 0.02, 0]}>
        <boxGeometry args={[w, depth, d]} />
        {/* Custom shader for smooth vertical gradient fading into darkness */}
        <primitive object={pillarMaterial} attach="material" />
        {/* Subtle structural edge highlights to enhance the 3D volume */}
        <Edges scale={1.001} threshold={15} color="#2B7BB4" transparent opacity={0.22} />
      </mesh>

      {/* 4. Side Tech Logos + Label Text on the pillar face */}
      {sideLogoTex && (
        <mesh position={[0, -w * 0.16, d / 2 + 0.04]}>
          <planeGeometry args={[w * 0.62, w * 0.23]} />
          <meshBasicMaterial map={sideLogoTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {sideLabel && (
        <Text
          position={[0, -w * 0.36, d / 2 + 0.05]} // Positioned cleanly below the tech logos
          rotation={[0, 0, 0]} // Horizontal across the face
          font="/fonts/plus-jakarta-sans-600.woff"
          fontSize={w * 0.092}
          color="#2B7BB4"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.9}
          letterSpacing={0.08}
          maxWidth={w * 0.85} // Constrain text inside the pillar width
          lineHeight={1.25}
          textAlign="center"
        >
          {sideLabel}
        </Text>
      )}
    </group>
  );
};

/* ─────────────────────────────────────────────
   Main Scene
   ───────────────────────────────────────────── */
const DataArchitectureScene = () => {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      // Calculate target rotation based on normalized pointer coordinates (-1 to +1)
      const targetRotationY = (state.pointer.x * Math.PI) / 20; // Subtle horizontal rotation
      const targetRotationX = -(state.pointer.y * Math.PI) / 40; // Very subtle vertical tilt

      // Apply frame-rate independent dampening for a smooth, premium feel
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotationY, 4, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotationX, 4, delta);
    }
  });

  return (
    <group ref={groupRef} position={[1.5, 1.5, 0]}>
      <ambientLight intensity={0.1} />

      {/* Main light from left to illuminate the left-facing walls of the pillars */}
      <directionalLight position={[-15, 10, 5]} intensity={1.5} color="#FFFFFF" />

      {/* Subtle fill light from right */}
      <directionalLight position={[15, 5, -5]} intensity={0.2} color="#FFFFFF" />

      {/* Deep fog to blend the pillars seamlessly into the pitch-black background */}
      <fog attach="fog" args={['#000000', 15, 45]} />

      {/* ── Platforms Stepping Up ── */}
      {/* 1. Lowest, largest, front-left */}
      <Platform position={[-3.2, -2.5, 3.2]} size={[4.2, 4.2]} kind="web" label="WEB" sideLabel="REACT // NEXT.JS" />

      {/* 2. Middle, medium, center */}
      <Platform position={[0, -0.5, 0]} size={[3.2, 3.2]} kind="app" label="APP" sideLabel="IOS // ANDROID" />

      {/* 3. Highest, smallest, back-right */}
      <Platform position={[2.5, 1.5, -2.5]} size={[2.2, 2.2]} kind="ai" label="AI" sideLabel="MACHINE LEARNING" />

    </group>
  );
};

/* ─────────────────────────────────────────────
   Exported Canvas Component
   ───────────────────────────────────────────── */
const Hero3DObject = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  // Stop rendering frames while the hero is scrolled out of view.
  const inView = useInView(wrapperRef, { margin: '100px' });

  return (
    <div ref={wrapperRef} className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        // Camera positioned to perfectly frame the isometric layout on all screen sizes
        camera={{
          position: [0, 8, 20],
          fov: 30,
          near: 0.1,
          far: 100,
        }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ background: 'transparent' }}
        dpr={[1, 1.5]}
      >
        <Suspense fallback={null}>
          <DataArchitectureScene />
        </Suspense>
      </Canvas>
    </div>
  );
};

export default Hero3DObject;
