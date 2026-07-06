import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const tamu = await prisma.tamu.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json({ data: tamu });
}

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "tamu")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const tamu = await prisma.tamu.create({
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
    return NextResponse.json({ data: tamu }, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal membuat data tamu" }, { status: 400 });
  }
}
