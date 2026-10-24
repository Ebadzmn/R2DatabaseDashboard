"use client";

import React, { useState, useEffect, useRef } from "react";
import { api } from "@/lib/api-client";
import { Modal } from "@/components/ui/Modal";
import { IMovie, MovieType, ITmdbDetails } from "@/lib/types";
import { Film, Image, Calendar, Tag, FileText, Check, Sparkles, Star, User, Video, ExternalLink, Trash2, Plus, Edit2, UploadCloud } from "lucide-react";
import { TmdbSearchModal } from "./TmdbSearchModal";
import { resolveImageUrl } from "@/lib/image-url";

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
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingScreenshot, setIsUploadingScreenshot] = useState(false);

  const handleScreenshotFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingScreenshot(true);
      if (initialData?._id) {
        const res = await api.movies.uploadScreenshot(initialData._id, file);
        if (res.data?.screenshots) {
          setScreenshots(res.data.screenshots);
        } else if (res.data?.url) {
          setScreenshots((prev) => [...prev, res.data.url]);
        }
      } else {
        const res = await api.movies.uploadImage(file);
        if (res.data?.url) {
          setScreenshots((prev) => [...prev, res.data.url]);
        }
      }
      e.target.value = "";
    } catch (err: any) {
      alert("Screenshot upload failed: " + (err.message || "Could not upload image"));
    } finally {
      setIsUploadingScreenshot(false);
    }
  };
  const [editingUrl, setEditingUrl] = useState("");

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
      setScreenshots(initialData.screenshots || []);
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
      setScreenshots([]);
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
        screenshots: screenshots.filter((s) => s.trim().length > 0),
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

          {/* Screenshots Manager (View, Add, Edit, Delete, Set as Poster/Backdrop) */}
          <div className="space-y-2.5 p-3.5 rounded-2xl bg-slate-900/70 border border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Film className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-semibold text-slate-200">
                  Preview Screenshots ({screenshots.length})
                </span>
              </div>
              <span className="text-[10px] text-slate-400">
                Auto-captured or custom URLs
              </span>
            </div>

            {screenshots.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {screenshots.map((url, index) => (
                  <div
                    key={index}
                    className="group relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-md flex flex-col justify-between"
                  >
                    <img
                      src={resolveImageUrl(url, initialData?._id)}
                      alt={`Screenshot ${index + 1}`}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                      onError={(e) => {
                        const target = e.currentTarget;
                        const filename = url.split("/").pop() || `screenshot_${index + 1}.jpg`;
                        const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                        const proxyUrl = initialData?._id
                          ? `${apiBase}/movies/${initialData._id}/screenshots/${filename}`
                          : "";
                        if (proxyUrl && target.src !== proxyUrl) {
                          target.src = proxyUrl;
                        }
                      }}
                    />

                    {/* Top badges & action buttons */}
                    <div className="absolute top-1.5 inset-x-1.5 flex items-center justify-between opacity-90">
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/75 text-slate-300 border border-white/10">
                        #{index + 1}
                      </span>

                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/70 p-0.5 rounded-lg backdrop-blur-xs">
                        <button
                          type="button"
                          onClick={() => setPoster(url)}
                          title="Set as Poster"
                          className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-indigo-600/80 hover:bg-indigo-600 text-white transition-all cursor-pointer"
                        >
                          Poster
                        </button>
                        <button
                          type="button"
                          onClick={() => setBackdrop(url)}
                          title="Set as Backdrop"
                          className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-purple-600/80 hover:bg-purple-600 text-white transition-all cursor-pointer"
                        >
                          Backdrop
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setScreenshots(screenshots.filter((_, i) => i !== index));
                            if (editingIndex === index) setEditingIndex(null);
                          }}
                          title="Delete screenshot"
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* Bottom quick view & edit link */}
                    <div className="absolute bottom-1.5 inset-x-1.5 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingIndex(index);
                          setEditingUrl(url);
                        }}
                        className="px-1.5 py-0.5 rounded text-[9px] bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800 flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <Edit2 className="w-2.5 h-2.5 text-amber-400" /> Edit URL
                      </button>
                      <a
                        href={resolveImageUrl(url, initialData?._id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 rounded bg-slate-900/90 text-slate-300 border border-slate-700 hover:bg-slate-800 transition-all"
                        title="Open full size"
                      >
                        <ExternalLink className="w-2.5 h-2.5 text-indigo-300" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 text-center rounded-xl bg-slate-950/40 border border-dashed border-slate-800 text-[11px] text-slate-500">
                No screenshots yet. They are captured automatically during transcoding, or you can add image URLs below.
              </div>
            )}

            {/* Inline edit active screenshot */}
            {editingIndex !== null && (
              <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 space-y-1.5">
                <div className="flex items-center justify-between text-xs text-amber-300 font-medium">
                  <span>Editing Screenshot #{editingIndex + 1} URL:</span>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
                <div className="flex gap-2">
                  <input
                    type="url"
                    value={editingUrl}
                    onChange={(e) => setEditingUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (editingUrl.trim()) {
                        const updated = [...screenshots];
                        updated[editingIndex] = editingUrl.trim();
                        setScreenshots(updated);
                      }
                      setEditingIndex(null);
                    }}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-semibold transition-all cursor-pointer"
                  >
                    Update
                  </button>
                </div>
              </div>
            )}

            {/* Add new screenshot URL */}
            <div className="flex gap-2 pt-1">
              <input
                type="url"
                placeholder="Add screenshot image URL (https://...)"
                value={newScreenshotUrl}
                onChange={(e) => setNewScreenshotUrl(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    if (newScreenshotUrl.trim()) {
                      setScreenshots([...screenshots, newScreenshotUrl.trim()]);
                      setNewScreenshotUrl("");
                    }
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
              />
              <button
                type="button"
                onClick={() => {
                  if (newScreenshotUrl.trim()) {
                    setScreenshots([...screenshots, newScreenshotUrl.trim()]);
                    setNewScreenshotUrl("");
                  }
                }}
                disabled={!newScreenshotUrl.trim()}
                className="px-3 py-1.5 bg-indigo-600/90 hover:bg-indigo-600 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleScreenshotFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploadingScreenshot}
                className="px-3.5 py-1.5 bg-emerald-600/90 hover:bg-emerald-600 disabled:opacity-50 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer shadow-sm shrink-0"
                title="Upload screenshot image from your device"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                <span>{isUploadingScreenshot ? "Uploading..." : "Upload File"}</span>
              </button>
            </div>
          </div>

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
