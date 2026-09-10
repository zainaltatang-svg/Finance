"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { useToast } from "../ui/Toast";

export default function ClientModal({ isOpen, onClose, clientToEdit = null }) {
  const { addClient, updateClient } = useFinance();
  const toast = useToast();

  const [name, setName] = useState(clientToEdit?.name || "");
  const [contact, setContact] = useState(clientToEdit?.contact || "");
  const [phone, setPhone] = useState(clientToEdit?.phone || "");
  const [email, setEmail] = useState(clientToEdit?.email || "");
  const [address, setAddress] = useState(clientToEdit?.address || "");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama perusahaan atau pelanggan wajib diisi.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    const payload = {
      name: name.trim(),
      contact: contact.trim(),
      phone: phone.trim(),
      email: email.trim(),
      address: address.trim(),
    };

    try {
      if (clientToEdit) {
        await updateClient(clientToEdit.id, payload);
        toast.success(`Data klien "${name.trim()}" berhasil diperbarui!`);
      } else {
        await addClient(payload);
        toast.success(`Klien "${name.trim()}" berhasil ditambahkan!`);
      }
      onClose();
    } catch (err) {
      console.error(err);
      setError("Gagal menyimpan data klien. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={clientToEdit ? "Edit Pelanggan / Langganan" : "Tambah Langganan Baru"}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="cl-name">Nama Pelanggan / Warga *</label>
          <input
            id="cl-name"
            type="text"
            placeholder="Contoh: Bu RT Endang, Pak Joko Bengkel, Mbak Siti"
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
            <label htmlFor="cl-contact">Nama Panggilan / Anggota Keluarga</label>
            <input
              id="cl-contact"
              type="text"
              placeholder="Contoh: Suami Bu Endang, Anak Pak Joko"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="cl-phone">No. WhatsApp (Untuk Notif Bon)</label>
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
          <label htmlFor="cl-address">Alamat Rumah / Gang / Patokan</label>
          <input
            id="cl-address"
            type="text"
            placeholder="Contoh: RT 03/RW 05 No. 04, Belakang Musholla"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label htmlFor="cl-email">Catatan Tambahan (Opsional)</label>
          <input
            id="cl-email"
            type="text"
            placeholder="Contoh: Langganan beras bulanan, limit kasbon Rp 200.000"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Batal
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : clientToEdit ? (
              "Simpan Perubahan"
            ) : (
              "Tambah Klien"
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
