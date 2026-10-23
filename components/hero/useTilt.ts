"use client";
import { useEffect, type RefObject } from "react";

/**
 * Tilt 3D mengikuti kursor. Menulis --tilt-x dan --tilt-y pada elemen scene.
 * Nonaktif jika pengguna memilih reduced motion.
 */
export function useTilt(
  containerRef: RefObject<HTMLElement | null>,
  sceneRef: RefObject<HTMLElement | null>,
  maxDeg = 3.5,
) {
  useEffect(() => {
    const hero = containerRef.current;
    const scene = sceneRef.current;
    if (!hero || !scene) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let tx = 0, ty = 0, cx = 0, cy = 0, raf: number | null = null;

    const loop = () => {
      cx += (tx - cx) * 0.08;
      cy += (ty - cy) * 0.08;
      scene.style.setProperty("--tilt-x", `${(-cy).toFixed(3)}deg`);
      scene.style.setProperty("--tilt-y", `${cx.toFixed(3)}deg`);
      raf = Math.abs(tx - cx) > 0.01 || Math.abs(ty - cy) > 0.01 ? requestAnimationFrame(loop) : null;
    };

    const onMove = (e: PointerEvent) => {
      const r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - 0.5) * 2 * maxDeg;
      ty = ((e.clientY - r.top) / r.height - 0.5) * 2 * maxDeg;
      if (!raf) raf = requestAnimationFrame(loop);
    };
    const onLeave = () => {
      tx = 0; ty = 0;
      if (!raf) raf = requestAnimationFrame(loop);
    };

    hero.addEventListener("pointermove", onMove);
    hero.addEventListener("pointerleave", onLeave);
    return () => {
      hero.removeEventListener("pointermove", onMove);
      hero.removeEventListener("pointerleave", onLeave);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [containerRef, sceneRef, maxDeg]);
}
