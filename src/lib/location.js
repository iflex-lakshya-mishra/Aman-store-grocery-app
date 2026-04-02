const buildAddress = (payload = {}) => {
  const parts = [
    payload.locality,
    payload.city,
    payload.principalSubdivision,
    payload.postcode,
    payload.countryName,
  ].filter(Boolean);
  return parts.join(', ');
};
// address formatter

const reverseGeocode = async (lat, lng) => {
  const query = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lng),
    localityLanguage: 'en',
  });

  const response = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?${query.toString()}`);
  if (!response.ok) return '';

  const data = await response.json();
  return buildAddress(data);
};
// reverse geocode

export const getOrderLocation = async () => {
  if (typeof window === 'undefined' || !window.navigator?.geolocation) {
    return { lat: null, lng: null, address: '' };
  }

  const coords = await new Promise((resolve) => {
    window.navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude),
        });
      },
      () => resolve({ lat: null, lng: null }),
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 60000 },
    );
  });

  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
    return { lat: null, lng: null, address: '' };
  }

  const address = await reverseGeocode(coords.lat, coords.lng).catch(() => '');

  return { lat: coords.lat, lng: coords.lng, address };
};
// public helper

