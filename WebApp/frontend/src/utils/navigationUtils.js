/**
 * Launches live GPS turn-by-turn navigation directly from the user's current live location
 * to the destination parking facility, eliminating location search prompts.
 */
export const launchLiveGpsNavigation = ({ latitude, longitude, locationName, userCoords }) => {
  const destStr = (latitude !== undefined && longitude !== undefined && latitude !== null && longitude !== null)
    ? `${latitude},${longitude}`
    : encodeURIComponent(locationName || '');

  if (!destStr) return;

  const openMapsWithOrigin = (originLat, originLng) => {
    let url = `https://www.google.com/maps/dir/?api=1&destination=${destStr}&travelmode=driving`;
    if (originLat && originLng) {
      url += `&origin=${originLat},${originLng}`;
    } else {
      url += `&origin=Current+Location`;
    }
    window.open(url, '_blank');
  };

  if (userCoords?.latitude && userCoords?.longitude) {
    openMapsWithOrigin(userCoords.latitude, userCoords.longitude);
    return;
  }

  if (typeof navigator !== 'undefined' && navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        if (pos?.coords?.latitude && pos?.coords?.longitude) {
          openMapsWithOrigin(pos.coords.latitude, pos.coords.longitude);
        } else {
          openMapsWithOrigin(null, null);
        }
      },
      (err) => {
        console.warn("Live GPS position retrieval fallback to Current Location:", err);
        openMapsWithOrigin(null, null);
      },
      { timeout: 6000, enableHighAccuracy: true }
    );
  } else {
    openMapsWithOrigin(null, null);
  }
};
