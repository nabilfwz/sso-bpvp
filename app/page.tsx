"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  UserCheck,
  KeyRound,
  CheckCircle2,
  Search,
  Loader2,
  ShieldAlert,
  Layers,
  ArrowRight,
} from "lucide-react";

interface ASNAccount {
  id: string;
  nama: string;
  email: string;
  nip?: string;
  role: string;
  subUnit?: string;
  statusPegawai?: string;
}

function SsoPortalContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "simpeg";
  const defaultSimpegUrl =
    process.env.NEXT_PUBLIC_SIMPEG_URL ||
    (process.env.NODE_ENV === "production"
      ? "https://simpegbpvp.vercel.app"
      : "http://localhost:3000");
  const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallback;

  const [activeTab, setActiveTab] = useState<"accounts" | "custom" | "ecosystem">("accounts");
  const [loading, setLoading] = useState(false);
  const [dataLoading, setDataLoading] = useState(true);
  const [accounts, setAccounts] = useState<ASNAccount[]>([]);
  const [filterSearch, setFilterSearch] = useState("");
  const [error, setError] = useState("");
  const [identifier, setIdentifier] = useState("");

  useEffect(() => {
    async function loadAccounts() {
      try {
        const res = await fetch("/api/accounts");
        if (res.ok) {
          const data = await res.json();
          const list: ASNAccount[] = [];

          if (data.users && data.users.length > 0) {
            for (const u of data.users) {
              list.push({
                id: u.id,
                nama: u.nama,
                email: u.email,
                role: u.role,
                subUnit: u.role === "admin" ? "Subbagian Umum (Administrator Sistem)" : "Tata Usaha / Operator",
              });
            }
          }

          if (data.pegawais && data.pegawais.length > 0) {
            for (const p of data.pegawais) {
              if (!list.some((item) => item.email.toLowerCase() === p.email?.toLowerCase())) {
                list.push({
                  id: p.id,
                  nama: p.nama,
                  email: p.email || `${p.nip}@bpvp.kemnaker.go.id`,
                  nip: p.nip,
                  role: p.subUnitKerja?.label?.includes("Pimpinan") || p.subUnitKerja?.label?.includes("Umum") ? "admin" : "operator",
                  subUnit: p.subUnitKerja?.label || "Balai Pelatihan Vokasi BPVP",
                  statusPegawai: p.statusPegawai?.label,
                });
              }
            }
          }

          setAccounts(list);
        }
      } catch (err) {
        console.error("Gagal memuat akun SSO:", err);
      } finally {
        setDataLoading(false);
      }
    }

    loadAccounts();
  }, []);

  const handleLogin = async (loginIdentifier: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: loginIdentifier,
          callbackUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Autentikasi SSO gagal.");
        setLoading(false);
        return;
      }

      // Hard redirect to the client application callback with sso_token
      window.location.href = data.redirectUrl;
    } catch (err: any) {
      setError("Gagal terhubung dengan server SSO BPVP.");
      setLoading(false);
    }
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Masukkan NIP (18 digit) atau Email Kedinasan.");
      return;
    }
    handleLogin(identifier.trim());
  };

  const filteredAccounts = accounts.filter((acc) => {
    const q = filterSearch.toLowerCase();
    return (
      acc.nama.toLowerCase().includes(q) ||
      acc.email.toLowerCase().includes(q) ||
      (acc.nip && acc.nip.includes(q)) ||
      (acc.subUnit && acc.subUnit.toLowerCase().includes(q))
    );
  });

  return (
    <>
      {/* Top Banner Kemnaker */}
      <header className="bg-[#003399] text-white py-3 px-6 shadow-md border-b-2 border-amber-400">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-kemnaker.svg"
              alt="Kemnaker RI"
              className="w-10 h-10 bg-white rounded-full p-1 border border-amber-400"
            />
            <div>
              <h1 className="text-sm font-bold tracking-wide uppercase text-amber-300">
                Kementerian Ketenagakerjaan Republik Indonesia
              </h1>
              <p className="text-xs text-blue-100 font-medium">
                Central Identity Provider (SSO) — Ekosistem Terpadu BPVP Banda Aceh
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>Port 3001 • Server SSO Terpusat</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002266] to-[#003399] p-6 text-white text-center relative">
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl p-2.5 shadow-md border-2 border-amber-400 flex items-center justify-center">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="inline-block px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[11px] font-bold uppercase tracking-wider mb-1">
              Central Identity Provider (IdP) Resmi
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">
              Portal SSO Ekosistem BPVP Banda Aceh
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-lg mx-auto">
              Menghubungkan layanan <span className="font-bold text-amber-300 uppercase">{service}</span> dengan basis data resmi aparatur Kemnaker RI.
            </p>

            {/* Navigation Tabs */}
            <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/15">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("accounts");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "accounts"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <UserCheck className="w-3.5 h-3.5" />
                Akun ASN Terdaftar ({accounts.length})
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("custom");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "custom"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                Uji NIP / Email Dinas
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("ecosystem");
                  setError("");
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  activeTab === "ecosystem"
                    ? "bg-amber-400 text-blue-950 shadow-xs"
                    : "text-blue-200 hover:text-white hover:bg-white/10"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                Ekosistem Aplikasi
              </button>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl shadow-xs text-red-800 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="font-bold text-sm">Autentikasi SSO Ditolak</p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed pl-7">{error}</p>
                <div className="text-[11px] text-red-600 pl-7 pt-1 font-medium">
                  Sistem keamanan memverifikasi status pegawai di tabel <code>Pegawai</code> BPVP. Hanya pegawai berstatus <strong>AKTIF</strong> yang diizinkan masuk.
                </div>
              </div>
            )}

            {/* TAB 1: ACCOUNTS LIST */}
            {activeTab === "accounts" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Pilih Akun ASN Resmi BPVP
                  </h3>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Terkoneksi Database Pegawai
                  </span>
                </div>

                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    value={filterSearch}
                    onChange={(e) => setFilterSearch(e.target.value)}
                    placeholder="Cari nama ASN, NIP, atau Subbagian Umum..."
                    className="w-full pl-9 pr-3 h-10 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003399]"
                  />
                </div>

                {dataLoading ? (
                  <div className="p-8 text-center space-y-3">
                    <Loader2 className="w-7 h-7 animate-spin text-[#003399] mx-auto" />
                    <p className="text-xs text-slate-500 font-medium">
                      Memuat data identitas ASN dari database SIMPEG...
                    </p>
                  </div>
                ) : filteredAccounts.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-500 bg-slate-50 rounded-xl border border-dashed">
                    Tidak ditemukan akun ASN yang cocok dengan kata kunci &quot;{filterSearch}&quot;.
                  </div>
                ) : (
                  <div className="max-h-[360px] overflow-y-auto space-y-2.5 pr-1">
                    {filteredAccounts.map((acc) => {
                      const initials = acc.nama
                        .split(" ")
                        .map((n) => n[0])
                        .slice(0, 2)
                        .join("")
                        .toUpperCase();
                      const isAdmin = acc.role === "admin";

                      return (
                        <button
                          key={acc.id + acc.email}
                          type="button"
                          disabled={loading}
                          onClick={() => handleLogin(acc.nip || acc.email)}
                          className="w-full p-3.5 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-blue-50/40 transition-all text-left flex items-center justify-between group focus:outline-none focus:ring-2 focus:ring-[#003399]"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-xl font-bold flex items-center justify-center text-sm shrink-0 transition-colors ${
                                isAdmin
                                  ? "bg-blue-100 text-[#003399] group-hover:bg-[#003399] group-hover:text-white"
                                  : "bg-amber-100 text-amber-900 group-hover:bg-amber-500 group-hover:text-white"
                              }`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-bold text-slate-800 text-xs sm:text-sm truncate group-hover:text-[#003399]">
                                  {acc.nama}
                                </span>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.2 rounded border uppercase ${
                                    isAdmin
                                      ? "bg-blue-50 text-blue-800 border-blue-200"
                                      : "bg-amber-50 text-amber-800 border-amber-200"
                                  }`}
                                >
                                  {isAdmin ? "Admin" : "Operator"}
                                </span>
                                {acc.statusPegawai && (
                                  <span className="text-[9px] font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                    {acc.statusPegawai}
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate mt-0.5">{acc.email}</p>
                              <p className="text-[10px] text-slate-400 font-mono truncate">
                                {acc.nip ? `NIP. ${acc.nip} • ` : ""}
                                {acc.subUnit}
                              </p>
                            </div>
                          </div>
                          <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-[#003399] group-hover:translate-x-1 shrink-0 ml-2 transition-all" />
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* TAB 2: CUSTOM VERIFICATION */}
            {activeTab === "custom" && (
              <div className="space-y-4">
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-amber-700" />
                    Uji Validasi Sumber Terpusat (Single Source of Truth):
                  </p>
                  <p>
                    Server SSO memvalidasi langsung ke Database Manajemen Pegawai BPVP.
                  </p>
                  <ul className="list-disc pl-5 text-[11px] text-amber-800 space-y-0.5 mt-1">
                    <li>Orang Luar: <code className="bg-white/80 px-1 rounded">orang.luar@gmail.com</code> (Otomatis Ditolak)</li>
                    <li>Pegawai Nonaktif: NIP pegawai di tong sampah (Otomatis Ditolak)</li>
                    <li>Pegawai Resmi: <code className="bg-white/80 px-1 rounded">198001012005011001</code> atau <code className="bg-white/80 px-1 rounded">admin@bpvp.local</code> (Diterima &amp; Diterbitkan Token)</li>
                  </ul>
                </div>

                <form onSubmit={handleCustomSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      NIP Pegawai (18 Digit) atau Email Kedinasan
                    </label>
                    <input
                      type="text"
                      required
                      value={identifier}
                      onChange={(e) => setIdentifier(e.target.value)}
                      placeholder="Contoh: 198001012005011001 atau ahmad@bpvp.kemnaker.go.id"
                      className="w-full px-3 h-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full h-11 bg-[#003399] hover:bg-[#002266] text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Memeriksa Status &amp; Menerbitkan Token SSO...</span>
                      </>
                    ) : (
                      <span>Verifikasi &amp; Teruskan ke {service.toUpperCase()}</span>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* TAB 3: ECOSYSTEM CATALOGUE */}
            {activeTab === "ecosystem" && (
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-xl border border-blue-200 text-xs text-blue-950 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-[#003399]">
                    <Layers className="w-4 h-4" />
                    Arsitektur Single Sign-On (SSO) Ekosistem BPVP:
                  </p>
                  <p className="text-blue-900 leading-relaxed">
                    Server SSO ini berjalan sebagai <strong>Identity Provider (IdP) Terpusat</strong> di port <code>3001</code>. Seluruh aplikasi ekosistem (SIMPEG di port 3000, Skillhub, Maganghub, LSP, Keuangan, PTSP) mengandalkan token terverifikasi dari server ini.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">👥</span>
                    <h4 className="font-bold text-slate-800">SIMPEG BPVP (Client Port 3000)</h4>
                    <p className="text-slate-500 text-[11px]">Sistem Informasi Manajemen Pegawai &amp; Data ASN</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🎓</span>
                    <h4 className="font-bold text-slate-800">Skillhub BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Pelatihan Vokasi, Instruktur &amp; Kurikulum Industri</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏢</span>
                    <h4 className="font-bold text-slate-800">Maganghub BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Penempatan Pemagangan Industri Dalam/Luar Negeri</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏅</span>
                    <h4 className="font-bold text-slate-800">LSP-P1 BPVP</h4>
                    <p className="text-slate-500 text-[11px]">Sertifikasi Profesi &amp; Asesmen Lisensi BNSP</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">💰</span>
                    <h4 className="font-bold text-slate-800">Keuangan &amp; BMN</h4>
                    <p className="text-slate-500 text-[11px]">Anggaran DIPA, Perbendaharaan, &amp; Aset Negara</p>
                  </div>
                  <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1">
                    <span className="text-lg">🏛️</span>
                    <h4 className="font-bold text-slate-800">Kios Siap Kerja / PTSP</h4>
                    <p className="text-slate-500 text-[11px]">Pelayanan Terpadu Satu Pintu &amp; Bursa Kerja</p>
                  </div>
                </div>

                <div className="text-center pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab("accounts")}
                    className="px-6 py-2 bg-[#003399] hover:bg-[#002266] text-white text-xs font-bold rounded-lg cursor-pointer transition"
                  >
                    Mulai Masuk dengan Akun ASN
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800">
        <p className="font-medium text-slate-300">
          Kementerian Ketenagakerjaan Republik Indonesia • Balai Pelatihan Vokasi dan Produktivitas (BPVP) Banda Aceh
        </p>
        <p className="mt-0.5 text-slate-500">
          Layanan Single Sign-On (SSO) Terpusat — Server IDP Standalone (Port 3001)
        </p>
      </footer>
    </>
  );
}

export default function SsoPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-100 flex items-center justify-center">
          <div className="p-6 bg-white rounded-xl shadow-md border text-center space-y-3">
            <div className="w-10 h-10 border-4 border-[#003399] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm font-semibold text-slate-700">Memuat Portal Central SSO Kemnaker...</p>
          </div>
        </div>
      }
    >
      <SsoPortalContent />
    </Suspense>
  );
}
