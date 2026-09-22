import { prisma } from "../lib/prisma";

const INITIAL_APPS = [
  {
    id: "simpeg",
    nama: "SIMPEG BPVP Banda Aceh",
    deskripsi: "Sistem Informasi Manajemen Pegawai & Layanan Kepegawaian ASN",
    kategori: "Kepegawaian & SDM",
    url: process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app",
    icon: "👥",
    color: "from-blue-600 to-[#003399]",
    badge: "Aplikasi Utama",
    apiKey: "bpvp_simpeg_core_secret_2026",
    aktif: true,
    urutan: 1,
  },
  {
    id: "skillhub",
    nama: "Skillhub BPVP Banda Aceh",
    deskripsi: "Portal Pelatihan Vokasi, Kurikulum, & Peningkatan Produktivitas",
    kategori: "Pelatihan Vokasi",
    url: "/demo/skillhub",
    icon: "🎓",
    color: "from-emerald-600 to-teal-800",
    badge: null,
    apiKey: "bpvp_skillhub_secret_2026",
    aktif: true,
    urutan: 2,
  },
  {
    id: "maganghub",
    nama: "Maganghub BPVP Banda Aceh",
    deskripsi: "Sistem Manajemen Pemagangan Dalam & Luar Negeri Mitra Industri",
    kategori: "Pemagangan",
    url: "/demo/maganghub",
    icon: "🏢",
    color: "from-amber-600 to-orange-800",
    badge: null,
    apiKey: "bpvp_maganghub_secret_2026",
    aktif: true,
    urutan: 3,
  },
  {
    id: "lsp",
    nama: "LSP-P1 BPVP Banda Aceh",
    deskripsi: "Lembaga Sertifikasi Profesi BNSP, Asesmen & Uji Kompetensi",
    kategori: "Sertifikasi",
    url: "/demo/lsp",
    icon: "🏅",
    color: "from-indigo-600 to-purple-800",
    badge: null,
    apiKey: "bpvp_lsp_secret_2026",
    aktif: true,
    urutan: 4,
  },
  {
    id: "keuangan",
    nama: "Keuangan & BMN BPVP",
    deskripsi: "Pengelolaan Anggaran DIPA, Perbendaharaan, & Aset Milik Negara",
    kategori: "Keuangan & Sarana",
    url: "/demo/keuangan",
    icon: "💰",
    color: "from-cyan-600 to-blue-800",
    badge: null,
    apiKey: "bpvp_keuangan_secret_2026",
    aktif: true,
    urutan: 5,
  },
  {
    id: "ptsp",
    nama: "Kios Siap Kerja / PTSP",
    deskripsi: "Pelayanan Terpadu Satu Pintu Informasi Pasar Kerja & Konseling Vokasi",
    kategori: "Pelayanan Publik",
    url: "/demo/ptsp",
    icon: "🏛️",
    color: "from-rose-600 to-pink-800",
    badge: null,
    apiKey: "bpvp_ptsp_secret_2026",
    aktif: true,
    urutan: 6,
  },
  {
    id: "absensi",
    nama: "Presensi & Absensi ASN",
    deskripsi: "Sistem Presensi Online & Rekapitulasi Kehadiran Pegawai",
    kategori: "Kepegawaian",
    url: "https://absensi-bpvp.vercel.app",
    icon: "⏱️",
    color: "from-violet-600 to-purple-800",
    badge: "Aplikasi Baru",
    apiKey: "bpvp_absensi_secret_2026",
    aktif: true,
    urutan: 7,
  },
];

async function seed() {
  console.log("Seeding table Application di database SSO...");
  for (const app of INITIAL_APPS) {
    const res = await prisma.application.upsert({
      where: { id: app.id },
      update: {
        nama: app.nama,
        deskripsi: app.deskripsi,
        kategori: app.kategori,
        url: app.url,
        icon: app.icon,
        color: app.color,
        badge: app.badge,
        apiKey: app.apiKey,
        aktif: app.aktif,
        urutan: app.urutan,
      },
      create: app,
    });
    console.log(`✓ Terdaftar: [${res.id.toUpperCase()}] ${res.nama} (${res.url})`);
  }

  const all = await prisma.application.findMany({ orderBy: { urutan: "asc" } });
  console.log(`\nTotal aplikasi terdaftar di database SSO: ${all.length}`);
}

seed().finally(() => prisma.$disconnect());
