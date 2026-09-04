import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Crosshair,
  Layers,
  Shield,
  MapPin,
  Flame,
  ThumbsUp,
  Clock,
  ExternalLink,
  ChevronRight,
  AlertTriangle,
  X,
  Compass,
  Navigation,
  Sparkles,
  Eye,
  CheckCircle2,
  RefreshCw,
  Search,
  Lock,
  Bell,
  Check,
  Trash2,
  Lightbulb,
  Droplets,
  HelpCircle
} from 'lucide-react';
import { CIVIC_DATA } from '../../data/civicData';
import { api } from '../../api/client';

const BASEMAPS = [
  {
    id: 'streets',
    label: 'Daylight Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  {
    id: 'dark',
    label: 'Command Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 20
  },
  {
    id: 'satellite',
    label: 'Satellite Aerial',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: '&copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 18
  }
];

const HOTSPOTS = [
  { name: "St. Andrew's School", coords: [19.0558, 72.8290], type: "School Buffer Corridor", zoom: 17 },
  { name: "Lilavati Hospital", coords: [19.0514, 72.8296], type: "Hospital Ambulance Corridor", zoom: 17 },
  { name: "Hill Road Junction", coords: [19.0560, 72.8340], type: "High-Density Commercial", zoom: 17 },
  { name: "Linking Road Corner", coords: [19.0585, 72.8315], type: "Major Transit Artery", zoom: 17 },
  { name: "Bandra Fort Promenade", coords: [19.0416, 72.8188], type: "Coastal Ward Edge", zoom: 16 }
];

// Helper to build marker HTML with pulsing ring
function createMarkerIcon(r) {
  const p = r.priority || { finalScore: r.priorityScore || 70, isOverdue: (r.elapsedHours || 0) > (r.slaHours || 24) };
  const score = p.finalScore || 70;
  const isVerified = r.status === 'verified' || r.status === 'resolved';
  const isOverdue = Boolean(p.isOverdue);

  // Status Pulse Animation: Red for unresolved, Green for verified, Urgent Red for Overdue SLA
  const pulseClass = isVerified
    ? 'civic-pulse-resolved'
    : isOverdue
    ? 'civic-pulse-overdue'
    : 'civic-pulse-unresolved';

  // Base dot color by severity
  const baseColor = isVerified
    ? '#059669'
    : score >= 80
    ? '#DC2626'
    : score >= 50
    ? '#D97706'
    : '#2563EB';

  const markerHtml = `
    <div class="civic-radar-marker" style="position:relative; width:36px; height:36px; cursor:pointer;">
      <div class="civic-pulse-ring ${pulseClass}"></div>
      ${isOverdue && !isVerified ? `<div class="civic-pulse-ring civic-pulse-overdue" style="animation-delay: 0.55s;"></div>` : ''}
      <div class="civic-marker-dot" style="
        position:relative;
        width:34px;
        height:34px;
        background:${baseColor};
        border:2.5px solid #FFFFFF;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        color:#FFFFFF;
        font-weight:800;
        font-size:12px;
        font-family:var(--font-mono), monospace;
        box-shadow:0 4px 12px rgba(0,0,0,0.35);
        transition:transform 0.15s ease;
      ">
        ${isVerified ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : score}
      </div>
    </div>
  `;

  return {
    icon: L.divIcon({
      html: markerHtml,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
      className: 'civic-leaflet-div-icon'
    }),
    dataHash: `${r.status}-${score}-${isOverdue}-${baseColor}`,
    score,
    isVerified,
    baseColor
  };
}

