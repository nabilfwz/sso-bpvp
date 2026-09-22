"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldAlert,
  KeyRound,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  Layers,
  ChevronRight,
  Info,
  Database,
  ShieldCheck,
  LogOut,
  Copy,
  Check,
  Server,
  ArrowRight,
} from "lucide-react";

interface AppConfig {
  id: string;
  nama: string;
  singkatan: string;
  tagline: string;
  kategori: string;
  color: string;
  bannerColor: string;
  icon: string;
  defaultRole: string;
}

const APPS_META: Record<string, AppConfig> = {
  skillhub: {
    id: "skillhub",
    nama: "Skillhub BPVP Banda Aceh",
    singkatan: "Skillhub",
    tagline: "Platform Pelatihan Vokasi, Kurikulum Industri, & Peningkatan Produktivitas",
    kategori: "Pelatihan Vokasi",
    color: "from-emerald-600 to-teal-800",
    bannerColor: "bg-gradient-to-r from-emerald-800 via-teal-900 to-slate-900",
    icon: "🎓",
    defaultRole: "Instruktur Pelatihan",
  },
  maganghub: {
    id: "maganghub",
    nama: "Maganghub BPVP Banda Aceh",
    singkatan: "Maganghub",
    tagline: "Sistem Manajemen & Penempatan Pemagangan Dalam/Luar Negeri",
    kategori: "Pemagangan Kerja",
    color: "from-amber-600 to-orange-800",
    bannerColor: "bg-gradient-to-r from-amber-900 via-orange-950 to-slate-900",
    icon: "🏢",
    defaultRole: "Pembimbing Industri",
  },
  lsp: {
    id: "lsp",
    nama: "LSP-P1 BPVP Banda Aceh",
    singkatan: "LSP-P1",
    tagline: "Lembaga Sertifikasi Profesi Pihak Pertama Lisensi BNSP",
    kategori: "Sertifikasi Profesi",
    color: "from-indigo-600 to-purple-800",
    bannerColor: "bg-gradient-to-r from-indigo-900 via-purple-950 to-slate-900",
    icon: "🏅",
    defaultRole: "Asesor Sertifikasi",
  },
  keuangan: {
    id: "keuangan",
    nama: "Keuangan & BMN BPVP Banda Aceh",
    singkatan: "Keuangan-BMN",
    tagline: "Sistem Pengelolaan Anggaran DIPA, Perbendaharaan, & Barang Milik Negara",
    kategori: "Tata Usaha & Keuangan",
    color: "from-cyan-600 to-blue-800",
    bannerColor: "bg-gradient-to-r from-cyan-900 via-blue-950 to-slate-900",
    icon: "💰",
    defaultRole: "Pengelola Keuangan",
  },
  ptsp: {
    id: "ptsp",
    nama: "Kios Siap Kerja / PTSP BPVP",
    singkatan: "PTSP BPVP",
    tagline: "Pelayanan Terpadu Satu Pintu Informasi Pasar Kerja & Konseling Vokasi",
    kategori: "Pelayanan Publik",
    color: "from-rose-600 to-pink-800",
    bannerColor: "bg-gradient-to-r from-rose-900 via-pink-950 to-slate-900",
    icon: "🏛️",
    defaultRole: "Petugas Front Office",
  },
};

function SatelliteContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const router = useRouter();

  const appKey = (params.app as string) || "skillhub";
  const ssoToken = searchParams.get("sso_token") || "";

  const currentApp = APPS_META[appKey] || APPS_META.skillhub;

  const [loading, setLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [tokenData, setTokenData] = useState<any>(null);
  const [satelliteUserData, setSatelliteUserData] = useState<any>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [showInspector, setShowInspector] = useState(false);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [loadingDb, setLoadingDb] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fetch all users currently in this satellite's local User table
  async function loadSatelliteUsers() {
    setLoadingDb(true);
    try {
      const res = await fetch(`/api/satellite/users?appId=${encodeURIComponent(appKey)}`);
      const json = await res.json();
      if (json.success) {
        setDbUsers(json.users || []);
      }
    } catch (e) {
      console.error("Gagal memuat tabel user satelit:", e);
    } finally {
      setLoadingDb(false);
    }
  }

  useEffect(() => {
    async function verify() {
      if (!ssoToken) {
        setLoading(false);
        setVerified(false);
        setErrorMessage("Token SSO tidak ditemukan di URL. Anda harus masuk terlebih dahulu melalui Portal SSO BPVP.");
        loadSatelliteUsers();
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        // Hub-and-Spoke verification: satelit hanya memanggil API SSO
        // SSO yang akan cek keaktifan pegawai di SIMPEG dan melakukan JIT provisioning ke tabel SatelliteUser
        const res = await fetch(`/api/verify?token=${encodeURIComponent(ssoToken)}&appId=${encodeURIComponent(appKey)}`);
        const json = await res.json();

        if (res.ok && json.valid) {
          setVerified(true);
          setTokenData(json.data);
          setSatelliteUserData(json.satelliteUser);
        } else {
          setVerified(false);
          setErrorMessage(json.error || "Token SSO tidak valid atau sudah kadaluarsa.");
        }
      } catch (err: any) {
        setVerified(false);
        setErrorMessage("Gagal menghubungi layanan verifikasi SSO BPVP.");
      } finally {
        setLoading(false);
        loadSatelliteUsers();
      }
    }

    verify();
  }, [ssoToken, appKey]);

  // Handle revoking satellite session token
  async function handleRevokeSession() {
    if (!confirm("Apakah Anda yakin ingin mencabut sesi token di database aplikasi ini?")) return;

    setRevoking(true);
    try {
      const res = await fetch("/api/satellite/revoke", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appId: appKey, token: ssoToken, email: tokenData?.email }),
      });
      const json = await res.json();

      if (json.success) {
        setVerified(false);
        setErrorMessage("Sesi lokal aplikasi ini telah dicabut (Revoked). Token di database telah dikosongkan.");
        await loadSatelliteUsers();
      } else {
        alert("Gagal mencabut sesi: " + json.error);
      }
    } catch (e: any) {
      alert("Error: " + e.message);
    } finally {
      setRevoking(false);
    }
  }

  const copyToken = () => {
    if (!ssoToken) return;
    navigator.clipboard.writeText(ssoToken);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-between">
      {/* Top Banner App Identity */}
      <header className={`${currentApp.bannerColor} text-white py-3.5 px-6 shadow-md border-b-2 border-amber-400`}>
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-2xl shadow-xs">
              {currentApp.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm sm:text-base font-extrabold tracking-wide uppercase text-white">
                  {currentApp.nama}
                </h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400 text-blue-950 uppercase">
                  Satelit SSO BPVP
                </span>
              </div>
              <p className="text-xs text-blue-200 line-clamp-1">{currentApp.tagline}</p>
            </div>
          </div>

          {/* User pill or Login button */}
          <div className="flex items-center gap-3">
            {verified && tokenData ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-bold text-white leading-tight">{tokenData.nama}</p>
                  <p className="text-[10px] text-amber-300 font-medium">
                    {tokenData.nip ? `NIP. ${tokenData.nip}` : tokenData.role.toUpperCase()}
                  </p>
                </div>
                <div className="w-8 h-8 rounded-full bg-white/20 border border-amber-400 flex items-center justify-center font-bold text-xs text-amber-300">
                  {tokenData.nama?.slice(0, 2).toUpperCase() || "BP"}
                </div>
                <button
                  onClick={handleRevokeSession}
                  disabled={revoking}
                  className="px-2.5 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition shadow-xs cursor-pointer"
                  title="Cabut sesi token di database lokal"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Logout Satelit</span>
                </button>
              </div>
            ) : (
              <Link
                href={`/?service=${appKey}&callbackUrl=${encodeURIComponent(`http://localhost:3001/demo/${appKey}`)}`}
                className="px-3 py-1.5 bg-amber-400 hover:bg-amber-300 text-blue-950 text-xs font-bold rounded-lg transition shadow-xs"
              >
                Login via SSO BPVP
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-6 space-y-6">
        
        {/* Hub-and-Spoke Topology Security Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-blue-800/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-blue-300 shrink-0">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                  Arsitektur Hub-and-Spoke Terisolasi
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 font-semibold">
                  Keamanan Terpadu
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5">
                Aplikasi <strong>{currentApp.singkatan}</strong> hanya berkomunikasi dengan <strong>Central SSO BPVP</strong>. Master database SIMPEG dilindungi dan hanya diakses oleh SSO.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-[11px] font-mono bg-black/40 px-3 py-2 rounded-xl border border-white/10 shrink-0">
            <span className="text-emerald-400 font-bold">{currentApp.singkatan}</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-amber-300 font-bold">SSO Gateway</span>
            <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-blue-400 font-bold">SIMPEG Master DB</span>
          </div>
        </div>

        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-slate-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#003399] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Memverifikasi Token SSO &amp; Menyinkronkan Database User Lokal...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sistem memeriksa tanda tangan kriptografis HMAC-SHA256, memastikan pegawai aktif di SIMPEG, dan membuat baris user lokal secara Just-In-Time.
            </p>
          </div>
        ) : verified && tokenData ? (
          /* SUCCESS STATE */
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* Success Hero Banner */}
            <div className="bg-gradient-to-r from-emerald-900 via-teal-950 to-slate-900 rounded-2xl p-6 text-white shadow-xl border border-emerald-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-400/40">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    SSO Handshake &amp; JIT Provisioning Sukses
                  </span>
                  <span className="text-xs text-emerald-200">
                    Status Pegawai SIMPEG: <strong>Aktif</strong>
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Selamat Datang, {tokenData.nama}!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                  Akun Anda di aplikasi <span className="font-bold text-amber-300">{currentApp.nama}</span> telah dibuat/disinkronkan ke database lokal, dan <span className="font-bold underline">sessionToken</span> aktif telah disimpan di baris user Anda.
                </p>
              </div>

              {/* Actions Box */}
              <div className="flex flex-col sm:flex-row md:flex-col gap-2 shrink-0 w-full md:w-auto">
                <button
                  onClick={copyToken}
                  className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-amber-300" />}
                  <span>{copied ? "Token Disalin!" : "Salin Token SSO"}</span>
                </button>

                <button
                  onClick={handleRevokeSession}
                  disabled={revoking}
                  className="px-3.5 py-2 rounded-xl bg-red-600/80 hover:bg-red-600 border border-red-500 text-xs font-semibold flex items-center justify-center gap-2 transition cursor-pointer text-white"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{revoking ? "Mencabut Sesi..." : "Cabut Sesi di DB"}</span>
                </button>
              </div>
            </div>

            {/* Profile & Employment Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee Summary Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#003399]" />
                  Profil User Terverifikasi
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Lengkap</span>
                    <span className="font-bold text-slate-800 text-sm">{tokenData.nama}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">NIP</span>
                    <span className="font-mono font-semibold text-slate-700">{tokenData.nip || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email</span>
                    <span className="font-semibold text-[#003399]">{tokenData.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Role di {currentApp.singkatan}</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-amber-50 text-amber-800 font-bold text-[11px] border border-amber-200">
                      {satelliteUserData?.role || currentApp.defaultRole}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Session Token di DB</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 font-bold text-[11px] border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Tersimpan &amp; Aktif
                    </span>
                  </div>
                </div>
              </div>

              {/* Cross-App Navigation Card */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#003399]" />
                    Pindah Antar Aplikasi BPVP (JIT Provisioning Otomatis)
                  </h3>
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Token Kriptografis Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Lompat ke aplikasi satelit lain. Masing-masing aplikasi akan otomatis membuat row user lokal di databasenya sendiri:
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  {/* SIMPEG BPVP (Client App) */}
                  <a
                    href={`${process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app"}/api/auth/sso/callback?sso_token=${encodeURIComponent(ssoToken)}`}
                    className="p-3.5 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-blue-50/50 transition-all flex items-center justify-between group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-blue-100 text-[#003399] font-bold flex items-center justify-center text-lg shrink-0 group-hover:bg-[#003399] group-hover:text-white transition-colors">
                        👥
                      </div>
                      <div>
                        <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#003399]">
                          SIMPEG BPVP
                        </h4>
                        <p className="text-[10px] text-slate-500">Aplikasi Utama Kepegawaian</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#003399] transition-transform group-hover:translate-x-0.5" />
                  </a>

                  {/* Other Satellite Apps */}
                  {Object.values(APPS_META)
                    .filter((a) => a.id !== currentApp.id)
                    .map((a) => (
                      <Link
                        key={a.id}
                        href={`/demo/${a.id}?sso_token=${encodeURIComponent(ssoToken)}`}
                        className="p-3.5 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-slate-50 transition-all flex items-center justify-between group"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-slate-100 text-slate-800 font-bold flex items-center justify-center text-lg shrink-0 group-hover:scale-105 transition-transform">
                            {a.icon}
                          </div>
                          <div>
                            <h4 className="font-bold text-xs text-slate-800 group-hover:text-[#003399]">
                              {a.singkatan}
                            </h4>
                            <p className="text-[10px] text-slate-500">{a.kategori}</p>
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#003399] transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    ))}
                </div>

                {/* Token Inspector Toggle */}
                <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setShowInspector(!showInspector)}
                    className="text-xs font-semibold text-[#003399] hover:underline flex items-center gap-1.5 cursor-pointer"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    {showInspector ? "Sembunyikan Rincian Teknis Token" : "Periksa Payload Kriptografis Token SSO"}
                  </button>
                  <span className="text-[11px] text-slate-400 font-mono">
                    Kadaluarsa: {new Date(tokenData.exp * 1000).toLocaleTimeString("id-ID", { timeZone: "Asia/Jakarta" })} WIB
                  </span>
                </div>
              </div>
            </div>

            {/* Token Inspector Box */}
            {showInspector && (
              <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 shadow-xl border border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-2">
                    <KeyRound className="w-4 h-4" />
                    Decoded Cross-App SSO Claims (HMAC-SHA256 Signed)
                  </h4>
                  <span className="text-[10px] font-mono bg-slate-800 text-slate-300 px-2 py-0.5 rounded">
                    Algoritma: HS256
                  </span>
                </div>
                <pre className="p-4 bg-black/50 rounded-xl text-xs font-mono text-emerald-400 overflow-x-auto border border-slate-800">
                  {JSON.stringify(tokenData, null, 2)}
                </pre>
              </div>
            )}

            {/* LIVE DATABASE USER TABLE (Tabel User Lokal Aplikasi Ini) */}
            <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
                <div>
                  <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                    <Database className="w-4 h-4 text-emerald-600" />
                    Tabel User Lokal: <span className="text-[#003399]">{currentApp.nama}</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Data tersimpan langsung di database PostgreSQL (<code className="text-slate-700 bg-slate-100 px-1 py-0.5 rounded">sso-bpvp.SatelliteUser</code>) dengan sessionToken aktif.
                  </p>
                </div>
                <button
                  onClick={loadSatelliteUsers}
                  disabled={loadingDb}
                  className="self-start sm:self-auto px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loadingDb ? "animate-spin" : ""}`} />
                  <span>Refresh Tabel</span>
                </button>
              </div>

              {dbUsers.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300 text-slate-500 text-xs">
                  Belum ada user yang terdaftar di tabel aplikasi ini. Masuk melalui SSO untuk membuat akun otomatis.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase tracking-wider text-[10px]">
                      <tr>
                        <th className="p-3">Nama Pegawai &amp; NIP</th>
                        <th className="p-3">Email</th>
                        <th className="p-3">Role Lokal</th>
                        <th className="p-3">Session Token di Database</th>
                        <th className="p-3">Status Sesi</th>
                        <th className="p-3 text-right">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dbUsers.map((u) => {
                        const isCurrentUser = tokenData?.email?.toLowerCase() === u.email.toLowerCase();
                        return (
                          <tr key={u.id} className={isCurrentUser ? "bg-blue-50/50" : "hover:bg-slate-50"}>
                            <td className="p-3">
                              <div className="font-bold text-slate-800 flex items-center gap-1.5">
                                {u.nama}
                                {isCurrentUser && (
                                  <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-blue-600 text-white font-bold">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="font-mono text-[10px] text-slate-500">{u.nip || "-"}</span>
                            </td>
                            <td className="p-3 font-mono text-slate-600">{u.email}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 font-semibold text-[10px] border border-slate-200">
                                {u.role}
                              </span>
                            </td>
                            <td className="p-3">
                              {u.sessionTokenPreview ? (
                                <span className="font-mono text-[10px] bg-slate-100 px-2 py-1 rounded text-slate-700 border border-slate-200" title={u.fullSessionToken}>
                                  {u.sessionTokenPreview}
                                </span>
                              ) : (
                                <span className="text-slate-400 italic text-[10px]">Tidak ada token (Logged Out)</span>
                              )}
                            </td>
                            <td className="p-3">
                              {u.hasActiveSession ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                  Aktif
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-medium">
                                  Revoked / Nonaktif
                                </span>
                              )}
                            </td>
                            <td className="p-3 text-right">
                              {u.sessionTokenPreview && (
                                <button
                                  onClick={async () => {
                                    if (!confirm(`Cabut token untuk ${u.email}?`)) return;
                                    await fetch("/api/satellite/revoke", {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ appId: appKey, email: u.email }),
                                    });
                                    if (isCurrentUser) setVerified(false);
                                    loadSatelliteUsers();
                                  }}
                                  className="text-red-600 hover:text-red-800 hover:underline text-[11px] font-semibold cursor-pointer"
                                >
                                  Revoke
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

          </div>
        ) : (
          /* REJECTION STATE */
          <div className="space-y-6">
            <div className="max-w-2xl mx-auto bg-white rounded-2xl p-8 shadow-xl border border-red-200 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-red-100 border-2 border-red-300 flex items-center justify-center mx-auto text-red-600">
                <ShieldAlert className="w-8 h-8" />
              </div>

              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold uppercase tracking-wider">
                  Akses Ditolak
                </span>
                <h2 className="text-xl font-extrabold text-slate-900">
                  Autentikasi SSO BPVP Gagal
                </h2>
                <p className="text-xs sm:text-sm text-red-700 bg-red-50 p-4 rounded-xl border border-red-200 leading-relaxed font-medium">
                  {errorMessage}
                </p>
              </div>

              <div className="text-xs text-slate-600 space-y-2 text-left bg-slate-50 p-4 rounded-xl border border-slate-200">
                <p className="font-bold text-slate-800 flex items-center gap-1.5">
                  <Info className="w-4 h-4 text-[#003399]" />
                  Aturan Keamanan SSO Ekosistem BPVP:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-600">
                  <li>Hanya ASN / Pegawai yang <strong>terdaftar</strong> di SIMPEG BPVP yang berhak mengakses ekosistem.</li>
                  <li>Orang luar atau email eksternal non-pegawai otomatis <strong>ditolak</strong>.</li>
                  <li>Pegawai dengan status <strong>nonaktif</strong> (berada di tong sampah) tidak dapat mengakses aplikasi.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link
                  href={`/?service=${appKey}&callbackUrl=${encodeURIComponent(`http://localhost:3001/demo/${appKey}`)}`}
                  className="w-full sm:w-auto bg-[#003399] hover:bg-[#002266] text-white font-bold text-xs h-10 px-6 rounded-lg flex items-center justify-center shadow-md transition"
                >
                  Masuk via Central SSO BPVP
                </Link>
                <a
                  href={process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app"}
                  className="w-full sm:w-auto border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs h-10 px-5 rounded-lg flex items-center justify-center transition"
                >
                  Kembali ke SIMPEG BPVP
                </a>
              </div>
            </div>

            {/* Live DB Table even in rejection / unauthenticated state */}
            {dbUsers.length > 0 && (
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4 max-w-4xl mx-auto">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Database className="w-4 h-4 text-slate-500" />
                    Tabel User Terdaftar di {currentApp.singkatan} ({dbUsers.length} Pengguna)
                  </h3>
                  <button
                    onClick={loadSatelliteUsers}
                    className="text-xs text-[#003399] hover:underline flex items-center gap-1"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingDb ? "animate-spin" : ""}`} /> Refresh
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                      <tr>
                        <th className="p-2.5">Nama &amp; NIP</th>
                        <th className="p-2.5">Email</th>
                        <th className="p-2.5">Status Sesi di DB</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {dbUsers.map((u) => (
                        <tr key={u.id}>
                          <td className="p-2.5 font-semibold text-slate-800">{u.nama} ({u.nip || "-"})</td>
                          <td className="p-2.5 font-mono text-slate-600">{u.email}</td>
                          <td className="p-2.5">
                            {u.hasActiveSession ? (
                              <span className="text-emerald-700 font-bold text-[10px]">● Sesi Aktif</span>
                            ) : (
                              <span className="text-slate-400 text-[10px]">Tidak ada sesi aktif</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800 mt-8">
        <p className="font-medium text-slate-300">
          Ekosistem Aplikasi Digital BPVP Banda Aceh • Kementerian Ketenagakerjaan RI
        </p>
        <p className="mt-0.5 text-slate-500">
          Arsitektur Hub-and-Spoke Terisolasi: Satelit &rarr; SSO Gateway &rarr; SIMPEG Master DB
        </p>
      </footer>
    </div>
  );
}

export default function SatellitePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="p-6 bg-white rounded-xl shadow-md border text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Menghubungkan ke Aplikasi Ekosistem BPVP...</p>
          </div>
        </div>
      }
    >
      <SatelliteContent />
    </Suspense>
  );
}
