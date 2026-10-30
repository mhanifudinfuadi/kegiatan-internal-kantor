import Link from "next/link";
import { fetchKegiatan } from "@/lib/supabase";
import { normalisasiUnitKerja } from "@/lib/unit-kerja";
import type { Kegiatan } from "@/lib/types";
import styles from "@/components/dokumentasi/DokumentasiIndex.module.css";

type RingkasanUnit = {
  slug: string;
  nama: string;
  kegiatan: Kegiatan[];
  cover: Kegiatan | null;
};

function formatTanggal(value: string | null) {
  if (!value) return "Tanggal belum dicatat";
  const date = new Date(`${value.slice(0, 10)}T00:00:00`);
  if (Number.isNaN(date.getTime())) return "Tanggal belum dicatat";
  return new Intl.DateTimeFormat("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

export default async function DokumentasiPage() {
  const { kegiatan, sumber, catatan } = await fetchKegiatan();
  const units = new Map<string, RingkasanUnit>();

  for (const item of kegiatan) {
    const unit = normalisasiUnitKerja(item.unitKerja);
    const current = units.get(unit.slug) ?? {
      slug: unit.slug,
      nama: unit.nama,
      kegiatan: [],
      cover: null,
    };
    current.kegiatan.push(item);
    if (!current.cover && item.fotoUrl) current.cover = item;
    units.set(unit.slug, current);
  }

  const daftarUnit = Array.from(units.values())
    .map((unit) => ({
      ...unit,
      terbaru: unit.kegiatan[0],
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const jumlahFoto = kegiatan.reduce((total, item) => {
    const count = (item.fotoUrls && item.fotoUrls.length > 0)
      ? item.fotoUrls.length
      : (item.fotoUrl ? 1 : 0);
    return total + count;
  }, 0);

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
          <span aria-current="page">Dokumentasi</span>
        </nav>
        <Link href="/" className={styles.homeLink}>
          Kembali <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.intro} aria-labelledby="page-title">
        <div className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span>/</span>
          <span>Dokumentasi</span>
          <span className={styles.jp}>· 活動記録</span>
        </div>
        <div className={styles.introRow}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>ARSIP KEGIATAN · INTERNAL MADU JAKBAR</p>
            <h1 id="page-title">
              Cerita di balik
              <br />
              <em>setiap kebersamaan.</em>
            </h1>
            <p className={styles.lede}>Jelajahi dokumentasi kegiatan internal dari setiap unit kerja.</p>
          </div>
          <div className={styles.readouts} aria-label="Ringkasan dokumentasi">
            <div>
              <span>
                Unit kerja <i>部署</i>
              </span>
              <strong>{String(daftarUnit.length).padStart(2, "0")}</strong>
            </div>
            <div>
              <span>
                Kegiatan <i>活動</i>
              </span>
              <strong>{String(kegiatan.length).padStart(2, "0")}</strong>
            </div>
            <div>
              <span>
                Foto <i>写真</i>
              </span>
              <strong>{String(jumlahFoto).padStart(2, "0")}</strong>
            </div>
          </div>
        </div>
        <div className={styles.sectionHeading}>
          <div>
            <span className={styles.sectionIndex}>01 / DIREKTORI</span>
            <h2>Unit kerja</h2>
          </div>
          <p>
            Pilih unit untuk melihat seluruh catatan kegiatannya <span aria-hidden="true">↓</span>
          </p>
        </div>
      </section>

      {catatan && (
        <p className={styles.dataNotice} role="status">
          {catatan}
        </p>
      )}

      {daftarUnit.length ? (
        <section className={styles.unitGrid} aria-label="Daftar unit kerja">
          {daftarUnit.map((unit, index) => (
            <Link key={unit.slug} href={`/dokumentasi/${unit.slug}`} className={styles.unitCard}>
              <div className={styles.cover}>
                {unit.cover?.fotoUrl ? (
                  <img
                    src={unit.cover.fotoUrl}
                    alt={`Dokumentasi ${unit.cover.judul} — ${formatTanggal(unit.cover.tanggal)}`}
                    loading="lazy"
                    decoding="async"
                  />
                ) : (
                  <div className={styles.coverEmpty}>
                    <span aria-hidden="true">✿</span>
                    <span>Belum ada foto</span>
                  </div>
                )}
                <span className={styles.unitNo}>{String(index + 1).padStart(2, "0")}</span>
                <span className={styles.coverTag}>{unit.kegiatan.length} KEGIATAN</span>
                <span className={styles.cardArrow} aria-hidden="true">
                  ↗
                </span>
              </div>
              <div className={styles.unitInfo}>
                <span className={styles.unitKicker}>
                  UNIT KERJA <span>· {String(index + 1).padStart(2, "0")}</span>
                </span>
                <h3>{unit.nama}</h3>
                <p className={styles.latestDate}>{formatTanggal(unit.terbaru?.tanggal ?? null)}</p>
                <div className={styles.latestLine}>
                  <span>Kegiatan terbaru</span>
                  <strong>{unit.terbaru?.judul ?? "Belum ada kegiatan"}</strong>
                </div>
              </div>
            </Link>
          ))}
        </section>
      ) : (
        <section className={styles.emptyState} aria-labelledby="empty-title">
          <span className={styles.emptyFlower} aria-hidden="true">
            ✿
          </span>
          <p className={styles.eyebrow}>ARSIP MASIH KOSONG</p>
          <h2 id="empty-title">Cerita pertama akan dimulai di sini.</h2>
          <p>Dokumentasi kegiatan yang diunggah melalui portal Madu Jakbar Sport akan muncul di halaman ini.</p>
          <Link href="/" className={styles.emptyLink}>
            Kembali ke beranda <span aria-hidden="true">↗</span>
          </Link>
        </section>
      )}

      <footer className={styles.footer}>
        <span>花　ETHEREAL</span>
        <span>ARSIP KEGIATAN INTERNAL · {new Date().getFullYear()}</span>
      </footer>
    </main>
  );
}
