import React, { useEffect, useState, useCallback } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { fetchSignalements } from "../api/signalements.js";

export default function Profile() {
  const { email, role, uid } = useAuth();
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSignalements(true);
      setSignalements(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const nbNouveau = signalements.filter(s => s.status === "NOUVEAU").length;
  const nbEnCours = signalements.filter(s => s.status === "EN_COURS").length;
  const nbTermine = signalements.filter(s => s.status === "TERMINE").length;

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 24 }}>Mon profil</h2>

      {/* Carte profil */}
      <div className="card" style={{ marginBottom: 24, display: "flex", gap: 32, alignItems: "center", flexWrap: "wrap" }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%",
          background: "linear-gradient(135deg, var(--primary) 0%, var(--secondary) 100%)",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 32, color: "white", fontWeight: 700, flexShrink: 0
        }}>
          {email?.[0]?.toUpperCase() ?? "?"}
        </div>
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 4 }}>{email}</div>
          <span className="badge primary" style={{ fontSize: 14 }}>{role}</span>
          {uid && <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 8, fontFamily: "monospace" }}>UID: {uid}</div>}
        </div>
      </div>

      {/* Statistiques personnelles */}
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📊 Mes statistiques</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Total signalements</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>{signalements.length}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Nouveau</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--warning)" }}>{nbNouveau}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>En cours</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)" }}>{nbEnCours}</div>
        </div>
        <div className="card" style={{ textAlign: "center", padding: 20 }}>
          <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Terminé</div>
          <div style={{ fontSize: 36, fontWeight: 700, color: "#059669" }}>{nbTermine}</div>
        </div>
      </div>

      {/* Liste de mes signalements */}
      <h3 style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>📋 Mes signalements</h3>
      {loading && <div className="loading"><div className="spinner"></div></div>}
      {!loading && signalements.length === 0 && (
        <div className="card" style={{ textAlign: "center", padding: 40, color: "var(--gray-600)" }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>📭</div>
          <p>Vous n'avez encore créé aucun signalement.</p>
          <a href="/signaler" style={{ color: "var(--primary)", fontWeight: 600, textDecoration: "none", marginTop: 8, display: "inline-block" }}>➕ Créer mon premier signalement</a>
        </div>
      )}
      {!loading && signalements.length > 0 && (
        <div className="card">
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Statut</th>
                  <th>Date</th>
                  <th>Surface</th>
                  <th>Budget</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map(s => (
                  <tr key={s.id}>
                    <td style={{ fontWeight: 600 }}>{s.title}</td>
                    <td>
                      <span className={`badge ${s.status === "TERMINE" ? "success" : s.status === "EN_COURS" ? "primary" : "warning"}`}>
                        {s.status}
                      </span>
                    </td>
                    <td style={{ fontSize: 13, color: "var(--gray-600)" }}>
                      {s.createdAt ? new Date(s.createdAt).toLocaleDateString("fr-FR") : "—"}
                    </td>
                    <td>{s.surfaceM2 ? `${s.surfaceM2} m²` : "—"}</td>
                    <td>{s.budgetAr ? `${s.budgetAr.toLocaleString()} Ar` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
