import { supabase } from "../supabase";
import { uid, todayISO } from "../formatters";

export const mapEmployeeFromDB = (row) => ({
  id: row.id,
  name: row.name,
  position: row.position,
  phone: row.phone || "",
  baseSalary: Number(row.base_salary) || 0,
  joinDate: row.join_date,
  status: row.status || "Aktif",
  createdAt: row.created_at,
});

export const mapEmployeeToDB = (e, userId) => ({
  id: e.id || uid(),
  user_id: userId,
  name: e.name,
  position: e.position,
  phone: e.phone || "",
  base_salary: Number(e.baseSalary) || 0,
  join_date: e.joinDate || todayISO(),
  status: e.status || "Aktif",
});

export const mapAttendanceFromDB = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  date: row.date,
  status: row.status || "Hadir",
  notes: row.notes || "",
  createdAt: row.created_at,
});

export const mapAttendanceToDB = (att, userId) => ({
  id: att.id || uid(),
  user_id: userId,
  employee_id: att.employeeId,
  date: att.date || todayISO(),
  status: att.status || "Hadir",
  notes: att.notes || "",
});

export const mapPayrollFromDB = (row) => ({
  id: row.id,
  employeeId: row.employee_id,
  employeeName: row.employees?.name || "Karyawan",
  accountId: row.account_id || null,
  period: row.period,
  baseSalary: Number(row.base_salary) || 0,
  allowance: Number(row.allowance) || 0,
  deduction: Number(row.deduction) || 0,
  netSalary: Number(row.net_salary) || 0,
  paymentDate: row.payment_date,
  status: row.status || "Dibayar",
  notes: row.notes || "",
  createdAt: row.created_at,
});

export const mapPayrollToDB = (pay, userId) => ({
  id: pay.id || uid(),
  user_id: userId,
  employee_id: pay.employeeId,
  account_id: pay.accountId || null,
  period: pay.period,
  base_salary: Number(pay.baseSalary) || 0,
  allowance: Number(pay.allowance) || 0,
  deduction: Number(pay.deduction) || 0,
  net_salary: Number(pay.netSalary) || 0,
  payment_date: pay.paymentDate || todayISO(),
  status: pay.status || "Dibayar",
  notes: pay.notes || "",
});

export const employeesService = {
  // Karyawan
  async fetchEmployees() {
    const { data, error } = await supabase
      .from("employees")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data || []).map(mapEmployeeFromDB);
  },

  async createEmployee(emp, userId) {
    const row = mapEmployeeToDB(emp, userId);
    const { data, error } = await supabase
      .from("employees")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapEmployeeFromDB(data);
  },

  async updateEmployee(id, updates) {
    const payload = {};
    if (updates.name !== undefined) payload.name = updates.name;
    if (updates.position !== undefined) payload.position = updates.position;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.baseSalary !== undefined) payload.base_salary = Number(updates.baseSalary);
    if (updates.joinDate !== undefined) payload.join_date = updates.joinDate;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await supabase
      .from("employees")
      .update(payload)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return mapEmployeeFromDB(data);
  },

  async deleteEmployee(id) {
    const { error } = await supabase.from("employees").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // Absensi
  async fetchAttendance() {
    const { data, error } = await supabase
      .from("attendance")
      .select("*")
      .order("date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapAttendanceFromDB);
  },

  async createAttendance(att, userId) {
    const row = mapAttendanceToDB(att, userId);
    const { data, error } = await supabase
      .from("attendance")
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    return mapAttendanceFromDB(data);
  },

  async deleteAttendance(id) {
    const { error } = await supabase.from("attendance").delete().eq("id", id);
    if (error) throw error;
    return true;
  },

  // Payroll
  async fetchPayroll() {
    const { data, error } = await supabase
      .from("payroll")
      .select("*, employees(name)")
      .order("payment_date", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) throw error;
    return (data || []).map(mapPayrollFromDB);
  },

  async createPayroll(pay, userId) {
    const row = mapPayrollToDB(pay, userId);
    const { data, error } = await supabase
      .from("payroll")
      .insert(row)
      .select("*, employees(name)")
      .single();

    if (error) throw error;
    return mapPayrollFromDB(data);
  },

  async deletePayroll(id) {
    const { error } = await supabase.from("payroll").delete().eq("id", id);
    if (error) throw error;
    return true;
  },
};
