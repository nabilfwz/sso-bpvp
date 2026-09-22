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
 * Validasi identitas NIP / Email terhadap Database Manajemen Pegawai SIMPEG via API.
 * Hanya SSO yang berkomunikasi ke SIMPEG.
 * Orang luar dan pegawai nonaktif (di tong sampah) otomatis ditolak oleh SIMPEG.
 */
export async function validatePegawaiForSso(identifier: string): Promise<{
  user: { id: string; nama: string; email: string; role: string; aktif: boolean };
  pegawai?: any;
}> {
  const cleanId = identifier.trim();
  const simpegBaseUrl =
    process.env.SIMPEG_API_URL ||
    process.env.NEXT_PUBLIC_SIMPEG_URL ||
    "https://simpegbpvp.vercel.app";

  let simpegData: any = null;
  try {
    const res = await fetch(
      `${simpegBaseUrl}/api/sso/validate-pegawai?identifier=${encodeURIComponent(cleanId)}`,
      { cache: "no-store" }
    );
    const json = await res.json();

    if (!res.ok || !json.success) {
      throw new Error(
        json.error || `Akses Ditolak: Identitas "${identifier}" tidak valid atau berstatus nonaktif di SIMPEG.`
      );
    }
    simpegData = json;
  } catch (err: any) {
    throw new Error(err.message || `Gagal menghubungi server SIMPEG BPVP (${simpegBaseUrl}).`);
  }

  const employeeEmail = (
    simpegData.pegawai?.email ||
    simpegData.user?.email ||
    `${cleanId}@bpvp.kemnaker.go.id`
  ).toLowerCase().trim();

  const employeeNama = simpegData.pegawai?.nama || simpegData.user?.nama || "Pegawai BPVP";
  const assignedRole = simpegData.user?.role || "user";

  // Temukan atau sinkronkan akun User di database SSO lokal
  let user = await prisma.user.findUnique({
    where: { email: employeeEmail },
  });

  if (user) {
    if (!user.aktif) {
      throw new Error(
        `Akses Ditolak: Akun login pengguna untuk "${employeeNama}" telah dinonaktifkan di server SSO.`
      );
    }
  } else {
    const randomPassword = await bcrypt.hash(crypto.randomBytes(16).toString("hex"), 10);
    user = await prisma.user.create({
      data: {
        email: employeeEmail,
        nama: employeeNama,
        password: randomPassword,
        role: assignedRole,
        aktif: true,
      },
    });
  }

  return { user, pegawai: simpegData.pegawai };
}

/**
 * Autentikasi Pegawai/User SSO dengan verifikasi password.
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

  // 1. Validasi pegawai via SIMPEG API
  const { user, pegawai } = await validatePegawaiForSso(identifier);

  // 2. Verifikasi password di akun User lokal SSO
  const fullUser = await prisma.user.findUnique({
    where: { id: user.id },
  });
  if (!fullUser) {
    throw new Error("Akun pengguna tidak ditemukan di server SSO.");
  }
  const isPasswordValid = await bcrypt.compare(password, fullUser.password);
  if (!isPasswordValid) {
    throw new Error("NIP/Email atau password salah. Silakan coba lagi.");
  }

  return { user, pegawai };
}

/**
 * Menerbitkan Token SSO Kriptografis Cross-App (HMAC-SHA256).
 */
export function generateSsoToken(
  user: { id: string; nama: string; email: string; role: string },
  pegawai?: any
): string {
  const now = Math.floor(Date.now() / 1000);
  const exp = now + 1 * 3600; // Berlaku 1 jam (3600 detik)

  const payload: SsoTokenPayload = {
    tokenId: crypto.randomBytes(12).toString("hex"),
    userId: user.id,
    pegawaiId: pegawai?.id,
    nip: pegawai?.nip || "-",
    nama: pegawai?.nama || user.nama,
    email: user.email,
    role: user.role,
    unitKerja: pegawai?.unitKerja || "Balai Pelatihan Vokasi dan Produktivitas Banda Aceh",
    subUnitKerja: pegawai?.subUnitKerja || (user.role === "admin" ? "Subbagian Umum" : "Operasional"),
    statusPegawai: pegawai?.statusPegawai || "ASN Kemnaker",
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
 * Memverifikasi Token SSO Kriptografis.
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

  // Verifikasi keaktifan akun user di database SSO lokal
  const currentUser = await prisma.user.findUnique({
    where: { id: payload.userId },
  });
  if (currentUser && !currentUser.aktif) {
    throw new Error("Akses Ditolak: Akun pengguna untuk sesi SSO ini telah dinonaktifkan di server SSO.");
  }

  return payload;
}
