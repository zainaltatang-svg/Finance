"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";

export default function ClientModal({ isOpen, onClose, clientToEdit = null }) {
  const { addClient, updateClient } = useFinance();

  const [name, setName] = useState(clientToEdit?.name || "");
  const [contact, setContact] = useState(clientToEdit?.contact || "");
  const [phone, setPhone] = useState(clientToEdit?.phone || "");
  const [email, setEmail] = useState(clientToEdit?.email || "");
  const [address, setAddress] = useState(clientToEdit?.address || "");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama perusahaan atau pelanggan wajib diisi.");
      return;
    }

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    };

    if (clientToEdit) {
      updateClient(clientToEdit.id, payload);
    } else {
      addClient(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? "Edit Data Klien" : "Tambah Klien Baru"}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="cl-name">Nama Perusahaan / Klien *</label>
          <input
            id="cl-name"
            type="text"
            placeholder="Contoh: PT Surya Gemilang Nusantara"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            required
            autoFocus
          />
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="cl-contact">Kontak Person (PIC)</label>
            <input
              id="cl-contact"
              type="text"
              placeholder="Contoh: Bpk. Budi Santoso"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cl-phone">Nomor Telepon / WhatsApp</label>
            <input
              id="cl-phone"
              type="text"
              placeholder="Contoh: 0812-3456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="cl-email">Alamat Email</label>
          <input
            id="cl-email"
            type="email"
            placeholder="Contoh: procurement@suryagemilang.co.id"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cl-address">Alamat Kantor / Pengiriman</label>
          <textarea
            id="cl-address"
            rows="2"
            placeholder="Contoh: Jl. Gatot Subroto Kav. 52, Jakarta Selatan"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            {clientToEdit ? "Simpan Perubahan" : "Tambah Klien"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
