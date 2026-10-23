# DESIGN — Halaman Dokumentasi Kegiatan per Unit Kerja

Proyek: Ethereal V2 (Dokumentasi Kegiatan Internal)
Tujuan: tombol "Lihat Dokumentasi" di hero mengarah ke `/dokumentasi`, lalu ke `/dokumentasi/[unit]`.
Status: spesifikasi untuk implementasi.

---

## 1. Ringkasan konsep

Visual futuristik (grid tipis, kaca, cahaya halus, angka timeline) dipadukan dengan nuansa Jepang sakura: palet soft pink, kelopak yang jatuh pelan, dan label kecil berbahasa Jepang sebagai aksen (活動 kegiatan, 日付 tanggal, 部署 unit kerja). Futuristik ada di struktur dan gerak, sakura ada di warna dan ritme.

Prinsip:
1. Tanggal dan judul selalu terbaca lebih dulu, foto kedua.
2. Satu hal bergerak pada satu waktu. Tidak ada animasi yang bersaing.
3. Setiap gerak punya versi reduced motion.

---

## 2. Alur navigasi

| Route | Isi | Sumber data |
|---|---|---|
| `/` | Hero, tombol "Lihat Dokumentasi" | — |
| `/dokumentasi` | Daftar unit kerja, 1 kartu per unit, menampilkan kegiatan terbaru | `data/kegiatan.json` |
| `/dokumentasi/[unit]` | Timeline kegiatan unit, urut tanggal terbaru | `data/kegiatan.json` |
| `/admin/kegiatan` (tahap berikutnya) | Upload foto, isi judul dan tanggal | CMS / JSON |

Breadcrumb di setiap halaman: `Beranda / Dokumentasi / Nama Unit`.

---

## 3. Struktur data

Satu file `data/kegiatan.json` berisi daftar unit. Setiap unit memiliki daftar kegiatan, dan setiap kegiatan memiliki daftar foto.

```json
{
  "units": [
    {
      "slug": "tim-it",
      "nama": "Tim IT",
      "kegiatan": [
        {
          "id": "it-2026-10-01",
          "judul": "Pelatihan Keamanan Data",
          "tanggal": "2026-10-01",
          "deskripsi": "Sesi pelatihan internal.",
          "foto": ["/dokumentasi/it/2026-10-01-1.webp"]
        }
      ]
    }
  ]
}
```

Aturan:
- `tanggal` wajib format `YYYY-MM-DD`. Tampilan ditulis sebagai "1 Oktober 2026".
- `foto` boleh kosong. Jika kosong, tampilkan placeholder kelopak dengan judul.
- `slug` unik per unit dan dipakai sebagai URL.
- Foto disimpan di `public/dokumentasi/[slug]/`.

---

## 4. Palet dan tipografi

Warna dasar sama dengan hero: `#EFD9E1` (latar), `#FFF6FA` (kartu), `#C2587F` (aksen), `#3A2631` (teks).

Aksen futuristik (dipakai sangat hemat):
- Garis grid tipis: `rgba(194, 88, 127, 0.12)`, 1 px.
- Glow saat hover: `box-shadow: 0 0 0 1px rgba(194,88,127,.35), 0 12px 40px -12px rgba(194,88,127,.45)`.
- Border gradien kaca: dari `rgba(255,255,255,.7)` ke `rgba(194,88,127,.25)`.

Font: Shippori Mincho untuk judul unit dan judul kegiatan. Zen Kaku Gothic New untuk teks dan tanggal. Label Jepang kecil (10–11 px, letter-spacing 0.2em) memakai Zen Kaku Gothic New.

---

## 5. Komponen

### 5.1 Header dokumentasi
- Tinggi 64 px, pill kaca seperti nav hero.
- Kiri: logo "Ethereal" + breadcrumb.
- Kanan: tombol kembali ke Beranda.

