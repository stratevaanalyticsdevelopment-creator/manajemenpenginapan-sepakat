import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const housekeeping = await prisma.housekeeping.findMany({
    include: { kamar: true },
    orderBy: { tgl: "desc" },
  });
  return NextResponse.json({ data: housekeeping });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "housekeeping")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const housekeeping = await prisma.housekeeping.create({
      data: {
        kamarId: body.kamarId,
        jenis: body.jenis,
        status: body.status || "Pending",
        petugas: body.petugas || "",
        tgl: new Date(body.tgl),
        prioritas: body.prioritas || "Normal",
        catatan: body.catatan || "",
      },
      include: { kamar: true },
    });
    return NextResponse.json({ data: housekeeping }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat tugas housekeeping" }, { status: 400 });
  }
}
