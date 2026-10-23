# DESIGN.md — Ethereal V2 (Landing Dokumentasi Kegiatan)

Versi: V2 — last updated 23 Oktober 2026
Referensi file prototipe: `landing-ethereal-v2.html` (sumber kebenaran visual)
Proyek: Dokumentasi Kegiatan Internal Kantor
Status: Siap implementasi. Semua nilai di bawah sudah sinkron dengan prototipe.

---

## 1. Tujuan

Landing page pertama yang dilihat karyawan. Halaman ini memperkenalkan dokumentasi kegiatan dan mengarahkan pengguna ke `/dokumentasi`, yaitu daftar kegiatan per unit kerja.

Aturan utama: satu aksi utama. Tombol "Let's Talks" adalah tujuan utama. Tombol lain belum punya tujuan dan ditandai `aria-disabled`.

---

## 2. Struktur Halaman

Halaman hanya berisi satu section hero (`/`), dari belakang ke depan:

| Z | Layer | Isi |
|---|---|---|
| 0 | Latar blur | Gambar sakura diperbesar, blur 26 px, opacity 0.9 |
| 1 | Subjek | Gambar sakura, tinggi 112%, tepi dimasking radial |
| 2 | Kilau | Radial gradient putih 38%, mix-blend screen |
| 3 | Veil | Gradien tipis tint mauve, 6% sampai 14% |
| 4 | Kelopak | Canvas, 30 kelopak desktop, 16 mobile |
| 5 | Nav | Pill transparan, logo, 5 menu, tombol kecil |
| 6 | Konten | Kicker, headline, dua tombol |
| 7 | Watermark | "Ethereal" di 82% tinggi |

---

## 3. Teks (sumber: `content.ts`)

| Elemen | Teks | Tujuan |
|---|---|---|
| Logo | Ethereal | `/` |
| Menu | Beranda, Unit Kerja, Kegiatan, Galeri, Tentang | Belum aktif |
| Tombol nav | Go to the room | `/dokumentasi` |
| Kicker | The Dynamic Pulse | — |
| Headline | True the Light | — |
| Tombol utama | Go to the room | `/dokumentasi` |
| Tombol sekunder | Daftar Unit | Belum aktif |
| Watermark | Ethereal | — |

---

## 4. Warna

| Peran | Nilai |
|---|---|
| Latar hero dan halaman | `#EFD9E1` |
| Teks utama dan ikon | `#FFFFFF` |
| Ikon di dalam lingkaran putih | `#0B0B0B` |
| Latar tombol dan nav | `rgba(20,20,20,0.28)`, hover `0.42` |
| Border nav dan tombol solid | `rgba(255,255,255,0.22)` dan `0.3` |
| Border tombol ghost | `rgba(255,255,255,0.5)` |
| Kicker | `rgba(255,255,255,0.9)` |
| Watermark | `rgba(255,255,255,0.55)` |
| Kelopak | `#FFF6FA` ke `#F6B8D0` ke transparan `#E88CAF` |
| Veil | `rgba(90,50,70, 0.06–0.14)` |

---

## 5. Tipografi

| Peran | Font | Bobot | Ukuran |
|---|---|---|---|
| Headline dan kicker | Shippori Mincho | 400 | Headline `clamp(38px, 6.4vw, 68px)`, kicker `clamp(16px, 2.6vw, 26px)` |
| Nav, menu, tombol, watermark | Zen Kaku Gothic New | 500 sampai 600 | Nav `clamp(11px, 1.15vw, 15px)`, tombol `clamp(12px, 1.2vw, 16px)`, watermark `clamp(20px, 3vw, 34px)` |

Headline memakai `letter-spacing: 0.02em`, kicker `0.12em`, dan body `0.01em`.
Font dimuat dengan `next/font/google` dan diexpose sebagai variabel `--font-display` dan `--font-body`.

---

## 6. Ukuran Komponen

| Komponen | Nilai |
|---|---|
| Nav | Tinggi `clamp(30px, 3.4vw, 44px)`, lebar penuh dikurangi 6 px per sisi, padding kiri 1.2em |
| Tombol nav | Tinggi 2.4em, ikon 1.7em |
| Tombol utama | Tinggi `clamp(34px, 3.4vw, 48px)`, lebar minimum `clamp(160px, 16vw, 220px)` |
| Ikon tombol utama | 2em |
| Jarak tombol | 8 px |
| Jarak menu | `clamp(14px, 2vw, 30px)` |
| Posisi konten | Tengah horizontal, 41% dari tinggi |
| Posisi watermark | 82% dari tinggi |
| Lebar konten | `min(92%, 640px)` |

Breakpoint mobile: di bawah 760 px, menu disembunyikan, konten turun ke 46%, dan tombol ditumpuk vertikal.

---

## 7. Subjek dan Gerak

