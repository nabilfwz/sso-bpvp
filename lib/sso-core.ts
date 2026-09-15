import crypto from "crypto";
import { prisma } from "./prisma";
import * as bcrypt from "bcryptjs";

const SSO_SECRET = process.env.NEXTAUTH_SECRET || "bpvp-kemnaker-sso-secret-key-2026-secure";

export interface SsoTokenPayload {
  tokenId: string;
  userId: string;
  pegawaiId?: string;
  nip: string;
  nama: string;
  email: string;
  role: string;
  unitKerja?: string;
  subUnitKerja?: string;
  statusPegawai?: string;
  iat: number;
  exp: number;
}

export interface BpvpApp {
  id: string;
  nama: string;
  deskripsi: string;
  kategori: string;
  url: string;
  icon: string;
  color: string;
  badge?: string;
  isCurrent?: boolean;
}

export const BPVP_ECOSYSTEM_APPS: BpvpApp[] = [
  {
    id: "simpeg",
    nama: "SIMPEG BPVP Banda Aceh",
    deskripsi: "Sistem Informasi Manajemen Pegawai & Layanan Kepegawaian ASN",
    kategori: "Kepegawaian & SDM",
    url: process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app",
    icon: "👥",
    color: "from-blue-600 to-[#003399]",
    badge: "Aplikasi Utama",
  },
  {
    id: "skillhub",
    nama: "Skillhub BPVP Banda Aceh",
    deskripsi: "Portal Pelatihan Vokasi, Kurikulum, & Peningkatan Produktivitas",
    kategori: "Pelatihan Vokasi",
    url: "/demo/skillhub",
    icon: "🎓",
    color: "from-emerald-600 to-teal-800",
  },
  {
    id: "maganghub",
    nama: "Maganghub BPVP Banda Aceh",
    deskripsi: "Sistem Manajemen Pemagangan Dalam & Luar Negeri Mitra Industri",
    kategori: "Pemagangan",
    url: "/demo/maganghub",
    icon: "🏢",
    color: "from-amber-600 to-orange-800",
  },
  {
    id: "lsp",
    nama: "LSP-P1 BPVP Banda Aceh",
    deskripsi: "Lembaga Sertifikasi Profesi BNSP, Asesmen & Uji Kompetensi",
    kategori: "Sertifikasi",
    url: "/demo/lsp",
    icon: "🏅",
    color: "from-indigo-600 to-purple-800",
  },
  {
    id: "keuangan",
    nama: "Keuangan & BMN BPVP",
    deskripsi: "Pengelolaan Anggaran DIPA, Perbendaharaan, & Aset Milik Negara",
    kategori: "Keuangan & Sarana",
    url: "/demo/keuangan",
    icon: "💰",
    color: "from-cyan-600 to-blue-800",
  },
  {
    id: "ptsp",
    nama: "Kios Siap Kerja / PTSP",
    deskripsi: "Pelayanan Terpadu Satu Pintu Informasi Pasar Kerja & Konseling Vokasi",
    kategori: "Pelayanan Publik",
    url: "/demo/ptsp",
    icon: "🏛️",
    color: "from-rose-600 to-pink-800",
  },
];

/**
 * Validasi ketat identitas NIP / Email terhadap Database Manajemen Pegawai BPVP.
 * Orang luar dan pegawai nonaktif (di tong sampah) otomatis ditolak dengan pesan jelas.
 */
