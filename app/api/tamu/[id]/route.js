import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "tamu")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const tamu = await prisma.tamu.update({
      where: { id: params.id },
      data: {
        nama: body.nama,
        ktp: body.ktp || "",
        jk: body.jk === "Perempuan" ? "Perempuan" : "Laki_laki",
        hp: body.hp || "",
        email: body.email || "",
        kota: body.kota || "",
        catatan: body.catatan || "",
      },
    });
    return NextResponse.json({ data: tamu });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui data tamu" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "tamu")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    await prisma.tamu.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus tamu. Pastikan tidak ada reservasi terkait." }, { status: 400 });
  }
}
