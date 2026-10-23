import Link from "next/link"

const PORTAL_ADMIN = process.env.NEXT_PUBLIC_PORTAL_ADMIN_URL ?? "https://madusport087.vercel.app/admin"

type Props = {
  unitKerja: Array<{ slug: string; nama: string; jumlah: number }>
}

export default function SiteFooter({ unitKerja }: Props) {
  return (
    <footer className="border-t border-[#e9e4e1] bg-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-14 sm:px-8 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102b46] text-sm font-black text-white">
            087
          </span>
          <p className="mt-4 font-display text-2xl text-[#102b46]">Kegiatan Internal Kantor</p>
          <p className="mt-2 max-w-sm text-sm leading-6 text-[#6b7180]">
            Rekap kegiatan internal kantor Madu Jakbar Sport. Dokumentasi diunggah oleh
            pengelola melalui portal admin resmi.
          </p>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#B66B87]">
            Unit kerja
          </p>
          <ul className="mt-4 space-y-2 text-sm text-[#6b7180]">
            {unitKerja.length === 0 ? (
              <li className="text-[#a6abb6]">Belum ada unit kerja tercatat.</li>
            ) : (
              unitKerja.map((unit) => (
                <li key={unit.slug}>
                  <Link
                    href="/#daftar-kegiatan"
                    className="transition hover:text-[#102b46]"
                  >
                    {unit.nama}
                    <span className="ml-2 text-xs text-[#a6abb6]">{unit.jumlah}</span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[.22em] text-[#B66B87]">
            Pengelola
          </p>
          <p className="mt-4 text-sm leading-6 text-[#6b7180]">
            Pengunggahan dokumentasi dilakukan admin pada portal utama Madu Jakbar Sport.
          </p>
          <a
            href={PORTAL_ADMIN}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex rounded-full border border-[#e2ddd9] px-4 py-2 text-sm font-semibold text-[#102b46] transition hover:border-[#B66B87] hover:text-[#9d5672]"
          >
            Buka portal admin
          </a>
        </div>
      </div>

      <div className="border-t border-[#f0ece9] px-4 py-5 text-center text-xs text-[#a6abb6] sm:px-8">
        © {new Date().getFullYear()} Madu Jakbar Sport · Website kegiatan internal kantor
      </div>
    </footer>
  )
}
