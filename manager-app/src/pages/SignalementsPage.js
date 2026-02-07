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
  CircularProgress,
  LinearProgress,
  Tooltip
} from '@mui/material';
import { 
  getSignalements, 
  updateSignalement,
  updateSignalementStatut,
  getHistorique, 
  getStatutLabel, 
  getStatutColor,
  getAvancementFromStatut
} from '../services/signalementService';
import { getEntreprises } from '../services/userService';
import EditIcon from '@mui/icons-material/Edit';
import HistoryIcon from '@mui/icons-material/History';
import CircleIcon from '@mui/icons-material/Circle';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';

const SignalementsPage = () => {
  const [signalements, setSignalements] = useState([]);
  const [entreprises, setEntreprises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openHistoryDialog, setOpenHistoryDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
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
      entreprise: signalement.entreprise || '',
      commentaire: ''
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
      const avancement = getAvancementFromStatut(editForm.statut);
      setSuccessMessage(`Signalement #${selectedSignalement.id} mis à jour avec succès ! Avancement: ${avancement}%`);
      handleCloseEdit();
    } catch (err) {
      setError('Erreur lors de la mise à jour');
      console.error(err);
    }
  };

  // Changement rapide de statut
  const handleQuickStatusChange = async (signalement, newStatut) => {
    try {
      await updateSignalementStatut(signalement.id, newStatut);
      await loadData();
      const avancement = getAvancementFromStatut(newStatut);
      setSuccessMessage(`Statut du signalement #${signalement.id} changé en "${getStatutLabel(newStatut)}" (${avancement}%)`);
    } catch (err) {
      setError('Erreur lors du changement de statut');
      console.error(err);
    }
  };

  const handleOpenHistory = async (signalement) => {
    try {
      const histData = await getHistorique(signalement.id);
      // L'API retourne { id: [...] }, on extrait le tableau
      const hist = histData[signalement.id] || histData || [];
      setHistorique(Array.isArray(hist) ? hist : []);
      setSelectedSignalement(signalement);
      setOpenHistoryDialog(true);
    } catch (err) {
      setError('Erreur lors du chargement de l\'historique');
      console.error(err);
    }
  };

  const handleCloseHistory = () => {
    setOpenHistoryDialog(false);
    setSelectedSignalement(null);
    setHistorique([]);
  };

  const handleOpenDetails = (signalement) => {
    setSelectedSignalement(signalement);
    setOpenDetailsDialog(true);
  };

  const handleCloseDetails = () => {
    setOpenDetailsDialog(false);
    setSelectedSignalement(null);
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
                <TableCell sx={{ fontWeight: 600 }}>Avancement</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Surface</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Budget</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Entreprise</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date création</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {signalements.map((signalement) => {
                const avancement = signalement.avancement ?? getAvancementFromStatut(signalement.statut);
                return (
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
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, minWidth: 120 }}>
                      <LinearProgress
                        variant="determinate"
                        value={avancement}
                        sx={{ 
                          flex: 1, 
                          height: 10, 
                          borderRadius: 5,
                          backgroundColor: '#e0e0e0',
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 5,
                            backgroundColor: avancement === 100 ? '#4caf50' : 
                                           avancement >= 50 ? '#ff9800' : '#f44336'
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ fontWeight: 600, minWidth: 40 }}>
                        {avancement}%
                      </Typography>
                    </Box>
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
                    <Box display="flex" gap={0.5} flexWrap="wrap">
                      {/* Boutons de changement rapide de statut */}
                      {signalement.statut === 'nouveau' && (
                        <Tooltip title="Démarrer les travaux (50%)">
                          <IconButton
                            size="small"
                            sx={{ color: '#ff9800' }}
                            onClick={() => handleQuickStatusChange(signalement, 'en_cours')}
                          >
                            <PlayArrowIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {signalement.statut === 'en_cours' && (
                        <Tooltip title="Terminer les travaux (100%)">
                          <IconButton
                            size="small"
                            sx={{ color: '#4caf50' }}
                            onClick={() => handleQuickStatusChange(signalement, 'termine')}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="Modifier">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEdit(signalement)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Voir détails">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => handleOpenDetails(signalement)}
                        >
                          <VisibilityIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Historique">
                        <IconButton
                          size="small"
                          color="secondary"
                          onClick={() => handleOpenHistory(signalement)}
                        >
                          <HistoryIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog des détails avec photos */}
      <Dialog open={openDetailsDialog} onClose={handleCloseDetails} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <PhotoLibraryIcon />
          Détails du signalement #{selectedSignalement?.id}
        </DialogTitle>
        <DialogContent>
          {selectedSignalement && (
            <Box sx={{ pt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Informations générales
                  </Typography>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                    <Typography><strong>Localisation:</strong> {selectedSignalement.localisation}</Typography>
                    <Typography><strong>Description:</strong> {selectedSignalement.description}</Typography>
                    <Typography><strong>Surface:</strong> {selectedSignalement.surface} m²</Typography>
                    <Typography><strong>Budget:</strong> {formatBudget(selectedSignalement.budgetEstime)}</Typography>
                    <Typography><strong>Statut:</strong> <Chip 
                      label={getStatutLabel(selectedSignalement.statut)} 
                      size="small"
                      sx={{
                        backgroundColor: getStatutColor(selectedSignalement.statut),
                        color: 'white'
                      }}
                    /></Typography>
                    <Typography><strong>Avancement:</strong> {selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)}%</Typography>
                    {selectedSignalement.entreprise && (
                      <Typography><strong>Entreprise:</strong> {selectedSignalement.entreprise}</Typography>
                    )}
                    <Typography><strong>Créé par:</strong> {selectedSignalement.creePar}</Typography>
                    <Typography><strong>Date de création:</strong> {formatDate(selectedSignalement.dateCreation)}</Typography>
                  </Box>
                </Grid>

                {selectedSignalement.photos && selectedSignalement.photos.length > 0 && (
                  <Grid item xs={12}>
                    <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                      Photos ({selectedSignalement.photos.length})
                    </Typography>
                    <Grid container spacing={2}>
                      {selectedSignalement.photos.map((photo, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <Box
                            component="img"
                            src={photo}
                            alt={`Photo ${index + 1}`}
                            sx={{
                              width: '100%',
                              height: 200,
                              objectFit: 'cover',
                              borderRadius: 2,
                              border: '2px solid #e0e0e0',
                              cursor: 'pointer',
                              transition: 'transform 0.2s',
                              '&:hover': {
                                transform: 'scale(1.05)'
                              }
                            }}
                            onClick={() => window.open(photo, '_blank')}
                          />
                        </Grid>
                      ))}
                    </Grid>
                  </Grid>
                )}

                {(!selectedSignalement.photos || selectedSignalement.photos.length === 0) && (
                  <Grid item xs={12}>
                    <Box sx={{ textAlign: 'center', py: 4, color: 'text.secondary' }}>
                      <PhotoLibraryIcon sx={{ fontSize: 60, opacity: 0.3, mb: 2 }} />
                      <Typography>Aucune photo disponible pour ce signalement</Typography>
                    </Box>
                  </Grid>
                )}
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDetails}>Fermer</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog de modification */}
      <Dialog open={openEditDialog} onClose={handleCloseEdit} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <span>Modifier le signalement #{selectedSignalement?.id}</span>
          {selectedSignalement && (
            <Chip
              label={`${selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)}%`}
              size="small"
              sx={{
                backgroundColor: (selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)) === 100 ? '#4caf50' :
                                (selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)) >= 50 ? '#ff9800' : '#f44336',
                color: 'white',
                fontWeight: 600
              }}
            />
          )}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>Localisation:</strong> {selectedSignalement?.localisation}
            </Typography>

            {/* Barre de progression */}
            {selectedSignalement && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                  <strong>Avancement actuel:</strong>
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <LinearProgress
                    variant="determinate"
                    value={selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)}
                    sx={{ 
                      flex: 1, 
                      height: 12, 
                      borderRadius: 6,
                      backgroundColor: '#e0e0e0',
                      '& .MuiLinearProgress-bar': {
                        borderRadius: 6,
                        backgroundColor: (selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)) === 100 ? '#4caf50' :
                                       (selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)) >= 50 ? '#ff9800' : '#f44336'
                      }
                    }}
                  />
                  <Typography variant="body1" sx={{ fontWeight: 700, minWidth: 50 }}>
                    {selectedSignalement.avancement ?? getAvancementFromStatut(selectedSignalement.statut)}%
                  </Typography>
                </Box>
              </Box>
            )}

            <FormControl fullWidth margin="normal">
              <InputLabel>Statut</InputLabel>
              <Select
                value={editForm.statut || ''}
                label="Statut"
                onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}
              >
                <MenuItem value="nouveau">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#f44336' }} />
                    Nouveau (0%)
                  </Box>
                </MenuItem>
                <MenuItem value="en_cours">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#ff9800' }} />
                    En cours (50%)
                  </Box>
                </MenuItem>
                <MenuItem value="termine">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Box sx={{ width: 12, height: 12, borderRadius: '50%', backgroundColor: '#4caf50' }} />
                    Terminé (100%)
                  </Box>
                </MenuItem>
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

            <TextField
              fullWidth
              label="Commentaire (optionnel)"
              multiline
              rows={3}
              value={editForm.commentaire || ''}
              onChange={(e) => setEditForm({ ...editForm, commentaire: e.target.value })}
              margin="normal"
              placeholder="Ajoutez un commentaire pour expliquer la modification..."
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEdit}>Annuler</Button>
          <Button onClick={handleSaveEdit} variant="contained" color="primary">
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
