"use client";

import React, { useState } from "react";
import { Trash2, AlertTriangle, X, HardDrive, Film } from "lucide-react";
import { IMovie } from "@/lib/types";

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  movie: IMovie | null;
}

export function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  movie,
}: ConfirmDeleteModalProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !movie) return null;

  const handleConfirm = async () => {
    try {
      setIsDeleting(true);
      await onConfirm();
      onClose();
    } catch {
      // Handled by parent toast
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-md transition-opacity animate-in fade-in"
        onClick={!isDeleting ? onClose : undefined}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0e1526] border border-rose-500/30 rounded-3xl shadow-2xl shadow-rose-950/40 overflow-hidden z-10 transition-all transform animate-in zoom-in-95 duration-200">
        {/* Glow accent */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-rose-500 via-amber-500 to-rose-600" />

        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isDeleting}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Danger Icon Badge */}
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400 mb-5 mx-auto">
            <Trash2 className="w-7 h-7" />
          </div>

          <div className="text-center">
            <h3 className="text-lg font-bold text-white tracking-tight">
              Delete & Purge Movie?
            </h3>
            <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">
              This will permanently delete the movie record from your database and purge all transcode renditions from Cloudflare R2.
            </p>
          </div>

          {/* Movie Target Card Preview */}
          <div className="mt-5 p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center gap-3.5 text-left">
            <div className="w-12 h-16 rounded-xl bg-slate-800 overflow-hidden shrink-0 relative">
              {movie.poster || movie.backdrop ? (
                <img
                  src={movie.poster || movie.backdrop}
                  alt={movie.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-600">
                  <Film className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-semibold text-slate-200 truncate">
                {movie.title}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>{movie.releaseYear || "N/A"}</span>
                <span>•</span>
                <span className="font-mono text-indigo-400">{movie.type || "MOVIE"}</span>
                {movie.resolution && (
                  <>
                    <span>•</span>
                    <span className="text-emerald-400 font-mono">{movie.resolution}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* R2 Asset Cleanup Warning */}
          <div className="mt-4 p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-start gap-2.5 text-left">
            <HardDrive className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="text-[11px] text-amber-300/90 leading-normal">
              Cloudflare R2 storage segments, <code className="text-amber-400 font-mono">master.m3u8</code> playlists, and original source files will be automatically purged to free up bucket storage.
            </p>
          </div>

          {/* Actions */}
          <div className="mt-6 flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-900/60 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirm}
              disabled={isDeleting}
              className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              {isDeleting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Purging...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Yes, Delete Now</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
