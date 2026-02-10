import React, { useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix pour les icônes Leaflet avec Vite
delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png"
});

const DEFAULT_CENTER = [-18.8792, 47.5079];

function LocationPicker({ enabled, onPick }) {
  useMapEvents({
    click(event) {
      if (!enabled || !onPick) return;
      onPick({ lat: event.latlng.lat, lng: event.latlng.lng });
    }
  });
  return null;
}

export default function MapView({ markers = [], selectable = false, selectedPosition, onSelect }) {
  const tileUrl = import.meta.env.VITE_TILE_URL || "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
  const tiles = useMemo(() => tileUrl, [tileUrl]);

  return (
    <div className="map">
      <MapContainer center={DEFAULT_CENTER} zoom={13} scrollWheelZoom style={{ height: "100%" }}>
        <TileLayer url={tiles} attribution="&copy; OpenStreetMap contributors" />
        <LocationPicker enabled={selectable} onPick={onSelect} />
        {selectedPosition && (
          <Marker position={[selectedPosition.lat, selectedPosition.lng]}>
            <Popup>Localisation sélectionnée</Popup>
          </Marker>
        )}
        {markers.map((item) => (
          <Marker key={item.id} position={[item.lat, item.lng]}>
            <Popup>
              <strong>{item.title}</strong>
              <div>Date: {item.date}</div>
              <div>Statut: {item.status}</div>
              <div>Surface: {item.surface} m²</div>
              <div>Budget: {item.budget} Ar</div>
              <div>Entreprise: {item.company}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
