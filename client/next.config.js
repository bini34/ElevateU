// The optimizer fetches only public media on the configured API origin.
// Private message files remain authenticated blobs and must never enter it.
const backend = new URL(process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:8080/api');
if (!['http:', 'https:'].includes(backend.protocol) || backend.username || backend.password) {
  throw new Error('NEXT_PUBLIC_BACKEND_URL must be an HTTP(S) URL without credentials.');
}
const backendPath = backend.pathname.replace(/\/api\/?$/, '').replace(/\/$/, '');
const publicUploadPatterns = ['avatars', 'posts', 'groups'].map((folder) => ({
  protocol: backend.protocol.slice(0, -1),
  hostname: backend.hostname,
  port: backend.port,
  pathname: `${backendPath}/storage/uploads/${folder}/**`,
  search: '',
}));

/** @type {import('next').NextConfig} */
const nextConfig = {
    // Self-contained server bundle for the production Docker image
    output: 'standalone',
    images: {
      // Local Docker development can serve originals when its browser-facing
      // localhost API cannot be reached from inside the Next container.
      unoptimized: process.env.ELEVATEU_UNOPTIMIZED_IMAGES === 'true',
      // sharp 0.35.4 patches the native image-decoder advisories. Keep SVG
      // disabled and restrict optimizer inputs to known public upload paths.
      dangerouslyAllowSVG: false,
      remotePatterns: [
        ...publicUploadPatterns,
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
