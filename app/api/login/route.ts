import { NextRequest, NextResponse } from "next/server";
import { validatePegawaiForSso, authenticatePegawaiWithPassword, generateSsoToken } from "@/lib/sso-core";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Central SSO Login Endpoint (Email + Password ATAU Passwordless).
 * Memverifikasi kredensial terhadap Database Pegawai BPVP.
 * Menerbitkan Token SSO Cross-App (HMAC-SHA256) & mengembalikan redirect URL ke client app.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const identifier = (body?.identifier || body?.email)?.trim();
    const password = body?.password?.trim();
    const defaultSimpegUrl =
      process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
    const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
    const callbackUrl = body?.callbackUrl?.trim() || defaultCallback;

    if (!identifier) {
      return NextResponse.json(
        { success: false, error: "Email atau NIP wajib disertakan." },
        { status: 400 }
      );
    }

    // Jika password disertakan, verifikasi kredensial password
    // Jika tidak ada password (misal login token khusus), gunakan validatePegawaiForSso
    let authResult: { user: any; pegawai?: any };
    if (password) {
      authResult = await authenticatePegawaiWithPassword(identifier, password);
    } else {
      authResult = await validatePegawaiForSso(identifier);
    }
    const { user, pegawai } = authResult;

    // Terbitkan Token SSO
    const token = generateSsoToken(user, pegawai);

    // Simpan sessionToken di tabel User database
    const tokenExpiredAt = new Date((Math.floor(Date.now() / 1000) + 3600) * 1000);
    await prisma.user.update({
      where: { id: user.id },
      data: {
        sessionToken: token,
        tokenExpiredAt,
        lastLoginAt: new Date(),
      },
    });

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
