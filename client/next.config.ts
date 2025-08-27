// next.config.js
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    unoptimized: true, // disables optimization so <Image> works with any src
  },
};

export default nextConfig;
