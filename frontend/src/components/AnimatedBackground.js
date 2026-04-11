'use client';
import { useRef, useEffect, useCallback } from 'react';

/*  Animated Mesh Gradient Background
    ===================================
    - 5 overlapping radial blobs that morph & drift
    - Mouse-reactive positioning
    - Condition-reactive color palette
*/

const CONDITION_PALETTES = {
  default:    ['rgba(74,108,247,0.18)', 'rgba(139,92,246,0.14)', 'rgba(56,189,248,0.12)', 'rgba(168,130,255,0.1)', 'rgba(96,138,240,0.08)'],
  asthma:     ['rgba(56,189,248,0.22)', 'rgba(74,108,247,0.16)', 'rgba(34,211,238,0.14)', 'rgba(139,92,246,0.1)',  'rgba(56,189,248,0.08)'],
  cardiovascular: ['rgba(239,68,68,0.16)', 'rgba(244,114,182,0.14)', 'rgba(139,92,246,0.12)', 'rgba(74,108,247,0.1)', 'rgba(248,113,113,0.08)'],
  neurological: ['rgba(139,92,246,0.2)', 'rgba(168,85,247,0.16)', 'rgba(74,108,247,0.14)', 'rgba(196,181,253,0.1)', 'rgba(109,141,255,0.08)'],
  'post-stroke': ['rgba(245,158,11,0.18)', 'rgba(251,191,36,0.14)', 'rgba(139,92,246,0.12)', 'rgba(74,108,247,0.1)', 'rgba(252,211,77,0.08)'],
  parkinsons: ['rgba(34,197,94,0.18)', 'rgba(74,108,247,0.14)', 'rgba(45,212,191,0.12)', 'rgba(139,92,246,0.1)',  'rgba(34,197,94,0.08)'],
  depression: ['rgba(99,102,241,0.2)', 'rgba(139,92,246,0.16)', 'rgba(74,108,247,0.14)', 'rgba(168,85,247,0.1)',  'rgba(129,140,248,0.08)'],
};

export default function AnimatedBackground({ activeCondition = null }) {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0.5, y: 0.5 });
  const blobsRef = useRef(null);
  const paletteRef = useRef(CONDITION_PALETTES.default);
  const targetPaletteRef = useRef(CONDITION_PALETTES.default);
  const frameRef = useRef(0);

  // Smooth palette transition
  useEffect(() => {
    targetPaletteRef.current = CONDITION_PALETTES[activeCondition] || CONDITION_PALETTES.default;
  }, [activeCondition]);

  const initBlobs = useCallback(() => {
    return Array.from({ length: 5 }, (_, i) => ({
      x: 0.2 + Math.random() * 0.6,
      y: 0.2 + Math.random() * 0.6,
      vx: (Math.random() - 0.5) * 0.0004,
      vy: (Math.random() - 0.5) * 0.0004,
      radius: 0.2 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 0.4,
    }));
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    blobsRef.current = initBlobs();

    const handleMouse = (e) => {
      mouseRef.current.x = e.clientX / window.innerWidth;
      mouseRef.current.y = e.clientY / window.innerHeight;
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('mousemove', handleMouse, { passive: true });
    window.addEventListener('resize', resize);
    resize();

    let animId;

    const draw = () => {
      animId = requestAnimationFrame(draw);
      frameRef.current++;

      const w = canvas.width;
      const h = canvas.height;
      const time = frameRef.current * 0.008;

      ctx.clearRect(0, 0, w, h);

      const blobs = blobsRef.current;
      const palette = paletteRef.current;
      const targetPalette = targetPaletteRef.current;

      // Smoothly lerp palette colors (we just swap every ~60 frames for simplicity)
      if (frameRef.current % 60 === 0) {
        paletteRef.current = targetPalette;
      }

      blobs.forEach((blob, i) => {
        // Drift + mouse influence
        const mx = (mouseRef.current.x - 0.5) * 0.04;
        const my = (mouseRef.current.y - 0.5) * 0.04;

        blob.x += blob.vx + Math.sin(time * blob.speed + blob.phase) * 0.001 + mx * 0.002;
        blob.y += blob.vy + Math.cos(time * blob.speed + blob.phase) * 0.001 + my * 0.002;

        // Boundary bounce
        if (blob.x < 0.05 || blob.x > 0.95) blob.vx *= -1;
        if (blob.y < 0.05 || blob.y > 0.95) blob.vy *= -1;
        blob.x = Math.max(0.05, Math.min(0.95, blob.x));
        blob.y = Math.max(0.05, Math.min(0.95, blob.y));

        const cx = blob.x * w;
        const cy = blob.y * h;
        const r = blob.radius * Math.max(w, h) * (0.9 + Math.sin(time + i) * 0.1);

        const gradient = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        gradient.addColorStop(0, palette[i] || 'rgba(74,108,247,0.15)');
        gradient.addColorStop(1, 'rgba(0,0,0,0)');

        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, w, h);
      });
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener('mousemove', handleMouse);
      window.removeEventListener('resize', resize);
    };
  }, [initBlobs]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  );
}
