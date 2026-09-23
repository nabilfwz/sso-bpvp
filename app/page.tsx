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
  Mail,
  Lock,
  Eye,
  EyeOff,
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

  // State untuk form login email & password
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [formError, setFormError] = useState("");

  // State untuk login Google
  const [loadingGoogle, setLoadingGoogle] = useState(false);

  const googleOAuthUrl = `/api/auth/google?service=${encodeURIComponent(
    service
  )}&callbackUrl=${encodeURIComponent(callbackUrl)}`;

  const handleGoogleClick = () => {
    setLoadingGoogle(true);
    window.location.href = googleOAuthUrl;
  };

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!identifier.trim()) {
      setFormError("Email atau NIP wajib diisi.");
      return;
    }
    if (!password) {
      setFormError("Kata sandi (password) wajib diisi.");
      return;
    }

    setLoadingPassword(true);
    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          callbackUrl,
          service,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setFormError(
          data.error || "Gagal masuk. Periksa kembali email/NIP dan kata sandi Anda."
        );
        setLoadingPassword(false);
        return;
      }

      // Berhasil login, arahkan ke target aplikasi dengan sso_token
      if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setFormError("Gagal mengarahkan kembali ke aplikasi.");
        setLoadingPassword(false);
      }
    } catch (err: any) {
      setFormError(err?.message || "Terjadi kesalahan koneksi saat memproses login.");
      setLoadingPassword(false);
    }
  };

  const getUrlErrorMessage = () => {
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

  const urlErrorMessage = getUrlErrorMessage();
  const displayError = formError || urlErrorMessage;

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
            <span>SSO Terpusat &bull; SIAPkerja &amp; Google</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6 sm:my-8">
        <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002266] to-[#003399] p-6 sm:p-7 text-white text-center relative overflow-hidden">
            <div className="w-14 h-14 sm:w-16 sm:h-16 mx-auto mb-3 bg-white rounded-2xl p-2 shadow-lg border-2 border-amber-400 flex items-center justify-center">
              <img
                src="/images/logo-kemnaker.svg"
                alt="Logo Kemnaker"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="inline-flex items-center gap-1 px-3 py-0.5 bg-amber-400/20 text-amber-300 border border-amber-400/40 rounded-full text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" /> Identity Provider (IdP) Resmi
            </span>
            <h2 className="text-lg sm:text-xl font-extrabold tracking-tight">
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
          <div className="p-6 sm:p-8 space-y-5">
            {/* Error Banner */}
            {displayError && (
              <div className="p-4 bg-red-50 border-l-4 border-red-600 rounded-r-xl text-red-800 space-y-1 animate-in fade-in duration-200">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-red-600 shrink-0" />
                  <p className="font-bold text-xs sm:text-sm">Autentikasi Gagal</p>
                </div>
                <div className="text-xs text-red-700 leading-relaxed pl-7">
                  {displayError}
                </div>
              </div>
            )}

            {/* FORM LOGIN EMAIL / NIP & PASSWORD */}
            <form onSubmit={handlePasswordLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Email Kedinasan atau NIP
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="nama@kemnaker.go.id atau NIP"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003399] focus:bg-white transition"
                    disabled={loadingPassword || loadingGoogle}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">
                  Kata Sandi (Password)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan kata sandi akun"
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003399] focus:bg-white transition"
                    disabled={loadingPassword || loadingGoogle}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition"
                    tabIndex={-1}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                id="btn-login-password"
                disabled={loadingPassword || loadingGoogle}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#003399] to-[#002266] hover:from-[#002266] hover:to-[#001744] text-white rounded-xl font-bold text-xs sm:text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loadingPassword ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-amber-300" />
                    <span>Memverifikasi Kredensial...</span>
                  </>
                ) : (
                  <>
                    <span>Masuk dengan Email &amp; Password</span>
                    <ArrowRight className="w-4 h-4 text-amber-300" />
                  </>
                )}
              </button>
            </form>

            {/* DIVIDER */}
            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-white px-3 text-slate-400 font-semibold uppercase tracking-wider text-[10px]">
                  atau masuk dengan
                </span>
              </div>
            </div>

            {/* Official Google Login Button */}
            <div>
              <button
                type="button"
                id="btn-google-oauth"
                onClick={handleGoogleClick}
                disabled={loadingPassword || loadingGoogle}
                className="w-full py-3 px-4 bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs sm:text-sm rounded-xl border border-slate-300 hover:border-[#003399]/40 shadow-xs hover:shadow-md transition-all flex items-center justify-between cursor-pointer disabled:opacity-60 group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center shrink-0 border border-slate-100 shadow-2xs">
                    <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
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
                    <p className="text-xs font-bold text-slate-800 group-hover:text-[#003399] transition-colors">
                      Masuk dengan Akun Google
                    </p>
                    <p className="text-[10px] text-slate-400 font-normal">
                      Gmail / Google Workspace Kedinasan
                    </p>
                  </div>
                </div>

                {loadingGoogle ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#003399]" />
                ) : (
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-[#003399] group-hover:translate-x-1 transition-all shrink-0" />
                )}
              </button>
            </div>

            {/* Security Badge */}
            <div className="p-3 bg-blue-50/70 rounded-xl border border-blue-100 flex items-start gap-2.5 text-left">
              <ShieldCheck className="w-4 h-4 text-[#003399] shrink-0 mt-0.5" />
              <p className="text-[11px] text-blue-900 leading-relaxed">
                Hanya akun terdaftar di basis data <strong>Pegawai BPVP Banda Aceh</strong> yang diizinkan masuk. Token SSO lintas aplikasi akan otomatis diterbitkan setelah verifikasi berhasil.
              </p>
            </div>

            {/* Info Footer */}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Layers className="w-3.5 h-3.5 shrink-0" />
                <span>
                  Layanan SSO menghubungkan:{" "}
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
