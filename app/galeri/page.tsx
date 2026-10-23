import { getUnits } from "@/lib/kegiatan";

export default function GaleriPage() {
  const units = getUnits();
  const photos = units.flatMap((u) =>
    u.kegiatan.flatMap((k) => k.foto.map((src, i) => ({ src, unit: u.nama, title: k.judul, tanggal: k.tanggal, index: i + 1 })))
  );

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
