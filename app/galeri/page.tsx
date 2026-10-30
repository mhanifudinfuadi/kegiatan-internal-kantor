import { fetchKegiatan } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export default async function GaleriPage() {
  const { kegiatan } = await fetchKegiatan(500);
  const photos: Array<{ src: string; unit: string; title: string; tanggal: string }> = [];

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
        });
      }
    }
  }

  return (
    <main style={{ minHeight: "100vh", background: "linear-gradient(180deg,#f6e9ef,#efd9e1)", padding: "6rem 2rem 4rem", color: "#3a2631" }}>
      <h1 style={{ fontFamily: "Shippori Mincho, serif", fontWeight: 400, fontSize: "clamp(2rem,4vw,3.5rem)" }}>Galeri Dokumentasi</h1>
      {photos.length === 0 ? (
        <p style={{ color: "#7a5a6a", marginTop: "1rem" }}>Belum ada foto tersedia.</p>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(220px,1fr))", gap: "1rem", marginTop: "2rem" }}>
          {photos.map((p, i) => (
            <figure key={i} style={{ margin: 0, borderRadius: 16, overflow: "hidden", background: "#fff6fa" }}>
              <img src={p.src} alt={`${p.title}, ${p.tanggal}`} style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover" }} />
              <figcaption style={{ padding: ".75rem", fontSize: ".85rem" }}>{p.unit} · {p.title}</figcaption>
            </figure>
          ))}
        </div>
      )}
    </main>
  );
}
