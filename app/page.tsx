"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Layers,
  Sparkles,
} from "lucide-react";

function SsoPortalContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "simpeg";
  const defaultSimpegUrl =
    process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
  const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallback;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [customGmail, setCustomGmail] = useState("");

  const handleProcessLogin = async (googleEmail: string) => {
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: googleEmail.trim().toLowerCase(),
          callbackUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Autentikasi SSO gagal.");
        setLoading(false);
        return;
      }

      // Hard redirect ke aplikasi klien dengan sso_token
      window.location.href = data.redirectUrl;
    } catch {
      setError("Gagal terhubung dengan server SSO BPVP. Periksa koneksi Anda.");
      setLoading(false);
    }
  };

  const handleGoogleSignInClick = () => {
    // Membuka modal pemilihan akun Google / Gmail
    setShowAccountModal(true);
    setError("");
  };

  return (
    <>
      {/* Top Banner Kemnaker */}
      <header className="bg-[#003399] text-white py-3.5 px-6 shadow-md border-b-2 border-amber-400">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src="/images/logo-kemnaker.svg"
              alt="Kemnaker RI"
              className="w-10 h-10 bg-white rounded-full p-1 border border-amber-400 shadow-sm"
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
            <span>SSO Terpusat • Verifikasi Database Pegawai</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002266] to-[#003399] p-7 text-white text-center relative overflow-hidden">
            <div className="w-16 h-16 mx-auto mb-3 bg-white rounded-2xl p-2.5 shadow-lg border-2 border-amber-400 flex items-center justify-center">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" /> Identity Provider (IdP) Resmi
            </span>
            <h2 className="text-xl font-extrabold tracking-tight">
              Portal SSO BPVP Banda Aceh
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
              Masuk untuk mengakses layanan{" "}
              <span className="font-bold text-amber-300 uppercase">
                {service}
              </span>
            </p>
          </div>

          {/* Card Body */}
          <div className="p-7 sm:p-8 space-y-6">
            {/* Error Banner */}
            {error && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-red-800 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="font-bold text-sm">Autentikasi SSO Ditolak</p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed pl-7">
                  {error}
                </p>
              </div>
            )}

            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-slate-800">
                Single Sign-On Tanpa Kata Sandi
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Silakan masuk menggunakan akun <strong>Google (Gmail)</strong> atau akun media sosial kedinasan Anda. Sistem akan memverifikasi apakah email Anda terdaftar dalam database Pegawai BPVP Banda Aceh.
              </p>
            </div>

            {/* Social / Google Login Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="btn-sso-google"
                onClick={handleGoogleSignInClick}
                disabled={loading}
                className="w-full py-3.5 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-xl border-2 border-slate-200 hover:border-[#003399]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-center gap-3 cursor-pointer disabled:opacity-60 group"
              >
                {/* Official Google SVG Icon */}
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                {loading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#003399]" />
                    Memverifikasi Basis Data...
                  </span>
                ) : (
                  <span className="text-slate-800 group-hover:text-[#003399] transition-colors">
                    Masuk dengan Akun Google (Gmail)
                  </span>
                )}
              </button>
            </div>

            {/* Security Badge */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">
                Hanya email Google yang terdaftar di basis data <strong>Pegawai BPVP Banda Aceh</strong> yang berhak masuk. Token SSO lintas aplikasi akan diterbitkan secara otomatis.
              </p>
            </div>

            {/* Info Footer */}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <div className="flex items-center gap-1.5 text-slate-400">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Layanan ini menghubungkan:{" "}
                  <span className="font-semibold text-slate-600">
                    SIMPEG • Skillhub • Maganghub • LSP-P1 • PTSP
                  </span>
                </span>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Modal Dialog Akun Google (Simulasi Google Account Chooser) */}
      {showAccountModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <h3 className="font-bold text-slate-800 text-sm">
                  Pilih Akun Google (Gmail)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAccountModal(false)}
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1 leading-none"
              >
                &times;
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4">
              <p className="text-xs text-slate-500">
                Pilih akun Google Anda yang terhubung dengan akun kedinasan BPVP Banda Aceh:
              </p>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    handleProcessLogin("inispectre@gmail.com");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-blue-50/50 transition text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center shrink-0">
                    MN
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#003399]">
                      Muhammad Nabil Fawwaz
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      inispectre@gmail.com
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-red-100 text-red-700 uppercase shrink-0">
                    Superadmin
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    handleProcessLogin("iskandar.umum@kemnaker.go.id");
                  }}
                  className="w-full flex items-center gap-3 p-3 rounded-xl border border-slate-200 hover:border-[#003399] hover:bg-blue-50/50 transition text-left group"
                >
                  <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center shrink-0">
                    IM
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#003399]">
                      Iskandar Muda, S.Sos., M.M.
                    </p>
                    <p className="text-[11px] text-slate-500 truncate">
                      iskandar.umum@kemnaker.go.id
                    </p>
                  </div>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 uppercase shrink-0">
                    Admin
                  </span>
                </button>
              </div>

              {/* Gunakan akun lain */}
              <div className="pt-2 border-t border-slate-100">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (!customGmail.trim()) return;
                    setShowAccountModal(false);
                    handleProcessLogin(customGmail.trim());
                  }}
                  className="space-y-2"
                >
                  <label className="block text-[11px] font-bold text-slate-600">
                    Gunakan Akun Google Lain:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="email"
                      required
                      value={customGmail}
                      onChange={(e) => setCustomGmail(e.target.value)}
                      placeholder="email.anda@gmail.com"
                      className="flex-1 px-3 h-9 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    />
                    <button
                      type="submit"
                      className="px-3 h-9 bg-[#003399] text-white text-xs font-bold rounded-lg hover:bg-[#002266] transition"
                    >
                      Pilih
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800">
        <p className="font-medium text-slate-300">
          Kementerian Ketenagakerjaan Republik Indonesia • Balai Pelatihan Vokasi dan Produktivitas (BPVP) Banda Aceh
        </p>
        <p className="mt-0.5 text-slate-500">
          Layanan Single Sign-On (SSO) Terpusat — Server IDP Standalone
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
            <p className="text-sm font-semibold text-slate-700">
              Memuat Portal Central SSO Kemnaker...
            </p>
          </div>
        </div>
      }
    >
      <SsoPortalContent />
    </Suspense>
  );
}
