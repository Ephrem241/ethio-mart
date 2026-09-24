import type { NextConfig } from "next";
import path from "path";

// Product and category photos live in Supabase Storage (public buckets). They
// are served through Next's image optimizer — resized to the size actually
// shown, converted to WebP, cached — instead of downloading the 1600px original
// for every thumbnail. Only images from THIS project's public storage may be
// optimized (the optimizer fetches whatever it is pointed at, so it is
// restricted to the one place we upload to).
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

const nextConfig: NextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  images: {
    remotePatterns: supabaseUrl ? [new URL(`${supabaseUrl}/storage/v1/object/public/**`)] : [],
    // Uploaded files get a random name and are never overwritten (see
    // lib/services/storage.ts), so a cached optimized copy can't go stale.
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
