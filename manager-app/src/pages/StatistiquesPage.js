import React, { useState, useEffect } from 'react';
import {
  Container,
  Paper,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  LinearProgress,
  Alert,
  CircularProgress,
  Divider
} from '@mui/material';
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import TimelineIcon from '@mui/icons-material/Timeline';
import AssessmentIcon from '@mui/icons-material/Assessment';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import ScheduleIcon from '@mui/icons-material/Schedule';
import {
  getSignalements,
  getStatistiques,
  getStatutLabel,
  getStatutColor,
  getAvancementFromStatut,
  calculerDureeTraitement
} from '../services/signalementService';

const COLORS = {
  nouveau: '#f44336',
  en_cours: '#ff9800',
  termine: '#4caf50',
  planifie: '#2196f3'
};

const StatistiquesPage = () => {
  const [signalements, setSignalements] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sigData, statsData] = await Promise.all([
        getSignalements(),
        getStatistiques()
      ]);
      setSignalements(sigData);
      setStats(statsData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatBudget = (budget) => {
    if (!budget) return '0 MGA';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'MGA',
      minimumFractionDigits: 0
    }).format(budget);
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  // Données pour le graphique en camembert
  const pieChartData = stats ? [
    { name: 'Nouveaux', value: Number(stats.nouveaux) || 0, color: COLORS.nouveau },
    { name: 'En cours', value: Number(stats.enCours) || 0, color: COLORS.en_cours },
    { name: 'Terminés', value: Number(stats.termines || stats.termine) || 0, color: COLORS.termine }
  ].filter(d => d.value > 0) : [];

  // Données pour le graphique en barres (budget par statut)
  const budgetParStatut = () => {
    const grouped = signalements.reduce((acc, sig) => {
      const statut = sig.statut || 'nouveau';
      if (!acc[statut]) {
        acc[statut] = { budget: 0, surface: 0, count: 0 };
      }
      acc[statut].budget += Number(sig.budgetEstime) || 0;
      acc[statut].surface += Number(sig.surface) || 0;
      acc[statut].count += 1;
      return acc;
    }, {});

    return Object.entries(grouped).map(([statut, data]) => ({
      statut: getStatutLabel(statut),
      budget: data.budget / 1000000, // En millions
      surface: data.surface,
      count: data.count
    }));
  };

  // Calcul des métriques de traitement
  const calculerMetriquesTraitement = () => {
    const termines = signalements.filter(s => s.statut === 'termine');
    const enCours = signalements.filter(s => s.statut === 'en_cours');
    
    let dureeMoyenne = null;
    if (termines.length > 0) {
      const durees = termines
        .filter(s => s.dateDebutTravaux && s.dateFinTravaux)
        .map(s => {
          const debut = new Date(s.dateDebutTravaux);
          const fin = new Date(s.dateFinTravaux);
          return (fin - debut) / (1000 * 60 * 60 * 24); // en jours
        });
      
      if (durees.length > 0) {
        dureeMoyenne = durees.reduce((a, b) => a + b, 0) / durees.length;
      }
    }

    const avancementMoyen = signalements.length > 0
      ? signalements.reduce((sum, s) => sum + (s.avancement || getAvancementFromStatut(s.statut)), 0) / signalements.length
      : 0;

    return {
      dureeMoyenne: dureeMoyenne ? dureeMoyenne.toFixed(1) : '-',
      avancementMoyen: avancementMoyen.toFixed(0),
      terminesCount: termines.length,
      enCoursCount: enCours.length
    };
  };

  const metriques = calculerMetriquesTraitement();

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <AssessmentIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Statistiques de Traitement
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Cartes de métriques principales */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TrendingUpIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Avancement Global</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {metriques.avancementMoyen}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={Number(metriques.avancementMoyen)} 
                sx={{ 
                  mt: 2, 
                  height: 8, 
                  borderRadius: 4,
                  backgroundColor: 'rgba(255,255,255,0.3)',
                  '& .MuiLinearProgress-bar': { backgroundColor: 'white' }
                }} 
              />
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <ScheduleIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Durée Moyenne</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {metriques.dureeMoyenne}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                jours de traitement
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <TimelineIcon sx={{ mr: 1 }} />
                <Typography variant="body2">En Cours</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {metriques.enCoursCount}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                travaux actifs
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <AssessmentIcon sx={{ mr: 1 }} />
                <Typography variant="body2">Terminés</Typography>
              </Box>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {metriques.terminesCount}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                travaux complétés
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Graphiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        {/* Répartition par statut */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Répartition par Statut
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>

        {/* Budget par statut */}
        <Grid item xs={12} md={6}>
          <Paper elevation={3} sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
              Budget par Statut (en millions MGA)
            </Typography>
            <Box sx={{ height: 300 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={budgetParStatut()}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="statut" />
                  <YAxis />
                  <Tooltip formatter={(value) => `${value.toFixed(1)} M MGA`} />
                  <Legend />
                  <Bar dataKey="budget" name="Budget" fill="#1976d2" />
                </BarChart>
              </ResponsiveContainer>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      {/* Tableau détaillé des travaux */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Détail des Travaux avec Avancement
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Avancement</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date Création</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Début Travaux</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Fin Travaux</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Durée</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signalements.map((sig) => {
                const avancement = sig.avancement || getAvancementFromStatut(sig.statut);
                const duree = calculerDureeTraitement(sig.dateDebutTravaux, sig.dateFinTravaux);
                
                return (
                  <TableRow key={sig.id} hover>
                    <TableCell>#{sig.id}</TableCell>
                    <TableCell>{sig.localisation}</TableCell>
                    <TableCell>
                      <Chip
                        label={getStatutLabel(sig.statut)}
                        size="small"
                        sx={{
                          backgroundColor: getStatutColor(sig.statut),
                          color: 'white',
                          fontWeight: 600
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LinearProgress
                          variant="determinate"
                          value={avancement}
                          sx={{ 
                            width: 60, 
                            height: 8, 
                            borderRadius: 4,
                            backgroundColor: '#e0e0e0',
                            '& .MuiLinearProgress-bar': {
                              backgroundColor: avancement === 100 ? '#4caf50' : 
                                             avancement === 50 ? '#ff9800' : '#f44336'
                            }
                          }}
                        />
                        <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 35 }}>
                          {avancement}%
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{formatDate(sig.dateCreation)}</TableCell>
                    <TableCell>{formatDate(sig.dateDebutTravaux)}</TableCell>
                    <TableCell>{formatDate(sig.dateFinTravaux)}</TableCell>
                    <TableCell>
                      {duree || '-'}
                    </TableCell>
                    <TableCell>{formatBudget(sig.budgetEstime)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Résumé financier */}
      <Paper elevation={3} sx={{ p: 3, mt: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
          Résumé Financier
        </Typography>
        <Divider sx={{ mb: 2 }} />
        <Grid container spacing={3}>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">Budget Total</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#1976d2' }}>
                {formatBudget(stats?.budgetTotal)}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">Surface Totale</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#7b1fa2' }}>
                {stats?.surfaceTotale?.toLocaleString('fr-FR') || 0} m²
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} sm={4}>
            <Box sx={{ textAlign: 'center', p: 2 }}>
              <Typography variant="body2" color="text.secondary">Nombre de Signalements</Typography>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#388e3c' }}>
                {stats?.totalSignalements || stats?.total || 0}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Container>
  );
};

export default StatistiquesPage;
