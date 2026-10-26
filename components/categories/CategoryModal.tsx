"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { ICategory } from "@/lib/types";
import {
  Film,
  Tv,
  Trophy,
  Layers,
  FileVideo,
  Flame,
  Star,
  Music,
  Gamepad2,
  Sparkles,
  Clapperboard,
  Video,
  Bookmark,
  Check,
} from "lucide-react";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<ICategory>) => Promise<void>;
  initialData?: ICategory | null;
  isEditing?: boolean;
}

const ICON_PRESETS = [
  { id: "movie", label: "Movie", icon: Film },
  { id: "sports", label: "Sports", icon: Trophy },
  { id: "tv", label: "TV Show", icon: Tv },
  { id: "series", label: "Series", icon: Layers },
  { id: "documentary", label: "Documentary", icon: FileVideo },
  { id: "action", label: "Action", icon: Flame },
  { id: "trending", label: "Trending", icon: Sparkles },
  { id: "cinema", label: "Cinema", icon: Clapperboard },
  { id: "music", label: "Music", icon: Music },
  { id: "gaming", label: "Gaming", icon: Gamepad2 },
];

export function CategoryModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: CategoryModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("movie");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setIcon(initialData.icon || "movie");
      setDescription(initialData.description || "");
      setOrder(initialData.order ?? 0);
      setIsActive(initialData.isActive ?? true);
      setSlugManuallyEdited(true);
    } else {
      setName("");
      setSlug("");
      setIcon("movie");
      setDescription("");
      setOrder(0);
      setIsActive(true);
      setSlugManuallyEdited(false);
    }
  }, [initialData, isOpen]);

  const handleNameChange = (val: string) => {
    setName(val);
    if (!slugManuallyEdited && !isEditing) {
      const generated = val
        .toLowerCase()
        .trim()
        .replace(/[\s_]+/g, "-")
        .replace(/[^\w-]+/g, "")
        .replace(/--+/g, "-");
      setSlug(generated);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSubmitting(true);
      await onSubmit({
        name: name.trim(),
        slug: slug.trim() || undefined,
        icon,
        description: description.trim() || undefined,
        order: Number(order) || 0,
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save category");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Category" : "Add New Category"}
      subtitle={
        isEditing
          ? "Update category settings and display preferences"
          : "Create a dynamic category that appears in mobile app & web"
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Category Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Category Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Movies, Sports, Anime, Kids..."
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2 flex items-center justify-between">
            <span>Slug (URL & API identifier)</span>
            <span className="text-[10px] text-slate-500 font-normal">Auto-generated</span>
          </label>
          <input
            type="text"
            placeholder="e.g. sports, tv-shows, anime"
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setSlug(e.target.value);
            }}
            className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm font-mono text-xs"
          />
        </div>

        {/* Icon Preset Selector */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Select Category Icon
          </label>
          <div className="grid grid-cols-5 gap-2.5">
            {ICON_PRESETS.map((preset) => {
              const IconComp = preset.icon;
              const isSelected = icon === preset.id;
              return (
                <button
                  type="button"
                  key={preset.id}
                  onClick={() => setIcon(preset.id)}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs transition-all ${
                    isSelected
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-300 shadow-md shadow-indigo-500/10"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                  }`}
                >
                  <IconComp className={`w-5 h-5 mb-1.5 ${isSelected ? "text-indigo-400" : "text-slate-400"}`} />
                  <span className="text-[11px] font-medium truncate w-full text-center">
                    {preset.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Order & Status */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              placeholder="0, 1, 2..."
              className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm"
            />
            <p className="text-[11px] text-slate-500 mt-1">Lower numbers appear first</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
              Status
            </label>
            <div className="flex items-center h-[42px] px-4 bg-slate-900/90 border border-slate-700/80 rounded-xl">
              <label className="inline-flex items-center cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ms-3 text-xs font-medium text-slate-300">
                  {isActive ? "Active (Visible)" : "Inactive"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
            Description (Optional)
          </label>
          <textarea
            rows={2}
            placeholder="Brief info about this category..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-900/90 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 transition-all text-sm resize-none"
          />
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800/80">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                {isEditing ? "Save Changes" : "Create Category"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
