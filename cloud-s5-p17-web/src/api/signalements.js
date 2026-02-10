import api from "./client.js";

export const fetchSignalements = async (mine = false) => {
  const { data } = await api.get("/api/signalements", {
    params: mine ? { mine: true } : {}
  });
  return data;
};

export const fetchSummary = async () => {
  const { data } = await api.get("/api/signalements/summary");
  return data;
};

export const createSignalement = async (payload) => {
  const { data } = await api.post("/api/signalements", payload);
  return data;
};

export const updateSignalement = async (id, payload) => {
  const { data } = await api.patch(`/api/signalements/${id}`, payload);
  return data;
};
