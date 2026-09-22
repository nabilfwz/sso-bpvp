import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function OPTIONS() {
  return new NextResponse(null, { status: 204 });
}

/**
 * Endpoint untuk melihat daftar User Lokal aplikasi satelit tertentu (misal: Skillhub, Maganghub, dll).
 * Digunakan untuk visualisasi bahwa tiap aplikasi satelit memiliki tabel User tersendiri dengan sessionToken yang tersimpan.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const appId = searchParams.get("appId");

    if (!appId) {
      return NextResponse.json(
        { error: "Parameter 'appId' wajib disertakan." },
        { status: 400 }
      );
    }

    const users = await prisma.satelliteUser.findMany({
      where: { appId },
      orderBy: { updatedAt: "desc" },
    });

    const now = new Date();
    const enrichedUsers = users.map((u) => ({
      id: u.id,
      appId: u.appId,
      email: u.email,
      nama: u.nama,
      nip: u.nip,
      role: u.role,
      hasActiveSession: !!(u.sessionToken && u.tokenExpiredAt && u.tokenExpiredAt > now),
      sessionTokenPreview: u.sessionToken
        ? `${u.sessionToken.slice(0, 16)}...${u.sessionToken.slice(-12)}`
        : null,
      fullSessionToken: u.sessionToken,
      tokenExpiredAt: u.tokenExpiredAt,
      lastLoginAt: u.lastLoginAt,
      aktif: u.aktif,
      createdAt: u.createdAt,
      updatedAt: u.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      appId,
      count: users.length,
      users: enrichedUsers,
    });
  } catch (error: any) {
    console.error("Error GET /api/satellite/users:", error);
    return NextResponse.json(
      { error: "Gagal memuat daftar user satelit." },
      { status: 500 }
    );
  }
}
