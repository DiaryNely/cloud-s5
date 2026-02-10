import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchSignalements, fetchSummary } from "../api/signalements.js";
import { fetchUsers as apiFetchUsers } from "../api/users.js";

export default function AdminDashboard() {
  const { email } = useAuth();
  const [users, setUsers] = useState([]);
  const [signalements, setSignalements] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [usersData, sigData, summaryData] = await Promise.all([
        apiFetchUsers(),
        fetchSignalements(),
        fetchSummary()
      ]);
      setUsers(usersData);
      setSignalements(sigData);
      setSummary(summaryData);
    } catch (err) {
      console.error("Erreur chargement dashboard:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const nbNouveau = signalements.filter(s => s.status === "NOUVEAU").length;
  const nbEnCours = signalements.filter(s => s.status === "EN_COURS").length;
  const nbTermine = signalements.filter(s => s.status === "TERMINE").length;
  const nbManagers = users.filter(u => u.role === "MANAGER").length;
  const nbUsers = users.filter(u => u.role !== "MANAGER").length;
  const nbBlocked = users.filter(u => u.blocked).length;

  // Délai moyen de traitement
  const completedWithDates = signalements.filter(s => s.dateTermine && (s.dateNouveau || s.createdAt));
  const avgDays = completedWithDates.length
    ? (completedWithDates.reduce((sum, s) => {
        const start = new Date(s.dateNouveau || s.createdAt);
        const end = new Date(s.dateTermine);
        return sum + (end - start) / (1000 * 60 * 60 * 24);
      }, 0) / completedWithDates.length).toFixed(1)
    : null;

  if (loading) {
    return <div className="loading"><div className="spinner"></div></div>;
  }

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Tableau de bord</h2>
        <p style={{ color: "var(--gray-600)" }}>Vue d'ensemble de l'application</p>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid" style={{ gridColumn: "1 / -1", marginBottom: 32 }}>
        <div className="stat-card">
          <h4>Total signalements</h4>
          <div className="value">{signalements.length}</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--success) 0%, #059669 100%)" }}>
          <h4>Terminés</h4>
          <div className="value">{nbTermine}</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--warning) 0%, #d97706 100%)" }}>
          <h4>En cours</h4>
          <div className="value">{nbEnCours}</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)" }}>
          <h4>Utilisateurs</h4>
          <div className="value">{users.length}</div>
        </div>
      </div>

      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* Répartition signalements */}
        <div className="card">
          <h3>📋 Répartition des signalements</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>🆕 Nouveau</span>
              <span className="badge warning">{nbNouveau}</span>
            </div>
            <div style={{ height: 8, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${signalements.length ? (nbNouveau / signalements.length * 100) : 0}%`, background: "var(--warning)", borderRadius: 99, transition: "width 0.5s" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>🔧 En cours</span>
              <span className="badge primary">{nbEnCours}</span>
            </div>
            <div style={{ height: 8, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${signalements.length ? (nbEnCours / signalements.length * 100) : 0}%`, background: "var(--primary)", borderRadius: 99, transition: "width 0.5s" }} />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontWeight: 500 }}>✅ Terminé</span>
              <span className="badge success">{nbTermine}</span>
            </div>
            <div style={{ height: 8, background: "var(--gray-100)", borderRadius: 99, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${signalements.length ? (nbTermine / signalements.length * 100) : 0}%`, background: "var(--success)", borderRadius: 99, transition: "width 0.5s" }} />
            </div>
          </div>
        </div>

        {/* Info utilisateurs */}
        <div className="card">
          <h3>👥 Utilisateurs</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 20, marginTop: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Managers</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{nbManagers}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Utilisateurs standard</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--secondary)" }}>{nbUsers}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>Bloqués</span>
              <span style={{ fontSize: 28, fontWeight: 700, color: "var(--danger)" }}>{nbBlocked}</span>
            </div>
          </div>
        </div>

        {/* Statistiques traitement */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h3>⏱️ Performances</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 24, marginTop: 16 }}>
            <div style={{ textAlign: "center", padding: 20, background: "var(--gray-50)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Avancement global</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--primary)" }}>
                {summary?.avancement?.toFixed?.(0) ?? 0}%
              </div>
            </div>
            <div style={{ textAlign: "center", padding: 20, background: "var(--gray-50)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Délai moyen traitement</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "#059669" }}>
                {avgDays ?? "—"}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>jours</div>
            </div>
            <div style={{ textAlign: "center", padding: 20, background: "var(--gray-50)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Surface totale</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--warning)" }}>
                {summary?.surfaceTotale?.toFixed?.(0) ?? 0}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>m²</div>
            </div>
            <div style={{ textAlign: "center", padding: 20, background: "var(--gray-50)", borderRadius: 12 }}>
              <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Budget total</div>
              <div style={{ fontSize: 40, fontWeight: 700, color: "var(--secondary)" }}>
                {((summary?.budgetTotal ?? 0) / 1000000).toFixed(1)}
              </div>
              <div style={{ fontSize: 12, color: "var(--gray-500)" }}>M Ar</div>
            </div>
          </div>
        </div>

        {/* Derniers signalements */}
        <div className="card" style={{ gridColumn: "1 / -1" }}>
          <h3>🕐 Derniers signalements</h3>
          <table className="table" style={{ marginTop: 16 }}>
            <thead>
              <tr>
                <th>Titre</th>
                <th>Signalé par</th>
                <th>Statut</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {signalements.slice(-5).reverse().map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: 600 }}>{s.title}</td>
                  <td style={{ fontSize: 13, color: "var(--gray-600)" }}>{s.userEmail}</td>
                  <td>
                    <span className={`badge ${s.status === "TERMINE" ? "success" : s.status === "EN_COURS" ? "primary" : "warning"}`}>
                      {s.status}
                    </span>
                  </td>
                  <td style={{ fontSize: 13, color: "var(--gray-600)" }}>
                    {s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : "—"}
                  </td>
                </tr>
              ))}
              {signalements.length === 0 && (
                <tr><td colSpan={4} style={{ textAlign: "center", color: "var(--gray-600)", padding: 24 }}>Aucun signalement</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
