"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import { rupiah, selisihHari, tglPendek, tglIndo, unEnum } from "@/lib/format";

const HOTEL = "Guest House Sepakat";
const ALAMAT = "Jl. Sepakat No. 1, Kota Anda";
const TELP = "(0561) 000-0000";
const EMAIL = "info@guesthousesepakat.com";

export default function BillingClient({ user }) {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const preselectId  = searchParams.get("reservasiId");

  const [resList,  setResList]  = useState([]);
  const [bayarList,setBayarList]= useState([]);
  const [selId,    setSelId]    = useState(preselectId||null);
  const [loading,  setLoading]  = useState(true);

  async function load() {
    const [r,p] = await Promise.all([fetch("/api/reservasi"),fetch("/api/pembayaran")]);
    setResList((await r.json()).data||[]);
    setBayarList((await p.json()).data||[]);
    setLoading(false);
  }
  useEffect(()=>{ load(); },[]);

  const r    = resList.find(x=>x.id===selId);
  const pays = bayarList.filter(p=>p.reservasiId===selId);
  const ml   = r ? selisihHari(r.checkIn,r.checkOut) : 0;
  const sub  = r ? ml*(r.kamar?.harga||0) : 0;
  const totBayar = pays.reduce((s,p)=>s+p.jumlah,0);
  const sisa = sub-totBayar;
  const lunas= sisa<=0;
  const noInv= r ? `INV-${r.id.slice(0,8).toUpperCase()}-${new Date().getFullYear()}` : "";

  function handlePrint() {
    const el = document.getElementById("area-cetak");
    if (!el) return;
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Invoice - ${HOTEL}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:13px;color:#111;padding:28px}
      table{width:100%;border-collapse:collapse;margin-bottom:12px}
      thead{background:#0546AB;color:#fff}
      th{padding:8px 11px;text-align:left;font-size:11px;text-transform:uppercase}
      td{padding:8px 11px;border-bottom:1px solid #E5E7EB}
      @media print{body{padding:14px}}
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); },400);
  }

  if (loading) return <AppShell user={user} pageTitle="🧾 Print Billing" showSearch={false}><div className="loading-wrap">Memuat data...</div></AppShell>;

  if (!selId||!r) return (
    <AppShell user={user} pageTitle="🧾 Print Billing" showSearch={false}>
      <div className="page-title">🧾 Print Billing</div>
      <div className="card">
        <div className="card-header">Pilih reservasi untuk mencetak billing</div>
        <table>
          <thead><tr><th>ID</th><th>Tamu</th><th>Kamar</th><th>Check-In</th><th>Check-Out</th><th>Total</th><th>Status</th><th></th></tr></thead>
          <tbody>
            {resList.map(res=>{
              const m2 = selisihHari(res.checkIn,res.checkOut);
              return (
                <tr key={res.id}>
                  <td style={{fontSize:11,color:"#94A3B8"}}>{res.id.slice(0,8)}</td>
                  <td style={{fontWeight:600}}>{res.tamu?.nama}</td>
                  <td>No. {res.kamar?.nomor} ({res.kamar?.tipe})</td>
                  <td>{tglPendek(res.checkIn)}</td>
                  <td>{tglPendek(res.checkOut)}</td>
                  <td style={{fontWeight:700,color:"#0546AB"}}>{rupiah(m2*(res.kamar?.harga||0))}</td>
                  <td><Badge label={unEnum(res.status)}/></td>
                  <td><button className="btn btn-dark btn-sm" onClick={()=>setSelId(res.id)}>🖨 Buat Billing</button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </AppShell>
  );

  return (
    <AppShell user={user} pageTitle="🧾 Print Billing" showSearch={false}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:14}}>
        <div className="page-title" style={{margin:0}}>🧾 Print Billing</div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-primary" onClick={handlePrint}>🖨 Cetak / PDF</button>
          <button className="btn btn-outline" onClick={()=>{setSelId(null);router.push("/billing");}}>← Pilih Lain</button>
        </div>
      </div>
      <div className="card" style={{padding:28,maxWidth:720,margin:"0 auto"}}>
        <div id="area-cetak">
          {/* KOP */}
          <div style={{textAlign:"center",borderBottom:"3px solid #0546AB",paddingBottom:12,marginBottom:16}}>
            <div style={{fontSize:22,fontWeight:900,color:"#0546AB"}}>🏠 {HOTEL.toUpperCase()}</div>
            <div style={{fontSize:11,color:"#64748B",marginTop:3}}>{ALAMAT} · Telp: {TELP} · {EMAIL}</div>
            <div style={{fontSize:17,fontWeight:800,color:"#0546AB",marginTop:10}}>INVOICE / KWITANSI</div>
            <div style={{fontSize:12,color:"#64748B",marginTop:2}}>No: {noInv} · Dicetak: {tglIndo(new Date())}</div>
          </div>
          {/* Foto kamar jika ada */}
          {r.kamar?.fotoUrl && <img src={r.kamar.fotoUrl} style={{width:"100%",maxHeight:140,objectFit:"cover",borderRadius:8,marginBottom:14}} alt=""/>}
          {/* Info tamu & menginap */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:16}}>
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:9,padding:13}}>
              <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".07em",color:"#64748B",marginBottom:7,fontWeight:700}}>Data Tamu</div>
              <div style={{fontSize:14,fontWeight:800,color:"#0F172A",marginBottom:3}}>{r.tamu?.nama}</div>
              <div style={{fontSize:12.5,color:"#374151"}}>KTP: {r.tamu?.ktp}</div>
              <div style={{fontSize:12.5,color:"#374151"}}>HP: {r.tamu?.hp}</div>
              <div style={{fontSize:12.5,color:"#374151"}}>Kota: {r.tamu?.kota}</div>
            </div>
            <div style={{background:"#F8FAFC",border:"1px solid #E2E8F0",borderRadius:9,padding:13}}>
              <div style={{fontSize:10,textTransform:"uppercase",letterSpacing:".07em",color:"#64748B",marginBottom:7,fontWeight:700}}>Detail Menginap</div>
              <div style={{fontSize:12.5,color:"#374151"}}>ID: <b>{r.id.slice(0,8)}</b></div>
              <div style={{fontSize:12.5,color:"#374151"}}>Kamar: <b>No. {r.kamar?.nomor} — {r.kamar?.tipe}</b></div>
              <div style={{fontSize:12.5,color:"#374151"}}>Check-In: <b>{tglPendek(r.checkIn)}</b></div>
              <div style={{fontSize:12.5,color:"#374151"}}>Check-Out: <b>{tglPendek(r.checkOut)}</b></div>
            </div>
          </div>
          {/* Tabel biaya */}
          <table style={{marginBottom:10}}>
            <thead><tr><th>Keterangan</th><th>Harga/Malam</th><th>Jumlah Malam</th><th>Subtotal</th></tr></thead>
            <tbody><tr style={{background:"#F8FAFC"}}>
              <td style={{padding:"10px 11px"}}><b>Kamar {r.kamar?.tipe} No. {r.kamar?.nomor}</b><br/><span style={{fontSize:11,color:"#64748B"}}>{tglPendek(r.checkIn)} s/d {tglPendek(r.checkOut)}</span></td>
              <td style={{padding:"10px 11px"}}>{rupiah(r.kamar?.harga)}</td>
              <td style={{padding:"10px 11px",textAlign:"center",fontWeight:700}}>{ml} malam</td>
              <td style={{padding:"10px 11px",fontWeight:700,color:"#0546AB"}}>{rupiah(sub)}</td>
            </tr></tbody>
          </table>
          {/* Total */}
          <div style={{background:"#0546AB",color:"#fff",borderRadius:9,padding:"12px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:9}}>
            <div><div style={{fontSize:11,opacity:.6,marginBottom:2}}>TOTAL TAGIHAN</div><div style={{fontSize:22,fontWeight:900}}>{rupiah(sub)}</div></div>
            <div style={{textAlign:"right"}}><div style={{fontSize:11,opacity:.6,marginBottom:2}}>SUDAH DIBAYAR</div><div style={{fontSize:17,fontWeight:700,color:"#BAE6FD"}}>{rupiah(totBayar)}</div></div>
          </div>
          {/* Status */}
          <div style={{background:lunas?"#D1FAE5":"#FEF3C7",border:`1px solid ${lunas?"#6EE7B7":"#FCD34D"}`,borderRadius:9,padding:"10px 16px",display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
            <span style={{fontWeight:700,fontSize:13,color:lunas?"#065F46":"#92400E"}}>{lunas?"✅ PEMBAYARAN LUNAS":"⚠️ SISA TAGIHAN"}</span>
            {lunas ? <span style={{fontSize:12,color:"#065F46",fontWeight:600}}>Terima kasih!</span> : <span style={{fontWeight:900,fontSize:16,color:"#92400E"}}>{rupiah(sisa)}</span>}
          </div>
          {/* Riwayat bayar */}
          {pays.length>0 && (
            <div style={{marginBottom:16}}>
              <div style={{fontSize:11,fontWeight:700,color:"#64748B",textTransform:"uppercase",marginBottom:6}}>Riwayat Pembayaran</div>
              <table>
                <thead><tr><th>No. Ref</th><th>Tgl Bayar</th><th>Metode</th><th>Jumlah</th><th>Status</th></tr></thead>
                <tbody>
                  {pays.map((p,i)=>(
                    <tr key={p.id} style={{background:i%2?"#F8FAFC":"#fff"}}>
                      <td style={{padding:"7px 10px",fontSize:11}}>{p.noRef}</td>
                      <td style={{padding:"7px 10px"}}>{tglPendek(p.tglBayar)}</td>
                      <td style={{padding:"7px 10px"}}>{unEnum(p.metode)}</td>
                      <td style={{padding:"7px 10px",fontWeight:700,color:"#065F46"}}>{rupiah(p.jumlah)}</td>
                      <td style={{padding:"7px 10px"}}>{unEnum(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {/* Tanda tangan */}
          <div style={{borderTop:"1px solid #E2E8F0",paddingTop:16,display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            <div>
              <div style={{fontSize:11,color:"#64748B",marginBottom:4}}>Catatan: {r.catatan||"—"}</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:8}}>Dokumen ini merupakan bukti pembayaran resmi dari {HOTEL}.</div>
            </div>
            <div style={{textAlign:"center"}}>
              <div style={{fontSize:11,color:"#64748B",marginBottom:44}}>Hormat kami,</div>
              <div style={{borderTop:"1px solid #0546AB",paddingTop:5,fontWeight:700,fontSize:12,color:"#0546AB"}}>( {HOTEL} )</div>
              <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Resepsionis / Front Desk</div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
