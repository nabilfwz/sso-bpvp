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
  {
    id: "absensi",
    nama: "Presensi & Absensi ASN",
    deskripsi: "Sistem Presensi Online & Rekapitulasi Kehadiran Pegawai",
    kategori: "Kepegawaian",
    url: "https://absensi-bpvp.vercel.app",
    icon: "⏱️",
    color: "from-violet-600 to-purple-800",
    badge: "Aplikasi Baru",
  },
];

/**
 * Mengambil daftar ekosistem aplikasi secara dinamis dari tabel Application di database SSO.
 */
export async function getEcosystemApps(): Promise<BpvpApp[]> {
  try {
    const dbApps = await prisma.application.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
    });

    if (dbApps && dbApps.length > 0) {
      return dbApps.map((a) => ({
        id: a.id,
        nama: a.nama,
        deskripsi: a.deskripsi || "",
        kategori: a.kategori,
        url: a.url,
        icon: a.icon || "📱",
        color: a.color || "from-blue-600 to-[#003399]",
        badge: a.badge || undefined,
      }));
    }
  } catch (error) {
    console.warn("Gagal membaca Application dari database, menggunakan fallback static:", error);
  }

  return BPVP_ECOSYSTEM_APPS;
}

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

  const cleanId = identifier.trim();
  const simpegBaseUrl =
    process.env.SIMPEG_API_URL ||
    process.env.NEXT_PUBLIC_SIMPEG_URL ||
    "https://simpegbpvp.vercel.app";

  let simpegData: any = null;
  let validationError = "";

  // 1. Cek autentikasi & validasi password langsung ke SIMPEG API
  try {
    const res = await fetch(`${simpegBaseUrl}/api/sso/validate-pegawai`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier: cleanId, password }),
      cache: "no-store",
    });
    const json = await res.json();
    if (res.ok && json.success) {
      simpegData = json;
    } else {
      validationError = json.error || "Email/NIP atau password salah.";
    }
  } catch (err: any) {
    console.warn("Gagal menghubungi SIMPEG API untuk validasi password:", err?.message);
  }

  // 2. Jika validasi SIMPEG berhasil
  if (simpegData) {
    const employeeEmail = (
      simpegData.pegawai?.email ||
      simpegData.user?.email ||
      `${cleanId}@bpvp.kemnaker.go.id`
    ).toLowerCase().trim();
    const employeeNama = simpegData.pegawai?.nama || simpegData.user?.nama || "Pegawai BPVP";
    const assignedRole = simpegData.user?.role || "user";

    // Sinkronkan ke tabel User di SSO lokal & perbarui password hash
    let ssoUser = await prisma.user.findUnique({
      where: { email: employeeEmail },
    });

    const hashedPassword = await bcrypt.hash(password, 10);

    if (ssoUser) {
      if (!ssoUser.aktif) {
        throw new Error(`Akses Ditolak: Akun "${employeeNama}" dinonaktifkan di server SSO.`);
      }
      await prisma.user.update({
        where: { id: ssoUser.id },
        data: {
          password: hashedPassword,
          nama: employeeNama,
          role: assignedRole,
        },
      });
      ssoUser.role = assignedRole;
    } else {
      ssoUser = await prisma.user.create({
        data: {
          email: employeeEmail,
          nama: employeeNama,
          password: hashedPassword,
          role: assignedRole,
          aktif: true,
        },
      });
    }

    return { user: ssoUser, pegawai: simpegData.pegawai };
  }

  // 3. Fallback: Cek database User lokal SSO (berguna jika SIMPEG offline atau akun lokal)
  const cleanEmail = cleanId.toLowerCase();
  const localUser = await prisma.user.findFirst({
    where: { email: cleanEmail },
  });

  if (localUser) {
    if (!localUser.aktif) {
      throw new Error(`Akses Ditolak: Akun "${localUser.email}" dinonaktifkan di server SSO.`);
    }
    const isPasswordValid = await bcrypt.compare(password, localUser.password);
    if (isPasswordValid) {
      return { user: localUser };
    }
  }

  throw new Error(validationError || "Email/NIP atau password yang Anda masukkan salah.");
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
