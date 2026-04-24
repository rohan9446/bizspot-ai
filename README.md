# BizSpot AI — Smart Business Location Advisor

BizSpot AI helps entrepreneurs find the best location to open their business. Select a business type, drop a pin on the map, and get AI-powered recommendations backed by real data from Google Places, US Census Bureau, and Groq LLM.

**Live Demo:** https://bizspot-ai-874544146120.us-central1.run.app

## Screenshots

### Dashboard — Map + Recommended Areas
![BizSpot AI Dashboard](image/dashboard.png.png)

### Area Detail — Demographics, Competitors & AI Insights
![BizSpot AI Area Detail](image/areaDetails.png.png)

## How It Works

1. **Search** for your business type (restaurant, salon, gym, etc.)
2. **Click** anywhere on the Google Map to set your target area
3. **Adjust** the search radius (0.5km to 5km)
4. **Analyze** — the system scores 16 candidate locations using real data
5. **Explore** each area's demographics, competitors, and AI insights

## Features

**Data Sources**
- Google Places API — real competitor data (names, ratings, reviews, price level)
- US Census Bureau — median household income, population, rent
- Google Geocoding — real neighborhood names
- Google Places (proximity) — schools, transit stops, hospitals, parks, stadiums

**AI Analysis**
- Groq (Llama 3.1 8B) generates per-area insights
- Strengths, risks, competitor landscape, and actionable advice
- References actual data points (income, rent, competitor ratings)

**Scoring Engine**
- 6 weighted signals: foot traffic, income, competition, rent, population, safety
- Weights customized per business type (e.g., restaurants weight foot traffic higher)
- Min-max normalization across all candidates for fair comparison

**UI**
- Dark/light theme toggle
- Interactive Google Map with custom dark styling
- Tabbed area detail view (Info, Competitors, AI Insights)
- Side-by-side location comparison
- Responsive design

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React, Vite, Google Maps JS API |
| Backend | Node.js, Express |
| AI | Groq API (Llama 3.1 8B Instant) |
| Data | Google Places, US Census ACS5, Google Geocoding |
| Hosting | Google Cloud Run (free tier) |
| Container | Docker |

## Project Structure

```
bizspot-ai/
├── backend/
│   ├── server.js          # Express API server (all endpoints)
│   ├── package.json
│   └── .env               # API keys (not in git)
├── frontend/
│   ├── src/
│   │   ├── App.jsx        # Main React component
│   │   ├── main.jsx       # Entry point
│   │   └── style.css      # All styles (dark/light themes)
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
├── Dockerfile             # Production container
├── .dockerignore
├── .gitignore
└── README.md
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /health | Server health check |
| GET | /api/business-types?q=pizza | Search business types |
| POST | /api/analyze | Score and rank 16 candidate locations |
| POST | /api/competitors | Find competitors via Google Places |
| POST | /api/area-competitors | Competitors for a specific area |
| POST | /api/insight | AI analysis via Groq LLM |

## Local Development

### Prerequisites

- Node.js 20+
- Git
- API Keys: Google Maps, Groq (free), Census (free, optional)

### Setup

```bash
# Clone
git clone https://github.com/rohan9446/bizspot-ai.git
cd bizspot-ai

# Backend
cd backend
npm install
cp .env.example .env   # Add your API keys
node server.js         # Runs on http://localhost:8001

# Frontend (new terminal)
cd frontend
npm install
npx vite               # Runs on http://localhost:3000
```

### Environment Variables

Create `backend/.env`:

```
GOOGLE_MAPS_API_KEY=your_key
GROQ_API_KEY=your_key
CENSUS_API_KEY=your_key
```

### Required Google APIs

Enable these in Google Cloud Console:
- Maps JavaScript API
- Places API
- Geocoding API

## Deployment

### Google Cloud Run

```bash
# Build and deploy (requires gcloud CLI + Docker)
gcloud run deploy bizspot-ai \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_MAPS_API_KEY=xxx,GROQ_API_KEY=xxx,CENSUS_API_KEY=xxx
```

### Docker (local)

```bash
docker build -t bizspot-ai .
docker run -p 8080:8080 \
  -e PORT=8080 \
  -e GOOGLE_MAPS_API_KEY=xxx \
  -e GROQ_API_KEY=xxx \
  -e CENSUS_API_KEY=xxx \
  bizspot-ai
```

## Free Tier Limits

| Service | Free Allowance |
|---------|---------------|
| Google Maps | $200/month credit |
| Groq | 14,400 requests/day |
| US Census | Unlimited (free) |
| Google Cloud Run | 2M requests/month |

## Scoring Weights by Business Type

| Signal | Restaurant | Retail | Salon | Cafe | Gym | Pharmacy |
|--------|-----------|--------|-------|------|-----|----------|
| Foot Traffic | 30% | 25% | 20% | 35% | 15% | 15% |
| Income | 20% | 25% | 25% | 15% | 20% | 15% |
| Competition | 20% | 15% | 25% | 20% | 25% | 20% |
| Rent | 15% | 15% | 15% | 15% | 15% | 10% |
| Population | 10% | 10% | 10% | 10% | 20% | 25% |
| Safety | 5% | 10% | 5% | 5% | 5% | 15% |

## License

MIT

## Author

Rohan — [@rohan9446](https://github.com/rohan9446)
