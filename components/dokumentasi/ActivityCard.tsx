import Image from "next/image";
import { formatTanggal, type Kegiatan } from "@/lib/kegiatan";
import s from "./dokumentasi.module.css";

export default function ActivityCard({ item }: { item: Kegiatan }) {
  const tampil = item.foto.slice(0, 3);
  const sisa = item.foto.length - tampil.length;

  return (
    <article className={s.card}>
      <header className={s.cardHead}>
        <time dateTime={item.tanggal} className={s.date}>{formatTanggal(item.tanggal)}</time>
        <h3 className={s.title}>{item.judul}</h3>
        {item.deskripsi && <p className={s.desc}>{item.deskripsi}</p>}
      </header>

      {tampil.length > 0 ? (
        <div className={s.grid}>
          {tampil.map((src, i) => (
            <div key={src} className={s.photo}>
              <Image src={src} alt={`${item.judul}, ${formatTanggal(item.tanggal)}`} fill sizes="(max-width:640px) 100vw, 33vw" />
              {i === tampil.length - 1 && sisa > 0 && <span className={s.more}>+{sisa}</span>}
            </div>
          ))}
        </div>
      ) : (
        <div className={s.placeholder} aria-hidden="true">✿</div>
      )}
    </article>
  );
}
