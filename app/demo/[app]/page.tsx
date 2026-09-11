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
  const [errorMessage, setErrorMessage] = useState("");
  const [showInspector, setShowInspector] = useState(false);

  useEffect(() => {
    async function verify() {
      if (!ssoToken) {
        setLoading(false);
        setVerified(false);
        setErrorMessage("Token SSO tidak ditemukan di URL. Anda harus masuk terlebih dahulu melalui Portal SSO BPVP.");
        return;
      }

      setLoading(true);
      setErrorMessage("");

      try {
        const res = await fetch(`/api/verify?token=${encodeURIComponent(ssoToken)}`);
        const json = await res.json();

        if (res.ok && json.valid) {
          setVerified(true);
          setTokenData(json.data);
        } else {
          setVerified(false);
          setErrorMessage(json.error || "Token SSO tidak valid atau sudah kadaluarsa.");
        }
      } catch (err: any) {
        setVerified(false);
        setErrorMessage("Gagal menghubungi layanan verifikasi SSO BPVP.");
      } finally {
        setLoading(false);
      }
    }

    verify();
  }, [ssoToken, appKey]);

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
        {loading ? (
          <div className="bg-white rounded-2xl p-12 text-center shadow-md border border-slate-200 space-y-3">
            <RefreshCw className="w-8 h-8 text-[#003399] animate-spin mx-auto" />
            <h3 className="text-base font-bold text-slate-800">
              Memverifikasi Token SSO dengan Server Terpusat BPVP (Port 3001)...
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Sistem memeriksa tanda tangan kriptografis HMAC-SHA256 dan memastikan status keaktifan pegawai di database.
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
                    SSO Handshake Terverifikasi
                  </span>
                  <span className="text-xs text-emerald-200">
                    Masuk Tanpa Password Ulang
                  </span>
                </div>
                <h2 className="text-2xl font-extrabold text-white">
                  Selamat Datang, {tokenData.nama}!
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl leading-relaxed">
                  Anda berhasil masuk ke aplikasi <span className="font-bold text-amber-300">{currentApp.nama}</span> secara otomatis menggunakan Token Kredensial dari <span className="font-bold underline">Central SSO BPVP</span>.
                </p>
              </div>

              {/* Verified Badge Stamp */}
              <div className="bg-white/10 backdrop-blur-xs rounded-xl p-4 border border-white/20 text-center shrink-0 w-full md:w-auto">
                <p className="text-[10px] text-emerald-300 font-bold uppercase tracking-wider">
                  Status Verifikasi Pegawai
                </p>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-sm font-extrabold text-white">AKTIF &amp; RESMI</span>
                </div>
                <p className="text-[10px] text-slate-300 font-mono mt-1">
                  {tokenData.nip ? `NIP. ${tokenData.nip}` : "Administrator Sistem"}
                </p>
              </div>
            </div>

            {/* Profile & Employment Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Employee Summary Card */}
              <div className="bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#003399]" />
                  Identitas Pegawai Terverifikasi
                </h3>
                <div className="space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nama Lengkap</span>
                    <span className="font-bold text-slate-800 text-sm">{tokenData.nama}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Nomor Induk Pegawai (NIP)</span>
                    <span className="font-mono font-semibold text-slate-700">{tokenData.nip || "-"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Email Kedinasan</span>
                    <span className="font-semibold text-[#003399]">{tokenData.email}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Sub Unit Kerja</span>
                    <span className="font-semibold text-slate-700">{tokenData.subUnitKerja || "Subbagian Umum"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-semibold">Status Kepegawaian</span>
                    <span className="inline-block px-2 py-0.5 rounded bg-blue-50 text-[#003399] font-bold text-[11px] border border-blue-200">
                      {tokenData.statusPegawai || "ASN Kemnaker"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Cross-App Navigation Card */}
              <div className="md:col-span-2 bg-white rounded-2xl p-6 shadow-md border border-slate-200 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#003399]" />
                    Pindah Antar Aplikasi BPVP (Tanpa Login Lagi)
                  </h3>
                  <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Token Kriptografis Aktif
                  </span>
                </div>
                <p className="text-xs text-slate-600">
                  Pilih aplikasi ekosistem BPVP di bawah ini untuk berpindah langsung dengan sesi yang sama:
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
                        <p className="text-[10px] text-slate-500">Masuk ke Dashboard Pegawai</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-[#003399] transition-transform group-hover:translate-x-0.5" />
                  </a>

                  {/* Satellite Apps */}
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
                    Kadaluarsa: {new Date(tokenData.exp * 1000).toLocaleTimeString("id-ID")} WIB
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
          </div>
        ) : (
          /* REJECTION STATE */
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
                href={`/?service=${appKey}`}
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
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800 mt-8">
        <p className="font-medium text-slate-300">
          Ekosistem Aplikasi Digital BPVP Banda Aceh • Kementerian Ketenagakerjaan RI
        </p>
        <p className="mt-0.5 text-slate-500">
          Terintegrasi penuh dengan Central Single Sign-On (Port 3001)
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
