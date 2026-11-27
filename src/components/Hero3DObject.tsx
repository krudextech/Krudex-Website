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
    colorTop: { value: new THREE.Color('#161920') },
    colorBottom: { value: new THREE.Color('#000000') },
    height: { value: 24.0 },
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
      float normalizedY = clamp((vPosition.y + (height / 2.0)) / height, 0.0, 1.0);
      vec3 color = mix(colorBottom, colorTop, normalizedY);
      gl_FragColor = vec4(color, 1.0);
    }
  `,
});

type PillarKind = 'web' | 'app' | 'ai';

const ACCENT_BLUE = '#2B7BB4';
const LUMINOUS_BLUE = '#4FA3DC';
const TEXT_BLUE = '#3D94D1';
const SILVER = '#DCE3EC';
const SILVER_BRIGHT = '#F1F5F9';
const GLASS_TOP = '#161B24';
const GLASS_BOTTOM = '#0B0D12';
const GLASS_BORDER = 'rgba(250, 250, 250, 0.16)';

function finalizeTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 16;
  tex.minFilter = THREE.LinearMipmapLinearFilter;
  tex.magFilter = THREE.LinearFilter;
  tex.generateMipmaps = true;
  tex.needsUpdate = true;
  return tex;
}

/**
 * Draws a frosted dark-glass UI panel card matching ProductMock.tsx aesthetics.
 */
function drawGlassCard(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number,
  borderWidth = 4
) {
  const bgGrad = ctx.createLinearGradient(x, y, x, y + h);
  bgGrad.addColorStop(0, GLASS_TOP);
  bgGrad.addColorStop(1, GLASS_BOTTOM);

  ctx.save();
  ctx.fillStyle = bgGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  // Subtle ambient blue corner wash inside the tile
  const tintGrad = ctx.createRadialGradient(x + w * 0.5, y + h * 0.15, 0, x + w * 0.5, y + h * 0.25, w * 0.85);
  tintGrad.addColorStop(0, 'rgba(43, 123, 180, 0.16)');
  tintGrad.addColorStop(1, 'rgba(43, 123, 180, 0)');
  ctx.fillStyle = tintGrad;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();

  // Hairline glass border
  ctx.strokeStyle = GLASS_BORDER;
  ctx.lineWidth = borderWidth;
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.stroke();

  // Subtle top inner sheen
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = Math.max(2, borderWidth * 0.6);
  ctx.beginPath();
  ctx.moveTo(x + radius, y + borderWidth);
  ctx.lineTo(x + w - radius, y + borderWidth);
  ctx.stroke();
  ctx.restore();
}

/**
 * Top surface UI miniature artwork — echoes Krudex's ProductMock UI language
 * cleanly without thick cartoon strokes or blurry glow halos.
 */
function createTopUiEmblemTexture(kind: PillarKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const size = 1024;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, size, size);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const cx = size / 2;
  const cy = size / 2;

  if (kind === 'web') {
    // Mini SaaS Dashboard UI card (directly echoes ProductMock SaaS card)
    const x = 132;
    const y = 172;
    const w = 760;
    const h = 640;
    drawGlassCard(ctx, x, y, w, h, 48, 6);

    // Window header divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.10)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 6, y + 108);
    ctx.lineTo(x + w - 6, y + 108);
    ctx.stroke();

    // Traffic window dots + subtle address pill
    [0, 1, 2].forEach((i) => {
      ctx.fillStyle = i === 0 ? LUMINOUS_BLUE : 'rgba(255, 255, 255, 0.24)';
      ctx.beginPath();
      ctx.arc(x + 64 + i * 38, y + 54, 11, 0, Math.PI * 2);
      ctx.fill();
    });

    ctx.fillStyle = 'rgba(255, 255, 255, 0.06)';
    ctx.beginPath();
    ctx.roundRect(x + 208, y + 32, 340, 44, 14);
    ctx.fill();

    // Sidebar skeleton rows (left column)
    const sideX = x + 46;
    const sideWidths = [110, 132, 96, 120];
    sideWidths.forEach((bw, idx) => {
      ctx.fillStyle = idx === 0 ? 'rgba(79, 163, 220, 0.75)' : 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.roundRect(sideX, y + 162 + idx * 54, bw, 18, 9);
      ctx.fill();
    });

    // Vertical sidebar divider
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(x + 218, y + 114);
    ctx.lineTo(x + 218, y + h - 18);
    ctx.stroke();

    // Right panel: mini analytics chart container
    const chartX = x + 260;
    const chartY = y + 164;
    const chartW = 452;
    const chartH = 412;
    ctx.fillStyle = 'rgba(255, 255, 255, 0.03)';
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(chartX, chartY, chartW, chartH, 28);
    ctx.fill();
    ctx.stroke();

    // Ascending analytics bars
    const bars = [0.32, 0.48, 0.40, 0.66, 0.58, 0.84, 0.96];
    const barGap = 18;
    const padX = 40;
    const barW = (chartW - padX * 2 - barGap * (bars.length - 1)) / bars.length;
    const maxBarH = chartH - 88;
    const baseLine = chartY + chartH - 36;

    bars.forEach((ratio, idx) => {
      const bh = maxBarH * ratio;
      const bx = chartX + padX + idx * (barW + barGap);
      const by = baseLine - bh;
      ctx.fillStyle = idx === bars.length - 1 ? LUMINOUS_BLUE : idx >= bars.length - 3 ? ACCENT_BLUE : 'rgba(43, 123, 180, 0.36)';
      ctx.beginPath();
      ctx.roundRect(bx, by, barW, bh, [10, 10, 4, 4]);
      ctx.fill();
    });
  } else if (kind === 'app') {
    // Sleek dark mobile device frame (directly echoes ProductMock Mobile card)
    const pw = 456;
    const ph = 780;
    const px = cx - pw / 2;
    const py = cy - ph / 2;

    drawGlassCard(ctx, px, py, pw, ph, 76, 6);

    // Dynamic island pill
    ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
    ctx.beginPath();
    ctx.roundRect(cx - 72, py + 44, 144, 24, 12);
    ctx.fill();

    // Primary blue app feature card inside screen
    const cardX = px + 48;
    const cardY = py + 116;
    const cardW = pw - 96;
    const cardH = 228;
    const cardGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY + cardH);
    cardGrad.addColorStop(0, LUMINOUS_BLUE);
    cardGrad.addColorStop(1, '#1B4E73');
    ctx.fillStyle = cardGrad;
    ctx.beginPath();
    ctx.roundRect(cardX, cardY, cardW, cardH, 36);
    ctx.fill();

    // Shimmer bars inside feature card
    ctx.fillStyle = 'rgba(255, 255, 255, 0.82)';
    ctx.beginPath();
    ctx.roundRect(cardX + 38, cardY + 54, 148, 22, 11);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.40)';
    ctx.beginPath();
    ctx.roundRect(cardX + 38, cardY + 98, 212, 16, 8);
    ctx.fill();
    // Mini progress track
    ctx.fillStyle = 'rgba(255, 255, 255, 0.22)';
    ctx.beginPath();
    ctx.roundRect(cardX + 38, cardY + 156, cardW - 76, 14, 7);
    ctx.fill();
    ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
    ctx.beginPath();
    ctx.roundRect(cardX + 38, cardY + 156, (cardW - 76) * 0.66, 14, 7);
    ctx.fill();

    // Clean UI list rows below card
    [0, 1].forEach((i) => {
      const ry = cardY + cardH + 34 + i * 118;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.05)';
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(cardX, ry, cardW, 96, 26);
      ctx.fill();
      ctx.stroke();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.14)';
      ctx.beginPath();
      ctx.roundRect(cardX + 24, ry + 24, 48, 48, 14);
      ctx.fill();

      ctx.fillStyle = 'rgba(255, 255, 255, 0.28)';
      ctx.beginPath();
      ctx.roundRect(cardX + 94, ry + 30, 150 - i * 32, 14, 7);
      ctx.fill();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.12)';
      ctx.beginPath();
      ctx.roundRect(cardX + 94, ry + 56, 98, 12, 6);
      ctx.fill();
    });

    // Tab indicator dots at bottom
    [0, 1, 2, 3].forEach((i) => {
      ctx.fillStyle = i === 0 ? LUMINOUS_BLUE : 'rgba(255, 255, 255, 0.24)';
      ctx.beginPath();
      ctx.arc(cx - 84 + i * 56, py + ph - 52, 10, 0, Math.PI * 2);
      ctx.fill();
    });
  } else {
    // AI core tile — frosted rounded badge + architectural spark + orbital ticks
    const tileSize = 680;
    const tx = cx - tileSize / 2;
    const ty = cy - tileSize / 2;
    drawGlassCard(ctx, tx, ty, tileSize, tileSize, 152, 7);

    // Subtle concentric hairline orbits
    ctx.strokeStyle = 'rgba(79, 163, 220, 0.36)';
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(cx, cy, 226, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(cx, cy, 158, 0, Math.PI * 2);
    ctx.stroke();

    // 4 crisp diagonal terminal nodes on outer orbit
    [0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].forEach((ang, idx) => {
      const a = ang + Math.PI / 4;
      const nx = cx + Math.cos(a) * 226;
      const ny = cy + Math.sin(a) * 226;
      ctx.fillStyle = idx % 2 === 0 ? LUMINOUS_BLUE : SILVER;
      ctx.beginPath();
      ctx.arc(nx, ny, 20, 0, Math.PI * 2);
      ctx.fill();
    });

    // Crisp geometric 4-point spark star
    const sr = 128;
    const ir = 26;
    ctx.fillStyle = SILVER_BRIGHT;
    ctx.beginPath();
    ctx.moveTo(cx, cy - sr);
    ctx.quadraticCurveTo(cx + ir, cy - ir, cx + sr, cy);
    ctx.quadraticCurveTo(cx + ir, cy + ir, cx, cy + sr);
    ctx.quadraticCurveTo(cx - ir, cy + ir, cx - sr, cy);
    ctx.quadraticCurveTo(cx - ir, cy - ir, cx, cy - sr);
    ctx.closePath();
    ctx.fill();

    // Blue precision core dot
    ctx.fillStyle = ACCENT_BLUE;
    ctx.beginPath();
    ctx.arc(cx, cy, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  return finalizeTexture(canvas);
}

/**
 * Side favicon logo strip — unified dark-glass squircle tiles across all three
 * pillars with matched silver/cerulean lineweight so icons harmonize with UI cards.
 */
function createSideLogoTexture(kind: PillarKind): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const w = 1024;
  const h = 340;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) return null;

  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  const tileSize = 252;
  const gap = 76;
  const totalW = tileSize * 2 + gap;
  const leftX = (w - totalW) / 2;
  const rightX = leftX + tileSize + gap;
  const topY = (h - tileSize) / 2;
  const r = 56;

  drawGlassCard(ctx, leftX, topY, tileSize, tileSize, r, 4.5);
  drawGlassCard(ctx, rightX, topY, tileSize, tileSize, r, 4.5);

  const lcx = leftX + tileSize / 2;
  const lcy = topY + tileSize / 2;
  const rcx = rightX + tileSize / 2;
  const rcy = topY + tileSize / 2;

  if (kind === 'web') {
    // Tile 1: Clean geometric React orbital rings (no fuzzy blur)
    ctx.strokeStyle = LUMINOUS_BLUE;
    ctx.lineWidth = 8;
    [0, Math.PI / 3, -Math.PI / 3].forEach((rot) => {
      ctx.save();
      ctx.translate(lcx, lcy);
      ctx.rotate(rot);
      ctx.beginPath();
      ctx.ellipse(0, 0, 74, 27, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    });
    ctx.fillStyle = SILVER_BRIGHT;
    ctx.beginPath();
    ctx.arc(lcx, lcy, 13, 0, Math.PI * 2);
    ctx.fill();

    // Tile 2: Refined Next.js N circle mark in balanced silver + cerulean accent
    ctx.strokeStyle = 'rgba(220, 227, 236, 0.72)';
    ctx.lineWidth = 7.5;
    ctx.beginPath();
    ctx.arc(rcx, rcy, 66, 0, Math.PI * 2);
    ctx.stroke();

    ctx.strokeStyle = SILVER_BRIGHT;
    ctx.lineWidth = 10.5;
    ctx.beginPath();
    ctx.moveTo(rcx - 26, rcy + 30);
    ctx.lineTo(rcx - 26, rcy - 30);
    ctx.lineTo(rcx + 28, rcy + 38);
    ctx.stroke();

    ctx.strokeStyle = LUMINOUS_BLUE;
    ctx.lineWidth = 10.5;
    ctx.beginPath();
    ctx.moveTo(rcx + 26, rcy - 30);
    ctx.lineTo(rcx + 26, rcy + 8);
    ctx.stroke();
  } else if (kind === 'app') {
    // Tile 1: Matte satin-silver Apple mark (tames white glare inside frosted tile)
    ctx.save();
    ctx.translate(lcx - 62, lcy - 68);
    ctx.scale(5.2, 5.2);
    ctx.fillStyle = SILVER;
    const appleBody = new Path2D(
      'M16.365 1.43c0 1.14-.493 2.27-1.177 3.08-.744.9-1.99 1.57-2.987 1.57-.12 0-.23-.02-.3-.03-.01-.06-.04-.22-.04-.39 0-1.15.572-2.27 1.206-2.98.804-.94 2.142-1.64 3.248-1.68.03.13.05.28.05.43zm4.565 15.71c-.03.07-.463 1.58-1.518 3.12-.945 1.34-1.94 2.71-3.43 2.71-1.517 0-1.9-.88-3.63-.88-1.698 0-2.302.91-3.67.91-1.377 0-2.332-1.26-3.428-2.8-1.287-1.82-2.323-4.63-2.323-7.28 0-4.28 2.797-6.55 5.552-6.55 1.448 0 2.675.95 3.6.95.865 0 2.222-1.01 3.902-1.01.613 0 2.886.06 4.374 2.19-.13.09-2.383 1.37-2.383 4.19 0 3.26 2.854 4.42 2.955 4.45z'
    );
    ctx.fill(appleBody);
    ctx.restore();

    // Tile 2: Clean geometric Android dome emblem matched in weight
    const ay = rcy + 40;
    ctx.fillStyle = LUMINOUS_BLUE;
    ctx.beginPath();
    ctx.arc(rcx, ay, 66, Math.PI, 0, false);
    ctx.closePath();
    ctx.fill();

    // Antennae
    ctx.strokeStyle = LUMINOUS_BLUE;
    ctx.lineWidth = 10;
    ctx.beginPath();
    ctx.moveTo(rcx - 32, ay - 52);
    ctx.lineTo(rcx - 50, ay - 86);
    ctx.moveTo(rcx + 32, ay - 52);
    ctx.lineTo(rcx + 50, ay - 86);
    ctx.stroke();

    // Cutout eyes matching frosted tile surface
    ctx.fillStyle = '#0F131B';
    ctx.beginPath();
    ctx.arc(rcx - 28, ay - 26, 8, 0, Math.PI * 2);
    ctx.arc(rcx + 28, ay - 26, 8, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Tile 1: Clean 4-point AI spark emblem
    const sr = 68;
    const ir = 15;
    ctx.fillStyle = SILVER_BRIGHT;
    ctx.beginPath();
    ctx.moveTo(lcx, lcy - sr);
    ctx.quadraticCurveTo(lcx + ir, lcy - ir, lcx + sr, lcy);
    ctx.quadraticCurveTo(lcx + ir, lcy + ir, lcx, lcy + sr);
    ctx.quadraticCurveTo(lcx - ir, lcy + ir, lcx - sr, lcy);
    ctx.quadraticCurveTo(lcx - ir, lcy - ir, lcx, lcy - sr);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = ACCENT_BLUE;
    ctx.beginPath();
    ctx.arc(lcx, lcy, 15, 0, Math.PI * 2);
    ctx.fill();

    // Tile 2: Bold symmetrical 2-3-2 Neural Tensor Crest (crisp even on smaller Pillar 3)
    const layers = [
      { x: rcx - 56, ys: [rcy - 34, rcy + 34] },
      { x: rcx, ys: [rcy - 54, rcy, rcy + 54] },
      { x: rcx + 56, ys: [rcy - 34, rcy + 34] },
    ];
    ctx.strokeStyle = 'rgba(79, 163, 220, 0.52)';
    ctx.lineWidth = 5;
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
    layers.forEach((layer, li) => {
      layer.ys.forEach((ny, ni) => {
        ctx.fillStyle = li === 2 || (li === 1 && ni === 1) ? SILVER_BRIGHT : LUMINOUS_BLUE;
        ctx.beginPath();
        ctx.arc(layer.x, ny, li === 1 && ni === 1 ? 14 : 12, 0, Math.PI * 2);
        ctx.fill();
      });
    });
  }

  return finalizeTexture(canvas);
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
  const topIconTex = useMemo(() => createTopUiEmblemTexture(kind), [kind]);
  const sideLogoTex = useMemo(() => createSideLogoTexture(kind), [kind]);

  // Create a seamless frame geometry using a Shape with a hole
  const frameGeometry = useMemo(() => {
    const t = 0.015;
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

  const bloomGeometry = useMemo(() => {
    const t = 0.09;
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

  const outerGlowGeometry = useMemo(() => {
    const t = 0.22;
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
      groupRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + position[0]) * 0.05;
    }
  });

  return (
    <group ref={groupRef} position={position} rotation={[0, Math.PI / 4, 0]}>
      {/* 1. Neon Glowing Edge Frame (Seamless) */}
      <group rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]}>
        <mesh geometry={frameGeometry}>
          <meshBasicMaterial color={ACCENT_BLUE} />
        </mesh>
        <mesh geometry={bloomGeometry} position={[0, 0, -0.01]}>
          <meshBasicMaterial color={ACCENT_BLUE} transparent opacity={0.28} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
        <mesh geometry={outerGlowGeometry} position={[0, 0, -0.02]}>
          <meshBasicMaterial color={ACCENT_BLUE} transparent opacity={0.11} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>
      </group>

      {/* 2. Top Dark Surface */}
      <mesh position={[0, -0.01, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[w, d]} />
        <meshBasicMaterial color="#101318" />
      </mesh>

      {/* Top UI Mini Card + Clean Display Label */}
      {topIconTex && (
        <mesh
          position={[w * 0.09, 0.04, -d * 0.09]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
        >
          <planeGeometry args={[w * 0.44, w * 0.44]} />
          <meshBasicMaterial map={topIconTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {label && (
        <Text
          position={[-w * 0.21, 0.05, d * 0.21]}
          rotation={[-Math.PI / 2, 0, -Math.PI / 4]}
          font="/fonts/outfit-600.woff"
          fontSize={w * 0.145}
          color="#F3F5F8"
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.95}
          letterSpacing={0.08}
        >
          {label}
        </Text>
      )}

      {/* 3. Pillar Body extending downwards into the fog */}
      <mesh position={[0, -depth / 2 - 0.02, 0]}>
        <boxGeometry args={[w, depth, d]} />
        <primitive object={pillarMaterial} attach="material" />
        <Edges scale={1.001} threshold={15} color={ACCENT_BLUE} transparent opacity={0.24} />
      </mesh>

      {/* 4. Side Dark-Glass Favicon Tiles + Sora Blue Label */}
      {sideLogoTex && (
        <mesh position={[0, -w * 0.165, d / 2 + 0.04]}>
          <planeGeometry args={[w * 0.61, w * 0.203]} />
          <meshBasicMaterial map={sideLogoTex} transparent depthWrite={false} toneMapped={false} />
        </mesh>
      )}
      {sideLabel && (
        <Text
          position={[0, -w * 0.36, d / 2 + 0.05]}
          rotation={[0, 0, 0]}
          font="/fonts/sora-600.woff"
          fontSize={kind === 'ai' ? w * 0.08 : w * 0.088}
          color={TEXT_BLUE}
          anchorX="center"
          anchorY="middle"
          fillOpacity={0.96}
          letterSpacing={kind === 'ai' ? 0.015 : 0.025}
          maxWidth={w * 0.86}
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
      const targetRotationY = (state.pointer.x * Math.PI) / 20;
      const targetRotationX = -(state.pointer.y * Math.PI) / 40;
      groupRef.current.rotation.y = THREE.MathUtils.damp(groupRef.current.rotation.y, targetRotationY, 4, delta);
      groupRef.current.rotation.x = THREE.MathUtils.damp(groupRef.current.rotation.x, targetRotationX, 4, delta);
    }
  });

  return (
    <group ref={groupRef} position={[0.85, 0.65, 0]}>
      <ambientLight intensity={0.1} />
      <directionalLight position={[-15, 10, 5]} intensity={1.5} color="#FFFFFF" />
      <directionalLight position={[15, 5, -5]} intensity={0.2} color="#FFFFFF" />
      <fog attach="fog" args={['#000000', 16, 46]} />

      {/* ── Platforms Stepping Up — balanced scale & unobstructed framing ── */}
      <Platform position={[-2.95, -2.15, 2.95]} size={[3.9, 3.9]} kind="web" label="WEB" sideLabel="React · Next.js" />
      <Platform position={[0, -0.4, 0]} size={[3.15, 3.15]} kind="app" label="APP" sideLabel="iOS · Android" />
      <Platform position={[2.55, 1.3, -2.55]} size={[2.5, 2.5]} kind="ai" label="AI" sideLabel="Machine Learning" />
    </group>
  );
};

/* ─────────────────────────────────────────────
   Exported Canvas Component
   ───────────────────────────────────────────── */
const Hero3DObject = () => {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inView = useInView(wrapperRef, { margin: '100px' });

  return (
    <div ref={wrapperRef} className="w-full h-full absolute inset-0 pointer-events-none">
      <Canvas
        frameloop={inView ? 'always' : 'never'}
        camera={{
          position: [0, 9.6, 20.5],
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
