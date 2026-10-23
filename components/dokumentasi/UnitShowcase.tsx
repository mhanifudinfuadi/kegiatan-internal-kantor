"use client";

import { useEffect, useRef } from "react";
import { Unit } from "@/lib/kegiatan";
import s from "./showcase.module.css";

export default function UnitShowcase({ unit }: { unit: Unit }) {
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    // Petals
    const canvas = root.querySelector<HTMLCanvasElement>("#petals");
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        let w = 0, h = 0, dpr = 1;
        const petals = Array.from({ length: 18 }, () => ({
          x: Math.random() * window.innerWidth,
          y: Math.random() * window.innerHeight,
          r: 4 + Math.random() * 8,
          v: 0.4 + Math.random() * 1.2,
          a: Math.random() * Math.PI * 2,
        }));
        const resize = () => {
          dpr = Math.min(window.devicePixelRatio || 1, 2);
          w = canvas.clientWidth;
          h = canvas.clientHeight;
          canvas.width = w * dpr;
          canvas.height = h * dpr;
          ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        };
        resize();
        window.addEventListener("resize", resize);
        let raf = 0;
        const draw = () => {
          ctx.clearRect(0, 0, w, h);
          for (const p of petals) {
            p.y += p.v;
            p.x += Math.sin(p.a) * 0.6;
            p.a += 0.01;
            if (p.y > h + 20) {
              p.y = -20;
              p.x = Math.random() * w;
            }
            ctx.globalAlpha = 0.7;
            ctx.fillStyle = "#f6b8d0";
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
            ctx.fill();
          }
          if (!reduce) raf = requestAnimationFrame(draw);
        };
        draw();
        return () => {
          window.removeEventListener("resize", resize);
          cancelAnimationFrame(raf);
        };
      }
    }
  }, []);

  return (
    <div ref={rootRef} className={s.stage}>
      <canvas id="petals" aria-hidden="true" />
      <div className={s.village} aria-hidden="true" />
      <div className={s.lantern + " " + s.l1} />
      <div className={s.lantern + " " + s.l2} />
      <div className={s.lantern + " " + s.l3} />

      <header className={s.hud}>
        <div>
          <p className={s.hud__kicker}>活動 · Kegiatan</p>
          <h1 className={s.hud__title}>{unit.nama}</h1>
          <p className={s.hud__sub}>Dokumentasi kegiatan unit kerja.</p>
        </div>
        <div className={s.hud__meta}>
          <b>{unit.kegiatan.length}</b>
          kegiatan
        </div>
      </header>

      <section className={s.frame}>
        <div className={s.ring} />
        <div className={s.scan} />
        <div className={s.track} style={{ transform: "translateX(0%)" }}>
          {unit.kegiatan.map((k, i) => (
            <article key={k.id} className={s.slide}>
              <div className={s.slide__photo}>
                {k.foto[0] ? (
                  <img src={k.foto[0]} alt={`${k.judul}, ${k.tanggal}`} />
                ) : (
                  <div className={s.ph} data-label={k.judul} />
                )}
              </div>
              <div className={s.slide__info}>
                <span className={s.slide__no}>{String(i + 1).padStart(2, "0")}</span>
                <h2 className={s.slide__title}>{k.judul}</h2>
                <span className={s.slide__date}>{k.tanggal}</span>
                <p className={s.slide__desc}>{k.deskripsi}</p>
                <div className={s.slide__tags}>
                  <span className={s.tag}>{k.foto.length} foto</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      </section>

      <div className={s.dots}>
        {unit.kegiatan.map((k, i) => (
          <button key={k.id} className={i === 0 ? s.dot + " " + s.active : s.dot} aria-label={`Slide ${i + 1}`} />
        ))}
      </div>

      <div className={s.lightbox}>
        <button className={s.close} type="button" aria-label="Tutup">×</button>
        <img alt="Foto kegiatan" />
      </div>
    </div>
  );
}
