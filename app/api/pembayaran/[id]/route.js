import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

export async function PUT(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pembayaran")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const metodeMap = { "Transfer Bank": "Transfer_Bank", "Kartu Kredit": "Kartu_Kredit" };
    const pembayaran = await prisma.pembayaran.update({
      where: { id: params.id },
      data: {
        reservasiId: body.reservasiId,
        tglBayar: new Date(body.tglBayar),
        jumlah: Number(body.jumlah),
        metode: metodeMap[body.metode] || body.metode,
        status: body.status === "Belum Bayar" ? "Belum_Bayar" : body.status,
        noRef: body.noRef || "",
      },
      include: { reservasi: { include: { tamu: true, kamar: true } } },
    });
    return NextResponse.json({ data: pembayaran });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal memperbarui pembayaran" }, { status: 400 });
  }
}

export async function DELETE(req, { params }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "pembayaran")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  try {
    await prisma.pembayaran.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Gagal menghapus pembayaran" }, { status: 400 });
  }
}
