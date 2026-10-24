# DESIGN — Card Scan Sakura Cyber (preview terakhir)

File preview: `preview-card-scan-sakura-cyber.html`
Referensi visual: `preview-card-scan-sakura-cyber-desktop.png`, `preview-card-scan-sakura-cyber-mobile.png`
Status: preview HTML mandiri. Belum dipasang di project Next.js.

---

## 1. Konsep

Carousel kartu kegiatan yang tak terbatas. Saat kartu melewati satu sinar pemindai sakura di tengah layar,
chip kartu "terurai" dari kiri ke kanan. Sirkuit dan sandi gelap berubah menjadi aksara Jepang
(Kanji, Hiragana, Katakana) yang menyala sesaat lalu stabil dan terbaca.

Nuansa: cyberpunk Jepang, sakura neon, minimalis futuristik. Warna dibuat lembut, tidak jenuh.

---

## 2. Anatomi

| Elemen | Fungsi | Implementasi |
|---|---|---|
| Stage | Latar gelap charcoal dengan kabut pink | `radial-gradient` berlapis di `body` |
| Track | Lintasan kartu, loop horizontal | `div.track`, posisi dihitung di JS |
| Kartu (`.card`) | Satu kegiatan: chip, foto, judul, tanggal | Lebar `clamp(200px,22vw,300px)`, tinggi 100% track |
| Chip (`.chip`) | Latar sirkuit gelap | Gradien berulang 90° dan 0°, overlay scanline |
| Canvas glyph (`.glyphs`) | Menggambar aksara atau sandi per sel | Grid 16 × 24 sel, `fillText` |
| Foto (`.photo`) | Foto kegiatan, hanya di area yang sudah terurai | `mask-image` linear mengikuti tepi sinar |
| Rim (`.rim`) | Garis batas tegas antara area terurai dan belum | Gradien vertikal + glow 14px |
| Flash (`.flash`) | Kilatan ignisi di tepi sinar | Radial gradient, opacity berdenyut |
| Sinar (`#beam`) | Sinar sakura di tengah, sepanjang tinggi kartu | Lima lapisan: after, glow, heat, plasma, core |
| Kelopak (`#petals`) | Partikel halus di latar | Canvas 2D |

---

## 3. Perilaku

1. **Gerak.** Track bergerak ke kiri 55 px/detik. Saat kursor berada di atas track, kecepatan turun
   menjadi 35%. Drag mouse atau swipe menggeser track secara langsung.
2. **Posisi relatif.** Untuk setiap kartu dihitung `rel = (posisi sinar − x kartu) / lebar kartu`.
   - `rel ≤ 0`: kartu belum tersentuh. Chip gelap, foto tersembunyi.
   - `0 < rel < 1`: kartu sedang dipindai. Aksara terurai sampai kolom `rel × 16`, foto muncul di sisi kiri sinar, garis rim dan flash aktif.
   - `rel ≥ 1`: kartu sudah terurai penuh. Foto tampil dengan opacity 0,55, tanpa mask.
3. **Glyph per sel.**
   - Sel yang sudah terurai: aksara Jepang, warna `rgba(255,236,243,.86)`, 2% sel berganti aksara per frame.
   - Pita sinar (1–2 kolom di depan tepi): aksara terang, sebagian putih, dengan `shadowBlur` 10.
   - Sel yang belum dipindai: sandi hex, warna `rgba(242,155,189,.16)`, 0,4% sel berganti per frame.
4. **Komposisi aksara.** Acak per sel dengan proporsi Kanji 40%, Hiragana 30%, Katakana 30%.
   Kumpulan kata: Kanji `桜光夢風雲龍水火空心和道未来電脳夜花月雪京炎鋼刃`,
   Hiragana `あいうえおさくらかぜひかりゆめほしつきはなこころ`,
   Katakana `カタカナネオンサイバーデータヨルユメキラ`.
5. **Sinar.** Sepanjang tinggi kartu, dengan lima lapisan CSS:
   - `.b-after` (jejak di sisi terurai, screen blend)
   - `.b-glow` (kabut pink 240 px, animasi napas 4,2 detik)
   - `.b-heat` (backdrop blur 2,5 px, distorsi panas)
   - `.b-plasma` (gradien pink 32 px, berkedip steps 2, 2,6 detik)
   - `.b-core` (garis putih-pink 4 px dengan glow 12 px)
6. **Batas tegas.** Rim 2 px di tepi terurai dengan glow. Tidak ada transisi lembut di batas itu.

---

## 4. Palet

| Peran | Nilai |
|---|---|
| Latar stage | `#140f16` → `#0c080d` |
| Kabut latar | `rgba(242,155,189,.10)` |
| Chip | `#1a131c` → `#0e0a10` |
| Aksara terurai | `rgba(255,236,243,.86)` |
| Pita sinar | `#ffffff`, `rgba(255,205,225,.95)` |
| Sandi belum terurai | `rgba(242,155,189,.16)` |
| Rim dan glow | `#ffd0e0`, `rgba(255,170,205,.85)` |
| Judul kartu | `#fbeef4` |
| Label | `#f29bbd` |
| Teks pendukung | `#c79bb1` |

