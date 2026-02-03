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
  Grid,
  Card,
  CardContent,
  CircularProgress
} from '@mui/material';
import { getUtilisateurs, createUtilisateur, debloquerUtilisateur, getAuditLogs } from '../services/userService';
import AddIcon from '@mui/icons-material/Add';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import PersonIcon from '@mui/icons-material/Person';
import BlockIcon from '@mui/icons-material/Block';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';

const UsersPage = () => {
  const [users, setUsers] = useState([]);
  const [audit, setAudit] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState(null);
  const [newUser, setNewUser] = useState({
    nom: '',
    prenom: '',
    email: '',
    password: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usersData, auditData] = await Promise.all([
        getUtilisateurs(),
        getAuditLogs(20)
      ]);
      setUsers(usersData);
      setAudit(auditData);
    } catch (err) {
      setError('Erreur lors du chargement des données');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setSuccessMessage('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setNewUser({ nom: '', prenom: '', email: '', password: '' });
  };

  const handleCreateUser = async () => {
    if (!newUser.nom || !newUser.prenom || !newUser.email || !newUser.password) {
      return;
    }

    try {
      await createUtilisateur(newUser);
      await loadData();
      setSuccessMessage(`Utilisateur ${newUser.email} créé avec succès ! Le mot de passe est visible dans le tableau.`);
      handleCloseDialog();
    } catch (err) {
      setError('Erreur lors de la création de l\'utilisateur');
    }
  };

  const handleUnblockUser = async (userId) => {
    try {
      const user = users.find(u => u.id === userId);
      await debloquerUtilisateur(userId);
      await loadData();
      setSuccessMessage(`Compte ${user.email} débloqué avec succès !`);
    } catch (err) {
      setError('Erreur lors du déblocage');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const stats = {
    total: users.length,
    actifs: users.filter(u => !u.bloque).length,
    bloques: users.filter(u => u.bloque).length,
    managers: users.filter(u => u.role?.toLowerCase() === 'manager').length,
    users: users.filter(u => u.role?.toLowerCase() === 'user').length
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
        Gestion des Utilisateurs
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
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                    {stats.total}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Total utilisateurs
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 50, color: '#1976d2', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#4caf50' }}>
                    {stats.actifs}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comptes actifs
                  </Typography>
                </Box>
                <CheckCircleIcon sx={{ fontSize: 50, color: '#4caf50', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#f44336' }}>
                    {stats.bloques}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Comptes bloqués
                  </Typography>
                </Box>
                <BlockIcon sx={{ fontSize: 50, color: '#f44336', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h4" sx={{ fontWeight: 700, color: '#ff9800' }}>
                    {stats.users}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Utilisateurs
                  </Typography>
                </Box>
                <PersonIcon sx={{ fontSize: 50, color: '#ff9800', opacity: 0.3 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Liste des utilisateurs */}
      <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Liste des utilisateurs
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleOpenDialog}
          >
            Créer un utilisateur
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Nom complet</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Rôle</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Statut</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Mot de passe temporaire</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Dernière connexion</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell>
                    {user.prenom} {user.nom}
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip
                      label={user.role === 'manager' ? 'Manager' : 'Utilisateur'}
                      color={user.role === 'manager' ? 'primary' : 'info'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {user.bloque ? (
                      <Chip label="Bloqué" color="error" size="small" />
                    ) : user.actif ? (
                      <Chip label="Actif" color="success" size="small" />
                    ) : (
                      <Chip label="Inactif" color="default" size="small" />
                    )}
                  </TableCell>
                  <TableCell>
                    {user.temporaryPassword ? (
                      <Typography 
                        sx={{ 
                          fontFamily: 'monospace', 
                          bgcolor: '#fff3e0', 
                          px: 1, 
                          py: 0.5, 
                          borderRadius: 1,
                          fontSize: '0.875rem',
                          fontWeight: 600,
                          color: '#f57c00',
                          cursor: 'pointer',
                          userSelect: 'all'
                        }}
                        onClick={() => {
                          navigator.clipboard.writeText(user.temporaryPassword);
                          setSuccessMessage('Mot de passe copié dans le presse-papier');
                        }}
                        title="Cliquer pour copier"
                      >
                        {user.temporaryPassword}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">
                        •••••••
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>{formatDate(user.derniereConnexion)}</TableCell>
                  <TableCell>
                    {user.bloque && user.role?.toLowerCase() !== 'manager' && (
                      <IconButton
                        color="success"
                        size="small"
                        onClick={() => handleUnblockUser(user.id)}
                        title="Débloquer l'utilisateur"
                      >
                        <LockOpenIcon />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Journal d'audit */}
      <Paper elevation={3} sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 3 }}>
          Journal d'audit (dernières actions)
        </Typography>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Action</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Utilisateur</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Détails</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {audit.slice(0, 10).map((entry) => (
                <TableRow key={entry.id} hover>
                  <TableCell>{formatDate(entry.date)}</TableCell>
                  <TableCell>
                    <Chip 
                      label={entry.action.replace(/_/g, ' ')} 
                      size="small"
                      color={
                        entry.action.includes('CREATION') ? 'success' :
                        entry.action.includes('ECHEC') ? 'error' :
                        entry.action.includes('DEBLOCAGE') ? 'warning' :
                        'default'
                      }
                    />
                  </TableCell>
                  <TableCell>{entry.utilisateur}</TableCell>
                  <TableCell>{entry.details}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Dialog de création d'utilisateur */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Nom"
              value={newUser.nom}
              onChange={(e) => setNewUser({ ...newUser, nom: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Prénom"
              value={newUser.prenom}
              onChange={(e) => setNewUser({ ...newUser, prenom: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Email"
              type="email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              margin="normal"
            />
            <TextField
              fullWidth
              label="Mot de passe"
              type="password"
              value={newUser.password || ''}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              margin="normal"
              helperText="Minimum 6 caractères"
            />
            <Alert severity="info" sx={{ mt: 2 }}>
              L'utilisateur créé aura le rôle "Utilisateur" et pourra utiliser l'application web et mobile.
              Le mot de passe sera visible dans le tableau jusqu'à sa première connexion.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Annuler</Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={!newUser.nom || !newUser.prenom || !newUser.email || !newUser.password || newUser.password.length < 6}
          >
            Créer
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default UsersPage;
