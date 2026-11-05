"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const GLYPHS = "桜花月雪京炎鋼刃水火空心和道未来電脳夜風雲龍光夢";

type PhotoItem = {
  key: string;
  image: string;
  title: string;
  date: string;
  unit: string;
  category: string;
};

function buildScanCards(activities: any[]): PhotoItem[] {
  const photos: PhotoItem[] = [];
  activities.forEach((act: any) => {
    const list = act.fotoUrls && act.fotoUrls.length > 0 ? act.fotoUrls : act.fotoUrl ? [act.fotoUrl] : [];
    list.forEach((image: string, idx: number) => {
      if (!image) return;
      photos.push({
        key: `${act.id}-foto-${idx}`,
        image,
        title: act.judul || "Dokumentasi",
        date: act.tanggal || "",
        unit: act.unitKerja || "",
        category: (act.unitKerja || "DOKUMENTASI").toUpperCase(),
      });
    });
  });
  return photos;
}

function formatTanggal(dateStr: string): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" });
}

export default function TalksShowcasePage() {
  const trackRef = useRef<HTMLDivElement>(null);
  const beamRef = useRef<HTMLDivElement>(null);
  const [items, setItems] = useState<PhotoItem[]>([]);
  const [isHovering, setIsHovering] = useState(false);
  const [status, setStatus] = useState<"idle" | "scanning" | "paused">("idle");
  const [reduced, setReduced] = useState(false);
  const rafRef = useRef<number | null>(null);
  const positionRef = useRef(0);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, []);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/kegiatan", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (mounted && Array.isArray(json?.kegiatan)) {
          const cards = buildScanCards(json.kegiatan);
          setItems(cards);
        }
      } catch (e) {}
    }
    load();
    const refresh = () => {
      if (document.visibilityState === "visible") load();
    };
    const iv = setInterval(refresh, 30_000);
    return () => {
      mounted = false;
      clearInterval(iv);
    };
  }, []);

  const getCenterOffset = (track: HTMLElement) => {
    const stage = track.parentElement;
    if (!stage) return 0;
    const first = track.children[0] as HTMLElement | undefined;
    if (!first) return 0;
    return stage.clientWidth / 2 - first.getBoundingClientRect().width / 2;
  };

  const updateDissolve = (track: HTMLElement) => {
    const stage = track.parentElement;
    if (!stage) return;
    const beamX = stage.getBoundingClientRect().left + stage.clientWidth / 2;
    const cards = track.children;
    for (let i = 0; i < cards.length; i++) {
      const card = cards[i] as HTMLElement;
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const lewat = (beamX - cardCenter) / Math.max(rect.width, 1);
      const progress = Math.min(Math.max(lewat, 0), 1);
      const prev = card.dataset.dissolve;
      const next = progress.toFixed(3);
      if (prev !== next) {
        card.dataset.dissolve = next;
        card.style.setProperty("--scan", next);
        card.classList.toggle("is-dissolving", progress > 0);
        card.classList.toggle("is-gone", progress >= 1);
      }
    }
  };

  useEffect(() => {
    if (!trackRef.current || items.length === 0) return;
    const track = trackRef.current;
    const center = getCenterOffset(track);
    if (reduced) {
      track.style.transform = `translateX(${center}px)`;
      updateDissolve(track);
      return;
    }
    const speed = 55;
    let lastTime = performance.now();
    const animate = (now: number) => {
      const delta = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;
      const currentSpeed = isHovering ? speed * 0.35 : speed;
      positionRef.current -= currentSpeed * delta;
      const loopWidth = track.scrollWidth / 3;
      if (loopWidth > 0 && Math.abs(positionRef.current) >= loopWidth) {
        positionRef.current += loopWidth;
      }
      track.style.transform = `translateX(${positionRef.current + center}px)`;
      updateDissolve(track);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [isHovering, reduced, items.length]);

  useEffect(() => {
    positionRef.current = 0;
    const track = trackRef.current;
    if (!track) return;
    const center = getCenterOffset(track);
    track.style.transform = `translateX(${center}px)`;
    updateDissolve(track);
  }, [items.length]);

  const handleMouseEnter = () => {
    setIsHovering(true);
    setStatus("paused");
  };
  const handleMouseLeave = () => {
    setIsHovering(false);
    setStatus("idle");
  };
  const handlePause = () => {
    setIsHovering(true);
    setStatus("paused");
  };
  const handleResume = () => {
    setIsHovering(false);
    setStatus("idle");
  };

  if (items.length === 0) {
    return (
      <main className="sc-page">
        <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Shippori+Mincho:wght@400;500;600&display=swap" rel="stylesheet" />
        <header className="sc-nav">
          <div className="sc-brand">
            <div className="sc-brand-mark"></div>
            <span>SAKURA / 活動記録</span>
          </div>
          <nav className="sc-nav-links">
            <Link href="/">BERANDA</Link>
            <Link href="/dokumentasi">DOKUMENTASI</Link>
            <Link href="/galeri">GALERI</Link>
          </nav>
        </header>
        <section className="sc" id="scan">
          <div className="wrap">
            <p className="eyebrow light">スキャン</p>
            <h2 className="sc-title">Pindaian <span>Kegiatan</span></h2>
            <p className="sc-lead">Garis pemindai bergerak melintasi kartu kegiatan yang ada fotonya.</p>
            <div className="sc-empty">Belum ada foto kegiatan yang diunggah.</div>
          </div>
        </section>
        <style>{styles}</style>
      </main>
    );
  }

  return (
    <main className="sc-page">
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Shippori+Mincho:wght@400;500;600&display=swap" rel="stylesheet" />
      <header className="sc-nav">
        <div className="sc-brand">
          <div className="sc-brand-mark"></div>
          <span>SAKURA / 活動記録</span>
        </div>
        <nav className="sc-nav-links">
          <Link href="/">BERANDA</Link>
          <Link href="/dokumentasi">DOKUMENTASI</Link>
          <Link href="/galeri">GALERI</Link>
        </nav>
      </header>

      <section className="sc" id="scan" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <div className="wrap">
          <p className="eyebrow light">スキャン</p>
          <h2 className="sc-title">Pindaian <span>Kegiatan</span></h2>
          <p className="sc-lead">
            {items.length} foto dokumentasi melintas di garis pemindai. Foto memudar menjadi aksara saat melewati garis.
          </p>

          <div className="sc-stage">
            <div className="sc-track" ref={trackRef} style={{ animation: reduced ? "none" : undefined }}>
              {[0, 1, 2].map((copy) =>
                items.map((photo) => (
                  <div key={`${photo.key}-${copy}`} className="sc-card">
                    <div className="sc-chip">
                      <span>{GLYPHS}桜花月雪京炎鋼刃水火空心和道未来電脳夜</span>
                    </div>
                    <div className="sc-photo" role="img" aria-label={photo.title} style={{ backgroundImage: `url("${photo.image}")` }} />
                    <div className="sc-glyphs" aria-hidden="true">
                      {Array.from({ length: 130 }).map((_, i) => (
                        <span key={i}>{GLYPHS[i % GLYPHS.length]}</span>
                      ))}
                    </div>
                    <div className="sc-info">
                      <span className="sc-tag">{photo.category}</span>
                      <h2>{photo.title}</h2>
                      <p>
                        {formatTanggal(photo.date)}
                        {photo.unit ? ` · ${photo.unit}` : ""}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="sc-beam" ref={beamRef} />
          </div>

          <div className="sc-controls">
            <button className="sc-btn" onClick={handlePause} disabled={status === "paused" || reduced}>
              Jeda
            </button>
            <button className="sc-btn" onClick={handleResume} disabled={status === "idle" || reduced}>
              Lanjut
            </button>
            <span className="sc-status">{status === "paused" ? "Dijeda" : status === "idle" ? "Berjalan" : "Memindai"}</span>
          </div>
        </div>
      </section>
      <style>{styles}</style>
    </main>
  );
}

const styles = `
  .sc-page { margin: 0; color: #fbeef4; font-family: 'Noto Sans JP', system-ui, sans-serif; background: radial-gradient(1200px 800px at 50% 0%, rgba(242, 155, 189, 0.18), transparent 60%), radial-gradient(900px 600px at 20% 10%, rgba(160, 66, 112, 0.16), transparent 55%), linear-gradient(180deg, #140f16 0%, #0c080d 100%); min-height: 100dvh; overflow-x: hidden; position: relative; }
  .sc-nav { display: flex; align-items: center; justify-content: space-between; gap: 20px; padding: 26px clamp(20px,6vw,88px); backdrop-filter: blur(12px); background: linear-gradient(180deg, rgba(36,22,34,0.7) 0%, transparent 100%); border-bottom: 1px solid rgba(255,208,224,.18); }
  .sc-brand { display: flex; align-items: center; gap: 14px; font-weight: 600; letter-spacing: .12em; text-transform: uppercase; font-size: 12px; }
  .sc-brand-mark { width: 38px; height: 38px; border-radius: 50%; background: radial-gradient(circle at 50% 28%, #fff 0 8%, #ffd0e0 9% 20%, transparent 22%), radial-gradient(circle at 28% 56%, #f29bbd 0 22%, transparent 24%), radial-gradient(circle at 72% 56%, #d45e98 0 22%, transparent 24%); filter: drop-shadow(0 0 12px #f29bbd88); }
  .sc-nav-links { display: flex; gap: 1rem; }
  .sc-nav-links a { color: #ffd0e0; text-decoration: none; border: 1px solid rgba(242,155,189,.6); border-radius: 999px; padding: 9px 16px; font-size: 11px; letter-spacing: .18em; backdrop-filter: blur(8px); background: rgba(36,22,34,0.4); }
  .sc { position: relative; padding: clamp(3rem, 8vw, 6rem) 0 clamp(4rem, 10vw, 7rem); }
  .sc .wrap { width: min(1180px, calc(100% - 2rem)); margin: 0 auto; display: flex; flex-direction: column; gap: 1rem; }
  .eyebrow.light { font-size: 11px; letter-spacing: .32em; text-transform: uppercase; color: #f29bbd; }
  .sc-title { font: 400 clamp(2.5rem, 6vw, 4.8rem)/1.08 'Shippori Mincho', serif; margin: 0; }
  .sc-title span { color: #ffc5dc; font-style: italic; }
  .sc-lead { max-width: 720px; color: #d9b5c6; line-height: 1.9; margin: 0; }
  .sc-empty { margin-top: 2rem; padding: 2rem; border-radius: 18px; border: 1px solid rgba(255,208,224,.28); background: radial-gradient(circle at top, rgba(242,155,189,.16), transparent 60%), rgba(20,15,22,.8); text-align: center; color: #d9b5c6; }
  .sc-stage { position: relative; margin-top: clamp(2rem, 6vw, 4rem); height: clamp(380px, 58vw, 520px); overflow: hidden; border-radius: clamp(24px, 6vw, 36px); border: 1px solid rgba(255,208,224,.26); background: radial-gradient(ellipse at center, rgba(242,155,189,.14), transparent 60%), radial-gradient(circle at 50% 0%, rgba(255,208,224,.12), transparent 55%), #120b12; box-shadow: 0 80px 140px -90px rgba(242,155,189,.45); }
  .sc-stage::before, .sc-stage::after { content: ""; position: absolute; inset: 0; pointer-events: none; z-index: 4; }
  .sc-stage::before { background: linear-gradient(90deg, rgba(12,8,13,.95) 0%, transparent 16%, transparent 84%, rgba(12,8,13,.95) 100%); }
  .sc-stage::after { background: radial-gradient(ellipse at center, transparent 38%, rgba(8,5,9,.28) 100%); }
  .sc-track { position: absolute; left: 0; top: 50%; display: flex; gap: 40px; height: clamp(320px, 46vw, 420px); transform: translateY(-50%); will-change: transform; z-index: 1; }
  .sc-card { position: relative; flex: 0 0 clamp(260px, 28vw, 340px); height: 100%; border-radius: 26px; overflow: hidden; border: 1px solid rgba(255,208,224,.32); background: radial-gradient(circle at top, rgba(242,155,189,.18), transparent 55%), #140f16; box-shadow: 0 40px 90px -40px rgba(242,155,189,.4); isolation: isolate; --scan: 0; }
  .sc-card.is-dissolving .sc-photo { filter: saturate(0.4) contrast(0.9); }
  .sc-card.is-gone .sc-info, .sc-card.is-gone .sc-tag { opacity: 0; }
  .sc-chip { position: absolute; inset: 0; overflow: hidden; z-index: 0; background: repeating-linear-gradient(0deg, transparent 0 14px, rgba(242,155,189,.06) 15px 16px), repeating-linear-gradient(90deg, transparent 0 20px, rgba(242,155,189,.08) 21px 22px), radial-gradient(circle at 50% 0, rgba(255,208,224,.12), transparent 60%), linear-gradient(160deg, #2a1926, #120b12 80%); }
  .sc-chip span { position: absolute; inset: -40% -20%; font-size: 10px; letter-spacing: 1.6em; writing-mode: vertical-rl; text-orientation: mixed; color: rgba(255,208,224,.12); transform: rotate(12deg); white-space: nowrap; }
  .sc-photo { position: absolute; inset: 0; background-size: cover; background-position: center; z-index: 1; clip-path: inset(calc(var(--scan) * 100%) 0 0 0); transition: clip-path 180ms linear, filter 320ms ease; will-change: clip-path; }
  .sc-photo::after { content: ""; position: absolute; inset: 0; background: linear-gradient(180deg, rgba(12,8,13,.02) 20%, rgba(12,8,13,.9) 100%); }
  .sc-glyphs { position: absolute; inset: 0; z-index: 2; display: grid; grid-template-columns: repeat(10, 1fr); grid-template-rows: repeat(13, 1fr); padding: 14px; gap: 1px; pointer-events: none; mask-image: linear-gradient(90deg, #000 0%, #000 70%, transparent 100%); }
  .sc-glyphs span { font-size: clamp(11px, 1.3vw, 16px); color: rgba(242,155,189,.16); text-align: center; align-self: center; font-family: 'Noto Sans JP', sans-serif; }
  .sc-card.is-dissolving .sc-glyphs span { color: rgba(255,224,239,.72); text-shadow: 0 0 12px rgba(255,190,218,.9); }
  .sc-info { position: absolute; z-index: 3; left: 26px; right: 26px; bottom: 26px; display: flex; flex-direction: column; gap: 6px; text-shadow: 0 4px 16px #000; transition: opacity 280ms ease; }
  .sc-tag { font-size: 10px; letter-spacing: .28em; text-transform: uppercase; color: #ffc3da; transition: opacity 280ms ease; }
  .sc-info h2 { margin: 0; font: 400 clamp(1.2rem, 2.4vw, 1.6rem)/1.26 'Shippori Mincho', serif; }
  .sc-info p { margin: 0; font-size: 11px; letter-spacing: .12em; color: #e7c9d8; }
  .sc-beam { position: absolute; z-index: 5; top: 50%; left: 50%; height: clamp(320px, 46vw, 420px); width: 2px; transform: translate(-50%, -50%); pointer-events: none; background: linear-gradient(180deg, transparent, rgba(255,208,224,.9) 10%, #fff 50%, rgba(255,208,224,.9) 90%, transparent); box-shadow: 0 0 14px 6px #ffd0e0, 0 0 44px 18px #ff8dbd99, 0 0 120px 30px #ff8dbd44; }
  .sc-beam::before { content: ""; position: absolute; left: 50%; top: 0; bottom: 0; width: 220px; transform: translateX(-50%); background: linear-gradient(90deg, transparent, rgba(255,134,190,.08) 40%, rgba(255,174,211,.22) 50%, rgba(255,134,190,.08) 60%, transparent); filter: blur(12px); }
  .sc-beam::after { content: ""; position: absolute; left: 50%; top: 50%; width: 14px; height: 14px; border-radius: 50%; transform: translate(-50%, -50%); background: #fff; box-shadow: 0 0 16px 8px #fff, 0 0 40px 18px #ff9fc8; }
  .sc-controls { display: flex; align-items: center; justify-content: center; gap: 12px; flex-wrap: wrap; margin-top: clamp(1.2rem, 4vw, 2rem); }
  .sc-btn { border: 1px solid rgba(242,155,189,.7); background: linear-gradient(90deg, rgba(66,34,55,0.9), rgba(36,22,34,0.9)); color: #fbeef4; padding: 10px 18px; border-radius: 999px; font-size: 12px; letter-spacing: .14em; text-transform: uppercase; cursor: pointer; backdrop-filter: blur(10px); }
  .sc-btn:disabled { opacity: .4; cursor: not-allowed; }
  .sc-status { color: #ffd0e0; font-size: 11px; letter-spacing: .18em; text-transform: uppercase; }
  @media (max-width: 680px) { .sc-card { flex-basis: 240px; border-radius: 22px; } .sc-info { left: 18px; right: 18px; bottom: 18px; } .sc-glyphs { padding: 10px; } }
`;
