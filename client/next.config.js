/** @type {import('next').NextConfig} */
const nextConfig = {
    // Self-contained server bundle for the production Docker image
    output: 'standalone',
    images: {
      // Temporary security control while sharp's breaking upgrade is reviewed.
      // Serve original media directly; disable the vulnerable optimizer route.
      unoptimized: true,
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