export default function InteractiveCivicMap({
  reports = [],
  currentRole,
  onNotifyWard,
  onSelectReport,
  onReportAtLocation,
  onEndorseReport,
  readOnly = false,
  title = "Civic Radar & Ward GIS Command Map"
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);

  // Persistent Leaflet Layer Groups (Never destroyed on filter/data changes)
  const zonesLayerRef = useRef(null);
  const radiiLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const bmcAgrLayerRef = useRef(null);
  const markersByIdRef = useRef(new Map()); // id -> { marker, dataHash }
  const userMarkerRef = useRef(null);
  const droppedPinRef = useRef(null);

  // Filter & Layer States
  const [dataSource, setDataSource] = useState('both'); // 'live' | 'bmc' | 'both'
  const [bmcMapData, setBmcMapData] = useState([]);
  const [activeBasemap, setActiveBasemap] = useState('streets');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'pothole' | 'garbage' | 'electricity' | 'water' | 'critical' | 'overdue'
  const [showCriticalZones, setShowCriticalZones] = useState(true);
  const [showImpactRadius, setShowImpactRadius] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [droppedPin, setDroppedPin] = useState(null);
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFeedback, setSearchFeedback] = useState(null);

  // 1. Initialize Map ONCE (Mount / Unmount only)
  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: true,
      fadeAnimation: true,
      markerZoomAnimation: true
    }).setView([19.0560, 72.8340], 15);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    const base = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0];
    const tileLayer = L.tileLayer(base.url, {
      maxZoom: base.maxZoom,
      subdomains: base.subdomains || 'abc',
      attribution: base.attribution
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    zonesLayerRef.current = L.layerGroup().addTo(map);
    radiiLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);
    bmcAgrLayerRef.current = L.layerGroup().addTo(map);

    // Only allow pin-drop if NOT read-only
    if (!readOnly) {
      map.on('click', (e) => {
        const { lat, lng } = e.latlng;
        handleMapClick(lat, lng, map);
      });
    }

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
      markersByIdRef.current.clear();
    };
  }, [readOnly]);

  // 2. Switch Basemap Layer dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const base = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0];
    tileLayerRef.current.setUrl(base.url);
  }, [activeBasemap]);

  // 3. Handle Pin Drop on Map Click
  const handleMapClick = (lat, lng, map) => {
    if (readOnly) return;

    if (droppedPinRef.current) {
      droppedPinRef.current.remove();
      droppedPinRef.current = null;
    }

    const pinIcon = L.divIcon({
      html: `
        <div style="position:relative; width:36px; height:36px; animation: bounceIn 0.3s ease;">
          <div style="width:36px; height:36px; background:#1D4ED8; border:3px solid #FFFFFF; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFF; box-shadow:0 6px 15px rgba(29,78,216,0.5);">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div style="position:absolute; bottom:-4px; left:14px; width:8px; height:8px; background:#1D4ED8; transform:rotate(45deg); border-right:2px solid #FFF; border-bottom:2px solid #FFF;"></div>
        </div>
      `,
      iconSize: [36, 40],
      iconAnchor: [18, 40],
      className: 'civic-leaflet-div-icon'
    });

    const marker = L.marker([lat, lng], { icon: pinIcon }).addTo(map);
    droppedPinRef.current = marker;

    const approxAddress = `Latitude ${lat.toFixed(4)}° N, Longitude ${lng.toFixed(4)}° E (Ward H/West)`;
    setDroppedPin({ lat, lng, address: approxAddress });
  };

  const clearDroppedPin = () => {
    if (droppedPinRef.current) {
      droppedPinRef.current.remove();
      droppedPinRef.current = null;
    }
    setDroppedPin(null);
  };

  // 4. Update Critical Zones Non-Destructively
  useEffect(() => {
    if (!zonesLayerRef.current) return;
    zonesLayerRef.current.clearLayers();

    if (showCriticalZones) {
      CIVIC_DATA.criticalZones.forEach(z => {
        const color = z.type === 'school' ? '#D97706' : z.type === 'hospital' ? '#DC2626' : '#2563EB';
        const circle = L.circle(z.coords, {
          radius: z.bufferRadius,
          color,
          fillColor: color,
          fillOpacity: 0.08,
          weight: 2,
          dashArray: '5,5'
        });

        circle.bindTooltip(`<strong>${z.tag}</strong><br/>${z.name} (Buffer: ${z.bufferRadius}m)`, {
          sticky: true,
          className: 'civic-map-tooltip'
        });

        zonesLayerRef.current.addLayer(circle);
      });
    }
  }, [showCriticalZones]);

  // 5. Update Impact Radii Non-Destructively
  useEffect(() => {
    if (!radiiLayerRef.current) return;
    radiiLayerRef.current.clearLayers();

    if (showImpactRadius) {
      reports.forEach(r => {
        const isVerified = r.status === 'verified' || r.status === 'resolved';
        if (isVerified) return;

        const p = r.priority || { finalScore: r.priorityScore || 70 };
        const score = p.finalScore || 70;
        const color = score >= 80 ? '#DC2626' : score >= 50 ? '#D97706' : '#2563EB';

        const circle = L.circle(r.coords, {
          radius: r.impactRadiusMeters || 100,
          color,
          fillColor: color,
          fillOpacity: 0.09,
          weight: 1.5
        });

        radiiLayerRef.current.addLayer(circle);
      });
    }
  }, [showImpactRadius, reports]);

  // Load BMC Ward Aggregates on mount
  useEffect(() => {
    api.getBmcMapData()
      .then(res => {
        if (res && res.mapData) setBmcMapData(res.mapData);
      })
      .catch(e => console.warn('[Map] BMC aggregates not available:', e));
  }, []);

  // Render BMC Ward Aggregates without loading 960k point markers
  useEffect(() => {
    if (!bmcAgrLayerRef.current) return;
    bmcAgrLayerRef.current.clearLayers();

    if (dataSource === 'live') return;

    bmcMapData.forEach(w => {
      const countFormatted = (w.totalComplaints || 0).toLocaleString();
      const html = `
        <div style="
          background: #0F172A;
          border: 2px solid #3B82F6;
          color: #FFFFFF;
          padding: 4px 8px;
          border-radius: 20px;
          font-size: 11px;
          font-weight: 800;
          white-space: nowrap;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          gap: 5px;
          cursor: pointer;
        ">
          <span style="color:#60A5FA;">🏛️ Ward ${w.wardCode}</span>
          <span style="background:#1D4ED8; padding:1px 6px; border-radius:10px; font-size:10px;">${countFormatted}</span>
        </div>
      `;
      const icon = L.divIcon({
        html,
        className: 'bmc-ward-marker-icon',
        iconSize: [120, 26],
        iconAnchor: [60, 13]
      });

      const marker = L.marker(w.coords, { icon });
      marker.bindPopup(`
        <div style="font-family: inherit; font-size: 12px; color: #0F172A; min-width: 210px; line-height: 1.45;">
          <div style="font-weight: 800; font-size: 13px; color: #1D4ED8; border-bottom: 1.5px solid #E2E8F0; padding-bottom: 4px; margin-bottom: 6px;">
            🏛️ BMC Ward ${w.wardCode} (Historical Aggregate)
          </div>
          <div><strong>Area:</strong> ${w.wardName}</div>
          <div><strong>Zone:</strong> ${w.zone}</div>
          <div><strong>Historical Grievances:</strong> ${(w.totalComplaints || 0).toLocaleString()}</div>
          <div><strong>Satisfaction Rate:</strong> ${w.satisfactionRate}%</div>
          <div><strong>Average SLA:</strong> ${w.avgResolutionDays} days</div>
          <div><strong>Slum Percentage:</strong> ${w.slumPercentage}%</div>
          <div style="margin-top: 6px; font-size: 10px; color: #64748B; font-style: italic;">
            Brihanmumbai Municipal Corporation 2018–2024 Archive
          </div>
        </div>
      `);
      bmcAgrLayerRef.current.addLayer(marker);
    });
  }, [dataSource, bmcMapData]);

  // 6. Fast Marker Diffing & Rendering (Respects dataSource)
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;

    // If viewing BMC Historical only, clear live markers
    if (dataSource === 'bmc') {
      markersLayerRef.current.clearLayers();
      markersByIdRef.current.clear();
      return;
    }

    const visibleReports = reports.filter(r => {
      const p = r.priority || { finalScore: r.priorityScore || 70, isOverdue: (r.elapsedHours || 0) > (r.slaHours || 24) };
      if (activeCategory === 'all') return true;
      if (activeCategory === 'critical') return (p.finalScore || 0) >= 80;
      if (activeCategory === 'overdue') return Boolean(p.isOverdue);
      return r.category === activeCategory;
    });

    const visibleIds = new Set(visibleReports.map(r => r.id));
    const cachedMap = markersByIdRef.current;

    for (const [id, entry] of cachedMap.entries()) {
      if (!visibleIds.has(id)) {
        markersLayerRef.current.removeLayer(entry.marker);
        cachedMap.delete(id);
      }
    }

    visibleReports.forEach(r => {
      const { icon, dataHash, score, isVerified, baseColor } = createMarkerIcon(r);
      const existing = cachedMap.get(r.id);

      if (existing) {
        if (existing.dataHash !== dataHash) {
          existing.marker.setIcon(icon);
          existing.dataHash = dataHash;
        }
      } else {
        const marker = L.marker(r.coords, { icon });

        marker.on('click', () => {
          setSelectedReport(r);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo(r.coords, 16, { duration: 0.7 });
          }
        });

        marker.bindTooltip(`
          <div style="font-family:var(--font-sans), sans-serif; padding:2px;">
            <strong style="color:${baseColor}; font-family:var(--font-mono);">${r.id}</strong>: ${r.title}
            <div style="font-size:11px; color:#64748B;">
              ${isVerified ? 'Verified Resolved' : `Priority ${score}/100 • ${r.duplicateCount || 1} endorsements`}
            </div>
          </div>
        `, { sticky: true, className: 'civic-map-tooltip' });

        markersLayerRef.current.addLayer(marker);
        cachedMap.set(r.id, { marker, dataHash });
      }
    });
  }, [reports, activeCategory]);

  // 7. Search Handler (Debounced local + Nominatim)
  const handleSearchSubmit = async (e) => {
    e?.preventDefault();
    if (!searchQuery.trim() || !mapInstanceRef.current) return;
    const q = searchQuery.toLowerCase().trim();

    // A. Check local hotspots first
    const foundHotspot = HOTSPOTS.find(h => h.name.toLowerCase().includes(q));
    if (foundHotspot) {
      mapInstanceRef.current.flyTo(foundHotspot.coords, foundHotspot.zoom, { duration: 1.2 });
      setSearchFeedback(`Flew to ${foundHotspot.name}`);
      setTimeout(() => setSearchFeedback(null), 3000);
      return;
    }

    // B. Check visible reports
    const foundReport = reports.find(
      r => r.title?.toLowerCase().includes(q) || r.address?.toLowerCase().includes(q) || r.id?.toLowerCase().includes(q)
    );
    if (foundReport) {
      mapInstanceRef.current.flyTo(foundReport.coords, 17, { duration: 1.2 });
      setSelectedReport(foundReport);
      setSearchFeedback(`Found Ticket ${foundReport.id}`);
      setTimeout(() => setSearchFeedback(null), 3000);
      return;
    }

    // C. Fallback: Free OpenStreetMap Nominatim Geocoder
    try {
      setSearchLoading(true);
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q + ' Bandra West Mumbai')}&limit=1`;
      const res = await fetch(url);
      const data = await res.json();
      setSearchLoading(false);

      if (data && data.length > 0) {
        const lat = parseFloat(data[0].lat);
        const lon = parseFloat(data[0].lon);
        mapInstanceRef.current.flyTo([lat, lon], 16, { duration: 1.2 });
        setSearchFeedback(`Found: ${data[0].display_name.split(',')[0]}`);
        setTimeout(() => setSearchFeedback(null), 3500);
      } else {
        setSearchFeedback("No match found in Ward H/West.");
        setTimeout(() => setSearchFeedback(null), 2500);
      }
    } catch (err) {
      setSearchLoading(false);
      setSearchFeedback("Search unavailable.");
      setTimeout(() => setSearchFeedback(null), 2500);
    }
  };

  // 8. Real-time "Locate Me" GPS Center
  const handleLocateMe = () => {
    if (!('geolocation' in navigator)) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    setLocatingUser(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocatingUser(false);
        const { latitude, longitude, accuracy } = pos.coords;
        const coords = [latitude, longitude];
        setUserLocation({ coords, accuracy: Math.round(accuracy) });

        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 17, { duration: 1.4 });

          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          const userGroup = L.layerGroup();
          const userIcon = L.divIcon({
            html: `
              <div style="position:relative; width:24px; height:24px;">
                <div style="position:absolute; inset:-6px; background:#3B82F6; border-radius:50%; opacity:0.4; animation: civicPulseRedUrgent 1.5s infinite;"></div>
                <div style="width:20px; height:20px; background:#2563EB; border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12],
            className: 'civic-leaflet-div-icon'
          });

          L.marker(coords, { icon: userIcon }).bindPopup("<strong>You Are Here</strong>").addTo(userGroup);
          L.circle(coords, { radius: accuracy, color: '#3B82F6', fillColor: '#3B82F6', fillOpacity: 0.1, weight: 1 }).addTo(userGroup);

          userGroup.addTo(mapInstanceRef.current);
          userMarkerRef.current = userGroup;
        }
      },
      (err) => {
        setLocatingUser(false);
        console.warn("GPS Error:", err);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo([19.0558, 72.8295], 16, { duration: 1 });
        }
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  // 9. Hotspot Quick Jump
  const handleFlyToHotspot = (coords, zoom) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.2 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Top Controls Bar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>{title}</span>
              {readOnly ? (
                <span style={{ fontSize: '0.72rem', background: '#F1F5F9', color: '#475569', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Lock size={12} /> Read-Only Surveillance
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                  60fps Live GIS
                </span>
              )}
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.84rem', margin: 0 }}>
              {readOnly
                ? "Constuency-wide civic status overview. Read-only spatial monitoring for administrative oversight."
                : "Click anywhere to drop a pin & report. Pulsing status markers indicate live priority and SLA urgency."}
            </p>
          </div>

          {/* Layer Toggles & Search Bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            {/* Search Input Form */}
            <form onSubmit={handleSearchSubmit} style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search address, landmark, ticket..."
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px 30px 6px 10px',
                  fontSize: '0.8rem',
                  outline: 'none',
                  width: '210px',
                  color: '#1E293B'
                }}
              />
              <button
                type="submit"
                disabled={searchLoading}
                style={{
                  position: 'absolute',
                  right: '6px',
                  background: 'none',
                  border: 'none',
                  color: '#64748B',
                  cursor: 'pointer',
                  padding: '2px',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                <Search size={15} className={searchLoading ? 'animate-spin' : ''} />
              </button>
            </form>

            {/* Data Source Selector */}
            <div style={{ display: 'flex', alignItems: 'center', background: '#F1F5F9', padding: '3px', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
              <button
                type="button"
                onClick={() => setDataSource('both')}
                style={{
                  background: dataSource === 'both' ? '#FFFFFF' : 'transparent',
                  color: dataSource === 'both' ? '#0F172A' : '#64748B',
                  border: 'none',
                  boxShadow: dataSource === 'both' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                All Data
              </button>
              <button
                type="button"
                onClick={() => setDataSource('live')}
                style={{
                  background: dataSource === 'live' ? '#FFFFFF' : 'transparent',
                  color: dataSource === 'live' ? '#1D4ED8' : '#64748B',
                  border: 'none',
                  boxShadow: dataSource === 'live' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🚨 Live Reports
              </button>
              <button
                type="button"
                onClick={() => setDataSource('bmc')}
                style={{
                  background: dataSource === 'bmc' ? '#FFFFFF' : 'transparent',
                  color: dataSource === 'bmc' ? '#7C3AED' : '#64748B',
                  border: 'none',
                  boxShadow: dataSource === 'bmc' ? '0 1px 2px rgba(0,0,0,0.08)' : 'none',
                  borderRadius: '6px',
                  padding: '5px 9px',
                  fontSize: '0.74rem',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                🏛️ BMC Wards
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowCriticalZones(!showCriticalZones)}
              style={{
                background: showCriticalZones ? '#FEF3C7' : '#FFFFFF',
                color: showCriticalZones ? '#B45309' : '#64748B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Shield size={14} /> Critical Zones ({showCriticalZones ? 'ON' : 'OFF'})
            </button>

            <button
              type="button"
              onClick={() => setShowImpactRadius(!showImpactRadius)}
              style={{
                background: showImpactRadius ? '#EFF6FF' : '#FFFFFF',
                color: showImpactRadius ? '#1D4ED8' : '#64748B',
                border: '1px solid #CBD5E1',
                borderRadius: '8px',
                padding: '6px 12px',
                fontSize: '0.8rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              <Layers size={14} /> Impact Radii ({showImpactRadius ? 'ON' : 'OFF'})
            </button>

            {/* Basemap Switcher Dropdown */}
            <div style={{ position: 'relative' }}>
              <button
                type="button"
                onClick={() => setBasemapMenuOpen(!basemapMenuOpen)}
                style={{
                  background: '#FFFFFF',
                  color: '#1E293B',
                  border: '1px solid #CBD5E1',
                  borderRadius: '8px',
                  padding: '6px 12px',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                <span>{BASEMAPS.find(b => b.id === activeBasemap)?.label.split(' ')[0]}</span>
                <span>Layers ▾</span>
              </button>

              {basemapMenuOpen && (
                <div
                  style={{
                    position: 'absolute',
                    top: '36px',
                    right: 0,
                    background: '#FFFFFF',
                    borderRadius: '10px',
                    boxShadow: '0 10px 25px -5px rgba(0,0,0,0.15)',
                    border: '1px solid #E2E8F0',
                    zIndex: 2000,
                    minWidth: '180px',
                    overflow: 'hidden'
                  }}
                >
                  {BASEMAPS.map(b => (
                    <div
                      key={b.id}
                      onClick={() => {
                        setActiveBasemap(b.id);
                        setBasemapMenuOpen(false);
                      }}
                      style={{
                        padding: '9px 12px',
                        fontSize: '0.82rem',
                        fontWeight: activeBasemap === b.id ? 800 : 500,
                        color: activeBasemap === b.id ? '#1D4ED8' : '#334155',
                        background: activeBasemap === b.id ? '#EFF6FF' : '#FFFFFF',
                        cursor: 'pointer',
                        borderBottom: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between'
                      }}
                    >
                      <span>{b.label}</span>
                      {activeBasemap === b.id && <Check size={14} />}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Search Feedback Notification Toast */}
        {searchFeedback && (
          <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', color: '#1D4ED8', padding: '6px 12px', borderRadius: '6px', fontSize: '0.78rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <MapPin size={13} />
            <span>{searchFeedback}</span>
          </div>
        )}

        {/* Filter Pills Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: `All Complaints (${reports.length})` },
            { id: 'pothole', label: 'Potholes', Icon: AlertTriangle },
            { id: 'garbage', label: 'Garbage Dumps', Icon: Trash2 },
            { id: 'electricity', label: 'Streetlights', Icon: Lightbulb },
            { id: 'water', label: 'Water Leaks', Icon: Droplets },
            { id: 'others', label: 'Others', Icon: HelpCircle },
            { id: 'critical', label: 'Critical Priority (≥80)', Icon: Flame },
            { id: 'overdue', label: 'Overdue SLA', Icon: Clock }
          ].map(tab => {
            const Icon = tab.Icon;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveCategory(tab.id)}
                style={{
                  background: activeCategory === tab.id ? '#1D4ED8' : '#FFFFFF',
                  color: activeCategory === tab.id ? '#FFFFFF' : '#475569',
                  border: activeCategory === tab.id ? '1px solid #1D4ED8' : '1px solid #CBD5E1',
                  padding: '6px 14px',
                  borderRadius: '9999px',
                  fontSize: '0.8rem',
                  fontWeight: activeCategory === tab.id ? 700 : 500,
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.15s ease',
                  boxShadow: activeCategory === tab.id ? '0 2px 5px rgba(29, 78, 216, 0.25)' : 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '5px'
                }}
              >
                {Icon && <Icon size={13} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Hotspots Quick-Jump Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', fontSize: '0.78rem', color: '#64748B' }}>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
            <MapPin size={12} /> Quick Jump:
          </span>
          {HOTSPOTS.map(h => (
            <button
              key={h.name}
              type="button"
              onClick={() => handleFlyToHotspot(h.coords, h.zoom)}
              style={{
                background: '#F1F5F9',
                border: '1px solid #E2E8F0',
                color: '#334155',
                padding: '4px 10px',
                borderRadius: '6px',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {h.name}
            </button>
          ))}
        </div>
      </div>

      {/* Main Map Canvas Card */}
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: '16px',
          border: '1px solid #CBD5E1',
          overflow: 'hidden',
          boxShadow: '0 8px 20px -4px rgba(0,0,0,0.08)',
          position: 'relative',
          height: '560px'
        }}
      >
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* Floating "Locate Me" Button */}
        <button
          type="button"
          onClick={handleLocateMe}
          disabled={locatingUser}
          title="Zoom to My Current GPS Location"
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            background: '#FFFFFF',
            border: '1.5px solid #CBD5E1',
            borderRadius: '10px',
            padding: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 4px 8px rgba(0,0,0,0.12)',
            color: locatingUser ? '#2563EB' : '#1E293B'
          }}
        >
          <Crosshair size={20} className={locatingUser ? 'animate-spin' : ''} />
        </button>

        {/* Dropped Pin Quick Action Card (Only if NOT read-only) */}
        {!readOnly && droppedPin && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              left: '16px',
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(8px)',
              border: '2px solid #2563EB',
              borderRadius: '12px',
              padding: '14px 16px',
              maxWidth: '320px',
              zIndex: 1000,
              boxShadow: '0 10px 25px -5px rgba(37,99,235,0.25)',
              animation: 'slideInLeft 0.25s ease'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
              <strong style={{ fontSize: '0.86rem', color: '#1D4ED8', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <MapPin size={16} /> Selected Pin Location
              </strong>
              <button
                type="button"
                onClick={clearDroppedPin}
                style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: 0 }}
              >
                <X size={14} />
              </button>
            </div>
            <p style={{ fontSize: '0.78rem', color: '#475569', margin: '0 0 10px 0', lineHeight: 1.4 }}>
              {droppedPin.address}
            </p>
            <button
              type="button"
              onClick={() => {
                if (onReportAtLocation) {
                  onReportAtLocation([droppedPin.lat, droppedPin.lng], droppedPin.address);
                }
              }}
              style={{
                width: '100%',
                background: '#1D4ED8',
                color: '#FFF',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 12px',
                fontSize: '0.82rem',
                fontWeight: 700,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px'
              }}
            >
              <span>Report Civic Hazard Here</span>
              <ChevronRight size={15} />
            </button>
          </div>
        )}

        {/* Floating Map Legend */}
        <div
          style={{
            position: 'absolute',
            bottom: '20px',
            left: '20px',
            background: 'rgba(255, 255, 255, 0.94)',
            backdropFilter: 'blur(8px)',
            borderRadius: '12px',
            padding: '10px 14px',
            fontSize: '0.75rem',
            boxShadow: '0 6px 15px -3px rgba(0,0,0,0.1)',
            border: '1px solid #CBD5E1',
            zIndex: 1000,
            display: 'flex',
            flexDirection: 'column',
            gap: '6px'
          }}
        >
          <strong style={{ fontSize: '0.8rem', color: '#0F172A' }}>Live Status Radar:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '12px', height: '12px' }}>
              <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: '#EF4444', opacity: 0.6, animation: 'civicPulseRed 2.2s infinite' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#DC2626' }}></div>
            </div>
            <span>Unresolved (Pulsing Red)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '12px', height: '12px' }}>
              <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', background: '#DC2626', opacity: 0.9, animation: 'civicPulseRedUrgent 1.1s infinite' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#991B1B' }}></div>
            </div>
            <span>SLA Overdue (Fast Red Pulse)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ position: 'relative', width: '12px', height: '12px' }}>
              <div style={{ position: 'absolute', inset: -2, borderRadius: '50%', background: '#10B981', opacity: 0.6, animation: 'civicPulseGreen 2.4s infinite' }}></div>
              <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: '#059669' }}></div>
            </div>
            <span>Verified Resolved (Pulsing Green)</span>
          </div>
        </div>

        {/* Interactive Slide-Over Detail Drawer */}
        {selectedReport && (
          <div
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              bottom: '16px',
              width: '360px',
              maxWidth: '90%',
              background: '#FFFFFF',
              borderRadius: '16px',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.25)',
              border: '1px solid #CBD5E1',
              zIndex: 1500,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              animation: 'slideInRight 0.25s ease'
            }}
          >
            {/* Drawer Header */}
            <div style={{ padding: '14px 16px', background: '#0F172A', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800, fontFamily: 'var(--font-mono)' }}>{selectedReport.id}</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#FFF' }}>
                  {selectedReport.categoryLabel}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: '16px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Image Preview */}
              <div style={{ position: 'relative', borderRadius: '10px', overflow: 'hidden', height: '170px', background: '#E2E8F0' }}>
                <img
                  src={selectedReport.beforeImage}
                  alt={selectedReport.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                <span
                  style={{
                    position: 'absolute',
                    top: '10px',
                    left: '10px',
                    background: selectedReport.status === 'verified' ? 'rgba(5, 150, 105, 0.9)' : 'rgba(15, 23, 42, 0.85)',
                    color: '#FFF',
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 700
                  }}
                >
                  {selectedReport.status === 'verified' ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                      <Check size={11} /> VERIFIED FIXED
                    </span>
                  ) : (
                    selectedReport.status?.toUpperCase()
                  )}
                </span>
              </div>

              {/* Title & Address */}
              <div>
                <h3 style={{ fontSize: '0.98rem', fontWeight: 800, margin: '0 0 4px 0', color: '#0F172A' }}>
                  {selectedReport.title}
                </h3>
                <p style={{ fontSize: '0.78rem', color: '#64748B', margin: 0, display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <MapPin size={13} /> {selectedReport.address}
                </p>
              </div>

              {/* Priority Metric Badge */}
              <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Priority Score</span>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                      color: (selectedReport.priority?.finalScore || selectedReport.priorityScore || 70) >= 80 ? '#DC2626' : '#D97706'
                    }}
                  >
                    {selectedReport.priority?.finalScore || selectedReport.priorityScore || 70} / 100
                  </span>
                </div>
                <div style={{ width: '100%', height: '6px', background: '#E2E8F0', borderRadius: '9999px', overflow: 'hidden' }}>
                  <div
                    style={{
                      width: `${selectedReport.priority?.finalScore || selectedReport.priorityScore || 70}%`,
                      height: '100%',
                      background: (selectedReport.priority?.finalScore || selectedReport.priorityScore || 70) >= 80 ? '#DC2626' : '#D97706',
                      borderRadius: '9999px'
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', color: '#64748B', marginTop: '6px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                    <Shield size={11} /> {selectedReport.criticalZone || 'Ward Corridor'}
                  </span>
                  <span>{selectedReport.duplicateCount || 1} Community Endorsements</span>
                </div>
              </div>

              {/* Endorse Button (Hidden in readOnly mode) */}
              {!readOnly && (
                <button
                  type="button"
                  onClick={() => {
                    if (onEndorseReport) {
                      onEndorseReport(selectedReport.id);
                    }
                  }}
                  style={{
                    background: '#ECFDF5',
                    color: '#065F46',
                    border: '1px solid #A7F3D0',
                    borderRadius: '10px',
                    padding: '10px',
                    fontSize: '0.84rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <ThumbsUp size={16} />
                  <span>Endorse Issue (+1 Boost • +25 Karma)</span>
                </button>
              )}

              {/* View in Pipeline Action */}
              <button
                type="button"
                onClick={() => {
                  if (onSelectReport) {
                    onSelectReport(selectedReport);
                  }
                }}
                style={{
                  background: '#1D4ED8',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '10px',
                  padding: '10px',
                  fontSize: '0.84rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px'
                }}
              >
                <span>Track Full History in Pipeline</span>
                <ChevronRight size={16} />
              </button>

              {/* MLA Escalation Action Button */}
              {currentRole === 'mla' && (
                (() => {
                  const priVal = selectedReport.priority?.finalScore || selectedReport.priorityScore || 70;
                  const isOv = (selectedReport.elapsedHours || 0) > (selectedReport.slaHours || 48);
                  const isSevere = priVal >= 80 || isOv;

                  return (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginTop: '2px' }}>
                      {isSevere && (
                        <div style={{ fontSize: '0.72rem', fontWeight: 700, color: '#DC2626', display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <AlertTriangle size={12} /> Recommended — high severity
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          if (onNotifyWard) {
                            onNotifyWard(selectedReport.id);
                          }
                        }}
                        style={{
                          background: selectedReport.mlaEscalated ? '#F1F5F9' : isSevere ? '#DC2626' : '#EA580C',
                          color: selectedReport.mlaEscalated ? '#64748B' : '#FFFFFF',
                          border: isSevere && !selectedReport.mlaEscalated ? '1px solid #B91C1C' : 'none',
                          borderRadius: '10px',
                          padding: '10px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: selectedReport.mlaEscalated ? 'default' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          boxShadow: !selectedReport.mlaEscalated && isSevere ? '0 4px 12px rgba(220, 38, 38, 0.35)' : 'none',
                          transition: 'all 0.15s ease'
                        }}
                      >
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                          <Bell size={14} />
                          {selectedReport.mlaEscalated ? 'Ward Notified (Escalated)' : 'Notify Ward (Escalate)'}
                        </span>
                      </button>
                    </div>
                  );
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
