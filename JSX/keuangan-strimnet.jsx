import { useState, useEffect, useMemo } from "react";
import {
  LayoutDashboard,
  Landmark,
  ArrowDownCircle,
  ArrowUpCircle,
  Plus,
  Trash2,
  X,
  Wallet,
  CreditCard,
} from "lucide-react";

const STORAGE_KEY = "ZENTA-finance-v1";

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

export default function App() {
  const [accounts, setAccounts] = useState([]);
  const [incomes, setIncomes] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("dasbor");
  const [confirmReset, setConfirmReset] = useState(false);
  const [saveError, setSaveError] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await appStorage.get(STORAGE_KEY, false);
        if (res && res.value) {
          const data = JSON.parse(res.value);
          setAccounts(Array.isArray(data.accounts) ? data.accounts : []);
          setIncomes(Array.isArray(data.incomes) ? data.incomes : []);
          setExpenses(Array.isArray(data.expenses) ? data.expenses : []);
        }
      } catch (e) {
        // no data saved yet
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        const result = await appStorage.set(
          STORAGE_KEY,
          JSON.stringify({ accounts, incomes, expenses }),
          false
        );
        setSaveError(!result);
      } catch (e) {
        setSaveError(true);
      }
    })();
  }, [accounts, incomes, expenses, loaded]);

  const accountBalance = (acc) => {
    const inc = incomes
      .filter((i) => i.akun === acc.id)
      .reduce((s, i) => s + Number(i.jumlah || 0), 0);
    const exp = expenses
      .filter((e) => e.akun === acc.id)
      .reduce((s, e) => s + Number(e.jumlah || 0), 0);
    return Number(acc.saldoAwal || 0) + inc - exp;
  };

  const balances = useMemo(
    () => accounts.map((a) => ({ ...a, saldo: accountBalance(a) })),
    [accounts, incomes, expenses]
  );

  const totalKasBank = balances
    .filter((a) => a.jenis !== "Kartu Kredit")
    .reduce((s, a) => s + a.saldo, 0);
  const totalKartuKredit = balances
    .filter((a) => a.jenis === "Kartu Kredit")
    .reduce((s, a) => s + a.saldo, 0);
  const netWorth = totalKasBank - totalKartuKredit;

  const totalPendapatan = incomes.reduce((s, i) => s + Number(i.jumlah || 0), 0);
  const totalPengeluaran = expenses.reduce((s, e) => s + Number(e.jumlah || 0), 0);

  const accountName = (id) => accounts.find((a) => a.id === id)?.nama || "—";

  const deleteAccount = (id) => {
    setAccounts((a) => a.filter((x) => x.id !== id));
    setIncomes((i) => i.filter((x) => x.akun !== id));
    setExpenses((e) => e.filter((x) => x.akun !== id));
  };

  const resetAll = async () => {
    setAccounts([]);
    setIncomes([]);
    setExpenses([]);
    setConfirmReset(false);
  };

  const NAV = [
    { id: "dasbor", label: "Dasbor", icon: LayoutDashboard },
    { id: "rekening", label: "Rekening Bank", icon: Landmark },
    { id: "pendapatan", label: "Pendapatan", icon: ArrowDownCircle },
    { id: "pengeluaran", label: "Pengeluaran", icon: ArrowUpCircle },
  ];

  return (
    <div className="app">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600;8..60,700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');

        :root{
          --paper:#EAE6DA;
          --panel:#F5F2E8;
          --panel-line:#D8D2BF;
          --ink:#20261F;
          --ink-soft:#5B5F52;
          --brass:#8C6B26;
          --brass-soft:#C9B37E;
          --green:#2F6B4F;
          --green-soft:#E4EEE6;
          --rust:#A13F2B;
          --rust-soft:#F3E4DF;
          --sidebar:#20261F;
          --sidebar-text:#D9D6C6;
        }
        *{box-sizing:border-box;}
        .app{
          font-family:'Source Serif 4', Georgia, serif;
          color:var(--ink);
          background:var(--paper);
          min-height:100%;
          display:flex;
          width:100%;
          border-radius:6px;
          overflow:hidden;
        }
        .num{font-family:'IBM Plex Mono', monospace; font-variant-numeric: tabular-nums;}
        button, input, select{font-family:inherit;}
        button{cursor:pointer;}
        :focus-visible{outline:2px solid var(--brass); outline-offset:2px;}

        .sidebar{
          width:200px;
          flex-shrink:0;
          background:var(--sidebar);
          color:var(--sidebar-text);
          padding:22px 14px;
          display:flex;
          flex-direction:column;
        }
        .brand{
          font-size:13px;
          letter-spacing:.03em;
          color:var(--brass-soft);
          margin-bottom:2px;
        }
        .brand-sub{
          font-size:19px;
          font-weight:600;
          color:#F4F2E6;
          margin-bottom:26px;
          line-height:1.25;
        }
        .navitem{
          display:flex;
          align-items:center;
          gap:9px;
          padding:9px 10px;
          border:none;
          background:transparent;
          color:var(--sidebar-text);
          text-align:left;
          font-size:14.5px;
          border-radius:4px;
          border-left:2px solid transparent;
          margin-bottom:2px;
        }
        .navitem:hover{background:rgba(255,255,255,0.06);}
        .navitem.active{
          background:rgba(255,255,255,0.08);
          border-left:2px solid var(--brass-soft);
          color:#fff;
        }
        .navitem svg{flex-shrink:0;}
        .sidebar-foot{
          margin-top:auto;
          padding-top:14px;
        }
        .reset-link{
          background:none;border:none;
          color:#8b8b78;
          font-size:12px;
          padding:4px 10px;
          text-decoration:underline;
          text-underline-offset:2px;
        }
        .reset-link:hover{color:#c98a76;}
        .confirm-box{
          background:rgba(255,255,255,0.06);
          border:1px solid rgba(255,255,255,0.15);
          border-radius:4px;
          padding:10px;
          font-size:12.5px;
          margin:0 4px;
        }
        .confirm-box p{margin:0 0 8px 0; color:#e5e2d3;}
        .confirm-row{display:flex; gap:6px;}
        .confirm-row button{
          flex:1; font-size:12px; padding:5px 0; border-radius:3px; border:1px solid rgba(255,255,255,0.2);
          background:rgba(255,255,255,0.05); color:#e5e2d3;
        }
        .confirm-row button.danger{background:var(--rust); border-color:var(--rust); color:#fff;}

        .main{
          flex:1;
          padding:30px 36px 40px;
          overflow:auto;
          min-width:0;
        }
        h1.page-title{
          font-size:26px;
          font-weight:600;
          margin:0 0 4px 0;
        }
        .page-sub{
          color:var(--ink-soft);
          font-size:14px;
          margin:0 0 26px 0;
        }

        .hero{
          border:1px solid var(--panel-line);
          background:var(--panel);
          border-radius:6px;
          padding:24px 26px;
          margin-bottom:22px;
        }
        .hero-label{font-size:13px; color:var(--ink-soft); margin-bottom:6px;}
        .hero-figure{font-size:40px; font-weight:600; letter-spacing:-0.01em;}
        .hero-figure.neg{color:var(--rust);}

        .kpi-row{display:flex; gap:16px; margin-bottom:26px; flex-wrap:wrap;}
        .kpi{
          flex:1; min-width:180px;
          border:1px solid var(--panel-line);
          border-top:3px solid var(--brass);
          background:var(--panel);
          border-radius:4px;
          padding:14px 16px;
        }
        .kpi.income{border-top-color:var(--green);}
        .kpi.expense{border-top-color:var(--rust);}
        .kpi-label{font-size:12.5px; color:var(--ink-soft); margin-bottom:6px;}
        .kpi-value{font-size:21px; font-weight:600;}

        .section-title{
          font-size:15px;
          font-weight:600;
          margin:0 0 12px 0;
          padding-bottom:8px;
          border-bottom:1px solid var(--panel-line);
        }

        table{width:100%; border-collapse:collapse; font-size:14px;}
        thead th{
          text-align:left;
          font-family:'IBM Plex Mono', monospace;
          font-size:11px;
          letter-spacing:.03em;
          color:var(--ink-soft);
          font-weight:500;
          padding:0 10px 8px 10px;
          border-bottom:1px solid var(--panel-line);
        }
        thead th.num-col{text-align:right;}
        tbody td{
          padding:11px 10px;
          border-bottom:1px solid var(--panel-line);
          vertical-align:middle;
        }
        tbody tr:last-child td{border-bottom:none;}
        td.num-col{text-align:right;}
        .empty-row td{
          text-align:center;
          color:var(--ink-soft);
          padding:26px 10px;
          font-style:italic;
        }
        .del-btn{
          background:none;border:none;color:var(--ink-soft);
          padding:4px; border-radius:3px; display:inline-flex;
        }
        .del-btn:hover{color:var(--rust); background:var(--rust-soft);}

        .bal-bar-track{
          background:var(--panel-line);
          height:6px; border-radius:3px; overflow:hidden; margin-top:6px;
        }
        .bal-bar-fill{height:100%; background:var(--brass);}
        .bal-bar-fill.cc{background:var(--rust);}

        .panel{
          border:1px solid var(--panel-line);
          background:var(--panel);
          border-radius:6px;
          padding:20px 22px;
          margin-bottom:20px;
        }
        .panel-head{
          display:flex; align-items:center; justify-content:space-between;
          margin-bottom:16px;
        }
        .add-btn{
          display:flex; align-items:center; gap:6px;
          background:var(--ink); color:#F4F2E6;
          border:none; padding:8px 14px; border-radius:4px;
          font-size:13.5px;
        }
        .add-btn:hover{background:#33402f;}
        .form-grid{
          display:grid;
          grid-template-columns:repeat(auto-fit, minmax(150px, 1fr));
          gap:12px;
          margin-bottom:14px;
        }
        .field label{
          display:block; font-size:11.5px; color:var(--ink-soft);
          margin-bottom:5px; font-family:'IBM Plex Mono', monospace;
          letter-spacing:.02em;
        }
        .field input, .field select{
          width:100%; padding:8px 9px;
          border:1px solid var(--panel-line);
          border-radius:4px;
          background:#fff;
          font-size:14px;
          color:var(--ink);
        }
        .field input:focus, .field select:focus{border-color:var(--brass);}
        .form-actions{display:flex; gap:8px; justify-content:flex-end;}
        .btn-primary{
          background:var(--brass); color:#fff; border:none;
          padding:8px 16px; border-radius:4px; font-size:13.5px;
        }
        .btn-primary:hover{background:#785a1f;}
        .btn-ghost{
          background:none; border:1px solid var(--panel-line);
          padding:8px 14px; border-radius:4px; font-size:13.5px; color:var(--ink-soft);
        }
        .tag{
          font-size:11px; padding:2px 8px; border-radius:20px;
          font-family:'IBM Plex Mono', monospace;
          background:var(--panel-line); color:var(--ink-soft);
          white-space:nowrap;
        }
        .tag.cash{background:#E7E2CF; color:#6b5c25;}
        .tag.bank{background:#DDE7DF; color:#2F6B4F;}
        .tag.cc{background:var(--rust-soft); color:var(--rust);}

        .save-note{
          font-size:12px; color:var(--rust); margin-top:10px;
        }
        .empty-state{
          text-align:center; padding:36px 10px; color:var(--ink-soft);
        }
        .empty-state svg{opacity:.5; margin-bottom:8px;}
      `}</style>

      <aside className="sidebar">
        <div className="brand">ZENTA</div>
        <div className="brand-sub">Manajemen Keuangan</div>

        <nav>
          {NAV.map((n) => {
            const Icon = n.icon;
            return (
              <button
                key={n.id}
                className={"navitem" + (tab === n.id ? " active" : "")}
                onClick={() => setTab(n.id)}
              >
                <Icon size={16} />
                {n.label}
              </button>
            );
          })}
        </nav>

        <div className="sidebar-foot">
          {!confirmReset ? (
            <button className="reset-link" onClick={() => setConfirmReset(true)}>
              Hapus semua data
            </button>
          ) : (
            <div className="confirm-box">
              <p>Hapus semua rekening, pendapatan, dan pengeluaran secara permanen?</p>
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
            netWorth={netWorth}
            totalKasBank={totalKasBank}
            totalKartuKredit={totalKartuKredit}
            totalPendapatan={totalPendapatan}
            totalPengeluaran={totalPengeluaran}
            balances={balances}
          />
        )}

        {tab === "rekening" && (
          <RekeningView
            accounts={balances}
            addAccount={(acc) => setAccounts((a) => [...a, { ...acc, id: uid() }])}
            deleteAccount={deleteAccount}
          />
        )}

        {tab === "pendapatan" && (
          <TransaksiView
            title="Pendapatan"
            subtitle="Catat setiap uang masuk ke rekening Anda."
            icon={ArrowDownCircle}
            accentClass="income"
            accounts={accounts}
            items={incomes}
            accountName={accountName}
            addItem={(it) => setIncomes((a) => [{ ...it, id: uid() }, ...a])}
            deleteItem={(id) => setIncomes((a) => a.filter((x) => x.id !== id))}
            total={totalPendapatan}
          />
        )}

        {tab === "pengeluaran" && (
          <TransaksiView
            title="Pengeluaran"
            subtitle="Catat setiap uang keluar dari rekening Anda."
            icon={ArrowUpCircle}
            accentClass="expense"
            accounts={accounts}
            items={expenses}
            accountName={accountName}
            addItem={(it) => setExpenses((a) => [{ ...it, id: uid() }, ...a])}
            deleteItem={(id) => setExpenses((a) => a.filter((x) => x.id !== id))}
            total={totalPengeluaran}
          />
        )}

        {saveError && (
          <p className="save-note">
            Perubahan terakhir belum tersimpan. Periksa koneksi Anda dan coba lagi.
          </p>
        )}
      </main>
    </div>
  );
}

function DasborView({ netWorth, totalKasBank, totalKartuKredit, totalPendapatan, totalPengeluaran, balances }) {
  const maxBal = Math.max(1, ...balances.map((b) => Math.abs(b.saldo)));
  return (
    <div>
      <h1 className="page-title">Neraca</h1>
      <p className="page-sub">Ringkasan posisi keuangan Anda saat ini.</p>

      <div className="hero">
        <div className="hero-label">Nilai Bersih Kekayaan</div>
        <div className={"hero-figure num" + (netWorth < 0 ? " neg" : "")}>
          {formatRp(netWorth)}
        </div>
      </div>

      <div className="kpi-row">
        <div className="kpi">
          <div className="kpi-label">Total Kas &amp; Bank</div>
          <div className="kpi-value num">{formatRp(totalKasBank)}</div>
        </div>
        <div className="kpi">
          <div className="kpi-label">Total Saldo Kartu Kredit</div>
          <div className="kpi-value num">{formatRp(totalKartuKredit)}</div>
        </div>
        <div className="kpi income">
          <div className="kpi-label">Total Pendapatan</div>
          <div className="kpi-value num">{formatRp(totalPendapatan)}</div>
        </div>
        <div className="kpi expense">
          <div className="kpi-label">Total Pengeluaran</div>
          <div className="kpi-value num">{formatRp(totalPengeluaran)}</div>
        </div>
      </div>

      <div className="panel">
        <h2 className="section-title">Saldo per Rekening</h2>
        {balances.length === 0 ? (
          <div className="empty-state">
            <Wallet size={26} />
            <p>Belum ada rekening. Tambahkan rekening di menu "Rekening Bank".</p>
          </div>
        ) : (
          <div>
            {balances.map((b) => (
              <div key={b.id} style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
                  <span>{b.nama} <span className="tag" style={{marginLeft:6}}>{b.jenis}</span></span>
                  <span className="num">{formatRp(b.saldo)}</span>
                </div>
                <div className="bal-bar-track">
                  <div
                    className={"bal-bar-fill" + (b.jenis === "Kartu Kredit" ? " cc" : "")}
                    style={{ width: `${(Math.abs(b.saldo) / maxBal) * 100}%` }}
                  />
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
  const [nama, setNama] = useState("");
  const [jenis, setJenis] = useState("Cash");
  const [saldoAwal, setSaldoAwal] = useState("");

  const submit = () => {
    if (!nama.trim()) return;
    addAccount({ nama: nama.trim(), jenis, saldoAwal: Number(saldoAwal) || 0 });
    setNama("");
    setJenis("Cash");
    setSaldoAwal("");
    setShowForm(false);
  };

  const tagClass = (j) => (j === "Cash" ? "cash" : j === "Kartu Kredit" ? "cc" : "bank");

  return (
    <div>
      <h1 className="page-title">Rekening Bank</h1>
      <p className="page-sub">Daftar kas, rekening bank, dan kartu kredit Anda.</p>

      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>
            {accounts.length} rekening
          </h2>
          {!showForm && (
            <button className="add-btn" onClick={() => setShowForm(true)}>
              <Plus size={15} /> Tambah Rekening
            </button>
          )}
        </div>

        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field">
                <label>Nama Rekening</label>
                <input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="mis. BCA Utama" autoFocus />
              </div>
              <div className="field">
                <label>Jenis</label>
                <select value={jenis} onChange={(e) => setJenis(e.target.value)}>
                  {JENIS_OPTIONS.map((j) => (
                    <option key={j} value={j}>{j}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Saldo Awal (Rp)</label>
                <input type="number" value={saldoAwal} onChange={(e) => setSaldoAwal(e.target.value)} placeholder="0" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn-primary" onClick={submit}>Simpan Rekening</button>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Nama Rekening</th>
              <th>Jenis</th>
              <th className="num-col">Saldo Awal</th>
              <th className="num-col">Saldo Saat Ini</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {accounts.length === 0 && (
              <tr className="empty-row"><td colSpan={5}>Belum ada rekening.</td></tr>
            )}
            {accounts.map((a) => (
              <tr key={a.id}>
                <td>{a.nama}</td>
                <td><span className={"tag " + tagClass(a.jenis)}>{a.jenis}</span></td>
                <td className="num-col num">{formatRp(a.saldoAwal)}</td>
                <td className="num-col num">{formatRp(a.saldo)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="del-btn" onClick={() => deleteAccount(a.id)} aria-label={`Hapus ${a.nama}`}>
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function TransaksiView({ title, subtitle, icon: Icon, accentClass, accounts, items, accountName, addItem, deleteItem, total }) {
  const [showForm, setShowForm] = useState(false);
  const [tanggal, setTanggal] = useState(todayISO());
  const [akun, setAkun] = useState("");
  const [kategori, setKategori] = useState("");
  const [jumlah, setJumlah] = useState("");
  const [catatan, setCatatan] = useState("");

  const canSubmit = akun && Number(jumlah) > 0;

  const submit = () => {
    if (!canSubmit) return;
    addItem({ tanggal, akun, kategori: kategori.trim() || "Umum", jumlah: Number(jumlah), catatan: catatan.trim() });
    setTanggal(todayISO());
    setAkun("");
    setKategori("");
    setJumlah("");
    setCatatan("");
    setShowForm(false);
  };

  return (
    <div>
      <h1 className="page-title">{title}</h1>
      <p className="page-sub">{subtitle}</p>

      <div className={"kpi " + accentClass} style={{ maxWidth: 260, marginBottom: 22 }}>
        <div className="kpi-label">Total {title}</div>
        <div className="kpi-value num">{formatRp(total)}</div>
      </div>

      <div className="panel">
        <div className="panel-head">
          <h2 className="section-title" style={{ border: "none", margin: 0, padding: 0 }}>
            {items.length} transaksi
          </h2>
          {!showForm && (
            <button
              className="add-btn"
              onClick={() => {
                if (accounts.length === 0) return;
                setShowForm(true);
              }}
              disabled={accounts.length === 0}
              title={accounts.length === 0 ? "Tambahkan rekening terlebih dahulu" : undefined}
              style={accounts.length === 0 ? { opacity: 0.5, cursor: "not-allowed" } : undefined}
            >
              <Plus size={15} /> Tambah {title}
            </button>
          )}
        </div>

        {accounts.length === 0 && (
          <p style={{ fontSize: 13.5, color: "var(--ink-soft)", marginTop: -6 }}>
            Tambahkan rekening di menu "Rekening Bank" sebelum mencatat {title.toLowerCase()}.
          </p>
        )}

        {showForm && (
          <div style={{ borderBottom: "1px solid var(--panel-line)", paddingBottom: 16, marginBottom: 16 }}>
            <div className="form-grid">
              <div className="field">
                <label>Tanggal</label>
                <input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} />
              </div>
              <div className="field">
                <label>Rekening</label>
                <select value={akun} onChange={(e) => setAkun(e.target.value)}>
                  <option value="">Pilih rekening</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.nama}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Kategori</label>
                <input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="mis. Penjualan, Gaji" />
              </div>
              <div className="field">
                <label>Jumlah (Rp)</label>
                <input type="number" value={jumlah} onChange={(e) => setJumlah(e.target.value)} placeholder="0" />
              </div>
              <div className="field" style={{ gridColumn: "1 / -1" }}>
                <label>Catatan (opsional)</label>
                <input value={catatan} onChange={(e) => setCatatan(e.target.value)} placeholder="Keterangan tambahan" />
              </div>
            </div>
            <div className="form-actions">
              <button className="btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
              <button className="btn-primary" disabled={!canSubmit} onClick={submit}>Simpan</button>
            </div>
          </div>
        )}

        <table>
          <thead>
            <tr>
              <th>Tanggal</th>
              <th>Rekening</th>
              <th>Kategori</th>
              <th>Catatan</th>
              <th className="num-col">Jumlah</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 && (
              <tr className="empty-row"><td colSpan={6}>Belum ada transaksi {title.toLowerCase()}.</td></tr>
            )}
            {items.map((it) => (
              <tr key={it.id}>
                <td className="num">{formatDate(it.tanggal)}</td>
                <td>{accountName(it.akun)}</td>
                <td>{it.kategori}</td>
                <td style={{ color: "var(--ink-soft)" }}>{it.catatan || "—"}</td>
                <td className="num-col num">{formatRp(it.jumlah)}</td>
                <td style={{ textAlign: "right" }}>
                  <button className="del-btn" onClick={() => deleteItem(it.id)} aria-label="Hapus transaksi">
                    <Trash2 size={15} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
