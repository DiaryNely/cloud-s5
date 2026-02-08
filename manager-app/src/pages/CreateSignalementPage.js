import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  TextField,
  Button,
  Alert,
  Grid,
  InputAdornment,
  Stepper,
  Step,
  StepLabel,
  CircularProgress
} from '@mui/material';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { useAuth } from '../context/AuthContext';
import { createSignalement } from '../services/signalementService';
import AddLocationIcon from '@mui/icons-material/AddLocation';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import DescriptionIcon from '@mui/icons-material/Description';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import NavigateBeforeIcon from '@mui/icons-material/NavigateBefore';

// Icône personnalisée pour le marqueur
const customIcon = L.divIcon({
  className: 'custom-marker',
  html: `<div style="background-color: #f44336; width: 30px; height: 30px; border-radius: 50%; border: 4px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.4);"></div>`,
  iconSize: [30, 30],
  iconAnchor: [15, 15]
});

// Composant pour gérer les clics sur la carte
function LocationMarker({ position, setPosition }) {
  useMapEvents({
    click(e) {
      setPosition({
        latitude: e.latlng.lat.toFixed(6),
        longitude: e.latlng.lng.toFixed(6)
      });
    },
  });

  return position.latitude && position.longitude ? (
    <Marker 
      position={[parseFloat(position.latitude), parseFloat(position.longitude)]} 
      icon={customIcon}
    />
  ) : null;
}

const CreateSignalementPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeStep, setActiveStep] = useState(0);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    localisation: '',
    latitude: '',
    longitude: '',
    description: '',
    surface: '',
    budgetEstime: ''
  });

  const steps = ['Localisation sur la carte', 'Détails du signalement'];

  const handleMapPosition = (position) => {
    setFormData({
      ...formData,
      latitude: position.latitude,
      longitude: position.longitude
    });
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleNext = () => {
    if (activeStep === 0) {
      if (!formData.latitude || !formData.longitude) {
        alert('Veuillez sélectionner un emplacement sur la carte');
        return;
      }
    }
    setActiveStep((prevStep) => prevStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    
    // Validation simple
    if (!formData.localisation || !formData.latitude || !formData.longitude || !formData.description) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires');
      return;
    }

    setLoading(true);

    try {
      const signalementData = {
        localisation: formData.localisation,
        latitude: parseFloat(formData.latitude),
        longitude: parseFloat(formData.longitude),
        description: formData.description,
        surface: parseFloat(formData.surface) || 0,
        budgetEstime: parseFloat(formData.budgetEstime) || 0
      };

      await createSignalement(signalementData);

      setSuccessMessage('Signalement créé avec succès !');
    
      // Réinitialiser le formulaire
      setFormData({
        localisation: '',
        latitude: '',
        longitude: '',
        description: '',
        surface: '',
        budgetEstime: ''
      });

      // Rediriger après 2 secondes
      setTimeout(() => {
        navigate('/user/signalements');
      }, 2000);
    } catch (error) {
      console.error('Erreur création signalement:', error);
      setErrorMessage(error.response?.data?.message || 'Erreur lors de la création du signalement');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="lg">
        <Paper elevation={3} sx={{ p: 4, mb: 3 }}>
          <Box display="flex" alignItems="center" mb={3}>
            <AddLocationIcon sx={{ fontSize: 50, color: '#1976d2', mr: 2 }} />
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 700 }}>
                Créer un signalement
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Signalez un problème routier à Antananarivo
              </Typography>
            </Box>
          </Box>

          <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {successMessage && (
            <Alert severity="success" sx={{ mb: 3 }}>
              {successMessage}
            </Alert>
          )}

          {activeStep === 0 && (
            <Box>
              <Alert severity="info" sx={{ mb: 3 }}>
                <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                  Étape 1 : Sélectionnez l'emplacement sur la carte
                </Typography>
                <Typography variant="body2">
                  Cliquez sur la carte pour placer un marqueur à l'emplacement du problème routier.
                  Les coordonnées seront automatiquement remplies.
                </Typography>
              </Alert>

              <Paper elevation={2} sx={{ p: 3, mb: 3, bgcolor: '#e3f2fd' }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Latitude"
                      name="latitude"
                      value={formData.latitude}
                      onChange={handleChange}
                      InputProps={{
                        readOnly: true,
                        style: { fontWeight: 600, fontSize: '1.1rem' }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Longitude"
                      name="longitude"
                      value={formData.longitude}
                      onChange={handleChange}
                      InputProps={{
                        readOnly: true,
                        style: { fontWeight: 600, fontSize: '1.1rem' }
                      }}
                    />
                  </Grid>
                </Grid>
              </Paper>

              <Paper elevation={2} sx={{ borderRadius: 2, overflow: 'hidden', mb: 3 }}>
                <MapContainer
                  center={[-18.8792, 47.5079]}
                  zoom={13}
                  style={{ height: '500px', width: '100%' }}
                >
                  <TileLayer
                    attribution='&copy; TileServer GL'
                    url="http://localhost:8081/styles/basic-preview/{z}/{x}/{y}.png"
                  />
                  <LocationMarker 
                    position={formData} 
                    setPosition={handleMapPosition}
                  />
                </MapContainer>
              </Paper>

              <Box display="flex" justifyContent="flex-end">
                <Button
                  variant="contained"
                  onClick={handleNext}
                  endIcon={<NavigateNextIcon />}
                  size="large"
                  disabled={!formData.latitude || !formData.longitude}
                >
                  Suivant
                </Button>
              </Box>
            </Box>
          )}

          {activeStep === 1 && (
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Alert severity="success" sx={{ mb: 2 }}>
                    <Typography variant="body2">
                      Position sélectionnée : <strong>{formData.latitude}, {formData.longitude}</strong>
                    </Typography>
                  </Alert>
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Localisation / Adresse"
                    name="localisation"
                    value={formData.localisation}
                    onChange={handleChange}
                    required
                    placeholder="Ex: Avenue de l'Indépendance, Analakely"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AddLocationIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Description du problème"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    multiline
                    rows={4}
                    placeholder="Décrivez le problème routier en détail..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <DescriptionIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Surface concernée (m²)"
                    name="surface"
                    type="number"
                    value={formData.surface}
                    onChange={handleChange}
                    placeholder="100"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SquareFootIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Optionnel - estimation de la surface"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Budget estimé (MGA)"
                    name="budgetEstime"
                    type="number"
                    value={formData.budgetEstime}
                    onChange={handleChange}
                    placeholder="30000000"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <AttachMoneyIcon color="action" />
                        </InputAdornment>
                      ),
                    }}
                    helperText="Optionnel - estimation du coût"
                  />
                </Grid>

                <Grid item xs={12}>
                  <Box display="flex" gap={2} justifyContent="space-between">
                    <Button
                      variant="outlined"
                      size="large"
                      onClick={handleBack}
                      startIcon={<NavigateBeforeIcon />}
                    >
                      Retour
                    </Button>
                    <Box display="flex" gap={2}>
                      <Button
                        variant="outlined"
                        size="large"
                        onClick={() => navigate('/user/signalements')}
                      >
                        Annuler
                      </Button>
                      <Button
                        type="submit"
                        variant="contained"
                        size="large"
                        startIcon={<AddLocationIcon />}
                      >
                        Créer le signalement
                      </Button>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </form>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default CreateSignalementPage;
