import type { NextConfig } from "next";

// Admin for ezhupira.in, deployed on its own at admin.ezhupira.in. Reachable only by URL:
// nothing on the public site links here, and every page is noindex.
const nextConfig: NextConfig = {
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
};

export default nextConfig;
