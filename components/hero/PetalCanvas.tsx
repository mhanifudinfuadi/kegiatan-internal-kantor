"use client";
import { useEffect, useRef } from "react";

type Petal = {
  x: number; y: number; size: number; depth: number; vy: number;
  swing: number; phase: number; spin: number; rot: number; alpha: number;
};

const rand = (a: number, b: number) => a + Math.random() * (b - a);

/** Kelopak sakura jatuh dengan kedalaman semu. Digambar ulang tiap frame, dinormalisasi ke 60 fps. */
export default function PetalCanvas({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const count = window.matchMedia("(max-width: 760px)").matches ? 16 : 30;
    let w = 0, h = 0, dpr = 1, petals: Petal[] = [], raf = 0, last = 0;

    const makePetal = (initial: boolean): Petal => {
      const depth = rand(0.3, 1);
      return {
        x: rand(0, w), y: initial ? rand(-h, h) : rand(-50, -10),
        size: rand(6, 13) * (0.5 + depth), depth,
        vy: rand(0.35, 0.85) * (0.5 + depth), swing: rand(0.6, 1.5),
        phase: rand(0, Math.PI * 2), spin: rand(-0.02, 0.02), rot: rand(0, Math.PI * 2),
        alpha: rand(0.55, 0.9) * (0.4 + depth * 0.6),
      };
    };

    const draw = (p: Petal) => {
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(1, 0.55 + 0.45 * Math.abs(Math.cos(p.phase * 1.3)));
      ctx.globalAlpha = p.alpha;
      const g = ctx.createRadialGradient(0, -p.size * 0.2, 1, 0, 0, p.size);
      g.addColorStop(0, "rgba(255,246,250,1)");
      g.addColorStop(0.6, "rgba(246,184,208,0.95)");
      g.addColorStop(1, "rgba(232,140,175,0)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, -p.size);
      ctx.bezierCurveTo(p.size * 0.9, -p.size * 0.6, p.size * 0.9, p.size * 0.6, 0, p.size);
      ctx.bezierCurveTo(-p.size * 0.9, p.size * 0.6, -p.size * 0.9, -p.size * 0.6, 0, -p.size);
      ctx.fill();
      ctx.restore();
    };

    const resize = () => {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.clientWidth; h = canvas.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const frame = (now: number) => {
      const dt = Math.min((now - last) / 16.67, 2);
      last = now;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < petals.length; i++) {
        const p = petals[i];
        p.phase += 0.012 * dt;
        p.y += p.vy * dt;
        p.x += Math.sin(p.phase) * p.swing * dt * 0.6;
        p.rot += p.spin * dt;
        if (p.y > h + 30) petals[i] = makePetal(false);
        draw(petals[i]);
      }
      raf = requestAnimationFrame(frame);
    };

    resize();
    petals = Array.from({ length: count }, () => makePetal(true));
    window.addEventListener("resize", resize);

    if (reduce) {
      petals.forEach(draw);
    } else {
      raf = requestAnimationFrame((t) => { last = t; frame(t); });
    }

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(raf);
    };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
