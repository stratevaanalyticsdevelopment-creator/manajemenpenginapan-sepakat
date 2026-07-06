import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pengaturan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = {
      nama: body.nama,
      username: body.username,
      role: body.role,
    };
    if (body.password) {
      data.password = await bcrypt.hash(body.password, 10);
    }
    const user = await prisma.user.update({
      where: { id: params.id },
      data,
      select: { id: true, nama: true, username: true, role: true, aktif: true },
    });
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui pengguna" }, { status: 400 });
  }
}

export async function PATCH(req, { params }) {
  // Toggle aktif/nonaktif
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pengaturan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const existing = await prisma.user.findUnique({ where: { id: params.id } });
    const user = await prisma.user.update({
      where: { id: params.id },
      data: { aktif: !existing.aktif },
      select: { id: true, nama: true, username: true, role: true, aktif: true },
    });
    return NextResponse.json({ data: user });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal mengubah status pengguna" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pengaturan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }
  if (session.id === params.id) {
    return NextResponse.json({ error: "Tidak bisa menghapus akun sendiri" }, { status: 400 });
  }

  try {
    await prisma.user.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus pengguna" }, { status: 400 });
  }
}
