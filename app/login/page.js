"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Badge from "@/components/Badge";

const DEMO = [
  { u:"admin",        p:"admin123", role:"Admin" },
  { u:"resepsionis",  p:"resep123", role:"Resepsionis" },
  { u:"housekeeping", p:"house123", role:"Housekeeping" },
];

export default function LoginPage() {
  const router = useRouter();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();
    setErr(""); setLoading(true);
    const res = await fetch("/api/auth/login", { method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({username:u,password:p}) });
    const data = await res.json();
    if (!res.ok) { setErr(data.error||"Login gagal"); setLoading(false); return; }
    router.push("/dashboard"); router.refresh();
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-title">
          <img src="/logo.png" alt="Sepakat Guest House" className="login-logo"/>
          <p style={{color:"#64748B",fontSize:12.5}}>Sistem Manajemen Penginapan</p>
        </div>
        <form onSubmit={handleLogin}>
          <div className="field">
            <label>Username</label>
            <input value={u} onChange={e=>setU(e.target.value)} placeholder="Masukkan username" autoComplete="username"/>
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={p} onChange={e=>setP(e.target.value)} placeholder="Masukkan password" autoComplete="current-password"/>
          </div>
          {err && <div className="error-box">{err}</div>}
          <button type="submit" className="btn btn-primary" style={{width:"100%",justifyContent:"center",padding:10}} disabled={loading}>
            {loading?"Memproses...":"Masuk"}
          </button>
        </form>
        <div className="demo-accounts">
          <div style={{fontSize:10.5,fontWeight:700,color:"#64748B",textTransform:"uppercase",letterSpacing:".05em",marginBottom:8}}>
            Akun Demo — klik untuk isi otomatis
          </div>
          {DEMO.map(d=>(
            <div key={d.u} className="demo-row" onClick={()=>{setU(d.u);setP(d.p);}}>
              <span><b>{d.u}</b> / {d.p}</span>
              <Badge label={d.role}/>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
