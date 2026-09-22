import { NextRequest, NextResponse } from "next/server";
import { validatePegawaiForSso, generateSsoToken } from "@/lib/sso-core";

export const dynamic = "force-dynamic";

/**
 * Callback handler Google OAuth 2.0.
 * 1. Menerima 'code' dari Google.
 * 2. Menukar 'code' dengan profil user Google (email & name).
 * 3. Memverifikasi ketat apakah email Google terdaftar di database Pegawai BPVP.
 * 4. Jika valid: terbitkan sso_token dan redirect ke callbackUrl aplikasi pemanggil (SIMPEG).
 * 5. Jika tidak terdaftar: tolak dan redirect kembali ke halaman depan SSO dengan notifikasi.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const stateRaw = searchParams.get("state");
  const errorParam = searchParams.get("error");

  // Pulihkan state callback
  let service = "simpeg";
  let callbackUrl = "https://simpegbpvp.vercel.app/auth/sso-callback";

  if (stateRaw) {
    try {
      const decoded = JSON.parse(
        Buffer.from(stateRaw, "base64url").toString("utf8")
      );
      if (decoded.service) service = decoded.service;
      if (decoded.callbackUrl) callbackUrl = decoded.callbackUrl;
    } catch {
      // fallback to default
    }
  }

  const baseErrorUrl = new URL("/", request.url);
  baseErrorUrl.searchParams.set("service", service);
  baseErrorUrl.searchParams.set("callbackUrl", callbackUrl);

  if (errorParam || !code) {
    baseErrorUrl.searchParams.set("error", "GoogleAuthCancelled");
    return NextResponse.redirect(baseErrorUrl);
  }

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    baseErrorUrl.searchParams.set("error", "GoogleOAuthConfigMissing");
    return NextResponse.redirect(baseErrorUrl);
  }

  try {
    const origin = request.nextUrl.origin;
    const redirectUri = `${origin}/api/auth/google/callback`;

    // 1. Tukar 'code' dengan Google Access Token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokenData = await tokenResponse.json();

    if (!tokenResponse.ok || !tokenData.access_token) {
      console.error("[Google OAuth] Gagal menukar kode token:", tokenData);
      baseErrorUrl.searchParams.set("error", "GoogleTokenExchangeFailed");
      return NextResponse.redirect(baseErrorUrl);
    }

    // 2. Ambil data profil Google pengguna
    const profileResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      }
    );

    const profile = await profileResponse.json();
    const email = profile?.email?.toLowerCase().trim();

    if (!email) {
      baseErrorUrl.searchParams.set("error", "GoogleEmailNotFound");
      return NextResponse.redirect(baseErrorUrl);
    }

    // 3. Verifikasi apakah email terdaftar di database Pegawai BPVP
    try {
      const { user, pegawai } = await validatePegawaiForSso(email);

      // 4. Terbitkan Token SSO Kriptografis (HMAC-SHA256)
      const token = generateSsoToken(user, pegawai);

      // Simpan sessionToken di database User master
      try {
        const { prisma } = await import("@/lib/prisma");
        const tokenExpiredAt = new Date((Math.floor(Date.now() / 1000) + 3600) * 1000);
        await prisma.user.update({
          where: { id: user.id },
          data: {
            sessionToken: token,
            tokenExpiredAt,
            lastLoginAt: new Date(),
          },
        });
      } catch (dbErr) {
        console.error("Gagal simpan sessionToken di User:", dbErr);
      }

      // 5. Redirect ke aplikasi klien (SIMPEG) dengan parameter sso_token
      const targetUrl = new URL(callbackUrl);
      targetUrl.searchParams.set("sso_token", token);
      return NextResponse.redirect(targetUrl);
    } catch (err: any) {
      // Email Google tidak ada di database Pegawai atau berstatus nonaktif
      console.warn(`[SSO Rejection] ${err?.message}`);
      baseErrorUrl.searchParams.set("error", "EmailTidakTerdaftar");
      baseErrorUrl.searchParams.set("email", email);
      return NextResponse.redirect(baseErrorUrl);
    }
  } catch (err: any) {
    console.error("[Google OAuth Callback Error]:", err);
    baseErrorUrl.searchParams.set("error", "GoogleAuthServerError");
    return NextResponse.redirect(baseErrorUrl);
  }
}
