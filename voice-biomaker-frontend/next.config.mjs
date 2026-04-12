/** @type {import('next').NextConfig} */
const nextConfig = {
<<<<<<< Updated upstream:voice-biomaker-frontend/next.config.mjs
  transpilePackages: ['three', '@react-three/fiber', '@react-three/drei'],
=======
  // Reverting to direct connections for stability on Windows
  /*
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://127.0.0.1:8000/api/:path*',
      },
    ]
  },
  */
>>>>>>> Stashed changes:frontend/next.config.mjs
};

export default nextConfig;
