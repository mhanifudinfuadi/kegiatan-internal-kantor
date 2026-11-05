import Link from "next/link";
import { unstable_noStore as noStore } from "next/cache";
import { fetchKegiatan } from "@/lib/supabase";
import { normalisasiUnitKerja } from "@/lib/unit-kerja";
import type { Kegiatan } from "@/lib/types";
import StoryCard from "@/components/dokumentasi/StoryCard";
import styles from "@/components/dokumentasi/DokumentasiIndex.module.css";

export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

type RingkasanUnit = {
  slug: string;
  nama: string;
  kegiatan: Kegiatan[];
  foto: Array<{ src: string; judul: string; tanggal: string | null }>;
};

/** Ambil seluruh foto sebuah kegiatan (bukan hanya foto utama/terakhir). */
function semuaFoto(item: Kegiatan): string[] {
  const daftar = (item.fotoUrls && item.fotoUrls.length > 0 ? item.fotoUrls : [item.fotoUrl])
    .map((url) => (url ?? "").trim())
    .filter(Boolean);
  return daftar;
}

export default async function DokumentasiPage() {
  noStore();
  const { catatan, kegiatan } = await fetchKegiatan(500);
  const units = new Map<string, RingkasanUnit>();

  for (const item of kegiatan) {
    const unit = normalisasiUnitKerja(item.unitKerja);
    const current = units.get(unit.slug) ?? {
      slug: unit.slug,
      nama: unit.nama,
      kegiatan: [],
      foto: [],
    };
    current.kegiatan.push(item);
    for (const src of semuaFoto(item)) {
      current.foto.push({ src, judul: item.judul, tanggal: item.tanggal });
    }
    units.set(unit.slug, current);
  }

  const daftarUnit = Array.from(units.values())
    .map((unit) => ({
      ...unit,
      terbaru: unit.kegiatan[0],
    }))
    .sort((a, b) => a.nama.localeCompare(b.nama));

  const jumlahFoto = kegiatan.reduce((total, item) => total + semuaFoto(item).length, 0);

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
          <span aria-hidden="true">/</span>
          <Link href="/dokumentasi-showcase">Showcase</Link>
        </nav>
        <Link href="/galeri" className={styles.homeLink}>
          Galeri <span aria-hidden="true">↗</span>
        </Link>
      </header>

      <section className={styles.intro} aria-labelledby="page-title">
        <div className={styles.breadcrumb}>
          <Link href="/">Beranda</Link>
          <span>/</span>
          <span>Dokumentasi</span>
          <span className={styles.jp}>· 美しい瞳、甘い笑顔</span>
        </div>
        <div className={styles.introRow}>
          <div className={styles.introCopy}>
            <p className={styles.eyebrow}>ARSIP KEGIATAN · INTERNAL MADU JAKBAR</p>
            <h1 id="page-title">
              Cerita di balik
              <br />
              <em>setiap kebersamaan.</em>
            </h1>
            <p className={styles.lede}>Jelajahi ragam cerita dan monogatari dari setiap jenis kegiatan internal kantor.</p>
          </div>
          <div className={styles.readouts} aria-label="Ringkasan dokumentasi">
            <div>
              <span>
                Ragam cerita <i>物語</i>
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
            <h2>Ragam cerita</h2>
          </div>
          <p>
            Pilih cerita kegiatan untuk melihat seluruh catatan kenangannya <span aria-hidden="true">↓</span>
          </p>
        </div>
      </section>

      {catatan && (
        <p className={styles.dataNotice} role="status">
          {catatan}
        </p>
      )}

      {daftarUnit.length ? (
        <section className={styles.unitGrid} aria-label="Daftar ragam cerita kegiatan">
          {daftarUnit.map((unit, index) => (
            <StoryCard
              key={unit.slug}
              href={`/dokumentasi/${unit.slug}`}
              nama={unit.nama}
              index={index}
              photos={unit.foto}
              kegiatanCount={unit.kegiatan.length}
              latestTanggal={unit.terbaru?.tanggal ?? null}
              latestJudul={unit.terbaru?.judul ?? null}
            />
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
          <Link href="/dashboard" className={styles.emptyLink}>
            Unggah dokumentasi <span aria-hidden="true">↗</span>
          </Link>
        </section>
      )}

      <footer className={styles.footer}>
        <span>花　ETHEREAL</span>
        <span>ARSIP KEGIATAN INTERNAL · {new Date().getFullYear()}</span>
      </footer>
      <p className={styles.dataNotice} style={{ paddingTop: 0 }}>
        Kelola unggahan foto kegiatan lewat <Link href="/dashboard">dashboard</Link>.
      </p>
    </main>
  );
}
