# Travel Thru

**Plan it once. Book it all.** Travel Thru is an AI trip planner: pick a
destination and your exact travel dates, and it generates a day-by-day
itinerary alongside flights, stays, and car-hire options — with a live
running total in ZAR.

Built with **React + Vite**, **Tailwind CSS v4**, **react-day-picker**, and
the **Anthropic API** for the itinerary engine.

## Local development

```bash
npm install
npm run dev      # http://localhost:5173
```

Other scripts:

```bash
npm run build    # production build → dist/
npm run preview  # preview the production build locally
npm run lint     # eslint
```

## Deployment (GitHub Pages)

The repo ships a GitHub Actions workflow (`.github/workflows/deploy.yml`)
that builds the app and publishes `dist/` to GitHub Pages on every push.

**One-time setup** (in the GitHub UI — these can't be scripted):

1. Go to **Settings → Pages**.
2. Under **Build and deployment → Source**, choose **GitHub Actions**.
3. If deploying from a non-default branch, allow it under
   **Settings → Environments → github-pages → Deployment branches**.

Once enabled, the workflow runs automatically and the live URL appears in
the Actions run summary (typically `https://jay1724.github.io/Travel-thru/`).

The Vite build uses a **relative base path** (`base: './'`), so the bundle
works from any subpath without further configuration.

## Notes

- The itinerary engine calls the Anthropic API directly from the browser.
  For a public deployment this needs an API key and a server-side proxy —
  exposing a key in client code is insecure and won't work cross-origin.
  Wire the call through a small backend (or serverless function) before
  going live. The booking data (flights, stays, cars) is currently mocked;
  swap the `mock*` generators in `src/App.jsx` for real APIs (Duffel,
  Booking.com, etc.) at the marked integration points.
