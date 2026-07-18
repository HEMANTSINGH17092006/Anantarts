/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'bpysijuecdmadnqsjsym.supabase.co',
      },
    ],
  },
};

export default nextConfig;
