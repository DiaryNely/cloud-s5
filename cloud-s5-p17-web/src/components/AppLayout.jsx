import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function AppLayout() {
  const { role } = useAuth();

  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">🗺️ Cloud S5</span>
        </div>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Navigation</div>
          <NavLink to="/carte" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-icon">🗺️</span><span>Carte</span>
          </NavLink>

          {role && (
            <>
              <NavLink to="/signaler" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">➕</span><span>Nouveau signalement</span>
              </NavLink>
              <NavLink to="/profil" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">👤</span><span>Mon profil</span>
              </NavLink>
            </>
          )}

          {role === "MANAGER" && (
            <>
              <div className="sidebar-divider" />
              <div className="sidebar-section-label">Administration</div>
              <NavLink to="/admin" end className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">📊</span><span>Tableau de bord</span>
              </NavLink>
              <NavLink to="/admin/users" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">👥</span><span>Utilisateurs</span>
              </NavLink>
              <NavLink to="/admin/signalements" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">📋</span><span>Signalements</span>
              </NavLink>
              <NavLink to="/admin/prix-forfaitaire" className={({ isActive }) => `sidebar-link${isActive ? " active" : ""}`}>
                <span className="sidebar-icon">💰</span><span>Prix forfaitaire</span>
              </NavLink>
            </>
          )}
        </nav>
      </aside>
      <div className="app-main">
        <Outlet />
      </div>
    </div>
  );
}
