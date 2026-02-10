import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError(null);
    try {
      const result = await login(form);
      // Rediriger vers l'espace manager si le rôle est MANAGER
      if (result?.role === "MANAGER") {
        navigate("/admin");
      } else {
        navigate("/dashboard");
      }
    } catch (err) {
      setError(err?.response?.data?.error || "Connexion impossible");
    }
  };

  return (
    <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "calc(100vh - 200px)" }}>
      <div className="card" style={{ maxWidth: 440, width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: 32, marginBottom: 8 }}>🔐 Connexion</h2>
          <p style={{ color: "var(--gray-600)" }}>Accédez à votre compte Cloud S5</p>
        </div>
        <form className="form" onSubmit={onSubmit}>
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
            />
          </div>
          {error && <div className="alert error">{error}</div>}
          <button type="submit" style={{ width: "100%" }}>Se connecter</button>
        </form>
      </div>
    </div>
  );
}
