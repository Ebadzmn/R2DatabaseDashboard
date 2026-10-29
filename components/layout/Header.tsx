"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { ISystemStatus } from "@/lib/types";
import { MaintenanceControlModal } from "@/components/system/MaintenanceControlModal";
import { AppUpdateControlModal } from "@/components/system/AppUpdateControlModal";
import {
  Activity,
  LogOut,
  User,
  Plus,
  UploadCloud,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  Power,
  Wrench,
  Sparkles,
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
  const router = useRouter();
  const { user, logout } = useAuth();
  const [healthStatus, setHealthStatus] = useState<"ONLINE" | "OFFLINE" | "CHECKING">("CHECKING");
  const [uptime, setUptime] = useState<number | null>(null);
  const [systemStatus, setSystemStatus] = useState<ISystemStatus | null>(null);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isAppUpdateModalOpen, setIsAppUpdateModalOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

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

      api.system
        .getStatus()
        .then((res) => {
          if (mounted) {
            setSystemStatus(res.data);
          }
        })
        .catch(() => { });
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
    <>
      {/* Maintenance Mode Warning Strip */}
      {systemStatus?.isMaintenance && (
        <div className="bg-gradient-to-r from-rose-700 via-rose-600 to-amber-700 text-white px-8 py-2 text-xs font-semibold flex items-center justify-between shadow-lg sticky top-0 z-40">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-white animate-bounce shrink-0" />
            <span>
              <strong>MAINTENANCE MODE ACTIVE:</strong> The mobile app is currently turned OFF. Users see: &quot;{systemStatus.title}&quot;
            </span>
          </div>
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className="px-3 py-1 bg-white text-rose-700 rounded-lg font-bold hover:bg-slate-100 transition-all text-xs shrink-0 shadow-sm"
          >
            Manage / Turn Online
          </button>
        </div>
      )}

      <header className="h-18 px-8 border-b border-slate-800/80 bg-[#080c14]/80 backdrop-blur-xl flex items-center justify-between sticky top-0 z-30">
        {/* Title & Subtitle */}
        <div>
          <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
            {title}
          </h1>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* App Status (ON / OFF) Toggle Pill */}
          <button
            onClick={() => setIsMaintenanceModalOpen(true)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm ${systemStatus?.isMaintenance
                ? "bg-rose-500/20 border-rose-500/60 text-rose-300 animate-pulse"
                : "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
              }`}
            title="Click to toggle App Online or Maintenance Mode"
          >
            {systemStatus?.isMaintenance ? (
              <>
                <span className="w-2 h-2 rounded-full bg-rose-400" />
                <span className="flex items-center gap-1">
                  <Wrench className="w-3.5 h-3.5" />
                  App Maintenance (OFF)
                </span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                <span className="flex items-center gap-1">
                  <Power className="w-3.5 h-3.5" />
                  App Online (LIVE)
                </span>
              </>
            )}
          </button>

          {/* App Update Control Button */}
          <button
            onClick={() => setIsAppUpdateModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-semibold transition-all hover:scale-105 active:scale-95 shadow-sm ${
              systemStatus?.appUpdate?.isUpdateActive
                ? "bg-amber-500/10 border-amber-500/40 text-amber-300"
                : "bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800"
            }`}
            title="Configure App Updates, APK download link and Release Notes"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>
              Update v{systemStatus?.appUpdate?.latestVersion || "1.0.0"}
              {systemStatus?.appUpdate?.isUpdateActive && (
                <span className="ml-1 text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 font-bold uppercase">
                  {systemStatus.appUpdate.isForceUpdate ? "Forced" : "Active"}
                </span>
              )}
            </span>
          </button>

          {/* Health Status Pill */}
          <div
            className={`hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium transition-all ${healthStatus === "ONLINE"
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
                <span className="hidden sm:inline">Add Movie</span>
              </button>
            )}

            {onOpenNewSeries && (
              <button
                onClick={onOpenNewSeries}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold bg-purple-950/70 hover:bg-purple-900/80 text-purple-200 hover:text-white border border-purple-500/40 transition-all"
              >
                <Plus className="w-4 h-4 text-purple-400" />
                <span className="hidden sm:inline">Add Series</span>
              </button>
            )}

            {onOpenUpload && (
              <button
                onClick={onOpenUpload}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/25 transition-all"
              >
                <UploadCloud className="w-4 h-4" />
                <span>Upload</span>
              </button>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 rounded-xl hover:bg-slate-800/60 transition-colors ml-1"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Maintenance Control Modal */}
      <MaintenanceControlModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onStatusChanged={(newStatus) => setSystemStatus(newStatus)}
      />

      {/* App Update Control Modal */}
      <AppUpdateControlModal
        isOpen={isAppUpdateModalOpen}
        onClose={() => setIsAppUpdateModalOpen(false)}
        systemStatus={systemStatus}
        onStatusUpdated={(newStatus) => setSystemStatus(newStatus)}
      />
    </>
  );
}
