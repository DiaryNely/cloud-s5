import React, { useState, useEffect } from 'react';
import { Container, Paper, Typography, Box, Grid, Card, CardContent, Button, CircularProgress, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import { getStatistiques } from '../services/signalementService';
import { getUtilisateurs } from '../services/userService';
import SyncPanel from '../components/SyncPanel';

const DashboardPage = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [userStats, setUserStats] = useState({ total: 0, actifs: 0, bloques: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [statsData, users] = await Promise.all([
        getStatistiques(),
        getUtilisateurs()
      ]);
      
      // Vérifier que statsData existe
      if (statsData && typeof statsData === 'object') {
        setStats(statsData);
      } else {
        setStats({
          enAttente: 0,
          enCours: 0,
          termine: 0,
          totalSignalements: 0
        });
      }
      
      // Vérifier que users existe et est un tableau
      if (users && Array.isArray(users)) {
        setUserStats({
          total: users.length,
          actifs: users.filter(u => !u.bloque).length,
          bloques: users.filter(u => u.bloque).length
        });
      } else {
        setUserStats({
          total: 0,
          actifs: 0,
          bloques: 0
        });
      }
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (budget) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(budget || 0);
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Alert severity="error" action={<Button onClick={loadData}>Réessayer</Button>}>
          {error}
        </Alert>
      </Container>
    );
  }

  return (
    <Box sx={{ bgcolor: '#f5f5f5', minHeight: 'calc(100vh - 64px)', py: 4 }}>
      <Container maxWidth="xl">
        <Paper elevation={3} sx={{ p: 4, mb: 4, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
          <Box display="flex" alignItems="center" mb={2}>
            <DashboardIcon sx={{ fontSize: 50, color: 'white', mr: 2 }} />
            <Typography variant="h3" sx={{ color: 'white', fontWeight: 700 }}>
              Tableau de bord Manager
            </Typography>
          </Box>
          <Typography variant="h6" sx={{ color: 'rgba(255,255,255,0.9)' }}>
            Vue d'ensemble et gestion du système
          </Typography>
        </Paper>

        {/* Panneau de synchronisation Firebase */}
        <SyncPanel />

        {/* Accès rapides */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate('/dashboard/signalements')}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <WarningAmberIcon sx={{ fontSize: 60, color: '#1976d2', mr: 3 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      Signalements
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Gérer les signalements routiers
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f44336' }}>
                        {stats?.enAttente || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Nouveaux
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#ff9800' }}>
                        {stats?.enCours || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        En cours
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                        {stats?.termine || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Terminés
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card 
              elevation={3} 
              sx={{ 
                height: '100%', 
                cursor: 'pointer',
                transition: 'transform 0.2s',
                '&:hover': { transform: 'translateY(-4px)' }
              }}
              onClick={() => navigate('/dashboard/users')}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" mb={3}>
                  <PeopleIcon sx={{ fontSize: 60, color: '#7b1fa2', mr: 3 }} />
                  <Box>
                    <Typography variant="h4" sx={{ fontWeight: 700 }}>
                      Utilisateurs
                    </Typography>
                    <Typography variant="body1" color="text.secondary">
                      Gérer les comptes utilisateurs
                    </Typography>
                  </Box>
                </Box>
                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                        {userStats.total}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Total
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#4caf50' }}>
                        {userStats.actifs}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Actifs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box textAlign="center">
                      <Typography variant="h5" sx={{ fontWeight: 700, color: '#f44336' }}>
                        {userStats.bloques}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Bloqués
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Statistiques détaillées */}
        <Paper elevation={3} sx={{ p: 3 }}>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
            Statistiques détaillées
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, bgcolor: '#e3f2fd', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {stats?.total || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Total des signalements
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, bgcolor: '#f3e5f5', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                  {stats?.surfaceTotale || 0}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Surface totale (m²)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c', fontSize: '1.8rem' }}>
                  {formatBudget(stats?.budgetTotal)}
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Budget total
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6} md={3}>
              <Box sx={{ p: 3, bgcolor: '#fff3e0', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h3" sx={{ fontWeight: 700, color: '#f57c00' }}>
                  {stats?.pourcentageAvancement || 0}%
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                  Avancement global
                </Typography>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Container>
    </Box>
  );
};

export default DashboardPage;
