// ============================================================
// SEED SCRIPT — Mengisi data awal ke database
// Jalankan dengan: npm run db:seed
// ============================================================

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("Menghapus data lama...");
  await prisma.pembayaran.deleteMany();
  await prisma.housekeeping.deleteMany();
  await prisma.reservasi.deleteMany();
  await prisma.tamu.deleteMany();
  await prisma.kamar.deleteMany();
  await prisma.user.deleteMany();

  console.log("Membuat pengguna...");
  const passAdmin = await bcrypt.hash("admin123", 10);
  const passResep = await bcrypt.hash("resep123", 10);
  const passHouse = await bcrypt.hash("house123", 10);

  await prisma.user.createMany({
    data: [
      { nama: "Administrator", username: "admin", password: passAdmin, role: "Admin", aktif: true },
      { nama: "Budi Resepsionis", username: "resepsionis", password: passResep, role: "Resepsionis", aktif: true },
      { nama: "Rina Housekeeping", username: "housekeeping", password: passHouse, role: "Housekeeping", aktif: true },
    ],
  });

  console.log("Membuat data kamar...");
  const k1 = await prisma.kamar.create({ data: { nomor: 101, tipe: "Standard", harga: 350000, status: "Tersedia", fasilitas: "AC, TV, WiFi, Kamar Mandi Dalam", lantai: 1, kapasitas: 2 } });
  const k2 = await prisma.kamar.create({ data: { nomor: 102, tipe: "Standard", harga: 350000, status: "Terisi", fasilitas: "AC, TV, WiFi, Kamar Mandi Dalam", lantai: 1, kapasitas: 2 } });
  const k3 = await prisma.kamar.create({ data: { nomor: 201, tipe: "Deluxe", harga: 550000, status: "Tersedia", fasilitas: "AC, TV, WiFi, Bathtub, Mini Bar, Balkon", lantai: 2, kapasitas: 3 } });
  const k4 = await prisma.kamar.create({ data: { nomor: 202, tipe: "Deluxe", harga: 550000, status: "Maintenance", fasilitas: "AC, TV, WiFi, Bathtub, Mini Bar, Balkon", lantai: 2, kapasitas: 3 } });
  const k5 = await prisma.kamar.create({ data: { nomor: 301, tipe: "Suite", harga: 950000, status: "Tersedia", fasilitas: "AC, TV 55in, WiFi, Jacuzzi, Ruang Tamu, Dapur", lantai: 3, kapasitas: 4 } });

  console.log("Membuat data tamu...");
  const t1 = await prisma.tamu.create({ data: { nama: "Budi Santoso", ktp: "3271234567890001", jk: "Laki_laki", hp: "08123456789", email: "budi@email.com", kota: "Bandung" } });
  const t2 = await prisma.tamu.create({ data: { nama: "Siti Rahayu", ktp: "3271234567890002", jk: "Perempuan", hp: "08234567890", email: "siti@email.com", kota: "Jakarta", catatan: "Vegetarian" } });
  const t3 = await prisma.tamu.create({ data: { nama: "John Smith", ktp: "A12345678", jk: "Laki_laki", hp: "08345678901", email: "john@email.com", kota: "New York", catatan: "Extra pillow" } });

  console.log("Membuat data reservasi...");
  const r1 = await prisma.reservasi.create({ data: { tamuId: t1.id, kamarId: k1.id, checkIn: new Date("2025-06-15"), checkOut: new Date("2025-06-18"), status: "Checked_In", tglBooking: new Date("2025-06-10") } });
  const r2 = await prisma.reservasi.create({ data: { tamuId: t2.id, kamarId: k3.id, checkIn: new Date("2025-06-16"), checkOut: new Date("2025-06-20"), status: "Confirmed", tglBooking: new Date("2025-06-12"), catatan: "Early check-in" } });
  const r3 = await prisma.reservasi.create({ data: { tamuId: t3.id, kamarId: k5.id, checkIn: new Date("2025-05-14"), checkOut: new Date("2025-05-17"), status: "Checked_Out", tglBooking: new Date("2025-05-01") } });
  const r4 = await prisma.reservasi.create({ data: { tamuId: t1.id, kamarId: k2.id, checkIn: new Date("2025-05-20"), checkOut: new Date("2025-05-23"), status: "Checked_Out", tglBooking: new Date("2025-05-15") } });

  console.log("Membuat data pembayaran...");
  await prisma.pembayaran.createMany({
    data: [
      { reservasiId: r1.id, tglBayar: new Date("2025-06-10"), jumlah: 1050000, metode: "Transfer_Bank", status: "Lunas", noRef: "TRF-20250610-001" },
      { reservasiId: r2.id, tglBayar: new Date("2025-06-12"), jumlah: 275000, metode: "Transfer_Bank", status: "DP", noRef: "TRF-20250612-002" },
      { reservasiId: r3.id, tglBayar: new Date("2025-05-14"), jumlah: 2850000, metode: "Tunai", status: "Lunas", noRef: "TUN-20250514-001" },
      { reservasiId: r4.id, tglBayar: new Date("2025-05-20"), jumlah: 1050000, metode: "QRIS", status: "Lunas", noRef: "QRIS-20250520-001" },
    ],
  });

  console.log("Membuat data housekeeping...");
  await prisma.housekeeping.createMany({
    data: [
      { kamarId: k2.id, jenis: "Pembersihan Kamar", status: "Selesai", petugas: "Rina", tgl: new Date("2025-06-15"), prioritas: "Tinggi", catatan: "Tamu check-out pagi" },
      { kamarId: k4.id, jenis: "Perbaikan AC", status: "Pending", petugas: "Pak Hendra", tgl: new Date("2025-06-15"), prioritas: "Tinggi", catatan: "AC tidak dingin" },
      { kamarId: k1.id, jenis: "Ganti Linen", status: "Proses", petugas: "Rina", tgl: new Date("2025-06-15"), prioritas: "Normal", catatan: "Permintaan tamu" },
      { kamarId: k3.id, jenis: "Laundry", status: "Pending", petugas: "Yuli", tgl: new Date("2025-06-16"), prioritas: "Normal", catatan: "Laundry tamu 2 koper" },
    ],
  });

  console.log("Seed selesai!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
