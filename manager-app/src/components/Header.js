import React from 'react';
import { AppBar, Toolbar, Typography, Button, Box, Menu, MenuItem } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import MapIcon from '@mui/icons-material/Map';
import LogoutIcon from '@mui/icons-material/Logout';
import LoginIcon from '@mui/icons-material/Login';
import DashboardIcon from '@mui/icons-material/Dashboard';
import PeopleIcon from '@mui/icons-material/People';
import ReportIcon from '@mui/icons-material/Report';
import AddCircleIcon from '@mui/icons-material/AddCircle';
import ListIcon from '@mui/icons-material/List';
import HomeIcon from '@mui/icons-material/Home';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AssessmentIcon from '@mui/icons-material/Assessment';

const Header = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, logout, user } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const isActive = (path) => {
    return location.pathname === path || location.pathname.startsWith(path);
  };

  return (
    <AppBar position="static" elevation={3}>
      <Toolbar>
        <MapIcon sx={{ mr: 2, fontSize: 28 }} />
        <Typography 
          variant="h6" 
          component="div" 
          sx={{ 
            flexGrow: 1, 
            fontWeight: 700,
            cursor: 'pointer',
            '&:hover': { opacity: 0.8 }
          }}
          onClick={() => navigate('/')}
        >
          Suivi des Travaux Routiers - Antananarivo
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          {!isAuthenticated ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/')}
                startIcon={<HomeIcon />}
                sx={{ 
                  fontWeight: isActive('/') && location.pathname === '/' ? 700 : 400,
                  borderBottom: isActive('/') && location.pathname === '/' ? '2px solid white' : 'none'
                }}
              >
                Accueil
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/login')}
                startIcon={<LoginIcon />}
                variant={isActive('/login') ? 'outlined' : 'text'}
                sx={{ ml: 1 }}
              >
                Connexion
              </Button>
            </>
          ) : user?.role === 'manager' ? (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard')}
                startIcon={<DashboardIcon />}
                sx={{ 
                  fontWeight: location.pathname === '/dashboard' ? 700 : 400,
                  borderBottom: location.pathname === '/dashboard' ? '2px solid white' : 'none'
                }}
              >
                Tableau de bord
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard/signalements')}
                startIcon={<ReportIcon />}
                sx={{ 
                  fontWeight: isActive('/dashboard/signalements') ? 700 : 400,
                  borderBottom: isActive('/dashboard/signalements') ? '2px solid white' : 'none'
                }}
              >
                Signalements
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard/statistiques')}
                startIcon={<AssessmentIcon />}
                sx={{ 
                  fontWeight: isActive('/dashboard/statistiques') ? 700 : 400,
                  borderBottom: isActive('/dashboard/statistiques') ? '2px solid white' : 'none'
                }}
              >
                Statistiques
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/dashboard/users')}
                startIcon={<PeopleIcon />}
                sx={{ 
                  fontWeight: isActive('/dashboard/users') ? 700 : 400,
                  borderBottom: isActive('/dashboard/users') ? '2px solid white' : 'none'
                }}
              >
                Utilisateurs
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 1 }}>
                <AccountCircleIcon sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.prenom} {user?.nom}
                </Typography>
              </Box>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                variant="outlined"
                size="small"
              >
                Déconnexion
              </Button>
            </>
          ) : (
            <>
              <Button 
                color="inherit" 
                onClick={() => navigate('/')}
                startIcon={<MapIcon />}
                sx={{ 
                  fontWeight: location.pathname === '/' ? 700 : 400,
                  borderBottom: location.pathname === '/' ? '2px solid white' : 'none'
                }}
              >
                Carte
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/user/signalements')}
                startIcon={<ListIcon />}
                sx={{ 
                  fontWeight: isActive('/user/signalements') ? 700 : 400,
                  borderBottom: isActive('/user/signalements') ? '2px solid white' : 'none'
                }}
              >
                Mes signalements
              </Button>
              <Button 
                color="inherit" 
                onClick={() => navigate('/user/create')}
                startIcon={<AddCircleIcon />}
                sx={{ 
                  fontWeight: isActive('/user/create') ? 700 : 400,
                  borderBottom: isActive('/user/create') ? '2px solid white' : 'none'
                }}
              >
                Créer
              </Button>
              <Box sx={{ display: 'flex', alignItems: 'center', ml: 2, mr: 1 }}>
                <AccountCircleIcon sx={{ mr: 1 }} />
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  {user?.prenom} {user?.nom}
                </Typography>
              </Box>
              <Button 
                color="inherit" 
                onClick={handleLogout}
                startIcon={<LogoutIcon />}
                variant="outlined"
                size="small"
              >
                Déconnexion
              </Button>
            </>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
