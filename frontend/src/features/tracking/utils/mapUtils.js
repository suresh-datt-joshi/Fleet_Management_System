import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

export const DEFAULT_MAP_CENTER = [40.7128, -74.006];
export const DEFAULT_MAP_ZOOM = 12;

export const isValidMapCoordinate = (lat, lng) => {
  const latNum = Number(lat);
  const lngNum = Number(lng);

  return (
    Number.isFinite(latNum) &&
    Number.isFinite(lngNum) &&
    latNum >= -90 &&
    latNum <= 90 &&
    lngNum >= -180 &&
    lngNum <= 180 &&
    !(latNum === 0 && lngNum === 0)
  );
};

export const createVehicleIcon = (ignition, heading = 0) =>
  L.divIcon({
    className: '',
    html: `<div style="
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: ${ignition ? '#2e7d32' : '#757575'};
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.35);
      display: flex;
      align-items: center;
      justify-content: center;
      transform: rotate(${heading}deg);
      color: white;
      font-size: 14px;
    ">▲</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });

export const fitBoundsToPoints = (map, points) => {
  if (!map || !points?.length) return;
  const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
  if (bounds.isValid()) {
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 15 });
  }
};
