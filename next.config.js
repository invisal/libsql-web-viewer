/* eslint-disable @typescript-eslint/no-var-requires */
const withMDX = require("@next/mdx")();
const pkg = require("./package.json");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  pageExtensions: ["js", "jsx", "mdx", "ts", "tsx"],
  env: {
    NEXT_PUBLIC_STUDIO_VERSION: pkg.version,
  },
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: "https://app.dev.outerbase.com/api/v1/:path*",
      },
    ];
  },
};

module.exports = withMDX(nextConfig);
