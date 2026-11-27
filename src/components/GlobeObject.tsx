"use client";

import React, { useEffect, useRef } from 'react';
import createGlobe from 'cobe';

const MARKERS = [
  { location: [37.7595, -122.4367] as [number, number], size: 0.07 }, // San Francisco
  { location: [40.7128, -74.0060] as [number, number], size: 0.07 }, // New York
  { location: [51.5074, -0.1278] as [number, number], size: 0.06 },  // London
  { location: [1.3521, 103.8198] as [number, number], size: 0.06 },  // Singapore
  { location: [35.6762, 139.6503] as [number, number], size: 0.05 }, // Tokyo
  { location: [48.8566, 2.3522] as [number, number], size: 0.05 },   // Paris
  { location: [-33.8688, 151.2093] as [number, number], size: 0.05 },// Sydney
  { location: [25.2048, 55.2708] as [number, number], size: 0.05 },  // Dubai
  { location: [19.0760, 72.8777] as [number, number], size: 0.04 },  // Mumbai
  { location: [-23.5505, -46.6333] as [number, number], size: 0.05 },// São Paulo
];

const ACCENT_RGB: [number, number, number] = [0.169, 0.482, 0.706]; // #2B7BB4
const BG_RGB: [number, number, number] = [0.025, 0.025, 0.025];
const THETA = 0.3;

function toUnitVec([lat, lon]: [number, number]): [number, number, number] {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180 - Math.PI;
  const cosLat = Math.cos(latRad);
  return [-cosLat * Math.cos(lonRad), Math.sin(latRad), cosLat * Math.sin(lonRad)];
}

const MARKER_DATA = MARKERS.map((m) => ({ ...m, vec: toUnitVec(m.location) }));

function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

/**
 * Compute per-marker brightness and radius from camera-space depth (nz)
 * so markers fade gradually into the globe instead of popping at the horizon.
 */
function getFadedMarkers(phi: number) {
  const cosTheta = Math.cos(THETA);
  const sinTheta = Math.sin(THETA);
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  return MARKER_DATA.map(({ location, size, vec: [px, py, pz] }) => {
    const nz = -sinPhi * cosTheta * px + sinTheta * py + cosPhi * cosTheta * pz;
    const colorFade = smoothstep(0.02, 0.58, nz);
    const sizeFade = smoothstep(0.01, 0.22, nz);
    return {
      location,
      size: size * sizeFade,
      color: [
        BG_RGB[0] + (ACCENT_RGB[0] - BG_RGB[0]) * colorFade,
        BG_RGB[1] + (ACCENT_RGB[1] - BG_RGB[1]) * colorFade,
        BG_RGB[2] + (ACCENT_RGB[2] - BG_RGB[2]) * colorFade,
      ] as [number, number, number],
    };
  });
}

export default function GlobeObject() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const phi = useRef(0);
  const isDragging = useRef(false);
  const lastX = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let width = canvas.offsetWidth;

    const globe = createGlobe(canvas, {
      devicePixelRatio: 1,
      width: width * 2,
      height: width * 2,
      phi: phi.current,
      theta: THETA,
      dark: 1,
      diffuse: 1.4,
      mapSamples: 8000,
      mapBrightness: 2.8,
      baseColor: [0.05, 0.05, 0.05],
      markerColor: ACCENT_RGB, // #2B7BB4 accent
      glowColor: [0.15, 0.15, 0.15],
      markerElevation: 0,
      markers: getFadedMarkers(phi.current),
    });

    // Only render while the globe is on screen.
    let visible = true;
    const observer = new IntersectionObserver(([entry]) => {
      const wasVisible = visible;
      visible = entry.isIntersecting;
      if (visible && !wasVisible) raf = requestAnimationFrame(animate);
    });
    observer.observe(canvas);

    let raf: number;
    const animate = () => {
      if (!visible) return;
      if (!isDragging.current) {
        phi.current += 0.003;
      }
      width = canvas.offsetWidth;
      globe.update({
        phi: phi.current,
        width: width * 2,
        height: width * 2,
        markers: getFadedMarkers(phi.current),
      });
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);

    const handleResize = () => { width = canvas.offsetWidth; };
    window.addEventListener('resize', handleResize);

    return () => {
      observer.disconnect();
      globe.destroy();
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <div className="relative w-full h-full flex items-center justify-center">
      {/* Ambient glow behind the globe */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[65%] aspect-square rounded-full bg-krudex-accent/6 blur-[100px]" />
      </div>
      <canvas
        ref={canvasRef}
        className="w-full aspect-square max-w-[600px] cursor-grab active:cursor-grabbing"
        style={{ contain: 'layout paint size' }}
        onPointerDown={(e) => {
          (e.target as HTMLCanvasElement).setPointerCapture(e.pointerId);
          isDragging.current = true;
          lastX.current = e.clientX;
        }}
        onPointerUp={() => { isDragging.current = false; }}
        onPointerOut={() => { isDragging.current = false; }}
        onPointerMove={(e) => {
          if (isDragging.current) {
            const delta = e.clientX - lastX.current;
            phi.current += delta / 200;
            lastX.current = e.clientX;
          }
        }}
      />
    </div>
  );
}
