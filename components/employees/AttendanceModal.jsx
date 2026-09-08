"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { todayISO } from "../../lib/formatters";
import { ATTENDANCE_STATUS } from "../../lib/constants";

export default function AttendanceModal({ isOpen, onClose }) {
  const { employees, addAttendance } = useFinance();

  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [date, setDate] = useState(todayISO());
  const [status, setStatus] = useState("Hadir");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId) {
      setError("Pilih karyawan terlebih dahulu.");
      return;
    }

    addAttendance({
      employeeId,
      date,
      status,
      notes: notes.trim(),
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Catat Kehadiran / Absensi Karyawan">
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-group">
          <label htmlFor="att-emp">Pilih Karyawan *</label>
          <select
            id="att-emp"
            value={employeeId}
            onChange={(e) => setEmployeeId(e.target.value)}
            required
          >
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.name} — {emp.position}
              </option>
            ))}
          </select>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="att-date">Tanggal *</label>
            <input
              id="att-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="att-status">Status Kehadiran *</label>
            <select
              id="att-status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {ATTENDANCE_STATUS.map((st) => (
                <option key={st.id} value={st.id}>
                  {st.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="att-notes">Keterangan / Alasan</label>
          <input
            id="att-notes"
            type="text"
            placeholder="Contoh: Datang tepat waktu, izin urusan keluarga, atau surat sakit dokter"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Simpan Absensi
          </button>
        </div>
      </form>
    </Modal>
  );
}
