import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";

const API = "http://localhost:8001";
const mapStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 32.7157, lng: -117.1611 };

const darkMap = [
  { elementType: "geometry", stylers: [{ color: "#0d1117" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#5a6a85" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0a0d13" }] },
  { featureType: "water", elementType: "geometry.fill", stylers: [{ color: "#060910" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#182035" }] },
  { featureType: "road", elementType: "geometry.stroke", stylers: [{ color: "#111827" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#1e2d4a" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#141c2a" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#0b1218" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#141a26" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#1e2d4a" }] },
];

export default function App() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [selectedType, setSelectedType] = useState(null);
  const [pin, setPin] = useState(null);
  const [results, setResults] = useState(null);
  const [markers, setMarkers] = useState([]);
  const [comps, setComps] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDD, setShowDD] = useState(false);
  const [radius, setRadius] = useState(2);
  const [compareList, setCompareList] = useState([]);
  const timer = useRef(null);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });

  const onMapClick = useCallback((e) => {
    setPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    setResults(null); setComps(null); setMarkers([]); setCompareList([]);
  }, []);

  useEffect(() => {
    if (query.length < 1) { setSuggestions([]); setShowDD(false); return; }
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try {
        const r = await fetch(`${API}/api/business-types?q=${encodeURIComponent(query)}`);
        const d = await r.json();
        setSuggestions(d.results || []); setShowDD(true);
      } catch (e) { console.error(e); }
    }, 100);
    return () => clearTimeout(timer.current);
  }, [query]);

  const pick = (t) => { setSelectedType(t); setQuery(""); setShowDD(false); setResults(null); setComps(null); setMarkers([]); setCompareList([]); };

  const analyze = async () => {
    if (!selectedType || !pin) return;
    setLoading(true); setResults(null); setComps(null); setMarkers([]); setCompareList([]);
    try {
      const [aR, cR] = await Promise.all([
        fetch(`${API}/api/analyze`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessType: selectedType.label, lat: pin.lat, lng: pin.lng, radiusKm: radius }) }),
        fetch(`${API}/api/competitors`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ businessType: selectedType.label, lat: pin.lat, lng: pin.lng, radiusMeters: radius * 1000 }) }),
      ]);
      const a = await aR.json(); const c = await cR.json();
      setResults(a.results); setComps(c);
      if (a.results) setMarkers(a.results.slice(0, 5));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  };

  const toggleCompare = (loc) => {
    setCompareList(prev => {
      const exists = prev.find(l => l.id === loc.id);
      if (exists) return prev.filter(l => l.id !== loc.id);
      if (prev.length >= 2) return [prev[1], loc];
      return [...prev, loc];
    });
  };

  const can = selectedType && pin && !loading;

  return (
    <div className="app">
      <header className="header">
        <div className="logo">
          <div className="logo-mark">📍</div>
          <h1>BizSpot <span>AI</span></h1>
        </div>
        <div className="header-pills">
          <span className="h-pill h-pill-green">Live Data</span>
          <span className="h-pill h-pill-cyan">Phase 2</span>
        </div>
      </header>

      <div className="map-area">
        {pin && <div className="map-chip">📍 Selected<div className="coords">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</div></div>}
        {isLoaded ? (
          <GoogleMap mapContainerStyle={mapStyle} center={pin || defaultCenter} zoom={13}
            options={{ disableDefaultUI: true, zoomControl: true, styles: darkMap }}
            onClick={onMapClick} onLoad={(m) => { mapRef.current = m; }}>
            {pin && (<>
              <Marker position={pin} icon={{ url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%234f8fff" stroke="white" stroke-width="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'), scaledSize: { width: 32, height: 32 } }} />
              <Circle center={pin} radius={radius * 1000} options={{ fillColor: "#4f8fff", fillOpacity: 0.05, strokeColor: "#4f8fff", strokeOpacity: 0.2, strokeWeight: 1 }} />
            </>)}
            {markers.map((l, i) => (
              <Marker key={l.id} position={{ lat: l.lat, lng: l.lng }}
                label={{ text: `${i+1}`, color: "#fff", fontSize: "9px", fontWeight: "bold" }}
                icon={{ url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24"><circle cx="12" cy="12" r="11" fill="${l.color}" stroke="white" stroke-width="1.5"/></svg>`), scaledSize: { width: 24, height: 24 }, anchor: { x: 12, y: 12 }, labelOrigin: { x: 12, y: 13 } }} />
            ))}
            {comps?.competitors?.map((c, i) => (
              <Marker key={`c${i}`} position={{ lat: c.lat, lng: c.lng }} title={`${c.name} ⭐${c.rating}`}
                icon={{ url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="7" height="7"><circle cx="3.5" cy="3.5" r="3" fill="%23ef4444" stroke="white" stroke-width="0.5"/></svg>'), scaledSize: { width: 7, height: 7 }, anchor: { x: 3.5, y: 3.5 } }} />
            ))}
          </GoogleMap>
        ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>Loading map...</div>}
      </div>

      <aside className="sidebar">
        <div>
          <div className="step"><span className="step-num">1</span><span className="step-text">Business type</span></div>
          {selectedType ? (
            <div className="pill">
              <span className="pill-icon">{selectedType.icon}</span>
              <div className="pill-body"><div className="pill-tag">Selected</div><div className="pill-name">{selectedType.label}</div><div className="pill-sub">{selectedType.category}</div></div>
              <button className="pill-x" onClick={() => { setSelectedType(null); setResults(null); setComps(null); setMarkers([]); setCompareList([]); }}>✕</button>
            </div>
          ) : (
            <div className="search-wrap">
              <span className="search-icon">🔍</span>
              <input placeholder="Search... restaurant, salon, gym" value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={() => suggestions.length > 0 && setShowDD(true)}
                onBlur={() => setTimeout(() => setShowDD(false), 200)} />
              {showDD && suggestions.length > 0 && (
                <div className="dropdown">
                  {suggestions.map((s, i) => (
                    <div key={i} className="dd-item" onMouseDown={() => pick(s)}>
                      <div className="dd-name">{s.icon} {s.label}</div>
                      <div className="dd-cat">{s.category}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <div>
          <div className="step"><span className="step-num">2</span><span className="step-text">Location</span></div>
          <div className="loc-row">
            <div className={`loc-dot ${pin ? "on" : "off"}`}></div>
            <div className="loc-text">{pin ? <span className="c">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</span> : "Click the map"}</div>
          </div>
        </div>

        <div>
          <div className="step"><span className="step-num">3</span><span className="step-text">Radius</span></div>
          <div className="slider-row">
            <input type="range" min="0.5" max="5" step="0.5" value={radius} onChange={e => setRadius(Number(e.target.value))} />
            <span className="slider-val">{radius} km</span>
          </div>
        </div>

        <button className="btn btn-primary" onClick={analyze} disabled={!can}>
          {loading ? "Analyzing..." : !selectedType ? "Pick a business type" : !pin ? "Click the map" : "Find Best Locations"}
        </button>

        {loading && <div className="load-bar"><div className="load-inner"></div></div>}

        {/* COMPARE PANEL */}
        {compareList.length === 2 && (
          <ComparePanel a={compareList[0]} b={compareList[1]} onClose={() => setCompareList([])} />
        )}
        {compareList.length === 1 && (
          <div style={{ fontSize: 11, color: "var(--accent)", textAlign: "center", padding: 4 }}>
            Click "Compare" on another location to compare side-by-side
          </div>
        )}

        <div className="divider"></div>

        {comps && comps.total > 0 && (
          <div className="comp-card">
            <div className="comp-top">
              <div><div className="step-text">Competitors</div><div style={{ fontSize: 10, color: "var(--text-muted)" }}>Google Places</div></div>
              <div className="comp-count">{comps.total}</div>
            </div>
            {comps.competitors.slice(0, 4).map((c, i) => (
              <div key={i} className="comp-item"><span className="cn">{c.name}</span><span className="cr">⭐{c.rating} ({c.totalReviews})</span></div>
            ))}
          </div>
        )}

        {results && (
          <div>
            <div className="step" style={{ marginBottom: 8 }}>
              <span className="step-num" style={{ background: "var(--green-bg)", color: "var(--green)" }}>✓</span>
              <span className="step-text">Results</span>
            </div>
            {results.map((loc, i) => (
              <div key={loc.id} className={`res-card ${compareList.find(c => c.id === loc.id) ? "selected" : ""}`}
                onClick={() => { if (mapRef.current) { mapRef.current.panTo({ lat: loc.lat, lng: loc.lng }); mapRef.current.setZoom(15); } }}>
                
                <div className="res-top">
                  <span className={`rank ${i===0?"r1":i===1?"r2":i===2?"r3":"rx"}`}>{i+1}</span>
                  <span className="res-name">{loc.name}</span>
                  <span className="res-score" style={{ background: `${loc.color}15`, color: loc.color }}>{loc.score}<span style={{fontSize:9,opacity:0.7}}>/100</span></span>
                </div>
                <div style={{fontSize:11,color:"var(--text-muted)",marginTop:2,marginLeft:32}}>{loc.lat.toFixed(4)}, {loc.lng.toFixed(4)}</div>
                <div className="metrics">
                  <div className="met"><div className="met-label">Income</div><div className="met-val">${loc.income?.toLocaleString() || "N/A"}</div></div>
                  <div className="met"><div className="met-label">Population</div><div className="met-val">{loc.population?.toLocaleString() || "N/A"}</div></div>
                  <div className="met"><div className="met-label">Rent</div><div className="met-val">${loc.rent?.toLocaleString() || "N/A"}/mo</div></div>
                  <div className="met"><div className="met-label">Competitors</div><div className="met-val">{loc.competition}</div></div>
                  <div className="met"><div className="met-label">Traffic</div><div className="met-val">{loc.breakdown.footTraffic}/100</div></div>
                  <div className="met"><div className="met-label">Safety</div><div className="met-val">{loc.breakdown.safety}/100</div></div>
                </div>
                {loc.nearby && (
                  <div className="nearby-row">
                    {loc.nearby.transitStops > 0 && <span className="nb-chip">🚇 {loc.nearby.transitStops}</span>}
                    {(loc.nearby.schools + loc.nearby.colleges) > 0 && <span className="nb-chip">🎓 {loc.nearby.schools + loc.nearby.colleges}</span>}
                    {loc.nearby.hospitals > 0 && <span className="nb-chip">🏥 {loc.nearby.hospitals}</span>}
                    {loc.nearby.parks > 0 && <span className="nb-chip">🌳 {loc.nearby.parks}</span>}
                    {loc.nearby.stadiums > 0 && <span className="nb-chip">🏟️ {loc.nearby.stadiums}</span>}
                    {loc.nearby.shops > 0 && <span className="nb-chip">🛍️ {loc.nearby.shops}</span>}
                  </div>
                )}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 8 }}>
                  <div className="badge-row">
                    {loc.hasRealData && <span className="data-badge badge-census">✓ Census</span>}
                    {loc.hasProximityData && <span className="data-badge badge-prox">✓ Proximity</span>}
                  </div>
                  <button
                    className={`compare-btn ${compareList.find(c => c.id === loc.id) ? "active" : ""}`}
                    style={{ opacity: 1, position: "static" }}
                    onClick={(e) => { e.stopPropagation(); toggleCompare(loc); }}>
                    {compareList.find(c => c.id === loc.id) ? "✓ Selected" : "⇄ Compare"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </aside>
    </div>
  );
}

// ─── COMPARE PANEL COMPONENT ──────────────────────────────────
function ComparePanel({ a, b, onClose }) {
  const rows = [
    { label: "Score", av: a.score, bv: b.score, higher: true },
    { label: "Income", av: a.income, bv: b.income, higher: true, fmt: v => v ? `$${v.toLocaleString()}` : "N/A" },
    { label: "Population", av: a.population, bv: b.population, higher: true, fmt: v => v ? v.toLocaleString() : "N/A" },
    { label: "Rent", av: a.rent, bv: b.rent, higher: false, fmt: v => v ? `$${v.toLocaleString()}` : "N/A" },
    { label: "Competitors", av: a.competition, bv: b.competition, higher: false },
    { label: "Transit", av: a.nearby?.transitStops || 0, bv: b.nearby?.transitStops || 0, higher: true },
    { label: "Schools", av: (a.nearby?.schools||0) + (a.nearby?.colleges||0), bv: (b.nearby?.schools||0) + (b.nearby?.colleges||0), higher: true },
    { label: "Parks", av: a.nearby?.parks || 0, bv: b.nearby?.parks || 0, higher: true },
    { label: "Foot Traffic", av: a.breakdown?.footTraffic || 0, bv: b.breakdown?.footTraffic || 0, higher: true },
    { label: "Safety", av: a.breakdown?.safety || 0, bv: b.breakdown?.safety || 0, higher: true },
  ];

  return (
    <div className="compare-panel">
      <div className="compare-title">📊 Side-by-side comparison</div>
      <div className="compare-grid">
        <div className="cg-header">Metric</div>
        <div className="cg-header" style={{ textAlign: "center" }}>{a.name}</div>
        <div className="cg-header" style={{ textAlign: "center" }}>{b.name}</div>
        {rows.map((r, i) => {
          const av = r.av || 0;
          const bv = r.bv || 0;
          const aWins = r.higher ? av > bv : av < bv;
          const bWins = r.higher ? bv > av : bv < av;
          const fmt = r.fmt || (v => v);
          return (
            <React.Fragment key={i}>
              <div className="cg-label">{r.label}</div>
              <div className={`cg-val ${aWins ? "winner" : bWins ? "loser" : ""}`}>{fmt(r.av)}</div>
              <div className={`cg-val ${bWins ? "winner" : aWins ? "loser" : ""}`}>{fmt(r.bv)}</div>
            </React.Fragment>
          );
        })}
      </div>
      <button className="compare-close" onClick={onClose}>Close comparison</button>
    </div>
  );
}