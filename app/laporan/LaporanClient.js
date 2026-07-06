"use client";
import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import { rupiah, tglPendek, tglIndo, unEnum } from "@/lib/format";

const HOTEL = "Guest House Sepakat";

export default function LaporanClient({ user }) {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting,setExporting]=useState(false);
  const printRef = useRef(null);

  useEffect(()=>{
    fetch("/api/laporan").then(r=>r.json()).then(j=>{ setData(j.data); setLoading(false); });
  },[]);

  async function handleExportExcel() {
    setExporting(true);
    try {
      const res = await fetch("/api/laporan/export-excel");
      const blob = await res.blob();
      const url  = window.URL.createObjectURL(blob);
      const a    = document.createElement("a");
      a.href = url; a.download = `Laporan_Keuangan_GuestHouseSepakat_${new Date().toISOString().slice(0,10)}.xlsx`;
      document.body.appendChild(a); a.click(); a.remove();
      window.URL.revokeObjectURL(url);
    } catch(e) { alert("Gagal export: "+e.message); }
    setExporting(false);
  }

  function handleExportPDF() {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("","_blank");
    w.document.write(`<!DOCTYPE html><html><head><title>Laporan Keuangan - ${HOTEL}</title><style>
      *{margin:0;padding:0;box-sizing:border-box}
      body{font-family:Arial,sans-serif;font-size:12px;color:#111;padding:26px}
      table{width:100%;border-collapse:collapse;margin-bottom:10px}
      thead{background:#0546AB;color:#fff}
      th{padding:7px 10px;text-align:left;font-size:10px;text-transform:uppercase}
      td{padding:7px 10px;border-bottom:1px solid #E5E7EB;font-size:11.5px}
      h3{font-size:12px;margin:16px 0 8px}
      @media print{body{padding:14px}}
    </style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    setTimeout(()=>{ w.focus(); w.print(); },400);
  }

  if (loading||!data) return <AppShell user={user} pageTitle="📊 Laporan Keuangan" showSearch={false}><div className="loading-wrap">Memuat data...</div></AppShell>;

  const { perBulan, totalLunas, totalDP, totalPiutang, perMetode, perTipe, transaksi } = data;
  const tahun = new Date().getFullYear();
  const maxV  = Math.max(...perBulan.map(b=>b.total),1);

  return (
    <AppShell user={user} pageTitle="📊 Laporan Keuangan" showSearch={false}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div className="page-title" style={{margin:0}}>📊 Laporan Keuangan</div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn btn-outline btn-sm" onClick={handleExportPDF}>🖨 Export PDF</button>
          <button className="btn btn-primary btn-sm" onClick={handleExportExcel} disabled={exporting}>{exporting?"Mengekspor...":"📥 Export Excel"}</button>
        </div>
      </div>

      <div className="stat3">
        <div className="stat-box" style={{background:"#ECFDF5"}}><div style={{fontSize:22,marginBottom:7}}>✅</div><div style={{fontSize:16,fontWeight:900,color:"#065F46",marginBottom:3}}>{rupiah(totalLunas)}</div><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>Total Pendapatan (Lunas)</div></div>
        <div className="stat-box" style={{background:"#FFFBEB"}}><div style={{fontSize:22,marginBottom:7}}>⏳</div><div style={{fontSize:16,fontWeight:900,color:"#92400E",marginBottom:3}}>{rupiah(totalDP)}</div><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>Menunggu (DP)</div></div>
        <div className="stat-box" style={{background:"#FEF2F2"}}><div style={{fontSize:22,marginBottom:7}}>⚠️</div><div style={{fontSize:16,fontWeight:900,color:"#991B1B",marginBottom:3}}>{rupiah(totalPiutang)}</div><div style={{fontSize:11,color:"#64748B",fontWeight:600}}>Piutang Belum Lunas</div></div>
      </div>

      <div className="card" style={{padding:18,marginBottom:13}}>
        <div style={{fontWeight:700,fontSize:13,marginBottom:14}}>📈 Pendapatan Bulanan {tahun}</div>
        <div className="chart-bars">
          {perBulan.map(b=>{
            const h = b.total>0 ? Math.max((b.total/maxV)*110,5) : 3;
            return (
              <div key={b.bulan} className="chart-bar-wrap">
                <div className="chart-val">{b.total>0?(b.total/1000000).toFixed(1)+"jt":""}</div>
                <div className="chart-bar" style={{height:h,background:b.total>0?"#0546AB":"#E2E8F0"}}/>
                <div className="chart-label">{b.bulan}</div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="two-col" style={{marginBottom:13}}>
        <div className="card">
          <div className="card-header">💳 Per Metode Pembayaran</div>
          <table><thead><tr><th>Metode</th><th>Transaksi</th><th>Total Lunas</th></tr></thead>
          <tbody>{perMetode.map(x=><tr key={x.metode}><td><b>{x.metode}</b></td><td style={{textAlign:"center"}}>{x.count}x</td><td style={{fontWeight:700,color:"#0546AB"}}>{rupiah(x.total)}</td></tr>)}</tbody></table>
        </div>
        <div className="card">
          <div className="card-header">🛏 Per Tipe Kamar</div>
          <table><thead><tr><th>Tipe</th><th>Reservasi</th><th>Est. Pendapatan</th></tr></thead>
          <tbody>{perTipe.map(x=><tr key={x.tipe}><td><b>{x.tipe}</b></td><td style={{textAlign:"center"}}>{x.count}x</td><td style={{fontWeight:700,color:"#065F46"}}>{rupiah(x.total)}</td></tr>)}</tbody></table>
        </div>
      </div>

      <div className="card">
        <div className="card-header">🧾 Semua Transaksi</div>
        <table><thead><tr><th>ID</th><th>Reservasi</th><th>Tamu</th><th>Tgl Bayar</th><th>Metode</th><th>Jumlah</th><th>Status</th></tr></thead>
        <tbody>
          {transaksi.map(p=>(
            <tr key={p.id}>
              <td style={{fontSize:11,color:"#94A3B8"}}>{p.id.slice(0,8)}</td>
              <td style={{fontSize:11}}>{p.reservasiId.slice(0,8)}</td>
              <td style={{fontWeight:600}}>{p.reservasi?.tamu?.nama}</td>
              <td>{tglPendek(p.tglBayar)}</td>
              <td>{unEnum(p.metode)}</td>
              <td style={{fontWeight:700,color:"#065F46"}}>{rupiah(p.jumlah)}</td>
              <td><Badge label={unEnum(p.status)}/></td>
            </tr>
          ))}
        </tbody></table>
      </div>

      {/* Hidden print area */}
      <div style={{position:"absolute",left:-9999,top:-9999}} ref={printRef}>
        <div style={{textAlign:"center",borderBottom:"3px solid #0546AB",paddingBottom:10,marginBottom:14}}>
          <div style={{fontSize:20,fontWeight:900,color:"#0546AB"}}>🏠 {HOTEL.toUpperCase()}</div>
          <div style={{fontSize:15,fontWeight:800,color:"#0546AB",marginTop:8}}>LAPORAN KEUANGAN {tahun}</div>
          <div style={{fontSize:11,color:"#64748B",marginTop:2}}>Dicetak: {tglIndo(new Date())}</div>
        </div>
        <table><thead><tr><th>Keterangan</th><th>Jumlah (Rp)</th></tr></thead>
        <tbody>
          <tr><td>Total Pendapatan (Lunas)</td><td style={{fontWeight:700,color:"#065F46"}}>{rupiah(totalLunas)}</td></tr>
          <tr><td>Menunggu (DP)</td><td style={{fontWeight:700,color:"#92400E"}}>{rupiah(totalDP)}</td></tr>
          <tr><td>Piutang Belum Lunas</td><td style={{fontWeight:700,color:"#991B1B"}}>{rupiah(totalPiutang)}</td></tr>
        </tbody></table>
        <h3>Pendapatan Bulanan {tahun}</h3>
        <table><thead><tr><th>Bulan</th><th>Total (Rp)</th></tr></thead><tbody>{perBulan.map(b=><tr key={b.bulan}><td>{b.bulan}</td><td>{rupiah(b.total)}</td></tr>)}</tbody></table>
        <h3>Per Metode Pembayaran</h3>
        <table><thead><tr><th>Metode</th><th>Transaksi</th><th>Total Lunas (Rp)</th></tr></thead><tbody>{perMetode.map(x=><tr key={x.metode}><td>{x.metode}</td><td>{x.count}x</td><td>{rupiah(x.total)}</td></tr>)}</tbody></table>
        <h3>Per Tipe Kamar</h3>
        <table><thead><tr><th>Tipe</th><th>Reservasi</th><th>Est. Pendapatan (Rp)</th></tr></thead><tbody>{perTipe.map(x=><tr key={x.tipe}><td>{x.tipe}</td><td>{x.count}x</td><td>{rupiah(x.total)}</td></tr>)}</tbody></table>
        <h3>Semua Transaksi</h3>
        <table><thead><tr><th>ID</th><th>Tamu</th><th>Tgl Bayar</th><th>Metode</th><th>Jumlah (Rp)</th><th>Status</th></tr></thead>
        <tbody>{transaksi.map(p=><tr key={p.id}><td>{p.id.slice(0,8)}</td><td>{p.reservasi?.tamu?.nama}</td><td>{tglPendek(p.tglBayar)}</td><td>{unEnum(p.metode)}</td><td>{rupiah(p.jumlah)}</td><td>{unEnum(p.status)}</td></tr>)}</tbody></table>
      </div>
    </AppShell>
  );
}
