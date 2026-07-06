import { NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET || "ganti-secret-ini-di-env-production"
);
const COOKIE_NAME = "ghs_session";

// Halaman yang butuh login
const PROTECTED = ["/dashboard", "/kamar", "/tamu", "/reservasi", "/pembayaran", "/housekeeping", "/billing", "/laporan", "/pengaturan"];

export async function middleware(req) {
  const { pathname } = req.nextUrl;

  const isProtected = PROTECTED.some((p) => pathname.startsWith(p));
  if (!isProtected) return NextResponse.next();

  const token = req.cookies.get(COOKIE_NAME)?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }

  try {
    await jwtVerify(token, SECRET);
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/dashboard/:path*", "/kamar/:path*", "/tamu/:path*", "/reservasi/:path*", "/pembayaran/:path*", "/housekeeping/:path*", "/billing/:path*", "/laporan/:path*", "/pengaturan/:path*"],
};
