/** @type {import('next').NextConfig} */

const PRODUCTION_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://anantarts.in';

const securityHeaders = [
  // Force HTTPS for 2 years (Strict-Transport-Security)
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  // Prevent MIME-type sniffing
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  // Block framing (clickjacking protection)
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  // Prevent XSS via browser-side script detection
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block',
  },
  // Control referrer information
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  // Restrict browser feature access
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=(self), interest-cohort=()',
  },
  // Content Security Policy — allow Supabase storage, Google Fonts, Razorpay, analytics, CDNs
  {
    key: 'Content-Security-Policy',
    value: [
      "default-src 'self'",
      // Scripts: self, inline (Next.js), Razorpay, GA, Clarity, Font Awesome CDN
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://checkout.razorpay.com https://www.googletagmanager.com https://www.clarity.ms https://cdnjs.cloudflare.com https://assets.mixkit.co",
      // Styles: self, inline, Google Fonts, Font Awesome
      "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdnjs.cloudflare.com",
      // Fonts: self, Google Fonts
      "font-src 'self' https://fonts.gstatic.com https://cdnjs.cloudflare.com",
      // Images: self, data URIs, Supabase storage, CDN
      `img-src 'self' data: blob: ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'} https://assets.mixkit.co https://www.google-analytics.com`,
      // Media: self, Supabase storage, mixkit for demo videos
      `media-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'} https://assets.mixkit.co`,
      // Connections: self, Supabase API, GA, Clarity, Razorpay
      `connect-src 'self' ${process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://*.supabase.co'} https://www.google-analytics.com https://www.clarity.ms https://api.razorpay.com wss://*.supabase.co`,
      // Frames: Razorpay payment popup
      "frame-src 'self' https://api.razorpay.com",
      // Workers: self
      "worker-src 'self' blob:",
    ].join('; '),
  },
];

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
    // Enable modern image formats for better performance
    formats: ['image/avif', 'image/webp'],
    // Optimize images at build time for common sizes
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },

  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
      {
        // Long-term caching for immutable static assets
        source: '/(css|images|uploads|fonts)/(.+)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },

  async redirects() {
    return [
      // Redirect /terms to the canonical terms-and-conditions page
      {
        source: '/terms',
        destination: '/terms-and-conditions',
        permanent: true,
      },
      // Redirect /refund to the canonical refund-policy page
      {
        source: '/refund',
        destination: '/refund-policy',
        permanent: true,
      },
    ];
  },

  // Enable compression
  compress: true,

  // Strict mode for catching React issues in development
  reactStrictMode: true,

  // Power header removal for security (hide Next.js version)
  poweredByHeader: false,
};

export default nextConfig;
