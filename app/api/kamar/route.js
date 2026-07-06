import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const kamar = await prisma.kamar.findMany({ orderBy: { nomor: "asc" } });
  return NextResponse.json({ data: kamar });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "kamar")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const kamar = await prisma.kamar.create({
      data: {
        nomor: Number(body.nomor),
        tipe: body.tipe,
        harga: Number(body.harga),
        status: body.status || "Tersedia",
        fasilitas: body.fasilitas || "",
        lantai: Number(body.lantai) || 1,
        kapasitas: Number(body.kapasitas) || 2,
        fotoUrl: body.fotoUrl || null,
      },
    });
    return NextResponse.json({ data: kamar }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat kamar. Nomor kamar mungkin sudah ada." }, { status: 400 });
  }
}
