import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export for Cloudflare Pages deployment
  output: "export",

  // Disable image optimization (not supported in static export)
  images: {
    unoptimized: true,
  },

  // Trailing slashes for better compatibility
  trailingSlash: true,
};

export default nextConfig;
