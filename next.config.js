/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  transpilePackages: ["victory-vendor", "d3-scale", "d3-format", "d3-array"],
};

module.exports = nextConfig;
