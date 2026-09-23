"use client";

import React, { useState } from "react";
import { IMovie, MovieStatus } from "@/lib/types";
import {
  Tv,
  Search,
  RotateCw,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Clock,
  AlertCircle,
  CheckCircle2,
  Play,
  Layers,
  Plus,
  Sparkles,
  ChevronRight,
  UploadCloud,
} from "lucide-react";

interface SeriesListProps {
  series: IMovie[];
  onSelectSeries: (series: IMovie) => void;
  onEditSeries: (series: IMovie) => void;
  onDeleteSeries: (id: string) => void;
  onPlaySeries: (series: IMovie) => void;
  onReprocessSeries: (id: string) => void;
  onUploadVideo?: (series: IMovie) => void;
  onManageEpisodes: (series: IMovie) => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function SeriesList({
  series,
  onSelectSeries,
  onEditSeries,
  onDeleteSeries,
  onPlaySeries,
  onReprocessSeries,
  onUploadVideo,
  onManageEpisodes,
  onOpenCreate,
  onRefresh,
  isLoading = false,
}: SeriesListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredSeries = series.filter((s) => {
    const matchesSearch =
      s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (s.description && s.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || s.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: MovieStatus, progress?: number) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Ready
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RotateCw className="w-3.5 h-3.5 animate-spin" />
            Processing {progress ? `${progress}%` : ""}
          </span>
        );
      case "UPLOADING":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3.5 h-3.5" />
            Uploading
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3.5 h-3.5" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Controls Bar: Search, Filters, View toggle */}
      <div className="p-4 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search TV series, shows, episodes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            {["ALL", "READY", "PROCESSING", "DRAFT"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {status}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "grid"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("table")}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-purple-600 text-white"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onRefresh}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Refresh list"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      {/* Series Results */}
      {filteredSeries.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a]/50 border border-slate-800/80">
          <Tv className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
          <h4 className="text-base font-semibold text-slate-300">No TV Series cataloged yet</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Use TMDB auto-import to catalog shows with seasons and episodes in seconds.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white rounded-xl transition-all inline-flex items-center gap-2 shadow-lg shadow-purple-600/30 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Series</span>
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredSeries.map((item) => (
            <div
              key={item._id}
              className="rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-purple-500/40 shadow-xl overflow-hidden group transition-all flex flex-col justify-between"
            >
              {/* Poster Card Header */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                {item.backdrop || item.poster ? (
                  <img
                    src={item.backdrop || item.poster}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <Tv className="w-10 h-10 mb-1 opacity-30" />
                    <span className="text-[10px]">No visual media</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/30" />

                <div className="absolute top-3 left-3">{getStatusBadge(item.status, item.processingProgress)}</div>

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-purple-950/80 backdrop-blur-md text-[10px] font-semibold text-purple-300 border border-purple-500/30 uppercase flex items-center gap-1">
                  <Layers className="w-3 h-3" />
                  <span>{item.episodes?.length || 0} EPS</span>
                </div>

                {item.status === "READY" && (
                  <button
                    onClick={() => onPlaySeries(item)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px] cursor-pointer"
                  >
                    <div className="w-12 h-12 rounded-full bg-purple-600 hover:bg-purple-500 text-white flex items-center justify-center shadow-xl shadow-purple-600/50 transform hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-purple-400 transition-colors line-clamp-1">
                    {item.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{item.releaseYear || "N/A"}</span>
                    {item.rating && (
                      <>
                        <span>•</span>
                        <span className="text-amber-400 font-semibold">★ {item.rating}</span>
                      </>
                    )}
                    {item.genres?.length > 0 && (
                      <>
                        <span>•</span>
                        <span className="text-slate-400 truncate max-w-[100px]">{item.genres[0]}</span>
                      </>
                    )}
                  </div>
                  {item.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {item.description}
                    </p>
                  )}

                  {/* Manage Episodes & Seasons Button */}
                  <div className="mt-3">
                    <button
                      onClick={() => onManageEpisodes(item)}
                      className="w-full py-2 px-3 rounded-xl bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all flex items-center justify-between cursor-pointer group/btn"
                    >
                      <div className="flex items-center gap-1.5">
                        <Layers className="w-3.5 h-3.5 text-purple-400 group-hover/btn:text-white" />
                        <span>Seasons & Episodes</span>
                      </div>
                      <span className="text-[10px] font-mono bg-purple-900/80 px-1.5 py-0.5 rounded text-purple-200">
                        {item.episodes?.length || 0}
                      </span>
                    </button>
                  </div>

                  {/* Live Transcoding Progress Bar */}
                  {item.status === "PROCESSING" && (
                    <div className="mt-3 p-2.5 rounded-xl bg-purple-500/10 border border-purple-500/20 space-y-1.5 animate-in fade-in">
                      <div className="flex items-center justify-between text-[11px] font-semibold">
                        <span className="text-purple-400 flex items-center gap-1.5">
                          <RotateCw className="w-3 h-3 animate-spin" />
                          <span>Transcoding HLS (1080p + 720p)</span>
                        </span>
                        <span className="text-purple-300 font-mono font-bold">
                          {item.processingProgress || 0}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-purple-500/30">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-indigo-400 rounded-full transition-all duration-300 shadow-md shadow-purple-500/50"
                          style={{ width: `${Math.max(5, item.processingProgress || 0)}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {item.status === "READY" && (
                      <button
                        onClick={() => onPlaySeries(item)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Stream Playback"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onReprocessSeries(item._id)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors cursor-pointer"
                      title="Trigger Transcoding"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditSeries(item)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    {onUploadVideo && (
                      <button
                        onClick={() => onUploadVideo(item)}
                        className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Upload Episode Video file"
                      >
                        <UploadCloud className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => onDeleteSeries(item._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                    title="Delete Series"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* Table View */
        <div className="rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 shadow-xl overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900/60 border-b border-slate-800/80 text-slate-400 font-semibold uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Series Title</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Episodes</th>
                <th className="py-3.5 px-4">Rating</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredSeries.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/30 transition-colors group">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-11 rounded bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-slate-600">
                        {item.poster ? (
                          <img src={item.poster} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <Tv className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 group-hover:text-purple-400 transition-colors">
                          {item.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">/{item.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">{item.releaseYear || "—"}</td>
                  <td className="py-3 px-4">
                    <button
                      onClick={() => onManageEpisodes(item)}
                      className="px-2.5 py-1 rounded-lg bg-purple-950/60 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition-all inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      <Layers className="w-3 h-3" />
                      <span>{item.episodes?.length || 0} Episodes</span>
                    </button>
                  </td>
                  <td className="py-3 px-4 text-amber-400 font-semibold">{item.rating ? `★ ${item.rating}` : "—"}</td>
                  <td className="py-3 px-4">{getStatusBadge(item.status, item.processingProgress)}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === "READY" && (
                        <button
                          onClick={() => onPlaySeries(item)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg cursor-pointer"
                          title="Stream Playback"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => onReprocessSeries(item._id)}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg cursor-pointer"
                        title="Reprocess"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditSeries(item)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg cursor-pointer"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      {onUploadVideo && (
                        <button
                          onClick={() => onUploadVideo(item)}
                          className="p-1.5 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10 rounded-lg cursor-pointer"
                          title="Upload Video"
                        >
                          <UploadCloud className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteSeries(item._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                        title="Delete"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
