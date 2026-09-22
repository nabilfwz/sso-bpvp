import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Endpoint untuk mencabut (revoke) session token pada aplikasi satelit tertentu.
 * Menghapus/mengosongkan sessionToken dari baris SatelliteUser di database.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appId, email, token } = body;

    if (!appId) {
      return NextResponse.json(
        { error: "Field 'appId' wajib disertakan." },
        { status: 400 }
      );
    }

    if (!email && !token) {
      return NextResponse.json(
        { error: "Field 'email' atau 'token' wajib disertakan untuk mencabut sesi." },
        { status: 400 }
      );
    }

    if (email) {
      await prisma.satelliteUser.updateMany({
        where: {
          appId,
          email: email.toLowerCase(),
        },
        data: {
          sessionToken: null,
          tokenExpiredAt: null,
        },
      });
    } else if (token) {
      await prisma.satelliteUser.updateMany({
        where: {
          appId,
          sessionToken: token,
        },
        data: {
          sessionToken: null,
          tokenExpiredAt: null,
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: `Sesi token untuk aplikasi ${appId} berhasil dicabut dari database.`,
    });
  } catch (error: any) {
    console.error("Error POST /api/satellite/revoke:", error);
    return NextResponse.json(
      { error: "Gagal mencabut sesi token satelit." },
      { status: 500 }
    );
  }
}
