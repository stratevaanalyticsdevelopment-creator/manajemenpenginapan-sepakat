// ============================================================
// VALIDASI KONFLIK TANGGAL KAMAR
// Dua reservasi untuk kamar yang sama dianggap bertabrakan jika
// rentang tanggalnya saling tumpang tindih:
//   existing.checkIn < new.checkOut  AND  existing.checkOut > new.checkIn
// Reservasi dengan status "Checked_Out" diabaikan (sudah selesai),
// begitu juga reservasi yang sedang diedit (excludeId).
// ============================================================

const { prisma } = require("./prisma");

async function cekKonflikTanggal({ kamarId, checkIn, checkOut, excludeId }) {
  const ci = new Date(checkIn);
  const co = new Date(checkOut);

  if (isNaN(ci.getTime()) || isNaN(co.getTime())) {
    return { konflik: false };
  }
  if (co <= ci) {
    return { konflik: true, alasan: "Tanggal check-out harus setelah tanggal check-in." };
  }

  const bentrok = await prisma.reservasi.findMany({
    where: {
      kamarId,
      status: { not: "Checked_Out" },
      ...(excludeId ? { id: { not: excludeId } } : {}),
      checkIn: { lt: co },
      checkOut: { gt: ci },
    },
    include: { tamu: true },
  });

  if (bentrok.length > 0) {
    const r = bentrok[0];
    const fmt = (d) => new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    return {
      konflik: true,
      alasan: `Kamar sudah dipesan oleh ${r.tamu?.nama || "tamu lain"} pada ${fmt(r.checkIn)} - ${fmt(r.checkOut)}.`,
      reservasiBentrok: bentrok,
    };
  }

  return { konflik: false };
}

module.exports = { cekKonflikTanggal };
