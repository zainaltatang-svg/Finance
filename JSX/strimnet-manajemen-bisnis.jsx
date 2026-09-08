import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Trash2,
  Wallet,
  Users,
  Package,
  ShoppingCart,
  UserRound,
  CalendarCheck,
  Banknote,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

const FIN_KEY = "zenta-finance-v1";
const SALES_KEY = "zenta-sales-v1";
const HR_KEY = "zenta-hr-v1";

const localStorageAdapter = {
  async get(key) {
    const value = window.localStorage.getItem(key);
    return value === null ? null : { value };
  },
  async set(key, value) {
    window.localStorage.setItem(key, value);
    return { ok: true };
  },
};

const appStorage = window.storage || localStorageAdapter;

const uid = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `id-${Date.now()}-${Math.random().toString(16).slice(2)}`);

const todayISO = () => new Date().toISOString().slice(0, 10);

const formatRp = (n) => {
  const v = Number(n) || 0;
  return "Rp" + v.toLocaleString("id-ID", { maximumFractionDigits: 0 });
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso + "T00:00:00");
  if (isNaN(d)) return iso;
  return d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
};

const JENIS_OPTIONS = ["Cash", "Bank", "Kartu Kredit"];
const ORDER_STATUS = ["Baru", "Diproses", "Selesai", "Dibatalkan"];
const BAYAR_STATUS = ["Belum Dibayar", "Lunas"];
const KEHADIRAN_STATUS = ["Hadir", "Izin", "Sakit", "Alpha"];
const LOW_STOCK = 5;

