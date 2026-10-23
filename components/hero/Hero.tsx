"use client";
import Link from "next/link";
import { useRef } from "react";
import PetalCanvas from "./PetalCanvas";
import { useTilt } from "./useTilt";
import { heroContent as c } from "./content";
import s from "./Hero.module.css";

const Arrow = ({ size }: { size: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
    strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M5 12h14M13 6l6 6-6 6" />
  </svg>
);

export default function Hero() {
  const heroRef = useRef<HTMLElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  useTilt(heroRef, sceneRef, 3.5);

  return (
    <section ref={heroRef} className={s.hero} aria-label={c.kicker}>
      <div ref={sceneRef} className={s.scene}>
        <div className={`${s.layer} ${s.layerBg}`} aria-hidden="true" />
        <div className={`${s.layer} ${s.layerSubject}`} role="img" aria-label={c.subjectAlt} />
        <div className={`${s.layer} ${s.layerSheen}`} aria-hidden="true" />
      </div>

      <div className={s.veil} aria-hidden="true" />
      <PetalCanvas className={s.petals} />

      <nav className={s.nav} aria-label="Navigasi utama">
        <Link href="/" className={s.logo}>
          <i className={s.logoDot} aria-hidden="true" />
          <span>{c.logo}</span>
        </Link>
        <ul className={s.menu}>
          {c.nav.map((item) => (
            <li key={item.label}>
              <a href={item.href} aria-disabled="true">{item.label}</a>
            </li>
          ))}
        </ul>
        <div className={s.navCta}>
          <Link href={c.navCta.href} className={s.pill}>
            <span>{c.navCta.label}</span>
            <span className={s.icon}><Arrow size={9} /></span>
          </Link>
        </div>
      </nav>

      <div className={s.center}>
        <p className={s.kicker}>{c.kicker}</p>
        <h1 className={s.headline} aria-label={c.headline}>
          <span className={s.headlineInner}>{c.headline}</span>
        </h1>
        <div className={s.actions}>
          <Link href={c.primaryCta.href} className={`${s.btn} ${s.btnSolid}`}>
            <span>{c.primaryCta.label}</span>
            <span className={s.icon}><Arrow size={10} /></span>
          </Link>
          <a href={c.secondaryCta.href} aria-disabled="true" className={`${s.btn} ${s.btnGhost}`}>
            {c.secondaryCta.label}
          </a>
        </div>
      </div>

      <div className={s.mark} aria-hidden="true">{c.watermark}</div>
    </section>
  );
}
