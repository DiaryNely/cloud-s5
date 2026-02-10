import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client.js";
import { fetchSignalements, updateSignalement } from "../api/signalements.js";
import { fetchPrixForfaitaire } from "../api/prixForfaitaire.js";

const STATUSES = ["NOUVEAU", "EN_COURS", "TERMINE"];
const STATUS_PERCENT = { NOUVEAU: 0, EN_COURS: 50, TERMINE: 100 };

// Couleur du niveau (1=vert clair, 5=orange, 10=rouge vif)
function niveauColor(n) {
  if (n <= 3) return "#22c55e";
  if (n <= 6) return "#f59e0b";
  if (n <= 8) return "#f97316";
  return "#ef4444";
}

export default function AdminSignalements() {
  const [signalements, setSignalements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [edits, setEdits] = useState({});
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [prixM2, setPrixM2] = useState(null);

  const loadSignalements = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSignalements();
      setSignalements(data);
    } catch (err) {
      setError(err?.response?.data?.error || "Erreur lors du chargement des signalements");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadSignalements(); }, [loadSignalements]);

  // Charger le prix forfaitaire pour le calcul automatique du budget
  useEffect(() => {
    fetchPrixForfaitaire().then(list => {
      if (list.length > 0) setPrixM2(list[0].prixM2);
    }).catch(() => {});
  }, []);

  const onEditChange = (id, field, value) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  // Quand le niveau change, recalculer le budget automatiquement
  const onNiveauChange = (item, newNiveau) => {
    const edit = edits[item.id] || {};
    const surface = edit.surfaceM2 ?? item.surfaceM2;
    const updates = { niveau: newNiveau };
    if (surface && prixM2) {
      updates.budgetAr = Math.round(surface * prixM2 * newNiveau);
    }
    setEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], ...updates } }));
  };

  // Quand la surface change, recalculer le budget avec le niveau actuel
  const onSurfaceChange = (item, newSurface) => {
    const edit = edits[item.id] || {};
    const niveau = edit.niveau ?? item.niveau ?? 1;
    const updates = { surfaceM2: newSurface };
    if (newSurface && prixM2) {
      updates.budgetAr = Math.round(newSurface * prixM2 * niveau);
    }
    setEdits(prev => ({ ...prev, [item.id]: { ...prev[item.id], ...updates } }));
  };

  const saveSignalement = async (signalement) => {
    const payload = edits[signalement.id];
    if (!payload) return;
    try {
      const finalPayload = { ...payload };
      const newStatus = finalPayload.status;
      if (newStatus === "EN_COURS" && !finalPayload.dateEnCours && !signalement.dateEnCours) {
        finalPayload.dateEnCours = new Date().toISOString();
      }
      if (newStatus === "TERMINE" && !finalPayload.dateTermine && !signalement.dateTermine) {
        finalPayload.dateTermine = new Date().toISOString();
      }
      await updateSignalement(signalement.id, finalPayload);
      setEdits(prev => { const copy = { ...prev }; delete copy[signalement.id]; return copy; });
      setError(null);
      setSaveSuccess(`Signalement #${signalement.id} mis à jour avec succès !`);
      setTimeout(() => setSaveSuccess(null), 3000);
      await loadSignalements();
    } catch (err) {
      const serverMsg = err?.response?.data?.error || err?.response?.data || err.message;
      setError(serverMsg || "Mise à jour impossible");
    }
  };

  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedSignalement) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append("photo", photoFile);
      const response = await api.post(`/api/signalements/${selectedSignalement.id}/photo`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setSaveSuccess("✅ Photo ajoutée avec succès !");
      setTimeout(() => setSaveSuccess(null), 3000);
      setSelectedSignalement(prev => ({ ...prev, photoUrl: response.data.photoUrl }));
      setPhotoFile(null);
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = "";
    } catch (err) {
      setError(err?.response?.data?.error || "Impossible d'uploader la photo");
      setTimeout(() => setError(null), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const buildHistory = (sig) => {
    if (!sig) return [];
    const local = edits[sig.id] || {};
    const getVal = (key) => local[key] ?? sig[key] ?? null;
    const rows = [];
    const dN = getVal("dateNouveau") || sig.createdAt;
    if (dN) rows.push({ stage: "NOUVEAU", date: dN });
    const dC = getVal("dateEnCours");
    if (dC) rows.push({ stage: "EN_COURS", date: dC });
    const dT = getVal("dateTermine");
    if (dT) rows.push({ stage: "TERMINE", date: dT });
    return rows;
  };

  // Stats
  const nbNouveau = signalements.filter(s => ((edits[s.id] && edits[s.id].status) || s.status) === "NOUVEAU").length;
  const nbEnCours = signalements.filter(s => ((edits[s.id] && edits[s.id].status) || s.status) === "EN_COURS").length;
  const nbTermine = signalements.filter(s => ((edits[s.id] && edits[s.id].status) || s.status) === "TERMINE").length;

  // Délais
  const completedSigs = signalements.filter(s => s.dateTermine);
  const avgTotal = completedSigs.length ? (completedSigs.reduce((sum, s) => {
    const start = new Date(s.dateNouveau || s.createdAt);
    const end = new Date(s.dateTermine);
    return sum + (end - start) / (1000 * 60 * 60 * 24);
  }, 0) / completedSigs.length).toFixed(1) : null;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Gestion des signalements</h2>
          <p style={{ color: "var(--gray-600)" }}>Modifier le statut, la surface, le budget et l'entreprise</p>
        </div>
        <button className="secondary" onClick={loadSignalements}>🔄 Rafraîchir</button>
      </div>

      {/* Stats rapides */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24, flexWrap: "wrap" }}>
        <div style={{ flex: 1, minWidth: 140, padding: 16, background: "white", borderRadius: 12, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Total</div>
          <div style={{ fontSize: 28, fontWeight: 700 }}>{signalements.length}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140, padding: 16, background: "white", borderRadius: 12, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Nouveau</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--warning)" }}>{nbNouveau}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140, padding: 16, background: "white", borderRadius: 12, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>En cours</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--primary)" }}>{nbEnCours}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140, padding: 16, background: "white", borderRadius: 12, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Terminé</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#059669" }}>{nbTermine}</div>
        </div>
        <div style={{ flex: 1, minWidth: 140, padding: 16, background: "white", borderRadius: 12, boxShadow: "var(--shadow-sm)", textAlign: "center" }}>
          <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Délai moyen</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: "var(--secondary)" }}>{avgTotal ?? "—"}<small style={{ fontSize: 12 }}> j</small></div>
        </div>
      </div>

      {saveSuccess && <div className="alert success" style={{ marginBottom: 16 }}>{saveSuccess}</div>}
      {error && <div className="alert error" style={{ marginBottom: 16 }}>{error}</div>}

      {loading && <div className="loading"><div className="spinner"></div></div>}

      {!loading && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <span className="badge primary">{signalements.length} signalement{signalements.length > 1 ? "s" : ""}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Titre</th>
                  <th>Signalé par</th>
                  <th>Date</th>
                  <th>Date Nouveau</th>
                  <th>Date En cours</th>
                  <th>Date Terminé</th>
                  <th>Statut</th>
                  <th>%</th>
                  <th>Niveau</th>
                  <th>Surface</th>
                  <th>Budget</th>
                  <th>Entreprise</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {signalements.map((item) => {
                  const edit = edits[item.id] || {};
                  const hasChanges = Object.keys(edit).length > 0;
                  return (
                    <tr key={item.id}>
                      <td>
                        <a href="#" onClick={(e) => { e.preventDefault(); setSelectedSignalement({ ...item, ...edit }); }}
                          style={{ fontWeight: 700, color: "inherit", textDecoration: "none", cursor: "pointer" }} title="Voir détails">
                          {item.title}
                        </a>
                        {item.description && (
                          <div style={{ fontSize: 12, color: "var(--gray-600)", marginTop: 4 }}>
                            {item.description.length > 50 ? item.description.substring(0, 50) + "..." : item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: 13 }}>
                          <div style={{ fontWeight: 600 }}>{item.userEmail}</div>
                          <div style={{ fontSize: 11, color: "var(--gray-500)" }}>{item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}</div>
                        </div>
                      </td>
                      <td style={{ fontSize: 12, color: "var(--gray-600)" }}>{item.createdAt ? new Date(item.createdAt).toLocaleDateString("fr-FR") : "—"}</td>
                      <td><input type="date" value={(edit.dateNouveau ?? item.dateNouveau ?? item.createdAt)?.slice?.(0, 10) ?? ""} onChange={(e) => onEditChange(item.id, "dateNouveau", e.target.value ? new Date(e.target.value).toISOString() : null)} style={{ width: 130 }} /></td>
                      <td><input type="date" value={(edit.dateEnCours ?? item.dateEnCours)?.slice?.(0, 10) ?? ""} onChange={(e) => onEditChange(item.id, "dateEnCours", e.target.value ? new Date(e.target.value).toISOString() : null)} style={{ width: 130 }} /></td>
                      <td><input type="date" value={(edit.dateTermine ?? item.dateTermine)?.slice?.(0, 10) ?? ""} onChange={(e) => onEditChange(item.id, "dateTermine", e.target.value ? new Date(e.target.value).toISOString() : null)} style={{ width: 130 }} /></td>
                      <td>
                        <select value={edit.status ?? item.status} onChange={(e) => onEditChange(item.id, "status", e.target.value)} style={{ minWidth: 120 }}>
                          {STATUSES.map(s => <option key={s} value={s}>{s} ({STATUS_PERCENT[s]}%)</option>)}
                        </select>
                      </td>
                      <td style={{ textAlign: "center" }}>{STATUS_PERCENT[(edit.status ?? item.status)] ?? "—"}%</td>
                      <td>
                        <div className="niveau-selector">
                          {[1,2,3,4,5,6,7,8,9,10].map(n => {
                            const current = edit.niveau ?? item.niveau ?? 1;
                            const active = n <= current;
                            return (
                              <button
                                key={n}
                                className={`niveau-dot ${active ? "active" : ""}`}
                                style={{ 
                                  background: active ? niveauColor(current) : "var(--gray-200)",
                                  color: active ? "#fff" : "var(--gray-500)"
                                }}
                                onClick={() => onNiveauChange(item, n)}
                                title={`Niveau ${n}`}
                              >
                                {n}
                              </button>
                            );
                          })}
                          <span className="niveau-label" style={{ color: niveauColor(edit.niveau ?? item.niveau ?? 1) }}>
                            {edit.niveau ?? item.niveau ?? 1}/10
                          </span>
                        </div>
                      </td>
                      <td><input type="number" step="any" value={edit.surfaceM2 ?? item.surfaceM2 ?? ""} onChange={(e) => onSurfaceChange(item, e.target.value ? Number(e.target.value) : null)} style={{ width: 100 }} /></td>
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 13, whiteSpace: "nowrap" }}>
                          {((edit.budgetAr ?? item.budgetAr) || 0).toLocaleString("fr-FR")} Ar
                        </div>
                        {prixM2 && <div style={{ fontSize: 10, color: "var(--gray-500)" }}>{prixM2.toLocaleString("fr-FR")} × {edit.niveau ?? item.niveau ?? 1} × {(edit.surfaceM2 ?? item.surfaceM2 ?? 0)}</div>}
                      </td>
                      <td><input type="text" value={edit.entreprise ?? item.entreprise ?? ""} onChange={(e) => onEditChange(item.id, "entreprise", e.target.value)} style={{ minWidth: 150 }} placeholder="Entreprise" /></td>
                      <td>
                        <div style={{ display: "flex", gap: 8 }}>
                          <button className={hasChanges ? "success" : "secondary"} onClick={() => saveSignalement(item)} disabled={!hasChanges}>
                            💾
                          </button>
                          <button className="secondary" onClick={() => setSelectedSignalement({ ...item, ...edit })}>🔍</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal détail */}
      {selectedSignalement && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }} onClick={() => setSelectedSignalement(null)}>
          <div style={{ width: 820, maxWidth: "95%", background: "white", borderRadius: 12, padding: 24, maxHeight: "90vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h3>📝 Détail signalement</h3>
              <button className="secondary" onClick={() => setSelectedSignalement(null)}>✖ Fermer</button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
              <div><div style={{ fontSize: 12, color: "var(--gray-600)" }}>Titre</div><div style={{ fontWeight: 600 }}>{selectedSignalement.title}</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-600)" }}>Statut</div><div style={{ fontWeight: 600 }}>{selectedSignalement.status} ({STATUS_PERCENT[selectedSignalement.status] ?? "—"}%)</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-600)" }}>Signalé par</div><div>{selectedSignalement.userEmail}</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-600)" }}>Niveau de réparation</div><div style={{ fontWeight: 600, color: niveauColor(selectedSignalement.niveau ?? 1) }}>{selectedSignalement.niveau ?? 1}/10</div></div>
              <div><div style={{ fontSize: 12, color: "var(--gray-600)" }}>Créé le</div><div>{selectedSignalement.createdAt ? new Date(selectedSignalement.createdAt).toLocaleString("fr-FR") : "—"}</div></div>
            </div>

            <h4>📜 Historique</h4>
            <table className="table" style={{ marginBottom: 16 }}>
              <thead><tr><th>Étape</th><th>Date</th></tr></thead>
              <tbody>
                {buildHistory(selectedSignalement).map((r, i) => (
                  <tr key={i}><td>{r.stage}</td><td>{r.date ? new Date(r.date).toLocaleString("fr-FR") : "—"}</td></tr>
                ))}
              </tbody>
            </table>

            <h4>📷 Photo</h4>
            {selectedSignalement.photoUrl && selectedSignalement.photoUrl !== "null" && selectedSignalement.photoUrl.trim() !== "" ? (
              <div style={{ marginBottom: 16, padding: 16, background: "var(--gray-50)", borderRadius: 8 }}>
                <img src={`http://localhost:8083${selectedSignalement.photoUrl}`} alt="Photo" style={{ maxWidth: "100%", maxHeight: 400, borderRadius: 8, display: "block", margin: "0 auto" }}
                  onError={(e) => { e.target.style.display = "none"; e.target.nextSibling.style.display = "block"; }} />
                <div style={{ display: "none", padding: 20, textAlign: "center", color: "var(--gray-500)" }}>⚠️ Impossible de charger</div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: 20, background: "var(--gray-50)", borderRadius: 8, textAlign: "center", color: "var(--gray-500)" }}>📷 Aucune photo</div>
            )}
            <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 16 }}>
              <input type="file" accept="image/*" onChange={(e) => setPhotoFile(e.target.files[0])} style={{ flex: 1 }} />
              <button className="primary" onClick={handlePhotoUpload} disabled={!photoFile || uploadingPhoto}>
                {uploadingPhoto ? "⏳ Upload..." : "📤 Uploader"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
