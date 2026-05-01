import React, { useEffect, useMemo, useState } from 'react';
import { auth, db } from './firebase';
import { signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';
import { addDoc, collection, deleteDoc, doc, onSnapshot, orderBy, query, serverTimestamp, updateDoc } from 'firebase/firestore';

function money(value) {
  return Number(value || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

const blankForm = {
  company: '', location: '', tech: '', reference: '', supervisor: '', status: 'PENDING', priority: 'NORMAL',
  pago: 'PENDING', invoiceStatus: 'PENDIENTE', total: '', parts: '', labor: '', updates: ''
};

export default function App() {
  const [user, setUser] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [form, setForm] = useState(blankForm);

  useEffect(() => onAuthStateChanged(auth, (currentUser) => {
    setUser(currentUser);
    setLoading(false);
  }), []);

  useEffect(() => {
    if (!user) return;
    const q = query(collection(db, 'jobs'), orderBy('createdAt', 'desc'));
    return onSnapshot(q, (snapshot) => {
      setJobs(snapshot.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
  }, [user]);

  const filtered = useMemo(() => jobs.filter((job) => {
    const text = `${job.company} ${job.location} ${job.tech} ${job.invoice} ${job.reference} ${job.supervisor} ${job.updates}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === 'ALL' || job.status === statusFilter);
  }), [jobs, search, statusFilter]);

  const summary = useMemo(() => {
    const completed = filtered.filter((j) => j.status === 'COMPLETED' || j.status === 'TERMINADO').length;
    const canceled = filtered.filter((j) => j.status === 'CANCELED' || j.status === 'CANCELADO').length;
    const inProgress = filtered.filter((j) => j.status === 'IN PROGRESS').length;
    const revenue = filtered.reduce((sum, j) => sum + Number(j.total || 0), 0);
    const parts = filtered.reduce((sum, j) => sum + Number(j.parts || 0), 0);
    const labor = filtered.reduce((sum, j) => sum + Number(j.labor || 0), 0);
    return { completed, canceled, inProgress, revenue, parts, labor, count: filtered.length };
  }, [filtered]);

  const cityRows = useMemo(() => {
    const map = {};
    filtered.forEach((j) => {
      const city = j.location || 'NO LOCATION';
      if (!map[city]) map[city] = { city, completed: 0, canceled: 0, total: 0, revenue: 0 };
      map[city].total += 1;
      map[city].revenue += Number(j.total || 0);
      if (j.status === 'COMPLETED' || j.status === 'TERMINADO') map[city].completed += 1;
      if (j.status === 'CANCELED' || j.status === 'CANCELADO') map[city].canceled += 1;
    });
    return Object.values(map).sort((a, b) => b.revenue - a.revenue);
  }, [filtered]);

  async function login(e) {
    e.preventDefault();
    setLoginError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err) {
      setLoginError('Login failed. Check email/password or Firebase setup.');
    }
  }

  async function addJob(e) {
    e.preventDefault();
    if (!form.company || !form.location) return;
    const now = new Date();
    await addDoc(collection(db, 'jobs'), {
      ...form,
      company: form.company.toUpperCase(),
      location: form.location.toUpperCase(),
      tech: form.tech.toUpperCase(),
      total: Number(form.total || 0),
      parts: Number(form.parts || 0),
      labor: Number(form.labor || 0),
      date: now.toLocaleDateString('en-US'),
      time: now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      invoice: `INV-${Date.now().toString().slice(-6)}`,
      createdBy: user.email,
      createdAt: serverTimestamp(),
    });
    setForm(blankForm);
  }

  async function updateStatus(id, status) {
    await updateDoc(doc(db, 'jobs', id), { status });
  }

  function exportCSV() {
    const headers = ['DATE','TIME','INVOICE','COMPANY','LOCATION','REFERENCE','SUPERVISOR','STATUS','PRIORITY','TECH','PAGO','INVOICE STATUS','TOTAL BILL','PARTS','TECH LABOR','UPDATES'];
    const rows = filtered.map(j => [j.date,j.time,j.invoice,j.company,j.location,j.reference,j.supervisor,j.status,j.priority,j.tech,j.pago,j.invoiceStatus,j.total,j.parts,j.labor,j.updates]);
    const csv = [headers, ...rows].map(r => r.map(v => `"${String(v ?? '').replaceAll('"','""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'dispatch-report.csv';
    a.click();
  }

  if (loading) return <div style={centerPage}>Loading...</div>;

  if (!user) {
    return (
      <div style={loginPage}>
        <form onSubmit={login} style={loginCard}>
          <div style={loginLogo}>RS</div>
          <h1 style={loginTitle}>Road Service Dispatch Pro</h1>
          <p style={loginSub}>Secure access for dispatchers, admin and office team.</p>
          <label style={loginLabel}>Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} style={loginInput} placeholder="dispatcher@company.com" />
          <label style={loginLabel}>Password</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} style={loginInput} placeholder="Password" />
          {loginError && <div style={errorBox}>{loginError}</div>}
          <button style={loginBtn}>Sign In</button>
        </form>
      </div>
    );
  }

  return (
    <div style={page}>
      <aside style={sidebar}>
        <div style={brandBox}><div style={brandIcon}>RS</div><div><div style={brandTitle}>Road Service</div><div style={brandSub}>Dispatch Pro · {user.email}</div></div></div>
        <nav style={nav}><div style={navActive}>Dashboard</div><div style={navItem}>Live Jobs</div><div style={navItem}>Companies</div><div style={navItem}>Technicians</div><div style={navItem}>Invoices</div><div style={navItem}>Reports</div></nav>
      </aside>
      <main style={main}>
        <header style={topbar}>
          <div><h1 style={title}>Live Dispatch Command Center</h1><p style={subtitle}>Real-time road service operations dashboard</p></div>
          <div style={topActions}><button onClick={exportCSV} style={ghostBtn}>Export CSV</button><button onClick={() => signOut(auth)} style={ghostBtn}>Logout</button></div>
        </header>

        <section style={metricsGrid}>
          <Metric title="Active Records" value={summary.count} note="Current view" />
          <Metric title="In Progress" value={summary.inProgress} note="Active jobs" />
          <Metric title="Completed" value={summary.completed} note="Finished jobs" tone="green" />
          <Metric title="Canceled" value={summary.canceled} note="Lost / canceled" tone="red" />
          <Metric title="Total Revenue" value={money(summary.revenue)} note="Total bill" />
        </section>

        <section style={contentGrid}>
          <Panel title="Performance by City" action="Live">
            {cityRows.length === 0 ? <div style={muted}>No jobs yet.</div> : cityRows.map((row) => (
              <div key={row.city} style={cityLine}>
                <div style={cityTop}><div><strong>{row.city}</strong><div style={muted}>{money(row.revenue)} revenue</div></div><div style={{ textAlign: 'right' }}><strong>{row.total}</strong><div style={muted}>jobs</div></div></div>
                <div style={barTrack}><div style={{ width: `${(row.completed / Math.max(row.total, 1)) * 100}%`, background: '#16a34a' }} /><div style={{ width: `${(row.canceled / Math.max(row.total, 1)) * 100}%`, background: '#ef4444' }} /></div>
                <div style={cityFooter}>{row.completed} completed · {row.canceled} canceled</div>
              </div>
            ))}
          </Panel>
          <Panel title="Financial Summary" action="Current Filter">
            <div style={financeBox}><div style={bigMoney}>{money(summary.revenue)}</div><div style={{ ...muted, color: '#cbd5e1' }}>Total billed in current filter</div></div>
            <div style={financeRows}><FinanceRow label="Parts" value={money(summary.parts)} /><FinanceRow label="Tech Labor" value={money(summary.labor)} /><FinanceRow label="Pending Invoice" value={filtered.filter(j => j.invoiceStatus === 'PENDIENTE').length} /><FinanceRow label="Paid Jobs" value={filtered.filter(j => j.pago === 'PAID').length} /></div>
          </Panel>
        </section>

        <Panel title="Quick Dispatch Entry" action="Auto invoice enabled">
          <form onSubmit={addJob} style={formGrid}>
            <Field placeholder="Company" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Field placeholder="Location / City" value={form.location} onChange={(v) => setForm({ ...form, location: v })} />
            <Field placeholder="Tech" value={form.tech} onChange={(v) => setForm({ ...form, tech: v })} />
            <Field placeholder="Reference #" value={form.reference} onChange={(v) => setForm({ ...form, reference: v })} />
            <Field placeholder="Supervisor" value={form.supervisor} onChange={(v) => setForm({ ...form, supervisor: v })} />
            <Select value={form.status} onChange={(v) => setForm({ ...form, status: v })} options={['PENDING','IN PROGRESS','COMPLETED','CANCELED']} />
            <Field placeholder="Total Bill" value={form.total} onChange={(v) => setForm({ ...form, total: v })} />
            <Field placeholder="Parts" value={form.parts} onChange={(v) => setForm({ ...form, parts: v })} />
            <Field placeholder="Tech Labor" value={form.labor} onChange={(v) => setForm({ ...form, labor: v })} />
            <Field placeholder="Updates" value={form.updates} onChange={(v) => setForm({ ...form, updates: v })} />
            <button style={primaryBtn}>Add Job to Live Board</button>
          </form>
        </Panel>

        <section style={{ height: 18 }} />
        <Panel title="Live Dispatch Jobs" action={`${filtered.length} records`}>
          <div style={toolbar}>
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by city, company, tech, invoice, reference..." style={searchInput} />
            {['ALL','PENDING','IN PROGRESS','COMPLETED','CANCELED'].map(s => <button key={s} onClick={() => setStatusFilter(s)} style={statusFilter === s ? tabActive : tab}>{s}</button>)}
          </div>
          <div style={tableWrap}><table style={table}><thead><tr>{['DATE','TIME','INVOICE #','COMPANY','LOCATION','REFERENCE #','SUPERVISOR','STATUS','TECH','PAGO','INVOICE STATUS','TOTAL BILL','PARTS','TECH LABOR','UPDATES','ACTIONS'].map(h => <th key={h} style={th}>{h}</th>)}</tr></thead><tbody>{filtered.map((j, index) => <tr key={j.id} style={index % 2 ? trAlt : tr}><td style={tdOrange}>{j.date}</td><td style={td}>{j.time}</td><td style={td}>{j.invoice}</td><td style={tdStrong}>{j.company}</td><td style={td}>{j.location}</td><td style={td}>{j.reference}</td><td style={td}>{j.supervisor}</td><td style={td}><span style={badgeFor(j.status)}>{j.status}</span></td><td style={td}>{j.tech}</td><td style={td}>{j.pago}</td><td style={td}>{j.invoiceStatus}</td><td style={tdStrong}>{money(j.total)}</td><td style={td}>{money(j.parts)}</td><td style={td}>{money(j.labor)}</td><td style={td}>{j.updates}</td><td style={td}><select value={j.status} onChange={(e) => updateStatus(j.id, e.target.value)} style={miniSelect}>{['PENDING','IN PROGRESS','COMPLETED','CANCELED'].map(s => <option key={s}>{s}</option>)}</select><button onClick={() => deleteDoc(doc(db, 'jobs', j.id))} style={deleteBtn}>Delete</button></td></tr>)}</tbody></table></div>
        </Panel>
      </main>
    </div>
  );
}

function Metric({ title, value, note, tone }) { const color = tone === 'green' ? '#16a34a' : tone === 'red' ? '#ef4444' : '#0f172a'; return <div style={metricCard}><div style={metricTop}><span>{title}</span><span style={{ ...dot, background: color }} /></div><div style={{ ...metricValue, color }}>{value}</div><div style={muted}>{note}</div></div>; }
function Panel({ title, action, children }) { return <div style={panel}><div style={panelHeader}><h2 style={panelTitle}>{title}</h2><span style={panelAction}>{action}</span></div>{children}</div>; }
function Field({ placeholder, value, onChange }) { return <input placeholder={placeholder} value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle} />; }
function Select({ value, onChange, options }) { return <select value={value} onChange={(e) => onChange(e.target.value)} style={inputStyle}>{options.map(o => <option key={o}>{o}</option>)}</select>; }
function FinanceRow({ label, value }) { return <div style={financeRow}><span>{label}</span><strong>{value}</strong></div>; }
function badgeFor(status) { if (status === 'COMPLETED' || status === 'TERMINADO') return greenBadge; if (status === 'CANCELED' || status === 'CANCELADO') return redBadge; if (status === 'IN PROGRESS') return blueBadge; return yellowBadge; }

const centerPage = { minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Arial' };
const loginPage = { minHeight: '100vh', background: 'linear-gradient(135deg,#0f172a,#1e293b)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22, fontFamily: 'Arial, sans-serif' };
const loginCard = { width: '100%', maxWidth: 430, background: 'white', borderRadius: 26, padding: 30, boxShadow: '0 24px 70px rgba(0,0,0,.35)' };
const loginLogo = { width: 62, height: 62, borderRadius: 20, background: '#22c55e', color: '#052e16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 1000, fontSize: 22, marginBottom: 18 };
const loginTitle = { margin: 0, color: '#0f172a', fontSize: 28, fontWeight: 1000 };
const loginSub = { color: '#64748b', fontSize: 15, marginBottom: 22 };
const loginLabel = { display: 'block', fontSize: 13, color: '#334155', fontWeight: 900, margin: '14px 0 6px' };
const loginInput = { width: '100%', padding: '13px 14px', borderRadius: 14, border: '1px solid #cbd5e1', boxSizing: 'border-box', fontSize: 15, fontWeight: 700, background: '#f8fafc' };
const loginBtn = { width: '100%', border: 0, background: '#0f172a', color: 'white', padding: '14px 16px', borderRadius: 16, fontWeight: 1000, cursor: 'pointer', marginTop: 20, fontSize: 15 };
const errorBox = { marginTop: 12, background: '#fee2e2', color: '#991b1b', padding: 10, borderRadius: 12, fontWeight: 800 };
const page = { minHeight: '100vh', background: '#f3f6fb', color: '#111827', fontFamily: 'Arial, sans-serif', display: 'block', fontSize: 16 };
const sidebar = { background: '#0f172a', padding: 18, color: '#cbd5e1', boxSizing: 'border-box', width: '100%' };
const brandBox = { display: 'flex', gap: 12, alignItems: 'center', marginBottom: 22 };
const brandIcon = { width: 48, height: 48, borderRadius: 16, background: '#22c55e', color: '#052e16', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 1000 };
const brandTitle = { color: 'white', fontSize: 18, fontWeight: 900 };
const brandSub = { fontSize: 12, color: '#94a3b8' };
const nav = { display: 'flex', gap: 10, flexWrap: 'wrap' };
const navActive = { background: '#22c55e', color: '#052e16', padding: '12px 18px', borderRadius: 12, fontWeight: 900 };
const navItem = { padding: '12px 18px', borderRadius: 12, fontWeight: 800, color: 'white', background: 'rgba(255,255,255,.10)' };
const main = { padding: 22, overflow: 'visible' };
const topbar = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16, flexWrap: 'wrap', marginBottom: 20 };
const title = { margin: 0, fontSize: 32, fontWeight: 900, letterSpacing: '-.02em' };
const subtitle = { margin: '6px 0 0', color: '#475569', fontSize: 17 };
const topActions = { display: 'flex', gap: 10 };
const primaryBtn = { border: 0, background: '#0f172a', color: 'white', padding: '12px 16px', borderRadius: 14, fontWeight: 900, cursor: 'pointer', boxShadow: '0 10px 18px rgba(15,23,42,.16)' };
const ghostBtn = { border: '1px solid #cbd5e1', background: 'white', color: '#0f172a', padding: '10px 16px', borderRadius: 14, fontWeight: 900, cursor: 'pointer' };
const metricsGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginBottom: 20 };
const metricCard = { background: 'white', borderRadius: 22, padding: 18, boxShadow: '0 12px 30px rgba(15,23,42,.07)', border: '1px solid rgba(226,232,240,.9)' };
const metricTop = { display: 'flex', justifyContent: 'space-between', color: '#64748b', fontSize: 13, fontWeight: 800 };
const metricValue = { fontSize: 30, fontWeight: 900, marginTop: 10 };
const dot = { width: 10, height: 10, borderRadius: 99 };
const contentGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(320px,1fr))', gap: 18, marginBottom: 18 };
const panel = { background: 'white', borderRadius: 24, padding: 18, boxShadow: '0 12px 30px rgba(15,23,42,.07)', border: '1px solid rgba(226,232,240,.9)' };
const panelHeader = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, gap: 12 };
const panelTitle = { margin: 0, fontSize: 22, fontWeight: 900 };
const panelAction = { background: '#f1f5f9', color: '#475569', padding: '6px 10px', borderRadius: 999, fontSize: 12, fontWeight: 900 };
const muted = { color: '#475569', fontSize: 14, marginTop: 4 };
const cityLine = { padding: '12px 0', borderBottom: '1px solid #eef2f7' };
const cityTop = { display: 'flex', justifyContent: 'space-between', gap: 12 };
const barTrack = { height: 13, background: '#e2e8f0', borderRadius: 999, overflow: 'hidden', marginTop: 10, display: 'flex' };
const cityFooter = { color: '#64748b', fontSize: 12, marginTop: 6 };
const financeBox = { borderRadius: 20, padding: 18, background: 'linear-gradient(135deg,#0f172a,#334155)', color: 'white', marginBottom: 14 };
const bigMoney = { fontSize: 32, fontWeight: 1000 };
const financeRows = { display: 'grid', gap: 10 };
const financeRow = { display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eef2f7', paddingBottom: 10, color: '#334155' };
const formGrid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))', gap: 10 };
const inputStyle = { width: '100%', padding: '12px 13px', borderRadius: 14, border: '1px solid #cbd5e1', outline: 'none', boxSizing: 'border-box', background: '#f8fafc', fontWeight: 700 };
const toolbar = { display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 };
const searchInput = { ...inputStyle, maxWidth: 460, background: 'white' };
const tab = { border: '1px solid #cbd5e1', background: '#fff', padding: '10px 13px', borderRadius: 13, fontWeight: 900, cursor: 'pointer' };
const tabActive = { ...tab, background: '#0f172a', color: 'white', border: '1px solid #0f172a' };
const tableWrap = { overflowX: 'auto', borderRadius: 16, border: '1px solid #e2e8f0' };
const table = { width: '100%', borderCollapse: 'collapse', fontSize: 15, background: 'white' };
const th = { padding: '14px 12px', textAlign: 'left', whiteSpace: 'nowrap', fontSize: 13, letterSpacing: '.03em', background: '#bbf7d0', color: '#064e3b', borderBottom: '2px solid #86efac' };
const tr = { background: 'white' };
const trAlt = { background: '#f8fafc' };
const td = { padding: '14px 12px', borderTop: '1px solid #dbe3ee', whiteSpace: 'nowrap', fontSize: 15 };
const tdStrong = { ...td, fontWeight: 900 };
const tdOrange = { ...td, color: '#ea580c', fontWeight: 1000 };
const greenBadge = { background: '#dcfce7', color: '#166534', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
const redBadge = { background: '#fee2e2', color: '#991b1b', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
const blueBadge = { background: '#dbeafe', color: '#1d4ed8', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
const yellowBadge = { background: '#fef3c7', color: '#92400e', padding: '7px 11px', borderRadius: 999, fontWeight: 900, fontSize: 13 };
const miniSelect = { padding: 8, borderRadius: 10, border: '1px solid #cbd5e1', fontWeight: 800, marginRight: 8 };
const deleteBtn = { border: 0, background: '#fee2e2', color: '#991b1b', padding: '8px 10px', borderRadius: 10, fontWeight: 900, cursor: 'pointer' };
