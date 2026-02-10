import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar.jsx";
import AppLayout from "./components/AppLayout.jsx";
import Visitor from "./pages/Visitor.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import CreateSignalement from "./pages/CreateSignalement.jsx";
import Profile from "./pages/Profile.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";
import AdminUsers from "./pages/AdminUsers.jsx";
import AdminSignalements from "./pages/AdminSignalements.jsx";
import AdminPrixForfaitaire from "./pages/AdminPrixForfaitaire.jsx";
import RequireAuth from "./auth/RequireAuth.jsx";
import { useAuth } from "./auth/AuthContext.jsx";

export default function App() {
  const { role } = useAuth();

  return (
    <div className="app">
      <NavBar />
      <Routes>
        {/* Page login sans sidebar */}
        <Route path="/login" element={<main className="container"><Login /></main>} />

        {/* Toutes les pages avec sidebar */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Visitor />} />
          <Route path="/carte" element={<Visitor />} />

          <Route path="/signaler" element={
            <RequireAuth roles={["UTILISATEUR", "MANAGER"]}>
              <CreateSignalement />
            </RequireAuth>
          } />

          <Route path="/profil" element={
            <RequireAuth roles={["UTILISATEUR", "MANAGER"]}>
              <Profile />
            </RequireAuth>
          } />

          <Route path="/admin" element={
            <RequireAuth roles={["MANAGER"]}>
              <AdminDashboard />
            </RequireAuth>
          } />
          <Route path="/admin/users" element={
            <RequireAuth roles={["MANAGER"]}>
              <AdminUsers />
            </RequireAuth>
          } />
          <Route path="/admin/signalements" element={
            <RequireAuth roles={["MANAGER"]}>
              <AdminSignalements />
            </RequireAuth>
          } />
          <Route path="/admin/prix-forfaitaire" element={
            <RequireAuth roles={["MANAGER"]}>
              <AdminPrixForfaitaire />
            </RequireAuth>
          } />
        </Route>

        <Route path="*" element={<Navigate to="/carte" replace />} />
      </Routes>
    </div>
  );
}
