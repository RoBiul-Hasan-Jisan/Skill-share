/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Proxies /api/* to the Express backend during `next dev` and in
  // production, so the frontend can call relative paths like
  // fetch("/api/...") without hardcoding a backend origin.
  // Set BACKEND_URL in your environment (defaults to localhost:4000).
  // Note: the realtime chat socket connects directly to
  // NEXT_PUBLIC_SOCKET_URL (see src/lib/socket.ts) and does not go
  // through this proxy, since WebSocket upgrades aren't reliably
  // proxied by Next.js rewrites in every deployment target.
  async rewrites() {
    const backend = process.env.BACKEND_URL ?? "http://localhost:4000";
    return [{ source: "/api/:path*", destination: `${backend}/api/:path*` }];
  },
};

module.exports = nextConfig;

