import React, { useEffect, useState } from "react";
import MapView from "../components/MapView.jsx";
import { fetchSignalements, fetchSummary } from "../api/signalements.js";

export default function Visitor() {
  const [markers, setMarkers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [items, stats] = await Promise.all([
          fetchSignalements(),
          fetchSummary()
        ]);
        setMarkers(
          items.map((item) => ({
            id: item.id,
            title: item.title,
            lat: item.latitude,
            lng: item.longitude,
            date: item.createdAt?.slice(0, 10),
            status: item.status,
            surface: item.surfaceM2,
            budget: item.budgetAr,
            company: item.entreprise
          }))
        );
        setSummary(stats);
      } catch (err) {
        setError("Impossible de charger les données");
      }
    };
    load();
  }, []);

  return (
    <div className="grid">
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>🗺️ Carte des signalements routiers d'Antananarivo</h2>
        <p style={{ color: "var(--gray-600)", marginBottom: 20 }}>Visualisez en temps réel tous les problèmes routiers signalés dans la ville</p>
        {error && <div className="alert error">{error}</div>}
        <MapView markers={markers} />
      </section>

      <section className="stats-grid">
        <div className="stat-card">
          <h4>Total signalements</h4>
          <div className="value">{summary?.totalSignalements ?? 0}</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--success) 0%, #059669 100%)" }}>
          <h4>Surface totale</h4>
          <div className="value">{summary?.surfaceTotale?.toFixed?.(0) ?? 0} m²</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--secondary) 0%, #7c3aed 100%)" }}>
          <h4>Avancement</h4>
          <div className="value">{summary?.avancement?.toFixed?.(0) ?? 0}%</div>
        </div>
        <div className="stat-card" style={{ background: "linear-gradient(135deg, var(--warning) 0%, #d97706 100%)" }}>
          <h4>Budget total</h4>
          <div className="value">{(summary?.budgetTotal ?? 0).toLocaleString()} Ar</div>
        </div>
      </section>
    </div>
  );
}
