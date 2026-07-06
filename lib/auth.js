// ============================================================
// AUTH HELPER — Session JWT via httpOnly cookie
// ============================================================

const { SignJWT, jwtVerify } = require("jose");
const { cookies } = require("next/headers");

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "ganti-secret-ini-di-env-production"
);
const COOKIE_NAME = "ghs_session";
const MAX_AGE = 60 * 60 * 24 * 7; // 7 hari

async function createSession(user) {
  const token = await new SignJWT({
    id: user.id,
    nama: user.nama,
    username: user.username,
    role: user.role,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + MAX_AGE)
    .sign(SECRET);

  const cookieStore = cookies();
  cookieStore.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: MAX_AGE,
    path: "/",
  });
}

async function getSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, SECRET);
    return payload;
  } catch {
    return null;
  }
}

function clearSession() {
  const cookieStore = cookies();
  cookieStore.delete(COOKIE_NAME);
}

// Daftar menu yang boleh diakses tiap role
const ROLE_ACCESS = {
  Admin: ["dashboard", "kamar", "tamu", "reservasi", "pembayaran", "housekeeping", "billing", "laporan", "pengaturan"],
  Resepsionis: ["dashboard", "kamar", "tamu", "reservasi", "pembayaran", "billing"],
  Housekeeping: ["dashboard", "housekeeping"],
};

function canAccess(role, key) {
  return (ROLE_ACCESS[role] || []).includes(key);
}

module.exports = { createSession, getSession, clearSession, ROLE_ACCESS, canAccess };
