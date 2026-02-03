import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
  Card,
  CardContent,
  Grid,
  CircularProgress
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { getMesSignalements, getStatutLabel, getStatutColor } from '../services/signalementService';
import AddIcon from '@mui/icons-material/Add';
import MapComponent from '../components/MapComponent';

const UserSignalementsPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [userSignalements, setUserSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSignalements();
  }, [user]);

  const loadSignalements = async () => {
    try {
      const data = await getMesSignalements();
      setUserSignalements(data);
    } catch (error) {
      console.error('Erreur chargement signalements:', error);
    } finally {
      setLoading(false);
    }
  };

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

  const stats = {
    total: userSignalements.length,
    nouveaux: userSignalements.filter(s => s.statut === 'nouveau').length,
    enCours: userSignalements.filter(s => s.statut === 'en_cours').length,
    termines: userSignalements.filter(s => s.statut === 'termine').length
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)' }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            Mes signalements
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            {user.prenom} {user.nom}
          </Typography>
        </Paper>

        {/* Statistiques */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Total de mes signalements
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                  {stats.nouveaux}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Nouveaux
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {stats.enCours}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  En cours
                </Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Card elevation={2}>
              <CardContent>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  {stats.termines}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Terminés
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Carte avec mes signalements */}
        {userSignalements.length > 0 && (
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
              Carte de mes signalements
            </Typography>
            <MapComponent signalements={userSignalements} />
          </Paper>
        )}

        {/* Liste des signalements */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{ fontWeight: 600 }}>
              Liste de mes signalements
            </Typography>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/user/create')}
            >
              Créer un signalement
            </Button>
          </Box>

          {userSignalements.length === 0 ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <Typography variant="h6" color="text.secondary" gutterBottom>
                Vous n'avez pas encore créé de signalement
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Commencez par signaler un problème routier dans votre quartier
              </Typography>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/user/create')}
              >
                Créer mon premier signalement
              </Button>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                    <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Description</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Surface</TableCell>
                    <TableCell sx={{ fontWeight: 600 }}>Budget estimé</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {userSignalements.map((signalement) => (
                    <TableRow key={signalement.id} hover>
                      <TableCell>{formatDate(signalement.dateCreation)}</TableCell>
                      <TableCell>{signalement.localisation}</TableCell>
                      <TableCell>{signalement.description}</TableCell>
                      <TableCell>
                        <Chip
                          label={getStatutLabel(signalement.statut)}
                          size="small"
                          sx={{
                            backgroundColor: getStatutColor(signalement.statut),
                            color: 'white',
                            fontWeight: 600
                          }}
                        />
                      </TableCell>
                      <TableCell>{signalement.surface} m²</TableCell>
                      <TableCell>{formatBudget(signalement.budgetEstime)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Paper>
      </Container>
    </Box>
  );
};

export default UserSignalementsPage;
