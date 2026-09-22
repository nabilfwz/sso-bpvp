import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

/**
 * Public Endpoint untuk membaca daftar Ekosistem Aplikasi BPVP yang aktif.
 * Digunakan oleh SIMPEG (App Switcher) dan portal aplikasi satelit.
 */
export async function GET(request: NextRequest) {
  try {
    const apps = await prisma.application.findMany({
      where: { aktif: true },
      orderBy: { urutan: "asc" },
      select: {
        id: true,
        nama: true,
        deskripsi: true,
        kategori: true,
        url: true,
        icon: true,
        color: true,
        badge: true,
        urutan: true,
      },
    });

    return NextResponse.json(
      {
        success: true,
        total: apps.length,
        apps,
      },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error("Gagal memuat aplikasi dari database SSO:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memuat daftar aplikasi dari database SSO." },
      { status: 500, headers: corsHeaders }
    );
  }
}
