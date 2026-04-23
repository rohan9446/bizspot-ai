import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";

const API = "http://localhost:8001";
const mapStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 32.7157, lng: -117.1611 };

const darkMap = [
  { elementType: "geometry", stylers: [{ color: "#131720" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7fa3" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0d1017" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#0a0e18" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#1e2a40" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#151d2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#283550" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1a2236" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#0f1a20" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1a1f2e" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2a3550" }] },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [pinLocation, setPinLocation] = useState(null);
  const [results, setResults] = useState(null);
  const [resultMarkers, setResultMarkers] = useState([]);
  const [competitors, setCompetitors] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [radiusKm, setRadiusKm] = useState(2);
  const timerRef = useRef(null);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY,
  });

  const onMapLoad = useCallback((map) => { mapRef.current = map; }, []);

  const onMapClick = useCallback((e) => {
    setPinLocation({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setResults(null);
    setCompetitors(null);
    setResultMarkers([]);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setSuggestions([]); setShowDropdown(false); return; }
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API}/api/business-types?q=${encodeURIComponent(query)}`);
        const data = await res.json();
        setSuggestions(data.results || []);
        setShowDropdown(true);
      } catch (err) { console.error(err); }
    }, 100);
    return () => clearTimeout(timerRef.current);
  }, [query]);

  const handleSelect = (type) => {
    setSelectedType(type);
    setQuery("");
    setShowDropdown(false);
    setResults(null);
    setCompetitors(null);
    setResultMarkers([]);
  };

  const handleAnalyze = async () => {
    if (!selectedType || !pinLocation) return;
    setIsLoading(true);
    setResults(null);
    setCompetitors(null);
    setResultMarkers([]);
    try {
      const [aRes, cRes] = await Promise.all([
        fetch(`${API}/api/analyze`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessType: selectedType.label, lat: pinLocation.lat, lng: pinLocation.lng, radiusKm }),
        }),
        fetch(`${API}/api/competitors`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ businessType: selectedType.label, lat: pinLocation.lat, lng: pinLocation.lng, radiusMeters: radiusKm * 1000 }),
        }),
      ]);
      const analysis = await aRes.json();
      const comps = await cRes.json();
      setResults(analysis.results);
      setCompetitors(comps);
      if (analysis.results) setResultMarkers(analysis.results.slice(0, 5));
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  const canAnalyze = selectedType && pinLocation && !isLoading;
  const btnText = isLoading ? "Analyzing..." : !selectedType ? "Pick a business type" : !pinLocation ? "Click the map first" : "Find Best Locations";

  return (
    <div className="app">
      {/* HEADER */}
      <header className="header">
        <div className="logo">
          <div className="logo-icon">📍</div>
          <h1>BizSpot <span>AI</span></h1>
        </div>
        <div className="header-right">
          <span className="header-badge">Live Data</span>
          <span className="header-link">Phase 2</span>
        </div>
      </header>

      {/* MAP */}
      <div className="map-area">
        {pinLocation && (
          <div className="map-overlay">
            📍 Selected location
            <div className="coord">{pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}</div>
          </div>
        )}
        {isLoaded ? (
          <GoogleMap
            mapContainerStyle={mapStyle}
            center={pinLocation || defaultCenter}
            zoom={13}
            options={{ disableDefaultUI: true, zoomControl: true, styles: darkMap }}
            onClick={onMapClick}
            onLoad={onMapLoad}
          >
            {pinLocation && (
              <>
                <Marker position={pinLocation} icon={{
                  url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="%237c6cf0" stroke="white" stroke-width="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'),
                  scaledSize: { width: 36, height: 36 },
                }} />
                <Circle center={pinLocation} radius={radiusKm * 1000} options={{
                  fillColor: "#7c6cf0", fillOpacity: 0.06, strokeColor: "#7c6cf0", strokeOpacity: 0.25, strokeWeight: 1.5,
                }} />
              </>
            )}
            {resultMarkers.map((loc, i) => (
              <Marker key={loc.id} position={{ lat: loc.lat, lng: loc.lng }}
                label={{ text: `${i + 1}`, color: "#fff", fontSize: "10px", fontWeight: "bold", fontFamily: "DM Sans" }}
                icon={{
                  url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28"><circle cx="14" cy="14" r="12" fill="${loc.color}" stroke="white" stroke-width="1.5"/></svg>`),
                  scaledSize: { width: 28, height: 28 }, anchor: { x: 14, y: 14 }, labelOrigin: { x: 14, y: 15 },
                }}
              />
            ))}
            {competitors?.competitors?.map((c, i) => (
              <Marker key={`c-${i}`} position={{ lat: c.lat, lng: c.lng }} title={`${c.name} ⭐${c.rating}`}
                icon={{
                  url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8"><circle cx="4" cy="4" r="3.5" fill="%23f87171" stroke="white" stroke-width="0.5"/></svg>'),
                  scaledSize: { width: 8, height: 8 }, anchor: { x: 4, y: 4 },
                }}
              />
            ))}
          </GoogleMap>
        ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", color: "var(--text-muted)" }}>Loading map...</div>}
      </div>

      {/* SIDEBAR */}
      <aside className="sidebar">
        {/* Step 1: Business Type */}
        <div>
          <div className="step-label"><span className="step-number">1</span><span className="step-text">Business type</span></div>
          {selectedType ? (
            <div className="selected-pill">
              <span className="pill-icon">{selectedType.icon}</span>
              <div className="pill-info">
                <div className="pill-label">Selected</div>
                <div className="pill-name">{selectedType.label}</div>
                <div className="pill-category">{selectedType.category}</div>
              </div>
              <button className="pill-close" onClick={() => { setSelectedType(null); setResults(null); setCompetitors(null); setResultMarkers([]); }}>✕</button>
            </div>
          ) : (
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input type="text" placeholder="Search... restaurant, salon, gym" value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
                onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
              />
              {showDropdown && suggestions.length > 0 && (
                <div className="dropdown">
                  {suggestions.map((s, i) => (
                    <div key={i} className="dropdown-item" onMouseDown={() => handleSelect(s)}>
                      <div className="name">{s.icon} {s.label}</div>
                      <div className="address">{s.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Step 2: Location */}
        <div>
          <div className="step-label"><span className="step-number">2</span><span className="step-text">Location</span></div>
          <div className="location-info">
            <div className={`location-dot ${pinLocation ? "" : "empty"}`}></div>
            <div className="location-text">
              {pinLocation ? (<span className="coords">{pinLocation.lat.toFixed(4)}, {pinLocation.lng.toFixed(4)}</span>) : "Click anywhere on the map"}
            </div>
          </div>
        </div>

        {/* Step 3: Radius */}
        <div>
          <div className="step-label"><span className="step-number">3</span><span className="step-text">Search radius</span></div>
          <div className="slider-row">
            <input type="range" min="0.5" max="5" step="0.5" value={radiusKm} onChange={(e) => setRadiusKm(Number(e.target.value))} />
            <span className="slider-value">{radiusKm} km</span>
          </div>
        </div>

        {/* Button */}
        <button className={`btn btn-primary`} onClick={handleAnalyze} disabled={!canAnalyze}>{btnText}</button>

        {isLoading && <div className="loading-bar"><div className="loading-bar-inner"></div></div>}

        <div className="divider"></div>

        {/* Competitors */}
        {competitors && competitors.total > 0 && (
          <div className="competitors-card">
            <div className="competitors-header">
              <div>
                <div className="step-text" style={{ marginBottom: 2 }}>Competitors nearby</div>
                <div className="competitors-label">via Google Places</div>
              </div>
              <div className="competitors-count">{competitors.total}</div>
            </div>
            {competitors.competitors.slice(0, 5).map((c, i) => (
              <div key={i} className="competitor-item">
                <span className="c-name">{c.name}</span>
                <span className="c-rating">⭐ {c.rating} ({c.totalReviews})</span>
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {results && (
          <div>
            <div className="step-label" style={{ marginBottom: 10 }}>
              <span className="step-number" style={{ background: "var(--green-bg)", color: "var(--green)" }}>✓</span>
              <span className="step-text">Recommended locations</span>
            </div>
            {results.map((loc, i) => (
              <div key={loc.id} className="result-card" onClick={() => { if (mapRef.current) { mapRef.current.panTo({ lat: loc.lat, lng: loc.lng }); mapRef.current.setZoom(15); } }}>
                <div className="result-header">
                  <span className={`rank ${i === 0 ? "rank-1" : i === 1 ? "rank-2" : i === 2 ? "rank-3" : "rank-other"}`}>{i + 1}</span>
                  <span className="result-name">{loc.name}</span>
                  <span className="score-badge" style={{ background: `${loc.color}18`, color: loc.color }}>{loc.score}</span>
                </div>
                <div className="metrics">
                  <div className="metric"><div className="metric-label">Income</div><div className="metric-value">${loc.income?.toLocaleString()}</div></div>
                  <div className="metric"><div className="metric-label">Population</div><div className="metric-value">{loc.population?.toLocaleString()}</div></div>
                  <div className="metric"><div className="metric-label">Rent</div><div className="metric-value">${loc.rent?.toLocaleString()}/mo</div></div>
                  <div className="metric"><div className="metric-label">Competitors</div><div className="metric-value">{loc.competition}</div></div>
                  <div className="metric"><div className="metric-label">Traffic Score</div><div className="metric-value">{loc.breakdown.footTraffic}/100</div></div>
                  <div className="metric"><div className="metric-label">Safety</div><div className="metric-value">{loc.breakdown.safety}/100</div></div>
                </div>
                {loc.nearby && (
                  <div className="metrics" style={{ marginTop: 4 }}>
                    <div className="metric"><div className="metric-label">🚇 Transit</div><div className="metric-value">{loc.nearby.transitStops}</div></div>
                    <div className="metric"><div className="metric-label">🎓 Schools</div><div className="metric-value">{loc.nearby.schools + loc.nearby.colleges}</div></div>
                    <div className="metric"><div className="metric-label">🏥 Hospitals</div><div className="metric-value">{loc.nearby.hospitals}</div></div>
                    <div className="metric"><div className="metric-label">🌳 Parks</div><div className="metric-value">{loc.nearby.parks}</div></div>
                    <div className="metric"><div className="metric-label">🏟️ Stadiums</div><div className="metric-value">{loc.nearby.stadiums}</div></div>
                    <div className="metric"><div className="metric-label">🛍️ Shops</div><div className="metric-value">{loc.nearby.shops}</div></div>
                  </div>
                )}
                <div style={{ marginTop: 8, display: "flex", gap: 6 }}>
                  {loc.hasRealData && <span className="real-data-badge">✓ Census data</span>}
                  {loc.hasProximityData && <span className="real-data-badge" style={{ background: "rgba(96,165,250,0.1)", color: "#60a5fa" }}>✓ Proximity data</span>}
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}