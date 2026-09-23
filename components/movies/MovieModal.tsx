"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { IMovie, MovieType, ITmdbDetails } from "@/lib/types";
import { Film, Image, Calendar, Tag, FileText, Check, Sparkles, Star, User, Video, ExternalLink } from "lucide-react";
import { TmdbSearchModal } from "./TmdbSearchModal";

interface MovieModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IMovie>) => Promise<void>;
  initialData?: IMovie | null;
  isEditing?: boolean;
  defaultType?: MovieType;
}

export function MovieModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
  defaultType = "MOVIE",
}: MovieModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [poster, setPoster] = useState("");
  const [backdrop, setBackdrop] = useState("");
  const [type, setType] = useState<MovieType>(defaultType);
  const [releaseYear, setReleaseYear] = useState<number | undefined>(new Date().getFullYear());
  const [genresInput, setGenresInput] = useState("");
  const [duration, setDuration] = useState<number | undefined>();
  const [rating, setRating] = useState<number | undefined>();
  const [director, setDirector] = useState<string>("");
  const [trailerUrl, setTrailerUrl] = useState<string>("");
  const [tmdbId, setTmdbId] = useState<number | undefined>();
  const [totalSeasons, setTotalSeasons] = useState<number | undefined>(1);
  const [cast, setCast] = useState<{ name: string; character?: string; image?: string }[]>([]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isTmdbSearchOpen, setIsTmdbSearchOpen] = useState(false);

  useEffect(() => {
    if (initialData) {
      setTitle(initialData.title || "");
      setDescription(initialData.description || "");
      setPoster(initialData.poster || "");
      setBackdrop(initialData.backdrop || "");
      setType(initialData.type || defaultType);
      setReleaseYear(initialData.releaseYear || new Date().getFullYear());
      setGenresInput(initialData.genres?.join(", ") || "");
      setDuration(initialData.duration ? Math.round(initialData.duration / 60) : undefined);
      setRating(initialData.rating);
      setDirector(initialData.director || "");
      setTrailerUrl(initialData.trailerUrl || "");
      setTmdbId(initialData.tmdbId);
      setTotalSeasons(initialData.totalSeasons || 1);
      setCast(initialData.cast || []);
    } else {
      setTitle("");
      setDescription("");
      setPoster("");
      setBackdrop("");
      setType(defaultType);
      setReleaseYear(new Date().getFullYear());
      setGenresInput("");
      setDuration(undefined);
      setRating(undefined);
      setDirector("");
      setTrailerUrl("");
      setTmdbId(undefined);
      setTotalSeasons(1);
      setCast([]);
    }
  }, [initialData, isOpen, defaultType]);

  const handleTmdbAutoFill = (details: ITmdbDetails) => {
    setTitle(details.title || "");
    setDescription(details.overview || "");
    if (details.poster) setPoster(details.poster);
    if (details.backdrop) setBackdrop(details.backdrop);
    if (details.releaseYear) setReleaseYear(details.releaseYear);
    if (details.genres?.length) setGenresInput(details.genres.join(", "));
    if (details.duration) setDuration(details.duration);
    if (details.rating) setRating(details.rating);
    if (details.director) setDirector(details.director);
    if (details.trailerUrl) setTrailerUrl(details.trailerUrl);
    if (details.cast) setCast(details.cast);
    if (details.numberOfSeasons) setTotalSeasons(details.numberOfSeasons);
    setTmdbId(details.id);
  };

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
        duration: duration ? duration * 60 : undefined,
        rating: rating ? Number(rating) : undefined,
        director: director.trim() || undefined,
        trailerUrl: trailerUrl.trim() || undefined,
        tmdbId,
        totalSeasons: type === "SERIES" ? (totalSeasons ? Number(totalSeasons) : 1) : undefined,
        cast,
      });

      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={isEditing ? `Edit ${type === "SERIES" ? "Series" : "Movie"}` : `Add New ${type === "SERIES" ? "Series" : "Movie"}`}
        subtitle={
          isEditing
            ? "Update metadata, cast, descriptions, and artwork URLs"
            : "Create a catalog entry or auto-fetch directly from TMDB"
        }
        maxWidth="3xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* TMDB Quick-Fetch Banner */}
          {!isEditing && (
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-indigo-950/60 via-purple-950/40 to-slate-900 border border-indigo-500/30 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/30 border border-indigo-500/40 flex items-center justify-center text-indigo-400 shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-slate-100">Auto-fill with TMDB</h4>
                  <p className="text-[11px] text-slate-400">Fetch description, posters, genres, cast & ratings automatically</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsTmdbSearchOpen(true)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Search TMDB</span>
              </button>
            </div>
          )}

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-300">
                Title <span className="text-rose-400">*</span>
              </label>
              {tmdbId && (
                <span className="text-[10px] text-emerald-400 font-medium bg-emerald-400/10 px-2 py-0.5 rounded border border-emerald-400/20">
                  TMDB Linked #{tmdbId}
                </span>
              )}
            </div>
            <div className="relative">
              <Film className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. Inception, Interstellar, Breaking Bad"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
              />
            </div>
          </div>

          {/* Type, Year, Duration, Rating, Total Seasons */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as MovieType)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              >
                <option value="MOVIE">Movie</option>
                <option value="SERIES">TV Series</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Release Year</label>
              <input
                type="number"
                min={1888}
                max={2100}
                placeholder="2026"
                value={releaseYear || ""}
                onChange={(e) => setReleaseYear(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {type === "SERIES" ? "Ep. Duration (m)" : "Duration (m)"}
              </label>
              <input
                type="number"
                placeholder="148"
                value={duration || ""}
                onChange={(e) => setDuration(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>

            {type === "SERIES" ? (
              <div>
                <label className="block text-xs font-semibold text-purple-400 mb-1.5">Total Seasons</label>
                <input
                  type="number"
                  min={1}
                  max={100}
                  placeholder="1"
                  value={totalSeasons || 1}
                  onChange={(e) => setTotalSeasons(e.target.value ? Number(e.target.value) : 1)}
                  className="w-full px-3 py-2 bg-slate-900 border border-purple-500/40 rounded-xl text-xs text-purple-300 focus:outline-none focus:border-purple-500 transition-all"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Rating (0-10)</label>
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={10}
                  placeholder="8.8"
                  value={rating || ""}
                  onChange={(e) => setRating(e.target.value ? Number(e.target.value) : undefined)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
                />
              </div>
            )}
          </div>

          {/* Director & Trailer URL */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Director / Creator</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Christopher Nolan"
                  value={director}
                  onChange={(e) => setDirector(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Trailer URL (YouTube)</label>
              <div className="relative">
                <Video className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://www.youtube.com/watch?v=..."
                  value={trailerUrl}
                  onChange={(e) => setTrailerUrl(e.target.value)}
                  className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
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
                className="w-full pl-10 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>
          </div>

          {/* Poster & Backdrop URLs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Poster URL</label>
              <input
                type="url"
                placeholder="https://image.tmdb.org/t/p/w780/..."
                value={poster}
                onChange={(e) => setPoster(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Backdrop URL</label>
              <input
                type="url"
                placeholder="https://image.tmdb.org/t/p/original/..."
                value={backdrop}
                onChange={(e) => setBackdrop(e.target.value)}
                className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
            </div>
          </div>

          {/* Artwork Preview */}
          {(poster || backdrop) && (
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-center gap-3">
              {poster && (
                <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                  <img src={poster} alt="Poster preview" className="w-full h-full object-cover" />
                </div>
              )}
              {backdrop && (
                <div className="h-16 flex-1 rounded-lg bg-slate-800 overflow-hidden border border-slate-700 relative">
                  <img src={backdrop} alt="Backdrop preview" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-1.5">
                    <span className="text-[10px] text-white font-medium">Backdrop Preview</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Cast Preview */}
          {cast.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">Cast ({cast.length})</label>
              <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
                {cast.slice(0, 8).map((actor, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 bg-slate-900/80 border border-slate-800 px-2 py-1 rounded-lg shrink-0">
                    {actor.image ? (
                      <img src={actor.image} alt={actor.name} className="w-5 h-5 rounded-full object-cover" />
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center text-[9px] text-slate-400">
                        {actor.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-200 font-medium leading-tight">{actor.name}</span>
                      {actor.character && (
                        <span className="text-[9px] text-slate-500 leading-tight truncate max-w-[90px]">{actor.character}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Synopsis / Description
            </label>
            <textarea
              rows={3}
              placeholder="Write a concise overview of the storyline, cast, or plot..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all leading-relaxed"
            />
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? "Saving..." : isEditing ? "Save Changes" : `Create ${type === "SERIES" ? "Series" : "Movie"}`}</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* TMDB Search Modal */}
      <TmdbSearchModal
        isOpen={isTmdbSearchOpen}
        onClose={() => setIsTmdbSearchOpen(false)}
        mediaType={type}
        onSelect={handleTmdbAutoFill}
      />
    </>
  );
}
