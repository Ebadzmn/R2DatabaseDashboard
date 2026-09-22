"use client";

import React from "react";
import {
  LayoutDashboard,
  Film,
  HardDrive,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Radio,
} from "lucide-react";

export type NavTab = "overview" | "movies" | "storage" | "upload";

interface SidebarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  activeStoragesCount?: number;
  totalMoviesCount?: number;
}

export function Sidebar({
  currentTab,
  onTabChange,
  collapsed,
  onToggleCollapse,
  activeStoragesCount = 0,
  totalMoviesCount = 0,
}: SidebarProps) {
  const navItems = [
    {
      id: "overview" as NavTab,
      label: "Overview",
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: "movies" as NavTab,
      label: "Movies Studio",
      icon: Film,
      badge: totalMoviesCount > 0 ? totalMoviesCount : null,
    },
    {
      id: "storage" as NavTab,
      label: "R2 Storage Nodes",
      icon: HardDrive,
      badge: activeStoragesCount > 0 ? `${activeStoragesCount} Active` : null,
    },
    {
      id: "upload" as NavTab,
      label: "Direct R2 Upload",
      icon: UploadCloud,
      badge: "Fast",
    },
  ];

  return (
    <aside
      className={`fixed top-0 left-0 h-screen z-40 bg-[#0a0f1d]/90 backdrop-blur-xl border-r border-slate-800/80 transition-all duration-300 flex flex-col justify-between ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Top Brand Section */}
      <div>
        <div className="h-18 flex items-center justify-between px-5 border-b border-slate-800/60">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25 shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <div className="flex flex-col">
                <span className="font-bold tracking-wider text-base text-white flex items-center gap-1.5">
                  CINE<span className="text-indigo-400">CORE</span>
                </span>
                <span className="text-[10px] tracking-widest text-slate-400 font-medium uppercase">
                  Admin Platform
                </span>
              </div>
            )}
          </div>
          <button
            onClick={onToggleCollapse}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800/60 transition-colors"
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1.5">
          <div className={`px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase ${collapsed ? "text-center" : ""}`}>
            {collapsed ? "•••" : "Menu"}
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-xl font-medium text-sm transition-all group relative ${
                  isActive
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
                } ${collapsed ? "justify-center" : "justify-between"}`}
                title={collapsed ? item.label : undefined}
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <Icon
                    className={`w-5 h-5 shrink-0 transition-transform duration-200 group-hover:scale-110 ${
                      isActive ? "text-white" : "text-slate-400 group-hover:text-indigo-400"
                    }`}
                  />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </div>

                {!collapsed && item.badge && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-semibold tracking-wide rounded-full ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-slate-800 text-slate-300 border border-slate-700/60"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Status Card */}
      <div className="p-3">
        {!collapsed ? (
          <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800/80">
            <div className="flex items-center gap-2 mb-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-semibold text-slate-300">Cluster Status</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-tight">
              Zero-downtime R2 rotation & BullMQ transcoding active.
            </p>
          </div>
        ) : (
          <div className="flex justify-center p-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
          </div>
        )}
      </div>
    </aside>
  );
}
