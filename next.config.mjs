/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Works around an open Next.js 16 bug where the streaming-metadata
  // wrapper causes a hydration mismatch (vercel/next.js#93401, #95347).
  // Matching every UA disables streaming metadata entirely.
  htmlLimitedBots: /.*/,
}

export default nextConfig
