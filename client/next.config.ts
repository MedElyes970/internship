import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingRoot: __dirname,
  images: {
    domains: ["lh3.googleusercontent.com"],
  },
};

export default nextConfig;
