// BizSpot AI — Backend Server
// Uses Google Places API for real business type search

const express = require("express");
const cors = require("cors");
require("dotenv").config();

const app = express();
const PORT = 8001;
const GOOGLE_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const CENSUS_API_KEY = process.env.CENSUS_API_KEY;

app.use(cors());
app.use(express.json());

// ─── Business Types Database ─────────────────────────────────
const BUSINESS_TYPES = [
  { id: "restaurant", label: "Restaurant", category: "Food & Drink", icon: "🍽️", keywords: ["restaurant", "dining", "food", "eat", "dine"] },
  { id: "cafe", label: "Café / Coffee Shop", category: "Food & Drink", icon: "☕", keywords: ["cafe", "coffee", "espresso", "latte", "tea"] },
  { id: "bakery", label: "Bakery", category: "Food & Drink", icon: "🥖", keywords: ["bakery", "bread", "pastry", "cake", "bake"] },
  { id: "bar", label: "Bar / Pub", category: "Food & Drink", icon: "🍺", keywords: ["bar", "pub", "drinks", "nightlife", "cocktail"] },
  { id: "fast_food", label: "Fast Food", category: "Food & Drink", icon: "🍔", keywords: ["fast food", "burger", "quick service", "takeaway"] },
  { id: "pizza", label: "Pizza Shop", category: "Food & Drink", icon: "🍕", keywords: ["pizza", "pizzeria", "italian"] },
  { id: "ice_cream", label: "Ice Cream / Dessert", category: "Food & Drink", icon: "🍦", keywords: ["ice cream", "dessert", "frozen yogurt", "gelato"] },
  { id: "juice_bar", label: "Juice / Smoothie Bar", category: "Food & Drink", icon: "🥤", keywords: ["juice", "smoothie", "health drink"] },
  { id: "food_truck", label: "Food Truck", category: "Food & Drink", icon: "🚚", keywords: ["food truck", "mobile food", "street food"] },
  { id: "butcher", label: "Butcher Shop", category: "Food & Drink", icon: "🥩", keywords: ["butcher", "meat", "deli"] },

  { id: "retail", label: "Retail Store", category: "Retail", icon: "🛍️", keywords: ["retail", "shop", "store", "merchandise"] },
  { id: "clothing", label: "Clothing Store", category: "Retail", icon: "👗", keywords: ["clothing", "fashion", "apparel", "boutique", "dress"] },
  { id: "electronics", label: "Electronics Store", category: "Retail", icon: "📱", keywords: ["electronics", "tech", "gadgets", "computer", "phone"] },
  { id: "grocery", label: "Grocery Store", category: "Retail", icon: "🛒", keywords: ["grocery", "supermarket", "food store", "market"] },
  { id: "convenience", label: "Convenience Store", category: "Retail", icon: "🏪", keywords: ["convenience", "corner store", "mini mart"] },
  { id: "bookstore", label: "Bookstore", category: "Retail", icon: "📚", keywords: ["book", "bookstore", "reading", "library"] },
  { id: "pet_store", label: "Pet Store", category: "Retail", icon: "🐾", keywords: ["pet", "animal", "pet supplies", "dog", "cat"] },
  { id: "florist", label: "Florist", category: "Retail", icon: "💐", keywords: ["flower", "florist", "bouquet", "plants", "garden"] },
  { id: "jewelry", label: "Jewelry Store", category: "Retail", icon: "💎", keywords: ["jewelry", "jewellery", "rings", "watches", "gold"] },
  { id: "furniture", label: "Furniture Store", category: "Retail", icon: "🪑", keywords: ["furniture", "home decor", "interior", "sofa"] },
  { id: "hardware", label: "Hardware Store", category: "Retail", icon: "🔧", keywords: ["hardware", "tools", "home improvement", "diy"] },
  { id: "thrift", label: "Thrift / Vintage Shop", category: "Retail", icon: "♻️", keywords: ["thrift", "vintage", "secondhand", "consignment", "used"] },
  { id: "toy_store", label: "Toy Store", category: "Retail", icon: "🧸", keywords: ["toy", "toys", "games", "kids", "children"] },
  { id: "sports_store", label: "Sports / Outdoor Store", category: "Retail", icon: "⚽", keywords: ["sports", "outdoor", "athletic", "fitness gear"] },
  { id: "shoe_store", label: "Shoe Store", category: "Retail", icon: "👟", keywords: ["shoe", "shoes", "footwear", "sneakers", "boots"] },

  { id: "salon", label: "Hair Salon", category: "Health & Beauty", icon: "💇", keywords: ["hair", "salon", "haircut", "stylist", "hairdresser"] },
  { id: "barbershop", label: "Barbershop", category: "Health & Beauty", icon: "💈", keywords: ["barber", "barbershop", "men haircut", "shave", "fade"] },
  { id: "spa", label: "Spa / Massage", category: "Health & Beauty", icon: "💆", keywords: ["spa", "massage", "wellness", "relaxation", "facial"] },
  { id: "nail_salon", label: "Nail Salon", category: "Health & Beauty", icon: "💅", keywords: ["nail", "manicure", "pedicure", "nails", "gel"] },
  { id: "beauty_supply", label: "Beauty Supply Store", category: "Health & Beauty", icon: "💄", keywords: ["beauty", "cosmetics", "makeup", "skincare"] },
  { id: "tattoo", label: "Tattoo Parlor", category: "Health & Beauty", icon: "🎨", keywords: ["tattoo", "piercing", "body art", "ink"] },

  { id: "pharmacy", label: "Pharmacy", category: "Medical", icon: "💊", keywords: ["pharmacy", "drugstore", "medicine", "prescription", "chemist"] },
  { id: "dentist", label: "Dental Clinic", category: "Medical", icon: "🦷", keywords: ["dentist", "dental", "teeth", "orthodontist", "oral"] },
  { id: "clinic", label: "Medical Clinic", category: "Medical", icon: "🏥", keywords: ["clinic", "doctor", "medical", "urgent care", "health"] },
  { id: "optician", label: "Optician / Eye Care", category: "Medical", icon: "👓", keywords: ["optician", "glasses", "eye", "vision", "optometrist", "lens"] },
  { id: "veterinary", label: "Veterinary Clinic", category: "Medical", icon: "🐕", keywords: ["vet", "veterinary", "animal clinic", "pet doctor"] },
  { id: "physiotherapy", label: "Physiotherapy", category: "Medical", icon: "🏃", keywords: ["physio", "physiotherapy", "physical therapy", "rehab"] },

  { id: "gym", label: "Gym / Fitness Center", category: "Fitness", icon: "🏋️", keywords: ["gym", "fitness", "workout", "weights", "exercise"] },
  { id: "yoga", label: "Yoga / Pilates Studio", category: "Fitness", icon: "🧘", keywords: ["yoga", "pilates", "stretch", "mindfulness", "meditation"] },
  { id: "martial_arts", label: "Martial Arts Studio", category: "Fitness", icon: "🥋", keywords: ["martial arts", "karate", "boxing", "mma", "kickboxing", "judo"] },
  { id: "dance", label: "Dance Studio", category: "Fitness", icon: "💃", keywords: ["dance", "dancing", "ballet", "studio", "salsa"] },
  { id: "swimming", label: "Swimming Pool", category: "Fitness", icon: "🏊", keywords: ["swimming", "pool", "aquatics", "swim"] },
  { id: "crossfit", label: "CrossFit Box", category: "Fitness", icon: "💪", keywords: ["crossfit", "functional training", "hiit", "bootcamp"] },

  { id: "laundry", label: "Laundromat / Dry Cleaning", category: "Services", icon: "👔", keywords: ["laundry", "dry cleaning", "wash", "laundromat", "ironing"] },
  { id: "auto_repair", label: "Auto Repair Shop", category: "Services", icon: "🔧", keywords: ["auto repair", "mechanic", "car service", "garage", "car fix"] },
  { id: "car_wash", label: "Car Wash", category: "Services", icon: "🚗", keywords: ["car wash", "auto wash", "detailing", "clean car"] },
  { id: "printing", label: "Print / Copy Shop", category: "Services", icon: "🖨️", keywords: ["print", "copy", "printing", "office supplies"] },
  { id: "tailor", label: "Tailor / Alterations", category: "Services", icon: "🧵", keywords: ["tailor", "alterations", "sewing", "custom clothing"] },
  { id: "locksmith", label: "Locksmith", category: "Services", icon: "🔑", keywords: ["locksmith", "keys", "locks", "security"] },
  { id: "cleaning", label: "Cleaning Service", category: "Services", icon: "🧹", keywords: ["cleaning", "maid", "janitorial", "housekeeping"] },
  { id: "plumber", label: "Plumbing Service", category: "Services", icon: "🚿", keywords: ["plumber", "plumbing", "pipes", "water", "drain"] },
  { id: "electrician", label: "Electrician", category: "Services", icon: "⚡", keywords: ["electrician", "electrical", "wiring", "power"] },

  { id: "daycare", label: "Daycare / Childcare", category: "Education", icon: "👶", keywords: ["daycare", "childcare", "nursery", "preschool", "kids"] },
  { id: "tutoring", label: "Tutoring Center", category: "Education", icon: "📖", keywords: ["tutoring", "tutor", "learning center", "education", "coaching"] },
  { id: "driving_school", label: "Driving School", category: "Education", icon: "🚙", keywords: ["driving school", "driving lessons", "learner", "license"] },
  { id: "art_school", label: "Art / Music School", category: "Education", icon: "🎵", keywords: ["art school", "music school", "lessons", "classes", "painting"] },
  { id: "language_school", label: "Language School", category: "Education", icon: "🌍", keywords: ["language", "english", "spanish", "french", "esl"] },

  { id: "gaming", label: "Gaming / Internet Café", category: "Entertainment", icon: "🎮", keywords: ["gaming", "internet cafe", "esports", "arcade", "video games"] },
  { id: "cinema", label: "Cinema / Theater", category: "Entertainment", icon: "🎬", keywords: ["cinema", "movie", "theater", "film", "screening"] },
  { id: "bowling", label: "Bowling Alley", category: "Entertainment", icon: "🎳", keywords: ["bowling", "bowling alley", "lanes"] },
  { id: "escape_room", label: "Escape Room", category: "Entertainment", icon: "🔐", keywords: ["escape room", "puzzle", "adventure", "mystery"] },
  { id: "event_venue", label: "Event Venue", category: "Entertainment", icon: "🎪", keywords: ["event", "venue", "banquet", "party", "wedding", "hall"] },
  { id: "karaoke", label: "Karaoke Bar", category: "Entertainment", icon: "🎤", keywords: ["karaoke", "singing", "ktv"] },

  { id: "coworking", label: "Coworking Space", category: "Professional", icon: "💻", keywords: ["coworking", "shared office", "workspace", "office space", "remote"] },
  { id: "accounting", label: "Accounting Firm", category: "Professional", icon: "📊", keywords: ["accounting", "accountant", "tax", "bookkeeping", "cpa"] },
  { id: "law_office", label: "Law Office", category: "Professional", icon: "⚖️", keywords: ["lawyer", "law office", "attorney", "legal"] },
  { id: "real_estate", label: "Real Estate Agency", category: "Professional", icon: "🏠", keywords: ["real estate", "property", "realtor", "housing", "rent"] },
  { id: "insurance", label: "Insurance Agency", category: "Professional", icon: "🛡️", keywords: ["insurance", "coverage", "policy", "agent"] },
  { id: "travel_agency", label: "Travel Agency", category: "Professional", icon: "✈️", keywords: ["travel", "vacation", "tours", "booking", "flights"] },
  { id: "photography", label: "Photography Studio", category: "Professional", icon: "📸", keywords: ["photography", "photographer", "photo studio", "portraits"] },
  { id: "marketing", label: "Marketing Agency", category: "Professional", icon: "📢", keywords: ["marketing", "advertising", "digital", "social media", "seo"] },
  { id: "it_services", label: "IT / Tech Support", category: "Professional", icon: "🖥️", keywords: ["it", "tech support", "computer repair", "software", "network"] },

  { id: "hotel", label: "Hotel / Motel", category: "Lodging", icon: "🏨", keywords: ["hotel", "motel", "lodging", "accommodation", "stay"] },
  { id: "hostel", label: "Hostel / Guest House", category: "Lodging", icon: "🛏️", keywords: ["hostel", "guest house", "backpacker", "inn", "bnb"] },

  { id: "gas_station", label: "Gas Station", category: "Automotive", icon: "⛽", keywords: ["gas station", "fuel", "petrol", "gas", "diesel"] },
  { id: "car_dealer", label: "Car Dealership", category: "Automotive", icon: "🚙", keywords: ["car dealer", "dealership", "auto sales", "vehicles", "used cars"] },
  { id: "tire_shop", label: "Tire Shop", category: "Automotive", icon: "🛞", keywords: ["tire", "tyre", "wheel", "alignment"] },
  { id: "ev_charging", label: "EV Charging Station", category: "Automotive", icon: "🔌", keywords: ["ev charging", "electric vehicle", "charging station", "tesla"] },
];

