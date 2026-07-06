"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { rupiah, tglPendek, selisihHari, unEnum } from "@/lib/format";

const DEF = { status:"Lunas", metode:"Transfer Bank", tglBayar:new Date().toISOString().slice(0,10) };

export default function PembayaranClient({ user }) {
  const router = useRouter();
  const [pembayaran,  setPembayaran]  = useState([]);
  const [reservasiList,setReservasiList]=useState([]);
  const [search,      setSearch]      = useState("");
  const [loading,     setLoading]     = useState(true);
  const [modal,       setModal]       = useState(null);
  const [form,        setForm]        = useState(DEF);
  const [saving,      setSaving]      = useState(false);
  const [err,         setErr]         = useState("");

  async function load() {
    const [p,r] = await Promise.all([fetch("/api/pembayaran"),fetch("/api/reservasi")]);
    setPembayaran((await p.json()).data||[]);
    setReservasiList((await r.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  function hitungTagihan(resId, excludeId) {
    const r = reservasiList.find(x=>x.id===resId);
    if (!r) return { total:0, sudahBayar:0, sisa:0 };
    const ml    = selisihHari(r.checkIn,r.checkOut);
    const total = ml*(r.kamar?.harga||0);
    const sudah = pembayaran.filter(p=>p.reservasiId===resId&&p.id!==excludeId).reduce((s,p)=>s+p.jumlah,0);
    const sisa  = total-sudah;
    return { total, sudahBayar:sudah, sisa:sisa>0?sisa:0 };
  }

  function pilihReservasi(resId) {
    if (!resId) { setForm(f=>({...f,reservasiId:""})); return; }
    const info = hitungTagihan(resId, modal==="edit"?form.id:null);
    setForm(f=>({...f, reservasiId:resId, jumlah:info.sisa>0?info.sisa:info.total}));
  }

  const q = search.toLowerCase();
  const filtered = pembayaran.filter(p=>(p.reservasi?.tamu?.nama||"").toLowerCase().includes(q)||unEnum(p.status).toLowerCase().includes(q)||unEnum(p.metode).toLowerCase().includes(q));
  const totalLunas = pembayaran.filter(p=>p.status==="Lunas").reduce((s,p)=>s+p.jumlah,0);

  function openAdd()  { setForm(DEF); setErr(""); setModal("add"); }
  function openEdit(p){ setForm({id:p.id,reservasiId:p.reservasiId,tglBayar:tglPendek(p.tglBayar),jumlah:p.jumlah,metode:unEnum(p.metode),status:unEnum(p.status),noRef:p.noRef||""}); setErr(""); setModal("edit"); }
  function close()    { setModal(null); setForm(DEF); }

  async function handleSave() {
    setSaving(true); setErr("");
    const url = modal==="add" ? "/api/pembayaran" : `/api/pembayaran/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(form) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus pembayaran ini?")) return;
    const r = await fetch(`/api/pembayaran/${id}`,{method:"DELETE"});
    if (r.ok) load(); else { const d=await r.json(); alert(d.error||"Gagal"); }
  }

  return (
    <AppShell user={user} pageTitle="💰 Pembayaran" search={search} onSearchChange={setSearch}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>💰 Pembayaran</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Tambah Pembayaran</button>
      </div>
      <div className="banner">
        <div style={{fontSize:12,opacity:.7,marginBottom:3}}>Total Pendapatan (Lunas)</div>
        <div style={{fontSize:26,fontWeight:800}}>{rupiah(totalLunas)}</div>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Reservasi</th><th>Tamu</th><th>Tgl Bayar</th><th>Jumlah</th><th>Metode</th><th>Status</th><th>No. Ref</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Tidak ada data</td></tr>
            : filtered.map(p=>(
              <tr key={p.id}>
                <td style={{fontSize:11,color:"#94A3B8"}}>{p.id.slice(0,8)}</td>
                <td style={{fontSize:12}}>{p.reservasiId.slice(0,8)}</td>
                <td style={{fontWeight:600}}>{p.reservasi?.tamu?.nama}</td>
                <td>{tglPendek(p.tglBayar)}</td>
                <td style={{fontWeight:700,color:"#065F46"}}>{rupiah(p.jumlah)}</td>
                <td>{unEnum(p.metode)}</td>
                <td><Badge label={unEnum(p.status)}/></td>
                <td style={{fontSize:11}}>{p.noRef}</td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn btn-dark btn-sm" onClick={()=>router.push(`/billing?reservasiId=${p.reservasiId}`)}>🖨</button>
                  <button className="btn btn-outline btn-sm" onClick={()=>openEdit(p)}>Edit</button>
                  <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(p.id)}>Hapus</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="add"?"Tambah Pembayaran":"Edit Pembayaran"} onClose={close}>
          <div className="field"><label>Reservasi *</label>
            <select value={form.reservasiId||""} onChange={e=>pilihReservasi(e.target.value)}>
              <option value="">-- Pilih Reservasi --</option>
              {reservasiList.map(r=><option key={r.id} value={r.id}>{r.id.slice(0,8)} — {r.tamu?.nama}</option>)}
            </select>
          </div>
          {form.reservasiId && (()=>{
            const info = hitungTagihan(form.reservasiId, modal==="edit"?form.id:null);
            return (
              <div className="calc-box">
                Total Tagihan: <b>{rupiah(info.total)}</b><br/>
                Sudah Dibayar (sebelumnya): <b>{rupiah(info.sudahBayar)}</b><br/>
                Sisa yang Harus Dibayar: <b style={{color:info.sisa>0?"#92400E":"#065F46"}}>{rupiah(info.sisa)}</b>
              </div>
            );
          })()}
          <div className="field"><label>Tanggal Bayar</label><input type="date" value={form.tglBayar||""} onChange={e=>setForm(f=>({...f,tglBayar:e.target.value}))}/></div>
          <div className="field"><label>Jumlah Bayar (Rp)</label><input type="number" value={form.jumlah||""} onChange={e=>setForm(f=>({...f,jumlah:+e.target.value}))}/></div>
          <div className="field"><label>Metode Pembayaran</label>
            <select value={form.metode||"Transfer Bank"} onChange={e=>setForm(f=>({...f,metode:e.target.value}))}>
              <option>Tunai</option><option>Transfer Bank</option><option>Kartu Kredit</option><option>QRIS</option>
            </select>
          </div>
          <div className="field"><label>Status</label>
            <select value={form.status||"Lunas"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option>Lunas</option><option>DP</option><option>Belum Bayar</option>
            </select>
          </div>
          <div className="field"><label>No. Referensi</label><input value={form.noRef||""} onChange={e=>setForm(f=>({...f,noRef:e.target.value}))}/></div>
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
