const withMDX = require('@next/mdx')({
  extension: /\.mdx?$/,
});

module.exports = withMDX({
  pageExtensions: ['js', 'jsx', 'ts', 'tsx', 'md', 'mdx'],
  experimental: {
    viewTransition: true,
  },
  env: {
    NEXT_PUBLIC_APP_URL: process.env.VERCEL_URL && process.env.VERCEL_ENV === "preview"
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_APP_URL,
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
});
