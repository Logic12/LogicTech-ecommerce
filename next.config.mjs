/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Lets phones on your Wi-Fi load the dev server (e.g. http://192.168.100.11:3000).
  // Update the IP if your computer's local address changes. Ignored in production.
  allowedDevOrigins: ["192.168.100.11"],
  images: {
    formats: ["image/avif", "image/webp"],
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "cdn.sanity.io" },
    ],
  },
  async headers() {
    return [
      {
        source: "/((?!studio).*)",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
        ],
      },
    ];
  },
};

export default nextConfig;
