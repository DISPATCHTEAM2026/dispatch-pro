
import React, { useMemo, useState } from "react";

const initialJobs = [
  { date: "04/26/2026", time: "1:54 PM", invoice: "DA-1984-95", company: "S&R", location: "EL PASO, TX", reference: "TRK#77 TRL#U90350", supervisor: "DANIEL / JOSE", status: "TERMINADO", priority: "NORMAL", tech: "MARIO ELP", pago: "PAID", invoiceStatus: "PAID ZELLE (A)", total: 1473.8, parts: 60.61, labor: 350 },
  { date: "04/26/2026", time: "2:45 PM", invoice: "", company: "(651) 214-6844", location: "ALBUQUERQUE, NM", reference: "", supervisor: "DANIEL", status: "CANCELADO", priority: "LOW", tech: "", pago: "", invoiceStatus: "", total: 0, parts: 0, labor: 0 },
  { date: "04/26/2026", time: "4:41 PM", invoice: "", company: "REH LOGISTIC", location: "FORT STOCKTON, TX", reference: "TRK #22", supervisor: "JOSE", status: "CANCELADO", priority: "NORMAL", tech: "", pago: "", invoiceStatus: "", total: 0, parts: 0, labor: 0 },
  { date: "04/27/2026", time: "5:37 AM", invoice: "C-1994-93", company: "AMAZON", location: "EL PASO, TX", reference: "REF# BM375210", supervisor: "CRIS/DANIEL", status: "TERMINADO", priority: "HIGH", tech: "MARIO ELP", pago: "PAID", invoiceStatus: "PENDIENTE", total: 1770.28, parts: 156.96, labor: 430 }
];

function money(value) {
  return Number(value || 0).toLocaleString("en-US", { style: "currency", currency: "USD" });
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loginEmail, setLoginEmail] = useState("dispatcher@roadservice.com");
  const [userRole, setUserRole] = useState("Dispatcher");
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [form, setForm] = useState({ company: "", location: "", tech: "", reference: "", supervisor: "", total: "", parts: "", labor: "" });

  const filtered = useMemo(() => jobs.filter((job) => {
    const text = `${job.company} ${job.location} ${job.tech} ${job.invoice} ${job.reference} ${job.supervisor}`.toLowerCase();
    return text.includes(search.toLowerCase()) && (statusFilter === "ALL" || job.status === statusFilter);
  }), [jobs, search, statusFilter]);

  const summary = useMemo(() => {
    const completed = filtered.filter((j) => j.status === "TERMINADO").length;
    const canceled = filtered.filter((j) => j.status === "CANCELADO").length;
    const revenue = filtered.reduce((sum, j) => sum + Number(j.total || 0), 0);
    const parts = filtered.reduce((sum, j) => sum + Number(j.parts || 0), 0);
    const labor = filtered.reduce((sum, j) => sum + Number(j.labor || 0), 0);
    return { completed, canceled, revenue, parts, labor, count: filtered.length };
  }, [filtered]);

  function addJob() {
    if (!form.company || !form.location) return;
    const now = new Date();
    const job = {
      date: now.toLocaleDateString("en-US"),
      time: now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" }),
      invoice: `NEW-${Math.floor(Math.random() * 9000 + 1000)}`,
      company: form.company.toUpperCase(),
      location: form.location.toUpperCase(),
      reference: form.reference,
      supervisor: form.supervisor || "DISPATCH",
      status: "TERMINADO",
      priority: "HIGH",
      tech: form.tech.toUpperCase(),
      pago: "PENDING",
      invoiceStatus: "PENDIENTE",
      total: Number(form.total || 0),
      parts: Number(form.parts || 0),
      labor: Number(form.labor || 0)
    };
    setJobs([job, ...jobs]);
    setForm({ company: "", location: "", tech: "", reference: "", supervisor: "", total: "", parts: "", labor: "" });
  }

  if (!isLoggedIn) {
    return (
      <div style={loginPage}>
        <div style={loginCard}>
          <div style={loginLogo}>RS</div>
          <h1>Road Service Dispatch Pro</h1>
          <p style={{color:"#64748b"}}>Secure access for dispatchers, admin and office team.</p>
          <label style={label}>Email</label>
          <input value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} style={input} />
          <label style={label}>Password</label>
          <input type="password" value="password123" readOnly style={input} />
          <label style={label}>Role Preview</label>
          <select value={userRole} onChange={(e) => setUserRole(e.target.value)} style={input}>
            <option>Admin</option><option>Dispatcher</option><option>Viewer</option>
          </select>
          <button onClick={() => setIsLoggedIn(true)} style={primaryFull}>Sign In</button>
          <p style={{textAlign:"center", color:"#64748b", fontSize:12}}>Demo login preview</p>
        </div>
      </div>
    );
  }

  return (
    <div style={page}>
      <header style={header}>
        <div>
          <h1 style={{margin:0}}>Live Dispatch Command Center</h1>
          <p style={{margin:"6px 0 0", color:"#475569"}}>Road Service Truck & Trailer · {userRole}</p>
        </div>
        <button onClick={() => setIsLoggedIn(false)} style={ghost}>Logout</button>
      </header>

      <section style={grid}>
        <Metric title="Active Records" value={summary.count} />
        <Metric title="Completed" value={summary.completed} color="#16a34a" />
        <Metric title="Canceled" value={summary.canceled} color="#dc2626" />
        <Metric title="Total Revenue" value={money(summary.revenue)} />
        <Metric title="Tech Labor" value={money(summary.labor)} />
      </section>

      <Panel title="Quick Dispatch Entry">
        <div style={formGrid}>
          {["company","location","tech","reference","supervisor","total","parts","labor"].map(k => (
            <input key={k} placeholder={k.toUpperCase()} value={form[k]} onChange={(e)=>setForm({...form,[k]:e.target.value})} style={input} />
          ))}
        </div>
        <button onClick={addJob} style={{...primary, marginTop:14}}>Add Job to Live Board</button>
      </Panel>

      <Panel title="Live Dispatch Jobs">
        <div style={{display:"flex", gap:8, flexWrap:"wrap", marginBottom:14}}>
          <input placeholder="Search city, company, tech..." value={search} onChange={(e)=>setSearch(e.target.value)} style={{...input, maxWidth:380}} />
          <button onClick={()=>setStatusFilter("ALL")} style={statusFilter==="ALL"?primary:ghost}>All</button>
          <button onClick={()=>setStatusFilter("TERMINADO")} style={statusFilter==="TERMINADO"?primary:ghost}>Terminados</button>
          <button onClick={()=>setStatusFilter("CANCELADO")} style={statusFilter==="CANCELADO"?primary:ghost}>Cancelados</button>
        </div>
        <div style={{overflowX:"auto"}}>
          <table style={table}>
            <thead><tr>{["DATE","TIME","INVOICE #","COMPANY","LOCATION","REFERENCE #","SUPERVISOR","STATUS","PRIORITY","TECH","PAGO MECANICO","INVOICE STATUS","TOTAL BILL","PARTS","TECH LABOR"].map(h=><th key={h} style={th}>{h}</th>)}</tr></thead>
            <tbody>{filtered.map((j,i)=><tr key={i}>
              <td style={td}>{j.date}</td><td style={td}>{j.time}</td><td style={td}>{j.invoice}</td><td style={td}>{j.company}</td><td style={td}>{j.location}</td><td style={td}>{j.reference}</td><td style={td}>{j.supervisor}</td>
              <td style={td}><span style={j.status==="TERMINADO"?green:red}>{j.status}</span></td>
              <td style={td}>{j.priority}</td><td style={td}>{j.tech}</td><td style={td}>{j.pago}</td><td style={td}>{j.invoiceStatus}</td><td style={td}>{money(j.total)}</td><td style={td}>{money(j.parts)}</td><td style={td}>{money(j.labor)}</td>
            </tr>)}</tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
}

