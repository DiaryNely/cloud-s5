import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function NavBar() {
  const { role, email, logout } = useAuth();

  return (
    <header className="nav">
      <div className="nav-inner">
        <Link to="/" className="nav-brand">🗺️ Cloud S5</Link>
        <div className="nav-links">
          <Link to="/">Carte</Link>
          {role && (
            <>
              <Link to="/dashboard">Dashboard</Link>
              {role === "MANAGER" && <Link to="/admin">Administration</Link>}
            </>
          )}
        </div>
        <div className="nav-user">
          {role ? (
            <>
              <span className="nav-email">{email}</span>
              <button className="secondary" onClick={logout}>Déconnexion</button>
            </>
          ) : (
            <>
              <Link to="/login">Connexion</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
