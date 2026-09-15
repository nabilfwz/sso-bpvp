"use client";

import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import {
  Shield,
  KeyRound,
  Loader2,
  ShieldAlert,
  Eye,
  EyeOff,
  Layers,
} from "lucide-react";

function SsoPortalContent() {
  const searchParams = useSearchParams();
  const service = searchParams.get("service") || "simpeg";
  const defaultSimpegUrl =
    process.env.NEXT_PUBLIC_SIMPEG_URL || "https://simpegbpvp.vercel.app";
  const defaultCallback = `${defaultSimpegUrl}/auth/sso-callback`;
  const callbackUrl = searchParams.get("callbackUrl") || defaultCallback;

  const [loading, setLoading] = useState(false);
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Masukkan NIP (18 digit) atau Email Kedinasan Anda.");
      return;
    }
    if (!password) {
      setError("Masukkan kata sandi Anda.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: identifier.trim(),
          password,
          callbackUrl,
        }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Autentikasi SSO gagal. Periksa kembali NIP/email dan kata sandi Anda.");
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
                Central Identity Provider (SSO) — Ekosistem Terpadu BPVP Banda
                Aceh
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-xs bg-white/10 px-3 py-1.5 rounded-full border border-white/20">
            <Shield className="w-3.5 h-3.5 text-amber-300" />
            <span>SSO Terpusat • Terenkripsi</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Card Header */}
          <div className="bg-gradient-to-r from-slate-900 via-[#002266] to-[#003399] p-6 text-white text-center">
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
              Portal SSO BPVP Banda Aceh
            </h2>
            <p className="text-xs text-blue-200 mt-1 max-w-xs mx-auto">
              Masuk menggunakan akun ASN Kemnaker Anda untuk mengakses layanan{" "}
              <span className="font-bold text-amber-300 uppercase">
                {service}
              </span>
              .
            </p>
          </div>

          {/* Login Form */}
          <div className="p-6 sm:p-8 space-y-5">
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

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Identifier */}
              <div>
                <label
                  htmlFor="identifier"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  NIP (18 Digit) atau Email Kedinasan
                </label>
                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="identifier"
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="Contoh: 198001012005011001 atau nama@bpvp.kemnaker.go.id"
                    className="w-full pl-10 pr-3 h-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    autoComplete="username"
                    disabled={loading}
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5"
                >
                  Kata Sandi
                </label>
                <div className="relative">
                  <Shield className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 h-11 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#003399]"
                    autoComplete="current-password"
                    disabled={loading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition"
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

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full h-11 bg-[#003399] hover:bg-[#002266] text-white font-bold text-sm rounded-lg shadow-md transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Memverifikasi & Menerbitkan Token SSO...</span>
                  </>
                ) : (
                  <span>Masuk ke {service.toUpperCase()}</span>
                )}
              </button>
            </form>

            {/* Info */}
            <div className="pt-2 border-t border-slate-100 text-xs text-slate-500 space-y-2">
              <p className="text-center font-medium">
                Hubungi Administrator jika Anda belum memiliki akses.
              </p>
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
          Kementerian Ketenagakerjaan Republik Indonesia • Balai Pelatihan
          Vokasi dan Produktivitas (BPVP) Banda Aceh
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
