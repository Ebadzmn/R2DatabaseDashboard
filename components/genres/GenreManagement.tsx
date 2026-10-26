"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { IGenre } from "@/lib/types";
import { GenreModal } from "./GenreModal";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  Tag,
  Plus,
  RotateCw,
  Film,
  Flame,
  Smile,
  Zap,
  Moon,
  Rocket,
  Theater,
  Sparkles,
  Heart,
  Compass,
  Fingerprint,
  Star,
  Eye,
  Edit2,
  Trash2,
  CheckCircle2,
  Hash,
  Palette,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  flame: Flame,
  smile: Smile,
  bolt: Zap,
  moon: Moon,
  rocket: Rocket,
  theater: Theater,
  sparkles: Sparkles,
  heart: Heart,
  compass: Compass,
  fingerprint: Fingerprint,
  star: Star,
  eye: Eye,
  film: Film,
};

export function GenreManagement({ onGenresUpdated }: { onGenresUpdated?: () => void }) {
  const { success, error, info } = useToast();
  const [genres, setGenres] = useState<IGenre[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGenre, setEditingGenre] = useState<IGenre | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<IGenre | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchGenres = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.genres.getAll(true);
      setGenres(res.data || []);
      if (onGenresUpdated) onGenresUpdated();
    } catch (err: any) {
      error("Failed to load genres: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [error, onGenresUpdated]);

  useEffect(() => {
    fetchGenres();
  }, [fetchGenres]);

  const handleCreateOrUpdate = async (data: Partial<IGenre>) => {
    try {
      if (editingGenre) {
        await api.genres.update(editingGenre._id, data);
        success(`Genre "${data.name || editingGenre.name}" updated successfully!`);
      } else {
        await api.genres.create(data);
        success(`Genre "${data.name}" created successfully!`);
      }
      setIsModalOpen(false);
      setEditingGenre(null);
      fetchGenres();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.genres.delete(deleteTarget._id);
      success(`Genre "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      fetchGenres();
    } catch (err: any) {
      error("Failed to delete genre: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (genre: IGenre) => {
    try {
      const updatedStatus = !genre.isActive;
      await api.genres.update(genre._id, { isActive: updatedStatus });
      setGenres((prev) =>
        prev.map((g) => (g._id === genre._id ? { ...g, isActive: updatedStatus } : g))
      );
      info(`Genre "${genre.name}" is now ${updatedStatus ? "Active" : "Hidden"}.`);
      if (onGenresUpdated) onGenresUpdated();
    } catch (err: any) {
      error("Failed to update status: " + (err.message || "Unknown error"));
    }
  };

  const activeCount = genres.filter((g) => g.isActive).length;
  const totalCount = genres.reduce((sum, g) => sum + (g.count || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Summary */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Tag className="w-5 h-5 text-amber-400" />
            Genre Management Studio
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Curate dynamic genre capsules, gradient themes, and iconography displayed across CineCore app & web.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchGenres}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:border-slate-700 transition-all disabled:opacity-50"
            title="Refresh Genres"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-amber-400" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingGenre(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Genre
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Genres</p>
            <p className="text-2xl font-bold text-white mt-1">{genres.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Tag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active In App</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Tagged Catalog Movies</p>
            <p className="text-2xl font-bold text-indigo-400 mt-1">{totalCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Film className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Genres Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {isLoading && genres.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <RotateCw className="w-7 h-7 animate-spin text-amber-500" />
            <span className="text-sm">Loading dynamic genres...</span>
          </div>
        ) : genres.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
              <Tag className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No Genres Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Create your first genre to start organizing movies into dynamic capsules.
            </p>
            <button
              onClick={() => {
                setEditingGenre(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-amber-600 text-white rounded-xl text-xs font-semibold hover:bg-amber-500 transition-colors"
            >
              Add First Genre
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-5">Order</th>
                  <th className="py-3.5 px-5">Genre & Capsule Theme</th>
                  <th className="py-3.5 px-5">Slug</th>
                  <th className="py-3.5 px-5">Catalog Count</th>
                  <th className="py-3.5 px-5">App Visibility</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {genres.map((genre) => {
                  const IconComp = ICON_MAP[genre.icon] || Film;
                  const gStart = genre.gradientStart || "#FF5722";
                  const gEnd = genre.gradientEnd || "#F59E0B";

                  return (
                    <tr
                      key={genre._id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Order */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-slate-300">
                          <Hash className="w-3 h-3 text-slate-500" />
                          {genre.order}
                        </span>
                      </td>

                      {/* Genre Pill & Theme */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 shadow-md"
                            style={{
                              background: `linear-gradient(135deg, ${gStart}, ${gEnd})`,
                            }}
                          >
                            <IconComp className="w-5 h-5 drop-shadow" />
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-amber-300 transition-colors block">
                              {genre.name}
                            </span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20"
                                style={{ backgroundColor: gStart }}
                              />
                              <span
                                className="w-2.5 h-2.5 rounded-full border border-white/20"
                                style={{ backgroundColor: gEnd }}
                              />
                              <span className="text-[10px] text-slate-500 font-mono">
                                {gStart} → {gEnd}
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded-md text-slate-400 border border-slate-800">
                          /{genre.slug}
                        </span>
                      </td>

                      {/* Movies Count */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <Film className="w-3.5 h-3.5 text-amber-400" />
                          {genre.count || 0} movies
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggleActive(genre)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            genre.isActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              genre.isActive ? "bg-emerald-400" : "bg-slate-500"
                            }`}
                          />
                          {genre.isActive ? "Active (Live)" : "Hidden"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingGenre(genre);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Genre"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(genre)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Genre"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Genre Modal */}
      <GenreModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGenre(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingGenre}
        isEditing={!!editingGenre}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Genre"
        subtitle="This action removes the genre capsule from the app catalog"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete the genre{" "}
            <span className="font-semibold text-rose-400">"{deleteTarget?.name}"</span>?
          </p>
          <p className="text-xs text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            Movies tagged with this genre will remain in the catalog, but this genre capsule will no longer appear on the home screen.
          </p>
          <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-lg shadow-rose-600/20 disabled:opacity-50 transition-all flex items-center gap-2"
            >
              {isDeleting ? "Deleting..." : "Delete Genre"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
