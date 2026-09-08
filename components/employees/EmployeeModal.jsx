"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { todayISO } from "../../lib/formatters";

export default function EmployeeModal({ isOpen, onClose, employeeToEdit = null }) {
  const { addEmployee, updateEmployee } = useFinance();

  const [name, setName] = useState(employeeToEdit?.name || "");
  const [position, setPosition] = useState(employeeToEdit?.position || "");
  const [phone, setPhone] = useState(employeeToEdit?.phone || "");
  const [baseSalary, setBaseSalary] = useState(employeeToEdit?.baseSalary || "");
  const [joinDate, setJoinDate] = useState(employeeToEdit?.joinDate || todayISO());
  const [status, setStatus] = useState(employeeToEdit?.status || "Aktif");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) {
      setError("Nama lengkap karyawan wajib diisi.");
      return;
    }
    if (!position.trim()) {
      setError("Jabatan / posisi karyawan wajib diisi.");
      return;
    }

    const payload = {
      name: name.trim(),
      position: position.trim(),
      phone: phone.trim(),
      baseSalary: Number(baseSalary) || 0,
      joinDate,
      status,
    };

    if (employeeToEdit) {
      updateEmployee(employeeToEdit.id, payload);
    } else {
      addEmployee(payload);
    }

    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={employeeToEdit ? "Edit Data Karyawan" : "Tambah Karyawan Baru"}
    >
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="emp-name">Nama Lengkap Karyawan *</label>
          <input
            id="emp-name"
            type="text"
            placeholder="Contoh: Rian Hidayat"
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
            <label htmlFor="emp-pos">Jabatan / Peran *</label>
            <input
              id="emp-pos"
              type="text"
              placeholder="Contoh: Marketing Executive"
              value={position}
              onChange={(e) => setPosition(e.target.value)}
              required
            >
            </input>
          </div>

          <div className="form-group">
            <label htmlFor="emp-phone">Nomor Telepon / WhatsApp</label>
            <input
              id="emp-phone"
              type="text"
              placeholder="Contoh: 0812-3456-7890"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="emp-salary">Gaji Pokok Bulanan (Rupiah)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="emp-salary"
                type="number"
                min="0"
                placeholder="Contoh: 5000000"
                value={baseSalary}
                onChange={(e) => setBaseSalary(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="emp-status">Status Karyawan</label>
            <select
              id="emp-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="Aktif">Aktif</option>
              <option value="Cuti">Cuti</option>
              <option value="Nonaktif">Nonaktif / Resigned</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="emp-join">Tanggal Mulai Bekerja</label>
          <input
            id="emp-join"
            type="date"
            value={joinDate}
            onChange={(e) => setJoinDate(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            {employeeToEdit ? "Simpan Perubahan" : "Simpan Karyawan"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
