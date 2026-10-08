# english-web-app

React + TypeScript + Vite frontend for the English Grammar App (Tailwind, React Router,
TanStack Query).

## Run locally

```bash
cp .env.example .env    # VITE_API_URL, VITE_GOOGLE_CLIENT_ID, VITE_YOUGLISH_KEY (optional)
npm install
npm run dev             # http://localhost:3500
```

Or with Docker: `docker compose up --build`.

The backend must be running at `VITE_API_URL` (see `backend/english-api-app`).
`http://localhost:3500` must be an authorized JavaScript origin of the Google OAuth
client.

## Deploy (Vercel)

Import the repo in Vercel (framework preset: Vite) and set the three `VITE_*`
variables. `vercel.json` adds the SPA rewrite and a strict Content-Security-Policy
(`connect-src` allows `https://*.onrender.com`; change it if the API lives elsewhere).
Then add the Vercel URL to the backend `CORS_ORIGINS` and to the Google OAuth client's
JavaScript origins.
