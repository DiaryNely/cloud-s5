import api from "./client.js";

export const fetchUsers = async (blockedOnly = null) => {
  const params = {};
  if (blockedOnly !== null) params.blocked = blockedOnly;
  const { data } = await api.get("/api/admin/users", { params });
  return data;
};

export const createUser = async (payload) => {
  const { data } = await api.post("/api/admin/users", payload);
  return data;
};

export const updateUser = async (uid, payload) => {
  const { data } = await api.patch(`/api/admin/users/${uid}`, payload);
  return data;
};

export const deleteUser = async (uid) => {
  const { data } = await api.delete(`/api/admin/users/${uid}`);
  return data;
};

export const blockUser = async (uid) => {
  const { data } = await api.post(`/api/admin/users/${uid}/block`);
  return data;
};

export const unblockUser = async (uid) => {
  const { data } = await api.post(`/api/admin/users/${uid}/unblock`);
  return data;
};

export const syncToFirebase = async () => {
  const { data } = await api.post("/api/admin/sync-to-firebase");
  return data;
};
