import Link from "next/link";
import { fetchKegiatan } from "@/lib/supabase";

export default async function DokumentasiShowcasePage() {
  const { kegiatan } = await fetchKegiatan(500);
  const all = kegiatan
    .filter((k) => k.fotoUrl)
    .map((k) => ({
      src: k.fotoUrl!,
      unit: k.unitKerja,
      title: k.judul,
      tanggal: k.tanggal ?? "",
    }));

  return (
    <main style={{ minHeight: "100dvh", background: "linear-gradient(180deg,#f6e9ef,#efd9e1)", color: "#3a2631", position: "relative", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(194,88,127,.12) 1px,transparent 1px),linear-gradient(90deg,rgba(194,88,127,.12) 1px,transparent 1px)", backgroundSize: "64px 64px", opacity: .4 }} />
      <div style={{ position: "relative", zIndex: 1, maxWidth: 1400, margin: "0 auto", padding: "4rem 2rem" }}>
        <nav style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem", letterSpacing: ".2em", fontSize: ".8rem", color: "#c2587f" }}>
          <div style={{ display: "flex", gap: ".5rem" }}>
            <Link href="/">Beranda</Link> / <Link href="/dokumentasi">Dokumentasi</Link> / Showup
          </div>
          <Link href="/" style={{ color: "#3a2631" }}>Kembali</Link>
        </nav>
        <h1 style={{ fontFamily: "Shippori Mincho, serif", fontWeight: 400, fontSize: "clamp(2.5rem,5vw,4.5rem)", marginBottom: ".5rem" }}>Showup Dokumentasi</h1>
        <p style={{ opacity: .7 }}>Seluruh foto dari dokumentasi kegiatan per unit.</p>

        {all.length === 0 ? (
          <p style={{ marginTop: "3rem", color: "#7a5a6a" }}>Belum ada foto yang diupload.</p>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))", gap: "1rem", marginTop: "2.5rem" }}>
            {all.map((p, i) => (
              <figure key={`${p.src}-${i}`} style={{ margin: 0, borderRadius: 18, overflow: "hidden", background: "rgba(255,246,250,.7)", boxShadow: "0 20px 40px -20px rgba(194,88,127,.4)" }}>
                <div style={{ position: "relative", aspectRatio: "4/3" }}>
                  <img src={p.src} alt={`${p.title}, ${p.tanggal}`} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </div>
                <figcaption style={{ padding: ".9rem 1rem" }}>
                  <div style={{ fontSize: ".75rem", letterSpacing: ".15em", color: "#c2587f" }}>{p.tanggal}</div>
                  <div style={{ fontFamily: "Shippori Mincho, serif", marginTop: ".3rem" }}>{p.title}</div>
                  <div style={{ fontSize: ".85rem", opacity: .7 }}>{p.unit}</div>
                </figcaption>
              </figure>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
