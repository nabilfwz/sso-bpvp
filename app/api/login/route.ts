import { NextRequest, NextResponse } from "next/server";
import { authenticatePegawaiWithPassword, generateSsoToken } from "@/lib/sso-core";

export const dynamic = "force-dynamic";

/**
 * Central SSO Login Endpoint.
 * Memverifikasi NIP / Email + Password terhadap Database Manajemen Pegawai BPVP.
 * Menerbitkan Token SSO Cross-App (HMAC-SHA256) & mengembalikan redirect URL ke client app.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = body?.identifier?.trim();
    const password = body?.password;
    const defaultSimpegUrl = process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
    const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
    const callbackUrl = body?.callbackUrl?.trim() || defaultCallback;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "NIP atau Email kedinasan wajib diisi." },
        { status: 400 }
      );
    }

    if (!password) {
      return NextResponse.json(
        { success: false, error: "Password wajib diisi." },
        { status: 400 }
      );
    }

    // Validasi ketat terhadap database Manajemen Pegawai BPVP + verifikasi password
    const { user, pegawai } = await authenticatePegawaiWithPassword(identifier, password);

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