### 5.2 Kartu unit (`/dokumentasi`)
- Grid 3 kolom desktop, 2 tablet, 1 mobile. Jarak 20 px.
- Isi: nama unit, jumlah kegiatan, tanggal kegiatan terbaru, dan satu thumbnail foto.
- Nomor unit di pojok (format 01, 02, ...) sebagai aksen futuristik.
- Hover: thumbnail zoom 1.04, glow sakura, panah → bergeser 4 px.

### 5.3 Timeline kegiatan (`/dokumentasi/[unit]`)
- Garis vertikal tipis di kiri, titik tanggal di garis.
- Setiap item: tanggal besar (Shippori Mincho), judul, deskripsi singkat, lalu grid foto 2–3 kolom.
- Urutan: tanggal terbaru di atas.
- Filter tahun di atas timeline (chip horizontal yang bisa di-scroll di mobile).

### 5.4 Kartu kegiatan (`ActivityCard`)
- Kaca dengan border gradien.
- Judul dan tanggal selalu di atas.
- Maksimal 3 foto tampil. Jika lebih, tampilkan "+N" di foto terakhir.
- Klik foto membuka lightbox.

### 5.5 Lightbox
- Latar gelap transparan, blur 12 px.
- Panah kiri dan kanan, Esc untuk tutup.
- Keterangan judul dan tanggal di bawah foto.

---

## 6. Gerak

| Elemen | Gerak | Durasi | Catatan |
|---|---|---|---|
| Kartu unit | Fade + naik 16 px, bertahap (stagger 80 ms) | 700 ms | Easing `cubic-bezier(.22,1,.36,1)` |
| Garis timeline | Tumbuh dari atas ke bawah saat masuk | 1200 ms | Scale Y 0 ke 1 |
| Kelopak sakura | Jatuh pelan di background halaman | terus-menerus | Jumlah 18 desktop, 8 mobile. Reuse `PetalCanvas` |
| Grid tipis | Bergeser 40 px horizontal, sangat pelan | 30 detik loop | Opacity 0.5 maksimal |
| Hover kartu | Glow dan zoom foto | 400 ms | Hanya di perangkat dengan hover |
| Lightbox | Scale 0.96 ke 1 + fade | 300 ms | — |

Reduced motion: semua animasi dimatikan, kelopak statis, grid tidak bergeser.

---

## 7. Aksesibilitas
- Setiap foto wajib `alt` berisi judul kegiatan dan tanggal.
- Kartu adalah `<a>` penuh, bukan `div` dengan `onClick`.
- Fokus terlihat: outline 2 px `#C2587F`, offset 3 px.
- Kontras teks `#3A2631` di atas `#FFF6FA` memenuhi 4.5:1.
- Lightbox bisa dikontrol keyboard dan ditutup dengan Esc.

---

## 8. Responsif
- Mobile di bawah 640 px: satu kolom, filter tahun di-scroll horizontal, timeline garis di kiri 16 px.
- Tablet 640–1023 px: dua kolom.
- Desktop 1024 px ke atas: tiga kolom, timeline dengan margin kiri 120 px.

---

## 9. Yang belum diputuskan
1. Admin upload foto: sementara edit `data/kegiatan.json` dan letakkan foto di `public/`. Tahap berikutnya bisa dibuat halaman admin dengan login.
2. Referensi madusport087 (fluid background dan footer): belum dipakai di halaman ini. Jika ingin gaya fluid background diterapkan di `/dokumentasi`, beri tahu bagian mana yang diambil.
3. Apakah ada unit kerja yang ingin ditampilkan dengan warna berbeda.

---

## 10. Verifikasi
| No | Kriteria |
|---|---|
| 1 | Tombol hero mengarah ke `/dokumentasi` |
| 2 | Daftar unit tampil, urut sesuai `units` |
| 3 | Klik unit membuka `/dokumentasi/[slug]` |
| 4 | Kegiatan urut tanggal terbaru di atas |
| 5 | Judul dan tanggal selalu terlihat sebelum foto |
| 6 | Reduced motion: tidak ada animasi berjalan |
| 7 | Mobile 375 px: tidak ada elemen keluar layar |
