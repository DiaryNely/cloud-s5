import React, { useState, useEffect } from 'react';
import { 
  Paper, 
  Typography, 
  Box, 
  Button, 
  CircularProgress, 
  Alert,
  Chip,
  Grid,
  Divider
} from '@mui/material';
import SyncIcon from '@mui/icons-material/Sync';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import CloudOffIcon from '@mui/icons-material/CloudOff';
import CloudQueueIcon from '@mui/icons-material/CloudQueue';
import { manualSync, getSyncStatus, checkConnectivity } from '../services/syncService';

const SyncPanel = () => {
  const [syncing, setSyncing] = useState(false);
  const [status, setStatus] = useState(null);
  const [message, setMessage] = useState(null);
  const [messageType, setMessageType] = useState('info');
  const [lastResult, setLastResult] = useState(null);
  const [checkingConnectivity, setCheckingConnectivity] = useState(false);

  useEffect(() => {
    loadStatus();
    // Actualiser le statut toutes les 10 secondes
    const interval = setInterval(loadStatus, 10000);
    return () => clearInterval(interval);
  }, []);

  const loadStatus = async () => {
    try {
      const statusData = await getSyncStatus();
      setStatus(statusData);
    } catch (error) {
      console.error('Erreur chargement statut:', error);
    }
  };

  const handleSync = async () => {
    try {
      setSyncing(true);
      setMessage(null);
      setLastResult(null);
      
      const result = await manualSync();
      
      if (result.success) {
        setMessageType('success');
        setMessage(`✅ Synchronisation réussie ! ${result.usersSynced} utilisateurs et ${result.signalementsSynced} signalements synchronisés en ${result.duration}ms`);
        setLastResult(result);
      } else {
        setMessageType('error');
        setMessage(`❌ ${result.message}`);
      }
      
      // Recharger le statut
      await loadStatus();
    } catch (error) {
      setMessageType('error');
      if (error.response?.status === 503) {
        setMessage('⚠️ Firebase n\'est pas disponible. Vérifiez votre connexion internet.');
      } else {
        setMessage('❌ Erreur lors de la synchronisation : ' + (error.response?.data?.message || error.message));
      }
    } finally {
      setSyncing(false);
    }
  };

  const handleCheckConnectivity = async () => {
    try {
      setCheckingConnectivity(true);
      const result = await checkConnectivity();
      
      if (result.online) {
        setMessageType('success');
        setMessage('✅ Firebase est accessible');
      } else {
        setMessageType('warning');
        setMessage('⚠️ Firebase n\'est pas accessible');
      }
      
      await loadStatus();
    } catch (error) {
      setMessageType('error');
      setMessage('❌ Erreur lors de la vérification : ' + (error.response?.data?.message || error.message));
    } finally {
      setCheckingConnectivity(false);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Jamais';
    return new Date(dateString).toLocaleString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
      {message && (
        <Alert 
          severity={messageType} 
          sx={{ mb: 3 }} 
          onClose={() => setMessage(null)}
        >
          {message}
        </Alert>
      )}

      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, display: 'flex', alignItems: 'center' }}>
            <SyncIcon sx={{ mr: 1, fontSize: 30 }} />
            Synchronisation Firebase
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Synchronisez manuellement les données locales (PostgreSQL) vers Firebase pour l'application mobile
          </Typography>
        </Box>
        
        {status && (
          <Chip
            icon={status.isOnline ? <CloudQueueIcon /> : <CloudOffIcon />}
            label={status.isOnline ? 'ONLINE' : 'OFFLINE'}
            color={status.isOnline ? 'success' : 'default'}
            sx={{ fontWeight: 600, fontSize: '1rem', px: 2, py: 3 }}
          />
        )}
      </Box>

      <Divider sx={{ mb: 3 }} />

      <Grid container spacing={3}>
        {/* Statut actuel */}
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Statut actuel
            </Typography>
            {status?.isSyncing ? (
              <Box display="flex" alignItems="center" mt={1}>
                <CircularProgress size={20} sx={{ mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Synchronisation en cours...
                </Typography>
              </Box>
            ) : (
              <Box display="flex" alignItems="center" mt={1}>
                <CheckCircleIcon color="success" sx={{ mr: 1 }} />
                <Typography variant="body1" sx={{ fontWeight: 600 }}>
                  Prêt à synchroniser
                </Typography>
              </Box>
            )}
          </Box>
        </Grid>

        {/* Dernière synchronisation */}
        <Grid item xs={12} md={6}>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 2 }}>
            <Typography variant="subtitle2" color="text.secondary" gutterBottom>
              Dernière synchronisation
            </Typography>
            <Typography variant="body1" sx={{ fontWeight: 600, mt: 1 }}>
              {formatDate(status?.lastSyncDate)}
            </Typography>
          </Box>
        </Grid>

        {/* Résultats de la dernière sync */}
        {lastResult && (
          <>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, bgcolor: '#e3f2fd', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#1976d2' }}>
                  {lastResult.usersSynced}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Utilisateurs synchronisés
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, bgcolor: '#e8f5e9', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#388e3c' }}>
                  {lastResult.signalementsSynced}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Signalements synchronisés
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <Box sx={{ p: 2, bgcolor: '#fff3e0', borderRadius: 2, textAlign: 'center' }}>
                <Typography variant="h4" sx={{ fontWeight: 700, color: '#f57c00' }}>
                  {lastResult.duration}ms
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Durée de synchronisation
                </Typography>
              </Box>
            </Grid>
          </>
        )}
      </Grid>

      <Box display="flex" gap={2} mt={3}>
        <Button
          variant="contained"
          size="large"
          startIcon={syncing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
          onClick={handleSync}
          disabled={syncing || status?.isSyncing || !status?.isOnline}
          sx={{ fontWeight: 600, flex: 1 }}
        >
          {syncing ? 'Synchronisation...' : 'Synchroniser maintenant'}
        </Button>
        
        <Button
          variant="outlined"
          size="large"
          startIcon={checkingConnectivity ? <CircularProgress size={20} /> : <CloudQueueIcon />}
          onClick={handleCheckConnectivity}
          disabled={checkingConnectivity || syncing}
          sx={{ fontWeight: 600 }}
        >
          Vérifier connectivité
        </Button>
      </Box>

      {!status?.isOnline && (
        <Alert severity="warning" sx={{ mt: 3 }}>
          <Typography variant="body2">
            🔌 <strong>Mode OFFLINE</strong> : Firebase n'est pas accessible. 
            L'application utilise actuellement PostgreSQL en local. 
            Vérifiez votre connexion internet avant de synchroniser.
          </Typography>
        </Alert>
      )}
    </Paper>
  );
};

export default SyncPanel;
