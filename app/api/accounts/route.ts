import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Endpoint daftar akun ASN terdaftar & aktif untuk kemudahan pengujian SSO.
 */
export async function GET() {
  try {
    const users = await prisma.user.findMany({
      where: { aktif: true },
      select: { id: true, nama: true, email: true, role: true },
      orderBy: { role: "asc" },
    });

    const pegawais = await prisma.pegawai.findMany({
      where: { aktif: true },
      select: {
        id: true,
        nip: true,
        nama: true,
        email: true,
        subUnitKerja: { select: { id: true, label: true } },
        eselon: { select: { id: true, label: true } },
        statusPegawai: { select: { id: true, label: true } },
      },
      orderBy: { nip: "asc" },
    });

    return NextResponse.json({
      users,
      pegawais,
    });
  } catch (error) {
    console.error("Error GET /api/accounts in sso-bpvp:", error);
    return NextResponse.json(
      { error: "Gagal memuat akun SSO" },
      { status: 500 }
    );
  }
}
