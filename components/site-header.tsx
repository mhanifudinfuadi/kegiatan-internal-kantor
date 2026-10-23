import Link from "next/link"

const PORTAL_ADMIN = process.env.NEXT_PUBLIC_PORTAL_ADMIN_URL ?? "https://landing-home-page-087.vercel.app/"

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-[#e9e4e1] bg-[#fbfaf9]/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#102b46] text-sm font-black tracking-tight text-white">
            087
          </span>
          <span className="leading-tight">
            <span className="block font-display text-lg text-[#102b46] sm:text-xl">
              Kegiatan Internal Kantor
            </span>
            <span className="block text-[10px] font-semibold uppercase tracking-[.22em] text-[#B66B87]">
              Madu Jakbar Sport
            </span>
          </span>
        </Link>

        <nav aria-label="Navigasi utama" className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/#daftar-kegiatan"
            className="rounded-full px-3 py-2 text-sm font-semibold text-[#4b5265] transition hover:bg-white hover:text-[#102b46]"
          >
            Daftar kegiatan
          </Link>
          <a
            href={PORTAL_ADMIN}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-2 rounded-full bg-[#102b46] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1b3d5b]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-4 w-4"
              aria-hidden="true"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            ホーム
          </a>
        </nav>
      </div>
    </header>
  )
}
