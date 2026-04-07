import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "ccsrpcma.carsensor.net",
      },
      {
        protocol: "https",
        hostname: "ccsrpcml.carsensor.net",
      },
      {
        protocol: "https",
        hostname: "carsensor.net",
      },
      {
        protocol: "https",
        hostname: "www.carsensor.net",
      },
    ],
  },
};

export default nextConfig;
