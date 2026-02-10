import React, { useEffect, useState, useCallback } from "react";
import api from "../api/client.js";
import { fetchUsers as apiFetchUsers, blockUser as apiBlockUser, unblockUser as apiUnblockUser, deleteUser as apiDeleteUser, syncToFirebase as apiSyncToFirebase } from "../api/users.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showUserForm, setShowUserForm] = useState(false);
  const [userForm, setUserForm] = useState({ email: "", password: "", role: "USER" });
  const [userFormError, setUserFormError] = useState(null);
  const [userFormMessage, setUserFormMessage] = useState(null);

  const [editingUser, setEditingUser] = useState(null);
  const [userEdits, setUserEdits] = useState({});

  const [syncLoading, setSyncLoading] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);
  const [syncError, setSyncError] = useState(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetchUsers();
      const mapped = data.map(u => ({
        uid: u.uid,
        email: u.email,
        role: u.role || "USER",
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

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const blockUser = async (uid) => { await apiBlockUser(uid); await loadUsers(); };
  const unblockUser = async (uid) => { await apiUnblockUser(uid); await loadUsers(); };

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
    setUserEdits(prev => ({ ...prev, [uid]: { ...prev[uid], [field]: value } }));
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24, flexWrap: "wrap", gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 28, fontWeight: 700, marginBottom: 4 }}>Gestion des utilisateurs</h2>
          <p style={{ color: "var(--gray-600)" }}>Créer, modifier, bloquer et supprimer les comptes</p>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <button className="secondary" onClick={loadUsers}>🔄 Rafraîchir</button>
          <button className="warning" onClick={syncToFirebase} disabled={syncLoading}>
            {syncLoading ? "⏳ Sync..." : "🔄 Sync Firebase"}
          </button>
          <button className="primary" onClick={() => setShowUserForm(!showUserForm)}>
            {showUserForm ? "❌ Annuler" : "➕ Créer"}
          </button>
        </div>
      </div>

      {syncMessage && <div className="alert success">{syncMessage}</div>}
      {syncError && <div className="alert error">{syncError}</div>}

      {showUserForm && (
        <div className="card" style={{ marginBottom: 24 }}>
          <h3>✨ Créer un nouvel utilisateur</h3>
          {userFormError && <div className="alert error">{userFormError}</div>}
          {userFormMessage && <div className="alert success">{userFormMessage}</div>}
          <form className="form" onSubmit={createUser}>
            <div className="form-group">
              <label className="form-label">Email *</label>
              <input type="email" placeholder="utilisateur@example.com" value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Mot de passe * (min. 6 caractères)</label>
              <input type="password" placeholder="••••••••" minLength={6} value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} required />
            </div>
            <div className="form-group">
              <label className="form-label">Rôle *</label>
              <select value={userForm.role} onChange={(e) => setUserForm({ ...userForm, role: e.target.value })} required>
                <option value="USER">USER</option>
                <option value="MANAGER">MANAGER</option>
              </select>
            </div>
            <button type="submit" className="success">🚀 Créer l'utilisateur</button>
          </form>
        </div>
      )}

      {loading && <div className="loading"><div className="spinner"></div></div>}
      {error && <div className="alert error">{error}</div>}

      {!loading && (
        <div className="card">
          <div style={{ marginBottom: 16 }}>
            <span className="badge primary">{users.length} utilisateur{users.length > 1 ? "s" : ""}</span>
          </div>
          <div style={{ overflowX: "auto" }}>
            <table className="table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Nom</th>
                  <th>Prénom</th>
                  <th>N° Étudiant</th>
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
                      <td style={{ fontFamily: "monospace", fontSize: 13 }}>{user.email}</td>
                      <td>
                        {isEditing ? (
                          <input type="text" value={edit.nom ?? user.nom ?? ""} onChange={(e) => onUserEditChange(user.uid, "nom", e.target.value)} placeholder="Nom" style={{ width: "100%" }} />
                        ) : (user.nom || "—")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="text" value={edit.prenom ?? user.prenom ?? ""} onChange={(e) => onUserEditChange(user.uid, "prenom", e.target.value)} placeholder="Prénom" style={{ width: "100%" }} />
                        ) : (user.prenom || "—")}
                      </td>
                      <td>
                        {isEditing ? (
                          <input type="text" value={edit.numEtu ?? user.numEtu ?? ""} onChange={(e) => onUserEditChange(user.uid, "numEtu", e.target.value)} placeholder="N° Étu" style={{ width: "100%" }} />
                        ) : (user.numEtu || "—")}
                      </td>
                      <td>
                        {isEditing ? (
                          <select value={edit.role ?? user.role} onChange={(e) => onUserEditChange(user.uid, "role", e.target.value)} style={{ width: "100%" }}>
                            <option value="USER">USER</option>
                            <option value="MANAGER">MANAGER</option>
                          </select>
                        ) : (
                          <span className="badge primary">{user.role}</span>
                        )}
                      </td>
                      <td>
                        {user.isBlocked
                          ? <span className="badge danger">🚫 Bloqué</span>
                          : <span className="badge success">✅ Actif</span>
                        }
                      </td>
                      <td>
                        {user.syncedToFirebase
                          ? <span className="badge success" title={`UID: ${user.firebaseUid || "N/A"}`}>✅</span>
                          : <span className="badge warning">⏳</span>
                        }
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                          {isEditing ? (
                            <>
                              <button className="success" onClick={() => updateUser(user.uid)}>💾</button>
                              <button className="secondary" onClick={() => { setEditingUser(null); setUserEdits({}); }}>✖</button>
                            </>
                          ) : (
                            <>
                              <button className="primary" onClick={() => setEditingUser(user.uid)}>✏️</button>
                              {user.isBlocked
                                ? <button className="success" onClick={() => unblockUser(user.uid)}>🔓</button>
                                : <button className="warning" onClick={() => blockUser(user.uid)}>🔒</button>
                              }
                              <button className="danger" onClick={() => deleteUser(user.uid)}>🗑️</button>
                            </>
                          )}
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
    </div>
  );
}
