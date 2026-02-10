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

// Icônes colorées selon le statut
function createColoredIcon(color) {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
}

const STATUS_ICONS = {
  NOUVEAU: createColoredIcon("red"),
  EN_COURS: createColoredIcon("orange"),
  TERMINE: createColoredIcon("green")
};
const DEFAULT_ICON = createColoredIcon("blue");

function getStatusIcon(status) {
  return STATUS_ICONS[status] || DEFAULT_ICON;
}

function getStatusLabel(status) {
  if (status === "NOUVEAU") return "🔴 Nouveau";
  if (status === "EN_COURS") return "🟠 En cours";
  if (status === "TERMINE") return "🟢 Terminé";
  return status;
}

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
          <Marker key={item.id} position={[item.lat, item.lng]} icon={getStatusIcon(item.status)}>
            <Popup>
              <strong>{item.title}</strong>
              <div>Date: {item.date}</div>
              <div>Statut: {getStatusLabel(item.status)}</div>
              {item.niveau != null && <div>Niveau: <strong style={{ color: item.niveau <= 3 ? '#27ae60' : item.niveau <= 6 ? '#f39c12' : '#e74c3c' }}>{item.niveau}/10</strong></div>}
              <div>Surface: {item.surface} m²</div>
              <div>Budget: {item.budget?.toLocaleString()} Ar</div>
              <div>Entreprise: {item.company || "—"}</div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
