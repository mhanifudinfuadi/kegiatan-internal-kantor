import Link from "next/link";
import Image from "next/image";
import { fetchKegiatan } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Galeri Dokumentasi — Kegiatan Internal Kantor",
  description: "Seluruh foto dokumentasi kegiatan internal kantor Madu Jakbar Sport.",
};

export default async function GaleriPage() {
  const { kegiatan, catatan } = await fetchKegiatan(500);
  const photos: Array<{ src: string; unit: string; title: string; tanggal: string; slug: string }> = [];

  for (const item of kegiatan) {
    const urls = (item.fotoUrls && item.fotoUrls.length > 0)
      ? item.fotoUrls
      : (item.fotoUrl ? [item.fotoUrl] : []);

    for (let j = 0; j < urls.length; j++) {
      const src = urls[j];
      if (src) {
        photos.push({
          src,
          unit: item.unitKerja,
          title: urls.length > 1 ? `${item.judul} (#${j + 1})` : item.judul,
          tanggal: item.tanggal ?? "",
          slug: item.unitKerjaSlug,
        });
      }
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f6e9ef,#efd9e1)", padding: "3rem 2rem 4rem", color: "#3a2631" }}>
      <nav style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem", letterSpacing: ".2em", fontSize: ".8rem", color: "#c2587f" }}>
        <div style={{ display: "flex", gap: ".5rem" }}>
          <Link href="/">Beranda</Link> / <Link href="/dokumentasi">Dokumentasi</Link> / Galeri
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          <Link href="/dokumentasi-showcase" style={{ color: "#3a2631" }}>Showcase</Link>
          <Link href="/" style={{ color: "#3a2631" }}>Kembali</Link>
        </div>
      </nav>
      <h1 style={{ fontFamily: "Shippori Mincho, serif", fontWeight: 400, fontSize: "clamp(2rem,4vw,3.5rem)" }}>Galeri Dokumentasi</h1>
      <p style={{ opacity: 0.7, marginTop: ".5rem" }}>
        {photos.length} foto dari {kegiatan.length} kegiatan.
      </p>
      {catatan && (
        <p role="status" style={{ marginTop: "1rem", fontSize: ".85rem", color: "#7a5a6a" }}>{catatan}</p>
      )}
      {photos.length === 0 ? (
        <p style={{ color: "#7a5a6a", marginTop: "1rem" }}>Belum ada foto tersedia.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem", marginTop: "2rem" }}>
          {photos.map((p, i) => (
            <figure key={`${p.src}-${i}`} style={{ margin: 0, borderRadius: 16, overflow: "hidden", background: "#fff6fa" }}>
              <div style={{ position: "relative", aspectRatio: "4/3" }}>
                <Image src={p.src} alt={`${p.title}, ${p.tanggal}`} fill sizes="(max-width: 760px) 100vw, 280px" style={{ objectFit: "cover" }} />
              </div>
              <figcaption style={{ padding: ".75rem", fontSize: ".85rem" }}>
                <Link href={`/dokumentasi/${p.slug}`} style={{ color: "#c2587f" }}>{p.unit}</Link>
                {" · "}
                {p.title}
              </figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
