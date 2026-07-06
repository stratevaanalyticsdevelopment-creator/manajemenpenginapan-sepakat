"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Modal from "@/components/Modal";
import { unEnum } from "@/lib/format";

const DEF = { jk:"Laki_laki" };

export default function TamuClient({ user }) {
  const [tamu,    setTamu]    = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(DEF);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  async function load() {
    const r = await fetch("/api/tamu");
    setTamu((await r.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const q = search.toLowerCase();
  const filtered = tamu.filter(t=>t.nama.toLowerCase().includes(q)||(t.kota||"").toLowerCase().includes(q)||(t.ktp||"").includes(search));

  function openAdd()  { setForm(DEF); setErr(""); setModal("add"); }
  function openEdit(t){ setForm({...t}); setErr(""); setModal("edit"); }
  function close()    { setModal(null); setForm(DEF); }

  async function handleSave() {
    setSaving(true); setErr("");
    const url = modal==="add" ? "/api/tamu" : `/api/tamu/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus data tamu ini?")) return;
    const r = await fetch(`/api/tamu/${id}`,{method:"DELETE"});
    if (r.ok) load(); else { const d=await r.json(); alert(d.error||"Gagal menghapus"); }
  }

  return (
    <AppShell user={user} pageTitle="👤 Data Tamu" search={search} onSearchChange={setSearch}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>👤 Data Tamu</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Tambah Tamu</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Nama</th><th>No. KTP</th><th>J.K.</th><th>HP</th><th>Email</th><th>Kota</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={8} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={8} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Tidak ada data</td></tr>
            : filtered.map(t=>(
              <tr key={t.id}>
                <td style={{fontSize:11,color:"#94A3B8"}}>{t.id.slice(0,8)}</td>
                <td style={{fontWeight:600}}>{t.nama}</td>
                <td style={{fontSize:12}}>{t.ktp}</td>
                <td>{unEnum(t.jk)}</td>
                <td>{t.hp}</td>
                <td style={{color:"#0546AB"}}>{t.email}</td>
                <td>{t.kota}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(t)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(t.id)}>Hapus</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="add"?"Tambah Tamu":"Edit Tamu"} onClose={close}>
          <div className="field"><label>Nama Lengkap *</label><input value={form.nama||""} onChange={e=>setForm(f=>({...f,nama:e.target.value}))}/></div>
          <div className="field"><label>No. KTP / Paspor</label><input value={form.ktp||""} onChange={e=>setForm(f=>({...f,ktp:e.target.value}))}/></div>
          <div className="field-row">
            <div className="field"><label>Jenis Kelamin</label>
              <select value={form.jk||"Laki_laki"} onChange={e=>setForm(f=>({...f,jk:e.target.value}))}>
                <option value="Laki_laki">Laki-laki</option><option value="Perempuan">Perempuan</option>
              </select>
            </div>
            <div className="field"><label>No. HP</label><input value={form.hp||""} onChange={e=>setForm(f=>({...f,hp:e.target.value}))}/></div>
          </div>
          <div className="field"><label>Email</label><input type="email" value={form.email||""} onChange={e=>setForm(f=>({...f,email:e.target.value}))}/></div>
          <div className="field"><label>Kota</label><input value={form.kota||""} onChange={e=>setForm(f=>({...f,kota:e.target.value}))}/></div>
          <div className="field"><label>Catatan</label><input value={form.catatan||""} onChange={e=>setForm(f=>({...f,catatan:e.target.value}))}/></div>
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
