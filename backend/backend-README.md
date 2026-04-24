# BizSpot AI — Backend

Express.js API server that powers BizSpot AI. Handles business type search, location scoring, competitor analysis, and AI insights.

## Setup

```bash
npm install
cp .env.example .env   # Add your API keys
node server.js
```

Runs on `http://localhost:8001` (or `PORT` env var in production).

## Environment Variables

| Variable | Required | Source | Cost |
|----------|----------|--------|------|
| GOOGLE_MAPS_API_KEY | Yes | console.cloud.google.com | $200/mo free credit |
| GROQ_API_KEY | Yes | console.groq.com | Free (14,400 req/day) |
| CENSUS_API_KEY | Optional | api.census.gov/data/key_signup.html | Free |

## API Reference

### GET /health
Returns server status and API key configuration.

### GET /api/business-types?q={query}
Searches 80+ built-in business types. Returns instantly (no external API call).

**Example:** `/api/business-types?q=rest` returns Restaurant, Retail Store, Real Estate Agency.

### POST /api/analyze
Main analysis endpoint. Generates 16 candidate locations around the given point, enriches each with Census data and proximity signals, then scores and ranks them.

**Request:**
```json
{
  "businessType": "Restaurant",
  "lat": 32.7157,
  "lng": -117.1611,
  "radiusKm": 2
}
```

**Response:** Scored and ranked locations with demographics, proximity data, and breakdowns.

### POST /api/competitors
Finds real competing businesses nearby via Google Places API.

**Request:**
```json
{
  "businessType": "Restaurant",
  "lat": 32.7157,
  "lng": -117.1611,
  "radiusMeters": 2000
}
```

### POST /api/area-competitors
Same as above but scoped to 1km around a specific area. Used when user expands an area detail view.

### POST /api/insight
Generates AI-powered analysis for a specific area using Groq (Llama 3.1 8B).

**Request:**
```json
{
  "businessType": "Restaurant",
  "area": { "name": "Hillcrest", "score": 82, ... },
  "competitors": [{ "name": "Pizza Place", "rating": 4.2 }]
}
```

## Architecture

```
Request flow:

1. User submits business type + location
2. /api/analyze generates 16 grid points around the pin
3. For each point:
   - Google Geocoding API -> real neighborhood name
   - Census Bureau API -> income, population, rent
   - Google Places API (one call) -> schools, transit, hospitals, parks nearby
4. Scoring engine normalizes all signals and applies business-type weights
5. Top 5 results returned with scores and breakdowns
6. User clicks an area -> /api/area-competitors + /api/insight for details
```

## Data Sources

**US Census Bureau (ACS 5-Year Estimates)**
- B19013_001E: Median household income
- B01003_001E: Total population
- B01002_001E: Median age
- B25064_001E: Median gross rent

**Google Places (Proximity)**
- Schools, universities, transit stations, hospitals, parks, stadiums

**Google Geocoding**
- Reverse geocodes lat/lng to neighborhood names

## Caching

All external API responses are cached in memory to avoid repeat calls:
- Census data: cached by lat/lng rounded to 2 decimal places
- Proximity data: cached by center point and radius
- Geocoding: cached by lat/lng rounded to 4 decimal places
