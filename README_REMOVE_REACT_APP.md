This repository was migrated to Next.js under `next-app/`.

The legacy Vite React app under the root (`client/`, root `public/`, `vite.config.*`, `index.html`, server files under `server/`, and shared helpers) can be removed if you no longer plan to use them.

Before deletion, ensure any assets from the root `public/` are copied into `next-app/public` and any env variables are ported into `.env.local` for Next.js.

If you use Netlify functions or Express server code, port or delete them accordingly.