export default function App() {
  // finance
  const [accounts, setAccounts] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  // sales
  const [clients, setClients] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  // hr
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [payroll, setPayroll] = useState([]);

  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dasbor");
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await appStorage.get(FIN_KEY, false);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setAccounts(Array.isArray(d.accounts) ? d.accounts : []);
          setIncomes(Array.isArray(d.incomes) ? d.incomes : []);
          setExpenses(Array.isArray(d.expenses) ? d.expenses : []);
        }
      } catch (e) {}
      try {
        const res = await appStorage.get(SALES_KEY, false);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setClients(Array.isArray(d.clients) ? d.clients : []);
          setProducts(Array.isArray(d.products) ? d.products : []);
          setOrders(Array.isArray(d.orders) ? d.orders : []);
        }
      } catch (e) {}
      try {
        const res = await appStorage.get(HR_KEY, false);
        if (res && res.value) {
          const d = JSON.parse(res.value);
          setEmployees(Array.isArray(d.employees) ? d.employees : []);
          setAttendance(Array.isArray(d.attendance) ? d.attendance : []);
          setPayroll(Array.isArray(d.payroll) ? d.payroll : []);
        }
      } catch (e) {}
      setLoaded(true);
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const r = await appStorage.set(FIN_KEY, JSON.stringify({ accounts, incomes, expenses }), false);
        if (!r) setSaveError(true);
      } catch (e) { setSaveError(true); }
    })();
  }, [accounts, incomes, expenses, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const r = await appStorage.set(SALES_KEY, JSON.stringify({ clients, products, orders }), false);
        if (!r) setSaveError(true);
      } catch (e) { setSaveError(true); }
    })();
  }, [clients, products, orders, loaded]);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const r = await appStorage.set(HR_KEY, JSON.stringify({ employees, attendance, payroll }), false);
        if (!r) setSaveError(true);
      } catch (e) { setSaveError(true); }
    })();
  }, [employees, attendance, payroll, loaded]);

  // ---- finance calcs ----
  const accountBalance = (acc) => {
    const inc = incomes.filter((i) => i.akun === acc.id).reduce((s, i) => s + Number(i.jumlah || 0), 0);
    const exp = expenses.filter((e) => e.akun === acc.id).reduce((s, e) => s + Number(e.jumlah || 0), 0);
    return Number(acc.saldoAwal || 0) + inc - exp;
  };
  const balances = useMemo(() => accounts.map((a) => ({ ...a, saldo: accountBalance(a) })), [accounts, incomes, expenses]);
  const totalKasBank = balances.filter((a) => a.jenis !== "Kartu Kredit").reduce((s, a) => s + a.saldo, 0);
  const totalKartuKredit = balances.filter((a) => a.jenis === "Kartu Kredit").reduce((s, a) => s + a.saldo, 0);
  const netWorth = totalKasBank - totalKartuKredit;
  const totalPendapatan = incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);
  const totalPengeluaran = expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0);
  const accountName = (id) => accounts.find((a) => a.id === id)?.nama || "—";

  const deleteAccount = (id) => {
    setAccounts((a) => a.filter((x) => x.id !== id));
    setIncomes((i) => i.filter((x) => x.akun !== id));
    setExpenses((e) => e.filter((x) => x.akun !== id));
  };

  // ---- sales calcs ----
  const clientOrderCount = (id) => orders.filter((o) => o.klienId === id).length;
  const lowStockCount = products.filter((p) => Number(p.stok) <= LOW_STOCK).length;
  const orderTotal = (o) => o.items.reduce((s, it) => s + it.qty * it.harga, 0);
  const totalTagihanBelumDibayar = orders
    .filter((o) => o.statusBayar === "Belum Dibayar" && o.status !== "Dibatalkan")
    .reduce((s, o) => s + orderTotal(o), 0);

  const deleteClient = (id) => setClients((c) => c.filter((x) => x.id !== id));
  const deleteProduct = (id) => setProducts((p) => p.filter((x) => x.id !== id));
  const deleteOrder = (order) => {
    // restock items
    setProducts((prods) =>
      prods.map((p) => {
        const item = order.items.find((it) => it.produkId === p.id);
        return item ? { ...p, stok: Number(p.stok || 0) + item.qty } : p;
      })
    );
    setOrders((os) => os.filter((o) => o.id !== order.id));
  };

  // ---- hr calcs ----
  const employeeName = (id) => employees.find((e) => e.id === id)?.nama || "—";
  const deleteEmployee = (id) => {
    setEmployees((e) => e.filter((x) => x.id !== id));
    setAttendance((a) => a.filter((x) => x.karyawanId !== id));
  };
  const deleteAttendance = (id) => setAttendance((a) => a.filter((x) => x.id !== id));
  const deletePayroll = (id) => setPayroll((p) => p.filter((x) => x.id !== id));

  const resetAll = () => {
    setAccounts([]); setIncomes([]); setExpenses([]);
    setClients([]); setProducts([]); setOrders([]);
    setEmployees([]); setAttendance([]); setPayroll([]);
    setConfirmReset(false);
  };

  const NAV_GROUPS = [
    {
      label: "Keuangan",
      items: [
        { id: "dasbor", label: "Dasbor", icon: LayoutDashboard },
        { id: "rekening", label: "Rekening Bank", icon: Landmark },
        { id: "pendapatan", label: "Pendapatan", icon: ArrowDownCircle },
        { id: "pengeluaran", label: "Pengeluaran", icon: ArrowUpCircle },
      ],
    },
    {
      label: "Penjualan & Order",
      items: [
        { id: "klien", label: "Database Klien", icon: Users },
        { id: "stok", label: "Manajemen Stok", icon: Package },
        { id: "pesanan", label: "Pesanan & Invoice", icon: ShoppingCart },
      ],
    },
    {
      label: "Karyawan & Payroll",
      items: [
        { id: "karyawan", label: "Database Karyawan", icon: UserRound },
        { id: "absensi", label: "Absensi", icon: CalendarCheck },
        { id: "penggajian", label: "Penggajian", icon: Banknote },
      ],
    },
  ];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
        :root{
          --paper:#EAE6DA; --panel:#F5F2E8; --panel-line:#D8D2BF;
          --ink:#20261F; --ink-soft:#5B5F52;
          --brass:#8C6B26; --brass-soft:#C9B37E;
          --green:#2F6B4F; --green-soft:#E4EEE6;
          --rust:#A13F2B; --rust-soft:#F3E4DF;
          --blue:#3A5A78; --blue-soft:#E1E9EF;
          --sidebar:#20261F; --sidebar-text:#D9D6C6;
        }
        *{box-sizing:border-box;}
        .app{font-family:'Source Serif 4', Georgia, serif; color:var(--ink); background:var(--paper); min-height:100%; display:flex; width:100%; border-radius:6px; overflow:hidden;}
        .num{font-family:'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums;}
        button, input, select{font-family:inherit;}
        button{cursor:pointer;}
        :focus-visible{outline:2px solid var(--brass); outline-offset:2px;}

        .sidebar{width:212px; flex-shrink:0; background:var(--sidebar); color:var(--sidebar-text); padding:22px 14px; display:flex; flex-direction:column; overflow-y:auto;}
        .brand{font-size:13px; letter-spacing:.03em; color:var(--brass-soft); margin-bottom:2px;}
        .brand-sub{font-size:19px; font-weight:600; color:#F4F2E6; margin-bottom:22px; line-height:1.25;}
        .nav-group{margin-bottom:16px;}
        .nav-group-label{font-family:'IBM Plex Mono',monospace; font-size:10.5px; letter-spacing:.05em; color:#7d8071; padding:0 10px; margin-bottom:5px;}
        .navitem{width:100%; display:flex; align-items:center; gap:9px; padding:8px 10px; border:none; background:transparent; color:var(--sidebar-text); text-align:left; font-size:14px; border-radius:4px; border-left:2px solid transparent; margin-bottom:1px;}
        .navitem:hover{background:rgba(255,255,255,0.06);}
        .navitem.active{background:rgba(255,255,255,0.08); border-left:2px solid var(--brass-soft); color:#fff;}
        .navitem svg{flex-shrink:0;}
        .sidebar-foot{margin-top:auto; padding-top:14px;}
        .reset-link{background:none;border:none;color:#8b8b78;font-size:12px;padding:4px 10px;text-decoration:underline;text-underline-offset:2px;}
        .reset-link:hover{color:#c98a76;}
        .confirm-box{background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.15);border-radius:4px;padding:10px;font-size:12.5px;margin:0 4px;}
        .confirm-box p{margin:0 0 8px 0; color:#e5e2d3;}
        .confirm-row{display:flex; gap:6px;}
        .confirm-row button{flex:1; font-size:12px; padding:5px 0; border-radius:3px; border:1px solid rgba(255,255,255,0.2); background:rgba(255,255,255,0.05); color:#e5e2d3;}
        .confirm-row button.danger{background:var(--rust); border-color:var(--rust); color:#fff;}

        .main{flex:1; padding:30px 36px 40px; overflow:auto; min-width:0;}
        h1.page-title{font-size:26px; font-weight:600; margin:0 0 4px 0;}
        .page-sub{color:var(--ink-soft); font-size:14px; margin:0 0 26px 0;}

        .hero{border:1px solid var(--panel-line); background:var(--panel); border-radius:6px; padding:24px 26px; margin-bottom:22px;}
        .hero-label{font-size:13px; color:var(--ink-soft); margin-bottom:6px;}
        .hero-figure{font-size:40px; font-weight:600; letter-spacing:-0.01em;}
        .hero-figure.neg{color:var(--rust);}

        .kpi-row{display:flex; gap:16px; margin-bottom:26px; flex-wrap:wrap;}
        .kpi{flex:1; min-width:170px; border:1px solid var(--panel-line); border-top:3px solid var(--brass); background:var(--panel); border-radius:4px; padding:14px 16px;}
        .kpi.income{border-top-color:var(--green);}
        .kpi.expense{border-top-color:var(--rust);}
        .kpi.info{border-top-color:var(--blue);}
        .kpi-label{font-size:12.5px; color:var(--ink-soft); margin-bottom:6px;}
        .kpi-value{font-size:21px; font-weight:600;}

        .section-title{font-size:15px; font-weight:600; margin:0 0 12px 0; padding-bottom:8px; border-bottom:1px solid var(--panel-line);}

        table{width:100%; border-collapse:collapse; font-size:14px;}
        thead th{text-align:left; font-family:'IBM Plex Mono', monospace; font-size:11px; letter-spacing:.03em; color:var(--ink-soft); font-weight:500; padding:0 10px 8px 10px; border-bottom:1px solid var(--panel-line);}
        thead th.num-col{text-align:right;}
        tbody td{padding:11px 10px; border-bottom:1px solid var(--panel-line); vertical-align:middle;}
        tbody tr:last-child td{border-bottom:none;}
        td.num-col{text-align:right;}
        .empty-row td{text-align:center; color:var(--ink-soft); padding:26px 10px; font-style:italic;}
        .del-btn{background:none;border:none;color:var(--ink-soft);padding:4px; border-radius:3px; display:inline-flex;}
        .del-btn:hover{color:var(--rust); background:var(--rust-soft);}
        .exp-btn{background:none;border:none;color:var(--ink-soft);padding:4px; border-radius:3px; display:inline-flex;}
        .exp-btn:hover{background:var(--panel-line);}

        .bal-bar-track{background:var(--panel-line); height:6px; border-radius:3px; overflow:hidden; margin-top:6px;}
        .bal-bar-fill{height:100%; background:var(--brass);}
        .bal-bar-fill.cc{background:var(--rust);}

        .panel{border:1px solid var(--panel-line); background:var(--panel); border-radius:6px; padding:20px 22px; margin-bottom:20px;}
        .panel-head{display:flex; align-items:center; justify-content:space-between; margin-bottom:16px;}
        .add-btn{display:flex; align-items:center; gap:6px; background:var(--ink); color:#F4F2E6; border:none; padding:8px 14px; border-radius:4px; font-size:13.5px;}
        .add-btn:hover{background:#33402f;}
        .add-btn:disabled{opacity:.5; cursor:not-allowed;}
        .form-grid{display:grid; grid-template-columns:repeat(auto-fit, minmax(150px, 1fr)); gap:12px; margin-bottom:14px;}
        .field label{display:block; font-size:11.5px; color:var(--ink-soft); margin-bottom:5px; font-family:'IBM Plex Mono', monospace; letter-spacing:.02em;}
        .field input, .field select, .field textarea{width:100%; padding:8px 9px; border:1px solid var(--panel-line); border-radius:4px; background:#fff; font-size:14px; color:var(--ink);}
        .field input:focus, .field select:focus, .field textarea:focus{border-color:var(--brass);}
        .form-actions{display:flex; gap:8px; justify-content:flex-end;}
        .btn-primary{background:var(--brass); color:#fff; border:none; padding:8px 16px; border-radius:4px; font-size:13.5px;}
        .btn-primary:hover{background:#785a1f;}
        .btn-primary:disabled{opacity:.5; cursor:not-allowed;}
        .btn-ghost{background:none; border:1px solid var(--panel-line); padding:8px 14px; border-radius:4px; font-size:13.5px; color:var(--ink-soft);}
        .tag{font-size:11px; padding:2px 8px; border-radius:20px; font-family:'IBM Plex Mono', monospace; background:var(--panel-line); color:var(--ink-soft); white-space:nowrap;}
        .tag.cash{background:#E7E2CF; color:#6b5c25;}
        .tag.bank{background:#DDE7DF; color:#2F6B4F;}
        .tag.cc{background:var(--rust-soft); color:var(--rust);}
        .badge{font-size:11px; padding:3px 9px; border-radius:20px; font-family:'IBM Plex Mono', monospace; white-space:nowrap; display:inline-block;}
        .badge.st-baru{background:var(--blue-soft); color:var(--blue);}
        .badge.st-diproses{background:#F0E6C9; color:#8C6B26;}
        .badge.st-selesai{background:var(--green-soft); color:var(--green);}
        .badge.st-dibatalkan{background:var(--rust-soft); color:var(--rust);}
        .badge.st-lunas{background:var(--green-soft); color:var(--green);}
        .badge.st-belumdibayar{background:var(--rust-soft); color:var(--rust);}
        .badge.st-hadir{background:var(--green-soft); color:var(--green);}
        .badge.st-izin{background:var(--blue-soft); color:var(--blue);}
        .badge.st-sakit{background:#F0E6C9; color:#8C6B26;}
        .badge.st-alpha{background:var(--rust-soft); color:var(--rust);}
        .badge.low{background:var(--rust-soft); color:var(--rust);}

        .save-note{font-size:12px; color:var(--rust); margin-top:10px;}
        .empty-state{text-align:center; padding:36px 10px; color:var(--ink-soft);}
        .empty-state svg{opacity:.5; margin-bottom:8px;}

        .item-builder{border:1px dashed var(--panel-line); border-radius:4px; padding:14px; margin-bottom:14px; background:#fff;}
        .item-row-grid{display:grid; grid-template-columns:2fr 1fr 1fr auto; gap:10px; align-items:end; margin-bottom:10px;}
        .item-list-mini{margin-bottom:10px;}
        .item-list-mini-row{display:flex; justify-content:space-between; font-size:13px; padding:6px 0; border-bottom:1px solid var(--panel-line);}
        .item-total-row{display:flex; justify-content:space-between; font-weight:600; padding-top:8px;}
        .detail-row td{background:#FBFAF4; padding:14px 20px;}
        .detail-item{display:flex; justify-content:space-between; font-size:13px; padding:5px 0; border-bottom:1px solid var(--panel-line);}
      `}</style>

      <aside className="sidebar">
        <div className="brand">STRIMNET</div>
        <div className="brand-sub">Manajemen Bisnis</div>

        {NAV_GROUPS.map((g) => (
          <div className="nav-group" key={g.label}>
            <div className="nav-group-label">{g.label.toUpperCase()}</div>
            {g.items.map((n) => {
              const Icon = n.icon;
              return (
                <button key={n.id} className={"navitem" + (tab === n.id ? " active" : "")} onClick={() => setTab(n.id)}>
                  <Icon size={16} />
                  {n.label}
                </button>
              );
            })}
          </div>
        ))}

        <div className="sidebar-foot">
          {!confirmReset ? (
            <button className="reset-link" onClick={() => setConfirmReset(true)}>Hapus semua data</button>
          ) : (
            <div className="confirm-box">
              <p>Hapus seluruh data keuangan, penjualan, dan karyawan secara permanen?</p>
              <div className="confirm-row">
                <button onClick={() => setConfirmReset(false)}>Batal</button>
                <button className="danger" onClick={resetAll}>Hapus</button>
              </div>
            </div>
          )}
        </div>
      </aside>

      <main className="main">
        {tab === "dasbor" && (
          <DasborView
            netWorth={netWorth} totalKasBank={totalKasBank} totalKartuKredit={totalKartuKredit}
            totalPendapatan={totalPendapatan} totalPengeluaran={totalPengeluaran} balances={balances}
            clientCount={clients.length} lowStockCount={lowStockCount}
            openOrderCount={orders.filter((o) => o.status !== "Selesai" && o.status !== "Dibatalkan").length}
            totalTagihanBelumDibayar={totalTagihanBelumDibayar} employeeCount={employees.length}
          />
        )}
        {tab === "rekening" && <RekeningView accounts={balances} addAccount={(acc) => setAccounts((a) => [...a, { ...acc, id: uid() }])} deleteAccount={deleteAccount} />}
        {tab === "pendapatan" && (
          <TransaksiView title="Pendapatan" subtitle="Catat setiap uang masuk ke rekening Anda." accentClass="income"
            accounts={accounts} items={incomes} accountName={accountName}
            addItem={(it) => setIncomes((a) => [{ ...it, id: uid() }, ...a])}
            deleteItem={(id) => setIncomes((a) => a.filter((x) => x.id !== id))} total={totalPendapatan} />
        )}
        {tab === "pengeluaran" && (
          <TransaksiView title="Pengeluaran" subtitle="Catat setiap uang keluar dari rekening Anda." accentClass="expense"
            accounts={accounts} items={expenses} accountName={accountName}
            addItem={(it) => setExpenses((a) => [{ ...it, id: uid() }, ...a])}
            deleteItem={(id) => setExpenses((a) => a.filter((x) => x.id !== id))} total={totalPengeluaran} />
        )}
        {tab === "klien" && <KlienView clients={clients} orderCount={clientOrderCount} addClient={(c) => setClients((a) => [...a, { ...c, id: uid() }])} deleteClient={deleteClient} />}
        {tab === "stok" && <StokView products={products} addProduct={(p) => setProducts((a) => [...a, { ...p, id: uid() }])} deleteProduct={deleteProduct} updateStok={(id, stok) => setProducts((a) => a.map((p) => p.id === id ? { ...p, stok } : p))} />}
        {tab === "pesanan" && (
          <PesananView clients={clients} products={products} orders={orders}
            addOrder={(o) => {
              setOrders((a) => [{ ...o, id: uid() }, ...a]);
              setProducts((prods) => prods.map((p) => {
                const item = o.items.find((it) => it.produkId === p.id);
                return item ? { ...p, stok: Math.max(0, Number(p.stok || 0) - item.qty) } : p;
              }));
            }}
            deleteOrder={deleteOrder}
            updateStatus={(id, field, value) => setOrders((a) => a.map((o) => o.id === id ? { ...o, [field]: value } : o))}
          />
        )}
        {tab === "karyawan" && <KaryawanView employees={employees} addEmployee={(e) => setEmployees((a) => [...a, { ...e, id: uid() }])} deleteEmployee={deleteEmployee} />}
        {tab === "absensi" && <AbsensiView employees={employees} attendance={attendance} employeeName={employeeName}
          addAttendance={(a) => setAttendance((x) => [{ ...a, id: uid() }, ...x])} deleteAttendance={deleteAttendance} />}
        {tab === "penggajian" && <PenggajianView employees={employees} payroll={payroll} employeeName={employeeName}
          addPayroll={(p) => setPayroll((x) => [{ ...p, id: uid() }, ...x])} deletePayroll={deletePayroll} />}

        {saveError && <p className="save-note">Perubahan terakhir belum tersimpan. Periksa koneksi Anda dan coba lagi.</p>}
      </main>
    </div>
  );
}

// ============ FINANCE (unchanged from before) ============
function DasborView({ netWorth, totalKasBank, totalKartuKredit, totalPendapatan, totalPengeluaran, balances, clientCount, lowStockCount, openOrderCount, totalTagihanBelumDibayar, employeeCount }) {
  const maxBal = Math.max(1, ...balances.map((b) => Math.abs(b.saldo)));
  return (
    <div>
      <h1 className="page-title">Dasbor</h1>
      <p className="page-sub">Ringkasan posisi keuangan, penjualan, dan tim Anda.</p>

      <div className="hero">
        <div className="hero-label">Nilai Bersih Kekayaan</div>
        <div className={"hero-figure num" + (netWorth < 0 ? " neg" : "")}>{formatRp(netWorth)}</div>
      </div>

      <div className="kpi-row">
        <div className="kpi"><div className="kpi-label">Total Kas &amp; Bank</div><div className="kpi-value num">{formatRp(totalKasBank)}</div></div>
        <div className="kpi"><div className="kpi-label">Total Saldo Kartu Kredit</div><div className="kpi-value num">{formatRp(totalKartuKredit)}</div></div>
        <div className="kpi income"><div className="kpi-label">Total Pendapatan</div><div className="kpi-value num">{formatRp(totalPendapatan)}</div></div>
        <div className="kpi expense"><div className="kpi-label">Total Pengeluaran</div><div className="kpi-value num">{formatRp(totalPengeluaran)}</div></div>
      </div>

      <div className="kpi-row">
        <div className="kpi info"><div className="kpi-label">Order Berjalan</div><div className="kpi-value num">{openOrderCount}</div></div>
        <div className="kpi info"><div className="kpi-label">Tagihan Belum Dibayar</div><div className="kpi-value num">{formatRp(totalTagihanBelumDibayar)}</div></div>
        <div className="kpi info"><div className="kpi-label">Produk Stok Rendah</div><div className="kpi-value num">{lowStockCount}</div></div>
        <div className="kpi info"><div className="kpi-label">Karyawan Aktif</div><div className="kpi-value num">{employeeCount}</div></div>
      </div>

      <div className="panel">
        <h2 className="section-title">Saldo per Rekening</h2>
        {balances.length === 0 ? (
          <div className="empty-state"><Wallet size={26} /><p>Belum ada rekening. Tambahkan rekening di menu "Rekening Bank".</p></div>
        ) : (
          <div>
            {balances.map((b) => (
              <div key={b.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{b.nama} <span className="tag" style={{ marginLeft: 6 }}>{b.jenis}</span></span>
                  <span className="num">{formatRp(b.saldo)}</span>
                </div>
                <div className="bal-bar-track">
                  <div className={"bal-bar-fill" + (b.jenis === "Kartu Kredit" ? " cc" : "")} style={{ width: `${(Math.abs(b.saldo) / maxBal) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function RekeningView({ accounts, addAccount, deleteAccount }) {
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState(""); const [jenis, setJenis] = useState("Cash"); const [saldoAwal, setSaldoAwal] = useState("");
  const submit = () => {
    if (!nama.trim()) return;
    addAccount({ nama: nama.trim(), jenis, saldoAwal: Number(saldoAwal) || 0 });
    setNama(""); setJenis("Cash"); setSaldoAwal(""); setShowForm(false);
  };
  const tagClass = (j) => (j === "Cash" ? "cash" : j === "Kartu Kredit" ? "cc" : "bank");
  return (
    <div>
      <h1 className="page-title">Rekening Bank</h1>
      <p className="page-sub">Daftar kas, rekening bank, dan kartu kredit Anda.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{accounts.length} rekening</h2>
          {!showForm && <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={15} /> Tambah Rekening</button>}
        </div>
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Nama Rekening</label><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. BCA Utama" autoFocus /></div>
              <div className="field"><label>Jenis</label><select value={jenis} onChange={(e) => setJenis(e.target.value)}>{JENIS_OPTIONS.map((j) => <option key={j} value={j}>{j}</option>)}</select></div>
              <div className="field"><label>Saldo Awal (Rp)</label><input type="number" value={saldoAwal} onChange={(e) => setSaldoAwal(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" onClick={submit}>Simpan Rekening</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Nama Rekening</th><th>Jenis</th><th className="num-col">Saldo Awal</th><th className="num-col">Saldo Saat Ini</th><th></th></tr></thead>
          <tbody>
            {accounts.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada rekening.</td></tr>}
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.nama}</td><td><span className={"tag " + tagClass(a.jenis)}>{a.jenis}</span></td>
                <td className="num-col num">{formatRp(a.saldoAwal)}</td><td className="num-col num">{formatRp(a.saldo)}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteAccount(a.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransaksiView({ title, subtitle, accentClass, accounts, items, accountName, addItem, deleteItem, total }) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(todayISO()); const [akun, setAkun] = useState(""); const [kategori, setKategori] = useState("");
  const [jumlah, setJumlah] = useState(""); const [catatan, setCatatan] = useState("");
  const canSubmit = akun && Number(jumlah) > 0;
  const submit = () => {
    if (!canSubmit) return;
    addItem({ tanggal, akun, kategori: kategori.trim() || "Umum", jumlah: Number(jumlah), catatan: catatan.trim() });
    setTanggal(todayISO()); setAkun(""); setKategori(""); setJumlah(""); setCatatan(""); setShowForm(false);
  };
  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{subtitle}</p>
      <div className={"kpi " + accentClass} style={{ maxWidth: 260, marginBottom: 22 }}><div className="kpi-label">Total {title}</div><div className="kpi-value num">{formatRp(total)}</div></div>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{items.length} transaksi</h2>
          {!showForm && <button className="add-btn" disabled={accounts.length === 0} onClick={() => accounts.length && setShowForm(true)}><Plus size={15} /> Tambah {title}</button>}
        </div>
        {accounts.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: -6 }}>Tambahkan rekening di menu "Rekening Bank" sebelum mencatat {title.toLowerCase()}.</p>}
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></div>
              <div className="field"><label>Rekening</label><select value={akun} onChange={(e) => setAkun(e.target.value)}><option value="">Pilih rekening</option>{accounts.map((a) => <option key={a.id} value={a.id}>{a.nama}</option>)}</select></div>
              <div className="field"><label>Kategori</label><input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="mis. Penjualan, Gaji" /></div>
              <div className="field"><label>Jumlah (Rp)</label><input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" /></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Catatan (opsional)</label><input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Keterangan tambahan" /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" disabled={!canSubmit} onClick={submit}>Simpan</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Tanggal</th><th>Rekening</th><th>Kategori</th><th>Catatan</th><th className="num-col">Jumlah</th><th></th></tr></thead>
          <tbody>
            {items.length === 0 && <tr className="empty-row"><td colSpan={6}>Belum ada transaksi {title.toLowerCase()}.</td></tr>}
            {items.map((it) => (
              <tr key={it.id}>
                <td className="num">{formatDate(it.tanggal)}</td><td>{accountName(it.akun)}</td><td>{it.kategori}</td>
                <td style={{ color: "var(--ink-soft)" }}>{it.catatan || "—"}</td><td className="num-col num">{formatRp(it.jumlah)}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteItem(it.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ PENJUALAN & ORDER ============
function KlienView({ clients, orderCount, addClient, deleteClient }) {
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState(""); const [telepon, setTelepon] = useState(""); const [alamat, setAlamat] = useState(""); const [catatan, setCatatan] = useState("");
  const submit = () => {
    if (!nama.trim()) return;
    addClient({ nama: nama.trim(), telepon: telepon.trim(), alamat: alamat.trim(), catatan: catatan.trim() });
    setNama(""); setTelepon(""); setAlamat(""); setCatatan(""); setShowForm(false);
  };
  return (
    <div>
      <h1 className="page-title">Database Klien</h1>
      <p className="page-sub">Daftar pelanggan dan kontak bisnis Anda.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{clients.length} klien</h2>
          {!showForm && <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={15} /> Tambah Klien</button>}
        </div>
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Nama Klien</label><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Toko Makmur Jaya" autoFocus /></div>
              <div className="field"><label>Telepon</label><input value={telepon} onChange={(e) => setTelepon(e.target.value)} placeholder="08xx-xxxx-xxxx" /></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Alamat</label><input value={alamat} onChange={(e) => setAlamat(e.target.value)} placeholder="Alamat lengkap" /></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Catatan (opsional)</label><input value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" onClick={submit}>Simpan Klien</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Nama</th><th>Telepon</th><th>Alamat</th><th className="num-col">Jumlah Order</th><th></th></tr></thead>
          <tbody>
            {clients.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada klien.</td></tr>}
            {clients.map((c) => (
              <tr key={c.id}>
                <td>{c.nama}</td><td>{c.telepon || "—"}</td><td style={{ color: "var(--ink-soft)" }}>{c.alamat || "—"}</td>
                <td className="num-col num">{orderCount(c.id)}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteClient(c.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function StokView({ products, addProduct, deleteProduct, updateStok }) {
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState(""); const [sku, setSku] = useState(""); const [harga, setHarga] = useState(""); const [stok, setStok] = useState("");
  const submit = () => {
    if (!nama.trim()) return;
    addProduct({ nama: nama.trim(), sku: sku.trim(), harga: Number(harga) || 0, stok: Number(stok) || 0 });
    setNama(""); setSku(""); setHarga(""); setStok(""); setShowForm(false);
  };
  return (
    <div>
      <h1 className="page-title">Manajemen Stok</h1>
      <p className="page-sub">Daftar produk, harga jual, dan sisa stok.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{products.length} produk</h2>
          {!showForm && <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={15} /> Tambah Produk</button>}
        </div>
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Nama Produk</label><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. Router WiFi AX3000" autoFocus /></div>
              <div className="field"><label>SKU (opsional)</label><input value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU-001" /></div>
              <div className="field"><label>Harga Jual (Rp)</label><input type="number" value={harga} onChange={(e) => setHarga(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>Stok Awal</label><input type="number" value={stok} onChange={(e) => setStok(e.target.value)} placeholder="0" /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" onClick={submit}>Simpan Produk</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Produk</th><th>SKU</th><th className="num-col">Harga</th><th className="num-col">Stok</th><th></th></tr></thead>
          <tbody>
            {products.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada produk.</td></tr>}
            {products.map((p) => (
              <tr key={p.id}>
                <td>{p.nama}</td><td style={{ color: "var(--ink-soft)" }}>{p.sku || "—"}</td><td className="num-col num">{formatRp(p.harga)}</td>
                <td className="num-col">
                  <input type="number" value={p.stok} onChange={(e) => updateStok(p.id, Number(e.target.value) || 0)}
                    className="num" style={{ width: 70, textAlign: "right", border: "1px solid var(--panel-line)", borderRadius: 4, padding: "4px 6px" }} />
                  {Number(p.stok) <= LOW_STOCK && <span className="badge low" style={{ marginLeft: 8 }}>Stok Rendah</span>}
                </td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteProduct(p.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PesananView({ clients, products, orders, addOrder, deleteOrder, updateStatus }) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(todayISO());
  const [klienId, setKlienId] = useState("");
  const [catatan, setCatatan] = useState("");
  const [items, setItems] = useState([]);
  const [selProduk, setSelProduk] = useState(""); const [selQty, setSelQty] = useState(1);
  const [expanded, setExpanded] = useState({});

  const addItemRow = () => {
    const prod = products.find((p) => p.id === selProduk);
    if (!prod || selQty <= 0) return;
    setItems((it) => [...it, { produkId: prod.id, produkNama: prod.nama, qty: Number(selQty), harga: prod.harga }]);
    setSelProduk(""); setSelQty(1);
  };
  const removeItemRow = (idx) => setItems((it) => it.filter((_, i) => i !== idx));
  const itemsTotal = items.reduce((s, it) => s + it.qty * it.harga, 0);

  const resetForm = () => { setTanggal(todayISO()); setKlienId(""); setCatatan(""); setItems([]); setShowForm(false); };
  const submit = () => {
    if (!klienId || items.length === 0) return;
    const client = clients.find((c) => c.id === klienId);
    addOrder({ tanggal, klienId, klienNama: client?.nama || "—", items, status: "Baru", statusBayar: "Belum Dibayar", catatan: catatan.trim() });
    resetForm();
  };

  const badgeClass = (s) => "st-" + s.toLowerCase().replace(/\s/g, "");
  const orderTotal = (o) => o.items.reduce((s, it) => s + it.qty * it.harga, 0);

  return (
    <div>
      <h1 className="page-title">Pesanan &amp; Invoice</h1>
      <p className="page-sub">Kelola pesanan masuk beserta status pengerjaan dan pembayaran.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{orders.length} pesanan</h2>
          {!showForm && <button className="add-btn" disabled={clients.length === 0 || products.length === 0} onClick={() => setShowForm(true)}><Plus size={15} /> Buat Pesanan</button>}
        </div>
        {(clients.length === 0 || products.length === 0) && (
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: -6 }}>Tambahkan klien dan produk terlebih dahulu sebelum membuat pesanan.</p>
        )}

        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></div>
              <div className="field"><label>Klien</label><select value={klienId} onChange={(e) => setKlienId(e.target.value)}><option value="">Pilih klien</option>{clients.map((c) => <option key={c.id} value={c.id}>{c.nama}</option>)}</select></div>
              <div className="field" style={{ gridColumn: "1 / -1" }}><label>Catatan (opsional)</label><input value={catatan} onChange={(e) => setCatatan(e.target.value)} /></div>
            </div>

            <div className="item-builder">
              <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-soft)", marginBottom: 8, fontFamily: "'IBM Plex Mono', monospace" }}>TAMBAH ITEM PESANAN</label>
              <div className="item-row-grid">
                <div className="field" style={{ marginBottom: 0 }}>
                  <select value={selProduk} onChange={(e) => setSelProduk(e.target.value)}>
                    <option value="">Pilih produk</option>
                    {products.map((p) => <option key={p.id} value={p.id}>{p.nama} — {formatRp(p.harga)}</option>)}
                  </select>
                </div>
                <div className="field" style={{ marginBottom: 0 }}><input type="number" min="1" value={selQty} onChange={(e) => setSelQty(e.target.value)} placeholder="Qty" /></div>
                <div></div>
                <button className="btn-ghost" onClick={addItemRow}>Tambah Item</button>
              </div>

              {items.length > 0 && (
                <div className="item-list-mini">
                  {items.map((it, idx) => (
                    <div className="item-list-mini-row" key={idx}>
                      <span>{it.produkNama} × {it.qty}</span>
                      <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                        <span className="num">{formatRp(it.qty * it.harga)}</span>
                        <button className="del-btn" onClick={() => removeItemRow(idx)}><Trash2 size={13} /></button>
                      </span>
                    </div>
                  ))}
                  <div className="item-total-row"><span>Total</span><span className="num">{formatRp(itemsTotal)}</span></div>
                </div>
              )}
            </div>

            <div className="form-actions"><button className="btn-ghost" onClick={resetForm}>Batal</button><button className="btn-primary" disabled={!klienId || items.length === 0} onClick={submit}>Simpan Pesanan</button></div>
          </div>
        )}

        <table>
          <thead><tr><th></th><th>Tanggal</th><th>Klien</th><th>Status</th><th>Pembayaran</th><th className="num-col">Total</th><th></th></tr></thead>
          <tbody>
            {orders.length === 0 && <tr className="empty-row"><td colSpan={7}>Belum ada pesanan.</td></tr>}
            {orders.map((o) => (
              <>
                <tr key={o.id}>
                  <td><button className="exp-btn" onClick={() => setExpanded((e) => ({ ...e, [o.id]: !e[o.id] }))}>{expanded[o.id] ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</button></td>
                  <td className="num">{formatDate(o.tanggal)}</td>
                  <td>{o.klienNama}</td>
                  <td>
                    <select value={o.status} onChange={(e) => updateStatus(o.id, "status", e.target.value)}
                      className={"badge " + badgeClass(o.status)} style={{ border: "none", padding: "3px 6px" }}>
                      {ORDER_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td>
                    <select value={o.statusBayar} onChange={(e) => updateStatus(o.id, "statusBayar", e.target.value)}
                      className={"badge " + badgeClass(o.statusBayar)} style={{ border: "none", padding: "3px 6px" }}>
                      {BAYAR_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  </td>
                  <td className="num-col num">{formatRp(orderTotal(o))}</td>
                  <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteOrder(o)}><Trash2 size={15} /></button></td>
                </tr>
                {expanded[o.id] && (
                  <tr className="detail-row" key={o.id + "-detail"}>
                    <td colSpan={7}>
                      {o.items.map((it, i) => (
                        <div className="detail-item" key={i}><span>{it.produkNama} × {it.qty} @ {formatRp(it.harga)}</span><span className="num">{formatRp(it.qty * it.harga)}</span></div>
                      ))}
                      {o.catatan && <div style={{ fontSize: 13, color: "var(--ink-soft)", marginTop: 8 }}>Catatan: {o.catatan}</div>}
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============ KARYAWAN & PAYROLL ============
function KaryawanView({ employees, addEmployee, deleteEmployee }) {
  const [showForm, setShowForm] = useState(false);
  const [nama, setNama] = useState(""); const [posisi, setPosisi] = useState(""); const [gajiPokok, setGajiPokok] = useState(""); const [tglMulai, setTglMulai] = useState(todayISO()); const [kontak, setKontak] = useState("");
  const submit = () => {
    if (!nama.trim()) return;
    addEmployee({ nama: nama.trim(), posisi: posisi.trim(), gajiPokok: Number(gajiPokok) || 0, tglMulai, kontak: kontak.trim() });
    setNama(""); setPosisi(""); setGajiPokok(""); setTglMulai(todayISO()); setKontak(""); setShowForm(false);
  };
  return (
    <div>
      <h1 className="page-title">Database Karyawan</h1>
      <p className="page-sub">Daftar anggota tim, posisi, dan gaji pokok.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{employees.length} karyawan</h2>
          {!showForm && <button className="add-btn" onClick={() => setShowForm(true)}><Plus size={15} /> Tambah Karyawan</button>}
        </div>
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Nama</label><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nama lengkap" autoFocus /></div>
              <div className="field"><label>Posisi</label><input value={posisi} onChange={(e) => setPosisi(e.target.value)} placeholder="mis. Teknisi Lapangan" /></div>
              <div className="field"><label>Gaji Pokok (Rp)</label><input type="number" value={gajiPokok} onChange={(e) => setGajiPokok(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>Tanggal Mulai Kerja</label><input type="date" value={tglMulai} onChange={(e) => setTglMulai(e.target.value)} /></div>
              <div className="field"><label>Kontak</label><input value={kontak} onChange={(e) => setKontak(e.target.value)} placeholder="08xx-xxxx-xxxx" /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" onClick={submit}>Simpan Karyawan</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Nama</th><th>Posisi</th><th>Mulai Kerja</th><th className="num-col">Gaji Pokok</th><th></th></tr></thead>
          <tbody>
            {employees.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada karyawan.</td></tr>}
            {employees.map((e) => (
              <tr key={e.id}>
                <td>{e.nama}</td><td style={{ color: "var(--ink-soft)" }}>{e.posisi || "—"}</td><td className="num">{formatDate(e.tglMulai)}</td>
                <td className="num-col num">{formatRp(e.gajiPokok)}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteEmployee(e.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AbsensiView({ employees, attendance, addAttendance, deleteAttendance }) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(todayISO()); const [karyawanId, setKaryawanId] = useState(""); const [status, setStatus] = useState("Hadir"); const [jamKerja, setJamKerja] = useState("");
  const submit = () => {
    if (!karyawanId) return;
    const emp = employees.find((e) => e.id === karyawanId);
    addAttendance({ tanggal, karyawanId, karyawanNama: emp?.nama || "—", status, jamKerja: jamKerja ? Number(jamKerja) : null });
    setTanggal(todayISO()); setKaryawanId(""); setStatus("Hadir"); setJamKerja(""); setShowForm(false);
  };
  const badgeClass = (s) => "st-" + s.toLowerCase();
  return (
    <div>
      <h1 className="page-title">Absensi</h1>
      <p className="page-sub">Rekap kehadiran harian karyawan.</p>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{attendance.length} catatan</h2>
          {!showForm && <button className="add-btn" disabled={employees.length === 0} onClick={() => employees.length && setShowForm(true)}><Plus size={15} /> Catat Kehadiran</button>}
        </div>
        {employees.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: -6 }}>Tambahkan karyawan terlebih dahulu di menu "Database Karyawan".</p>}
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Tanggal</label><input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></div>
              <div className="field"><label>Karyawan</label><select value={karyawanId} onChange={(e) => setKaryawanId(e.target.value)}><option value="">Pilih karyawan</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.nama}</option>)}</select></div>
              <div className="field"><label>Status</label><select value={status} onChange={(e) => setStatus(e.target.value)}>{KEHADIRAN_STATUS.map((s) => <option key={s} value={s}>{s}</option>)}</select></div>
              <div className="field"><label>Jam Kerja (opsional)</label><input type="number" value={jamKerja} onChange={(e) => setJamKerja(e.target.value)} placeholder="8" /></div>
            </div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" disabled={!karyawanId} onClick={submit}>Simpan</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Tanggal</th><th>Karyawan</th><th>Status</th><th className="num-col">Jam Kerja</th><th></th></tr></thead>
          <tbody>
            {attendance.length === 0 && <tr className="empty-row"><td colSpan={5}>Belum ada catatan kehadiran.</td></tr>}
            {attendance.map((a) => (
              <tr key={a.id}>
                <td className="num">{formatDate(a.tanggal)}</td><td>{a.karyawanNama}</td>
                <td><span className={"badge " + badgeClass(a.status)}>{a.status}</span></td>
                <td className="num-col num">{a.jamKerja != null ? a.jamKerja : "—"}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deleteAttendance(a.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function PenggajianView({ employees, payroll, addPayroll, deletePayroll }) {
  const [showForm, setShowForm] = useState(false);
  const [karyawanId, setKaryawanId] = useState(""); const [periode, setPeriode] = useState(""); const [tunjangan, setTunjangan] = useState(""); const [potongan, setPotongan] = useState(""); const [tglBayar, setTglBayar] = useState(todayISO());

  const selectedEmp = employees.find((e) => e.id === karyawanId);
  const total = (selectedEmp?.gajiPokok || 0) + (Number(tunjangan) || 0) - (Number(potongan) || 0);

  const submit = () => {
    if (!karyawanId || !periode.trim()) return;
    addPayroll({
      karyawanId, karyawanNama: selectedEmp?.nama || "—", periode: periode.trim(),
      gajiPokok: selectedEmp?.gajiPokok || 0, tunjangan: Number(tunjangan) || 0, potongan: Number(potongan) || 0,
      total, tglBayar,
    });
    setKaryawanId(""); setPeriode(""); setTunjangan(""); setPotongan(""); setTglBayar(todayISO()); setShowForm(false);
  };

  const totalPayrollBulanIni = payroll.reduce((s, p) => s + p.total, 0);

  return (
    <div>
      <h1 className="page-title">Penggajian</h1>
      <p className="page-sub">Buat dan lihat riwayat slip gaji karyawan.</p>
      <div className="kpi" style={{ maxWidth: 260, marginBottom: 22 }}><div className="kpi-label">Total Penggajian Tercatat</div><div className="kpi-value num">{formatRp(totalPayrollBulanIni)}</div></div>
      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>{payroll.length} slip gaji</h2>
          {!showForm && <button className="add-btn" disabled={employees.length === 0} onClick={() => employees.length && setShowForm(true)}><Plus size={15} /> Buat Slip Gaji</button>}
        </div>
        {employees.length === 0 && <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: -6 }}>Tambahkan karyawan terlebih dahulu di menu "Database Karyawan".</p>}
        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field"><label>Karyawan</label><select value={karyawanId} onChange={(e) => setKaryawanId(e.target.value)}><option value="">Pilih karyawan</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.nama}</option>)}</select></div>
              <div className="field"><label>Periode</label><input value={periode} onChange={(e) => setPeriode(e.target.value)} placeholder="mis. September 2026" /></div>
              <div className="field"><label>Gaji Pokok</label><input value={formatRp(selectedEmp?.gajiPokok || 0)} readOnly style={{ background: "#F0EEE4", color: "var(--ink-soft)" }} /></div>
              <div className="field"><label>Tunjangan (Rp)</label><input type="number" value={tunjangan} onChange={(e) => setTunjangan(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>Potongan (Rp)</label><input type="number" value={potongan} onChange={(e) => setPotongan(e.target.value)} placeholder="0" /></div>
              <div className="field"><label>Tanggal Bayar</label><input type="date" value={tglBayar} onChange={(e) => setTglBayar(e.target.value)} /></div>
            </div>
            <div style={{ fontSize: 14, marginBottom: 14 }}>Total Gaji: <span className="num" style={{ fontWeight: 600 }}>{formatRp(total)}</span></div>
            <div className="form-actions"><button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button><button className="btn-primary" disabled={!karyawanId || !periode.trim()} onClick={submit}>Simpan Slip Gaji</button></div>
          </div>
        )}
        <table>
          <thead><tr><th>Periode</th><th>Karyawan</th><th className="num-col">Gaji Pokok</th><th className="num-col">Tunjangan</th><th className="num-col">Potongan</th><th className="num-col">Total</th><th>Tgl Bayar</th><th></th></tr></thead>
          <tbody>
            {payroll.length === 0 && <tr className="empty-row"><td colSpan={8}>Belum ada slip gaji.</td></tr>}
            {payroll.map((p) => (
              <tr key={p.id}>
                <td>{p.periode}</td><td>{p.karyawanNama}</td><td className="num-col num">{formatRp(p.gajiPokok)}</td>
                <td className="num-col num">{formatRp(p.tunjangan)}</td><td className="num-col num">{formatRp(p.potongan)}</td>
                <td className="num-col num" style={{ fontWeight: 600 }}>{formatRp(p.total)}</td><td className="num">{formatDate(p.tglBayar)}</td>
                <td style={{ textAlign: "right" }}><button className="del-btn" onClick={() => deletePayroll(p.id)}><Trash2 size={15} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
