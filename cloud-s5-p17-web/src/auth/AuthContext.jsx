import React, { createContext, useContext, useMemo, useState } from "react";
import api from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(localStorage.getItem("auth_token"));
  const [role, setRole] = useState(localStorage.getItem("auth_role"));
  const [email, setEmail] = useState(localStorage.getItem("auth_email"));
  const [uid, setUid] = useState(localStorage.getItem("auth_uid"));

  const login = async (payload) => {
    const { data } = await api.post("/api/auth/login", payload);
    persistAuth(data);
    return data;
  };

  const register = async (payload) => {
    const { data } = await api.post("/api/auth/register", payload);
    persistAuth(data);
    return data;
  };

  const logout = () => {
    localStorage.removeItem("auth_token");
    localStorage.removeItem("auth_role");
    localStorage.removeItem("auth_email");
    localStorage.removeItem("auth_uid");
    setToken(null);
    setRole(null);
    setEmail(null);
    setUid(null);
  };

  const persistAuth = (data) => {
    if (!data?.token) return;
    localStorage.setItem("auth_token", data.token);
    localStorage.setItem("auth_role", data.role);
    localStorage.setItem("auth_email", data.email);
    localStorage.setItem("auth_uid", data.uid);
    setToken(data.token);
    setRole(data.role);
    setEmail(data.email);
    setUid(data.uid);
  };

  const value = useMemo(
    () => ({ token, role, email, uid, login, register, logout }),
    [token, role, email, uid]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("AuthContext missing");
  return ctx;
}
