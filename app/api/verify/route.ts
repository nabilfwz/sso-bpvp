import { NextRequest, NextResponse } from "next/server";
import { verifySsoToken } from "@/lib/sso-core";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Public SSO Token Verification & JIT User Provisioning API.
 * Digunakan oleh SIMPEG, Skillhub, Maganghub, LSP, Keuangan, dan PTSP untuk memverifikasi keabsahan token SSO.
 * 
 * Arsitektur Hub-and-Spoke:
 * - Hanya endpoint SSO ini yang membaca database master SIMPEG (tabel Pegawai).
 * - Jika appId disertakan (aplikasi satelit), SSO secara otomatis melakukan Just-In-Time (JIT) Provisioning
 *   ke tabel SatelliteUser aplikasi tersebut dan menyimpan string sessionToken yang aktif.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get("token");
  const appId = searchParams.get("appId"); // e.g. "skillhub", "maganghub", "lsp", "keuangan", "ptsp"

  if (!token) {
    return NextResponse.json(
      { valid: false, error: "Parameter 'token' wajib disertakan." },
      { status: 400 }
    );
  }

  try {
    // 1. Verifikasi kriptografis token dan status keaktifan pegawai di SIMPEG
    const payload = await verifySsoToken(token);

    // 2. Just-In-Time (JIT) Provisioning ke tabel User lokal aplikasi satelit
    let satelliteUser = null;
    if (appId && appId !== "simpeg") {
      satelliteUser = await prisma.satelliteUser.upsert({
        where: {
          appId_email: {
            appId,
            email: payload.email.toLowerCase(),
          },
        },
        create: {
          appId,
          email: payload.email.toLowerCase(),
          nama: payload.nama,
          nip: payload.nip !== "-" ? payload.nip : null,
          role: payload.role || "user",
          sessionToken: token,
          tokenExpiredAt: new Date(payload.exp * 1000),
          lastLoginAt: new Date(),
          aktif: true,
        },
        update: {
          nama: payload.nama,
          nip: payload.nip !== "-" ? payload.nip : null,
          sessionToken: token,
          tokenExpiredAt: new Date(payload.exp * 1000),
          lastLoginAt: new Date(),
          aktif: true,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      message: "Token SSO terverifikasi dan pegawai berstatus aktif di database SIMPEG.",
      data: payload,
      satelliteUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Token SSO tidak valid atau telah kadaluarsa.",
      },
      { status: 401 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const token = body?.token;
    const appId = body?.appId;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: "Field 'token' wajib disertakan dalam request body." },
        { status: 400 }
      );
    }

    const payload = await verifySsoToken(token);

    let satelliteUser = null;
    if (appId && appId !== "simpeg") {
      satelliteUser = await prisma.satelliteUser.upsert({
        where: {
          appId_email: {
            appId,
            email: payload.email.toLowerCase(),
          },
        },
        create: {
          appId,
          email: payload.email.toLowerCase(),
          nama: payload.nama,
          nip: payload.nip !== "-" ? payload.nip : null,
          role: payload.role || "user",
          sessionToken: token,
          tokenExpiredAt: new Date(payload.exp * 1000),
          lastLoginAt: new Date(),
          aktif: true,
        },
        update: {
          nama: payload.nama,
          nip: payload.nip !== "-" ? payload.nip : null,
          sessionToken: token,
          tokenExpiredAt: new Date(payload.exp * 1000),
          lastLoginAt: new Date(),
          aktif: true,
        },
      });
    }

    return NextResponse.json({
      valid: true,
      message: "Token SSO terverifikasi dan pegawai berstatus aktif di database SIMPEG.",
      data: payload,
      satelliteUser,
    });
  } catch (error: any) {
    return NextResponse.json(
      {
        valid: false,
        error: error?.message || "Token SSO tidak valid atau telah kadaluarsa.",
      },
      { status: 401 }
    );
  }
}
