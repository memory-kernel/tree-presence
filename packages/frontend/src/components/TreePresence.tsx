import { useEffect, useRef } from 'react';
import L from 'leaflet';
import { CELOSCAN, shortAddr } from '../utils';

type Props = {
  description?: string;
  latitude?: string;
  longitude?: string;
  type?: string;
  id: number;
  owner: string;
};

export function TreePresence({ description, latitude, longitude, type, id, owner }: Props) {
  const mapRef = useRef<HTMLDivElement>(null);
  const hasLocation = latitude && longitude;

  useEffect(() => {
    if (!hasLocation || !mapRef.current) return;
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    if (isNaN(lat) || isNaN(lng)) return;

    const map = L.map(mapRef.current, {
      zoomControl: false,
      dragging: false,
      touchZoom: false,
      scrollWheelZoom: false,
      doubleClickZoom: false,
      boxZoom: false,
      keyboard: false,
      attributionControl: true,
    }).setView([lat, lng], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '\u00a9 OpenStreetMap',
    }).addTo(map);

    L.circleMarker([lat, lng], {
      radius: 8,
      fillColor: '#3a7d2a',
      color: '#265c1a',
      weight: 2,
      fillOpacity: 0.9,
    }).addTo(map);

    return () => { map.remove(); };
  }, [latitude, longitude, hasLocation]);

  return (
    <div className="tree-presence">
      {description && (
        <p className="tree-presence-description">{description}</p>
      )}
      <div className="tree-presence-meta">
        {hasLocation && (
          <span className="tree-meta-item">
            {latitude}, {longitude}
          </span>
        )}
        <span className="tree-meta-item">
          {type || 'anchor'} &middot; ERC-8004 #{id}
        </span>
        <span className="tree-meta-item">
          planted by{' '}
          <a href={`${CELOSCAN}/address/${owner}`} target="_blank" rel="noopener noreferrer">
            {shortAddr(owner)}
          </a>
        </span>
      </div>
      {hasLocation && (
        <>
          <div ref={mapRef} className="tree-map" />
          <div className="tree-map-links">
            <a
              href={`https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=16/${latitude}/${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              OpenStreetMap
            </a>
            <span className="tree-map-links-sep">&middot;</span>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google Maps
            </a>
          </div>
        </>
      )}
    </div>
  );
}
