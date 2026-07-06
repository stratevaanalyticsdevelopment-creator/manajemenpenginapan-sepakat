import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pengaturan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, nama: true, username: true, role: true, aktif: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json({ data: users });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pengaturan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const hashed = await bcrypt.hash(body.password, 10);
    const user = await prisma.user.create({
      data: {
        nama: body.nama,
        username: body.username,
        password: hashed,
        role: body.role,
        aktif: true,
      },
      select: { id: true, nama: true, username: true, role: true, aktif: true },
    });
    return NextResponse.json({ data: user }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat pengguna. Username mungkin sudah dipakai." }, { status: 400 });
  }
}
