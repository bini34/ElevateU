# ElevateU client

Next.js 15.5.25 App Router / React 18 frontend. Use Node 22.23.2 from the root `.nvmrc`, run `npm ci`, configure `.env.local` from `.env.example`, then run `npm run dev`. The Laravel API and Reverb must be configured separately.

Run `npm run lint`, `npm run typecheck`, `npm test`, `npm run build`, `npm audit` and `npm audit --omit=dev` before reviewing changes. Day 3 passed lint/type checks, 19 helper tests, the production build and the standalone Docker build; both audit modes reported zero findings. TypeScript does not currently check JavaScript files, and helper tests do not replace browser verification.

Public image optimization is restored with sharp 0.35.4 and restricted upload paths. Build-time `NEXT_PUBLIC_BACKEND_URL` must match Laravel's `APP_URL` origin and be reachable from both the browser and Next server. The separate local client Compose defaults `ELEVATEU_UNOPTIMIZED_IMAGES=true` because container-local `localhost` cannot reach the API; override it to `false` only with a shared reachable origin. Host development and production builds default to optimization enabled. Private message images still use authenticated binary requests and browser blobs.

See the repository [README](../README.md), [architecture](../docs/ARCHITECTURE.md), [development workflow](../docs/DEVELOPMENT.md) and [security report](../docs/SECURITY.md). `NEXT_PUBLIC_*` values are public browser configuration, never secrets.