export async function validatePegawaiForSso(identifier: string): Promise<{
  user: { id: string; nama: string; email: string; role: string; aktif: boolean };
  pegawai?: any;
}> {
  const cleanId = identifier.trim();
  const cleanEmail = cleanId.toLowerCase();

  // 1. Cari di tabel Pegawai BPVP (Single Source of Truth)
  const pegawai = await prisma.pegawai.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: "insensitive" } },
        { nip: cleanId },
      ],
    },
    include: {
      unitKerja: true,
      subUnitKerja: true,
      dirjen: true,
      statusPegawai: true,
      eselon: true,
    },
  });

  if (pegawai) {
    // Periksa status keaktifan pegawai (apakah ada di tong sampah)
    if (!pegawai.aktif) {
      throw new Error(
        `Akses Ditolak: Pegawai "${pegawai.nama}" (${pegawai.nip}) berstatus NONAKTIF (berada di tong sampah). Hubungi Administrator Kepegawaian BPVP.`
      );
    }

    const employeeEmail = pegawai.email?.toLowerCase().trim() || `${pegawai.nip}@bpvp.kemnaker.go.id`;

    // Penentuan role sistem
    const subUnit = pegawai.subUnitKerja?.label?.toLowerCase() || "";
    const isElevated =
      subUnit.includes("umum") ||
      subUnit.includes("pimpinan") ||
      subUnit.includes("tata usaha") ||
      pegawai.nip === "198001012005011001";
    const assignedRole = isElevated ? "admin" : "operator";

    // Temukan atau sinkronkan akun User internal
    let user = await prisma.user.findUnique({
      where: { email: employeeEmail },
    });

    if (user) {
      if (!user.aktif) {
        throw new Error(
          `Akses Ditolak: Akun login pengguna untuk "${pegawai.nama}" telah dinonaktifkan oleh administrator.`
        );
      }
    } else {
      const randomPassword = await bcrypt.hash(
        crypto.randomBytes(16).toString("hex"),
        10
      );
      user = await prisma.user.create({
        data: {
          email: employeeEmail,
          nama: pegawai.nama,
          password: randomPassword,
          role: assignedRole,
          aktif: true,
        },
      });
    }

    return { user, pegawai };
  }

  // 2. Fallback untuk administrator sistem yang terdaftar di tabel User
  const systemUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (systemUser) {
    if (!systemUser.aktif) {
      throw new Error(`Akses Ditolak: Akun login administrator "${systemUser.email}" dinonaktifkan.`);
    }
    return { user: systemUser };
  }

  // 3. Penolakan Orang Luar
  throw new Error(
    `Akses Ditolak: Email atau NIP "${identifier}" TIDAK TERDAFTAR dalam Data Manajemen Pegawai BPVP. Hanya ASN dan Pegawai resmi BPVP yang berhak mengakses Ekosistem SSO BPVP.`
  );
}

/**
 * Autentikasi Pegawai/User SSO dengan verifikasi password.
 * Ini adalah fungsi yang digunakan pada alur login SSO yang benar —
 * user WAJIB memasukkan NIP/Email + Password untuk bisa masuk.
 */
export async function authenticatePegawaiWithPassword(
  identifier: string,
  password: string
): Promise<{
  user: { id: string; nama: string; email: string; role: string; aktif: boolean };
  pegawai?: any;
}> {
  if (!password || password.trim().length === 0) {
    throw new Error("Password wajib diisi.");
  }

  const cleanId = identifier.trim();
  const cleanEmail = cleanId.toLowerCase();

  // 1. Cari di tabel Pegawai BPVP
  const pegawai = await prisma.pegawai.findFirst({
    where: {
      OR: [
        { email: { equals: cleanEmail, mode: "insensitive" } },
        { nip: cleanId },
      ],
    },
    include: {
      unitKerja: true,
      subUnitKerja: true,
      dirjen: true,
      statusPegawai: true,
      eselon: true,
    },
  });

  if (pegawai) {
    if (!pegawai.aktif) {
      throw new Error(
        `Akses Ditolak: Pegawai "${pegawai.nama}" (${pegawai.nip}) berstatus NONAKTIF (berada di tong sampah). Hubungi Administrator Kepegawaian BPVP.`
      );
    }

    const employeeEmail = pegawai.email?.toLowerCase().trim() || `${pegawai.nip}@bpvp.kemnaker.go.id`;

    // Cari akun User yang terhubung
    const user = await prisma.user.findUnique({
      where: { email: employeeEmail },
    });

    if (!user) {
      throw new Error(
        `Akun login untuk pegawai "${pegawai.nama}" (${pegawai.nip}) belum dibuat. Hubungi Administrator untuk membuat akun dan mengatur password.`
      );
    }

    if (!user.aktif) {
      throw new Error(
        `Akses Ditolak: Akun login pengguna untuk "${pegawai.nama}" telah dinonaktifkan oleh administrator.`
      );
    }

    // Verifikasi password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error("NIP/Email atau password salah. Silakan coba lagi.");
    }

    return { user, pegawai };
  }

  // 2. Fallback untuk administrator sistem (tabel User)
  const systemUser = await prisma.user.findUnique({
    where: { email: cleanEmail },
  });

  if (systemUser) {
    if (!systemUser.aktif) {
      throw new Error(`Akses Ditolak: Akun login "${systemUser.email}" dinonaktifkan.`);
    }

    const isPasswordValid = await bcrypt.compare(password, systemUser.password);
    if (!isPasswordValid) {
      throw new Error("Email atau password salah. Silakan coba lagi.");
    }

    return { user: systemUser };
  }

  // 3. Penolakan Orang Luar
  throw new Error(
    `Akses Ditolak: Email atau NIP "${identifier}" TIDAK TERDAFTAR dalam Data Manajemen Pegawai BPVP. Hanya ASN dan Pegawai resmi BPVP yang berhak mengakses Ekosistem SSO BPVP.`
  );
}

