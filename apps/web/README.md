# Insta Fumigation — Admin Web App

Admin dashboard and installable PWA for **Insta Fumigation & Pest Control Services**
— *Because We Can!*

Next.js (App Router) + Tailwind CSS v4.

## Brand

| Token | Value | Used for |
| --- | --- | --- |
| Navy (primary) | `#012C7F` | Primary actions, active nav, headers, links |
| Red (accent) | `#CD0412` | Tagline, alerts, unread indicators |

Both are exposed as Tailwind scales — `brand-50…950` and `accent-50…900` —
defined in [`src/app/globals.css`](src/app/globals.css). Use those utilities
(`bg-brand-600`, `text-accent-600`, …) rather than raw hex values or stock
Tailwind palettes, so a future brand tweak stays a one-file change.

The logo lives in [`src/components/Logo.tsx`](src/components/Logo.tsx):

- `<LogoMark />` — shield + house symbol only, for tight spots (sidebar rail, mobile header)
- `<Logo />` — full lockup with wordmark, for auth pages
- `BRAND_NAME`, `BRAND_FULL_NAME`, `BRAND_TAGLINE` — brand strings; import these
  instead of hardcoding the company name

Source artwork: `insta fumigication logo.png` at the repo root. The icon set in
`public/` (favicon, PWA icons, apple-touch-icon) is generated from it.

## Getting started

```bash
npm install          # from the repo root — this is an npm workspace
npm run dev -w @insta-fumigation/web
```

Then open [http://localhost:3000](http://localhost:3000).

The app expects the API at `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:5000`).

## Scripts

```bash
npm run build        # production build
npm run lint         # eslint
```

## PWA

The app is installable. Relevant files:

- `public/manifest.json` — name, brand theme color, icon set
- `public/sw.js` — minimal service worker; caches static assets only, never API
  calls or navigations. Bump `CACHE_NAME` when static brand assets change.
- `src/components/PWARegister.tsx` — registration

Deleting those three files fully reverts the app to plain web.
