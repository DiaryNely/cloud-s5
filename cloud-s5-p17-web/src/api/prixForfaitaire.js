import api from "./client.js";

export const fetchPrixForfaitaire = async () => {
  const { data } = await api.get("/api/prix-forfaitaire");
  return data;
};

export const createPrixForfaitaire = async (payload) => {
  const { data } = await api.post("/api/prix-forfaitaire", payload);
  return data;
};

export const updatePrixForfaitaire = async (id, payload) => {
  const { data } = await api.put(`/api/prix-forfaitaire/${id}`, payload);
  return data;
};

export const deletePrixForfaitaire = async (id) => {
  const { data } = await api.delete(`/api/prix-forfaitaire/${id}`);
  return data;
};
