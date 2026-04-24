# BizSpot AI — Frontend

React + Vite single-page application with Google Maps integration, dark/light theming, and interactive location analysis UI.

## Setup

```bash
npm install
cp .env.example .env   # Add your Google Maps API key
npx vite               # Runs on http://localhost:3000
```

## Environment Variables

| Variable | Description |
|----------|-------------|
| VITE_GOOGLE_MAPS_API_KEY | Google Maps JavaScript API key |

## Key Components

### App.jsx (Main Component)

Single-file React application containing:

**State Management**
- Business type search with debounced autocomplete
- Map pin location tracking
- Analysis results and competitor data
- Area expansion with tabbed detail view
- Side-by-side comparison (select any 2 areas)
- Dark/light theme toggle (persisted in localStorage)

**Google Maps Integration**
- Custom dark/light map styles
- Click-to-drop-pin with radius circle
- Bold pin-shaped markers for recommended areas (numbered 1-5)
- Small red dots for competitors
- Click a marker to expand that area's detail view

**Three-Tab Area Detail View**
- Info: Demographics, scoring breakdown, nearby places
- Competitors: Real businesses from Google Places with ratings and reviews
- AI Insights: LLM-generated analysis from Groq

**Compare Feature**
- Click "Compare" on any 2 area cards
- Side-by-side table highlights which area wins on each metric
- Green = winner, gray = loser for each row

## Styling (style.css)

CSS custom properties enable the dark/light theme:

```css
:root, [data-theme="dark"] { --bg-0: #05070a; ... }
[data-theme="light"] { --bg-0: #f5f7fa; ... }
```

Theme is toggled via `data-theme` attribute on `<html>` and persisted in localStorage.

## API Communication

All API calls go to the backend:
- Development: `http://localhost:8001`
- Production: same domain (served by Express static files)

Auto-detected via:
```javascript
const API = window.location.hostname === "localhost" ? "http://localhost:8001" : "";
```

## Build

```bash
npx vite build    # Outputs to dist/
```

In production, the built files are served by the Express backend from `backend/public/`.
