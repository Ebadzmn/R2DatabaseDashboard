"use client";

import React from "react";
import { IMovie, IStorageAccount } from "@/lib/types";
import {
  Film,
  HardDrive,
  Cpu,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  TrendingUp,
} from "lucide-react";

interface OverviewStatsProps {
  movies: IMovie[];
  storages: IStorageAccount[];
  onNavigateTab: (tab: "movies" | "storage" | "upload") => void;
  onSelectMovie: (movie: IMovie) => void;
}

export function OverviewStats({
  movies,
  storages,
  onNavigateTab,
  onSelectMovie,
}: OverviewStatsProps) {
  // Aggregate Storage Metrics
  const totalStorageBytes = storages.reduce((sum, s) => sum + (s.maxStorageBytes || 0), 0);
  const usedStorageBytes = storages.reduce((sum, s) => sum + (s.usedStorageBytes || 0), 0);
  const reservedStorageBytes = storages.reduce((sum, s) => sum + (s.reservedStorageBytes || 0), 0);
  const activeStorages = storages.filter((s) => s.status === "ACTIVE");

  const formatGB = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  const usagePercent =
    totalStorageBytes > 0
      ? Math.min(100, Number(((usedStorageBytes / totalStorageBytes) * 100).toFixed(1)))
      : 0;

  const reservedPercent =
    totalStorageBytes > 0
      ? Math.min(100, Number(((reservedStorageBytes / totalStorageBytes) * 100).toFixed(1)))
      : 0;

  // Movie Status Counts
  const readyMovies = movies.filter((m) => m.status === "READY");
  const processingMovies = movies.filter((m) => m.status === "PROCESSING");
  const uploadingMovies = movies.filter((m) => m.status === "UPLOADING");
  const draftMovies = movies.filter((m) => m.status === "DRAFT");
  const failedMovies = movies.filter((m) => m.status === "FAILED");

  return (
    <div className="space-y-8">
      {/* 4 Primary Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: Total Movies */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111827]/80 to-[#0c1220]/80 border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-indigo-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Total Catalog
            </span>
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
              <Film className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {movies.length}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-emerald-400 font-medium">{readyMovies.length} Ready</span>
              <span>•</span>
              <span className="text-amber-400 font-medium">{processingMovies.length} Transcoding</span>
            </div>
          </div>
        </div>

        {/* Card 2: Storage Used */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111827]/80 to-[#0c1220]/80 border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              R2 Storage Used
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
              <HardDrive className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {formatGB(usedStorageBytes)} <span className="text-sm font-semibold text-slate-400">GB</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span>of {formatGB(totalStorageBytes)} GB Limit</span>
              <span className="text-emerald-400 font-medium">({usagePercent}%)</span>
            </div>
          </div>
        </div>

        {/* Card 3: Storage Nodes */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111827]/80 to-[#0c1220]/80 border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              R2 Storage Nodes
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 group-hover:scale-110 transition-transform">
              <Layers className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {activeStorages.length}{" "}
              <span className="text-sm font-semibold text-slate-400">/ {storages.length}</span>
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-purple-400 font-medium">Auto-Failover Enabled</span>
            </div>
          </div>
        </div>

        {/* Card 4: Processing Queue */}
        <div className="p-5 rounded-2xl bg-gradient-to-b from-[#111827]/80 to-[#0c1220]/80 border border-slate-800/80 shadow-xl relative overflow-hidden group hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              BullMQ Transcoding
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-white tracking-tight">
              {processingMovies.length + uploadingMovies.length}
            </div>
            <div className="mt-2 flex items-center gap-2 text-xs text-slate-400">
              <span className="text-amber-400 font-medium">
                {processingMovies.length} active transcode
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* R2 Aggregate Capacity Gauge Section */}
      <div className="p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-indigo-400" />
              Aggregate Cloudflare R2 Storage Cluster Capacity
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Live capacity across all registered storage accounts with atomic reservations.
            </p>
          </div>
          <button
            onClick={() => onNavigateTab("storage")}
            className="flex items-center gap-1 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            <span>Manage Storage Nodes</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Multi-segment capacity bar */}
        <div className="w-full h-3.5 bg-slate-800/90 rounded-full overflow-hidden flex p-0.5 border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-l-full transition-all duration-500"
            style={{ width: `${usagePercent}%` }}
            title={`Used: ${formatGB(usedStorageBytes)} GB (${usagePercent}%)`}
          />
          <div
            className="h-full bg-amber-400/80 transition-all duration-500"
            style={{ width: `${reservedPercent}%` }}
            title={`Reserved: ${formatGB(reservedStorageBytes)} GB (${reservedPercent}%)`}
          />
        </div>

        {/* Capacity Legend */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
              <span className="text-slate-300 font-medium">Used:</span>
              <span className="text-slate-400 font-mono">{formatGB(usedStorageBytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
              <span className="text-slate-300 font-medium">Reserved:</span>
              <span className="text-slate-400 font-mono">{formatGB(reservedStorageBytes)} GB</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-600" />
              <span className="text-slate-300 font-medium">Available:</span>
              <span className="text-slate-400 font-mono">
                {formatGB(Math.max(0, totalStorageBytes - usedStorageBytes - reservedStorageBytes))} GB
              </span>
            </div>
          </div>
          <div className="text-slate-400 font-mono text-[11px]">
            Max Limit: <span className="text-white font-semibold">{formatGB(totalStorageBytes)} GB</span>
          </div>
        </div>
      </div>

      {/* Recent Movies & Processing Monitor */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Latest Movies list */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                Recent Movie Additions
              </h3>
              <button
                onClick={() => onNavigateTab("movies")}
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition-colors flex items-center gap-1"
              >
                <span>View All ({movies.length})</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {movies.length === 0 ? (
              <div className="py-12 text-center text-slate-500">
                <Film className="w-10 h-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No movies in the catalog yet.</p>
                <button
                  onClick={() => onNavigateTab("upload")}
                  className="mt-3 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
                >
                  Upload First Movie
                </button>
              </div>
            ) : (
              <div className="divide-y divide-slate-800/60">
                {movies.slice(0, 5).map((m) => (
                  <div
                    key={m._id}
                    onClick={() => onSelectMovie(m)}
                    className="py-3 flex items-center justify-between hover:bg-slate-800/30 px-3 rounded-xl cursor-pointer transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/50 flex items-center justify-center text-slate-500">
                        {m.poster ? (
                          <img
                            src={m.poster}
                            alt={m.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                        ) : (
                          <Film className="w-4 h-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors truncate">
                          {m.title}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                          <span>{m.releaseYear || "N/A"}</span>
                          <span>•</span>
                          <span className="uppercase">{m.type}</span>
                          {m.genres?.length > 0 && (
                            <>
                              <span>•</span>
                              <span className="truncate max-w-[120px]">{m.genres.join(", ")}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <span
                        className={`px-2.5 py-1 text-[11px] font-semibold rounded-lg ${
                          m.status === "READY"
                            ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                            : m.status === "PROCESSING"
                            ? "bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse"
                            : m.status === "UPLOADING"
                            ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                            : m.status === "FAILED"
                            ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {m.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Quick Upload Action & Node summary */}
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#111827]/90 to-[#0a0f1d]/90 border border-slate-800/80 shadow-xl flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white tracking-tight mb-2">
              Direct-to-R2 Upload
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed mb-5">
              High-speed direct S3/R2 presigned upload. Bypasses application server bottlenecks and converts adaptive HLS 1080p, 720p, 480p automatically.
            </p>

            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 mb-5 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Transcoding Renditions</span>
                <span className="font-semibold text-slate-200">1080p, 720p, 480p</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>HLS Segment Duration</span>
                <span className="font-semibold text-slate-200">6 Seconds</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Storage Provider</span>
                <span className="font-semibold text-emerald-400">Cloudflare R2</span>
              </div>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab("upload")}
            className="w-full py-3 px-4 rounded-xl font-semibold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center justify-center gap-2"
          >
            <span>Launch Upload Studio</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
