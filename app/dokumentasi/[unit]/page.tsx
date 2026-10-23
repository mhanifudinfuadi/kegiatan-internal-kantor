import { notFound } from "next/navigation";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fetchKegiatan } from "@/lib/supabase";
import { normalisasiUnitKerja } from "@/lib/unit-kerja";

function esc(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function safePhotoUrl(value: string | null) {
  if (!value) return null;
  if (value.startsWith("/") && !value.startsWith("//")) return value;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? value : null;
  } catch {
    return null;
  }
}

function formatTanggal(iso: string | null) {
  if (!iso) return "TANPA TANGGAL";
  const [y, m, d] = iso.split("-").map(Number);
  const bulan = ["JANUARI","FEBRUARI","MARET","APRIL","MEI","JUNI","JULI","AGUSTUS","SEPTEMBER","OKTOBER","NOVEMBER","DESEMBER"];
  return `${d} ${bulan[m - 1]} ${y}`;
}

export default async function UnitPage({ params }: { params: Promise<{ unit: string }> }) {
  const { unit: slug } = await params;
  const { kegiatan } = await fetchKegiatan();
  const items = kegiatan.filter((item) => normalisasiUnitKerja(item.unitKerja).slug === slug);

  if (items.length === 0) notFound();

  const nama = normalisasiUnitKerja(items[0].unitKerja).nama;
  const fotoCount = items.filter((item) => safePhotoUrl(item.fotoUrl)).length;

  const track = `<section class="track" id="track" tabindex="0" aria-label="Daftar kegiatan">${items
    .map((item, index) => {
      const photoUrl = safePhotoUrl(item.fotoUrl);
      const photos = photoUrl ? 1 : 0;
      return `<article class="slide" data-slide style="--d:${index * 90}ms"><span class="frame" aria-hidden="true"></span><span class="scan" aria-hidden="true"></span>
  <div class="meta"><span class="tag">${String(index + 1).padStart(2, "0")}</span><time>${formatTanggal(item.tanggal)}</time><span class="line"></span><span class="count hudcode">${photos} FOTO</span></div>
  <h3 class="title">${esc(item.judul)}</h3><p class="desc">${esc(item.keterangan ?? "")}</p>${
    photoUrl
      ? `<div class="cells" data-count="1"><button class="cell" data-idx="0" data-total="1" data-photo-url="${esc(photoUrl)}" aria-label="Buka foto 1 dari 1"><span class="bg" style="background-image:url(&quot;${esc(photoUrl)}&quot;);background-position:center 20%"></span><span class="corner">01</span></button></div>`
      : `<div class="ph-empty"><span>âœ¿</span><p>Belum ada foto</p></div>`
  }</article>`;
    })
    .join("")}</section>`;

  const dots = `<div class="dots" id="dots">${items
    .map((_, index) => `<button class="dot ${index === 0 ? "on" : ""}" data-i="${index}" aria-label="Kegiatan ${index + 1}"></button>`)
    .join("")}</div>`;

  let html = readFileSync(join(process.cwd(), "preview dokumentasi.html"), "utf8");
  html = html.replace(/<span>Tim IT<\/span>/, `<span>${esc(nama)}</span>`);
  html = html.replace(/<h1>Tim IT <em>Â·<\/em> Kegiatan<\/h1>/, `<h1>${esc(nama)} <em>Â·</em> Kegiatan</h1>`);
  html = html.replace(/<div>Kegiatan<b>05<\/b><\/div>/, `<div>Kegiatan<b>${String(items.length).padStart(2, "0")}</b></div>`);
  html = html.replace(/<div>Foto<b>11<\/b><\/div>/, `<div>Foto<b>${String(fotoCount).padStart(2, "0")}</b></div>`);
  html = html.replace(/<span class="counter" id="c">01 <span>\/ 05<\/span><\/span>/, `<span class="counter" id="c">01 <span>/ ${String(items.length).padStart(2, "0")}</span></span>`);
  html = html.replace(/<section class="track" id="track"[\s\S]*?<\/section>/, track);
  html = html.replace(/<div class="dots" id="dots">[\s\S]*?<\/div>/, dots);
  html = html.replace(
    "const list=cells.map((c,j)=>({pos:getComputedStyle(c.querySelector('.bg')).backgroundPosition}));",
    "const list=cells.map(c=>({url:c.dataset.photoUrl,pos:getComputedStyle(c.querySelector('.bg')).backgroundPosition}));",
  );
  html = html.replace(
    /function lbRender\(\)\{[\s\S]*?\nfunction openLb/,
    "function lbRender(){const c=lbList[lbI],img=document.getElementById('lbImg');img.style.backgroundImage='url('+JSON.stringify(c.url)+')';img.style.backgroundPosition=c.pos;\n  document.getElementById('lbCount').textContent=(lbI+1)+' / '+lbList.length;document.getElementById('lbTitle').textContent=lbT;\n  document.getElementById('lbDate').textContent=lbD;const dl=document.getElementById('lbDl');dl.href=c.url;dl.removeAttribute('onclick');dl.download=c.url.split('/').pop().split('?')[0]||'foto-dokumentasi';}\nfunction openLb",
  );

  return (
    <iframe
      title={`Dokumentasi ${nama}`}
      srcDoc={html}
      style={{ position: "fixed", inset: 0, width: "100%", height: "100%", border: 0 }}
    />
  );
}





