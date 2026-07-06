import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { prisma } from "@/lib/prisma";
import { getSession, canAccess } from "@/lib/auth";

function selisihHari(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

const HDR_BG = "FF0546AB";
const SUB_BG = "FFF85F07";
const ALT_BG = "FFE3ECFA";

function styleHeader(row) {
  row.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" }, size: 11 };
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: SUB_BG } };
    cell.alignment = { horizontal: "center", vertical: "middle" };
    cell.border = { top: { style: "thin" }, bottom: { style: "thin" }, left: { style: "thin" }, right: { style: "thin" } };
  });
}

function styleDataRow(row, striped) {
  row.eachCell((cell) => {
    cell.border = { top: { style: "thin", color: { argb: "FFE5E7EB" } }, bottom: { style: "thin", color: { argb: "FFE5E7EB" } }, left: { style: "thin", color: { argb: "FFE5E7EB" } }, right: { style: "thin", color: { argb: "FFE5E7EB" } } };
    if (striped) cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: ALT_BG } };
  });
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!canAccess(session.role, "laporan")) {
    return NextResponse.json({ error: "Tidak memiliki akses" }, { status: 403 });
  }

  const [pembayaran, reservasi] = await Promise.all([
    prisma.pembayaran.findMany({ include: { reservasi: { include: { tamu: true, kamar: true } } }, orderBy: { tglBayar: "desc" } }),
    prisma.reservasi.findMany({ include: { kamar: true, tamu: true } }),
  ]);

  const tahun = new Date().getFullYear();
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const totalLunas = pembayaran.filter((p) => p.status === "Lunas").reduce((s, p) => s + p.jumlah, 0);
  const totalDP = pembayaran.filter((p) => p.status === "DP").reduce((s, p) => s + p.jumlah, 0);
  const totalPiutang = reservasi.reduce((s, r) => {
    const tagihan = selisihHari(r.checkIn, r.checkOut) * (r.kamar?.harga || 0);
    const bayar = pembayaran.filter((p) => p.reservasiId === r.id).reduce((a, p) => a + p.jumlah, 0);
    return s + Math.max(0, tagihan - bayar);
  }, 0);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Guest House Sepakat";
  wb.created = new Date();

  // ── SHEET 1: RINGKASAN ──────────────────────────────────────
  const ws1 = wb.addWorksheet("Ringkasan");
  ws1.columns = [{ width: 28 }, { width: 22 }];
  ws1.mergeCells("A1:B1");
  ws1.getCell("A1").value = "LAPORAN KEUANGAN — GUEST HOUSE SEPAKAT";
  ws1.getCell("A1").font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } };
  ws1.getCell("A1").fill = { type: "pattern", pattern: "solid", fgColor: { argb: HDR_BG } };
  ws1.getCell("A1").alignment = { horizontal: "center" };
  ws1.getRow(1).height = 26;

  ws1.getCell("A2").value = `Dicetak: ${new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" })}`;
  ws1.getCell("A2").font = { italic: true, size: 9, color: { argb: "FF6B7280" } };
  ws1.mergeCells("A2:B2");

  const ringkasan = [
    ["Total Pendapatan (Lunas)", totalLunas],
    ["Menunggu (DP)", totalDP],
    ["Piutang Belum Lunas", totalPiutang],
  ];
  let r1 = 4;
  ws1.getRow(r1).values = ["Keterangan", "Jumlah (Rp)"];
  styleHeader(ws1.getRow(r1));
  r1++;
  ringkasan.forEach(([label, val], i) => {
    const row = ws1.getRow(r1 + i);
    row.values = [label, val];
    row.getCell(2).numFmt = "#,##0";
    styleDataRow(row, i % 2 === 0);
  });

  // ── SHEET 2: PENDAPATAN BULANAN ──────────────────────────────
  const ws2 = wb.addWorksheet("Pendapatan Bulanan");
  ws2.columns = [{ width: 14 }, { width: 20 }];
  const hdr2 = ws2.getRow(1);
  hdr2.values = ["Bulan", `Pendapatan ${tahun} (Rp)`];
  styleHeader(hdr2);
  BULAN.forEach((nm, m) => {
    const total = pembayaran
      .filter((p) => p.status === "Lunas" && new Date(p.tglBayar).getFullYear() === tahun && new Date(p.tglBayar).getMonth() === m)
      .reduce((s, p) => s + p.jumlah, 0);
    const row = ws2.getRow(m + 2);
    row.values = [nm, total];
    row.getCell(2).numFmt = "#,##0";
    styleDataRow(row, m % 2 === 0);
  });

  // ── SHEET 3: PER METODE & PER TIPE ──────────────────────────
  const ws3 = wb.addWorksheet("Per Metode & Tipe");
  ws3.columns = [{ width: 22 }, { width: 14 }, { width: 20 }];
  ws3.getCell("A1").value = "Per Metode Pembayaran";
  ws3.getCell("A1").font = { bold: true, size: 12 };
  ws3.mergeCells("A1:C1");
  const hdrM = ws3.getRow(2);
  hdrM.values = ["Metode", "Transaksi", "Total Lunas (Rp)"];
  styleHeader(hdrM);
  const metodeList = ["Tunai", "Transfer_Bank", "Kartu_Kredit", "QRIS"];
  metodeList.forEach((m, i) => {
    const row = ws3.getRow(3 + i);
    row.values = [m.replace("_", " "), pembayaran.filter((p) => p.metode === m).length, pembayaran.filter((p) => p.metode === m && p.status === "Lunas").reduce((s, p) => s + p.jumlah, 0)];
    row.getCell(3).numFmt = "#,##0";
    styleDataRow(row, i % 2 === 0);
  });

  const startTipe = 3 + metodeList.length + 2;
  ws3.getCell(`A${startTipe - 1}`).value = "Per Tipe Kamar";
  ws3.getCell(`A${startTipe - 1}`).font = { bold: true, size: 12 };
  ws3.mergeCells(`A${startTipe - 1}:C${startTipe - 1}`);
  const hdrT = ws3.getRow(startTipe);
  hdrT.values = ["Tipe Kamar", "Reservasi", "Est. Pendapatan (Rp)"];
  styleHeader(hdrT);
  const tipeList = ["Standard", "Deluxe", "Suite"];
  tipeList.forEach((t, i) => {
    const row = ws3.getRow(startTipe + 1 + i);
    const list = reservasi.filter((r) => r.kamar?.tipe === t);
    const total = list.reduce((s, r) => s + selisihHari(r.checkIn, r.checkOut) * (r.kamar?.harga || 0), 0);
    row.values = [t, list.length, total];
    row.getCell(3).numFmt = "#,##0";
    styleDataRow(row, i % 2 === 0);
  });

  // ── SHEET 4: SEMUA TRANSAKSI ──────────────────────────────────
  const ws4 = wb.addWorksheet("Semua Transaksi");
  ws4.columns = [{ width: 14 }, { width: 14 }, { width: 22 }, { width: 14 }, { width: 16 }, { width: 16 }, { width: 14 }, { width: 18 }];
  const hdr4 = ws4.getRow(1);
  hdr4.values = ["ID Pembayaran", "ID Reservasi", "Nama Tamu", "Tgl Bayar", "Metode", "Jumlah (Rp)", "Status", "No. Referensi"];
  styleHeader(hdr4);
  pembayaran.forEach((p, i) => {
    const row = ws4.getRow(i + 2);
    row.values = [
      p.id.slice(0, 8),
      p.reservasiId.slice(0, 8),
      p.reservasi?.tamu?.nama || "-",
      new Date(p.tglBayar).toLocaleDateString("id-ID"),
      p.metode.replace("_", " "),
      p.jumlah,
      p.status.replace("_", " "),
      p.noRef || "",
    ];
    row.getCell(6).numFmt = "#,##0";
    styleDataRow(row, i % 2 === 0);
  });

  const buffer = await wb.xlsx.writeBuffer();
  const filename = `Laporan_Keuangan_GuestHouseSepakat_${new Date().toISOString().slice(0, 10)}.xlsx`;

  return new NextResponse(buffer, {
    status: 200,
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
