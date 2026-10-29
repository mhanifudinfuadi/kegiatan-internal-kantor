import Link from "next/link";

export default function NotFound() {
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "2rem",
        background: "linear-gradient(180deg, #2a1622 0%, #1a0f16 100%)",
        color: "#fdecf2",
        fontFamily: "'Zen Kaku Gothic New', sans-serif",
      }}
    >
      <span
        style={{
          fontSize: "4rem",
          marginBottom: "1rem",
          color: "#f29bbd",
        }}
        aria-hidden="true"
      >
        ✿
      </span>
      <h1
        style={{
          fontFamily: "'Shippori Mincho', serif",
          fontSize: "clamp(2rem, 5vw, 3.5rem)",
          fontWeight: 400,
          margin: "0 0 0.5rem",
          letterSpacing: ".02em",
        }}
      >
        404 — Halaman Tidak Ditemukan
      </h1>
      <p
        style={{
          maxWidth: "480px",
          margin: "0 0 2rem",
          color: "rgba(253, 236, 242, 0.7)",
          lineHeight: 1.6,
          fontSize: "1rem",
        }}
      >
        Halaman yang Anda tuju mungkin telah dipindahkan, dihapus, atau unit kerja belum memiliki data kegiatan.
      </p>
      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          href="/"
          style={{
            padding: "10px 24px",
            borderRadius: "999px",
            background: "linear-gradient(135deg, #f29bbd, #c2587f)",
            color: "#2a1622",
            fontWeight: 700,
            textDecoration: "none",
            fontSize: "0.875rem",
            letterSpacing: ".05em",
          }}
        >
          Kembali ke Beranda
        </Link>
        <Link
          href="/dokumentasi"
          style={{
            padding: "10px 24px",
            borderRadius: "999px",
            border: "1px solid rgba(242, 155, 189, 0.4)",
            background: "rgba(255, 255, 255, 0.05)",
            color: "#fdecf2",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: "0.875rem",
            letterSpacing: ".05em",
          }}
        >
          Lihat Dokumentasi
        </Link>
      </div>
    </main>
  );
}
