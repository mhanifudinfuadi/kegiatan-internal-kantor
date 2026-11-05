/** @type {import('next').NextConfig} */
const remotePatterns = [
  {
    protocol: "https",
    hostname: "*.supabase.co",
    pathname: "/storage/v1/object/public/**",
  },
]

if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  try {
    remotePatterns.push({
      protocol: "https",
      hostname: new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname,
      pathname: "/storage/v1/object/public/**",
    })
  } catch {
    // abaikan URL tidak valid; pola wildcard di atas tetap dipakai
  }
}

const nextConfig = {
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    // Foto dioptimalkan oleh next/image (resize + WebP + cache).
    unoptimized: false,
    remotePatterns,
  },
}

export default nextConfig
