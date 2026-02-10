import React from "react";
import { NavLink, Outlet } from "react-router-dom";

const links = [
  { to: "/admin", icon: "📊", label: "Tableau de bord", end: true },
  { to: "/admin/users", icon: "👥", label: "Utilisateurs" },
  { to: "/admin/signalements", icon: "📋", label: "Signalements" },
];

export default function AdminLayout() {
  return (
    <div className="admin-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <span className="sidebar-title">⚙️ Administration</span>
        </div>
        <nav className="sidebar-nav">
          {links.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) =>
                `sidebar-link${isActive ? " active" : ""}`
              }
            >
              <span className="sidebar-icon">{link.icon}</span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="admin-content">
        <Outlet />
      </div>
    </div>
  );
}
