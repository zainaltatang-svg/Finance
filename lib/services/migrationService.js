import { supabase } from "../supabase";
import { uid, todayISO } from "../formatters";
import { loadLocalData } from "../storage";
import { profileService } from "./profileService";

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const getValidUuid = (id, idMap) => {
  if (!id) return null;
  if (idMap.has(id)) return idMap.get(id);
  if (UUID_REGEX.test(id)) return id;

  const newId = uid();
  idMap.set(id, newId);
  return newId;
};

export const migrationService = {
  async migrateLocalDataToCloud(userId) {
    if (!userId) {
      throw new Error("Pengguna belum login. Harap login terlebih dahulu sebelum migrasi.");
    }

    const localData = loadLocalData();
    const idMap = new Map();

    const summary = {
      profile: false,
      accounts: 0,
      transactions: 0,
      transfers: 0,
      clients: 0,
      products: 0,
      orders: 0,
      orderItems: 0,
      employees: 0,
      attendance: 0,
      payroll: 0,
    };

    // 1. Profil Bisnis
    if (localData.profile) {
      await profileService.upsertProfile(localData.profile, userId);
      summary.profile = true;
    }

    // 2. Rekening Bank & Kas
    if (localData.accounts && localData.accounts.length > 0) {
      const accountRows = localData.accounts.map((acc) => {
        const id = getValidUuid(acc.id, idMap);
        return {
          id,
          user_id: userId,
          name: acc.name,
          type: acc.type || "Bank",
          account_number: acc.accountNumber || "-",
          initial_balance: Number(acc.initialBalance) || 0,
        };
      });

      const { error } = await supabase
        .from("accounts")
        .upsert(accountRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi akun: ${error.message}`);
      summary.accounts = accountRows.length;
    }

    // 3. Transaksi
    if (localData.transactions && localData.transactions.length > 0) {
      const txRows = localData.transactions.map((tx) => {
        const id = getValidUuid(tx.id, idMap);
        const mappedAccountId = getValidUuid(tx.accountId, idMap);
        return {
          id,
          user_id: userId,
          account_id: mappedAccountId,
          type: tx.type,
          amount: Number(tx.amount) || 0,
          category: tx.category || "Lain-lain",
          date: tx.date || todayISO(),
          notes: tx.notes || "",
        };
      });

      const { error } = await supabase
        .from("transactions")
        .upsert(txRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi transaksi: ${error.message}`);
      summary.transactions = txRows.length;
    }

    // 4. Transfer
    if (localData.transfers && localData.transfers.length > 0) {
      const transferRows = localData.transfers.map((tr) => {
        const id = getValidUuid(tr.id, idMap);
        const fromAccountId = getValidUuid(tr.fromAccountId, idMap);
        const toAccountId = getValidUuid(tr.toAccountId, idMap);
        return {
          id,
          user_id: userId,
          from_account_id: fromAccountId,
          to_account_id: toAccountId,
          amount: Number(tr.amount) || 0,
          date: tr.date || todayISO(),
          notes: tr.notes || "",
        };
      });

      const { error } = await supabase
        .from("transfers")
        .upsert(transferRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi transfer: ${error.message}`);
      summary.transfers = transferRows.length;
    }

    // 5. Klien
    if (localData.clients && localData.clients.length > 0) {
      const clientRows = localData.clients.map((c) => {
        const id = getValidUuid(c.id, idMap);
        return {
          id,
          user_id: userId,
          name: c.name,
          contact_person: c.contact || "",
          phone: c.phone || "",
          email: c.email || "",
          address: c.address || "",
        };
      });

      const { error } = await supabase
        .from("clients")
        .upsert(clientRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi klien: ${error.message}`);
      summary.clients = clientRows.length;
    }

    // 6. Produk
    if (localData.products && localData.products.length > 0) {
      const productRows = localData.products.map((p) => {
        const id = getValidUuid(p.id, idMap);
        return {
          id,
          user_id: userId,
          name: p.name,
          type: p.type || "product",
          category: p.category || null,
          unit: p.unit || (p.type === "service" ? "layanan" : "pcs"),
          description: p.description || null,
          sku: p.sku || "",
          cost_price: Number(p.costPrice) || 0,
          price: Number(p.price) || 0,
          stock: p.type === "service" ? 0 : Number(p.stock) || 0,
          min_stock: p.type === "service" ? 0 : Number(p.minStock) || 5,
        };
      });

      const { error } = await supabase
        .from("products")
        .upsert(productRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi produk: ${error.message}`);
      summary.products = productRows.length;
    }

    // 7. Pesanan & Order Items
    if (localData.orders && localData.orders.length > 0) {
      const orderRows = [];
      const orderItemsRows = [];

      localData.orders.forEach((ord) => {
        const orderId = getValidUuid(ord.id, idMap);
        const mappedClientId = ord.clientId ? getValidUuid(ord.clientId, idMap) : null;
        const mappedPaidAccountId = ord.paidAccountId ? getValidUuid(ord.paidAccountId, idMap) : null;

        orderRows.push({
          id: orderId,
          user_id: userId,
          invoice_number: ord.invoiceNumber,
          client_id: mappedClientId,
          paid_account_id: mappedPaidAccountId,
          date: ord.date || todayISO(),
          due_date: ord.dueDate || null,
          status: ord.status || "Baru",
          payment_status: ord.paymentStatus || "Belum Dibayar",
          subtotal: Number(ord.subtotal) || 0,
          discount: Number(ord.discount) || 0,
          grand_total: Number(ord.grandTotal) || 0,
          notes: ord.notes || "",
        });

        if (Array.isArray(ord.items)) {
          ord.items.forEach((it) => {
            const mappedProductId = it.productId ? getValidUuid(it.productId, idMap) : null;
            orderItemsRows.push({
              id: uid(),
              user_id: userId,
              order_id: orderId,
              product_id: mappedProductId,
              product_name: it.productName || "Produk",
              qty: Number(it.qty) || 1,
              price: Number(it.price) || 0,
              total: Number(it.total) || 0,
            });
          });
        }
      });

      const { error: ordErr } = await supabase
        .from("orders")
        .upsert(orderRows, { onConflict: "id" });
      if (ordErr) throw new Error(`Gagal migrasi order: ${ordErr.message}`);
      summary.orders = orderRows.length;

      if (orderItemsRows.length > 0) {
        const { error: itemsErr } = await supabase
          .from("order_items")
          .upsert(orderItemsRows, { onConflict: "id" });
        if (itemsErr) throw new Error(`Gagal migrasi item order: ${itemsErr.message}`);
        summary.orderItems = orderItemsRows.length;
      }
    }

    // 8. Karyawan
    if (localData.employees && localData.employees.length > 0) {
      const empRows = localData.employees.map((emp) => {
        const id = getValidUuid(emp.id, idMap);
        return {
          id,
          user_id: userId,
          name: emp.name,
          position: emp.position || "",
          phone: emp.phone || "",
          base_salary: Number(emp.baseSalary) || 0,
          join_date: emp.joinDate || todayISO(),
          status: emp.status || "Aktif",
        };
      });

      const { error } = await supabase
        .from("employees")
        .upsert(empRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi karyawan: ${error.message}`);
      summary.employees = empRows.length;
    }

    // 9. Absensi
    if (localData.attendance && localData.attendance.length > 0) {
      const attRows = localData.attendance.map((att) => {
        const id = getValidUuid(att.id, idMap);
        const mappedEmployeeId = getValidUuid(att.employeeId, idMap);
        return {
          id,
          user_id: userId,
          employee_id: mappedEmployeeId,
          date: att.date || todayISO(),
          status: att.status || "Hadir",
          notes: att.notes || "",
        };
      });

      const { error } = await supabase
        .from("attendance")
        .upsert(attRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi absensi: ${error.message}`);
      summary.attendance = attRows.length;
    }

    // 10. Payroll
    if (localData.payroll && localData.payroll.length > 0) {
      const payRows = localData.payroll.map((pay) => {
        const id = getValidUuid(pay.id, idMap);
        const mappedEmployeeId = getValidUuid(pay.employeeId, idMap);
        const mappedAccountId = pay.accountId ? getValidUuid(pay.accountId, idMap) : null;
        return {
          id,
          user_id: userId,
          employee_id: mappedEmployeeId,
          account_id: mappedAccountId,
          period: pay.period,
          base_salary: Number(pay.baseSalary) || 0,
          allowance: Number(pay.allowance) || 0,
          deduction: Number(pay.deduction) || 0,
          net_salary: Number(pay.netSalary) || 0,
          payment_date: pay.paymentDate || todayISO(),
          status: pay.status || "Dibayar",
          notes: pay.notes || "",
        };
      });

      const { error } = await supabase
        .from("payroll")
        .upsert(payRows, { onConflict: "id" });
      if (error) throw new Error(`Gagal migrasi payroll: ${error.message}`);
      summary.payroll = payRows.length;
    }

    return summary;
  },

  async seedDefaultBusinessDataToCloud(userId) {
    if (!userId) {
      throw new Error("Pengguna belum login. Harap login terlebih dahulu.");
    }

    const today = todayISO();

    // 1. Profil Bisnis
    const profile = {
      name: "ZENTA Business",
      tagline: "Solusi Manajemen Bisnis Terintegrasi",
      address: "Jl. Sudirman Kav. 52, Jakarta Pusat",
      phone: "+62 812-3456-7890",
      email: "finance@zentabusiness.id",
      currency: "IDR",
    };
    await profileService.upsertProfile(profile, userId);

    // 2. Rekening Bank & Kas
    const accBcaId = uid();
    const accKasId = uid();
    const accQrisId = uid();

    const accountRows = [
      { id: accBcaId, user_id: userId, name: "Bank BCA Bisnis", type: "Bank", account_number: "8820-192-381", initial_balance: 25000000 },
      { id: accKasId, user_id: userId, name: "Kas Operasional", type: "Cash", account_number: "-", initial_balance: 3500000 },
      { id: accQrisId, user_id: userId, name: "Dompet Digital (QRIS)", type: "E-Wallet", account_number: "0812-3456-7890", initial_balance: 1850000 },
    ];
    const { error: accErr } = await supabase.from("accounts").insert(accountRows);
    if (accErr) throw new Error(`Gagal membuat rekening default: ${accErr.message}`);

    // 3. Klien
    const client1Id = uid();
    const client2Id = uid();
    const clientRows = [
      { id: client1Id, user_id: userId, name: "PT Surya Abadi Sentosa", contact_person: "Bpk. Hendra", phone: "0812-8877-6655", email: "procurement@suryaabadi.co.id", address: "Jakarta Barat" },
      { id: client2Id, user_id: userId, name: "CV Mitra Digital Kreasi", contact_person: "Ibu Maya", phone: "0813-2233-4455", email: "finance@mitrakreasi.com", address: "Bandung" },
    ];
    const { error: clientErr } = await supabase.from("clients").insert(clientRows);
    if (clientErr) throw new Error(`Gagal membuat klien default: ${clientErr.message}`);

    // 4. Produk & Jasa
    const prod1Id = uid();
    const prod2Id = uid();
    const prod3Id = uid();
    const prod4Id = uid();
    const prod5Id = uid();
    const productRows = [
      { id: prod1Id, user_id: userId, name: "Paket Hardware Terminal POS", type: "product", unit: "unit", category: "Hardware", sku: "POS-TRM-01", cost_price: 1800000, price: 3200000, stock: 12, min_stock: 3 },
      { id: prod2Id, user_id: userId, name: "Printer Thermal Bluetooth 80mm", type: "product", unit: "unit", category: "Hardware", sku: "PRN-TH-80", cost_price: 280000, price: 550000, stock: 6, min_stock: 5 },
      { id: prod3Id, user_id: userId, name: "Barcode Scanner 2D Wireless", type: "product", unit: "unit", category: "Hardware", sku: "SCN-2D-WL", cost_price: 350000, price: 720000, stock: 15, min_stock: 5 },
      { id: prod4Id, user_id: userId, name: "Jasa Konsultasi & Setup Sistem POS", type: "service", unit: "sesi", category: "Layanan Setup", sku: "SRV-POS-SET", cost_price: 0, price: 750000, stock: 0, min_stock: 0 },
      { id: prod5Id, user_id: userId, name: "Jasa Pemeliharaan & Dukungan Bulanan", type: "service", unit: "bulan", category: "Maintenance", sku: "SRV-MNT-BLN", cost_price: 0, price: 500000, stock: 0, min_stock: 0 },
    ];
    const { error: prodErr } = await supabase.from("products").insert(productRows);
    if (prodErr) throw new Error(`Gagal membuat produk & jasa default: ${prodErr.message}`);

    // 5. Transaksi
    const txRows = [
      { id: uid(), user_id: userId, account_id: accBcaId, type: "income", amount: 12500000, category: "Penjualan Produk", date: today, notes: "Order Paket Klien Perdana" },
      { id: uid(), user_id: userId, account_id: accQrisId, type: "income", amount: 1750000, category: "Pendapatan Jasa / Layanan", date: today, notes: "Konsultasi Setup Sistem" },
      { id: uid(), user_id: userId, account_id: accKasId, type: "expense", amount: 650000, category: "Operasional & Perlengkapan Kantor", date: today, notes: "Kertas printer & konsumsi kantor" },
    ];
    const { error: txErr } = await supabase.from("transactions").insert(txRows);
    if (txErr) throw new Error(`Gagal membuat transaksi default: ${txErr.message}`);

    // 6. Transfer
    const transferRows = [
      { id: uid(), user_id: userId, from_account_id: accBcaId, to_account_id: accKasId, amount: 1500000, date: today, notes: "Pengisian kas kecil operasional" },
    ];
    const { error: trErr } = await supabase.from("transfers").insert(transferRows);
    if (trErr) throw new Error(`Gagal membuat transfer default: ${trErr.message}`);

    // 7. Karyawan
    const emp1Id = uid();
    const emp2Id = uid();
    const empRows = [
      { id: emp1Id, user_id: userId, name: "Andi Saputra", position: "Supervisor Operasional", phone: "0812-3344-5566", base_salary: 6500000, join_date: today, status: "Aktif" },
      { id: emp2Id, user_id: userId, name: "Dewi Lestari", position: "Staff Keuangan", phone: "0813-4455-6677", base_salary: 4800000, join_date: today, status: "Aktif" },
    ];
    const { error: empErr } = await supabase.from("employees").insert(empRows);
    if (empErr) throw new Error(`Gagal membuat karyawan default: ${empErr.message}`);

    return { success: true };
  },
};
