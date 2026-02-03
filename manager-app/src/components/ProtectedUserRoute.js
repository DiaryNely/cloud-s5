import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Box, CircularProgress } from '@mui/material';

const ProtectedUserRoute = ({ children }) => {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Permettre l'accès aux utilisateurs USER (role ID 2)
  // Le backend peut retourner 'user', 'USER', ou 'utilisateur'
  const userRole = user?.role?.toLowerCase();
  if (userRole !== 'user' && userRole !== 'utilisateur') {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default ProtectedUserRoute;
