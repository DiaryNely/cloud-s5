import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Grid, 
  Card, 
  CardContent,
  CircularProgress
} from '@mui/material';
import { getSignalements, getStatistiques } from '../services/signalementService';
import MapComponent from '../components/MapComponent';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import BuildIcon from '@mui/icons-material/Build';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TimelineIcon from '@mui/icons-material/Timeline';
import SquareFootIcon from '@mui/icons-material/SquareFoot';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';

const HomePage = () => {
  const [stats, setStats] = useState({
    nouveaux: 0,
    enCours: 0,
    termines: 0,
    totalSignalements: 0,
    surfaceTotale: 0,
    budgetTotal: 0,
    pourcentageAvancement: 0
  });
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [sigData, statsData] = await Promise.all([
        getSignalements(),
        getStatistiques()
      ]);
      setSignalements(sigData || []);
      
      // Vérifier si statsData existe et a les bonnes propriétés
      if (statsData && typeof statsData === 'object') {
        setStats({
          nouveaux: statsData.nouveaux || 0,
          enCours: statsData.enCours || 0,
          termines: statsData.termines || 0,
          totalSignalements: statsData.totalSignalements || 0,
          surfaceTotale: statsData.surfaceTotale || 0,
          budgetTotal: statsData.budgetTotal || 0,
          pourcentageAvancement: statsData.pourcentageAvancement || 0
        });
      }
    } catch (error) {
      console.error('Erreur chargement données:', error);
      // Garder les valeurs par défaut en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(budget);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 4 }}>
      <Container maxWidth="xl">
        {/* En-tête */}
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)' }}>
          <Typography variant="h3" gutterBottom sx={{ color: 'white', fontWeight: 700 }}>
            Suivi des Travaux Routiers
          </Typography>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Ville d'Antananarivo - Vue d'ensemble
          </Typography>
        </Paper>

        {/* Statistiques globales */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6} lg={3}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <WarningAmberIcon sx={{ fontSize: 40, color: '#f44336', mr: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Nouveaux
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f44336' }}>
                  {stats.nouveaux}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Signalements en attente
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <BuildIcon sx={{ fontSize: 40, color: '#ff9800', mr: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    En cours
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#ff9800' }}>
                  {stats.enCours}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Travaux en progression
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <CheckCircleIcon sx={{ fontSize: 40, color: '#4caf50', mr: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Terminés
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#4caf50' }}>
                  {stats.termines}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Travaux achevés
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6} lg={3}>
            <Card elevation={2} sx={{ height: '100%' }}>
              <CardContent>
                <Box display="flex" alignItems="center" mb={2}>
                  <TimelineIcon sx={{ fontSize: 40, color: '#2196f3', mr: 2 }} />
                  <Typography variant="h6" color="text.secondary">
                    Avancement
                  </Typography>
                </Box>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#2196f3' }}>
                  {stats.pourcentageAvancement}%
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Taux de complétion
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tableau récapitulatif */}
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Récapitulatif global
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e3f2fd', borderRadius: 2 }}>
                <WarningAmberIcon sx={{ fontSize: 50, color: '#1976d2', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {stats.totalSignalements}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Total des signalements
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f3e5f5', borderRadius: 2 }}>
                <SquareFootIcon sx={{ fontSize: 50, color: '#7b1fa2', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                  {formatNumber(stats.surfaceTotale)} m²
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Surface totale concernée
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#e8f5e9', borderRadius: 2 }}>
                <AttachMoneyIcon sx={{ fontSize: 50, color: '#388e3c', mb: 1 }} />
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c', fontSize: '1.5rem' }}>
                  {formatBudget(stats.budgetTotal)}
                </Typography>
                <Typography variant="body1" color="text.secondary">
                  Budget total estimé
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>

        {/* Carte */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Carte des signalements - Antananarivo
          </Typography>
          <Box sx={{ mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 20, bgcolor: '#f44336', borderRadius: '50%', mr: 1 }} />
              <Typography variant="body2">Nouveau</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 20, bgcolor: '#ff9800', borderRadius: '50%', mr: 1 }} />
              <Typography variant="body2">En cours</Typography>
            </Box>
            <Box display="flex" alignItems="center">
              <Box sx={{ width: 20, height: 20, bgcolor: '#4caf50', borderRadius: '50%', mr: 1 }} />
              <Typography variant="body2">Terminé</Typography>
            </Box>
          </Box>
          <MapComponent signalements={signalements} />
        </Paper>
      </Container>
    </Box>
  );
};

export default HomePage;
