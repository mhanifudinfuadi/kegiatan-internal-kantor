import Link from "next/link";
import { fetchKegiatan } from "@/lib/supabase";
import { normalisasiUnitKerja } from "@/lib/unit-kerja";
import type { Kegiatan } from "@/lib/types";
import UnitPhotoGrid from "@/components/dokumentasi/UnitPhotoGrid";
import styles from "@/components/dokumentasi/DokumentasiUnit.module.css";

function formatTanggalLengkap(value: string | null) {
  if (!value) return "Tanggal belum dicatat";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Tanggal belum dicatat";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatHari(value: string | null) {
  if (!value) return "--";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("id-ID", { day: "2-digit" }).format(date);
}

function formatBulanTahun(value: string | null) {
  if (!value) return "—";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("id-ID", { month: "long", year: "numeric" }).format(date);
}

function safePhotoUrl(url: string | null) {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  return trimmed;
}

export default async function DokumentasiUnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit } = await params;
  const { kegiatan } = await fetchKegiatan();
  const target = normalisasiUnitKerja(decodeURIComponent(unit).replace(/-/g, " "));
  const items = kegiatan
    .filter((item) => normalisasiUnitKerja(item.unitKerja).slug === target.slug)
    .sort((a, b) => {
      const ta = a.tanggal || a.createdAt;
      const tb = b.tanggal || b.createdAt;
      return tb.localeCompare(ta);
    });

  return (
    <main className={styles.page}>
      <div className={styles.atmosphere} aria-hidden="true" />
      <header className={styles.nav}>
        <Link href="/" className={styles.brand} aria-label="Kembali ke beranda Kegiatan Internal Kantor">
          <span className={styles.brandMark} aria-hidden="true">花</span>
          <span>
            <strong>Ethereal</strong>
            <small>Kegiatan Internal Kantor</small>
          </span>
        </Link>
        <nav className={styles.navLinks} aria-label="Jejak halaman">
          <Link href="/">Beranda</Link>
          <span aria-hidden="true">/</span>
          <Link href="/dokumentasi">Dokumentasi</Link>
          <span aria-hidden="true">/</span>
          <span>{target.nama}</span>
        </nav>
        <Link href="/dokumentasi" className={styles.homeLink}>
          Kembali <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.intro} aria-labelledby="unit-title">
        <div className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span>/</span>
          <Link href="/dokumentasi">Dokumentasi</Link>
          <span>/</span>
          <span>{target.nama}</span>
          <span className={styles.jp}>· 活動記録</span>
        </div>
        <div className={styles.introHeader}>
          <p className={styles.kicker}>RAGAM CERITA · 物語 {target.nama.toUpperCase()}</p>
          <h1 id="unit-title">Kisah {target.nama}</h1>
          <div className={styles.metaRow}>
            <span>{items.length} Agenda</span>
            <span>
              {items.reduce((total, item) => {
                const count = (item.fotoUrls && item.fotoUrls.length > 0)
                  ? item.fotoUrls.filter((u) => Boolean(safePhotoUrl(u))).length
                  : (safePhotoUrl(item.fotoUrl) ? 1 : 0);
                return total + count;
              }, 0)}{" "}
              Foto
            </span>
          </div>
        </div>
      </section>

      <section className={styles.timeline} aria-label="Timeline kegiatan">
        {items.map((item) => {
          const rawPhotos = (item.fotoUrls && item.fotoUrls.length > 0)
            ? item.fotoUrls
            : [item.fotoUrl];
          const photos = rawPhotos
            .map(safePhotoUrl)
            .filter((p): p is string => Boolean(p));
          return (
            <article key={item.id} className={styles.event}>
              <div className={styles.dateColumn}>
                <span className={styles.day}>{formatHari(item.tanggal || item.createdAt)}</span>
                <span className={styles.monthYear}>{formatBulanTahun(item.tanggal || item.createdAt)}</span>
              </div>
              <div className={styles.contentColumn}>
                <header className={styles.headerBlock}>
                  <span className={styles.kicker}>{formatTanggalLengkap(item.tanggal || item.createdAt)}</span>
                  <h2>{item.judul}</h2>
                </header>
                {item.keterangan && <p className={styles.keterangan}>{item.keterangan}</p>}
                {photos.length > 0 && (
                  <UnitPhotoGrid
                    itemJudul={item.judul}
                    photos={photos.map((src, idx) => ({
                      src,
                      title: photos.length > 1 ? `${item.judul} (#${idx + 1})` : item.judul,
                      unit: target.nama,
                      date: formatTanggalLengkap(item.tanggal || item.createdAt),
                      isFirstHero: photos.length > 2 && idx === 0,
                      total: photos.length,
                      overallIndex: idx,
                    }))}
                  />
                )}
              </div>
            </article>
          );
        })}
      </section>

      <div className={styles.backRow}>
        <Link href="/dokumentasi" className={styles.backLink}>
          <span aria-hidden="true">←</span> Kembali ke ragam cerita
        </Link>
      </div>

      <footer className={styles.footer}>
        <span>花　ETHEREAL</span>
        <span>ARSIP KEGIATAN INTERNAL · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
