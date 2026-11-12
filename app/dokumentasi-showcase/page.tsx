import Link from "next/link";
import Image from "next/image";
import { fetchKegiatan } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Showcase Dokumentasi — Kegiatan Internal Kantor",
  description: "Seluruh foto dokumentasi kegiatan per unit kerja.",
};

export default async function DokumentasiShowcasePage() {
  const { kegiatan, catatan } = await fetchKegiatan(500);
  const all: Array<{ src: string; unit: string; title: string; tanggal: string; slug: string }> = [];

  for (const k of kegiatan) {
    // SEMUA FOTO dari fotoUrls DAN fotoUrl (jika ada), bukan hanya yang punya photoUrls
    const allPhotos = [...(k.fotoUrls || []), k.fotoUrl ?? ""];

    for (let j = 0; j < allPhotos.length; j++) {
      const src = allPhotos[j];
      if (src) {
        all.push({
          src,
          unit: k.unitKerja,
          title: allPhotos.length > 1 ? `${k.judul} (#${j + 1})` : k.judul,
          tanggal: k.tanggal ?? "",
          slug: k.unitKerjaSlug,
        });
      }
    }
  }

  return (
    <main style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#f6e9ef,#efd9e1)", color: "#3a2631", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(194,88,127,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(194,88,127,.12) 1px,transparent 1px)", backgroundSize: "64px 64px", opacity: .4 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "4rem 2rem" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap", marginBottom: "2rem", letterSpacing: ".2em", fontSize: ".8rem", color: "#c2587f" }}>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <Link href="/">Beranda</Link> / <Link href="/dokumentasi">Dokumentasi</Link> / Showcase
          </div>
          <div style={{ display: "flex", gap: "1rem" }}>
            <Link href="/galeri" style={{ color: "#3a2631" }}>Galeri</Link>
            <Link href="/" style={{ color: "#3a2631" }}>Kembali</Link>
          </div>
        </nav>
        <h1 style={{ fontFamily: "Shippori Mincho, serif", fontWeight: 400, fontSize: "clamp(2.5rem,5vw,4.5rem)", marginBottom: ".5rem" }}>Showcase Dokumentasi</h1>
        <p style={{ opacity: .7 }}>Seluruh foto dari dokumentasi kegiatan per unit.</p>
        {catatan && (
          <p role="status" style={{ marginTop: "1rem", fontSize: ".85rem", color: "#7a5a6a" }}>{catatan}</p>
        )}

        {all.length === 0 ? (
          <p style={{ marginTop: "3rem", color: "#7a5a6a" }}>Belum ada foto yang diupload.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem", marginTop: "2.5rem" }}>
            {all.map((p, i) => (
              <figure key={`${p.src}-${i}`} style={{ margin: 0, borderRadius: 18, overflow: "hidden", background: "rgba(255,246,250,.7)", boxShadow: "0 20px 40px -20px rgba(194,88,127,.4)" }}>
                <div style={{ position: "relative", aspectRatio: "4/3" }}>
                  <Image
                    src={p.src}
                    alt={`${p.title}, ${p.tanggal}`}
                    fill
                    sizes="(max-width: 760px) 100vw, 320px"
                    style={{ objectFit: "cover" }}
                  />
                </div>
                <figcaption style={{ padding: ".9rem 1rem" }}>
                  <div style={{ fontSize: ".75rem", letterSpacing: ".15em", color: "#c2587f" }}>{p.tanggal}</div>
                  <div style={{ fontFamily: "Shippori Mincho, serif", marginTop: ".3rem" }}>{p.title}</div>
                  <Link href={`/dokumentasi/${p.slug}`} style={{ fontSize: ".85rem", opacity: .7, color: "#3a2631" }}>{p.unit}</Link>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
