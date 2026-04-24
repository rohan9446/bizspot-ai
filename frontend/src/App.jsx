import React, { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, useJsApiLoader, Marker, Circle } from "@react-google-maps/api";

const API = "http://localhost:8001";
const mapStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 32.7157, lng: -117.1611 };

const darkMapStyle = [
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
];

const lightMapStyle = [
  { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#c9d6e3" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#dadce0" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#e8ebe4" }] },
  { featureType: "poi.park", elementType: "geometry.fill", stylers: [{ color: "#d4edda" }] },
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
  const [expandedArea, setExpandedArea] = useState(null);
  const [areaTab, setAreaTab] = useState("info");
  const [areaCompetitors, setAreaCompetitors] = useState(null);
  const [areaInsight, setAreaInsight] = useState(null);
  const [areaInsightLoading, setAreaInsightLoading] = useState(false);
  const [compareList, setCompareList] = useState([]);
  const timer = useRef(null);
  const mapRef = useRef(null);

  const { isLoaded } = useJsApiLoader({ googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_API_KEY });

  const onMapClick = useCallback((e) => {
    setPin({ lat: e.latLng.lat(), lng: e.latLng.lng() });
    resetResults();
  }, []);

  const [theme, setTheme] = useState(() => localStorage.getItem("bizspot-theme") || "dark");

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("bizspot-theme", theme);
  }, [theme]);

  const resetResults = () => {
    setResults(null); setComps(null); setMarkers([]); setExpandedArea(null);
    setAreaCompetitors(null); setAreaInsight(null); setCompareList([]);
  };

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

  const pick = (t) => { setSelectedType(t); setQuery(""); setShowDD(false); resetResults(); };

  const analyze = async () => {
    if (!selectedType || !pin) return;
    setLoading(true); resetResults();
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

  const expandArea = async (area) => {
    setExpandedArea(area);
    setAreaTab("info");
    setAreaCompetitors(null);
    setAreaInsight(null);

    if (mapRef.current) {
      mapRef.current.panTo({ lat: area.lat, lng: area.lng });
      mapRef.current.setZoom(15);
    }

    // Fetch area-specific competitors
    try {
      const r = await fetch(`${API}/api/area-competitors`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: selectedType.label, lat: area.lat, lng: area.lng }),
      });
      const d = await r.json();
      setAreaCompetitors(d.competitors || []);
    } catch (e) { console.warn(e); }
  };

  const fetchInsight = async () => {
    if (!expandedArea || areaInsight) return;
    setAreaInsightLoading(true);
    try {
      const r = await fetch(`${API}/api/insight`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ businessType: selectedType.label, area: expandedArea, competitors: areaCompetitors }),
      });
      const d = await r.json();
      setAreaInsight(d.insight);
    } catch (e) { console.warn(e); setAreaInsight("Could not generate insight."); }
    setAreaInsightLoading(false);
  };

  useEffect(() => {
    if (areaTab === "ai" && !areaInsight && !areaInsightLoading) fetchInsight();
  }, [areaTab]);

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
        <div className="logo"><div className="logo-mark">B</div><h1>BizSpot <span>AI</span></h1></div>
        <div className="header-pills">
          <span className="h-pill h-pill-green">Live Data</span>
          <span className="h-pill h-pill-cyan">AI Powered</span>
          <div className="theme-switch">
            <span style={{fontSize:11}}>Dark</span>
            <div className={`toggle-track ${theme === "light" ? "on" : ""}`} onClick={() => setTheme(t => t === "dark" ? "light" : "dark")}>
              <div className="toggle-knob"></div>
            </div>
            <span style={{fontSize:11}}>Light</span>
          </div>
        </div>
      </header>

      <div className="map-area">
        {pin && <div className="map-chip">Selected<div className="coords">{pin.lat.toFixed(4)}, {pin.lng.toFixed(4)}</div></div>}
        {isLoaded ? (
          <GoogleMap mapContainerStyle={mapStyle} center={pin || defaultCenter} zoom={13}
            options={{ disableDefaultUI: true, zoomControl: true, styles: theme === "dark" ? darkMapStyle : lightMapStyle }}
            onClick={onMapClick} onLoad={(m) => { mapRef.current = m; }}>
            {pin && (<>
              <Marker position={pin} icon={{ url: "data:image/svg+xml," + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="%234f8fff" stroke="white" stroke-width="1.5"><circle cx="12" cy="10" r="3"/><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>'), scaledSize: { width: 32, height: 32 } }} />
              <Circle center={pin} radius={radius * 1000} options={{ fillColor: "#4f8fff", fillOpacity: 0.05, strokeColor: "#4f8fff", strokeOpacity: 0.2, strokeWeight: 1 }} />
            </>)}
            {markers.map((l, i) => (
              <Marker key={l.id} position={{ lat: l.lat, lng: l.lng }}
                label={{ text: `${i+1}`, color: "#fff", fontSize: "13px", fontWeight: "bold", fontFamily: "Inter" }}
                icon={{ url: "data:image/svg+xml," + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="44" height="54" viewBox="0 0 44 54"><filter id="s"><feDropShadow dx="0" dy="2" stdDeviation="2" flood-opacity="0.5"/></filter><path d="M22 2C12.06 2 4 10.06 4 20c0 12.5 18 30 18 30s18-17.5 18-30C40 10.06 31.94 2 22 2z" fill="${l.color}" stroke="white" stroke-width="2.5" filter="url(#s)"/><circle cx="22" cy="20" r="12" fill="rgba(0,0,0,0.25)"/></svg>`), scaledSize: { width: 44, height: 54 }, anchor: { x: 22, y: 54 }, labelOrigin: { x: 22, y: 20 } }}
                onClick={() => expandArea(l)}
                zIndex={100 + (5 - i)} />
            ))}
          </GoogleMap>
        ) : <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>Loading map...</div>}
      </div>

      <aside className="sidebar">
        {/* SETUP SECTION */}
        {!expandedArea && (<>
          <div>
            <div className="step"><span className="step-num">1</span><span className="step-text">Business type</span></div>
            {selectedType ? (
              <div className="pill">
                <span className="pill-icon">{selectedType.icon}</span>
                <div className="pill-body"><div className="pill-tag">Selected</div><div className="pill-name">{selectedType.label}</div><div className="pill-sub">{selectedType.category}</div></div>
                <button className="pill-x" onClick={() => { setSelectedType(null); resetResults(); }}>✕</button>
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
          {compareList.length === 2 && <ComparePanel a={compareList[0]} b={compareList[1]} onClose={() => setCompareList([])} />}
          {compareList.length === 1 && <div style={{ fontSize: 11, color: "var(--accent)", textAlign: "center" }}>Select another area to compare</div>}

          <div className="divider"></div>

          {/* AREA LIST */}
          {results && (
            <div>
              <div className="step" style={{ marginBottom: 8 }}>
                <span className="step-num" style={{ background: "var(--green-bg)", color: "var(--green)" }}>✓</span>
                <span className="step-text">Recommended Areas ({results.length})</span>
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>Click an area for detailed report</div>
              {results.map((loc, i) => (
                <div key={loc.id} className={`res-card ${compareList.find(c => c.id === loc.id) ? "selected" : ""}`}
                  onClick={() => expandArea(loc)}>
                  <div className="res-top">
                    <span className={`rank ${i===0?"r1":i===1?"r2":i===2?"r3":"rx"}`}>{i+1}</span>
                    <span className="res-name">{loc.name}</span>
                    <span className="res-score" style={{ background: `${loc.color}15`, color: loc.color }}>{loc.score}<span style={{fontSize:9,opacity:0.6}}>/100</span></span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 6 }}>
                    <div className="nearby-row">
                      {loc.nearby?.transitStops > 0 && <span className="nb-chip">Transit: {loc.nearby.transitStops}</span>}
                      {(loc.nearby?.schools||0) + (loc.nearby?.colleges||0) > 0 && <span className="nb-chip">Schools: {(loc.nearby?.schools||0)+(loc.nearby?.colleges||0)}</span>}
                      {loc.nearby?.parks > 0 && <span className="nb-chip">Parks: {loc.nearby.parks}</span>}
                      {loc.nearby?.shops > 0 && <span className="nb-chip">Shops: {loc.nearby.shops}</span>}
                    </div>
                    <button className={`compare-btn ${compareList.find(c => c.id === loc.id) ? "active" : ""}`}
                      style={{ opacity: 1, position: "static" }}
                      onClick={(e) => { e.stopPropagation(); toggleCompare(loc); }}>
                      {compareList.find(c => c.id === loc.id) ? "✓" : "⇄"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>)}

        {/* EXPANDED AREA DETAIL VIEW */}
        {expandedArea && (
          <div>
            {/* Back button */}
            <button onClick={() => { setExpandedArea(null); setAreaCompetitors(null); setAreaInsight(null); setAreaTab("info"); }}
              style={{ background: "none", border: "none", color: "var(--accent)", fontSize: 12, fontWeight: 600, cursor: "pointer", padding: "4px 0", marginBottom: 8, fontFamily: "var(--font)" }}>
              ← Back to all areas
            </button>

            {/* Area header */}
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <span className="res-score" style={{ background: `${expandedArea.color}15`, color: expandedArea.color, fontSize: 18, padding: "6px 12px" }}>
                {expandedArea.score}
              </span>
              <div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>{expandedArea.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--mono)" }}>
                  {expandedArea.lat.toFixed(4)}, {expandedArea.lng.toFixed(4)}
                </div>
              </div>
              <span style={{ marginLeft: "auto", fontSize: 12, fontWeight: 600, color: expandedArea.color }}>{expandedArea.label}</span>
            </div>

            {/* Tabs */}
            <div style={{ display: "flex", gap: 4, marginBottom: 12 }}>
              {["info", "competitors", "ai"].map(tab => (
                <button key={tab} onClick={() => setAreaTab(tab)}
                  style={{
                    flex: 1, padding: "8px 0", border: "1px solid",
                    borderColor: areaTab === tab ? "var(--accent)" : "var(--border-md)",
                    background: areaTab === tab ? "var(--accent-glow)" : "var(--bg-2)",
                    color: areaTab === tab ? "var(--accent)" : "var(--text-dim)",
                    borderRadius: "var(--radius-xs)", fontSize: 11, fontWeight: 600,
                    cursor: "pointer", fontFamily: "var(--font)", textTransform: "uppercase", letterSpacing: "0.04em",
                  }}>
                  {tab === "info" ? "📊 Info" : tab === "competitors" ? "🏪 Competitors" : "🤖 AI Insights"}
                </button>
              ))}
            </div>

            {/* TAB: Info */}
            {areaTab === "info" && (
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8 }}>Demographics</div>
                <div className="metrics">
                  <div className="met"><div className="met-label">Income</div><div className="met-val">${expandedArea.income?.toLocaleString() || "N/A"}</div></div>
                  <div className="met"><div className="met-label">Population</div><div className="met-val">{expandedArea.population?.toLocaleString() || "N/A"}</div></div>
                  <div className="met"><div className="met-label">Rent</div><div className="met-val">${expandedArea.rent?.toLocaleString() || "N/A"}/mo</div></div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 14, marginBottom: 8 }}>Scoring breakdown</div>
                <div className="metrics">
                  <div className="met"><div className="met-label">Foot Traffic</div><div className="met-val">{expandedArea.breakdown?.footTraffic}/100</div></div>
                  <div className="met"><div className="met-label">Income Score</div><div className="met-val">{expandedArea.breakdown?.income}/100</div></div>
                  <div className="met"><div className="met-label">Competition</div><div className="met-val">{expandedArea.breakdown?.competition}/100</div></div>
                  <div className="met"><div className="met-label">Rent Score</div><div className="met-val">{expandedArea.breakdown?.rent}/100</div></div>
                  <div className="met"><div className="met-label">Population</div><div className="met-val">{expandedArea.breakdown?.population}/100</div></div>
                  <div className="met"><div className="met-label">Safety</div><div className="met-val">{expandedArea.breakdown?.safety}/100</div></div>
                </div>

                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginTop: 14, marginBottom: 8 }}>Nearby places</div>
                <div className="metrics" style={{ gridTemplateColumns: "1fr 1fr" }}>
                  <div className="met"><div className="met-label">🚇 Transit Stops</div><div className="met-val">{expandedArea.nearby?.transitStops || 0}</div></div>
                  <div className="met"><div className="met-label">🎓 Schools & Colleges</div><div className="met-val">{(expandedArea.nearby?.schools||0) + (expandedArea.nearby?.colleges||0)}</div></div>
                  <div className="met"><div className="met-label">🏥 Hospitals</div><div className="met-val">{expandedArea.nearby?.hospitals || 0}</div></div>
                  <div className="met"><div className="met-label">🌳 Parks</div><div className="met-val">{expandedArea.nearby?.parks || 0}</div></div>
                  <div className="met"><div className="met-label">🏟️ Stadiums</div><div className="met-val">{expandedArea.nearby?.stadiums || 0}</div></div>
                  <div className="met"><div className="met-label">🛍️ Shops</div><div className="met-val">{expandedArea.nearby?.shops || 0}</div></div>
                </div>

                <div className="badge-row" style={{ marginTop: 10 }}>
                  {expandedArea.hasRealData && <span className="data-badge badge-census">✓ Census data</span>}
                  {expandedArea.hasProximityData && <span className="data-badge badge-prox">✓ Proximity data</span>}
                </div>
              </div>
            )}

            {/* TAB: Competitors */}
            {areaTab === "competitors" && (
              <div>
                {!areaCompetitors ? (
                  <div><div className="load-bar"><div className="load-inner"></div></div><div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 6 }}>Loading competitors...</div></div>
                ) : areaCompetitors.length === 0 ? (
                  <div style={{ fontSize: 12, color: "var(--text-dim)", padding: 20, textAlign: "center" }}>No direct competitors found within 1km — this could be an opportunity!</div>
                ) : (
                  <div>
                    <div style={{ fontSize: 12, color: "var(--text-dim)", marginBottom: 10 }}>{areaCompetitors.length} competitors within 1km</div>
                    {areaCompetitors.map((c, i) => (
                      <div key={i} style={{ background: "var(--bg-0)", border: "1px solid var(--border-md)", borderRadius: "var(--radius-sm)", padding: 10, marginBottom: 6 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ fontSize: 13, fontWeight: 500 }}>{c.name}</div>
                          <div style={{ fontSize: 11, color: "var(--amber)", fontFamily: "var(--mono)" }}>⭐ {c.rating}</div>
                        </div>
                        <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{c.address}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 4, fontSize: 10, color: "var(--text-dim)" }}>
                          <span>{c.totalReviews} reviews</span>
                          {c.priceLevel && <span>{"$".repeat(c.priceLevel)} price</span>}
                          {c.isOpen !== undefined && <span style={{ color: c.isOpen ? "var(--green)" : "var(--red)" }}>{c.isOpen ? "Open now" : "Closed"}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* TAB: AI Insights */}
            {areaTab === "ai" && (
              <div style={{ background: "linear-gradient(135deg, rgba(79,143,255,0.05), rgba(6,182,212,0.03))", border: "1px solid rgba(79,143,255,0.12)", borderRadius: "var(--radius)", padding: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "var(--accent)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 10, display: "flex", alignItems: "center", gap: 6 }}>
                  🤖 AI Analysis
                  <span style={{ fontSize: 9, fontWeight: 400, color: "var(--text-muted)", textTransform: "none" }}>Llama 3.1 via Groq</span>
                </div>
                {areaInsightLoading ? (
                  <div><div className="load-bar"><div className="load-inner"></div></div><div style={{ fontSize: 12, color: "var(--text-dim)", marginTop: 8 }}>Analyzing {expandedArea.name}...</div></div>
                ) : areaInsight ? (
                  <div style={{ fontSize: 12, lineHeight: 1.8, color: "var(--text-dim)" }}>
                    {areaInsight.split("**").map((part, i) =>
                      i % 2 === 1
                        ? <strong key={i} style={{ color: "var(--text)", fontWeight: 600, display: "block", marginTop: i > 1 ? 10 : 0 }}>{part}</strong>
                        : <span key={i}>{part}</span>
                    )}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: "var(--text-dim)" }}>No insight available.</div>
                )}
              </div>
            )}
          </div>
        )}
      </aside>
    </div>
  );
}

function ComparePanel({ a, b, onClose }) {
  const rows = [
    { label: "Score", av: a.score, bv: b.score, higher: true },
    { label: "Income", av: a.income, bv: b.income, higher: true, fmt: v => v ? `$${v.toLocaleString()}` : "N/A" },
    { label: "Population", av: a.population, bv: b.population, higher: true, fmt: v => v ? v.toLocaleString() : "N/A" },
    { label: "Rent", av: a.rent, bv: b.rent, higher: false, fmt: v => v ? `$${v.toLocaleString()}` : "N/A" },
    { label: "Competitors", av: a.competition, bv: b.competition, higher: false },
    { label: "Transit", av: a.nearby?.transitStops||0, bv: b.nearby?.transitStops||0, higher: true },
    { label: "Schools", av: (a.nearby?.schools||0)+(a.nearby?.colleges||0), bv: (b.nearby?.schools||0)+(b.nearby?.colleges||0), higher: true },
  ];
  return (
    <div className="compare-panel">
      <div className="compare-title">📊 Compare</div>
      <div className="compare-grid">
        <div className="cg-header">Metric</div><div className="cg-header" style={{textAlign:"center"}}>{a.name}</div><div className="cg-header" style={{textAlign:"center"}}>{b.name}</div>
        {rows.map((r,i) => {
          const av=r.av||0,bv=r.bv||0,aW=r.higher?av>bv:av<bv,bW=r.higher?bv>av:bv<av,f=r.fmt||(v=>v);
          return (<React.Fragment key={i}><div className="cg-label">{r.label}</div><div className={`cg-val ${aW?"winner":bW?"loser":""}`}>{f(r.av)}</div><div className={`cg-val ${bW?"winner":aW?"loser":""}`}>{f(r.bv)}</div></React.Fragment>);
        })}
      </div>
      <button className="compare-close" onClick={onClose}>Close</button>
    </div>
  );
}