/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      domains: ['localhost'], // Add localhost for local image handling
      remotePatterns: [
        {
          protocol: 'https',
          hostname: 'static.xx.fbcdn.net',
          port: '',
          pathname: '/**',
        },
      ],
    },
  
};

export default nextConfig;
