import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "kamar")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const kamar = await prisma.kamar.update({
      where: { id: params.id },
      data: {
        nomor: Number(body.nomor),
        tipe: body.tipe,
        harga: Number(body.harga),
        status: body.status,
        fasilitas: body.fasilitas || "",
        lantai: Number(body.lantai) || 1,
        kapasitas: Number(body.kapasitas) || 2,
        fotoUrl: body.fotoUrl || null,
      },
    });
    return NextResponse.json({ data: kamar });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui kamar" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "kamar")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    await prisma.kamar.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus kamar. Pastikan tidak ada reservasi terkait." }, { status: 400 });
  }
}
