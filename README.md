# 🏠 Guest House Sepakat

Sistem manajemen penginapan — Next.js 14 + Prisma 5.18 + Supabase (PostgreSQL).

## Akun Demo
| Username | Password | Role |
|---|---|---|
| admin | admin123 | Admin |
| resepsionis | resep123 | Resepsionis |
| housekeeping | house123 | Housekeeping |

## Setup Lokal
```bash
npm install
cp .env.example .env   # isi credentials Supabase
npm run db:push        # buat tabel di Supabase
npm run db:seed        # isi data awal
npm run dev            # buka http://localhost:3000
```

## Deploy Vercel
1. Push ke GitHub
2. Import di vercel.com
3. Tambahkan 5 environment variable (dari .env)
4. Deploy

Lihat file `setup.sql` untuk membuat tabel lewat Supabase SQL Editor (alternatif `db:push`).
