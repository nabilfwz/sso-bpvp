import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

/**
 * Endpoint Sinkronisasi Sliding Session (Refresh Token).
 * Dipanggil oleh SIMPEG atau Aplikasi Satelit ketika sesi user diperpanjang karena aktivitas aktif.
 * Memperbarui sessionToken, tokenExpiredAt, dan lastLoginAt di database SSO lokal & cloud.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, email, token, tokenExpiredAt } = body;

    if (!email) {
      return NextResponse.json(
        { error: "Field 'email' wajib disertakan." },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanEmail = email.toLowerCase().trim();
    const expiry = tokenExpiredAt
      ? new Date(tokenExpiredAt)
      : new Date(Date.now() + 3600 * 1000);
    const now = new Date();

    // 1. Perbarui di tabel User Master SSO
    const updateMasterResult = await prisma.user.updateMany({
      where: {
        email: { equals: cleanEmail, mode: "insensitive" },
      },
      data: {
        sessionToken: token || undefined,
        tokenExpiredAt: expiry,
        lastLoginAt: now,
      },
    });

    // Jika user belum ada di tabel User SSO, coba sinkronkan dari SIMPEG
    if (updateMasterResult.count === 0) {
      try {
        const { validatePegawaiForSso } = await import("@/lib/sso-core");
        const res = await validatePegawaiForSso(cleanEmail);
        if (res?.user) {
          await prisma.user.update({
            where: { id: res.user.id },
            data: {
              sessionToken: token || undefined,
              tokenExpiredAt: expiry,
              lastLoginAt: now,
            },
          });
        }
      } catch (e) {
        console.warn("Could not auto-provision in SSO refresh:", e);
      }
    }

    // 2. Jika berasal dari aplikasi satelit tertentu, perbarui juga di tabel SatelliteUser
    if (appId && appId !== "simpeg") {
      await prisma.satelliteUser.updateMany({
        where: {
          appId,
          email: { equals: cleanEmail, mode: "insensitive" },
        },
        data: {
          sessionToken: token || undefined,
          tokenExpiredAt: expiry,
          lastLoginAt: now,
        },
      });
    }

    return NextResponse.json(
      {
        success: true,
        message: `Sesi token untuk ${cleanEmail} berhasil disinkronkan ke database SSO.`,
        tokenExpiredAt: expiry.toISOString(),
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Error POST /api/satellite/refresh:", error);
    return NextResponse.json(
      { error: error?.message || "Gagal menyinkronkan perpanjangan sesi di database SSO." },
      { status: 500, headers: corsHeaders }
    );
  }
}
