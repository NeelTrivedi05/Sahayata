import { useState, useCallback } from 'react';

/**
 * Custom React Hook for browser Location Access (GPS) + Reverse Geocoding
 */
export function useGeolocation() {
  const [coords, setCoords] = useState(null); // [lat, lng]
  const [accuracyMeters, setAccuracyMeters] = useState(null);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser.');
      return;
    }

    setLoading(true);
    setError(null);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        const accuracy = Math.round(position.coords.accuracy);

        setCoords([lat, lng]);
        setAccuracyMeters(accuracy);

        // Reverse geocoding via OpenStreetMap Nominatim
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`,
            {
              headers: {
                'Accept-Language': 'en'
              }
            }
          );
          if (res.ok) {
            const data = await res.json();
            // Format a clean, concise Indian address
            const addr = data.address || {};
            const road = addr.road || addr.pedestrian || addr.suburb || '';
            const neighbourhood = addr.neighbourhood || addr.residential || '';
            const city = addr.city || addr.town || addr.state_district || 'Mumbai';
            const postcode = addr.postcode ? ` - ${addr.postcode}` : '';

            const formatted = [road, neighbourhood, city].filter(Boolean).join(', ') + postcode;
            setAddress(formatted || data.display_name || `${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          } else {
            setAddress(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
          }
        } catch (e) {
          setAddress(`${lat.toFixed(4)}° N, ${lng.toFixed(4)}° E`);
        } finally {
          setLoading(false);
        }
      },
      (err) => {
        setLoading(false);
        if (err.code === err.PERMISSION_DENIED) {
          setError('Location access was denied. Please allow GPS permission in your browser URL bar.');
        } else if (err.code === err.POSITION_UNAVAILABLE) {
          setError('GPS position is currently unavailable.');
        } else if (err.code === err.TIMEOUT) {
          setError('Location request timed out. Please try again.');
        } else {
          setError('Unable to acquire GPS location.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0
      }
    );
  }, []);

  return {
    coords,
    setCoords,
    accuracyMeters,
    address,
    setAddress,
    loading,
    error,
    requestLocation
  };
}
