import data from "@/data/kegiatan.json";

export type Kegiatan = {
  id: string;
  judul: string;
  tanggal: string; // YYYY-MM-DD
  deskripsi: string;
  foto: string[];
};

export type Unit = {
  slug: string;
  nama: string;
  kegiatan: Kegiatan[];
};

const units: Unit[] = (data as { units: Unit[] }).units;

/** Kegiatan diurutkan dari tanggal terbaru. */
function sortByDate(list: Kegiatan[]) {
  return [...list].sort((a, b) => (a.tanggal < b.tanggal ? 1 : -1));
}

export function getUnits(): Unit[] {
  return units.map((u) => ({ ...u, kegiatan: sortByDate(u.kegiatan) }));
}

export function getUnit(slug: string): Unit | undefined {
  return getUnits().find((u) => u.slug === slug);
}

export function formatTanggal(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const bulan = ["Januari","Februari","Maret","April","Mei","Juni","Juli","Agustus","September","Oktober","November","Desember"];
  return `${d} ${bulan[m - 1]} ${y}`;
}