/**
 * Menerbitkan Token SSO Kriptografis Cross-App (HMAC-SHA256).
 */
export function generateSsoToken(
  user: { id: string; nama: string; email: string; role: string },
  pegawai?: any
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 8 * 3600; // Berlaku 8 jam

  const payload: SsoTokenPayload = {
    tokenId: crypto.randomBytes(12).toString("hex"),
    userId: user.id,
    pegawaiId: pegawai?.id,
    nip: pegawai?.nip || "-",
    nama: pegawai?.nama || user.nama,
    email: user.email,
    role: user.role,
    unitKerja: pegawai?.unitKerja?.label || "Balai Pelatihan Vokasi dan Produktivitas Banda Aceh",
    subUnitKerja: pegawai?.subUnitKerja?.label || (user.role === "admin" ? "Subbagian Umum" : "Operasional"),
    statusPegawai: pegawai?.statusPegawai?.label || "ASN Kemnaker",
    iat: now,
    exp,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SSO_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  return `${payloadBase64}.${signature}`;
}

/**
 * Memverifikasi Token SSO Kriptografis dan memastikan pegawai & user masih aktif di database.
 */
export async function verifySsoToken(tokenString: string): Promise<SsoTokenPayload> {
  if (!tokenString || typeof tokenString !== "string" || !tokenString.includes(".")) {
    throw new Error("Format token SSO tidak valid.");
  }

  const [payloadBase64, signature] = tokenString.split(".");
  const expectedSig = crypto
    .createHmac("sha256", SSO_SECRET)
    .update(payloadBase64)
    .digest("base64url");

  if (signature !== expectedSig) {
    throw new Error("Tanda tangan kriptografis token SSO tidak valid (kemungkinan telah diubah).");
  }

  let payload: SsoTokenPayload;
  try {
    const jsonStr = Buffer.from(payloadBase64, "base64url").toString("utf8");
    payload = JSON.parse(jsonStr);
  } catch {
    throw new Error("Isi token SSO rusak atau tidak dapat diuraikan.");
  }

  const now = Math.floor(Date.now() / 1000);
  if (payload.exp < now) {
    throw new Error("Token SSO telah kadaluarsa. Silakan lakukan autentikasi ulang.");
  }

  // Verifikasi status keaktifan di database
  if (payload.pegawaiId) {
    const currentPegawai = await prisma.pegawai.findUnique({
      where: { id: payload.pegawaiId },
    });
    if (!currentPegawai || !currentPegawai.aktif) {
      throw new Error("Akses Ditolak: Pegawai ini telah dinonaktifkan dari sistem BPVP.");
    }
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (!currentUser || !currentUser.aktif) {
    throw new Error("Akses Ditolak: Akun pengguna untuk sesi SSO ini telah dinonaktifkan.");
  }

  return payload;
}
