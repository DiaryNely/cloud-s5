import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  InputAdornment,
  IconButton,
  Tabs,
  Tab
} from '@mui/material';
import { useAuth } from '../context/AuthContext';
import LoginIcon from '@mui/icons-material/Login';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import LockIcon from '@mui/icons-material/Lock';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const navigate = useNavigate();
  const { login } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!email || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      // Redirection selon le rôle (backend retourne 'manager' ou 'user' en lowercase)
      const userRole = result.user.role?.toLowerCase();
      if (userRole === 'manager') {
        navigate('/dashboard');
      } else {
        navigate('/user/signalements');
      }
    } else {
      setError(result.message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 64px)',
        display: 'flex',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        py: 4
      }}
    >
      <Container maxWidth="sm">
        <Paper elevation={10} sx={{ p: 4, borderRadius: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
            <LockIcon sx={{ fontSize: 60, color: '#1976d2', mb: 2 }} />
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 700 }}>
              Connexion
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Accédez à votre espace personnel
            </Typography>
          </Box>

          <Tabs 
            value={tabValue} 
            onChange={(e, newValue) => setTabValue(newValue)}
            centered
            sx={{ mb: 3 }}
          >
            <Tab 
              icon={<PersonIcon />} 
              label="Utilisateur" 
              iconPosition="start"
            />
            <Tab 
              icon={<AdminPanelSettingsIcon />} 
              label="Manager" 
              iconPosition="start"
            />
          </Tabs>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          {tabValue === 0 ? (
            <Box 
              sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: '#e8f5e9', 
                borderRadius: 2,
                border: '1px solid #81c784'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Comptes Utilisateur :
              </Typography>
              <Typography variant="body2" sx={{ mb: 0.5 }}>
                <strong>Email:</strong> user@app.mg | <strong>Mot de passe:</strong> User2026!
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> rakoto@app.mg | <strong>Mot de passe:</strong> User2026!
              </Typography>
            </Box>
          ) : (
            <Box 
              sx={{ 
                mb: 3, 
                p: 2, 
                bgcolor: '#e3f2fd', 
                borderRadius: 2,
                border: '1px solid #90caf9'
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, mb: 1 }}>
                Compte Manager :
              </Typography>
              <Typography variant="body2">
                <strong>Email:</strong> admin@manager.mg | <strong>Mot de passe:</strong> Manager2026!
              </Typography>
            </Box>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label="Adresse email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              margin="normal"
              variant="outlined"
              autoComplete="email"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <EmailIcon color="action" />
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              fullWidth
              label="Mot de passe"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              margin="normal"
              variant="outlined"
              autoComplete="current-password"
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LockIcon color="action" />
                  </InputAdornment>
                ),
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      onClick={() => setShowPassword(!showPassword)}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              startIcon={<LoginIcon />}
              sx={{ mt: 3, mb: 2, py: 1.5, fontWeight: 600 }}
            >
              Se connecter
            </Button>
          </form>

          <Box sx={{ mt: 3, p: 2, bgcolor: '#fff3e0', borderRadius: 2 }}>
            <Typography variant="body2" color="text.secondary" align="center">
              <strong>Note:</strong> La redirection s'effectue automatiquement selon votre rôle.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default LoginPage;
