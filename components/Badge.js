const MAP = {
  "Tersedia":"b-green","Aktif":"b-green","Lunas":"b-green","Selesai":"b-green","Checked In":"b-green",
  "Terisi":"b-red","Belum Bayar":"b-red","Tinggi":"b-red",
  "Maintenance":"b-yellow","Pending":"b-yellow","DP":"b-yellow","Admin":"b-yellow",
  "Confirmed":"b-blue","Normal":"b-blue","Resepsionis":"b-blue",
  "Checked Out":"b-gray","Nonaktif":"b-gray","Rendah":"b-gray",
  "Proses":"b-purple","Housekeeping":"b-purple",
};
export default function Badge({ label }) {
  return <span className={`badge ${MAP[label] || "b-gray"}`}>{label}</span>;
}
