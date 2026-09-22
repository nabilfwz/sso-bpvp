import { prisma } from "../lib/prisma";

async function main() {
  console.log("===============================================================");
  console.log("         PENGECEKAN TABEL DATABASE POSTGRESQL (sso-bpvp)        ");
  console.log("===============================================================\n");

  // 1. Cek Tabel User SSO
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
  });
  console.log(`📌 TABEL USER (Total: ${users.length} User Terdaftar)`);
  if (users.length === 0) {
    console.log("   (Belum ada data user di tabel User)");
  } else {
    users.forEach((u, i) => {
      console.log(`   [${i + 1}] ID: ${u.id}`);
      console.log(`       Nama         : ${u.nama}`);
      console.log(`       Email        : ${u.email}`);
      console.log(`       Role         : ${u.role}`);
      console.log(`       Aktif        : ${u.aktif}`);
      console.log(`       Session Token: ${u.sessionToken ? u.sessionToken.slice(0, 35) + "..." : "(NULL / Belum Login)"}`);
      console.log(`       Token Expired: ${u.tokenExpiredAt ? u.tokenExpiredAt.toLocaleString("id-ID") : "-"}`);
      console.log(`       Last Login   : ${u.lastLoginAt ? u.lastLoginAt.toLocaleString("id-ID") : "-"}`);
      console.log(`       Created At   : ${u.createdAt.toLocaleString("id-ID")}\n`);
    });
  }

  // 2. Cek Tabel SatelliteUser (User Tiap Aplikasi Satelit)
  const satUsers = await prisma.satelliteUser.findMany({
    orderBy: { updatedAt: "desc" },
  });
  console.log(`\n📌 TABEL SATELLITE USER (Total: ${satUsers.length} User Satelit Terdaftar)`);
  if (satUsers.length === 0) {
    console.log("   (Belum ada data di tabel SatelliteUser)");
  } else {
    satUsers.forEach((s, i) => {
      console.log(`   [${i + 1}] ID: ${s.id}`);
      console.log(`       Aplikasi     : ${s.appId.toUpperCase()}`);
      console.log(`       Nama         : ${s.nama}`);
      console.log(`       Email        : ${s.email}`);
      console.log(`       NIP          : ${s.nip || "-"}`);
      console.log(`       Role Lokal   : ${s.role}`);
      console.log(`       Status Sesi  : ${s.sessionToken ? "🟢 AKTIF" : "🔴 LOGGED OUT / REVOKED"}`);
      console.log(`       Session Token: ${s.sessionToken ? s.sessionToken.slice(0, 35) + "..." : "(NULL)"}`);
      console.log(`       Token Expired: ${s.tokenExpiredAt ? s.tokenExpiredAt.toLocaleString("id-ID") : "-"}`);
      console.log(`       Last Login   : ${s.lastLoginAt ? s.lastLoginAt.toLocaleString("id-ID") : "-"}\n`);
    });
  }

  console.log("===============================================================");
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
