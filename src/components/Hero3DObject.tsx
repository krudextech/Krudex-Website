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

  // Large centered ambient glow
  drawGlow(ctx, cx, cy, 240);

  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (kind === 'web') {
    // Large browser window icon — centered, fills most of the canvas
    const x = 72;
    const y = 88;
    const w = 368;
    const h = 316;
    // Outer frame
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 32);
    ctx.stroke();

    // Top bar fill (subtle)
    ctx.fillStyle = 'rgba(250,250,250,0.06)';
    ctx.beginPath();
    ctx.roundRect(x + 2, y + 2, w - 4, 68, [32, 32, 0, 0]);
    ctx.fill();

    // Top bar separator
    ctx.strokeStyle = 'rgba(250,250,250,0.3)';
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(x + 14, y + 70);
    ctx.lineTo(x + w - 14, y + 70);
    ctx.stroke();

    // Window dots
    [0, 1, 2].forEach((i) => {
      ctx.fillStyle = i === 0 ? BLUE : 'rgba(250,250,250,0.5)';
      ctx.beginPath();
      ctx.arc(x + 46 + i * 32, y + 36, 10, 0, Math.PI * 2);
      ctx.fill();
    });

    // Large <> code emblem centered in lower portion
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 28;
    ctx.strokeStyle = BLUE;
    ctx.lineWidth = 20;
    // <
    ctx.beginPath();
    ctx.moveTo(cx - 48, cy + 42);
    ctx.lineTo(cx - 108, cy + 96);
    ctx.lineTo(cx - 48, cy + 150);
    ctx.stroke();
    // >
    ctx.beginPath();
    ctx.moveTo(cx + 48, cy + 42);
    ctx.lineTo(cx + 108, cy + 96);
    ctx.lineTo(cx + 48, cy + 150);
    ctx.stroke();
    // /
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 15;
    ctx.beginPath();
    ctx.moveTo(cx + 28, cy + 34);
    ctx.lineTo(cx - 28, cy + 158);
    ctx.stroke();
    ctx.restore();

  } else if (kind === 'app') {
    // Large mobile phone icon — tall, centered
    const pw = 220;
    const ph = 376;
    const px = cx - pw / 2;
    const py = cy - ph / 2 + 10;

    // Phone body
    ctx.strokeStyle = WHITE;
    ctx.lineWidth = 16;
    ctx.beginPath();
    ctx.roundRect(px, py, pw, ph, 44);
    ctx.stroke();

    // Subtle inner fill
    ctx.fillStyle = 'rgba(250,250,250,0.04)';
    ctx.beginPath();
    ctx.roundRect(px + 2, py + 2, pw - 4, ph - 4, 42);
    ctx.fill();

    // Dynamic island
    ctx.fillStyle = 'rgba(250,250,250,0.6)';
    ctx.beginPath();
    ctx.roundRect(cx - 36, py + 24, 72, 16, 8);
    ctx.fill();

    // Blue app card
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 24;
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.roundRect(px + 28, py + 72, pw - 56, 112, 20);
    ctx.fill();
    ctx.restore();

    // Card content lines
    ctx.fillStyle = 'rgba(250,250,250,0.8)';
    ctx.beginPath();
    ctx.roundRect(px + 48, py + 100, 76, 13, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(250,250,250,0.45)';
    ctx.beginPath();
    ctx.roundRect(px + 48, py + 128, 108, 11, 6);
    ctx.fill();

    // App grid 2×2
    ctx.fillStyle = 'rgba(250,250,250,0.18)';
    [[px + 28, py + 210], [px + 116, py + 210], [px + 28, py + 298], [px + 116, py + 298]].forEach(([gx, gy]) => {
      ctx.beginPath();
      ctx.roundRect(gx, gy, 76, 76, 16);
      ctx.fill();
    });

    // Home bar
    ctx.fillStyle = BLUE;
    ctx.beginPath();
    ctx.roundRect(cx - 38, py + ph - 36, 76, 11, 6);
    ctx.fill();

  } else {
    // AI — large 4-point spark star with orbital ring, full canvas scale
    // Outer orbit ring
    ctx.strokeStyle = 'rgba(43,123,180,0.5)';
    ctx.lineWidth = 9;
    ctx.beginPath();
    ctx.arc(cx, cy, 180, 0, Math.PI * 2);
    ctx.stroke();

    // Dashed inner ring
    ctx.save();
    ctx.setLineDash([20, 22]);
    ctx.strokeStyle = 'rgba(250,250,250,0.3)';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(cx, cy, 136, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // 4 large orbital nodes
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang, idx) => {
      const nx = cx + Math.cos(ang + Math.PI / 4) * 180;
      const ny = cy + Math.sin(ang + Math.PI / 4) * 180;
      ctx.save();
      ctx.shadowColor = idx % 2 === 0 ? BLUE_GLOW : 'rgba(250,250,250,0.4)';
      ctx.shadowBlur = 16;
      ctx.fillStyle = idx % 2 === 0 ? BLUE : WHITE;
      ctx.beginPath();
      ctx.arc(nx, ny, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // Large 4-point star — dominant, centered
    ctx.save();
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 32;
    ctx.fillStyle = WHITE;
    const sr = 110; // outer ray radius
    const ir = 18;  // inner pinch radius
    ctx.beginPath();
    ctx.moveTo(cx, cy - sr);
    ctx.quadraticCurveTo(cx + ir, cy - ir, cx + sr, cy);
    ctx.quadraticCurveTo(cx + ir, cy + ir, cx, cy + sr);
    ctx.quadraticCurveTo(cx - ir, cy + ir, cx - sr, cy);
    ctx.quadraticCurveTo(cx - ir, cy - ir, cx, cy - sr);
    ctx.closePath();
    ctx.fill();

    // Blue core
    ctx.fillStyle = BLUE;
    ctx.shadowColor = BLUE_GLOW;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.arc(cx, cy, 22, 0, Math.PI * 2);
    ctx.fill();
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

      {/* Top Icon Emblem — centered, fills most of the top face */}
      {topIconTex && (
        <mesh
          position={[0, 0.04, 0]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
        >
          <planeGeometry args={[w * 0.82, w * 0.82]} />
          <meshBasicMaterial map={topIconTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}

      {/* 3. Pillar Body extending downwards into the fog */}
      <mesh position={[0, -depth / 2 - 0.02, 0]}>
        <boxGeometry args={[w, depth, d]} />
        {/* Custom shader for smooth vertical gradient fading into darkness */}
        <primitive object={pillarMaterial} attach="material" />
        {/* Subtle structural edge highlights to enhance the 3D volume */}
        <Edges scale={1.001} threshold={15} color="#2B7BB4" transparent opacity={0.22} />
      </mesh>

      {/* 4. Side Text — main word (large, white) + subtitle (small, blue) */}
      {label && (
        <Text
          position={[0, -w * 0.18, d / 2 + 0.05]}
          rotation={[0, 0, 0]}
          font="/fonts/outfit-600.woff"
          fontSize={w * 0.18}
          color="#FAFAFA"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.95}
          letterSpacing={0.12}
        >
          {label}
        </Text>
      )}
      {sideLabel && (
        <Text
          position={[0, -w * 0.38, d / 2 + 0.05]}
          rotation={[0, 0, 0]}
          font="/fonts/plus-jakarta-sans-600.woff"
          fontSize={w * 0.078}
          color="#2B7BB4"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.85}
          letterSpacing={0.1}
          maxWidth={w * 0.88}
          lineHeight={1.3}
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
