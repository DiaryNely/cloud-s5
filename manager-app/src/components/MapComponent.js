import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { Box, Typography, Chip } from '@mui/material';
import { getStatutLabel, getStatutColor } from '../services/signalementService';

// Fix pour les icônes Leaflet avec React
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Créer des icônes personnalisées par statut
const createCustomIcon = (color) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div style="background-color: ${color}; width: 25px; height: 25px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 5px rgba(0,0,0,0.3);"></div>`,
    iconSize: [25, 25],
    iconAnchor: [12, 12]
  });
};

const MapComponent = ({ signalements }) => {
  const center = [-18.8792, 47.5079]; // Centre d'Antananarivo

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', { 
      day: '2-digit', 
      month: '2-digit', 
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(budget);
  };

  return (
    <MapContainer 
      center={center} 
      zoom={13} 
      style={{ height: '600px', width: '100%', borderRadius: '8px' }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {signalements.map((signalement) => (
        <Marker 
          key={signalement.id}
          position={[signalement.latitude, signalement.longitude]}
          icon={createCustomIcon(getStatutColor(signalement.statut))}
        >
          <Popup maxWidth={350}>
            <Box sx={{ p: 1 }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#1976d2' }}>
                {signalement.localisation}
              </Typography>
              
              <Chip 
                label={getStatutLabel(signalement.statut)}
                size="small"
                sx={{ 
                  mb: 2,
                  backgroundColor: getStatutColor(signalement.statut),
                  color: 'white',
                  fontWeight: 600
                }}
              />
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Description:</strong> {signalement.description}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Date de création:</strong> {formatDate(signalement.dateCreation)}
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Surface concernée:</strong> {signalement.surface} m²
              </Typography>
              
              <Typography variant="body2" sx={{ mb: 1 }}>
                <strong>Budget estimé:</strong> {formatBudget(signalement.budgetEstime)}
              </Typography>
              
              {signalement.entreprise && (
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>Entreprise:</strong> {signalement.entreprise}
                </Typography>
              )}
              
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.85rem' }}>
                Signalé par: {signalement.creePar}
              </Typography>
            </Box>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapComponent;
