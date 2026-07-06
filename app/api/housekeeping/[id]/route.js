import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "housekeeping")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const housekeeping = await prisma.housekeeping.update({
      where: { id: params.id },
      data: {
        kamarId: body.kamarId,
        jenis: body.jenis,
        status: body.status,
        petugas: body.petugas || "",
        tgl: new Date(body.tgl),
        prioritas: body.prioritas,
        catatan: body.catatan || "",
      },
      include: { kamar: true },
    });
    return NextResponse.json({ data: housekeeping });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui tugas" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "housekeeping")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    await prisma.housekeeping.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus tugas" }, { status: 400 });
  }
}
