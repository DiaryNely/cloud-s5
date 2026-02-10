import React, { useEffect, useState, useCallback } from "react";
import MapView from "../components/MapView.jsx";
import { useAuth } from "../auth/AuthContext.jsx";
import { createSignalement, fetchSignalements } from "../api/signalements.js";

export default function Dashboard() {
  const { email, role } = useAuth();
  const [onlyMine, setOnlyMine] = useState(false);
  const [allMarkers, setAllMarkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    latitude: "",
    longitude: "",
    surfaceM2: "",
    budgetAr: "",
    entreprise: ""
  });
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  // Charger les signalements depuis l'API REST (PostgreSQL)
  const loadSignalements = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const data = await fetchSignalements();
      const transformed = data.map((item) => ({
        id: item.id,
        title: item.title,
        lat: item.latitude,
        lng: item.longitude,
        date: item.createdAt?.slice(0, 10),
        status: item.status,
        surface: item.surfaceM2,
        budget: item.budgetAr,
        company: item.entreprise,
        userEmail: item.userEmail,
        dateNouveau: item.dateNouveau,
        dateEnCours: item.dateEnCours,
        dateTermine: item.dateTermine,
        createdAt: item.createdAt,
        photoUrl: item.photoUrl
      }));
      setAllMarkers(transformed);
    } catch (err) {
      setLoadError(err?.response?.data?.error || "Erreur lors du chargement des signalements");
    } finally {
      setLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadSignalements();
  }, [loadSignalements]);

  // Filtrer les signalements selon le filtre "onlyMine"
  const markers = onlyMine
    ? allMarkers.filter((m) => m.userEmail === email)
    : allMarkers;

  const onCreate = async (event) => {
    event.preventDefault();
    setError(null);
    setMessage(null);
    try {
      if (!form.latitude || !form.longitude) {
        setError("Choisis une localisation sur la carte");
        return;
      }
      await createSignalement({
        title: form.title,
        description: form.description,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
        surfaceM2: form.surfaceM2 ? Number(form.surfaceM2) : null,
        budgetAr: form.budgetAr ? Number(form.budgetAr) : null,
        entreprise: form.entreprise || null
      });
      setMessage("Signalement créé");
      setForm({
        title: "",
        description: "",
        latitude: "",
        longitude: "",
        surfaceM2: "",
        budgetAr: "",
        entreprise: ""
      });
      // Recharger les signalements depuis la BDD
      await loadSignalements();
    } catch (err) {
      setError(err?.response?.data?.error || "Création impossible");
    }
  };

  const useLocation = () => {
    if (!navigator.geolocation) {
      setError("Géolocalisation non supportée");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) => ({
          ...prev,
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        }));
      },
      () => setError("Impossible d'obtenir la position")
    );
  };

  const onPickLocation = (location) => {
    setForm((prev) => ({
      ...prev,
      latitude: location.lat,
      longitude: location.lng
    }));
  };

  return (
    <div className="grid">
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h2>📍 Carte interactive des signalements</h2>
        <div style={{ marginBottom: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <label style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }}>
            <input
              type="checkbox"
              checked={onlyMine}
              onChange={(e) => setOnlyMine(e.target.checked)}
              style={{ cursor: "pointer" }}
            />
            <span style={{ fontWeight: 500 }}>Afficher uniquement mes signalements</span>
          </label>
          <span className="badge primary">{markers.length} signalement{markers.length > 1 ? 's' : ''}</span>
        </div>
        {loading && <div className="alert">⏳ Chargement des signalements...</div>}
        {loadError && <div className="alert error">{loadError}</div>}
        {error && <div className="alert error">{error}</div>}
        <MapView
          markers={markers}
          selectable
          selectedPosition={
            form.latitude && form.longitude
              ? { lat: Number(form.latitude), lng: Number(form.longitude) }
              : null
          }
          onSelect={onPickLocation}
        />
      </section>

      <section className="card">
        <h3>👤 Mon profil</h3>
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 16 }}>
          <div>
            <strong style={{ color: "var(--gray-600)", fontSize: 14 }}>Email</strong>
            <div style={{ fontSize: 16, marginTop: 4 }}>{email}</div>
          </div>
          <div>
            <strong style={{ color: "var(--gray-600)", fontSize: 14 }}>Rôle</strong>
            <div style={{ marginTop: 4 }}><span className="badge primary">{role}</span></div>
          </div>
          <div>
            <strong style={{ color: "var(--gray-600)", fontSize: 14 }}>Mes signalements</strong>
            <div style={{ fontSize: 24, fontWeight: 700, color: "var(--primary)", marginTop: 4 }}>{markers.length}</div>
          </div>
        </div>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>✨ Créer un nouveau signalement</h3>
        <p style={{ color: "var(--gray-600)", marginBottom: 20 }}>Cliquez sur la carte ci-dessus pour localiser le problème</p>
        {message && <div className="alert success">{message}</div>}
        <form className="form" onSubmit={onCreate}>
          <div className="form-group">
            <label className="form-label">Titre du problème *</label>
            <input
              type="text"
              placeholder="Ex: Nid de poule, route fissurée..."
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
            />
          </div>
          
          <div className="form-group">
            <label className="form-label">Description</label>
            <textarea
              placeholder="Décrivez le problème en détail..."
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              rows="3"
            />
          </div>
          
          <div className="location-info">
            <strong>📍 Localisation:</strong>{" "}
            {form.latitude && form.longitude
              ? `${Number(form.latitude).toFixed(6)}, ${Number(form.longitude).toFixed(6)}`
              : "Cliquez sur la carte pour choisir l'emplacement"}
          </div>
          
          <div className="btn-group">
            <button type="button" className="secondary" onClick={useLocation}>📍 Utiliser ma position</button>
            <button
              type="button"
              className="secondary"
              onClick={() => setForm((prev) => ({ ...prev, latitude: "", longitude: "" }))}
            >
              🗑️ Effacer
            </button>
          </div>
          
          <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
            <div className="form-group">
              <label className="form-label">Surface (m²)</label>
              <input
                type="number"
                step="any"
                placeholder="0.00"
                value={form.surfaceM2}
                onChange={(e) => setForm({ ...form, surfaceM2: e.target.value })}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Budget estimé (Ar)</label>
              <input
                type="number"
                step="any"
                placeholder="0"
                value={form.budgetAr}
                onChange={(e) => setForm({ ...form, budgetAr: e.target.value })}
              />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Entreprise concernée</label>
            <input
              type="text"
              placeholder="Nom de l'entreprise"
              value={form.entreprise}
              onChange={(e) => setForm({ ...form, entreprise: e.target.value })}
            />
          </div>
          
          <button type="submit" className="success">🚀 Créer le signalement</button>
        </form>
      </section>
    </div>
  );
}
