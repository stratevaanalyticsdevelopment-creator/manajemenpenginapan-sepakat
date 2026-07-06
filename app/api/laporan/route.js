import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

function selisihHari(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "laporan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  const [pembayaran, reservasi] = await Promise.all([
    prisma.pembayaran.findMany({ include: { reservasi: { include: { tamu: true, kamar: true } } } }),
    prisma.reservasi.findMany({ include: { kamar: true } }),
  ]);

  const tahun = new Date().getFullYear();
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const perBulan = BULAN.map((nm, m) => ({
    bulan: nm,
    total: pembayaran
      .filter((p) => p.status === "Lunas" && new Date(p.tglBayar).getFullYear() === tahun && new Date(p.tglBayar).getMonth() === m)
      .reduce((s, p) => s + p.jumlah, 0),
  }));

  const totalLunas = pembayaran.filter((p) => p.status === "Lunas").reduce((s, p) => s + p.jumlah, 0);
  const totalDP = pembayaran.filter((p) => p.status === "DP").reduce((s, p) => s + p.jumlah, 0);

  const totalPiutang = reservasi.reduce((s, r) => {
    const tagihan = selisihHari(r.checkIn, r.checkOut) * (r.kamar?.harga || 0);
    const bayar = pembayaran
      .filter((p) => p.reservasiId === r.id)
      .reduce((a, p) => a + p.jumlah, 0);
    return s + Math.max(0, tagihan - bayar);
  }, 0);

  const metodeList = ["Tunai", "Transfer_Bank", "Kartu_Kredit", "QRIS"];
  const perMetode = metodeList.map((m) => ({
    metode: m.replace("_", " "),
    total: pembayaran.filter((p) => p.metode === m && p.status === "Lunas").reduce((s, p) => s + p.jumlah, 0),
    count: pembayaran.filter((p) => p.metode === m).length,
  }));

  const tipeList = ["Standard", "Deluxe", "Suite"];
  const perTipe = tipeList.map((tipe) => ({
    tipe,
    total: reservasi
      .filter((r) => r.kamar?.tipe === tipe)
      .reduce((s, r) => s + selisihHari(r.checkIn, r.checkOut) * (r.kamar?.harga || 0), 0),
    count: reservasi.filter((r) => r.kamar?.tipe === tipe).length,
  }));

  return NextResponse.json({
    data: {
      perBulan,
      totalLunas,
      totalDP,
      totalPiutang,
      perMetode,
      perTipe,
      transaksi: pembayaran.sort((a, b) => new Date(b.tglBayar) - new Date(a.tglBayar)),
    },
  });
}
