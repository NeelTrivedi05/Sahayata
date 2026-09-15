import React, { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { MapPin, Crosshair, Navigation } from 'lucide-react';

export default function LocationPickerMiniMap({
  initialCoords = [19.0558, 72.8290],
  onLocationChange,
  height = '200px'
}) {
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const [currentCoords, setCurrentCoords] = useState(initialCoords);
  const [addressText, setAddressText] = useState('Bandra West, Ward H/West, Mumbai');
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!mapContainerRef.current) return;

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    if (mapContainerRef.current._leaflet_id) {
      delete mapContainerRef.current._leaflet_id;
    }

    const startCoords = initialCoords && initialCoords.length === 2 ? initialCoords : [19.0558, 72.8290];

    const map = L.map(mapContainerRef.current, {
      zoomControl: false,
      attributionControl: false
    }).setView(startCoords, 16);

    L.control.zoom({ position: 'bottomright' }).addTo(map);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19
    }).addTo(map);

    // Draggable Pin Icon
    const pinIcon = L.divIcon({
      html: `
        <div style="position:relative; width:36px; height:42px; cursor:grab;">
          <div style="
            width:34px;
            height:34px;
            background:#2563EB;
            border:2.5px solid #FFFFFF;
            border-radius:50%;
            display:flex;
            align-items:center;
            justify-content:center;
            color:#FFFFFF;
            font-size:16px;
            box-shadow:0 6px 14px rgba(37,99,235,0.45);
          ">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"></path><circle cx="12" cy="10" r="3"></circle></svg>
          </div>
          <div style="
            position:absolute;
            bottom:-4px;
            left:13px;
            width:8px;
            height:8px;
            background:#2563EB;
            transform:rotate(45deg);
            border-right:2px solid #FFF;
            border-bottom:2px solid #FFF;
          "></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      className: 'civic-draggable-pin'
    });

    const marker = L.marker(startCoords, { icon: pinIcon, draggable: true }).addTo(map);
    markerRef.current = marker;

    const handleNewPos = (lat, lng) => {
      setCurrentCoords([lat, lng]);
      const approx = `Near ${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E, Ward H/West`;
      setAddressText(approx);
      if (onLocationChange) {
        onLocationChange([lat, lng], approx);
      }
    };

    marker.on('dragend', () => {
      const pos = marker.getLatLng();
      handleNewPos(pos.lat, pos.lng);
    });

    map.on('click', (e) => {
      const { lat, lng } = e.latlng;
      marker.setLatLng([lat, lng]);
      handleNewPos(lat, lng);
    });

    mapInstanceRef.current = map;

    // Trigger invalidateSize to ensure tiles fill container properly
    const timer = setTimeout(() => {
      try {
        map.invalidateSize();
      } catch (e) {}
    }, 150);

    return () => {
      clearTimeout(timer);
      if (mapInstanceRef.current) {
        try {
          mapInstanceRef.current.remove();
        } catch (e) {}
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker & view when initialCoords changes externally (e.g. preset selection)
  useEffect(() => {
    if (initialCoords && initialCoords.length === 2 && mapInstanceRef.current && markerRef.current) {
      const [lat, lng] = initialCoords;
      if (lat != null && lng != null && !isNaN(lat) && !isNaN(lng)) {
        try {
          const current = markerRef.current.getLatLng();
          if (Math.abs(current.lat - lat) > 0.0001 || Math.abs(current.lng - lng) > 0.0001) {
            markerRef.current.setLatLng([lat, lng]);
            mapInstanceRef.current.setView([lat, lng], 16);
            setCurrentCoords([lat, lng]);
          }
        } catch (e) {}
      }
    }
  }, [initialCoords?.[0], initialCoords?.[1]]);

  // Center on Live GPS
  const handleGPSDetect = () => {
    if (!('geolocation' in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocating(false);
        const coords = [pos.coords.latitude, pos.coords.longitude];
        setCurrentCoords(coords);
        if (mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(coords, 17, { duration: 1.2 });
        }
        if (markerRef.current) {
          markerRef.current.setLatLng(coords);
        }
        const approx = `GPS: ${coords[0].toFixed(4)}° N, ${coords[1].toFixed(4)}° E, Ward H/West`;
        setAddressText(approx);
        if (onLocationChange) {
          onLocationChange(coords, approx);
        }
      },
      (err) => {
        setLocating(false);
        console.warn("GPS error:", err);
      },
      { timeout: 8000, enableHighAccuracy: true }
    );
  };

  return (
    <div style={{ borderRadius: '12px', border: '1px solid #CBD5E1', overflow: 'hidden', background: '#FFFFFF' }}>
      <div style={{ position: 'relative', width: '100%', height }}>
        <div ref={mapContainerRef} style={{ width: '100%', height: '100%' }} />

        {/* GPS Locate Button */}
        <button
          type="button"
          onClick={handleGPSDetect}
          disabled={locating}
          title="Use Current Device GPS"
          style={{
            position: 'absolute',
            top: '10px',
            right: '10px',
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '8px',
            padding: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 1000,
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            color: locating ? '#2563EB' : '#1E293B'
          }}
        >
          <Crosshair size={16} className={locating ? 'animate-spin' : ''} />
        </button>

        {/* Instructions Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '8px',
            background: 'rgba(15, 23, 42, 0.82)',
            color: '#FFFFFF',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.68rem',
            fontWeight: 600,
            zIndex: 1000,
            pointerEvents: 'none',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          <MapPin size={11} /> Drag pin or click map to adjust location
        </div>
      </div>

      <div style={{ padding: '8px 12px', background: '#F8FAFC', borderTop: '1px solid #E2E8F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.76rem' }}>
        <span style={{ color: '#475569', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '5px' }}>
          <MapPin size={13} color="#2563EB" /> {addressText}
        </span>
        <span style={{ color: '#94A3B8', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
          {currentCoords[0]?.toFixed(4)}, {currentCoords[1]?.toFixed(4)}
        </span>
      </div>
    </div>
  );
}
