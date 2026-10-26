"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { ICategory } from "@/lib/types";
import { CategoryModal } from "./CategoryModal";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  Layers,
  Plus,
  RotateCw,
  Film,
  Tv,
  Trophy,
  FileVideo,
  Flame,
  Star,
  Music,
  Gamepad2,
  Sparkles,
  Clapperboard,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  Hash,
  Video,
} from "lucide-react";

const ICON_MAP: Record<string, React.ElementType> = {
  movie: Film,
  sports: Trophy,
  tv: Tv,
  series: Layers,
  documentary: FileVideo,
  action: Flame,
  trending: Sparkles,
  cinema: Clapperboard,
  music: Music,
  gaming: Gamepad2,
};

export function CategoryManagement({ onCategoriesUpdated }: { onCategoriesUpdated?: () => void }) {
  const { success, error, info } = useToast();
  const [categories, setCategories] = useState<ICategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<ICategory | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ICategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchCategories = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await api.categories.getAll(true);
      setCategories(res.data || []);
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err: any) {
      error("Failed to load categories: " + (err.message || "Unknown error"));
    } finally {
      setIsLoading(false);
    }
  }, [error, onCategoriesUpdated]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleCreateOrUpdate = async (data: Partial<ICategory>) => {
    try {
      if (editingCategory) {
        await api.categories.update(editingCategory._id, data);
        success(`Category "${data.name || editingCategory.name}" updated successfully!`);
      } else {
        await api.categories.create(data);
        success(`Category "${data.name}" created successfully!`);
      }
      setIsModalOpen(false);
      setEditingCategory(null);
      fetchCategories();
    } catch (err: any) {
      throw err;
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      setIsDeleting(true);
      await api.categories.delete(deleteTarget._id);
      success(`Category "${deleteTarget.name}" deleted successfully.`);
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      error("Failed to delete category: " + (err.message || "Unknown error"));
    } finally {
      setIsDeleting(false);
    }
  };

  const handleToggleActive = async (category: ICategory) => {
    try {
      const updatedStatus = !category.isActive;
      await api.categories.update(category._id, { isActive: updatedStatus });
      setCategories((prev) =>
        prev.map((c) => (c._id === category._id ? { ...c, isActive: updatedStatus } : c))
      );
      info(`Category "${category.name}" is now ${updatedStatus ? "Active" : "Inactive"}.`);
      if (onCategoriesUpdated) onCategoriesUpdated();
    } catch (err: any) {
      error("Failed to update status: " + (err.message || "Unknown error"));
    }
  };

  const activeCount = categories.filter((c) => c.isActive).length;
  const totalContentCount = categories.reduce((sum, c) => sum + (c.movieCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header and Summary stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <Layers className="w-5 h-5 text-indigo-400" />
            Category Management
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Dynamic content categories synced in real-time with the CineCore mobile app and web player.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchCategories}
            disabled={isLoading}
            className="p-2.5 bg-slate-900 border border-slate-800 text-slate-400 hover:text-white rounded-xl hover:border-slate-700 transition-all disabled:opacity-50"
            title="Refresh Categories"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin text-indigo-400" : ""}`} />
          </button>
          <button
            onClick={() => {
              setEditingCategory(null);
              setIsModalOpen(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 text-sm font-semibold transition-all"
          >
            <Plus className="w-4 h-4" />
            Add New Category
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Categories</p>
            <p className="text-2xl font-bold text-white mt-1">{categories.length}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Active in App</p>
            <p className="text-2xl font-bold text-emerald-400 mt-1">{activeCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-5 flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Categorized Movies & Shows</p>
            <p className="text-2xl font-bold text-amber-400 mt-1">{totalContentCount}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Film className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Categories Cards / Table */}
      <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl overflow-hidden backdrop-blur-sm">
        {isLoading && categories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 gap-3">
            <RotateCw className="w-7 h-7 animate-spin text-indigo-500" />
            <span className="text-sm">Loading dynamic categories...</span>
          </div>
        ) : categories.length === 0 ? (
          <div className="py-20 flex flex-col items-center justify-center text-center p-6">
            <div className="w-16 h-16 rounded-2xl bg-slate-800/50 flex items-center justify-center text-slate-600 mb-4">
              <Layers className="w-8 h-8" />
            </div>
            <h3 className="text-base font-semibold text-white">No Categories Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Create your first category (e.g. Movies, Sports, TV Shows) to allow organizing and filtering content.
            </p>
            <button
              onClick={() => {
                setEditingCategory(null);
                setIsModalOpen(true);
              }}
              className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-500 transition-colors"
            >
              Add First Category
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-950/40">
                  <th className="py-3.5 px-5">Order</th>
                  <th className="py-3.5 px-5">Category & Icon</th>
                  <th className="py-3.5 px-5">Slug</th>
                  <th className="py-3.5 px-5">Contents</th>
                  <th className="py-3.5 px-5">App Visibility</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50 text-sm">
                {categories.map((category) => {
                  const IconComponent = ICON_MAP[category.icon] || Film;
                  return (
                    <tr
                      key={category._id}
                      className="hover:bg-slate-800/30 transition-colors group"
                    >
                      {/* Order Badge */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/60 text-xs font-mono font-medium text-slate-300">
                          <Hash className="w-3 h-3 text-slate-500" />
                          {category.order}
                        </span>
                      </td>

                      {/* Name & Icon */}
                      <td className="py-4 px-5">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600/20 via-indigo-500/10 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <span className="font-semibold text-white group-hover:text-indigo-300 transition-colors block">
                              {category.name}
                            </span>
                            {category.description && (
                              <span className="text-xs text-slate-500 line-clamp-1">
                                {category.description}
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Slug */}
                      <td className="py-4 px-5">
                        <span className="text-xs font-mono bg-slate-950 px-2 py-1 rounded-md text-slate-400 border border-slate-800">
                          /{category.slug}
                        </span>
                      </td>

                      {/* Content Count */}
                      <td className="py-4 px-5">
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300">
                          <Video className="w-3.5 h-3.5 text-amber-400" />
                          {category.movieCount || 0} items
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td className="py-4 px-5">
                        <button
                          onClick={() => handleToggleActive(category)}
                          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-all ${
                            category.isActive
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
                              : "bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800"
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${category.isActive ? "bg-emerald-400" : "bg-slate-500"}`} />
                          {category.isActive ? "Active (Live)" : "Hidden"}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => {
                              setEditingCategory(category);
                              setIsModalOpen(true);
                            }}
                            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors"
                            title="Edit Category"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteTarget(category)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                            title="Delete Category"
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

      {/* Add / Edit Category Modal */}
      <CategoryModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingCategory(null);
        }}
        onSubmit={handleCreateOrUpdate}
        initialData={editingCategory}
        isEditing={!!editingCategory}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Category"
        subtitle="This action removes the category definition from the catalog"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-300">
            Are you sure you want to delete the category{" "}
            <span className="font-semibold text-rose-400">"{deleteTarget?.name}"</span>?
          </p>
          <p className="text-xs text-slate-400 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            Content tagged with this category will remain safe in the library, but will be unlinked from this category.
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
              {isDeleting ? "Deleting..." : "Delete Category"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