// ─── Health Check ────────────────────────────────────────────
app.get("/health", (req, res) => {
  res.json({
    status: "ok",
    message: "BizSpot AI is running!",
    googleApiKey: GOOGLE_API_KEY ? "configured" : "MISSING",
  });
});

// ─── Search Business Types (local instant search) ────────────
// GET /api/business-types?q=r → returns Restaurant, Retail Store, Real Estate...
app.get("/api/business-types", (req, res) => {
  const query = (req.query.q || "").toLowerCase().trim();

  if (!query) {
    // No search query — return all grouped by category
    const grouped = {};
    for (const t of BUSINESS_TYPES) {
      if (!grouped[t.category]) grouped[t.category] = [];
      grouped[t.category].push({ id: t.id, label: t.label, icon: t.icon });
    }
    return res.json({ results: BUSINESS_TYPES.map(t => ({ id: t.id, label: t.label, icon: t.icon, category: t.category })), grouped, total: BUSINESS_TYPES.length });
  }

  // Filter — match against label, category, and keywords
  const results = BUSINESS_TYPES
    .filter((t) => {
      if (t.label.toLowerCase().includes(query)) return true;
      if (t.category.toLowerCase().includes(query)) return true;
      if (t.keywords.some((k) => k.includes(query))) return true;
      return false;
    })
    .map((t) => ({ id: t.id, label: t.label, icon: t.icon, category: t.category }));

  res.json({ results, query, total: results.length });
});

