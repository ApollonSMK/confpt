
import type {NextConfig} from 'next';

const supabaseHostname = process.env.NEXT_PUBLIC_SUPABASE_URL
  ? new URL(process.env.NEXT_PUBLIC_SUPABASE_URL).hostname
  : '';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      // Only add the Supabase remote pattern if the hostname is available
      ...(supabaseHostname ? [{
        protocol: 'https',
        hostname: supabaseHostname,
        port: '',
        pathname: '/**',
      }] : []),
    ],
  },
  // This is required to allow the Next.js dev server to be accessed from
  // the Firebase Studio preview pane.
  allowedDevOrigins: [
    'https://*.cloudworkstations.dev',
    'https://*.firebase.studio',
  ],
};

export default nextConfig;
