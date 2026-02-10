import React, { useEffect, useState, useCallback } from "react";
import MapView from "../components/MapView.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { createSignalement, fetchSignalements } from "../api/signalements.js";
import { fetchPrixForfaitaire } from "../api/prixForfaitaire.js";

export default function CreateSignalement() {
  const { email, role } = useAuth();
  const [markers, setMarkers] = useState([]);
  const [prixForfaitaire, setPrixForfaitaire] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    surfaceM2: "",
    entreprise: ""
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const loadMarkers = useCallback(async () => {
    try {
      const data = await fetchSignalements();
      setMarkers(data.map(item => ({
        id: item.id, title: item.title,
        lat: item.latitude, lng: item.longitude,
        status: item.status, date: item.createdAt?.slice(0, 10),
        surface: item.surfaceM2, budget: item.budgetAr,
        company: item.entreprise, niveau: item.niveau,
        userEmail: item.userEmail
      })));
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadMarkers(); }, [loadMarkers]);

  useEffect(() => {
    fetchPrixForfaitaire().then(list => {
      if (list.length > 0) setPrixForfaitaire(list[0]);
    }).catch(() => {});
  }, []);

  const budgetEstime = form.surfaceM2 && prixForfaitaire
    ? (Number(form.surfaceM2) * prixForfaitaire.prixM2)
    : null;

  const onCreate = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    if (!form.latitude || !form.longitude) {
      setError("Veuillez choisir un emplacement sur la carte");
      return;
    }
    setSubmitting(true);
    try {
      await createSignalement({
        title: form.title,
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        surfaceM2: form.surfaceM2 ? Number(form.surfaceM2) : null,
        entreprise: form.entreprise || null
      });
      setMessage("✅ Signalement créé avec succès !");
      setForm({ title: "", description: "", latitude: "", longitude: "", surfaceM2: "", entreprise: "" });
      await loadMarkers();
    } catch (err) {
      setError(err?.response?.data?.error || "Création impossible");
    } finally {
      setSubmitting(false);
    }
  };

  const useGeoLocation = () => {
    if (!navigator.geolocation) { setError("Géolocalisation non supportée"); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => setForm(prev => ({ ...prev, latitude: pos.coords.latitude, longitude: pos.coords.longitude })),
      () => setError("Impossible d'obtenir la position")
    );
  };

  const onPickLocation = (location) => {
    setForm(prev => ({ ...prev, latitude: location.lat, longitude: location.lng }));
  };

  const hasLocation = form.latitude && form.longitude;

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>Nouveau signalement</h2>
      <p style={{ color: "var(--gray-600)", marginBottom: 24 }}>Signalez un problème routier en cliquant sur la carte pour le localiser</p>

      <div className="create-grid">
        {/* Carte à gauche */}
        <div className="card" style={{ padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontWeight: 600 }}>📍 Cliquez pour placer le marqueur</span>
            <span className="badge primary" style={{ fontSize: 12 }}>{markers.length} existants</span>
          </div>
          <div style={{ height: 500 }}>
            <MapView
              markers={markers}
              selectable
              selectedPosition={hasLocation ? { lat: Number(form.latitude), lng: Number(form.longitude) } : null}
              onSelect={onPickLocation}
            />
          </div>
          {hasLocation && (
            <div style={{ padding: "12px 20px", background: "var(--gray-50)", borderTop: "1px solid var(--gray-200)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: 13, fontFamily: "monospace" }}>
                📍 {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}
              </span>
              <button className="secondary" style={{ padding: "6px 12px", fontSize: 13 }}
                onClick={() => setForm(prev => ({ ...prev, latitude: "", longitude: "" }))}>
                ✖ Effacer
              </button>
            </div>
          )}
        </div>

        {/* Formulaire à droite */}
        <div className="card create-form-card">
          <h3 style={{ marginBottom: 16 }}>✏️ Détails du signalement</h3>

          {message && <div className="alert success">{message}</div>}
          {error && <div className="alert error">{error}</div>}

          <form className="form" onSubmit={onCreate}>
            <div className="form-group">
              <label className="form-label">Titre *</label>
              <input type="text" placeholder="Ex: Nid de poule, route fissurée..." value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea placeholder="Décrivez le problème en détail..." value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })} rows="4" />
            </div>

            <div className="form-group">
              <label className="form-label">Localisation</label>
              {hasLocation ? (
                <div className="location-info" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <span>📍 {Number(form.latitude).toFixed(6)}, {Number(form.longitude).toFixed(6)}</span>
                </div>
              ) : (
                <div className="location-info" style={{ color: "var(--gray-600)" }}>
                  Cliquez sur la carte ou utilisez le bouton ci-dessous
                </div>
              )}
              <button type="button" className="secondary" onClick={useGeoLocation} style={{ marginTop: 8, width: "100%" }}>
                📍 Utiliser ma position GPS
              </button>
            </div>

            <div className="form-group">
              <label className="form-label">Surface (m²)</label>
              <input type="number" step="any" placeholder="0.00" value={form.surfaceM2}
                onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })} />
              {budgetEstime !== null && (
                <div style={{ marginTop: 8, padding: "10px 14px", background: "rgba(16, 185, 129, 0.08)", borderRadius: "var(--radius-md)", border: "1px solid rgba(16, 185, 129, 0.2)" }}>
                  <span style={{ fontSize: 13, color: "var(--gray-600)" }}>Budget estimé : </span>
                  <strong style={{ color: "#059669" }}>{budgetEstime.toLocaleString("fr-FR")} Ar</strong>
                  <span style={{ fontSize: 12, color: "var(--gray-600)", display: "block", marginTop: 2 }}>
                    ({prixForfaitaire.label} — {prixForfaitaire.prixM2.toLocaleString("fr-FR")} Ar/m²)
                  </span>
                </div>
              )}
            </div>

            {role === "MANAGER" && (
              <div className="form-group">
                <label className="form-label">Entreprise</label>
                <input type="text" placeholder="Nom de l'entreprise" value={form.entreprise}
                  onChange={(e) => setForm({ ...form, entreprise: e.target.value })} />
              </div>
            )}

            <button type="submit" className="success" disabled={submitting} style={{ width: "100%", marginTop: 8 }}>
              {submitting ? "⏳ Envoi..." : "🚀 Créer le signalement"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
