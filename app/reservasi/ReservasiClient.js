"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { rupiah, selisihHari, tglPendek, unEnum } from "@/lib/format";

const DEF = { status:"Pending" };

export default function ReservasiClient({ user }) {
  const router = useRouter();
  const [reservasi,setReservasi]= useState([]);
  const [tamuList, setTamuList] = useState([]);
  const [kamarList,setKamarList]= useState([]);
  const [search,   setSearch]   = useState("");
  const [loading,  setLoading]  = useState(true);
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(DEF);
  const [saving,   setSaving]   = useState(false);
  const [err,      setErr]      = useState("");
  const [cekStatus,setCekStatus]= useState("idle"); // idle|checking|ok|bentrok
  const [cekPesan, setCekPesan] = useState("");

  async function load() {
    const [r,t,k] = await Promise.all([fetch("/api/reservasi"),fetch("/api/tamu"),fetch("/api/kamar")]);
    setReservasi((await r.json()).data||[]);
    setTamuList((await t.json()).data||[]);
    setKamarList((await k.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  // Live cek ketersediaan saat kamar/tanggal berubah
  useEffect(()=>{
    if (!form.kamarId||!form.checkIn||!form.checkOut) { setCekStatus("idle"); return; }
    setCekStatus("checking");
    const t = setTimeout(async()=>{
      const qs = new URLSearchParams({ kamarId:form.kamarId, checkIn:form.checkIn, checkOut:form.checkOut, ...(form.id?{excludeId:form.id}:{}) });
      const r = await fetch(`/api/reservasi/cek-ketersediaan?${qs}`);
      const d = await r.json();
      setCekStatus(d.tersedia?"ok":"bentrok");
      setCekPesan(d.alasan||"");
    },400);
    return ()=>clearTimeout(t);
  },[form.kamarId,form.checkIn,form.checkOut,form.id]);

  const q = search.toLowerCase();
  const filtered = reservasi.filter(r=>(r.tamu?.nama||"").toLowerCase().includes(q)||unEnum(r.status).toLowerCase().includes(q)||String(r.kamar?.nomor||"").includes(search));

  function openAdd()  { setForm(DEF); setErr(""); setCekStatus("idle"); setModal("add"); }
  function openEdit(r){ setForm({id:r.id,tamuId:r.tamuId,kamarId:r.kamarId,checkIn:tglPendek(r.checkIn),checkOut:tglPendek(r.checkOut),status:unEnum(r.status),catatan:r.catatan||""}); setErr(""); setCekStatus("idle"); setModal("edit"); }
  function close()    { setModal(null); setForm(DEF); setCekStatus("idle"); }

  async function handleSave() {
    if (cekStatus==="bentrok") { setErr(cekPesan||"Tanggal bertabrakan"); return; }
    setSaving(true); setErr("");
    const payload = { ...form, status:form.status?.replace(/ /g,"_") };
    const url = modal==="add" ? "/api/reservasi" : `/api/reservasi/${form.id}`;
    const res = await fetch(url, { method:modal==="add"?"POST":"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify(payload) });
    const d = await res.json();
    if (!res.ok) { setErr(d.error||"Gagal menyimpan"); setSaving(false); return; }
    await load(); setSaving(false); close();
  }

  async function handleDelete(id) {
    if (!confirm("Hapus reservasi ini?")) return;
    const r = await fetch(`/api/reservasi/${id}`,{method:"DELETE"});
    if (r.ok) load(); else { const d=await r.json(); alert(d.error||"Gagal"); }
  }

  const kp  = kamarList.find(k=>k.id===form.kamarId);
  const ml  = form.checkIn&&form.checkOut ? selisihHari(form.checkIn,form.checkOut) : 0;

  return (
    <AppShell user={user} pageTitle="📅 Reservasi" search={search} onSearchChange={setSearch}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>📅 Reservasi</div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Buat Reservasi</button>
      </div>
      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>Tamu</th><th>Kamar</th><th>Check-In</th><th>Check-Out</th><th>Malam</th><th>Total</th><th>Status</th><th>Aksi</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Memuat...</td></tr>
            : filtered.length===0 ? <tr><td colSpan={9} style={{textAlign:"center",padding:20,color:"#94A3B8"}}>Tidak ada data</td></tr>
            : filtered.map(r=>{
              const ml2 = selisihHari(r.checkIn,r.checkOut);
              return (
                <tr key={r.id}>
                  <td style={{fontSize:11,color:"#94A3B8"}}>{r.id.slice(0,8)}</td>
                  <td style={{fontWeight:600}}>{r.tamu?.nama}</td>
                  <td><b>No. {r.kamar?.nomor}</b> <span style={{color:"#94A3B8",fontSize:11}}>({r.kamar?.tipe})</span></td>
                  <td>{tglPendek(r.checkIn)}</td>
                  <td>{tglPendek(r.checkOut)}</td>
                  <td style={{fontWeight:700,textAlign:"center"}}>{ml2}</td>
                  <td style={{fontWeight:600,color:"#0546AB"}}>{rupiah(ml2*(r.kamar?.harga||0))}</td>
                  <td><Badge label={unEnum(r.status)}/></td>
                  <td><div style={{display:"flex",gap:5}}>
                    <button className="btn btn-dark btn-sm" onClick={()=>router.push(`/billing?reservasiId=${r.id}`)}>🖨</button>
                    <button className="btn btn-outline btn-sm" onClick={()=>openEdit(r)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={()=>handleDelete(r.id)}>Hapus</button>
                  </div></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {modal && (
        <Modal title={modal==="add"?"Buat Reservasi":"Edit Reservasi"} onClose={close}>
          <div className="field"><label>Tamu *</label>
            <select value={form.tamuId||""} onChange={e=>setForm(f=>({...f,tamuId:e.target.value}))}>
              <option value="">-- Pilih Tamu --</option>
              {tamuList.map(t=><option key={t.id} value={t.id}>{t.nama}</option>)}
            </select>
          </div>
          <div className="field"><label>Kamar *</label>
            <select value={form.kamarId||""} onChange={e=>setForm(f=>({...f,kamarId:e.target.value}))}>
              <option value="">-- Pilih Kamar --</option>
              {kamarList.filter(k=>k.status!=="Maintenance").map(k=><option key={k.id} value={k.id}>No. {k.nomor} — {k.tipe} — {rupiah(k.harga)}/malam</option>)}
            </select>
          </div>
          <div className="field-row">
            <div className="field"><label>Check-In</label><input type="date" value={form.checkIn||""} onChange={e=>setForm(f=>({...f,checkIn:e.target.value}))}/></div>
            <div className="field"><label>Check-Out</label><input type="date" value={form.checkOut||""} onChange={e=>setForm(f=>({...f,checkOut:e.target.value}))}/></div>
          </div>
          {ml>0&&kp && <div className="calc-box"><b>{ml} malam</b> × {rupiah(kp.harga)} = <b style={{color:"#0546AB"}}>{rupiah(ml*kp.harga)}</b></div>}
          {cekStatus==="checking" && <div className="warn-box">⏳ Memeriksa ketersediaan kamar...</div>}
          {cekStatus==="ok"       && <div className="ok-box">✅ Kamar tersedia pada tanggal ini</div>}
          {cekStatus==="bentrok"  && <div className="error-box">⚠️ {cekPesan}</div>}
          <div className="field"><label>Status</label>
            <select value={form.status||"Pending"} onChange={e=>setForm(f=>({...f,status:e.target.value}))}>
              <option>Pending</option><option>Confirmed</option><option>Checked In</option><option>Checked Out</option>
            </select>
          </div>
          <div className="field"><label>Catatan</label><input value={form.catatan||""} onChange={e=>setForm(f=>({...f,catatan:e.target.value}))}/></div>
          {err && <div className="error-box">{err}</div>}
          <div className="form-btns">
            <button className="btn btn-outline" onClick={close}>Batal</button>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving||cekStatus==="checking"||cekStatus==="bentrok"}>{saving?"Menyimpan...":"Simpan"}</button>
          </div>
        </Modal>
      )}
    </AppShell>
  );
}
