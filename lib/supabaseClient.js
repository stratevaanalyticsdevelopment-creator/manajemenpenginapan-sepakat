"use client";

// ============================================================
// SUPABASE CLIENT (BROWSER) — khusus untuk upload file ke Storage
// Menggunakan anon key, aman dipakai di client karena bucket
// "kamar-foto" dikonfigurasi sebagai public bucket dengan policy
// upload terbatas (lihat README bagian Storage).
// ============================================================

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const supabaseBrowser =
  supabaseUrl && supabaseAnonKey ? createClient(supabaseUrl, supabaseAnonKey) : null;

export const BUCKET_KAMAR_FOTO = "kamar-foto";

// Upload satu file gambar, kembalikan URL publik
export async function uploadFotoKamar(file, kamarId) {
  if (!supabaseBrowser) {
    throw new Error("Supabase belum dikonfigurasi. Cek NEXT_PUBLIC_SUPABASE_URL & NEXT_PUBLIC_SUPABASE_ANON_KEY di .env");
  }

  const ext = file.name.split(".").pop();
  const fileName = `${kamarId || "kamar"}-${Date.now()}.${ext}`;
  const path = `${fileName}`;

  const { error: uploadError } = await supabaseBrowser.storage
    .from(BUCKET_KAMAR_FOTO)
    .upload(path, file, { cacheControl: "3600", upsert: true });

  if (uploadError) throw uploadError;

  const { data } = supabaseBrowser.storage.from(BUCKET_KAMAR_FOTO).getPublicUrl(path);
  return data.publicUrl;
}
