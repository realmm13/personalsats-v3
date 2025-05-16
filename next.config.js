import withMDX from '@next/mdx';

const derivedUrl =
  process.env.VERCEL_URL && process.env.VERCEL_ENV === "preview"
    ? `https://${process.env.VERCEL_URL}`
    : process.env.NEXT_PUBLIC_APP_URL;

/** @type {import('next').NextConfig} */
const config = {
  extension: /\.mdx?$/,
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    viewTransition: true,
  },
  env: {
    NEXT_PUBLIC_APP_URL: derivedUrl,
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "utfs.io",
        port: "",
        pathname: "/f/**",
      },
    ],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};

export default config; 