### 7.1 Subjek
- Gambar: `sakura-hero.webp` (1383 × 1137) dan `sakura-hero-800.webp` untuk latar blur.
- `background-size: auto 112%`, `background-position: 50% -2%`.
- Tepi memudar dengan `radial-gradient(ellipse 48% 62% at 50% 48%, …)`.

### 7.2 Napas (inhale dan exhale)
- Durasi 7 detik, `infinite`.
- Inhale 0 sampai 40%, hold 40 sampai 52%, exhale 52 sampai 100%.
- Puncak: scale 1.035, translateY -6 px, translateZ 16 px.
- Titik transformasi `50% 35%`.

### 7.3 Latar dan kilau
- Latar blur bergerak `driftBg` 18 detik, bolak-balik.
- Kilau bergerak dari 15% ke 80% selama 12 detik, bolak-balik.

### 7.4 Tilt 3D
- Mengikuti kursor, maksimal 3.5 derajat.
- Interpolasi 0.08 per frame.

### 7.5 Kelopak
- Jatuh dengan kecepatan 0.35 sampai 0.85 px per frame, dikalikan faktor kedalaman.
- Ayunan sinus, rotasi, dan perubahan lebar.
- Dinormalisasi ke 60 fps dengan `dt`.

### 7.6 Animasi masuk
| Elemen | Efek | Durasi | Delay |
|---|---|---|---|
| Kicker | Naik 14 px dan fade | 1000 ms | 200 ms |
| Headline | Reveal dari bawah | 1200 ms | 400 ms |
| Tombol | Naik 10 px dan fade | 900 ms | 950 ms |

Easing: `cubic-bezier(0.22, 1, 0.36, 1)`.

### 7.7 Reduced motion
Jika `prefers-reduced-motion: reduce`:
- Semua animasi dimatikan.
- Tilt dinonaktifkan.
- Kelopak digambar satu kali sebagai gambar statis.

---

## 8. Aksesibilitas
- `<section>` memakai `aria-label` berisi kicker.
- Subjek memakai `role="img"` dengan `aria-label`.
- Layer dekoratif dan canvas memakai `aria-hidden="true"`.
- Headline memakai `<h1>` dengan `aria-label`.
- Fokus terlihat dengan outline 2 px putih, offset 3 px.
- Target sentuh minimal 34 px pada tombol utama.
- Kontras: teks putih di atas latar `#EFD9E1` adalah kasus yang perlu dicek. Jika rasio di bawah 4.5:1, naikkan veil atau gunakan teks `#3A2631` untuk kicker.
- Menu dan tombol sekunder memakai `aria-disabled`, tetapi sebaiknya dihapus dari tab order sampai aktif. Lakukan saat fitur tersebut dibuka.

---

## 9. Performa
- Gambar subjek WebP, bukan PNG.
- Latar blur memakai versi 800 px.
- Canvas dibatasi `devicePixelRatio` 2.
- Animasi hanya memakai `transform` dan `opacity`.
- Preload gambar subjek di `layout.tsx`.

---

## 10. Struktur File

```
ethereal-v2/
├─ DESIGN.md
├─ app/
│  ├─ layout.tsx          ← font variable, preload subjek, metadata
│  ├─ layout-fonts.ts     ← Shippori Mincho dan Zen Kaku Gothic New
│  ├─ globals.css
│  └─ page.tsx            ← route "/"
├─ components/hero/
│  ├─ Hero.tsx            ← komposisi utama
│  ├─ Hero.module.css     ← seluruh styling dan animasi
│  ├─ PetalCanvas.tsx     ← kelopak sakura
│  ├─ useTilt.ts          ← tilt 3D mengikuti kursor
│  └─ content.ts          ← semua caption
└─ public/assets/hero/
   ├─ sakura-hero.webp
   └─ sakura-hero-800.webp
```

Untuk mengubah teks, edit `content.ts`. Untuk mengubah warna, ukuran, atau gerak, edit `Hero.module.css`.

---

## 11. Yang Tidak Boleh Diubah Tanpa Persetujuan
- Tombol utama harus tetap mengarah ke `/dokumentasi`.
- Jangan menambah tombol kedua yang aktif.
- Jangan menghapus aturan reduced motion.
- Jangan memakai gambar PNG asli di produksi.
- Jangan menyalin logo atau watermark dari template pihak lain.

---

## 12. Verifikasi
| No | Kriteria | Target |
|---|---|---|
| 1 | Subjek tampil | Kepala terlihat di bagian atas, tidak ada kotak foto yang tegas |
| 2 | Napas | Siklus 7 detik, naik dan turun halus |
| 3 | Tilt | Maksimal 3.5 derajat, halus |
| 4 | Kelopak | Jatuh terus-menerus tanpa lompatan |
| 5 | Tombol utama | Mengarah ke `/dokumentasi` |
| 6 | Reduced motion | Semua gerak berhenti |
| 7 | Mobile 375 px | Headline tidak terpotong, tombol tidak keluar layar |
| 8 | Font | Shippori Mincho dan Zen Kaku Gothic New termuat |
