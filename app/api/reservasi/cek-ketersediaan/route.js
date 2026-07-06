import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { cekKonflikTanggal } from "@/lib/availability";

// GET /api/reservasi/cek-ketersediaan?kamarId=...&checkIn=...&checkOut=...&excludeId=...
export async function GET(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const kamarId = searchParams.get("kamarId");
  const checkIn = searchParams.get("checkIn");
  const checkOut = searchParams.get("checkOut");
  const excludeId = searchParams.get("excludeId") || undefined;

  if (!kamarId || !checkIn || !checkOut) {
    return NextResponse.json({ tersedia: true });
  }

  const cek = await cekKonflikTanggal({ kamarId, checkIn, checkOut, excludeId });
  return NextResponse.json({ tersedia: !cek.konflik, alasan: cek.alasan || null });
}
