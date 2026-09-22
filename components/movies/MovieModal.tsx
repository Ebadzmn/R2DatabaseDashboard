"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { IMovie, MovieType } from "@/lib/types";
import { Film, Image, Calendar, Tag, FileText, Check } from "lucide-react";

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMovie>) => Promise<void>;
  initialData?: IMovie | null;
  isEditing?: boolean;
}

export function MovieModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: MovieModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [type, setType] = useState<MovieType>("MOVIE");
  const [releaseYear, setReleaseYear] = useState<number | undefined>(new Date().getFullYear());
  const [genresInput, setGenresInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setPoster(initialData.poster || "");
      setBackdrop(initialData.backdrop || "");
      setType(initialData.type || "MOVIE");
      setReleaseYear(initialData.releaseYear || new Date().getFullYear());
      setGenresInput(initialData.genres?.join(", ") || "");
    } else {
      setTitle("");
      setDescription("");
      setPoster("");
      setBackdrop("");
      setType("MOVIE");
      setReleaseYear(new Date().getFullYear());
      setGenresInput("");
    }
  }, [initialData, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      const genres = genresInput
        .split(",")
        .map((g) => g.trim())
        .filter(Boolean);

      await onSubmit({
        title: title.trim(),
        description: description.trim() || undefined,
        poster: poster.trim() || undefined,
        backdrop: backdrop.trim() || undefined,
        type,
        releaseYear: releaseYear ? Number(releaseYear) : undefined,
        genres,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Movie Record" : "Add New Movie Record"}
      subtitle={
        isEditing
          ? "Update movie metadata, descriptions, and artwork URLs"
          : "Create a catalog entry ready for R2 video transcoding"
      }
      maxWidth="2xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Movie Title <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <Film className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              required
              placeholder="e.g. Inception, Interstellar, Reacher"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Type & Release Year */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Media Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as MovieType)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            >
              <option value="MOVIE">Movie (Feature Film)</option>
              <option value="SERIES">TV Series / Episode</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Release Year</label>
            <div className="relative">
              <Calendar className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="number"
                min={1888}
                max={2100}
                placeholder="2026"
                value={releaseYear || ""}
                onChange={(e) => setReleaseYear(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Genres */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Genres <span className="text-slate-500 font-normal">(comma-separated)</span>
          </label>
          <div className="relative">
            <Tag className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Action, Sci-Fi, Thriller, Drama"
              value={genresInput}
              onChange={(e) => setGenresInput(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Poster URL & Backdrop URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Poster Image URL</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">Backdrop Image URL</label>
            <div className="relative">
              <Image className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="url"
                placeholder="https://images.unsplash.com/..."
                value={backdrop}
                onChange={(e) => setBackdrop(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Image Preview Banner */}
        {(poster || backdrop) && (
          <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-4">
            {poster && (
              <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                <img src={poster} alt="Poster preview" className="w-full h-full object-cover" />
              </div>
            )}
            {backdrop && (
              <div className="h-16 flex-1 rounded-lg bg-slate-800 overflow-hidden border border-slate-700">
                <img src={backdrop} alt="Backdrop preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Synopsis / Description
          </label>
          <div className="relative">
            <textarea
              rows={3}
              placeholder="Write a concise overview of the storyline, cast, or director..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Check className="w-4 h-4" />
            <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : "Create Record"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
