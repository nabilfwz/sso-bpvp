import { authenticatePegawaiWithPassword } from "../lib/sso-core";

async function runTests() {
  console.log("=== PENGUJIAN LOGIN EMAIL & PASSWORD SSO ===");

  // Test 1: Wrong password for admin@bpvp.local
  try {
    console.log("1. Menguji password salah...");
    await authenticatePegawaiWithPassword("admin@bpvp.local", "wrongpassword");
    console.error("❌ Test 1 Gagal: Seharusnya ditolak!");
  } catch (err: any) {
    console.log("✅ Test 1 Berhasil: Ditolak dengan pesan:", err.message);
  }

  // Test 2: Correct password for admin@bpvp.local (admin123)
  try {
    console.log("\n2. Menguji password benar (admin@bpvp.local : admin123)...");
    const result = await authenticatePegawaiWithPassword("admin@bpvp.local", "admin123");
    console.log("✅ Test 2 Berhasil: Login sukses!", {
      id: result.user.id,
      nama: result.user.nama,
      email: result.user.email,
      role: result.user.role,
    });
  } catch (err: any) {
    console.error("❌ Test 2 Gagal:", err.message);
  }

  // Test 3: Unregistered user
  try {
    console.log("\n3. Menguji akun tidak terdaftar...");
    await authenticatePegawaiWithPassword("orang.luar@gmail.com", "rahasia123");
    console.error("❌ Test 3 Gagal: Seharusnya ditolak!");
  } catch (err: any) {
    console.log("✅ Test 3 Berhasil: Ditolak dengan pesan:", err.message);
  }
}

runTests().finally(() => process.exit(0));
