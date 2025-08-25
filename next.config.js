/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Do NOT set `output: 'export'` — it breaks dynamic/app routes on Vercel.
  // If you previously had it, removing it enables proper server routing.
  experimental: {
    // If you’re on Next 13/14, App Router is auto-enabled by /app usage,
    // you don’t need to set anything here; leaving this key is harmless.
  },
};

module.exports = nextConfig;
