import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";

export default function Register() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    confirm: "",
  });
  const [busy, setBusy] = useState(false);
  const { register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handle = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setBusy(true);
    const ok = await registerUser(form.name, form.email, form.password);
    setBusy(false);
    if (ok) navigate("/dashboard");
  };

  const strength =
    form.password.length === 0
      ? 0
      : form.password.length < 6
        ? 1
        : form.password.length < 10
          ? 2
          : 3;
  const strengthColor = [
    "transparent",
    "var(--red)",
    "var(--amber)",
    "var(--green)",
  ][strength];
  const strengthLabel = ["", "Weak", "Fair", "Strong"][strength];

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg-base)",
        padding: 24,
      }}
      className="grid-bg"
    >
      <div className="anim-up" style={{ width: "100%", maxWidth: 440 }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
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
              marginBottom: 16,
              boxShadow: "0 8px 32px rgba(0,212,255,0.3)",
            }}
          >
            F
          </div>
          <h1
            style={{
              fontFamily: "var(--font-display)",
              fontWeight: 800,
              fontSize: 26,
              marginBottom: 4,
            }}
          >
            Create your account
          </h1>
          <p style={{ color: "var(--text-secondary)", fontSize: 14 }}>
            Free forever — start managing money smarter
          </p>
        </div>

        <div className="card" style={{ padding: 32 }}>
          <form onSubmit={submit}>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Full name</label>
              <input
                className="input"
                name="name"
                placeholder="Rahul Sharma"
                value={form.name}
                onChange={handle}
                required
              />
            </div>
            <div style={{ marginBottom: 16 }}>
              <label className="label">Email address</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handle}
                required
              />
            </div>
            <div style={{ marginBottom: 8 }}>
              <label className="label">Password</label>
              <input
                className="input"
                type="password"
                name="password"
                placeholder="Min 8 characters"
                value={form.password}
                onChange={handle}
                required
                minLength={8}
              />
            </div>
            {/* Password strength */}
            {form.password.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div
                  style={{
                    height: 3,
                    background: "var(--border)",
                    borderRadius: 2,
                    marginBottom: 4,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${(strength / 3) * 100}%`,
                      background: strengthColor,
                      borderRadius: 2,
                      transition: "all 0.3s",
                    }}
                  />
                </div>
                <p
                  style={{
                    fontSize: 11,
                    color: strengthColor,
                    fontFamily: "var(--font-mono)",
                  }}
                >
                  {strengthLabel} password
                </p>
              </div>
            )}
            <div style={{ marginBottom: 24 }}>
              <label className="label">Confirm password</label>
              <input
                className="input"
                type="password"
                name="confirm"
                placeholder="Repeat password"
                value={form.confirm}
                onChange={handle}
                required
                style={{
                  borderColor:
                    form.confirm && form.confirm !== form.password
                      ? "var(--red)"
                      : undefined,
                }}
              />
              {form.confirm && form.confirm !== form.password && (
                <p style={{ fontSize: 12, color: "var(--red)", marginTop: 4 }}>
                  Passwords don't match
                </p>
              )}
            </div>
            <button
              className="btn btn-primary btn-lg btn-full"
              type="submit"
              disabled={busy}
            >
              {busy ? (
                <span className="spinner" style={{ width: 18, height: 18 }} />
              ) : (
                "Create account →"
              )}
            </button>
          </form>

          <div className="divider" />
          <p
            style={{
              textAlign: "center",
              color: "var(--text-secondary)",
              fontSize: 14,
            }}
          >
            Already have an account?{" "}
            <Link
              to="/login"
              style={{
                color: "var(--accent)",
                textDecoration: "none",
                fontWeight: 600,
              }}
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
