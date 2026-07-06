"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { tglPendek } from "@/lib/format";

const DEF = { status:"Pending", prioritas:"Normal", tgl:new Date().toISOString().slice(0,10) };

export default function HousekeepingClient({ user }) {
  const [hk,      setHk]      = useState([]);
  const [kamarList,setKamarList]=useState([]);
  const [search,  setSearch]  = useState("");
  const [loading, setLoading] = useState(true);
  const [modal,   setModal]   = useState(null);
  const [form,    setForm]    = useState(DEF);
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState("");

  async function load() {
    const [h,k] = await Promise.all([fetch("/api/housekeeping"),fetch("/api/kamar")]);
    setHk((await h.json()).data||[]);
    setKamarList((await k.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const q = search.toLowerCase();
  const filtered = hk.filter(h=>h.jenis.toLowerCase().includes(q)||h.status.toLowerCase().includes(q)||(h.petugas||"").toLowerCase().includes(q)||String(h.kamar?.nomor||"").includes(search));

  function openAdd()  { setForm(DEF); setErr(""); setModal("add"); }
  function openEdit(h){ setForm({id:h.id,kamarId:h.kamarId,jenis:h.jenis,status:h.status,petugas:h.petugas||"",tgl:tglPendek(h.tgl),prioritas:h.prioritas,catatan:h.catatan||""}); setErr(""); setModal("edit"); }
  function close()    { setModal(null); setForm(DEF); }

  async function handleSave() {
    setSaving(true); setErr("");
    const url = modal==="add" ? "/api/housekeeping" : `/api/housekeeping/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus tugas ini?")) return;
    const r = await fetch(`/api/housekeeping/${id}`,{method:"DELETE"});
    if (r.ok) load(); else { const d=await r.json(); alert(d.error||"Gagal"); }
  }

  return (
    <AppShell user={user} pageTitle="🧹 Housekeeping" search={search} onSearchChange={setSearch}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
        <div className="page-title" style={{margin:0}}>🧹 Housekeeping</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Tambah Tugas</button>
      </div>
      <div className="hk-counters">
        {[["Pending","#FEF3C7","#92400E"],["Proses","#EDE9FE","#4C1D95"],["Selesai","#D1FAE5","#065F46"]].map(([s,bg,c])=>(
          <div key={s} className="hk-count" style={{background:bg,color:c}}>{hk.filter(h=>h.status===s).length} {s}</div>
        ))}
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Kamar</th><th>Jenis</th><th>Status</th><th>Petugas</th><th>Tgl</th><th>Prioritas</th><th>Catatan</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Tidak ada data</td></tr>
            : filtered.map(h=>(
              <tr key={h.id}>
                <td style={{fontSize:11,color:"#94A3B8"}}>{h.id.slice(0,8)}</td>
                <td style={{fontWeight:700}}>No. {h.kamar?.nomor}</td>
                <td>{h.jenis}</td>
                <td><Badge label={h.status}/></td>
                <td>{h.petugas}</td>
                <td>{tglPendek(h.tgl)}</td>
                <td><Badge label={h.prioritas}/></td>
                <td style={{color:"#64748B",fontSize:12}}>{h.catatan}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(h)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(h.id)}>Hapus</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="add"?"Tambah Tugas":"Edit Tugas"} onClose={close}>
          <div className="field"><label>Kamar *</label>
            <select value={form.kamarId||""} onChange={e=>setForm(f=>({...f,kamarId:e.target.value}))}>
              <option value="">-- Pilih Kamar --</option>
              {kamarList.map(k=><option key={k.id} value={k.id}>No. {k.nomor} — {k.tipe}</option>)}
            </select>
          </div>
          <div className="field"><label>Jenis Tugas</label>
            <select value={form.jenis||"Pembersihan Kamar"} onChange={e=>setForm(f=>({...f,jenis:e.target.value}))}>
              <option>Pembersihan Kamar</option><option>Ganti Linen</option><option>Laundry</option><option>Perbaikan</option><option>Pemeriksaan</option>
            </select>
          </div>
          <div className="field-row">
            <div className="field"><label>Status</label>
              <select value={form.status||"Pending"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
                <option>Pending</option><option>Proses</option><option>Selesai</option>
              </select>
            </div>
            <div className="field"><label>Prioritas</label>
              <select value={form.prioritas||"Normal"} onChange={e=>setForm(f=>({...f,prioritas:e.target.value}))}>
                <option>Tinggi</option><option>Normal</option><option>Rendah</option>
              </select>
            </div>
          </div>
          <div className="field"><label>Petugas</label><input value={form.petugas||""} onChange={e=>setForm(f=>({...f,petugas:e.target.value}))}/></div>
          <div className="field"><label>Tanggal</label><input type="date" value={form.tgl||""} onChange={e=>setForm(f=>({...f,tgl:e.target.value}))}/></div>
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
