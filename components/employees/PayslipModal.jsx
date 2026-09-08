"use client";

import { Printer } from "lucide-react";
import Modal from "../ui/Modal";
import { useFinance } from "../../context/FinanceContext";
import { formatRp, formatDate } from "../../lib/formatters";

export default function PayslipModal({ isOpen, onClose, payrollRecord }) {
  const { profile, employees } = useFinance();

  if (!payrollRecord) return null;

  const emp = employees.find((e) => e.id === payrollRecord.employeeId) || {
    name: payrollRecord.employeeName,
    position: "Staff",
    phone: "-",
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Slip Gaji — ${payrollRecord.employeeName}`}
      maxWidth="680px"
    >
      <div className="printable-payslip-container">
        <div className="print-action-bar no-print">
          <button type="button" className="btn-primary btn-sm" onClick={handlePrint}>
            <Printer size={16} /> Cetak / Simpan PDF
          </button>
        </div>

        <div className="payslip-paper" id="payslip-printable-area">
          {/* Header */}
          <div className="payslip-header">
            <div>
              <h2 className="payslip-company-name">{profile?.name || "ZENTA Business"}</h2>
              <p className="payslip-company-address">{profile?.address || "Jakarta, Indonesia"}</p>
            </div>
            <div className="payslip-title-box">
              <h1 className="payslip-doc-title">SLIP GAJI KARYAWAN</h1>
              <p className="payslip-period">Periode: <strong>{payrollRecord.period}</strong></p>
            </div>
          </div>

          <hr className="inv-divider" />

          {/* Employee Info Grid */}
          <div className="payslip-info-grid">
            <div className="payslip-info-item">
              <span className="info-label">Nama Karyawan:</span>
              <span className="info-value"><strong>{payrollRecord.employeeName}</strong></span>
            </div>
            <div className="payslip-info-item">
              <span className="info-label">Jabatan:</span>
              <span className="info-value">{emp.position}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-label">Tanggal Pembayaran:</span>
              <span className="info-value">{formatDate(payrollRecord.paymentDate)}</span>
            </div>
            <div className="payslip-info-item">
              <span className="info-label">Status:</span>
              <span className="info-value text-emerald"><strong>{payrollRecord.status || "Lunas"}</strong></span>
            </div>
          </div>

          {/* Breakdown Table */}
          <table className="payslip-table">
            <thead>
              <tr>
                <th>Penghasilan (Penerimaan)</th>
                <th style={{ textAlign: "right" }}>Jumlah (IDR)</th>
                <th>Potongan</th>
                <th style={{ textAlign: "right" }}>Jumlah (IDR)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Gaji Pokok</td>
                <td style={{ textAlign: "right" }}>{formatRp(payrollRecord.baseSalary)}</td>
                <td>Potongan / Kasbon / Absensi</td>
                <td style={{ textAlign: "right" }}>{formatRp(payrollRecord.deduction || 0)}</td>
              </tr>
              <tr>
                <td>Tunjangan / Bonus / Lembur</td>
                <td style={{ textAlign: "right" }}>{formatRp(payrollRecord.allowance || 0)}</td>
                <td>-</td>
                <td style={{ textAlign: "right" }}>-</td>
              </tr>
              <tr className="payslip-subtotal-row">
                <td><strong>Total Penerimaan:</strong></td>
                <td style={{ textAlign: "right" }}>
                  <strong>{formatRp((payrollRecord.baseSalary || 0) + (payrollRecord.allowance || 0))}</strong>
                </td>
                <td><strong>Total Potongan:</strong></td>
                <td style={{ textAlign: "right" }}>
                  <strong>{formatRp(payrollRecord.deduction || 0)}</strong>
                </td>
              </tr>
            </tbody>
          </table>

          {/* Take Home Pay */}
          <div className="payslip-net-box">
            <div className="net-box-left">
              <span className="net-box-label">GAJI BERSIH (TAKE HOME PAY):</span>
              <span className="net-box-val">{formatRp(payrollRecord.netSalary)}</span>
            </div>
            {payrollRecord.notes && (
              <div className="net-box-notes">
                <em>Catatan: {payrollRecord.notes}</em>
              </div>
            )}
          </div>

          {/* Signatures */}
          <div className="payslip-sign-row">
            <div className="sign-col">
              <p>Diterima Oleh,</p>
              <div className="sign-spacer" />
              <p>({payrollRecord.employeeName})</p>
            </div>
            <div className="sign-col">
              <p>Bagian Keuangan &amp; HR,</p>
              <div className="sign-spacer" />
              <p>({profile?.name || "ZENTA Finance"})</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
