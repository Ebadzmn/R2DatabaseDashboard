"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/Modal";
import { IGenre } from "@/lib/types";
import {
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
  Film,
  Check,
  Palette,
} from "lucide-react";

interface GenreModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Partial<IGenre>) => Promise<void>;
  initialData?: IGenre | null;
  isEditing?: boolean;
}

const GENRE_ICONS = [
  { id: "flame", label: "Flame", icon: Flame },
  { id: "smile", label: "Comedy", icon: Smile },
  { id: "bolt", label: "Thriller", icon: Zap },
  { id: "moon", label: "Horror", icon: Moon },
  { id: "rocket", label: "Sci-Fi", icon: Rocket },
  { id: "theater", label: "Drama", icon: Theater },
  { id: "sparkles", label: "Animation", icon: Sparkles },
  { id: "heart", label: "Romance", icon: Heart },
  { id: "compass", label: "Adventure", icon: Compass },
  { id: "fingerprint", label: "Crime", icon: Fingerprint },
  { id: "star", label: "Fantasy", icon: Star },
  { id: "eye", label: "Mystery", icon: Eye },
  { id: "film", label: "Classic", icon: Film },
];

const GRADIENT_PRESETS = [
  { label: "Orange Blaze", start: "#FF5722", end: "#F59E0B" },
  { label: "Amber Gold", start: "#FBBF24", end: "#D97706" },
  { label: "Violet Pulse", start: "#8B5CF6", end: "#EC4899" },
  { label: "Crimson Red", start: "#EF4444", end: "#7F1D1D" },
  { label: "Neon Cyan", start: "#06B6D4", end: "#3B82F6" },
  { label: "Indigo Deep", start: "#6366F1", end: "#4F46E5" },
  { label: "Emerald Teal", start: "#10B981", end: "#06B6D4" },
  { label: "Rose Petal", start: "#F43F5E", end: "#FB7185" },
  { label: "Teal Forest", start: "#14B8A6", end: "#0D9488" },
  { label: "Slate Blood", start: "#64748B", end: "#DC2626" },
  { label: "Purple Nebula", start: "#A855F7", end: "#6366F1" },
  { label: "Midnight Blue", start: "#3B82F6", end: "#1E3A8A" },
];

export function GenreModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isEditing = false,
}: GenreModalProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [icon, setIcon] = useState("flame");
  const [gradientStart, setGradientStart] = useState("#FF5722");
  const [gradientEnd, setGradientEnd] = useState("#F59E0B");
  const [description, setDescription] = useState("");
  const [order, setOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [slugManuallyEdited, setSlugManuallyEdited] = useState(false);

  useEffect(() => {
    if (initialData) {
      setName(initialData.name || "");
      setSlug(initialData.slug || "");
      setIcon(initialData.icon || "flame");
      setGradientStart(initialData.gradientStart || "#FF5722");
      setGradientEnd(initialData.gradientEnd || "#F59E0B");
      setDescription(initialData.description || "");
      setOrder(initialData.order ?? 0);
      setIsActive(initialData.isActive ?? true);
      setSlugManuallyEdited(true);
    } else {
      setName("");
      setSlug("");
      setIcon("flame");
      setGradientStart("#FF5722");
      setGradientEnd("#F59E0B");
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
        gradientStart,
        gradientEnd,
        description: description.trim() || undefined,
        order: Number(order) || 0,
        isActive,
      });
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save genre");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Edit Genre" : "Add New Genre"}
      subtitle={
        isEditing
          ? "Update genre styling, accents, and display order"
          : "Create a dynamic genre capsule that appears across mobile & web"
      }
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Live Preview Pill */}
        <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between">
          <span className="text-xs text-slate-400 font-medium">Live Capsule Preview:</span>
          <div
            className="px-4 py-2 rounded-full text-xs font-bold text-white shadow-lg flex items-center gap-2"
            style={{
              background: `linear-gradient(135deg, ${gradientStart}, ${gradientEnd})`,
            }}
          >
            <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
            <span>{name.trim() || "Genre Preview"}</span>
          </div>
        </div>

        {/* Genre Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Genre Name *
          </label>
          <input
            type="text"
            required
            placeholder="e.g. Action, Cyberpunk, War, Dark Fantasy..."
            value={name}
            onChange={(e) => handleNameChange(e.target.value)}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-sm"
          />
        </div>

        {/* Slug */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center justify-between">
            <span>Slug (API & Routing ID)</span>
            <span className="text-[10px] text-slate-500 font-normal">Auto-generated</span>
          </label>
          <input
            type="text"
            placeholder="e.g. action, cyberpunk, war"
            value={slug}
            onChange={(e) => {
              setSlugManuallyEdited(true);
              setSlug(e.target.value);
            }}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-500 transition-all text-xs font-mono"
          />
        </div>

        {/* Icon Picker */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
            Icon
          </label>
          <div className="grid grid-cols-6 sm:grid-cols-7 gap-2 max-h-32 overflow-y-auto p-1 bg-slate-950/40 rounded-xl border border-slate-800">
            {GENRE_ICONS.map((item) => {
              const IconComp = item.icon;
              const isSelected = icon === item.id;
              return (
                <button
                  type="button"
                  key={item.id}
                  onClick={() => setIcon(item.id)}
                  title={item.label}
                  className={`p-2 rounded-lg border flex flex-col items-center justify-center transition-all ${
                    isSelected
                      ? "bg-amber-500/20 border-amber-500 text-amber-300"
                      : "bg-slate-900/60 border-slate-800 text-slate-400 hover:border-slate-700 hover:text-slate-200"
                  }`}
                >
                  <IconComp className="w-4 h-4" />
                </button>
              );
            })}
          </div>
        </div>

        {/* Gradient Color Accent Presets */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-amber-400" />
            <span>Theme Gradient Palette</span>
          </label>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {GRADIENT_PRESETS.map((preset, idx) => {
              const isSelected =
                gradientStart.toLowerCase() === preset.start.toLowerCase() &&
                gradientEnd.toLowerCase() === preset.end.toLowerCase();
              return (
                <button
                  type="button"
                  key={idx}
                  onClick={() => {
                    setGradientStart(preset.start);
                    setGradientEnd(preset.end);
                  }}
                  className={`h-9 rounded-xl border flex items-center justify-center transition-all ${
                    isSelected ? "ring-2 ring-white scale-105" : "border-slate-800 hover:scale-102"
                  }`}
                  style={{
                    background: `linear-gradient(135deg, ${preset.start}, ${preset.end})`,
                  }}
                  title={preset.label}
                >
                  {isSelected && <Check className="w-4 h-4 text-white drop-shadow" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Display Order & Active Toggle */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Display Order
            </label>
            <input
              type="number"
              min="0"
              value={order}
              onChange={(e) => setOrder(Number(e.target.value))}
              placeholder="0, 1, 2..."
              className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-white text-xs focus:outline-none focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <div className="flex items-center h-[38px] px-3 bg-slate-900 border border-slate-700/80 rounded-xl">
              <label className="inline-flex items-center cursor-pointer w-full">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="relative w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                <span className="ms-2.5 text-xs font-medium text-slate-300">
                  {isActive ? "Active (Live)" : "Hidden"}
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors font-medium"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-5 py-2 text-xs font-semibold text-white bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl shadow-lg shadow-amber-500/25 flex items-center gap-2 transition-all"
          >
            {isSubmitting ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-3.5 h-3.5" />
                {isEditing ? "Save Changes" : "Create Genre"}
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
