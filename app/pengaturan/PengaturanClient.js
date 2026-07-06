"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";

const ROLE_ACCESS = {
  Admin:["dashboard","kamar","tamu","reservasi","pembayaran","housekeeping","billing","laporan","pengaturan"],
  Resepsionis:["dashboard","kamar","tamu","reservasi","pembayaran","billing"],
  Housekeeping:["dashboard","housekeeping"],
};
const ALL_MENU=[
  {key:"dashboard",icon:"⊞",label:"Dashboard"},{key:"kamar",icon:"🛏",label:"Kamar"},
  {key:"tamu",icon:"👤",label:"Tamu"},{key:"reservasi",icon:"📅",label:"Reservasi"},
  {key:"pembayaran",icon:"💰",label:"Pembayaran"},{key:"housekeeping",icon:"🧹",label:"Housekeeping"},
  {key:"billing",icon:"🧾",label:"Print Billing"},{key:"laporan",icon:"📊",label:"Laporan Keuangan"},
  {key:"pengaturan",icon:"⚙️",label:"Pengaturan Akses"},
];
const ROLE_DESC={Admin:"Akses penuh semua menu termasuk Laporan Keuangan dan Pengaturan Akses.",Resepsionis:"Akses ke Dashboard, Kamar, Tamu, Reservasi, Pembayaran, dan Billing.",Housekeeping:"Akses hanya ke Dashboard dan Housekeeping."};
const ROLE_COLOR={Admin:["#FFFBEB","#92400E"],Resepsionis:["#EFF6FF","#1E3A8A"],Housekeeping:["#F5F3FF","#4C1D95"]};

export default function PengaturanClient({ user }) {
  const [users,   setUsers]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState({role:"Resepsionis"});
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  async function load() {
    const r = await fetch("/api/users");
    setUsers((await r.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  function openAdd()  { setForm({role:"Resepsionis"}); setErr(""); setModal("add"); }
  function openEdit(u){ setForm({id:u.id,nama:u.nama,username:u.username,role:u.role,password:""}); setErr(""); setModal("edit"); }
  function close()    { setModal(null); setForm({role:"Resepsionis"}); }

  async function handleSave() {
    setSaving(true); setErr("");
    const url = modal==="add" ? "/api/users" : `/api/users/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleToggle(id) {
    await fetch(`/api/users/${id}`,{method:"PATCH"}); load();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus pengguna ini?")) return;
    const r = await fetch(`/api/users/${id}`,{method:"DELETE"});
    if (r.ok) load(); else { const d=await r.json(); alert(d.error||"Gagal"); }
  }

  return (
    <AppShell user={user} pageTitle="⚙️ Pengaturan Akses" showSearch={false}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>⚙️ Pengaturan Akses</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Tambah Pengguna</button>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:12,marginBottom:14}}>
        {["Admin","Resepsionis","Housekeeping"].map(role=>(
          <div key={role} style={{background:ROLE_COLOR[role][0],border:`1px solid ${ROLE_COLOR[role][1]}33`,borderRadius:11,padding:13}}>
            <div style={{marginBottom:7}}><Badge label={role}/></div>
            <div style={{fontSize:12,color:"#374151",lineHeight:1.5,marginBottom:8}}>{ROLE_DESC[role]}</div>
            <div style={{fontSize:11,color:ROLE_COLOR[role][1],fontWeight:700}}>{users.filter(u=>u.role===role&&u.aktif).length} pengguna aktif</div>
          </div>
        ))}
      </div>

      <div className="card" style={{marginBottom:13}}>
        <div className="card-header">👥 Daftar Pengguna</div>
        <table>
          <thead><tr><th>ID</th><th>Nama</th><th>Username</th><th>Role</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={6} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : users.map(u=>(
              <tr key={u.id}>
                <td style={{fontSize:11,color:"#94A3B8"}}>{u.id.slice(0,8)}</td>
                <td style={{fontWeight:600}}>{u.nama}</td>
                <td style={{fontSize:12}}>{u.username}</td>
                <td><Badge label={u.role}/></td>
                <td><Badge label={u.aktif?"Aktif":"Nonaktif"}/></td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(u)}>Edit</button>
                  <button className="btn btn-sm" style={{background:"#FEF3C7",color:"#92400E",border:"none"}} onClick={()=>handleToggle(u.id)}>{u.aktif?"Nonaktifkan":"Aktifkan"}</button>
                  {u.id!==user.id && <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(u.id)}>Hapus</button>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="card">
        <div className="card-header">🔐 Tabel Hak Akses per Role</div>
        <table>
          <thead><tr><th>Menu</th><th style={{textAlign:"center"}}>Admin</th><th style={{textAlign:"center"}}>Resepsionis</th><th style={{textAlign:"center"}}>Housekeeping</th></tr></thead>
          <tbody>
            {ALL_MENU.map(m=>(
              <tr key={m.key}>
                <td>{m.icon} {m.label}</td>
                {["Admin","Resepsionis","Housekeeping"].map(r=>(
                  <td key={r} style={{textAlign:"center"}}>
                    {ROLE_ACCESS[r].includes(m.key)
                      ? <span style={{color:"#10B981",fontSize:16,fontWeight:700}}>✓</span>
                      : <span style={{color:"#D1D5DB",fontSize:16}}>✗</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal title={modal==="add"?"Tambah Pengguna":"Edit Pengguna"} onClose={close}>
          <div className="field"><label>Nama Lengkap *</label><input value={form.nama||""} onChange={e=>setForm(f=>({...f,nama:e.target.value}))}/></div>
          <div className="field-row">
            <div className="field"><label>Username *</label><input value={form.username||""} onChange={e=>setForm(f=>({...f,username:e.target.value}))}/></div>
            <div className="field"><label>Password {modal==="edit"?"(kosongkan jika tetap)":"*"}</label><input type="password" value={form.password||""} onChange={e=>setForm(f=>({...f,password:e.target.value}))}/></div>
          </div>
          <div className="field"><label>Role</label>
            <select value={form.role||"Resepsionis"} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
              <option>Admin</option><option>Resepsionis</option><option>Housekeeping</option>
            </select>
          </div>
          <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:7,padding:"9px 11px",marginBottom:12,fontSize:12,color:"#64748B"}}>
            <b style={{color:"#374151"}}>Akses {form.role||"Resepsionis"}:</b> {(ROLE_ACCESS[form.role||"Resepsionis"]||[]).join(", ")}
          </div>
          {err && <div className="error-box">{err}</div>}
          <div className="form-btns">
            <button className="btn btn-outline" onClick={close}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving?"Menyimpan...":"Simpan"}</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
