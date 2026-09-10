"use client";

import { createContext, useContext, useState, useRef, useCallback } from "react";
import { AlertTriangle, X } from "lucide-react";

const ConfirmContext = createContext(null);

export function ConfirmProvider({ children }) {
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: "Konfirmasi Tindakan",
    message: "Apakah Anda yakin ingin melanjutkan tindakan ini?",
    confirmText: "Ya, Lanjutkan",
    cancelText: "Batal",
    danger: true,
  });

  const resolverRef = useRef(null);

  const confirm = useCallback(({
    title = "Konfirmasi Tindakan",
    message = "Apakah Anda yakin ingin melanjutkan tindakan ini?",
    confirmText = "Ya, Lanjutkan",
    cancelText = "Batal",
    danger = true,
  } = {}) => {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setModalState({
        isOpen: true,
        title,
        message,
        confirmText,
        cancelText,
        danger,
      });
    });
  }, []);

  const handleConfirm = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(true);
      resolverRef.current = null;
    }
  };

  const handleCancel = () => {
    setModalState((prev) => ({ ...prev, isOpen: false }));
    if (resolverRef.current) {
      resolverRef.current(false);
      resolverRef.current = null;
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {modalState.isOpen && (
        <div className="modal-backdrop" onClick={handleCancel}>
          <div
            className="modal-container"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "440px",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-subtle, #e2e8f0)",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                {modalState.danger && (
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      backgroundColor: "var(--rose-soft, #fef2f2)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "var(--rose-primary, #ef4444)",
                    }}
                  >
                    <AlertTriangle size={17} />
                  </div>
                )}
                <h3 style={{ fontSize: "15px", fontWeight: 700, margin: 0, color: "var(--text-primary)" }}>
                  {modalState.title}
                </h3>
              </div>
              <button
                type="button"
                onClick={handleCancel}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "var(--text-muted)",
                  cursor: "pointer",
                }}
              >
                <X size={18} />
              </button>
            </div>

            <div style={{ padding: "20px", fontSize: "13.5px", color: "var(--text-secondary)", lineHeight: 1.6 }}>
              {modalState.message}
            </div>

            <div
              className="modal-actions"
              style={{
                padding: "14px 20px",
                backgroundColor: "var(--bg-panel-subtle, #f8fafc)",
                borderTop: "1px solid var(--border-subtle, #e2e8f0)",
                marginTop: 0,
              }}
            >
              <button
                type="button"
                className="btn-secondary"
                onClick={handleCancel}
                style={{ padding: "8px 16px", fontSize: "13px" }}
              >
                {modalState.cancelText}
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  borderRadius: "var(--radius-md, 10px)",
                  border: "none",
                  cursor: "pointer",
                  backgroundColor: modalState.danger ? "var(--rose-primary, #ef4444)" : "var(--emerald-primary, #10b981)",
                  color: "#ffffff",
                }}
              >
                {modalState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error("useConfirm harus digunakan di dalam ConfirmProvider.");
  }
  return context;
}
