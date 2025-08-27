import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    unoptimized: true, // disables optimization so <Image> works with any src
  },
};

export default nextConfig;
