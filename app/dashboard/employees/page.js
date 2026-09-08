"use client";

import { useState } from "react";
import { Plus, Printer, Trash2, Edit2, UserCheck, CalendarCheck, Banknote, Users } from "lucide-react";
import { useFinance } from "../../../context/FinanceContext";
import { formatRp, formatDate } from "../../../lib/formatters";
import Badge from "../../../components/ui/Badge";
import EmployeeModal from "../../../components/employees/EmployeeModal";
import AttendanceModal from "../../../components/employees/AttendanceModal";
import PayrollModal from "../../../components/employees/PayrollModal";
import PayslipModal from "../../../components/employees/PayslipModal";

export default function EmployeesPage() {
  const {
    employees,
    attendance,
    payroll,
    deleteEmployee,
    deleteAttendance,
    deletePayroll,
    getEmployeeName,
  } = useFinance();

  const [activeTab, setActiveTab] = useState("employees"); // 'employees' | 'attendance' | 'payroll'
  const [showEmployeeModal, setShowEmployeeModal] = useState(false);
  const [employeeToEdit, setEmployeeToEdit] = useState(null);
  const [showAttendanceModal, setShowAttendanceModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [selectedPayrollForPrint, setSelectedPayrollForPrint] = useState(null);

  // Total biaya payroll bulan ini
  const currentMonth = new Date().toISOString().slice(0, 7);
  const monthlyPayrollTotal = payroll
    .filter((p) => p.period === currentMonth)
    .reduce((sum, p) => sum + (p.netSalary || 0), 0);

  const getAttendanceBadgeVariant = (status) => {
    switch (status) {
      case "Hadir": return "emerald";
      case "Izin": return "blue";
      case "Sakit": return "amber";
      default: return "rose";
    }
  };

  return (
    <div className="employees-page">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 style={{ fontSize: "20px", fontWeight: 700 }}>Karyawan, Absensi &amp; Payroll</h2>
          <p style={{ fontSize: "12.5px", color: "var(--text-secondary)" }}>
            Kelola tim staf, pencatatan kehadiran harian, dan penerbitan slip gaji digital.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {activeTab === "employees" && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => {
                setEmployeeToEdit(null);
                setShowEmployeeModal(true);
              }}
            >
              <Plus size={16} /> Tambah Karyawan
            </button>
          )}

          {activeTab === "attendance" && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowAttendanceModal(true)}
            >
              <Plus size={16} /> Catat Absensi
            </button>
          )}

          {activeTab === "payroll" && (
            <button
              type="button"
              className="btn-primary"
              onClick={() => setShowPayrollModal(true)}
            >
              <Plus size={16} /> Proses Payroll Baru
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="stats-grid-3" style={{ marginBottom: "24px" }}>
        <div className="stat-card stat-card-blue" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Total Karyawan Aktif</span>
          <div className="stat-card-value">{employees.filter((e) => e.status === "Aktif").length} orang</div>
          <span className="stat-card-sub">Staf terdaftar di sistem</span>
        </div>

        <div className="stat-card stat-card-emerald" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Presensi Hadir (Bulan Ini)</span>
          <div className="stat-card-value text-emerald">
            {attendance.filter((a) => a.date?.startsWith(currentMonth) && a.status === "Hadir").length} sesi
          </div>
          <span className="stat-card-sub">Kehadiran tercatat</span>
        </div>

        <div className="stat-card stat-card-gold" style={{ padding: "16px 20px" }}>
          <span className="stat-card-title">Beban Payroll (Bulan Ini)</span>
          <div className="stat-card-value text-gold">{formatRp(monthlyPayrollTotal)}</div>
          <span className="stat-card-sub">Periode {currentMonth}</span>
        </div>
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "20px", borderBottom: "1px solid var(--border-subtle)", paddingBottom: "12px" }}>
        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "employees" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("employees")}
        >
          <Users size={15} /> Database Karyawan ({employees.length})
        </button>

        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "attendance" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("attendance")}
        >
          <CalendarCheck size={15} /> Log Absensi ({attendance.length})
        </button>

        <button
          type="button"
          className={`btn-secondary btn-sm ${activeTab === "payroll" ? "btn-primary" : ""}`}
          onClick={() => setActiveTab("payroll")}
        >
          <Banknote size={15} /> Penggajian &amp; Slip Gaji ({payroll.length})
        </button>
      </div>

      {/* TAB 1: EMPLOYEES */}
      {activeTab === "employees" && (
        <div className="panel-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Nama Lengkap</th>
                  <th>Jabatan / Posisi</th>
                  <th>Telepon / WA</th>
                  <th style={{ textAlign: "right" }}>Gaji Pokok</th>
                  <th>Tgl Bergabung</th>
                  <th style={{ textAlign: "center" }}>Status</th>
                  <th style={{ width: "80px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Belum ada data karyawan. Tambahkan karyawan baru untuk memulai.
                    </td>
                  </tr>
                ) : (
                  employees.map((emp) => (
                    <tr key={emp.id}>
                      <td>
                        <strong>{emp.name}</strong>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{emp.position}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{emp.phone || "—"}</td>
                      <td style={{ textAlign: "right" }}>
                        <span className="num-cell">{formatRp(emp.baseSalary)}</span>
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(emp.joinDate)}</td>
                      <td style={{ textAlign: "center" }}>
                        <Badge variant={emp.status === "Aktif" ? "emerald" : "slate"} size="sm">
                          {emp.status}
                        </Badge>
                      </td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => {
                              setEmployeeToEdit(emp);
                              setShowEmployeeModal(true);
                            }}
                            title="Edit Karyawan"
                          >
                            <Edit2 size={15} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => {
                              if (confirm(`Hapus karyawan "${emp.name}"? Data absensi dan penggajian terkait juga akan dihapus.`)) {
                                deleteEmployee(emp.id);
                              }
                            }}
                            title="Hapus Karyawan"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="panel-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Nama Karyawan</th>
                  <th>Status Kehadiran</th>
                  <th>Keterangan / Catatan</th>
                  <th style={{ width: "60px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {attendance.length === 0 ? (
                  <tr>
                    <td colSpan={5} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Belum ada catatan absensi.
                    </td>
                  </tr>
                ) : (
                  attendance.map((att) => (
                    <tr key={att.id}>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(att.date)}</td>
                      <td>
                        <strong>{getEmployeeName(att.employeeId)}</strong>
                      </td>
                      <td>
                        <Badge variant={getAttendanceBadgeVariant(att.status)} size="sm">
                          {att.status}
                        </Badge>
                      </td>
                      <td style={{ color: "var(--text-secondary)" }}>{att.notes || "—"}</td>
                      <td style={{ textAlign: "center" }}>
                        <button
                          type="button"
                          className="icon-del-btn"
                          onClick={() => deleteAttendance(att.id)}
                          title="Hapus Catatan"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PAYROLL */}
      {activeTab === "payroll" && (
        <div className="panel-card" style={{ padding: 0 }}>
          <div className="table-responsive">
            <table className="app-table">
              <thead>
                <tr>
                  <th>Periode</th>
                  <th>Nama Karyawan</th>
                  <th style={{ textAlign: "right" }}>Gaji Pokok</th>
                  <th style={{ textAlign: "right" }}>Tunjangan</th>
                  <th style={{ textAlign: "right" }}>Potongan</th>
                  <th style={{ textAlign: "right" }}>Gaji Bersih</th>
                  <th>Tgl Bayar</th>
                  <th style={{ width: "100px", textAlign: "center" }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {payroll.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: "center", padding: "36px", color: "var(--text-muted)" }}>
                      Belum ada catatan penggajian (payroll). Klik &quot;Proses Payroll Baru&quot; untuk memproses gaji.
                    </td>
                  </tr>
                ) : (
                  payroll.map((pay) => (
                    <tr key={pay.id}>
                      <td>
                        <strong>{pay.period}</strong>
                      </td>
                      <td>{pay.employeeName}</td>
                      <td style={{ textAlign: "right" }} className="num-cell">
                        {formatRp(pay.baseSalary)}
                      </td>
                      <td style={{ textAlign: "right" }} className="num-cell text-emerald">
                        +{formatRp(pay.allowance || 0)}
                      </td>
                      <td style={{ textAlign: "right" }} className="num-cell text-rose">
                        -{formatRp(pay.deduction || 0)}
                      </td>
                      <td style={{ textAlign: "right" }} className="num-cell" style={{ fontWeight: 700, fontSize: "14px", color: "var(--emerald-dark)" }}>
                        {formatRp(pay.netSalary)}
                      </td>
                      <td style={{ whiteSpace: "nowrap" }}>{formatDate(pay.paymentDate)}</td>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                          <button
                            type="button"
                            className="icon-edit-btn"
                            onClick={() => setSelectedPayrollForPrint(pay)}
                            title="Cetak Slip Gaji"
                          >
                            <Printer size={16} />
                          </button>
                          <button
                            type="button"
                            className="icon-del-btn"
                            onClick={() => {
                              if (confirm(`Hapus catatan payroll untuk "${pay.employeeName}"?`)) {
                                deletePayroll(pay.id);
                              }
                            }}
                            title="Hapus Payroll"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      {showEmployeeModal && (
        <EmployeeModal
          isOpen={true}
          employeeToEdit={employeeToEdit}
          onClose={() => {
            setShowEmployeeModal(false);
            setEmployeeToEdit(null);
          }}
        />
      )}

      {showAttendanceModal && (
        <AttendanceModal
          isOpen={true}
          onClose={() => setShowAttendanceModal(false)}
        />
      )}

      {showPayrollModal && (
        <PayrollModal
          isOpen={true}
          onClose={() => setShowPayrollModal(false)}
        />
      )}

      {selectedPayrollForPrint && (
        <PayslipModal
          isOpen={true}
          payrollRecord={selectedPayrollForPrint}
          onClose={() => setSelectedPayrollForPrint(null)}
        />
      )}
    </div>
  );
}
