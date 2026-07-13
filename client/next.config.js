/** @type {import('next').NextConfig} */
const nextConfig = {
    images: {
      remotePatterns: [
        {
          // Local API (nginx) serving /storage uploads
          protocol: 'http',
          hostname: 'localhost',
          port: '8080',
          pathname: '/storage/**',
        },
        {
          // Local API via `php artisan serve`
          protocol: 'http',
          hostname: 'localhost',
          port: '8000',
          pathname: '/storage/**',
        },
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
