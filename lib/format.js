export function rupiah(n) {
  return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", minimumFractionDigits: 0 }).format(n || 0);
}

export function selisihHari(a, b) {
  return Math.max(0, Math.round((new Date(b) - new Date(a)) / 86400000));
}

export function tglIndo(d) {
  return new Date(d).toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
}

export function tglPendek(d) {
  if (!d) return "";
  return new Date(d).toISOString().slice(0, 10);
}

// Konversi nilai enum Prisma (pakai underscore) jadi label tampilan
export function unEnum(val) {
  if (!val) return val;
  return val.replace(/_/g, " ");
}