function Metric({title,value,color="#0f172a"}) { return <div style={card}><div style={{color:"#64748b", fontWeight:800}}>{title}</div><div style={{fontSize:28,fontWeight:900,color}}>{value}</div></div> }
function Panel({title,children}) { return <div style={panel}><h2>{title}</h2>{children}</div> }

const loginPage={minHeight:"100vh",background:"linear-gradient(135deg,#0f172a,#1e293b)",display:"flex",alignItems:"center",justifyContent:"center",padding:22,fontFamily:"Arial"};
const loginCard={width:"100%",maxWidth:430,background:"white",borderRadius:26,padding:30,boxShadow:"0 24px 70px rgba(0,0,0,.35)"};
const loginLogo={width:62,height:62,borderRadius:20,background:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:1000,fontSize:22};
const page={minHeight:"100vh",background:"#f3f6fb",fontFamily:"Arial",padding:24,color:"#111827"};
const header={display:"flex",justifyContent:"space-between",alignItems:"center",gap:16,flexWrap:"wrap",marginBottom:20};
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(190px,1fr))",gap:14,marginBottom:18};
const card={background:"white",borderRadius:20,padding:18,boxShadow:"0 12px 30px rgba(15,23,42,.07)"};
const panel={background:"white",borderRadius:22,padding:18,boxShadow:"0 12px 30px rgba(15,23,42,.07)",marginBottom:18};
const formGrid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(170px,1fr))",gap:10};
const input={width:"100%",padding:"12px 13px",borderRadius:14,border:"1px solid #cbd5e1",boxSizing:"border-box",fontWeight:700};
const primary={border:0,background:"#0f172a",color:"white",padding:"11px 16px",borderRadius:14,fontWeight:900,cursor:"pointer"};
const primaryFull={...primary,width:"100%",marginTop:20};
const ghost={border:"1px solid #cbd5e1",background:"white",color:"#0f172a",padding:"10px 16px",borderRadius:14,fontWeight:900,cursor:"pointer"};
const label={display:"block",fontSize:13,color:"#334155",fontWeight:900,margin:"14px 0 6px"};
const table={width:"100%",borderCollapse:"collapse",fontSize:14,background:"white"};
const th={padding:"12px 10px",textAlign:"left",whiteSpace:"nowrap",background:"#bbf7d0",color:"#064e3b"};
const td={padding:"12px 10px",borderTop:"1px solid #e2e8f0",whiteSpace:"nowrap"};
const green={background:"#dcfce7",color:"#166534",padding:"6px 9px",borderRadius:999,fontWeight:900};
const red={background:"#fee2e2",color:"#991b1b",padding:"6px 9px",borderRadius:999,fontWeight:900};
