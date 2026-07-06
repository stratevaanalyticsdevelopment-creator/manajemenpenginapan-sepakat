"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Badge from "./Badge";

const ALL_NAV = [
  { key:"dashboard", href:"/dashboard", icon:"⊞", label:"Dashboard" },
  { key:"kamar",     href:"/kamar",     icon:"🛏", label:"Kamar" },
  { key:"tamu",      href:"/tamu",      icon:"👤", label:"Tamu" },
  { key:"reservasi", href:"/reservasi", icon:"📅", label:"Reservasi" },
  { key:"pembayaran",href:"/pembayaran",icon:"💰", label:"Pembayaran" },
  { key:"housekeeping",href:"/housekeeping",icon:"🧹",label:"Housekeeping" },
  { key:"billing",   href:"/billing",   icon:"🧾", label:"Print Billing" },
  { key:"laporan",   href:"/laporan",   icon:"📊", label:"Laporan Keuangan", admin:true },
  { key:"pengaturan",href:"/pengaturan",icon:"⚙️", label:"Pengaturan Akses", admin:true },
];
const ROLE_ACCESS = {
  Admin:["dashboard","kamar","tamu","reservasi","pembayaran","housekeeping","billing","laporan","pengaturan"],
  Resepsionis:["dashboard","kamar","tamu","reservasi","pembayaran","billing"],
  Housekeeping:["dashboard","housekeeping"],
};

export default function AppShell({ user, pageTitle, search, onSearchChange, showSearch=true, children }) {
  const pathname = usePathname();
  const router   = useRouter();
  const allowed  = ROLE_ACCESS[user.role] || [];
  const navItems = ALL_NAV.filter(n => allowed.includes(n.key));
  const navBiasa = navItems.filter(n => !n.admin);
  const navAdmin = navItems.filter(n =>  n.admin);

  async function handleLogout() {
    await fetch("/api/auth/logout", { method:"POST" });
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="app">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="logo">
          <img src="/logo.png" alt="Sepakat Guest House" />
          <div className="logo-sub">Sistem Manajemen Penginapan</div>
        </div>
        <nav className="nav">
          {navBiasa.map(n => (
            <Link key={n.key} href={n.href} className={`nb${pathname===n.href?" active":""}`}>
              <span style={{fontSize:15}}>{n.icon}</span> {n.label}
            </Link>
          ))}
          {navAdmin.length > 0 && (
            <>
              <div className="nav-sep">🔒 Admin Only</div>
              {navAdmin.map(n => (
                <Link key={n.key} href={n.href} className={`nb admin${pathname===n.href?" active":""}`}>
                  <span style={{fontSize:15}}>{n.icon}</span> {n.label}
                </Link>
              ))}
            </>
          )}
        </nav>
        <div className="user-panel">
          <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:9}}>
            <div className="avatar">{user.nama[0]}</div>
            <div>
              <div style={{color:"#fff",fontWeight:600,fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",maxWidth:130}}>{user.nama}</div>
              <div style={{marginTop:2}}><Badge label={user.role}/></div>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>Keluar</button>
        </div>
      </aside>

      {/* MAIN */}
      <main className="main">
        <div className="topbar">
          <div className="topbar-title">{pageTitle}</div>
          <div className="topbar-right">
            {showSearch && (
              <input className="search-box" placeholder="Cari..." value={search||""} onChange={e=>onSearchChange&&onSearchChange(e.target.value)}/>
            )}
            <span className="topbar-user">Login: <b>{user.username}</b></span>
          </div>
        </div>
        <div className="content">{children}</div>
      </main>
    </div>
  );
}
