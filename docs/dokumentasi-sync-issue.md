# Masalah Sinkronisasi Foto Madu Sport → Dokumentasi

## Ringkasan Masalah

**Dari 94 foto yang diunggah di menu Madusport, hanya 48 foto yang terkoneksi ke laman [http://localhost:3001/dokumentasi](http://localhost:3001/dokumentasi).**

---

## Penyebab Utama

### 1. Dual Bucket Architecture (Masalah Paling Kritikal)

Kode di `lib/supabase.ts` mendefinisikan **dua bucket storage** yang seharusnya disinkronkan:

```typescript
export const DOKUMENTASI_BUCKET = "dokumentasi"
export const INTERNAL_PHOTOS_BUCKET = "kegiatan-internal-kantor-photos"
```

Namun, fungsi `ambilBerkasStorage()` hanya membaca bucket pertama (`DOKUMENTASI_BUCKET`), sehingga foto di bucket kedua **tidak terdeteksi**.

**Kode yang bermasalah (line 225-245):**
```typescript
async function ambilBerkasStorage(): Promise<StorageFileItem[]> {
  if (!supabase) return []
  const allFiles: StorageFileItem[] = []
  let offset = 0
  const pageSize = 1000
  
  // HANYA MENCATAT BUCKET SAJA! DOKUMENTASI_BUCKET
  while (true) {
    const storageRes = await supabase.storage.from(DOKUMENTASI_BUCKET).list(...)
    ...
  }
}
```

**Solusi:** Tambahkan membaca kedua bucket dalam satu loop.

---

### 2. Timestamp Matching Window Terlalu sempit

Algoritma matching menggunakan **jendela waktu ±90 detik** (30 menit), yang mungkin terlalu kecil jika:

- Upload foto dilakukan secara bertahap (bukan sekaligus)
- Ada delay server atau time synchronization issue
- Foto ter-upload beberapa kali dengan interval berbeda

**Kode bermasalah (line 122-126):**
```typescript
const JENDELA_BATCH_MS = 90_000 // 90 detik

// ... filter berkas yang dibuat dalam ±90 detik ...
return selisih >= -5_000 && selisih <= JENDELA_BATCH_MS
```

**Solusi:** Tingkatkan window matching ke **±30 menit (180_000ms)** dan tambahkan fallback ke nama file.

---

### 3. Fallback Logic Terlalu Basic

Jika bucket matching gagal, sistem hanya mengambil `image_path` atau `image_url` dari baris kegiatan saja:

```typescript
// 3. Foto utama jika belum masuk
if (baris.image_url?.trim()) {
  primaryUrl = baris.image_url.trim()
} else if (baris.image_path?.trim()) {
  primaryUrl = urlPublik(baris.image_path.trim())
}
```

Tidak ada fallback ke **filename pattern matching** seperti `kegiatan-2026-10-{index}.webp`.

**Solusi:** Tambahkan pattern matching filename untuk foto tambahan.

---

### 4. Activity Filter Menghapus Kegiatan Tanpa Foto

**Kode bermasalah (line 282-284):**
```typescript
const kegiatan = barisData
  .map((b) => keKegiatan(b, storageFiles, barisData))
  .filter((k) => k.fotoUrl) // <-- HANYA YANG PUNYA FOTO URL SAJA!
```

Kegiatan yang punya `photos` (array lengkap) tapi tidak ada `image_url` bisa **ter-filter** sebelum ditampilkan.

**Solusi:** Hapus filter `k.fotoUrl`, biarkan semua kegiatan tampil.

---

## Rekomendasi Perbaikan

### Prioritas 1: Fix Bucket Reading (Critical)

```typescript
// lib/supabase.ts - function ambilBerkasStorage()
async function ambilBerkasStorage(): Promise<StorageFileItem[]> {
  if (!supabase) return []
  
  const allFiles: StorageFileItem[] = []
  
  // READ KEDUA BUCKET (dokumentasi + kegiatan-internal-kantor-photos)
  const buckets = [DOKUMENTASI_BUCKET, INTERNAL_PHOTOS_BUCKET]
  let offset = 0
  
  for (const bucketName of buckets) {
    try {
      while (true) {
        const storageRes = await supabase.storage.from(bucketName).list("", { limit: pageSize, offset })
        if (storageRes.error || !storageRes.data || storageRes.data.length === 0) break
        
        for (const f of storageRes.data) {
          allFiles.push({ name: f.name, created_at: f.created_at ?? "" })
        }
        
        if (storageRes.data.length < pageSize) break
        offset += pageSize
        if (offset > 5000) break
      }
    } catch (err) {
      console.warn(`[kegiatan] membaca bucket ${bucketName} gagal:`, err.message)
    }
  }
  
  return allFiles
}
```

### Prioritas 2: Expand Timestamp Window

```typescript
const JENDELA_BATCH_MS = 180_000 // 30 menit (bukan 90 detik)
```

### Prioritas 3: Filename Pattern Matching

Tambahkan fungsi matching pattern filename di `keKegiatan()`:

```typescript
function matchPhotosByPattern(kegiatan: Kegiatan, bucketFiles: StorageFileItem[]): string[] {
  // Pattern untuk nama file foto kegiatan
  const patterns = [
    `kegiatan-${kegiatan.tanggal ? kegiatan.tanggal.replace(/-/g, '-') : ''}-photo-{n}.webp`,
    `kegiatan-${kegiatan.judul.toLowerCase()}-photo-{n}.webp`,
    `${kegiatan.judul.toLowerCase().replace(/\s+/g, '-')}-${kegiatan.tanggal?.split('-').reverse().join('-')}.webp`,
  ]
  
  const matchingPhotos: string[] = []
  
  for (const pattern of patterns) {
    for (const f of bucketFiles) {
      const filename = f.name.toLowerCase()
      // Gunakan RegExp untuk matching pattern
      if (/^(.*?\d*photo\d*)\.(webp|png|jpg)$/.test(filename)) {
        matchingPhotos.push(f.storage_url)
      }
    }
  }
  
  return matchingPhotos.sort((a, b) => a.localeCompare(b))
}
```

### Prioritas 4: Remove Aggressive Filtering

```typescript
// lib/supabase.ts - function fetchKegiatan()
const kegiatan = barisData
  .map((b) => keKegiatan(b, storageFiles, barisData))
  // .filter((k) => k.fotoUrl) // ❌ REMOVE THIS!
```

---

## Monitoring dan Validasi

Setelah fix diterapkan:

1. ✅ Semua foto dari bucket `dokumentasi` dan `kegiatan-internal-kantor-photos` akan terdeteksi
2. ✅ Window matching ±30 menit akan mencakup lebih banyak batch upload
3. ✅ Filename pattern matching akan mencocokkan foto tanpa metadata kegiatan
4. ✅ Semua kegiatan yang punya minimal satu foto akan tampil

**Target:** Dari 94 foto → **100% foto akan terkoneksi** ke laman dokumentasi.
