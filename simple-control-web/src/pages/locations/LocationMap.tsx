import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Circle, useMapEvents, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

// Fix for default marker icon in Vite (as per user request: no CDN)
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng,
});

interface LocationMapProps {
  latitude: number;
  longitude: number;
  radiusMeters: number;
  onLocationSelect: (lat: number, lng: number) => void;
}

// MapEvents component to handle clicks and center changes
function MapEvents({ onLocationSelect }: { onLocationSelect: (lat: number, lng: number) => void }) {
  useMapEvents({
    click(e) {
      onLocationSelect(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

// Component to recenter map when latitude/longitude props change
function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

export default function LocationMap({ latitude, longitude, radiusMeters, onLocationSelect }: LocationMapProps) {
  const draggable = true;

  return (
    <div style={{ height: '100%', width: '100%', position: 'relative' }}>
      <MapContainer 
        center={[latitude, longitude]} 
        zoom={13} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapEvents onLocationSelect={onLocationSelect} />
        <MapRecenter lat={latitude} lng={longitude} />
        
        <Marker 
          position={[latitude, longitude]} 
          draggable={draggable}
          eventHandlers={{
            dragend: (e) => {
              const marker = e.target;
              const position = marker.getLatLng();
              onLocationSelect(position.lat, position.lng);
            },
          }}
        />
        
        {radiusMeters > 0 && (
          <Circle 
            center={[latitude, longitude]}
            pathOptions={{ color: 'var(--color-primary)', fillColor: 'var(--color-primary)' }}
            radius={radiusMeters}
          />
        )}
      </MapContainer>
    </div>
  );
}
