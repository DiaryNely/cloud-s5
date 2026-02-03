import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider } from './context/AuthContext';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ProtectedUserRoute from './components/ProtectedUserRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import UsersPage from './pages/UsersPage';
import SignalementsPage from './pages/SignalementsPage';
import StatistiquesPage from './pages/StatistiquesPage';
import CreateSignalementPage from './pages/CreateSignalementPage';
import UserSignalementsPage from './pages/UserSignalementsPage';
import './App.css';

const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#7b1fa2',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 700,
    },
    h4: {
      fontWeight: 600,
    },
    h5: {
      fontWeight: 600,
    },
    h6: {
      fontWeight: 600,
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <Header />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Routes Manager */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/users"
              element={
                <ProtectedRoute>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/signalements"
              element={
                <ProtectedRoute>
                  <SignalementsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/statistiques"
              element={
                <ProtectedRoute>
                  <StatistiquesPage />
                </ProtectedRoute>
              }
            />
            
            {/* Routes Utilisateur */}
            <Route
              path="/user/signalements"
              element={
                <ProtectedUserRoute>
                  <UserSignalementsPage />
                </ProtectedUserRoute>
              }
            />
            <Route
              path="/user/create"
              element={
                <ProtectedUserRoute>
                  <CreateSignalementPage />
                </ProtectedUserRoute>
              }
            />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
