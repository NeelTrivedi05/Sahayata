import React, { useState, useEffect, useRef } from 'react';
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
  Search
} from 'lucide-react';
import { CIVIC_DATA } from '../../data/civicData';

const BASEMAPS = [
  {
    id: 'streets',
    label: '🗺️ Daylight Streets',
    url: 'https://tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19
  },
  {
    id: 'dark',
    label: '🌙 Command Dark',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CartoDB &copy; OpenStreetMap',
    subdomains: 'abcd',
    maxZoom: 20
  },
  {
    id: 'satellite',
    label: '🛰️ Satellite Aerial',
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

export default function InteractiveCivicMap({
  reports = [],
  onSelectReport,
  onReportAtLocation,
  onEndorseReport
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const tileLayerRef = useRef(null);
  const markersLayerRef = useRef(null);
  const zonesLayerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const droppedPinRef = useRef(null);

  // Filter & Layer States
  const [activeBasemap, setActiveBasemap] = useState('streets');
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'pothole' | 'garbage' | 'electricity' | 'water' | 'critical' | 'overdue'
  const [showCriticalZones, setShowCriticalZones] = useState(true);
  const [showImpactRadius, setShowImpactRadius] = useState(true);
  const [selectedReport, setSelectedReport] = useState(null);
  const [locatingUser, setLocatingUser] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [droppedPin, setDroppedPin] = useState(null);
  const [basemapMenuOpen, setBasemapMenuOpen] = useState(false);

  // 1. Initialize Map Once
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
      attributionControl: true
    }).setView([19.0560, 72.8340], 15);

    // Zoom control in bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial Base Tile Layer
    const base = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0];
    const tileLayer = L.tileLayer(base.url, {
      maxZoom: base.maxZoom,
      subdomains: base.subdomains || 'abc',
      attribution: base.attribution
    }).addTo(map);
    tileLayerRef.current = tileLayer;

    // Layer Groups
    zonesLayerRef.current = L.layerGroup().addTo(map);
    markersLayerRef.current = L.layerGroup().addTo(map);

    // Click anywhere on map to drop a pin for new report
    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      handleMapClick(lat, lng, map);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // 2. Switch Basemap Layer dynamically
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;
    const base = BASEMAPS.find(b => b.id === activeBasemap) || BASEMAPS[0];
    tileLayerRef.current.setUrl(base.url);
  }, [activeBasemap]);

  // 3. Handle Pin Drop on Map Click
  const handleMapClick = (lat, lng, map) => {
    if (droppedPinRef.current) {
      droppedPinRef.current.remove();
      droppedPinRef.current = null;
    }

    const pinIcon = L.divIcon({
      html: `
        <div style="position:relative; width:36px; height:36px; animation: bounceIn 0.3s ease;">
          <div style="width:36px; height:36px; background:#1D4ED8; border:3px solid #FFFFFF; border-radius:50%; display:flex; align-items:center; justify-content:center; color:#FFF; box-shadow:0 6px 15px rgba(29,78,216,0.5);">
            📍
          </div>
          <div style="position:absolute; bottom:-4px; left:14px; width:8px; height:8px; background:#1D4ED8; transform:rotate(45deg); border-right:2px solid #FFF; border-bottom:2px solid #FFF;"></div>
        </div>
      `,
      iconSize: [36, 40],
      iconAnchor: [18, 40]
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

  // 4. Update Critical Zones
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

  // 5. Filter & Plot Grievance Markers
  useEffect(() => {
    if (!markersLayerRef.current || !mapInstanceRef.current) return;
    markersLayerRef.current.clearLayers();

    // Filter reports
    const filtered = reports.filter(r => {
      const p = r.priority || { finalScore: r.priorityScore || 70, isOverdue: r.elapsedHours > (r.slaHours || 24) };
      if (activeCategory === 'all') return true;
      if (activeCategory === 'critical') return (p.finalScore || 0) >= 80;
      if (activeCategory === 'overdue') return p.isOverdue;
      return r.category === activeCategory;
    });

    filtered.forEach(r => {
      const p = r.priority || { finalScore: r.priorityScore || 70, isOverdue: r.elapsedHours > (r.slaHours || 24) };
      const score = p.finalScore || 70;
      const isVerified = r.status === 'verified';
      const color = isVerified
        ? '#059669'
        : score >= 80
        ? '#DC2626'
        : score >= 50
        ? '#D97706'
        : '#2563EB';

      // Impact Radius
      if (showImpactRadius && !isVerified) {
        const radiusCircle = L.circle(r.coords, {
          radius: r.impactRadiusMeters || 100,
          color,
          fillColor: color,
          fillOpacity: 0.1,
          weight: 1.5
        });
        markersLayerRef.current.addLayer(radiusCircle);
      }

      // Marker Icon
      const pulseAnimation = score >= 80 ? 'animation: radarPulse 2s infinite;' : '';
      const markerHtml = `
        <div style="position:relative; width:36px; height:36px; cursor:pointer;">
          ${score >= 80 ? `<div style="position:absolute; inset:-4px; border-radius:50%; background:${color}; opacity:0.4; ${pulseAnimation}"></div>` : ''}
          <div style="
            position:relative;
            width:34px;
            height:34px;
            background:${color};
            border:2.5px solid #FFFFFF;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#FFFFFF;
            font-weight:800;
            font-size:12px;
            box-shadow:0 4px 10px rgba(0,0,0,0.35);
            transition:transform 0.15s ease;
          ">
            ${isVerified ? '✓' : score}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        html: markerHtml,
        iconSize: [36, 36],
        iconAnchor: [18, 18]
      });

      const marker = L.marker(r.coords, { icon: customIcon });

      marker.on('click', () => {
        setSelectedReport(r);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(r.coords, 16, { duration: 0.8 });
        }
      });

      marker.bindTooltip(`
        <div style="font-family:system-ui; padding:2px;">
          <strong style="color:${color};">${r.id}</strong>: ${r.title}
          <div style="font-size:11px; color:#64748B;">Priority ${score}/100 • ${r.duplicateCount || 1} votes</div>
        </div>
      `, { sticky: true });

      markersLayerRef.current.addLayer(marker);
    });
  }, [reports, activeCategory, showImpactRadius]);

  // 6. User Live GPS Trigger
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
          mapInstanceRef.current.flyTo(coords, 17, { duration: 1.5 });

          // Draw accuracy ring and pulsing user marker
          if (userMarkerRef.current) {
            userMarkerRef.current.remove();
          }

          const userGroup = L.layerGroup();
          const userIcon = L.divIcon({
            html: `
              <div style="position:relative; width:24px; height:24px;">
                <div style="position:absolute; inset:-6px; background:#3B82F6; border-radius:50%; opacity:0.4; animation: ping 1.5s cubic-bezier(0,0,0.2,1) infinite;"></div>
                <div style="width:20px; height:20px; background:#2563EB; border:3px solid #FFFFFF; border-radius:50%; box-shadow:0 2px 8px rgba(0,0,0,0.3);"></div>
              </div>
            `,
            iconSize: [24, 24],
            iconAnchor: [12, 12]
          });

          L.marker(coords, { icon: userIcon }).bindPopup("<strong>📍 You Are Here</strong>").addTo(userGroup);
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

  // 7. Hotspot Quick Jump
  const handleFlyToHotspot = (coords, zoom) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(coords, zoom, { duration: 1.2 });
    }
  };

  return (
    <div style={{ position: 'relative', width: '100%' }}>
      {/* Top Controls Bar: Category Filters & Hotspot Quick Jumps */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 800, margin: '0 0 4px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🗺️ Civic Radar & Ward GIS Command Map</span>
              <span style={{ fontSize: '0.75rem', background: '#ECFDF5', color: '#065F46', padding: '2px 8px', borderRadius: '9999px', fontWeight: 700 }}>
                Live GIS
              </span>
            </h2>
            <p style={{ color: '#64748B', fontSize: '0.85rem', margin: 0 }}>
              Click anywhere on the map to drop a pin & report. Click markers for full photos and priority analytics.
            </p>
          </div>

          {/* Layer Toggles & Basemap Switcher Button */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      {activeBasemap === b.id && <span>✓</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Filter Pills Bar */}
        <div style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
          {[
            { id: 'all', label: `All Complaints (${reports.length})` },
            { id: 'pothole', label: '🕳️ Potholes' },
            { id: 'garbage', label: '🗑️ Garbage Dumps' },
            { id: 'electricity', label: '💡 Streetlights' },
            { id: 'water', label: '🚰 Water Leaks' },
            { id: 'critical', label: '🚨 Critical Priority (≥80)' },
            { id: 'overdue', label: '⏳ Overdue SLA' }
          ].map(tab => (
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
                boxShadow: activeCategory === tab.id ? '0 2px 5px rgba(29, 78, 216, 0.25)' : 'none'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Hotspots Quick-Jump Bar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', fontSize: '0.78rem', color: '#64748B' }}>
          <span style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>📍 Quick Jump:</span>
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
          height: '600px'
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

        {/* Dropped Pin Quick Action Card */}
        {droppedPin && (
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
                ✕
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
          <strong style={{ fontSize: '0.8rem', color: '#0F172A' }}>Severity Index:</strong>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#DC2626' }}></div>
            <span>Critical Priority (≥ 80)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#D97706' }}></div>
            <span>Medium-High Priority (50–79)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#059669' }}></div>
            <span>Citizen Verified Fixed</span>
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
                <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 800 }}>{selectedReport.id}</span>
                <h4 style={{ margin: 0, fontSize: '0.92rem', fontWeight: 800, color: '#FFF' }}>
                  {selectedReport.categoryLabel}
                </h4>
              </div>
              <button
                type="button"
                onClick={() => setSelectedReport(null)}
                style={{ background: 'transparent', border: 'none', color: '#94A3B8', fontSize: '1.2rem', cursor: 'pointer' }}
              >
                ✕
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
                    background: 'rgba(15, 23, 42, 0.85)',
                    color: '#FFF',
                    fontSize: '0.72rem',
                    padding: '3px 8px',
                    borderRadius: '6px',
                    fontWeight: 700
                  }}
                >
                  {selectedReport.status?.toUpperCase()}
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
                  <span style={{ fontSize: '0.78rem', fontWeight: 700, color: '#475569' }}>Calculated Priority Score</span>
                  <span
                    style={{
                      fontSize: '0.9rem',
                      fontWeight: 800,
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
                  <span>{selectedReport.criticalZone ? `🏫 ${selectedReport.criticalZone}` : 'Ward Corridor'}</span>
                  <span>{selectedReport.duplicateCount || 1} Community Endorsements</span>
                </div>
              </div>

              {/* Endorse Button */}
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
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
