"use client";

import { useState } from "react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { todayISO, currentMonthISO, formatRp } from "../../lib/formatters";

export default function PayrollModal({ isOpen, onClose }) {
  const { employees, accounts, addPayroll } = useFinance();

  const [employeeId, setEmployeeId] = useState(employees[0]?.id || "");
  const [period, setPeriod] = useState(currentMonthISO());
  const [baseSalary, setBaseSalary] = useState(employees[0]?.baseSalary || "0");
  const [allowance, setAllowance] = useState("0");
  const [deduction, setDeduction] = useState("0");
  const [paymentDate, setPaymentDate] = useState(todayISO());
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  const handleEmployeeChange = (id) => {
    setEmployeeId(id);
    const emp = employees.find((e) => e.id === id);
    if (emp) {
      setBaseSalary(emp.baseSalary || 0);
    }
  };

  const numBase = Number(baseSalary) || 0;
  const numAllowance = Number(allowance) || 0;
  const numDeduction = Number(deduction) || 0;
  const netSalary = Math.max(0, numBase + numAllowance - numDeduction);

  const selectedEmployee = employees.find((e) => e.id === employeeId);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!employeeId) {
      setError("Pilih karyawan terlebih dahulu.");
      return;
    }
    if (netSalary <= 0) {
      setError("Total gaji bersih harus lebih besar dari 0.");
      return;
    }

    addPayroll({
      employeeId,
      employeeName: selectedEmployee?.name || "Karyawan",
      period,
      baseSalary: numBase,
      allowance: numAllowance,
      deduction: numDeduction,
      netSalary,
      paymentDate,
      accountId: accountId || null,
      notes: notes.trim() || `Gaji periode ${period}`,
    });

    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Proses Penggajian (Payroll)">
      <form onSubmit={handleSubmit} className="app-form">
        {error && <div className="form-alert-error">{error}</div>}

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pay-emp">Pilih Karyawan *</label>
            <select
              id="pay-emp"
              value={employeeId}
              onChange={(e) => handleEmployeeChange(e.target.value)}
              required
            >
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.name} ({emp.position})
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="pay-period">Periode Bulan *</label>
            <input
              id="pay-period"
              type="month"
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pay-base">Gaji Pokok (Rupiah) *</label>
          <div className="input-prefix-wrap">
            <span className="input-prefix">Rp</span>
            <input
              id="pay-base"
              type="number"
              min="0"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pay-allowance">Tunjangan / Bonus (Rp)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pay-allowance"
                type="number"
                min="0"
                value={allowance}
                onChange={(e) => setAllowance(e.target.value)}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="pay-deduct">Potongan / Kasbon (Rp)</label>
            <div className="input-prefix-wrap">
              <span className="input-prefix">Rp</span>
              <input
                id="pay-deduct"
                type="number"
                min="0"
                value={deduction}
                onChange={(e) => setDeduction(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Net Salary Preview Box */}
        <div className="payroll-net-preview">
          <span>Gaji Bersih Diterima (Take Home Pay):</span>
          <strong className="net-salary-figure">{formatRp(netSalary)}</strong>
        </div>

        <div className="form-row-2">
          <div className="form-group">
            <label htmlFor="pay-date">Tanggal Pembayaran *</label>
            <input
              id="pay-date"
              type="date"
              value={paymentDate}
              onChange={(e) => setPaymentDate(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="pay-acc">Dibayar Dari Rekening *</label>
            <select
              id="pay-acc"
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              required
            >
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name} ({acc.type})
                </option>
              ))}
            </select>
            <span className="form-helper-text">
              *Otomatis dicatat sebagai pengeluaran &quot;Gaji &amp; Upah Karyawan&quot;
            </span>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="pay-notes">Catatan Tambahan</label>
          <input
            id="pay-notes"
            type="text"
            placeholder="Contoh: Insentif target penjualan tercapai"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />
        </div>

        <div className="modal-actions">
          <button type="button" className="btn-secondary" onClick={onClose}>
            Batal
          </button>
          <button type="submit" className="btn-primary">
            Bayarkan Payroll &amp; Terbitkan Slip
          </button>
        </div>
      </form>
    </Modal>
  );
}
