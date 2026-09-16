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
  ArrowRight,
} from "lucide-react";

function SsoPortalContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "simpeg";
  const defaultSimpegUrl =
    process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
  const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallback;

  const errorParam = searchParams.get("error");
  const rejectedEmail = searchParams.get("email");

  const [loading, setLoading] = useState(false);

  const googleOAuthUrl = `/api/auth/google?service=${encodeURIComponent(
    service
  )}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const handleGoogleClick = () => {
    setLoading(true);
    window.location.href = googleOAuthUrl;
  };

  const getErrorMessage = () => {
    if (!errorParam) return null;
    if (errorParam === "EmailTidakTerdaftar") {
      return (
        <>
          Akun Google{" "}
          <strong className="text-red-950 font-mono underline">
            {rejectedEmail || "Anda"}
          </strong>{" "}
          tidak terdaftar dalam basis data resmi <strong>Pegawai BPVP Banda Aceh</strong>. Hanya ASN &amp; Pegawai BPVP aktif yang berhak mengakses sistem.
        </>
      );
    }
    if (errorParam === "GoogleOAuthConfigMissing") {
      return (
        <>
          Konfigurasi OAuth Google (<code>GOOGLE_CLIENT_ID</code> / <code>GOOGLE_CLIENT_SECRET</code>) belum diisi di server SSO (.env). Hubungi Administrator Sistem.
        </>
      );
    }
    if (errorParam === "GoogleAuthCancelled") {
      return "Proses otentikasi Google dibatalkan.";
    }
    return "Autentikasi akun Google gagal. Silakan coba kembali.";
  };

  const errorMessage = getErrorMessage();

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
            <span>SSO Terpusat &bull; Google Workspace / Gmail</span>
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
            {errorMessage && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-red-800 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="font-bold text-sm">Autentikasi SSO Ditolak</p>
                </div>
                <p className="text-xs text-red-700 leading-relaxed pl-7">
                  {errorMessage}
                </p>
              </div>
            )}

            <div className="text-center space-y-1.5">
              <p className="text-sm font-bold text-slate-800">
                Otentikasi Akun Google (Gmail)
              </p>
              <p className="text-xs text-slate-500 leading-relaxed">
                Masuk menggunakan akun <strong>Gmail / Google Workspace</strong> Anda. Sistem akan memverifikasi apakah email Anda terdaftar dalam database Pegawai BPVP.
              </p>
            </div>

            {/* Official Google Login Button */}
            <div className="space-y-3 pt-2">
              <button
                type="button"
                id="btn-google-oauth"
                onClick={handleGoogleClick}
                disabled={loading}
                className="w-full py-4 px-5 bg-white hover:bg-slate-50 text-slate-800 font-bold text-sm rounded-2xl border-2 border-slate-200 hover:border-[#003399]/40 shadow-md hover:shadow-lg transition-all flex items-center justify-between cursor-pointer disabled:opacity-60 group"
              >
                <div className="flex items-center gap-3">
                  {/* Official Google SVG Icon */}
                  <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
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
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-extrabold text-slate-800 group-hover:text-[#003399] transition-colors">
                      Masuk dengan Akun Google
                    </p>
                    <p className="text-[10px] text-slate-400 font-medium">
                      Otentikasi Aman Gmail / Google
                    </p>
                  </div>
                </div>

                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-[#003399]" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#003399] group-hover:translate-x-1 transition-all" />
                )}
              </button>
            </div>

            {/* Security Badge */}
            <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-100 flex items-start gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#003399] shrink-0 mt-0.5" />
              <p className="text-xs text-blue-900 leading-relaxed">
                Hanya akun Google yang emailnya terdaftar di basis data <strong>Pegawai BPVP Banda Aceh</strong> yang diizinkan masuk. Token SSO lintas aplikasi akan otomatis diterbitkan.
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

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-[11px] py-4 px-6 text-center border-t border-slate-800">
        <p className="font-medium text-slate-300">
          Kementerian Ketenagakerjaan Republik Indonesia &bull; Balai Pelatihan Vokasi dan Produktivitas (BPVP) Banda Aceh
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