// ─── Get Place Details (after user selects a suggestion) ─────
// Example: GET /api/place-details?placeId=ChIJ...
app.get("/api/place-details", async (req, res) => {
  const { placeId } = req.query;

  if (!placeId) {
    return res.status(400).json({ error: "placeId is required" });
  }

  try {
    const url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,formatted_address,geometry,types,business_status,rating,user_ratings_total&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    if (data.status !== "OK") {
      return res.status(500).json({ error: `Google API: ${data.status}` });
    }

    const place = data.result;
    res.json({
      name: place.name,
      address: place.formatted_address,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      types: place.types,
      rating: place.rating,
      totalReviews: place.user_ratings_total,
      status: place.business_status,
    });
  } catch (err) {
    console.error("Place details error:", err.message);
    res.status(500).json({ error: "Failed to get place details" });
  }
});

// ─── Find Competitors Nearby ─────────────────────────────────
// Example: POST /api/competitors { lat, lng, businessType, radiusMeters }
app.post("/api/competitors", async (req, res) => {
  const { lat, lng, businessType, radiusMeters } = req.body;

  if (!lat || !lng || !businessType) {
    return res.status(400).json({ error: "lat, lng, and businessType are required" });
  }

  const radius = radiusMeters || 2000;

  try {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(businessType)}&key=${GOOGLE_API_KEY}`;

    const response = await fetch(url);
    const data = await response.json();

    const competitors = (data.results || []).map((p) => ({
      placeId: p.place_id,
      name: p.name,
      address: p.vicinity,
      lat: p.geometry?.location?.lat,
      lng: p.geometry?.location?.lng,
      rating: p.rating || 0,
      totalReviews: p.user_ratings_total || 0,
      types: p.types || [],
      priceLevel: p.price_level,
      isOpen: p.opening_hours?.open_now,
    }));

    res.json({
      competitors,
      total: competitors.length,
      center: { lat, lng },
      radiusMeters: radius,
      businessType,
    });
  } catch (err) {
    console.error("Competitors error:", err.message);
    res.status(500).json({ error: "Failed to find competitors" });
  }
});

// ─── OpenStreetMap Overpass: Proximity Signals ───────────────
// Counts nearby points of interest (schools, transit, hospitals, etc.)
// 100% free, no API key needed.


// ─── Overpass: ONE call for the entire search area ───────────
const areaProximityCache = new Map();

async function getAreaProximity(centerLat, centerLng, radiusMeters) {
  const key = `${centerLat.toFixed(2)},${centerLng.toFixed(2)},${radiusMeters}`;
  if (areaProximityCache.has(key)) return areaProximityCache.get(key);

  console.log("  🗺️  Fetching proximity data via Google Places...");

  const types = [
    { search: "school", type: "school" },
    { search: "university", type: "university" },
    { search: "bus stop transit station", type: "transit" },
    { search: "hospital", type: "hospital" },
    { search: "park", type: "park" },
    { search: "stadium arena", type: "stadium" },
  ];

  const pois = [];

  for (const t of types) {
    try {
      const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${centerLat},${centerLng}&radius=${radiusMeters}&keyword=${encodeURIComponent(t.search)}&key=${GOOGLE_API_KEY}`;
      const res = await fetch(url);
      const data = await res.json();

      for (const place of (data.results || [])) {
        pois.push({
          lat: place.geometry?.location?.lat,
          lng: place.geometry?.location?.lng,
          type: t.type,
          name: place.name,
        });
      }
    } catch (err) {
      console.warn(`  ⚠️  Error fetching ${t.type}:`, err.message);
    }
  }

  console.log(`  ✅ Found ${pois.length} nearby places (${types.map(t => `${pois.filter(p => p.type === t.type).length} ${t.type}`).join(", ")})`);

  areaProximityCache.set(key, pois);
  return pois;
}

