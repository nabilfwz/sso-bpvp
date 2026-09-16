import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * Inisiasi Google OAuth 2.0 untuk Central SSO BPVP Banda Aceh.
 * Mengarahkan browser pengguna langsung ke halaman otentikasi Google resmi.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const service = searchParams.get("service") || "simpeg";
  const defaultSimpegUrl =
    process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
  const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallback;

  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    const errorUrl = new URL("/", request.url);
    errorUrl.searchParams.set("service", service);
    errorUrl.searchParams.set("callbackUrl", callbackUrl);
    errorUrl.searchParams.set("error", "GoogleOAuthConfigMissing");
    return NextResponse.redirect(errorUrl);
  }

  // Tentukan redirect_uri callback OAuth di server SSO ini
  const origin = request.nextUrl.origin;
  const redirectUri = `${origin}/api/auth/google/callback`;

  // Simpan state untuk dipulihkan setelah callback dari Google
  const statePayload = {
    service,
    callbackUrl,
  };
  const state = Buffer.from(JSON.stringify(statePayload)).toString("base64url");

  // Susun URL Google OAuth resmi
  const googleParams = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    state,
    prompt: "select_account",
    access_type: "online",
  });

  const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${googleParams.toString()}`;

  return NextResponse.redirect(googleAuthUrl);
}
