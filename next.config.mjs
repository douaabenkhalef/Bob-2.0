/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  experimental: {
    serverActions: { bodySizeLimit: "50mb" },
  },
  outputFileTracingIncludes: {
    "/api/run": ["./sample-projects/**/*"],
  },
};
export default nextConfig;
