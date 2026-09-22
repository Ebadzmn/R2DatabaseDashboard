"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/components/ui/Toast";
import { Film, Lock, Mail, ArrowRight, ShieldCheck, Sparkles, Key } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading } = useAuth();
  const { success, error } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setSubmitting(true);
    try {
      await login(email, password);
      success("Welcome Back", "Successfully authenticated to CineCore Admin.");
      router.push("/");
    } catch (err: any) {
      error("Authentication Failed", err.message || "Invalid email or password.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleFillDemo = () => {
    setEmail("admin@movieplatform.com");
    setPassword("AdminSecurePassword123!");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex flex-col justify-center items-center p-6 relative overflow-hidden">
      {/* Subtle Background Glows */}
      <div className="absolute -top-40 -left-40 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Glass Box */}
      <div className="w-full max-w-md bg-[#0f172a]/90 backdrop-blur-2xl border border-slate-800/90 rounded-3xl p-8 sm:p-10 shadow-2xl shadow-black/80 relative z-10">
        {/* Brand Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-xl shadow-indigo-500/25 mb-4">
            <Film className="w-7 h-7 text-white" />
          </div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-1.5">
            CINE<span className="text-indigo-400">CORE</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Enterprise Movie Streaming & Multi-R2 Storage Platform
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Email
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                required
                placeholder="admin@movieplatform.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all font-mono text-xs"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Admin Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                placeholder="••••••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all text-xs"
              />
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !email || !password}
            className="w-full py-3 px-4 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2 mt-2 cursor-pointer"
          >
            <span>{submitting ? "Signing In..." : "Sign In to Dashboard"}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Demo Credentials Quick Fill */}
        <div className="mt-6 pt-6 border-t border-slate-800/80 text-center">
          <button
            type="button"
            onClick={handleFillDemo}
            className="w-full py-2.5 px-3 rounded-xl text-xs font-semibold text-indigo-300 hover:text-white bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Key className="w-3.5 h-3.5" />
            <span>Fill Default Admin Credentials</span>
          </button>
          <span className="text-[11px] text-slate-500 block mt-2 font-mono">
            admin@movieplatform.com • AdminSecurePassword123!
          </span>
        </div>

        {/* Security badge */}
        <div className="mt-6 flex items-center justify-center gap-1.5 text-[11px] text-slate-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Protected with JWT & AES-256 Cloudflare R2 Encryption</span>
        </div>
      </div>
    </div>
  );
}