// Count POIs within a radius of a specific candidate point
function countNearbyPOIs(pois, lat, lng, radiusKm) {
  const counts = { schools: 0, colleges: 0, transitStops: 0, hospitals: 0, parks: 0, stadiums: 0, shops: 0, restaurants: 0 };

  if (!pois) return { ...counts, estimatedFootTraffic: 2000 };

  for (const poi of pois) {
    const dist = haversine(lat, lng, poi.lat, poi.lng);
    if (dist > radiusKm) continue;

    if (poi.type === "school") counts.schools++;
    else if (poi.type === "university") counts.colleges++;
    else if (poi.type === "transit") counts.transitStops++;
    else if (poi.type === "hospital") counts.hospitals++;
    else if (poi.type === "park") counts.parks++;
    else if (poi.type === "stadium") counts.stadiums++;
  }

  counts.estimatedFootTraffic = counts.transitStops * 500 + counts.schools * 300 + counts.colleges * 800 + counts.hospitals * 400 + counts.parks * 200 + counts.stadiums * 2000;

  return counts;
}

// Distance between two lat/lng points in km
function haversine(lat1, lng1, lat2, lng2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// ─── Census API: Get real income & population data ───────────
async function getCensusData(lat, lng) {
  try {
    // Step 1: Convert lat/lng to Census tract using the geocoder
    const geoUrl = `https://geocoding.geo.census.gov/geocoder/geographies/coordinates?x=${lng}&y=${lat}&benchmark=Public_AR_Current&vintage=Current_Current&format=json`;
    
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();

    const tract = geoData?.result?.geographies?.["Census Tracts"]?.[0];
    if (!tract) {
      console.warn("No census tract found for", lat, lng);
      return null;
    }

    const state = tract.STATE;
    const county = tract.COUNTY;
    const tractCode = tract.TRACT;

    console.log(`  📊 Census tract: State ${state}, County ${county}, Tract ${tractCode}`);

    // Step 2: Fetch real data from American Community Survey (ACS)
    // B19013_001E = Median household income
    // B01003_001E = Total population
    // B01002_001E = Median age
    // B25064_001E = Median gross rent
    const keyParam = CENSUS_API_KEY ? `&key=${CENSUS_API_KEY}` : "";
    const acsUrl = `https://api.census.gov/data/2022/acs/acs5?get=B19013_001E,B01003_001E,B01002_001E,B25064_001E&for=tract:${tractCode}&in=state:${state}%20county:${county}${keyParam}`;

    const acsRes = await fetch(acsUrl);
    const acsData = await acsRes.json();

    // acsData[0] is headers, acsData[1] is values
    if (!acsData || acsData.length < 2) {
      console.warn("No ACS data returned");
      return null;
    }

    const row = acsData[1];
    const result = {
      medianIncome: parseInt(row[0]) > 0 ? parseInt(row[0]) : null,
      population: parseInt(row[1]) > 0 ? parseInt(row[1]) : null,
      medianAge: parseFloat(row[2]) > 0 ? parseFloat(row[2]) : null,
      medianRent: parseInt(row[3]) > 0 ? parseInt(row[3]) : null,
      state,
      county,
      tract: tractCode,
    };

    console.log(`  💰 Income: $${result.medianIncome || 'N/A'}, Pop: ${result.population || 'N/A'}, Rent: $${result.medianRent || 'N/A'}`);
    return result;

  } catch (err) {
    console.error("Census API error:", err.message);
    return null;
  }
}

// ─── Simple cache to avoid repeat Census calls ───────────────
const censusCache = new Map();

async function getCensusDataCached(lat, lng) {
  // Round to 2 decimal places for cache key (same neighborhood)
  const key = `${lat.toFixed(2)},${lng.toFixed(2)}`;
  
  if (censusCache.has(key)) {
    return censusCache.get(key);
  }

  const data = await getCensusData(lat, lng);
  if (data) {
    censusCache.set(key, data);
  }
  return data;
}

// ─── Scoring Weights ─────────────────────────────────────────
const WEIGHTS = {
  restaurant:  { footTraffic: 0.30, income: 0.20, competition: 0.20, rent: 0.15, population: 0.10, safety: 0.05 },
  retail:      { footTraffic: 0.25, income: 0.25, competition: 0.15, rent: 0.15, population: 0.10, safety: 0.10 },
  salon:       { footTraffic: 0.20, income: 0.25, competition: 0.25, rent: 0.15, population: 0.10, safety: 0.05 },
  cafe:        { footTraffic: 0.35, income: 0.15, competition: 0.20, rent: 0.15, population: 0.10, safety: 0.05 },
  gym:         { footTraffic: 0.15, income: 0.20, competition: 0.25, rent: 0.15, population: 0.20, safety: 0.05 },
  pharmacy:    { footTraffic: 0.15, income: 0.15, competition: 0.20, rent: 0.10, population: 0.25, safety: 0.15 },
  default:     { footTraffic: 0.20, income: 0.20, competition: 0.20, rent: 0.15, population: 0.15, safety: 0.10 },
};

// ─── Analyze Location ────────────────────────────────────────
app.post("/api/analyze", async (req, res) => {
  const { businessType, lat, lng, radiusKm } = req.body;

  if (!businessType || !lat || !lng) {
    return res.status(400).json({ error: "Missing businessType, lat, or lng" });
  }

  // Pick weights — try exact match, then check if type contains a known key
  let weights = WEIGHTS.default;
  for (const [key, w] of Object.entries(WEIGHTS)) {
    if (businessType.toLowerCase().includes(key)) {
      weights = w;
      break;
    }
  }

  // Step 1: Find real competitors from Google Places
  let competitorCount = 0;
  try {
    const radius = (radiusKm || 2) * 1000;
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius}&keyword=${encodeURIComponent(businessType)}&key=${GOOGLE_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    competitorCount = (data.results || []).length;
  } catch (err) {
    console.warn("Could not fetch competitors:", err.message);
  }

  // Step 2: Generate candidate locations in a grid
 const candidates = await generateCandidates(lat, lng, radiusKm || 2, competitorCount);

  // Step 3: Score each candidate
  const scored = scoreCandidates(candidates, weights);

  res.json({
    businessType,
    center: { lat, lng },
    radiusKm: radiusKm || 2,
    competitorsFound: competitorCount,
    results: scored.slice(0, 5),
  });
});

// ─── Generate candidates with REAL Census data ──────────────
async function generateCandidates(lat, lng, radiusKm, realCompetitorCount) {
  const offset = radiusKm / 111;
  const names = [
    "Downtown Core", "Market District", "University Area",
    "Suburban Center", "Transit Hub", "Business Park",
    "Waterfront", "Historic Quarter", "Tech Corridor",
    "Shopping Boulevard", "Residential Gateway", "Arts District",
    "Medical Row", "Financial District", "Civic Center", "Midtown",
  ];

  console.log("\n📍 Generating candidates with real data...");

  // Step 1: ONE Overpass call for the whole area
  const pois = await getAreaProximity(lat, lng, radiusKm * 1000);

  // Step 2: Generate grid points and fetch Census in parallel
  const points = [];
  for (let i = 0; i < 16; i++) {
    const angle = (i / 16) * 2 * Math.PI;
    const distance = 0.3 + Math.random() * 0.7;
    points.push({
      lat: Math.round((lat + Math.sin(angle) * offset * distance) * 10000) / 10000,
      lng: Math.round((lng + Math.cos(angle) * offset * distance) * 10000) / 10000,
    });
  }

  console.log("  📊 Fetching Census data...");
  const censusResults = await Promise.all(
    points.map(p => getCensusDataCached(p.lat, p.lng))
  );

  // Step 3: Count POIs per candidate (instant — just math, no API calls)
  const candidates = points.map((p, i) => {
    const census = censusResults[i];
    const nearby = countNearbyPOIs(pois, p.lat, p.lng, 1);

    return {
      id: `loc-${i + 1}`,
      name: names[i],
      ...p,
      income: census?.medianIncome || Math.floor(Math.random() * 80000) + 30000,
      population: census?.population || Math.floor(Math.random() * 15000) + 1000,
      rent: census?.medianRent || Math.floor(Math.random() * 2000) + 500,
      medianAge: census?.medianAge || 35,
      footTraffic: nearby.estimatedFootTraffic,
      competition: Math.max(0, realCompetitorCount + Math.floor(Math.random() * 6) - 3),
      safety: Math.floor(Math.random() * 80) + 10,
      nearby,
      hasRealData: !!census?.medianIncome,
      hasProximityData: nearby.transitStops > 0 || nearby.schools > 0 || nearby.shops > 0,
    };
  });

  const realCount = candidates.filter(c => c.hasRealData).length;
  const proxCount = candidates.filter(c => c.hasProximityData).length;
  console.log(`✅ ${realCount}/16 Census, ${proxCount}/16 proximity\n`);

  return candidates;
}

// ─── Score and rank candidates ───────────────────────────────
function scoreCandidates(candidates, weights) {
  const signals = ["footTraffic", "income", "competition", "rent", "population", "safety"];
  const bounds = {};

  for (const signal of signals) {
    const values = candidates.map((c) => c[signal]);
    bounds[signal] = { min: Math.min(...values), max: Math.max(...values) };
  }

  const scored = candidates.map((c) => {
    const normalized = {};
    let totalScore = 0;

    for (const signal of ["footTraffic", "income", "population"]) {
      const { min, max } = bounds[signal];
      normalized[signal] = max === min ? 50 : ((c[signal] - min) / (max - min)) * 100;
    }

    for (const signal of ["competition", "rent", "safety"]) {
      const { min, max } = bounds[signal];
      normalized[signal] = max === min ? 50 : (1 - (c[signal] - min) / (max - min)) * 100;
    }

    for (const [signal] of Object.entries(weights)) {
      totalScore += (normalized[signal] || 0) * (weights[signal] || 0);
    }

    totalScore = Math.round(totalScore * 10) / 10;

    let label, color;
    if (totalScore >= 75) { label = "Excellent"; color = "#10b981"; }
    else if (totalScore >= 55) { label = "Good"; color = "#6c5ce7"; }
    else if (totalScore >= 35) { label = "Fair"; color = "#f59e0b"; }
    else { label = "Poor"; color = "#ef4444"; }

    return {
      ...c,
      score: totalScore,
      label,
      color,
      breakdown: {
        footTraffic: Math.round(normalized.footTraffic),
        income: Math.round(normalized.income),
        competition: Math.round(normalized.competition),
        rent: Math.round(normalized.rent),
        population: Math.round(normalized.population),
        safety: Math.round(normalized.safety),
      },
    };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored;
}

// ─── Start the server ────────────────────────────────────────
app.listen(PORT, () => {
  console.log("");
  console.log("  ✅ BizSpot AI backend is running!");
  console.log(`  🌐 http://localhost:${PORT}`);
  console.log(`  📋 Health: http://localhost:${PORT}/health`);
  console.log(`  🔑 Google API: ${GOOGLE_API_KEY ? "configured" : "⚠️  MISSING — add to .env"}`);
  console.log("");
});