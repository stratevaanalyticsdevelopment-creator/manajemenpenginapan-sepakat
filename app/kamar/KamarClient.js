"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { rupiah } from "@/lib/format";
import { uploadFotoKamar } from "@/lib/supabaseClient";

const DEF = { tipe:"Standard", status:"Tersedia", lantai:1, kapasitas:2, harga:350000, fotoUrl:"" };

export default function KamarClient({ user }) {
  const [kamar,   setKamar]   = useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(DEF);
  const [saving,  setSaving]  = useState(false);
  const [uploading,setUploading]=useState(false);
  const [err,     setErr]     = useState("");

  async function load() {
    const r = await fetch("/api/kamar");
    setKamar((await r.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const q = search.toLowerCase();
  const filtered = kamar.filter(k=>String(k.nomor).includes(search)||k.tipe.toLowerCase().includes(q)||k.status.toLowerCase().includes(q));

  function openAdd()  { setForm(DEF); setErr(""); setModal("add"); }
  function openEdit(k){ setForm({...k}); setErr(""); setModal("edit"); }
  function close()    { setModal(null); setForm(DEF); }

  async function handleFoto(file) {
    if (!file) return;
    if (!file.type.startsWith("image/")) { alert("File harus berupa gambar"); return; }
    if (file.size > 5*1024*1024) { alert("Ukuran maks 5MB"); return; }
    setUploading(true);
    try {
      const url = await uploadFotoKamar(file, form.id || Date.now());
      setForm(f=>({...f, fotoUrl:url}));
    } catch(e) {
      // fallback: simpan sebagai base64 (offline)
      const reader = new FileReader();
      reader.onload = ev => setForm(f=>({...f, fotoUrl:ev.target.result}));
      reader.readAsDataURL(file);
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true); setErr("");
    const url = modal==="add" ? "/api/kamar" : `/api/kamar/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus kamar ini?")) return;
    await fetch(`/api/kamar/${id}`,{method:"DELETE"}); load();
  }

  return (
    <AppShell user={user} pageTitle="🛏 Kamar" search={search} onSearchChange={setSearch}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>🛏 Kamar</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Tambah Kamar</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>Foto</th><th>ID</th><th>No.</th><th>Tipe</th><th>Harga/Malam</th><th>Status</th><th>Lantai</th><th>Kap.</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Tidak ada data</td></tr>
            : filtered.map(k=>(
              <tr key={k.id}>
                <td>{k.fotoUrl ? <img className="foto-thumb" src={k.fotoUrl} alt=""/> : <div className="foto-placeholder">📷</div>}</td>
                <td style={{fontSize:11,color:"#94A3B8"}}>{k.id.slice(0,8)}</td>
                <td style={{fontWeight:800,fontSize:15}}>{k.nomor}</td>
                <td>{k.tipe}</td>
                <td style={{fontWeight:600,color:"#0546AB"}}>{rupiah(k.harga)}</td>
                <td><Badge label={k.status}/></td>
                <td>{k.lantai}</td>
                <td>{k.kapasitas}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(k)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(k.id)}>Hapus</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="add"?"Tambah Kamar":"Edit Kamar"} onClose={close}>
          <div className="field">
            <label>Foto Kamar</label>
            <div className="foto-preview-wrap">
              {form.fotoUrl ? <img className="foto-preview" src={form.fotoUrl} alt=""/> : <div className="foto-preview-placeholder">📷</div>}
              <div style={{flex:1}}>
                <input type="file" accept="image/*" onChange={e=>handleFoto(e.target.files[0])} style={{fontSize:12.5}}/>
                {uploading && <div style={{fontSize:12,color:"#64748B",marginTop:4}}>Mengupload...</div>}
                {form.fotoUrl && <button type="button" onClick={()=>setForm(f=>({...f,fotoUrl:""}))} style={{fontSize:11,color:"#B91C1C",background:"none",border:"none",cursor:"pointer",marginTop:4,padding:0}}>Hapus foto</button>}
              </div>
            </div>
          </div>
          <div className="field"><label>Nomor Kamar *</label><input type="number" value={form.nomor||""} onChange={e=>setForm(f=>({...f,nomor:+e.target.value}))}/></div>
          <div className="field"><label>Tipe Kamar</label><select value={form.tipe} onChange={e=>setForm(f=>({...f,tipe:e.target.value}))}><option>Standard</option><option>Deluxe</option><option>Suite</option></select></div>
          <div className="field"><label>Harga/Malam (Rp)</label><input type="number" value={form.harga||""} onChange={e=>setForm(f=>({...f,harga:+e.target.value}))}/></div>
          <div className="field"><label>Status</label><select value={form.status} onChange={e=>setForm(f=>({...f,status:e.target.value}))}><option>Tersedia</option><option>Terisi</option><option>Maintenance</option></select></div>
          <div className="field-row">
            <div className="field"><label>Lantai</label><input type="number" value={form.lantai||""} onChange={e=>setForm(f=>({...f,lantai:+e.target.value}))}/></div>
            <div className="field"><label>Kapasitas</label><input type="number" value={form.kapasitas||""} onChange={e=>setForm(f=>({...f,kapasitas:+e.target.value}))}/></div>
          </div>
          <div className="field"><label>Fasilitas</label><input value={form.fasilitas||""} onChange={e=>setForm(f=>({...f,fasilitas:e.target.value}))}/></div>
          {err && <div className="error-box">{err}</div>}
          <div className="form-btns">
            <button className="btn btn-outline" onClick={close}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving||uploading}>{saving?"Menyimpan...":"Simpan"}</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
