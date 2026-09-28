import React, { useState } from "react";
import { Outlet, NavLink, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);

  const NAV = [
    { to: "/dashboard", label: "Dashboard", icon: "▣" },
    { to: "/transactions", label: "Transactions", icon: "⇄" },
    { to: "/analytics", label: "Analytics", icon: "◈" },
    { to: "/advisor", label: "AI Advisor", icon: "◎" },
    { to: "/budget", label: "Budget", icon: "◆" },
    ...(user?.role === "admin"
      ? [{ to: "/admin", label: "Admin Panel", icon: "⚙" }]
      : []),
  ];

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* ── Sidebar ── */}
      <aside
        style={{
          width: collapsed ? 68 : 228,
          background: "var(--bg-surface)",
          borderRight: "1px solid var(--border)",
          display: "flex",
          flexDirection: "column",
          transition: "width 0.25s cubic-bezier(0.4,0,0.2,1)",
          flexShrink: 0,
          zIndex: 10,
          overflow: "hidden",
        }}
      >
        {/* Logo */}
        <div
          style={{
            padding: collapsed ? "22px 18px" : "22px 20px",
            borderBottom: "1px solid var(--border)",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg,#00d4ff,#0099cc)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 15,
              fontWeight: 800,
              color: "var(--bg-base)",
              fontFamily: "var(--font-display)",
              flexShrink: 0,
            }}
          >
            F
          </div>
          {!collapsed && (
            <div>
              <div
                style={{
                  fontFamily: "var(--font-display)",
                  fontWeight: 800,
                  fontSize: 15,
                  color: "var(--text-primary)",
                  lineHeight: 1.2,
                }}
              >
                FinanceAI
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: "var(--text-muted)",
                  fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em",
                }}
              >
                SMART ADVISOR
              </div>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav
          style={{
            flex: 1,
            padding: "12px 0",
            overflowY: "auto",
            overflowX: "hidden",
          }}
        >
          {!collapsed && (
            <div
              style={{
                padding: "8px 20px 6px",
                fontSize: 10,
                fontWeight: 700,
                color: "var(--text-muted)",
                fontFamily: "var(--font-display)",
                letterSpacing: "0.1em",
                textTransform: "uppercase",
              }}
            >
              Menu
            </div>
          )}
          {NAV.map(({ to, label, icon }) => {
            const active =
              location.pathname === to ||
              location.pathname.startsWith(to + "/");
            return (
              <NavLink
                key={to}
                to={to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 11,
                  padding: collapsed ? "12px 20px" : "11px 20px",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  background: active ? "rgba(0,212,255,0.07)" : "transparent",
                  borderLeft: `2px solid ${active ? "var(--accent)" : "transparent"}`,
                  textDecoration: "none",
                  transition: "all 0.15s",
                  fontSize: 14,
                  fontWeight: active ? 600 : 400,
                  whiteSpace: "nowrap",
                }}
              >
                <span
                  style={{
                    fontSize: 15,
                    flexShrink: 0,
                    width: 18,
                    textAlign: "center",
                  }}
                >
                  {icon}
                </span>
                {!collapsed && <span>{label}</span>}
                {!collapsed && active && (
                  <span
                    style={{
                      marginLeft: "auto",
                      width: 6,
                      height: 6,
                      borderRadius: "50%",
                      background: "var(--accent)",
                      flexShrink: 0,
                    }}
                  />
                )}
              </NavLink>
            );
          })}
        </nav>

        {/* Bottom */}
        <div style={{ borderTop: "1px solid var(--border)", padding: "14px" }}>
          {!collapsed && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
                padding: "8px 6px",
                borderRadius: "var(--r-md)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  width: 30,
                  height: 30,
                  borderRadius: "50%",
                  background:
                    "linear-gradient(135deg,var(--accent),var(--purple))",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 12,
                  fontWeight: 700,
                  color: "var(--bg-base)",
                  flexShrink: 0,
                }}
              >
                {user?.name?.[0]?.toUpperCase() || "U"}
              </div>
              <div style={{ overflow: "hidden", flex: 1 }}>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: "var(--text-primary)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.name || "User"}
                </div>
                <div
                  style={{
                    fontSize: 11,
                    color: "var(--text-muted)",
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                  }}
                >
                  {user?.email || ""}
                </div>
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="btn btn-ghost btn-sm"
              style={{ flex: 1, justifyContent: "center", padding: "8px" }}
            >
              {collapsed ? "→" : "←"}
            </button>
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
                style={{ flex: 1, justifyContent: "center" }}
              >
                Logout
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main
        style={{ flex: 1, overflowY: "auto", background: "var(--bg-base)" }}
        className="grid-bg"
      >
        <Outlet />
      </main>
    </div>
  );
}
