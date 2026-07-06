import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";
import { cekKonflikTanggal } from "@/lib/availability";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reservasi = await prisma.reservasi.findMany({
    include: { tamu: true, kamar: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ data: reservasi });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "reservasi")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();

    if (!body.kamarId || !body.checkIn || !body.checkOut) {
      return NextResponse.json({ error: "Kamar, tanggal check-in, dan check-out wajib diisi" }, { status: 400 });
    }

    const cek = await cekKonflikTanggal({
      kamarId: body.kamarId,
      checkIn: body.checkIn,
      checkOut: body.checkOut,
    });
    if (cek.konflik) {
      return NextResponse.json({ error: cek.alasan, kode: "TANGGAL_BENTROK" }, { status: 409 });
    }

    const reservasi = await prisma.reservasi.create({
      data: {
        tamuId: body.tamuId,
        kamarId: body.kamarId,
        checkIn: new Date(body.checkIn),
        checkOut: new Date(body.checkOut),
        status: body.status || "Pending",
        catatan: body.catatan || "",
      },
      include: { tamu: true, kamar: true },
    });
    return NextResponse.json({ data: reservasi }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat reservasi" }, { status: 400 });
  }
}
