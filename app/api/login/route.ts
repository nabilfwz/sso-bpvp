import { NextRequest, NextResponse } from "next/server";
import { validatePegawaiForSso, generateSsoToken } from "@/lib/sso-core";

export const dynamic = "force-dynamic";

/**
 * Central SSO Login Endpoint.
 * Memverifikasi NIP / Email terhadap Database Manajemen Pegawai BPVP.
 * Menerbitkan Token SSO Cross-App (HMAC-SHA256) & mengembalikan redirect URL ke client app.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body?.identifier?.trim();
    const callbackUrl = body?.callbackUrl?.trim() || "http://localhost:3000/api/auth/sso/callback";

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "NIP atau Email kedinasan wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi ketat terhadap database Manajemen Pegawai BPVP
    // Orang luar dan pegawai nonaktif (di tong sampah) otomatis dilempar error
    const { user, pegawai } = await validatePegawaiForSso(identifier);

    // Terbitkan Token SSO
    const token = generateSsoToken(user, pegawai);

    // Susun redirect URL dengan melampirkan sso_token
    const urlObj = new URL(callbackUrl);
    urlObj.searchParams.set("sso_token", token);
    const redirectUrl = urlObj.toString();

    return NextResponse.json({
      success: true,
      token,
      redirectUrl,
      user: {
        id: user.id,
        nama: user.nama,
        email: user.email,
        role: user.role,
        nip: pegawai?.nip || "-",
        unitKerja: pegawai?.unitKerja?.label || "BPVP Banda Aceh",
      },
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error?.message || "Autentikasi SSO gagal.",
      },
      { status: 401 }
    );
  }
}
