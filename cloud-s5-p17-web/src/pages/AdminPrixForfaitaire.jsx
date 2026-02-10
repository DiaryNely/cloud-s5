import React, { useEffect, useState } from "react";
import {
  fetchPrixForfaitaire,
  createPrixForfaitaire,
  updatePrixForfaitaire,
  deletePrixForfaitaire,
} from "../api/prixForfaitaire.js";

export default function AdminPrixForfaitaire() {
  const [prixList, setPrixList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [form, setForm] = useState({ label: "", description: "", prixM2: "" });
  const [editingId, setEditingId] = useState(null);

  const loadData = async () => {
    try {
      setLoading(true);
      const data = await fetchPrixForfaitaire();
      setPrixList(data);
    } catch {
      setError("Impossible de charger les prix forfaitaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const resetForm = () => {
    setForm({ label: "", description: "", prixM2: "" });
    setEditingId(null);
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setMessage(null);

    if (!form.label.trim() || !form.prixM2) {
      setError("Le label et le prix au m² sont requis");
      return;
    }

    try {
      const payload = {
        label: form.label,
        description: form.description || null,
        prixM2: Number(form.prixM2),
      };

      if (editingId) {
        await updatePrixForfaitaire(editingId, payload);
        setMessage("✅ Prix forfaitaire modifié");
      } else {
        await createPrixForfaitaire(payload);
        setMessage("✅ Prix forfaitaire créé");
      }

      resetForm();
      await loadData();
    } catch (err) {
      setError(err?.response?.data?.error || "Erreur lors de la sauvegarde");
    }
  };

  const onEdit = (item) => {
    setEditingId(item.id);
    setForm({ label: item.label, description: item.description || "", prixM2: item.prixM2.toString() });
    setError(null);
    setMessage(null);
  };

  const onDelete = async (id) => {
    if (!confirm("Supprimer ce prix forfaitaire ?")) return;
    try {
      await deletePrixForfaitaire(id);
      setMessage("✅ Prix forfaitaire supprimé");
      await loadData();
    } catch {
      setError("Erreur lors de la suppression");
    }
  };

  if (loading) return <div className="loading"><div className="spinner" /></div>;

  return (
    <div>
      <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 8 }}>💰 Prix Forfaitaire</h2>
      <p style={{ color: "var(--gray-600)", marginBottom: 24 }}>
        Gérez les prix de réparation au m². Le budget d'un signalement est calculé automatiquement : surface × prix au m².
      </p>

      {message && <div className="alert success">{message}</div>}
      {error && <div className="alert error">{error}</div>}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        {/* Formulaire */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>
            {editingId ? "✏️ Modifier le prix" : "➕ Nouveau prix forfaitaire"}
          </h3>
          <form className="form" onSubmit={onSubmit}>
            <div className="form-group">
              <label className="form-label">Label *</label>
              <input type="text" placeholder="Ex: Réparation standard, Réparation lourde..."
                value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
            </div>

            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea placeholder="Description du type de réparation..."
                value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows="3" />
            </div>

            <div className="form-group">
              <label className="form-label">Prix au m² (Ar) *</label>
              <input type="number" step="any" placeholder="50000"
                value={form.prixM2} onChange={(e) => setForm({ ...form, prixM2: e.target.value })} required />
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <button type="submit" style={{ flex: 1 }}>
                {editingId ? "💾 Enregistrer" : "➕ Créer"}
              </button>
              {editingId && (
                <button type="button" className="secondary" onClick={resetForm}>Annuler</button>
              )}
            </div>
          </form>
        </div>

        {/* Liste */}
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>📋 Prix enregistrés ({prixList.length})</h3>

          {prixList.length === 0 ? (
            <p style={{ color: "var(--gray-600)", textAlign: "center", padding: 32 }}>
              Aucun prix forfaitaire défini.
            </p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {prixList.map((item) => (
                <div key={item.id} style={{
                  padding: "16px",
                  background: "var(--gray-50)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--gray-200)"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <strong style={{ fontSize: 16 }}>{item.label}</strong>
                    <span className="badge primary" style={{ fontSize: 14, fontWeight: 700 }}>
                      {item.prixM2.toLocaleString("fr-FR")} Ar/m²
                    </span>
                  </div>
                  {item.description && (
                    <p style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 10 }}>{item.description}</p>
                  )}
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className="secondary" style={{ padding: "6px 14px", fontSize: 13 }}
                      onClick={() => onEdit(item)}>✏️ Modifier</button>
                    <button className="danger" style={{ padding: "6px 14px", fontSize: 13 }}
                      onClick={() => onDelete(item.id)}>🗑️ Supprimer</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
