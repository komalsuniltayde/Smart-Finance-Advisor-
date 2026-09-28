import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [busy, setBusy] = useState(false);
  const [show, setShow] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    const ok = await login(form.email, form.password);
    setBusy(false);
    if (ok) navigate("/dashboard");
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        background: "var(--bg-base)",
      }}
      className="grid-bg"
    >
      {/* Left panel */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 40,
        }}
      >
        <div className="anim-up" style={{ width: "100%", maxWidth: 400 }}>
          {/* Logo */}
          <div style={{ marginBottom: 36 }}>
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 14,
                background: "linear-gradient(135deg,#00d4ff,#0099cc)",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 22,
                fontWeight: 800,
                color: "var(--bg-base)",
                fontFamily: "var(--font-display)",
                marginBottom: 20,
                boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
              }}
            >
              F
            </div>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontWeight: 800,
                fontSize: 30,
                color: "var(--text-primary)",
                marginBottom: 6,
              }}
            >
              Welcome back
            </h1>
            <p style={{ color: "var(--text-secondary)", fontSize: 15 }}>
              Sign in to your FinanceAI account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={submit}>
            <div style={{ marginBottom: 18 }}>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handle}
                required
                autoComplete="email"
              />
            </div>
            <div style={{ marginBottom: 24 }}>
              <label className="label">Password</label>
              <div style={{ position: "relative" }}>
                <input
                  className="input"
                  type={show ? "text" : "password"}
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handle}
                  required
                  style={{ paddingRight: 44 }}
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  style={{
                    position: "absolute",
                    right: 12,
                    top: "50%",
                    transform: "translateY(-50%)",
                    background: "none",
                    border: "none",
                    color: "var(--text-muted)",
                    cursor: "pointer",
                    fontSize: 13,
                    padding: 4,
                  }}
                >
                  {show ? "hide" : "show"}
                </button>
              </div>
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                "Sign in →"
              )}
            </button>
          </form>

          <div className="divider" style={{ margin: "24px 0" }} />

          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Don't have an account?{" "}
            <Link
              to="/register"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Create one free
            </Link>
          </p>

          {/* Demo credentials */}
          <div
            style={{
              marginTop: 20,
              padding: "14px 16px",
              background: "rgba(0,212,255,0.05)",
              border: "1px solid rgba(0,212,255,0.12)",
              borderRadius: "var(--r-md)",
            }}
          >
            <p
              style={{
                fontSize: 12,
                color: "var(--text-muted)",
                marginBottom: 6,
                fontFamily: "var(--font-display)",
                letterSpacing: "0.05em",
                textTransform: "uppercase",
              }}
            >
              Demo Credentials
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Email:{" "}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                }}
              >
                demo@financeai.com
              </span>
            </p>
            <p style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Password:{" "}
              <span
                style={{
                  fontFamily: "var(--font-mono)",
                  color: "var(--accent)",
                }}
              >
                demo1234
              </span>
            </p>
          </div>
        </div>
      </div>

      {/* Right panel - decorative */}
      <div
        style={{
          flex: 1,
          background: "var(--bg-surface)",
          borderLeft: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 60,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Glow orbs */}
        <div
          style={{
            position: "absolute",
            top: "20%",
            left: "30%",
            width: 300,
            height: 300,
            background:
              "radial-gradient(circle, rgba(0,212,255,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: "25%",
            right: "20%",
            width: 200,
            height: 200,
            background:
              "radial-gradient(circle, rgba(167,139,250,0.08) 0%, transparent 70%)",
            borderRadius: "50%",
            pointerEvents: "none",
          }}
        />

        <div
          className="anim-up-2"
          style={{ textAlign: "center", maxWidth: 360 }}
        >
          <div
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 32,
              color: "var(--text-primary)",
              lineHeight: 1.25,
              marginBottom: 16,
            }}
          >
            Your money,
            <br />
            <span style={{ color: "var(--accent)" }}>intelligently</span>
            <br />
            managed.
          </div>
          <p
            style={{
              color: "var(--text-secondary)",
              fontSize: 15,
              lineHeight: 1.7,
              marginBottom: 32,
            }}
          >
            AI-powered financial insights, spending predictions, and
            personalized advice — all in one platform.
          </p>
          {/* Feature pills */}
          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: 8,
              justifyContent: "center",
            }}
          >
            {[
              "ML Predictions",
              "Health Score",
              "Budget Alerts",
              "AI Advisor",
              "Visual Analytics",
            ].map((f) => (
              <span
                key={f}
                className="badge badge-blue"
                style={{ fontSize: 12 }}
              >
                {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