---

## 5. Tipografi

| Peran | Font | Catatan |
|---|---|---|
| Judul halaman | Shippori Mincho 400 | `clamp(28px,4vw,52px)` |
| Judul kartu | Shippori Mincho 400 | `1.05rem` |
| Label dan tanggal | Noto Sans JP 400/600 | letter-spacing 0,2–0,24em |
| Teks umum | Zen Kaku Gothic New | — |
| Aksara di kartu | Noto Sans JP 600 | ukuran sel × 0,8 |

---

## 6. Ukuran dan layout

- Track: tinggi `clamp(340px, 56vh, 520px)`, posisi vertikal di tengah.
- Kartu: lebar `clamp(200px,22vw,300px)`, radius 1,6rem, border `rgba(242,155,189,.18)`.
- Jarak antar kartu: 340 px. Panjang loop: 7 kartu × 340 px.
- Grid glyph: 16 kolom × 24 baris.
- Sinar: posisi tepat di tengah viewport (`left:50%; top:50%; translateY(-50%)`).
  Tinggi sinar sama dengan tinggi track kartu, `clamp(340px, 56vh, 520px)`, sehingga ujung atas dan bawah
  sejajar dengan kartu dan tidak menyentuh margin atas maupun bawah halaman. Lebar total sekitar 240 px (glow).
- Info kartu: padding `1.2rem 1.1rem 1rem`, latar gradien gelap 97% dengan `backdrop-filter: blur(3px)`.

---

## 7. Gerak dan waktu

| Elemen | Nilai |
|---|---|
| Kecepatan track | 55 px/detik (35% saat hover) |
| Skala kartu | `1 − min(jarak/W, .25) × .25` |
| Denyut flash | sinus, periode ~1 detik, offset per kartu |
| Napas glow sinar | 4,2 detik, alternate |
| Kedip plasma | 2,6 detik, steps(2,end) |
| Perubahan aksara terurai | 2% sel per frame |
| Perubahan sandi | 0,4% sel per frame |

---

## 8. Responsif

- Desktop: sekitar 4–5 kartu terlihat, sinar di tengah.
- Mobile (390 px): 1–2 kartu terlihat. Sinar tetap di tengah.
- Kelopak dikurangi menjadi 10 partikel di layar sempit.
- Kartu tidak diubah ukurannya selain oleh `clamp` yang sudah ada.

---

## 9. Aksesibilitas

- `prefers-reduced-motion: reduce`: animasi glow dan plasma dimatikan. Track dan aksara tetap berjalan, sehingga disarankan menambahkan mode statis bila diperlukan.
- Aksara di canvas tidak terbaca pembaca layar. Judul dan tanggal ditampilkan di DOM (`.info`), sehingga informasi utama tetap tersedia.
- Tombol atau tautan kartu belum ditambahkan di preview ini. Saat dipasang di project, kartu perlu dibungkus `<a>` atau `<button>` dengan fokus terlihat.

---

## 10. Batasan preview

- Kode asli dari template v0 tidak bisa dibaca. Efek ini adalah interpretasi dari prompt, bukan salinan.
- Font Google dimuat dari CDN. Jika offline, sistem akan memakai font cadangan.
- Canvas glyph digambar ulang setiap frame. Pada perangkat lemah, jumlah sel bisa dikurangi dari 16 × 24.
- Kelopak memakai canvas 2D, bukan Three.js.

---

## 11. Langkah pemasangan ke project Next.js

1. Pindahkan logika per kartu ke komponen `components/dokumentasi/SakuraScanCard.tsx` (client component).
2. Pindahkan sinar ke `components/dokumentasi/ScanBeam.tsx` dengan CSS module.
3. Ganti data statis dengan `lib/types.ts` (judul, tanggal, foto dari `kegiatan.json`).
4. Pasang di `app/dokumentasi/[unit]/page.tsx` menggantikan `ActivityCarousel`, atau sebagai varian.
5. Verifikasi pada tabel di bagian 12.

---

## 12. Verifikasi

| No | Kriteria |
|---|---|
| 1 | Track berjalan tanpa jeda ketika kartu keluar dari kiri. |
| 2 | Aksara muncul hanya di sisi kiri sinar, sesuai posisi tepi terurai. |
| 3 | Rim dan flash selalu tepat di tepi terurai. |
| 4 | Sandi gelap tampak di area yang belum dipindai. |
| 5 | Judul dan tanggal tetap terbaca di atas aksara. |
| 6 | Tidak ada frame macet di perangkat menengah saat 7 kartu aktif. |
| 7 | Mobile 390 px: kartu dan sinar tidak keluar dari layar. |
| 8 | Ujung atas dan bawah sinar sejajar dengan track kartu, tidak melewati margin halaman. |

---

## 13. Riwayat perubahan

| Versi | Perubahan |
|---|---|
| v1 | Sinar setinggi layar penuh (`top:0; bottom:0`). |
| v2 | Sinar dibatasi setinggi track kartu (`top:50%`, `height: clamp(340px,56vh,520px)`, `translateY(-50%)`). Ujung sinar tidak lagi menyentuh margin atas dan bawah halaman. |
