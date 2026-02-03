import React, { useState, useEffect } from 'react';
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
  Alert,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  getSignalements, 
  updateSignalement, 
  getHistorique, 
  getStatutLabel, 
  getStatutColor 
} from '../services/signalementService';
import { getEntreprises } from '../services/userService';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import CircleIcon from '@mui/icons-material/Circle';

const SignalementsPage = () => {
  const [signalements, setSignalements] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [historique, setHistorique] = useState([]);
  const [editForm, setEditForm] = useState({});
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [sigData, entData] = await Promise.all([
        getSignalements(),
        getEntreprises()
      ]);
      setSignalements(sigData);
      setEntreprises(entData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (signalement) => {
    setSelectedSignalement(signalement);
    setEditForm({
      statut: signalement.statut,
      surface: signalement.surface,
      budgetEstime: signalement.budgetEstime,
      entreprise: signalement.entreprise || ''
    });
    setOpenEditDialog(true);
    setSuccessMessage('');
  };

  const handleCloseEdit = () => {
    setOpenEditDialog(false);
    setSelectedSignalement(null);
    setEditForm({});
  };

  const handleSaveEdit = async () => {
    try {
      await updateSignalement(selectedSignalement.id, editForm);
      await loadData();
      setSuccessMessage(`Signalement #${selectedSignalement.id} mis à jour avec succès !`);
      handleCloseEdit();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
    }
  };

  const handleOpenHistory = async (signalement) => {
    try {
      const hist = await getHistorique(signalement.id);
      setHistorique(hist);
      setSelectedSignalement(signalement);
      setOpenHistoryDialog(true);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
    }
  };

  const handleCloseHistory = () => {
    setOpenHistoryDialog(false);
    setSelectedSignalement(null);
    setHistorique([]);
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
    total: signalements.length,
    nouveaux: signalements.filter(s => s.statut === 'nouveau').length,
    enCours: signalements.filter(s => s.statut === 'en_cours').length,
    termines: signalements.filter(s => s.statut === 'termine').length,
    surfaceTotale: signalements.reduce((acc, s) => acc + (s.surface || 0), 0),
    budgetTotal: signalements.reduce((acc, s) => acc + (s.budgetEstime || 0), 0)
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 4 }}>
        Gestion des Signalements
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Statistiques */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                {stats.total}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
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
        <Grid item xs={12} sm={6} md={2.4}>
          <Card>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#7b1fa2', fontSize: '1.5rem' }}>
                {formatBudget(stats.budgetTotal)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Budget total
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des signalements */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Liste des signalements
        </Typography>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>ID</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Localisation</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Surface</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entreprise</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date création</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signalements.map((signalement) => (
                <TableRow key={signalement.id} hover>
                  <TableCell>#{signalement.id}</TableCell>
                  <TableCell>{signalement.localisation}</TableCell>
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
                  <TableCell>
                    {signalement.entreprise || (
                      <Chip label="Non assigné" size="small" />
                    )}
                  </TableCell>
                  <TableCell>{formatDate(signalement.dateCreation)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleOpenEdit(signalement)}
                        title="Modifier"
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleOpenHistory(signalement)}
                        title="Historique"
                      >
                        <HistoryIcon />
                      </IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog de modification */}
      <Dialog open={openEditDialog} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle>
          Modifier le signalement #{selectedSignalement?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Localisation:</strong> {selectedSignalement?.localisation}
            </Typography>

            <FormControl fullWidth margin="normal">
              <InputLabel>Statut</InputLabel>
              <Select
                value={editForm.statut || ''}
                label="Statut"
                onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
              >
                <MenuItem value="nouveau">Nouveau</MenuItem>
                <MenuItem value="en_cours">En cours</MenuItem>
                <MenuItem value="termine">Terminé</MenuItem>
              </Select>
            </FormControl>

            <TextField
              fullWidth
              label="Surface (m²)"
              type="number"
              value={editForm.surface || ''}
              onChange={(e) => setEditForm({ ...editForm, surface: parseFloat(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Budget estimé (MGA)"
              type="number"
              value={editForm.budgetEstime || ''}
              onChange={(e) => setEditForm({ ...editForm, budgetEstime: parseFloat(e.target.value) })}
              margin="normal"
            />

            <TextField
              fullWidth
              label="Entreprise"
              value={editForm.entreprise || ''}
              onChange={(e) => setEditForm({ ...editForm, entreprise: e.target.value })}
              margin="normal"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Annuler</Button>
          <Button onClick={handleSaveEdit} variant="contained">
            Enregistrer
          </Button>
        </DialogActions>
      </Dialog>

      {/* Dialog d'historique */}
      <Dialog open={openHistoryDialog} onClose={handleCloseHistory} maxWidth="md" fullWidth>
        <DialogTitle>
          Historique du signalement #{selectedSignalement?.id}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Paper sx={{ p: 2, mb: 3, bgcolor: '#f5f5f5' }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Localisation:</strong> {selectedSignalement?.localisation}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>Description:</strong> {selectedSignalement?.description}
              </Typography>
              <Typography variant="body1">
                <strong>Créé par:</strong> {selectedSignalement?.creePar}
              </Typography>
            </Paper>

            {historique.length > 0 && (
              <List sx={{ mt: 2 }}>
                {historique.map((entry, index) => (
                  <React.Fragment key={index}>
                    <ListItem alignItems="flex-start">
                      <Box sx={{ mr: 2, mt: 1 }}>
                        <CircleIcon 
                          sx={{ 
                            fontSize: 16, 
                            color: getStatutColor(entry.nouveauStatut) 
                          }} 
                        />
                      </Box>
                      <ListItemText
                        primary={
                          <Box>
                            <Chip
                              label={getStatutLabel(entry.nouveauStatut)}
                              size="small"
                              sx={{
                                backgroundColor: getStatutColor(entry.nouveauStatut),
                                color: 'white',
                                fontWeight: 600,
                                mb: 1
                              }}
                            />
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                              {formatDate(entry.dateModification)}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="body2" component="span">
                              {entry.commentaire}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                              Par: {entry.modifiePar}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < historique.length - 1 && (
                      <Divider variant="inset" component="li" />
                    )}
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Fermer</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SignalementsPage;
