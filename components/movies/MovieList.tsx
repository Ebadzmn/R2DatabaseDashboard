"use client";

import React, { useState } from "react";
import { IMovie, MovieStatus } from "@/lib/types";
import {
  Film,
  Search,
  Filter,
  Play,
  RotateCw,
  Edit2,
  Trash2,
  LayoutGrid,
  List,
  Clock,
  Sparkles,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface MovieListProps {
  movies: IMovie[];
  onSelectMovie: (movie: IMovie) => void;
  onEditMovie: (movie: IMovie) => void;
  onDeleteMovie: (id: string) => void;
  onPlayMovie: (movie: IMovie) => void;
  onReprocessMovie: (id: string) => void;
  onOpenCreate: () => void;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function MovieList({
  movies,
  onSelectMovie,
  onEditMovie,
  onDeleteMovie,
  onPlayMovie,
  onReprocessMovie,
  onOpenCreate,
  onRefresh,
  isLoading = false,
}: MovieListProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  const filteredMovies = movies.filter((m) => {
    const matchesSearch =
      m.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (m.description && m.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = statusFilter === "ALL" || m.status === statusFilter;
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
            Transcoding {progress ? `${progress}%` : ""}
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
            placeholder="Search movies by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-xl text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500/60 focus:ring-1 focus:ring-indigo-500/30 transition-all"
          />
        </div>

        {/* Status Filter & View Toggle */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 bg-slate-900/90 border border-slate-800 rounded-xl p-1 text-xs">
            {["ALL", "READY", "PROCESSING", "DRAFT", "FAILED"].map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
                  statusFilter === status
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
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
                  ? "bg-indigo-600 text-white"
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
                  ? "bg-indigo-600 text-white"
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

      {/* Movie Results */}
      {filteredMovies.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a]/50 border border-slate-800/80">
          <Film className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
          <h4 className="text-base font-semibold text-slate-300">No movies match your criteria</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query or filter tags, or create a new movie record.
          </p>
          <button
            onClick={onOpenCreate}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
          >
            Create New Movie
          </button>
        </div>
      ) : viewMode === "grid" ? (
        /* Grid View */
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredMovies.map((movie) => (
            <div
              key={movie._id}
              className="rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-indigo-500/40 shadow-xl overflow-hidden group transition-all flex flex-col justify-between"
            >
              {/* Poster Card Header */}
              <div className="relative aspect-[16/10] bg-slate-900 overflow-hidden">
                {movie.backdrop || movie.poster ? (
                  <img
                    src={movie.backdrop || movie.poster}
                    alt={movie.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center text-slate-600">
                    <Film className="w-10 h-10 mb-1 opacity-30" />
                    <span className="text-[10px]">No visual media</span>
                  </div>
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-[#0f172a] via-transparent to-black/30" />

                <div className="absolute top-3 left-3">{getStatusBadge(movie.status, movie.processingProgress)}</div>

                <div className="absolute top-3 right-3 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-slate-300 border border-white/10 uppercase">
                  {movie.type}
                </div>

                {movie.status === "READY" && (
                  <button
                    onClick={() => onPlayMovie(movie)}
                    className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 backdrop-blur-[2px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-xl shadow-indigo-600/50 transform hover:scale-110 transition-transform">
                      <Play className="w-5 h-5 fill-white ml-0.5" />
                    </div>
                  </button>
                )}
              </div>

              {/* Card Body */}
              <div className="p-4 flex-1 flex flex-col justify-between">
                <div>
                  <h4 className="font-bold text-slate-100 text-sm group-hover:text-indigo-400 transition-colors line-clamp-1">
                    {movie.title}
                  </h4>
                  <div className="flex items-center gap-2 mt-1 text-xs text-slate-400">
                    <span>{movie.releaseYear || "N/A"}</span>
                    {movie.duration && (
                      <>
                        <span>•</span>
                        <span>{Math.round(movie.duration / 60)} min</span>
                      </>
                    )}
                    {movie.resolution && (
                      <>
                        <span>•</span>
                        <span className="text-emerald-400 font-mono text-[11px]">
                          {movie.resolution}
                        </span>
                      </>
                    )}
                  </div>
                  {movie.description && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                      {movie.description}
                    </p>
                  )}
                </div>

                {/* Card Footer Actions */}
                <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    {movie.status === "READY" && (
                      <button
                        onClick={() => onPlayMovie(movie)}
                        className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-lg transition-colors"
                        title="Stream HLS Playback"
                      >
                        <Play className="w-4 h-4 fill-current" />
                      </button>
                    )}
                    <button
                      onClick={() => onReprocessMovie(movie._id)}
                      className="p-1.5 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
                      title="Trigger FFmpeg Transcoding"
                    >
                      <RotateCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onEditMovie(movie)}
                      className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                      title="Edit metadata"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                  </div>

                  <button
                    onClick={() => onDeleteMovie(movie._id)}
                    className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Movie and R2 objects"
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
                <th className="py-3.5 px-4">Movie</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Year</th>
                <th className="py-3.5 px-4">Resolution</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMovies.map((movie) => (
                <tr
                  key={movie._id}
                  className="hover:bg-slate-800/30 transition-colors group"
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-11 rounded bg-slate-800 shrink-0 overflow-hidden flex items-center justify-center text-slate-600">
                        {movie.poster ? (
                          <img
                            src={movie.poster}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <Film className="w-3.5 h-3.5" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="font-semibold text-slate-200 group-hover:text-indigo-400 transition-colors">
                          {movie.title}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          /{movie.slug}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4 uppercase text-slate-400 font-medium">
                    {movie.type}
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {movie.releaseYear || "—"}
                  </td>
                  <td className="py-3 px-4 font-mono text-emerald-400">
                    {movie.resolution || "—"}
                  </td>
                  <td className="py-3 px-4">
                    {getStatusBadge(movie.status, movie.processingProgress)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {movie.status === "READY" && (
                        <button
                          onClick={() => onPlayMovie(movie)}
                          className="p-1.5 text-emerald-400 hover:bg-emerald-500/10 rounded-lg"
                          title="Stream Playback"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                      <button
                        onClick={() => onReprocessMovie(movie._id)}
                        className="p-1.5 text-amber-400 hover:bg-amber-500/10 rounded-lg"
                        title="Reprocess"
                      >
                        <RotateCw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onEditMovie(movie)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg"
                        title="Edit"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => onDeleteMovie(movie._id)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg"
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
