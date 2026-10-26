# Sakura Cyber Smooth — Card Scan Preview V3

Dokumentasi untuk halaman HTML **Card Scan Sakura Cyber Smooth**.

## Gambaran umum

Halaman ini menampilkan deretan kartu dokumentasi kegiatan dengan efek pemindaian cahaya. Foto pada kartu terlihat utuh sebelum melewati garis pemindai; setelah dipindai, bagian foto secara bertahap memudar dan digantikan aksara Jepang bercahaya.

## Fitur

- Tema visual gelap dengan aksen merah muda sakura.
- Lima kartu kegiatan yang bergerak horizontal dalam loop tanpa jeda.
- Efek garis pemindai bercahaya.
- Transisi foto menjadi karakter hiragana, katakana, dan kanji.
- Kelopak sakura yang jatuh sebagai dekorasi animasi.
- Kontrol untuk menjeda, melanjutkan, memperlambat, dan mempercepat animasi.
- Gerakan melambat saat pointer berada di atas area animasi.
- Tata letak responsif untuk layar kecil.
- Mengurangi animasi kelopak saat perangkat mengaktifkan preferensi `prefers-reduced-motion`.

## Konten kartu

1. **Community — Ruang untuk Bertumbuh**  
   Dokumentasi kegiatan bersama.
2. **Gathering — Ikatan dalam Kebersamaan**  
   Momen yang menjadi cerita.
3. **Workshop — Belajar dan Berkarya**  
   Melangkah dengan rasa ingin tahu.
4. **Education — Menemukan Perspektif**  
   Pengetahuan untuk masa depan.
5. **Together — Bergerak sebagai Satu**  
   Setiap langkah punya arti.

## Teknologi yang digunakan

- **HTML** untuk struktur halaman.
- **CSS** untuk tata letak, warna, kartu, efek cahaya, responsivitas, dan animasi kelopak.
- **JavaScript** untuk menggandakan kartu, menghasilkan karakter, mengatur kecepatan, dan menjalankan efek pemindaian.
- **Google Fonts** untuk font Noto Sans JP dan Shippori Mincho.
- **Unsplash** sebagai sumber foto contoh.

## Kontrol animasi

- **Jeda animasi**: menghentikan atau melanjutkan pergerakan kartu.
- **Perlambat**: mengurangi kecepatan 10 px/detik, hingga minimum 15 px/detik.
- **Percepat**: menambah kecepatan 10 px/detik, hingga maksimum 100 px/detik.
- Kecepatan awal: **55 px/detik**.

## Menjalankan halaman

1. Simpan file HTML di perangkat.
2. Buka file tersebut menggunakan browser modern.
3. Pastikan koneksi internet tersedia agar Google Fonts dan foto contoh dari Unsplash dapat dimuat.

Halaman ini tidak memerlukan proses build atau server khusus untuk penggunaan lokal sederhana.

## Struktur utama

- `header`: identitas Sakura dan label preview.
- `.intro`: judul dan penjelasan konsep.
- `#stage`: area animasi pemindaian.
- `#track`: deretan kartu yang bergerak.
- `.card`: satu kartu dokumentasi kegiatan.
- `.beam`: garis cahaya pemindai.
- `#petals`: wadah kelopak sakura.
- `.controls`: tombol pengaturan animasi.
- `script`: logika animasi dan interaksi.

## Catatan

- Foto yang digunakan adalah foto contoh eksternal; foto tersebut memerlukan koneksi internet.
- Aksara yang muncul dibuat secara acak dari kumpulan karakter Jepang di dalam JavaScript.
- File Markdown ini merupakan dokumentasi ringkas dari file HTML yang diberikan, bukan pengganti file HTML yang dapat dijalankan.
