"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from "lucide-react";

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((message, type = "info", duration = 3500) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2, 6);
    const newToast = { id, message, type, duration };

    setToasts((prev) => [...prev, newToast]);

    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }

    return id;
  }, [removeToast]);

  const success = useCallback((msg, duration) => showToast(msg, "success", duration), [showToast]);
  const error = useCallback((msg, duration) => showToast(msg, "error", duration || 4500), [showToast]);
  const warning = useCallback((msg, duration) => showToast(msg, "warning", duration), [showToast]);
  const info = useCallback((msg, duration) => showToast(msg, "info", duration), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, success, error, warning, info, removeToast }}>
      {children}
      <div className="toast-container">
        {toasts.map((t) => {
          let bg = "#0f172a";
          let border = "1px solid rgba(255,255,255,0.12)";
          let icon = <Info size={18} color="#38bdf8" />;

          if (t.type === "success") {
            bg = "#064e3b";
            border = "1px solid #10b981";
            icon = <CheckCircle2 size={18} color="#34d399" />;
          } else if (t.type === "error") {
            bg = "#7f1d1d";
            border = "1px solid #ef4444";
            icon = <AlertCircle size={18} color="#f87171" />;
          } else if (t.type === "warning") {
            bg = "#78350f";
            border = "1px solid #f59e0b";
            icon = <AlertTriangle size={18} color="#fbbf24" />;
          }

          return (
            <div
              key={t.id}
              className="toast-item"
              style={{
                backgroundColor: bg,
                color: "#ffffff",
                border,
                borderRadius: "var(--radius-md, 10px)",
                padding: "12px 16px",
                boxShadow: "0 10px 25px -4px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                gap: "12px",
                fontSize: "13px",
                pointerEvents: "auto",
                animation: "toastSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
              }}
            >
              <div style={{ flexShrink: 0 }}>{icon}</div>
              <div style={{ flex: 1, lineHeight: 1.4 }}>{t.message}</div>
              <button
                type="button"
                onClick={() => removeToast(t.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255,255,255,0.6)",
                  cursor: "pointer",
                  padding: "2px",
                  display: "flex",
                  alignItems: "center",
                }}
                aria-label="Tutup notifikasi"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast harus digunakan di dalam ToastProvider.");
  }
  return context;
}
