import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [error, setError] = useState(null);
  const [form, setForm] = useState({
    email: "",
    password: "",
    nom: "",
    prenom: "",
    numEtu: ""
  });

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    
    // Validation du mot de passe
    if (form.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    
    try {
      await register(form);
      navigate("/dashboard");
    } catch (err) {
      setError(err?.response?.data?.error || "Inscription impossible");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 200px)" }}>
      <div className="card" style={{ maxWidth: 520, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>✨ Inscription</h2>
          <p style={{ color: "var(--gray-600)" }}>Créez votre compte pour signaler des problèmes</p>
        </div>
        <form className="form" onSubmit={onSubmit}>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <div className="form-group">
              <label className="form-label">Nom</label>
              <input
                type="text"
                placeholder="Votre nom"
                value={form.nom}
                onChange={(e) => setForm({ ...form, nom: e.target.value })}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Prénom</label>
              <input
                type="text"
                placeholder="Votre prénom"
                value={form.prenom}
                onChange={(e) => setForm({ ...form, prenom: e.target.value })}
                required
              />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Numéro étudiant (optionnel)</label>
            <input
              type="text"
              placeholder="ETU001234"
              value={form.numEtu}
              onChange={(e) => setForm({ ...form, numEtu: e.target.value })}
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input
              type="email"
              placeholder="votre@email.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
              minLength={6}
            />
            <small style={{ color: "var(--gray-600)", fontSize: "0.875rem", marginTop: "4px", display: "block" }}>
              Minimum 6 caractères
            </small>
          </div>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" className="success" style={{ width: "100%" }}>Créer mon compte</button>
          <p style={{ textAlign: "center", marginTop: 16, color: "var(--gray-600)" }}>
            Déjà un compte ? <a href="/login" style={{ color: "var(--primary)", fontWeight: 600 }}>Connectez-vous</a>
          </p>
        </form>
      </div>
    </div>
  );
}
