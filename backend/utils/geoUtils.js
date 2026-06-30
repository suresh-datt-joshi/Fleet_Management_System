const EARTH_RADIUS_M = 6371000;

export const toRadians = (deg) => (deg * Math.PI) / 180;

export const haversineDistance = (lng1, lat1, lng2, lat2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  return EARTH_RADIUS_M * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

export const isPointInCircle = (pointLng, pointLat, centerLng, centerLat, radiusMeters) =>
  haversineDistance(pointLng, pointLat, centerLng, centerLat) <= radiusMeters;

export const isPointInPolygon = (pointLng, pointLat, polygonCoords) => {
  if (!polygonCoords?.[0]?.length) return false;

  const ring = polygonCoords[0];
  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i, i += 1) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];

    const intersect =
      yi > pointLat !== yj > pointLat &&
      pointLng < ((xj - xi) * (pointLat - yi)) / (yj - yi + Number.EPSILON) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
};

export const isPointInGeofence = (lng, lat, geofence) => {
  if (geofence.type === 'circle') {
    const [centerLng, centerLat] = geofence.center?.coordinates || [0, 0];
    return isPointInCircle(lng, lat, centerLng, centerLat, geofence.radius || 500);
  }

  if (geofence.type === 'polygon' && geofence.polygon?.coordinates) {
    return isPointInPolygon(lng, lat, geofence.polygon.coordinates);
  }

  return false;
};

export const generateMockMovement = (currentLng, currentLat, speedKmh) => {
  const speedMs = (speedKmh * 1000) / 3600;
  const heading = Math.random() * 360;
  const distance = speedMs * 10;
  const headingRad = toRadians(heading);

  const dLat = (distance * Math.cos(headingRad)) / EARTH_RADIUS_M;
  const dLng = (distance * Math.sin(headingRad)) / (EARTH_RADIUS_M * Math.cos(toRadians(currentLat)));

  return {
    lng: currentLng + (dLng * 180) / Math.PI,
    lat: currentLat + (dLat * 180) / Math.PI,
    heading,
  };
};

export default {
  haversineDistance,
  isPointInCircle,
  isPointInPolygon,
  isPointInGeofence,
  generateMockMovement,
};
