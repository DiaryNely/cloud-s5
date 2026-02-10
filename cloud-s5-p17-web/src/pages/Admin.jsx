import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client.js";
import { fetchSignalements, updateSignalement } from "../api/signalements.js";
import { fetchUsers as apiFetchUsers, blockUser as apiBlockUser, unblockUser as apiUnblockUser, deleteUser as apiDeleteUser, syncToFirebase as apiSyncToFirebase } from "../api/users.js";

const STATUSES = ["NOUVEAU", "EN_COURS", "TERMINE"];

// Mapping statut -> avancement en pourcentage
const STATUS_PERCENT = {
  NOUVEAU: 0,
  EN_COURS: 50,
  TERMINE: 100
};

export default function Admin() {
  // État pour les utilisateurs (via REST API PostgreSQL)
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // État pour les signalements (via REST API PostgreSQL)
  const [signalements, setSignalements] = useState([]);
  const [signalementsLoading, setSignalementsLoading] = useState(true);
  const [signalementsError, setSignalementsError] = useState(null);
  const [edits, setEdits] = useState({});
  const [selectedSignalement, setSelectedSignalement] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  
  // État pour la création d'utilisateur
  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({
    email: "",
    password: "",
    role: "USER"
  });
  const [userFormError, setUserFormError] = useState(null);
  const [userFormMessage, setUserFormMessage] = useState(null);

  // État pour la modification d'utilisateur
  const [editingUser, setEditingUser] = useState(null);
  const [userEdits, setUserEdits] = useState({});
  
  // État pour la synchronisation Firebase
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [syncError, setSyncError] = useState(null);

  // Charger les utilisateurs depuis l'API REST (PostgreSQL)
  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchUsers();
      const mapped = data.map(u => ({
        uid: u.uid,
        email: u.email,
        role: u.role || 'USER',
        nom: u.nom,
        prenom: u.prenom,
        numEtu: u.numEtu,
        isBlocked: u.blocked,
        syncedToFirebase: u.syncedToFirebase,
        firebaseUid: u.firebaseUid || u.uid
      }));
      setUsers(mapped);
    } catch (err) {
      setError(err?.response?.data?.error || "Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  }, []);

  // Charger les signalements depuis l'API REST (PostgreSQL)
  const loadSignalements = useCallback(async () => {
    setSignalementsLoading(true);
    setSignalementsError(null);
    try {
      const data = await fetchSignalements();
      setSignalements(data);
    } catch (err) {
      setSignalementsError(err?.response?.data?.error || "Erreur lors du chargement des signalements");
    } finally {
      setSignalementsLoading(false);
    }
  }, []);

  // Chargement initial
  useEffect(() => {
    loadUsers();
    loadSignalements();
  }, [loadUsers, loadSignalements]);

  const blockUser = async (uid) => {
    await apiBlockUser(uid);
    await loadUsers();
  };

  const unblockUser = async (uid) => {
    await apiUnblockUser(uid);
    await loadUsers();
  };

  const createUser = async (event) => {
    event.preventDefault();
    setUserFormError(null);
    setUserFormMessage(null);
    
    try {
      await api.post("/api/admin/users", {
        email: userForm.email,
        password: userForm.password,
        role: userForm.role
      });
      
      setUserFormMessage("✅ Utilisateur créé avec succès");
      setUserForm({ email: "", password: "", role: "USER" });
      setShowUserForm(false);
      await loadUsers();
    } catch (err) {
      setUserFormError(err?.response?.data?.error || "Impossible de créer l'utilisateur");
    }
  };

  const updateUser = async (uid) => {
    const payload = userEdits[uid];
    if (!payload) return;
    
    try {
      await api.patch(`/api/admin/users/${uid}`, payload);
      setEditingUser(null);
      setUserEdits({});
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Modification impossible");
    }
  };

  const deleteUser = async (uid) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cet utilisateur ?")) return;
    
    try {
      await api.delete(`/api/admin/users/${uid}`);
      await loadUsers();
    } catch (err) {
      setError(err?.response?.data?.error || "Suppression impossible");
    }
  };
  
  const syncToFirebase = async () => {
    if (!confirm("Voulez-vous synchroniser tous les utilisateurs non synchronisés vers Firebase ?")) return;
    
    setSyncLoading(true);
    setSyncError(null);
    setSyncMessage(null);
    
    try {
      const data = await apiSyncToFirebase();
      setSyncMessage(`✅ ${data.syncedCount || 0} utilisateur(s) synchronisé(s) avec succès !`);
      await loadUsers();
    } catch (err) {
      setSyncError(err?.response?.data?.error || "Erreur lors de la synchronisation");
    } finally {
      setSyncLoading(false);
    }
  };

  const onUserEditChange = (uid, field, value) => {
    setUserEdits((prev) => ({
      ...prev,
      [uid]: {
        ...prev[uid],
        [field]: value
      }
    }));
  };

  const onEditChange = (id, field, value) => {
    setEdits((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: value
      }
    }));
  };

  const saveSignalement = async (signalement) => {
    const payload = edits[signalement.id];
    if (!payload) return;
    try {
      // Si un statut a été changé et que la date correspondante est vide,
      // on remplit automatiquement la date courante pour tracer l'avancement.
      const finalPayload = { ...payload };
      const newStatus = finalPayload.status;
      if (newStatus === "EN_COURS" && !finalPayload.dateEnCours && !signalement.dateEnCours) {
        finalPayload.dateEnCours = new Date().toISOString();
      }
      if (newStatus === "TERMINE" && !finalPayload.dateTermine && !signalement.dateTermine) {
        finalPayload.dateTermine = new Date().toISOString();
      }

      await updateSignalement(signalement.id, finalPayload);
      // Supprimer les edits locaux pour cet élément (s'il y en avait)
      setEdits(prev => {
        const copy = { ...prev };
        delete copy[signalement.id];
        return copy;
      });
      // Effacer d'éventuelles erreurs affichées
      setSignalementsError(null);
      // Afficher message de succès
      setSaveSuccess(`Signalement #${signalement.id} mis à jour avec succès !`);
      setTimeout(() => setSaveSuccess(null), 3000);
      console.log(`Signalement ${signalement.id} mis à jour`, finalPayload);
      // Recharger les signalements depuis la BDD
      await loadSignalements();
    } catch (err) {
      console.error('Erreur updateSignalement:', err);
      const serverMsg = err?.response?.data?.error || err?.response?.data || err.message;
      setSignalementsError(serverMsg || "Mise à jour impossible");
    }
  };

  // Statistiques basiques : délai moyen de traitement (createdAt -> dateTermine)
  const completedSignalements = signalements.filter(s => s.dateTermine || (edits[s.id] && edits[s.id].dateTermine));
  
  // Temps de traitement total (NOUVEAU → TERMINE)
  const tempsTotalDurations = completedSignalements.map(s => {
    const start = s.dateNouveau || s.createdAt;
    const endIso = (edits[s.id] && edits[s.id].dateTermine) || s.dateTermine;
    if (!start || !endIso) return null;
    return (new Date(endIso) - new Date(start)) / (1000 * 60 * 60 * 24);
  }).filter(d => d !== null && !isNaN(d));
  const tempsTotal = tempsTotalDurations.length ? (tempsTotalDurations.reduce((a,b) => a + b, 0) / tempsTotalDurations.length) : null;

  // Temps d'attente (NOUVEAU → EN_COURS)
  const enCoursOrTermine = signalements.filter(s => s.dateEnCours || (edits[s.id] && edits[s.id].dateEnCours));
  const tempsAttenteDurations = enCoursOrTermine.map(s => {
    const start = s.dateNouveau || s.createdAt;
    const endIso = (edits[s.id] && edits[s.id].dateEnCours) || s.dateEnCours;
    if (!start || !endIso) return null;
    return (new Date(endIso) - new Date(start)) / (1000 * 60 * 60 * 24);
  }).filter(d => d !== null && !isNaN(d));
  const tempsAttente = tempsAttenteDurations.length ? (tempsAttenteDurations.reduce((a,b) => a + b, 0) / tempsAttenteDurations.length) : null;

  // Temps d'exécution (EN_COURS → TERMINE)
  const tempsExecutionDurations = completedSignalements.map(s => {
    const startIso = (edits[s.id] && edits[s.id].dateEnCours) || s.dateEnCours;
    const endIso = (edits[s.id] && edits[s.id].dateTermine) || s.dateTermine;
    if (!startIso || !endIso) return null;
    return (new Date(endIso) - new Date(startIso)) / (1000 * 60 * 60 * 24);
  }).filter(d => d !== null && !isNaN(d));
  const tempsExecution = tempsExecutionDurations.length ? (tempsExecutionDurations.reduce((a,b) => a + b, 0) / tempsExecutionDurations.length) : null;

  // Compteurs par statut
  const travauxAttente = signalements.filter(s => {
    const status = (edits[s.id] && edits[s.id].status) || s.status;
    return status === 'NOUVEAU';
  }).length;
  const travauxEnCours = signalements.filter(s => {
    const status = (edits[s.id] && edits[s.id].status) || s.status;
    return status === 'EN_COURS';
  }).length;
  const travauxTermines = signalements.filter(s => {
    const status = (edits[s.id] && edits[s.id].status) || s.status;
    return status === 'TERMINE';
  }).length;

  // Détail / historique pour le signalement sélectionné
  const handlePhotoUpload = async () => {
    if (!photoFile || !selectedSignalement) return;
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', photoFile);
      
      const response = await api.post(`/api/signalements/${selectedSignalement.id}/photo`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      setSaveSuccess(`✅ Photo ajoutée avec succès !`);
      setTimeout(() => setSaveSuccess(null), 3000);
      
      // Mettre à jour le signalement avec la nouvelle photo
      setSelectedSignalement(prev => ({
        ...prev,
        photoUrl: response.data.photoUrl
      }));
      
      setPhotoFile(null);
      // Réinitialiser le input file
      const fileInput = document.querySelector('input[type="file"]');
      if (fileInput) fileInput.value = '';
    } catch (err) {
      console.error('Erreur upload photo:', err);
      setSignalementsError(err?.response?.data?.error || "Impossible d'uploader la photo");
      setTimeout(() => setSignalementsError(null), 3000);
    } finally {
      setUploadingPhoto(false);
    }
  };

  const buildHistory = (sig) => {
    if (!sig) return [];
    const id = sig.id;
    const local = edits[id] || {};
    const getVal = (key) => local[key] ?? sig[key] ?? null;
    const rows = [];
    // Date nouveau (prefer createdAt if dateNouveau missing)
    const dN = getVal('dateNouveau') || sig.createdAt;
    if (dN) rows.push({ stage: 'NOUVEAU', date: dN, note: '' });
    const dC = getVal('dateEnCours');
    if (dC) rows.push({ stage: 'EN_COURS', date: dC, note: '' });
    const dT = getVal('dateTermine');
    if (dT) rows.push({ stage: 'TERMINE', date: dT, note: '' });
    return rows;
  };

  return (
    <div className="grid">
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, flexWrap: "wrap", gap: "12px" }}>
          <h2>👥 Gestion des utilisateurs</h2>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            <button 
              className="secondary" 
              onClick={() => { loadUsers(); loadSignalements(); }}
            >
              🔄 Rafraîchir les données
            </button>
            <button 
              className="warning" 
              onClick={syncToFirebase}
              disabled={syncLoading}
            >
              {syncLoading ? "⏳ Synchronisation..." : "🔄 Synchroniser vers Firebase"}
            </button>
            <button 
              className="primary" 
              onClick={() => setShowUserForm(!showUserForm)}
            >
              {showUserForm ? "❌ Annuler" : "➕ Créer un utilisateur"}
            </button>
          </div>
        </div>
        
        {syncMessage && <div className="alert success">{syncMessage}</div>}
        {syncError && <div className="alert error">{syncError}</div>}

        {showUserForm && (
          <div className="card" style={{ backgroundColor: "var(--gray-50)", marginBottom: 20 }}>
            <h3>✨ Créer un nouvel utilisateur</h3>
            {userFormError && <div className="alert error">{userFormError}</div>}
            {userFormMessage && <div className="alert success">{userFormMessage}</div>}
            
            <form className="form" onSubmit={createUser}>
              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  placeholder="utilisateur@example.com"
                  value={userForm.email}
                  onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                  required
                />
              </div>
              
              <div className="form-group">
                <label className="form-label">Mot de passe * (minimum 6 caractères)</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  minLength={6}
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  required
                />
                <small style={{ color: "var(--gray-600)" }}>Minimum 6 caractères</small>
              </div>
              
              <div className="form-group">
                <label className="form-label">Rôle *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm({ ...userForm, role: e.target.value })}
                  required
                >
                  <option value="USER">USER - Utilisateur standard</option>
                  <option value="MANAGER">MANAGER - Administrateur</option>
                </select>
              </div>
              
              <button type="submit" className="success">🚀 Créer l'utilisateur</button>
            </form>
          </div>
        )}

        {loading && <div className="loading"><div className="spinner"></div></div>}
        {error && <div className="alert error">{error}</div>}

        {!loading && (
          <>
            <div style={{ marginBottom: 16 }}>
              <span className="badge primary">{users.length} utilisateur{users.length > 1 ? 's' : ''}</span>
            </div>
            <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Nom</th>
                <th>Prénom</th>
                <th>Numéro Étudiant</th>
                <th>Rôle</th>
                <th>Statut</th>
                <th>Firebase</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => {
                const isEditing = editingUser === user.uid;
                const edit = userEdits[user.uid] || {};
                return (
                  <tr key={user.uid}>
                    <td style={{ fontFamily: "monospace", fontSize: "13px" }}>{user.email}</td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={edit.nom ?? user.nom ?? ""}
                          onChange={(e) => onUserEditChange(user.uid, "nom", e.target.value)}
                          placeholder="Nom"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        user.nom || "-"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={edit.prenom ?? user.prenom ?? ""}
                          onChange={(e) => onUserEditChange(user.uid, "prenom", e.target.value)}
                          placeholder="Prénom"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        user.prenom || "-"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <input
                          type="text"
                          value={edit.numEtu ?? user.numEtu ?? ""}
                          onChange={(e) => onUserEditChange(user.uid, "numEtu", e.target.value)}
                          placeholder="N° Étudiant"
                          style={{ width: "100%" }}
                        />
                      ) : (
                        user.numEtu || "-"
                      )}
                    </td>
                    <td>
                      {isEditing ? (
                        <select
                          value={edit.role ?? user.role}
                          onChange={(e) => onUserEditChange(user.uid, "role", e.target.value)}
                          style={{ width: "100%" }}
                        >
                          <option value="USER">USER</option>
                          <option value="MANAGER">MANAGER</option>
                        </select>
                      ) : (
                        <span className="badge primary">{user.role}</span>
                      )}
                    </td>
                    <td>
                      {user.isBlocked ? (
                        <span className="badge danger">🚫 Bloqué</span>
                      ) : (
                        <span className="badge success">✅ Actif</span>
                      )}
                    </td>
                    <td>
                      {user.syncedToFirebase ? (
                        <span className="badge success" title={`Firebase UID: ${user.firebaseUid || 'N/A'}`}>
                          ✅ Synchronisé
                        </span>
                      ) : (
                        <span className="badge warning">⏳ Non synchronisé</span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {isEditing ? (
                          <>
                            <button className="success" onClick={() => updateUser(user.uid)}>💾 Sauvegarder</button>
                            <button className="secondary" onClick={() => { setEditingUser(null); setUserEdits({}); }}>Annuler</button>
                          </>
                        ) : (
                          <>
                            <button className="primary" onClick={() => setEditingUser(user.uid)}>✏️ Modifier</button>
                            {user.isBlocked ? (
                              <button className="success" onClick={() => unblockUser(user.uid)}>🔓 Débloquer</button>
                            ) : (
                              <button className="warning" onClick={() => blockUser(user.uid)}>🔒 Bloquer</button>
                            )}
                            <button className="danger" onClick={() => deleteUser(user.uid)}>🗑️ Supprimer</button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
        )}
      </section>
      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>📊 Statistiques de Traitement Moyen</h3>
        <p style={{ color: "var(--gray-600)", marginBottom: 20 }}>Analyse des délais de traitement des signalements</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 24, marginBottom: 32 }}>
          {/* Temps de Traitement Total */}
          <div style={{ padding: 20, background: "var(--gray-50)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Temps de Traitement Total</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "var(--primary)", marginBottom: 4 }}>
              {tempsTotal !== null ? tempsTotal.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>jours (signalement → fin)</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>NOUVEAU (0%) → TERMINE (100%)</div>
          </div>

          {/* Temps d'Attente */}
          <div style={{ padding: 20, background: "var(--gray-50)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Temps d'Attente</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#dc2626", marginBottom: 4 }}>
              {tempsAttente !== null ? tempsAttente.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>jours (avant début)</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>NOUVEAU (0%) → EN_COURS (50%)</div>
          </div>

          {/* Temps d'Exécution */}
          <div style={{ padding: 20, background: "var(--gray-50)", borderRadius: 8 }}>
            <div style={{ fontSize: 13, color: "var(--gray-600)", marginBottom: 8 }}>Temps d'Exécution</div>
            <div style={{ fontSize: 36, fontWeight: 700, color: "#059669", marginBottom: 4 }}>
              {tempsExecution !== null ? tempsExecution.toFixed(1) : "—"}
            </div>
            <div style={{ fontSize: 12, color: "var(--gray-500)" }}>jours (début → fin)</div>
            <div style={{ fontSize: 11, color: "var(--gray-400)", marginTop: 8 }}>EN_COURS (50%) → TERMINE (100%)</div>
          </div>
        </div>

        {/* Compteurs */}
        <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Travaux en Attente</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{travauxAttente}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Travaux en Cours</div>
            <div style={{ fontSize: 32, fontWeight: 700 }}>{travauxEnCours}</div>
          </div>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 12, color: "var(--gray-600)", marginBottom: 4 }}>Travaux Terminés</div>
            <div style={{ fontSize: 32, fontWeight: 700, color: "#059669" }}>{travauxTermines}</div>
          </div>
        </div>
      </section>

      <section className="card" style={{ gridColumn: "1 / -1" }}>
        <h3>📋 Gestion des signalements</h3>
        <p style={{ color: "var(--gray-600)", marginBottom: 16 }}>Modifiez le statut, la surface, le budget et l'entreprise des signalements</p>
        
        {saveSuccess && <div className="alert success" style={{ marginBottom: 16 }}>{saveSuccess}</div>}
        
        {!signalementsLoading && (
          <div style={{ marginBottom: 16 }}>
            <span className="badge primary">{signalements.length} signalement{signalements.length > 1 ? 's' : ''}</span>
          </div>
        )}
        
        {signalementsLoading && <div className="loading"><div className="spinner"></div></div>}
        {signalementsError && <div className="alert error">{signalementsError}</div>}

        {!signalementsLoading && (
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                    <th>Titre</th>
                    <th>Signalé par</th>
                    <th>Date</th>
                    <th>Date Nouveaux</th>
                    <th>Date En cours</th>
                    <th>Date Terminé</th>
                    <th>Statut</th>
                    <th>Avancement</th>
                    <th>Surface (m²)</th>
                    <th>Budget (Ar)</th>
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
                        <a
                          href="#"
                          onClick={(e) => { 
                            e.preventDefault(); 
                            setSelectedSignalement({ ...item, ...edit }); 
                          }}
                          style={{ display: 'inline-block', fontWeight: 700, color: 'inherit', textDecoration: 'none', cursor: 'pointer' }}
                          title="Voir les détails"
                        >
                          {item.title}
                        </a>
                        {item.description && (
                          <div style={{ fontSize: "12px", color: "var(--gray-600)", marginTop: "4px" }}>
                            {item.description.length > 50 ? item.description.substring(0, 50) + "..." : item.description}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "13px" }}>
                          <div style={{ fontWeight: "600" }}>{item.userEmail}</div>
                          <div style={{ fontSize: "11px", color: "var(--gray-500)" }}>
                            {item.latitude?.toFixed(5)}, {item.longitude?.toFixed(5)}
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "12px", color: "var(--gray-600)" }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleDateString('fr-FR') : '-'}
                      </td>

                      <td>
                        <input
                          type="date"
                          value={(edit.dateNouveau ?? item.dateNouveau ?? item.createdAt)?.slice?.(0,10) ?? ""}
                          onChange={(e) => onEditChange(item.id, "dateNouveau", e.target.value ? new Date(e.target.value).toISOString() : null)}
                          style={{ width: "130px" }}
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          value={(edit.dateEnCours ?? item.dateEnCours)?.slice?.(0,10) ?? ""}
                          onChange={(e) => onEditChange(item.id, "dateEnCours", e.target.value ? new Date(e.target.value).toISOString() : null)}
                          style={{ width: "130px" }}
                        />
                      </td>

                      <td>
                        <input
                          type="date"
                          value={(edit.dateTermine ?? item.dateTermine)?.slice?.(0,10) ?? ""}
                          onChange={(e) => onEditChange(item.id, "dateTermine", e.target.value ? new Date(e.target.value).toISOString() : null)}
                          style={{ width: "130px" }}
                        />
                      </td>

                      <td>
                        <select
                          value={edit.status ?? item.status}
                          onChange={(e) => onEditChange(item.id, "status", e.target.value)}
                          style={{ minWidth: "120px" }}
                        >
                          {STATUSES.map((status) => (
                            <option key={status} value={status}>{status} ({STATUS_PERCENT[status]}%)</option>
                          ))}
                        </select>
                      </td>

                      <td style={{ textAlign: 'center' }}>{STATUS_PERCENT[ (edit.status ?? item.status) ] ?? '—'}%</td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={edit.surfaceM2 ?? item.surfaceM2 ?? ""}
                          onChange={(e) => onEditChange(item.id, "surfaceM2", e.target.value ? Number(e.target.value) : null)}
                          style={{ width: "100px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          step="any"
                          value={edit.budgetAr ?? item.budgetAr ?? ""}
                          onChange={(e) => onEditChange(item.id, "budgetAr", e.target.value ? Number(e.target.value) : null)}
                          style={{ width: "120px" }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={edit.entreprise ?? item.entreprise ?? ""}
                          onChange={(e) => onEditChange(item.id, "entreprise", e.target.value)}
                          style={{ minWidth: "150px" }}
                          placeholder="Nom de l'entreprise"
                        />
                      </td>
                      <td>
                        <button 
                          className={hasChanges ? "success" : "secondary"} 
                          onClick={() => saveSignalement(item)}
                          disabled={!hasChanges}
                        >
                          {hasChanges ? "💾 Enregistrer" : "Enregistrer"}
                        </button>
                        <button className="secondary" style={{ marginLeft: 8 }} onClick={() => {
                          setSelectedSignalement({ ...item, ...edit });
                        }}>🔍 Détails</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {/* Détail / historique modal */}
      {selectedSignalement && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.4)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 60 }} onClick={() => setSelectedSignalement(null)}>
          <div style={{ width: 820, maxWidth: "95%", background: "white", borderRadius: 8, padding: 20 }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <h3>📝 Détail signalement</h3>
              <div>
                <button className="secondary" onClick={() => setSelectedSignalement(null)}>✖ Fermer</button>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
              <div>
                <div className="label">Titre</div>
                <div className="value">{selectedSignalement.title}</div>
              </div>
              <div>
                <div className="label">Statut</div>
                <div className="value">{selectedSignalement.status} ({STATUS_PERCENT[selectedSignalement.status] ?? '—'}%)</div>
              </div>
              <div>
                <div className="label">Signalé par</div>
                <div className="value">{selectedSignalement.userEmail}</div>
              </div>
              <div>
                <div className="label">Créé le</div>
                <div className="value">{selectedSignalement.createdAt ? new Date(selectedSignalement.createdAt).toLocaleString('fr-FR') : '—'}</div>
              </div>
            </div>

            <h4>📜 Historique des étapes</h4>
            <table className="table" style={{ marginBottom: 12 }}>
              <thead>
                <tr>
                  <th>Étape</th>
                  <th>Date</th>
                  <th>Note</th>
                </tr>
              </thead>
              <tbody>
                {buildHistory(selectedSignalement).map((r, i) => (
                  <tr key={i}>
                    <td>{r.stage}</td>
                    <td>{r.date ? new Date(r.date).toLocaleString('fr-FR') : '—'}</td>
                    <td>{r.note || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <h4>📷 Photo</h4>
            {selectedSignalement.photoUrl && selectedSignalement.photoUrl !== 'null' && selectedSignalement.photoUrl.trim() !== '' ? (
              <div style={{ marginBottom: 16, padding: 16, background: 'var(--gray-50)', borderRadius: 8 }}>
                <img 
                  src={`http://localhost:8083${selectedSignalement.photoUrl}`}
                  alt="Photo du signalement" 
                  style={{ maxWidth: '100%', maxHeight: 400, borderRadius: 8, display: 'block', margin: '0 auto', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'block';
                  }}
                />
                <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 8, textAlign: 'center' }}>Photo actuelle</div>
                <div style={{ display: 'none', padding: 20, textAlign: 'center', color: 'var(--gray-500)' }}>
                  ⚠️ Impossible de charger la photo
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: 16, padding: 20, background: 'var(--gray-50)', borderRadius: 8, textAlign: 'center', color: 'var(--gray-500)' }}>
                📷 Aucune photo disponible
              </div>
            )}
            <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 16 }}>
              <input 
                type="file" 
                accept="image/*" 
                onChange={(e) => setPhotoFile(e.target.files[0])}
                style={{ flex: 1 }}
              />
              <button 
                className="primary" 
                onClick={handlePhotoUpload}
                disabled={!photoFile || uploadingPhoto}
              >
                {uploadingPhoto ? '⏳ Upload...' : '📤 Uploader'}
              </button>
            </div>

            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <button className="secondary" onClick={() => setSelectedSignalement(null)}>Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
