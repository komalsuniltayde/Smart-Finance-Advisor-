import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "./context/AuthContext.jsx";
import { FinanceProvider } from "./context/FinanceContext.jsx";
import PrivateRoute from "./components/layout/PrivateRoute.jsx";
import AdminRoute from "./components/layout/AdminRoute.jsx";
import Layout from "./components/layout/Layout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Transactions from "./pages/Transaction.jsx";
import Analytics from "./pages/Analytics.jsx";
import Advisor from "./pages/Advisor.jsx";
import Budget from "./pages/Budget.jsx";
import Admin from "./pages/Admin.jsx";
import "./index.css";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <FinanceProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "#131c2b",
                color: "#e6ecf5",
                border: "1px solid #1c2b3e",
                fontFamily: "'DM Sans', sans-serif",
                fontSize: "14px",
              },
              success: {
                iconTheme: { primary: "#00e5a0", secondary: "#131c2b" },
              },
              error: {
                iconTheme: { primary: "#ff4d6d", secondary: "#131c2b" },
              },
            }}
          />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="/"
              element={
                <PrivateRoute>
                  <Layout />
                </PrivateRoute>
              }
            >
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="advisor" element={<Advisor />} />
              <Route path="budget" element={<Budget />} />
              <Route
                path="admin"
                element={
                  <AdminRoute>
                    <Admin />
                  </AdminRoute>
                }
              />
            </Route>
          </Routes>
        </FinanceProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
