import React, { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function ComplaintMiniMap({
  coords = [19.0558, 72.8290],
  status = 'reported',
  priorityScore = 75,
  isOverdue = false,
  impactRadiusMeters = 100,
  height = '140px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const validCoords = coords && coords.length === 2 && !isNaN(coords[0]) && !isNaN(coords[1])
      ? coords
      : [19.0558, 72.8290];

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false,
      dragging: true,
      scrollWheelZoom: false,
      touchZoom: true
    }).setView(validCoords, 16);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    const isVerified = status === 'verified' || status === 'resolved';
    const score = priorityScore || 70;
    const baseColor = isVerified
      ? '#059669'
      : score >= 80
      ? '#DC2626'
      : score >= 50
      ? '#D97706'
      : '#2563EB';

    const pulseClass = isVerified
      ? 'civic-pulse-resolved'
      : isOverdue
      ? 'civic-pulse-overdue'
      : 'civic-pulse-unresolved';

    // Impact Radius Circle
    if (!isVerified) {
      L.circle(validCoords, {
        radius: impactRadiusMeters || 100,
        color: baseColor,
        fillColor: baseColor,
        fillOpacity: 0.1,
        weight: 1.5
      }).addTo(map);
    }

    // Pulsing Marker
    const icon = L.divIcon({
      html: `
        <div style="position:relative; width:30px; height:30px;">
          <div class="civic-pulse-ring ${pulseClass}"></div>
          <div style="
            position:relative;
            width:28px;
            height:28px;
            background:${baseColor};
            border:2px solid #FFFFFF;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#FFFFFF;
            font-weight:800;
            font-size:11px;
            font-family:var(--font-mono, monospace);
            box-shadow:0 3px 8px rgba(0,0,0,0.3);
          ">
            ${isVerified ? '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>' : score}
          </div>
        </div>
      `,
      iconSize: [30, 30],
      iconAnchor: [15, 15],
      className: 'civic-leaflet-div-icon'
    });

    L.marker(validCoords, { icon }).addTo(map);

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [coords, status, priorityScore, isOverdue, impactRadiusMeters]);

  return (
    <div
      style={{
        borderRadius: '10px',
        overflow: 'hidden',
        border: '1px solid #E2E8F0',
        width: '100%',
        height,
        position: 'relative'
      }}
    >
      <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          bottom: '4px',
          right: '6px',
          background: 'rgba(255, 255, 255, 0.85)',
          padding: '2px 6px',
          borderRadius: '4px',
          fontSize: '0.65rem',
          color: '#64748B',
          fontWeight: 600,
          pointerEvents: 'none'
        }}
      >
        GIS Radar Preview
      </div>
    </div>
  );
}
