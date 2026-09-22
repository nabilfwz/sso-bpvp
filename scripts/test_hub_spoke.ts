import { validatePegawaiForSso, generateSsoToken, verifySsoToken } from "../lib/sso-core";
import { prisma } from "../lib/prisma";

async function main() {
  console.log("=================================================");
  console.log("TESTING HUB-AND-SPOKE SSO ARCHITECTURE (API-DRIVEN)");
  console.log("=================================================");

  // 1. Uji Validasi Pegawai via SIMPEG API
  const testNip = "198204122008011005"; // Iskandar Muda
  console.log(`[SSO Hub] Menguji validasi pegawai ke SIMPEG API: NIP ${testNip}...`);
  const { user, pegawai } = await validatePegawaiForSso(testNip);
  console.log(`[SSO Hub] Validasi sukses! Nama: ${pegawai?.nama} | Email: ${user.email}`);
  console.log(`[SSO Local DB] User ID di database sso-bpvp: ${user.id}`);

  // 2. Terbitkan Token Kriptografis
  const token = generateSsoToken(user, pegawai);
  console.log(`[SSO Hub] Token SSO diterbitkan: ${token.slice(0, 25)}...`);

  // 3. Simpan sessionToken di User SSO lokal
  await prisma.user.update({
    where: { id: user.id },
    data: {
      sessionToken: token,
      tokenExpiredAt: new Date(Date.now() + 3600 * 1000),
      lastLoginAt: new Date(),
    },
  });
  console.log(`[SSO Local DB] sessionToken berhasil disimpan di tabel User lokal SSO.`);

  // 4. Verifikasi Token
  const payload = await verifySsoToken(token);
  console.log(`[SSO Hub] Verifikasi token sukses untuk: ${payload.nama}`);

  // 5. Just-In-Time Provisioning ke Tabel User Satelit (Skillhub)
  console.log(`\n--- Pengujian Aplikasi Satelit: Skillhub ---`);
  const satUser = await prisma.satelliteUser.upsert({
    where: {
      appId_email: {
        appId: "skillhub",
        email: payload.email.toLowerCase(),
      },
    },
    create: {
      appId: "skillhub",
      email: payload.email.toLowerCase(),
      nama: payload.nama,
      nip: payload.nip !== "-" ? payload.nip : null,
      role: "instruktur",
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

  console.log(`[Skillhub DB Lokal] Row SatelliteUser berhasil dibuat/disinkron:`);
  console.log(`  - ID: ${satUser.id}`);
  console.log(`  - App ID: ${satUser.appId}`);
  console.log(`  - Email: ${satUser.email}`);
  console.log(`  - Nama: ${satUser.nama}`);
  console.log(`  - NIP: ${satUser.nip}`);
  console.log(`  - Role: ${satUser.role}`);
  console.log(`  - SessionToken Tersimpan: ${satUser.sessionToken ? "YA (Ada)" : "TIDAK"}`);

  // 6. Pengujian Pencabutan Token (Revocation)
  console.log(`\n--- Pengujian Revoke Session Token ---`);
  await prisma.satelliteUser.update({
    where: { id: satUser.id },
    data: { sessionToken: null, tokenExpiredAt: null },
  });
  const afterRevoke = await prisma.satelliteUser.findUnique({ where: { id: satUser.id } });
  console.log(`[Skillhub DB Lokal] Status token setelah di-revoke: ${afterRevoke?.sessionToken ?? "NULL (Berhasil Ter-logout)"}`);

  console.log("\n=================================================");
  console.log("SEMUA PENGUJIAN HUB-AND-SPOKE & JIT BERHASIL 100%!");
  console.log("=================================================");
}

main()
  .catch((err) => {
    console.error("TEST FAILED:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
