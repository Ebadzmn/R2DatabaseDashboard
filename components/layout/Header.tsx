"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import {
  Activity,
  LogOut,
  User,
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
} from "lucide-react";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onOpenNewMovie?: () => void;
  onOpenNewSeries?: () => void;
  onOpenUpload?: () => void;
}

export function Header({
  title,
  subtitle,
  onOpenNewMovie,
  onOpenNewSeries,
  onOpenUpload,
}: HeaderProps) {
  const { user, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState<"ONLINE" | "OFFLINE" | "CHECKING">("CHECKING");
  const [uptime, setUptime] = useState<number | null>(null);

  useEffect(() => {
    let mounted = true;
    const checkHealth = () => {
      api
        .health()
        .then((res) => {
          if (mounted) {
            setHealthStatus("ONLINE");
            setUptime(res.data.uptime);
          }
        })
        .catch(() => {
          if (mounted) {
            setHealthStatus("OFFLINE");
          }
        });
    };

    checkHealth();
    const interval = setInterval(checkHealth, 15000); // Check every 15s
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const formatUptime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hrs > 0) return `${hrs}h ${mins}m`;
    return `${mins}m`;
  };

  return (
    <header className="h-18 px-8 border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
      {/* Title & Subtitle */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
          {title}
        </h1>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-4">
        {/* Health Status Pill */}
        <div
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${
            healthStatus === "ONLINE"
              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
              : healthStatus === "OFFLINE"
              ? "bg-rose-500/10 border-rose-500/30 text-rose-400"
              : "bg-slate-800/60 border-slate-700 text-slate-400"
          }`}
          title={uptime ? `Backend Uptime: ${formatUptime(uptime)}` : undefined}
        >
          {healthStatus === "ONLINE" && (
            <>
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Backend Online</span>
            </>
          )}
          {healthStatus === "OFFLINE" && (
            <>
              <span className="w-2 h-2 rounded-full bg-rose-400" />
              <span>Backend Offline</span>
            </>
          )}
          {healthStatus === "CHECKING" && (
            <>
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              <span>Connecting...</span>
            </>
          )}
        </div>

        {/* Quick Actions */}
        <div className="flex items-center gap-2 border-l border-slate-800/80 pl-4">
          {onOpenNewMovie && (
            <button
              onClick={onOpenNewMovie}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700/60 transition-all"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Add Movie</span>
            </button>
          )}

          {onOpenNewSeries && (
            <button
              onClick={onOpenNewSeries}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 hover:text-white border border-purple-500/40 transition-all"
            >
              <Plus className="w-4 h-4 text-purple-400" />
              <span>Add Series</span>
            </button>
          )}

          {onOpenUpload && (
            <button
              onClick={onOpenUpload}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all"
            >
              <UploadCloud className="w-4 h-4" />
              <span>Upload Video</span>
            </button>
          )}
        </div>

        {/* Admin User Profile */}
        <div className="flex items-center gap-3 border-l border-slate-800/80 pl-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-300 font-semibold text-sm">
              {user?.name?.charAt(0) || "A"}
            </div>
            <div className="hidden lg:flex flex-col text-left">
              <span className="text-xs font-semibold text-slate-200 leading-tight">
                {user?.name || "Admin"}
              </span>
              <span className="text-[10px] text-slate-400 font-mono leading-tight">
                {user?.email || "admin@movieplatform.com"}
              </span>
            </div>
          </div>

          <button
            onClick={logout}
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors"
            title="Log out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
