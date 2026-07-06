"use client";
import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import Badge from "@/components/Badge";
import { rupiah, unEnum } from "@/lib/format";

const ROLE_ACCESS = {
  Admin:["dashboard","kamar","tamu","reservasi","pembayaran","housekeeping","billing","laporan","pengaturan"],
  Resepsionis:["dashboard","kamar","tamu","reservasi","pembayaran","billing"],
  Housekeeping:["dashboard","housekeeping"],
};

export default function DashboardClient({ user }) {
  const [kamar,       setKamar]       = useState([]);
  const [reservasi,   setReservasi]   = useState([]);
  const [pembayaran,  setPembayaran]  = useState([]);
  const [housekeeping,setHousekeeping]= useState([]);
  const [loading,     setLoading]     = useState(true);
  const canAccess = k => (ROLE_ACCESS[user.role]||[]).includes(k);

  useEffect(() => {
    Promise.all([fetch("/api/kamar"),fetch("/api/reservasi"),fetch("/api/pembayaran"),fetch("/api/housekeeping")])
      .then(async ([k,r,p,h]) => {
        setKamar((await k.json()).data||[]);
        setReservasi((await r.json()).data||[]);
        setPembayaran((await p.json()).data||[]);
        setHousekeeping((await h.json()).data||[]);
        setLoading(false);
      });
  },[]);

  if (loading) return <AppShell user={user} pageTitle="⊞ Dashboard" showSearch={false}><div className="loading-wrap">Memuat data...</div></AppShell>;

  const totalLunas = pembayaran.filter(p=>p.status==="Lunas").reduce((s,p)=>s+p.jumlah,0);
  const kpis = [
    { label:"Total Kamar",   val:kamar.length,                                              icon:"🏠", color:"#0546AB" },
    { label:"Tersedia",      val:kamar.filter(k=>k.status==="Tersedia").length,             icon:"✅", color:"#065F46" },
    { label:"Terisi",        val:kamar.filter(k=>k.status==="Terisi").length,               icon:"🔴", color:"#991B1B" },
    { label:"Maintenance",   val:kamar.filter(k=>k.status==="Maintenance").length,          icon:"🔧", color:"#92400E" },
    { label:"Check-In Aktif",val:reservasi.filter(r=>unEnum(r.status)==="Checked In").length,icon:"👤",color:"#4C1D95" },
    { label:"Tugas Pending", val:housekeeping.filter(h=>h.status==="Pending").length,       icon:"🧹", color:"#B45309" },
  ];
  if (canAccess("laporan")) kpis.push({ label:"Pendapatan Lunas", val:rupiah(totalLunas), icon:"💰", color:"#065F46", sm:true });

  return (
    <AppShell user={user} pageTitle="⊞ Dashboard" showSearch={false}>
      <div className="page-title">Dashboard</div>
      <div className="kpi-grid">
        {kpis.map(k=>(
          <div className="kpi" key={k.label}>
            <div className="kpi-icon">{k.icon}</div>
            <div className="kpi-val" style={{fontSize:k.sm?13:22,color:k.color}}>{k.val}</div>
            <div className="kpi-label">{k.label}</div>
          </div>
        ))}
      </div>
      <div className="two-col">
        <div className="card">
          <div className="card-header">📅 Reservasi Aktif</div>
          <table><tbody>
            {reservasi.filter(r=>unEnum(r.status)!=="Checked Out").slice(0,6).map(r=>(
              <tr key={r.id}>
                <td><div style={{fontWeight:600,fontSize:12.5}}>{r.tamu?.nama}</div><div style={{color:"#94A3B8",fontSize:11}}>Kamar {r.kamar?.nomor}</div></td>
                <td style={{textAlign:"right"}}><Badge label={unEnum(r.status)}/></td>
              </tr>
            ))}
          </tbody></table>
        </div>
        <div className="card">
          <div className="card-header">🛏 Status Kamar</div>
          <table><tbody>
            {kamar.map(k=>(
              <tr key={k.id}>
                <td><b>No. {k.nomor}</b> <span style={{color:"#94A3B8",fontSize:11}}>{k.tipe}</span></td>
                <td style={{textAlign:"right"}}><Badge label={k.status}/></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      </div>
    </AppShell>
  );
}
