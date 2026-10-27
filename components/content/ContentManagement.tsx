"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Sparkles,
  Trophy,
  Tv,
  Layers,
  Plus,
  Trash2,
  Edit2,
  ChevronUp,
  ChevronDown,
  Eye,
  EyeOff,
  Search,
  Check,
  Film,
  Play,
  ExternalLink,
  Save,
  RefreshCw,
  Sliders,
  AlertCircle,
  Lock,
} from "lucide-react";
import { api } from "@/lib/api-client";
import { IHeroBanner, IHomeSection, IMovie, SectionType, SectionContentType } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import { Modal } from "@/components/ui/Modal";

type ContentSubTab = "banners" | "blockbusters" | "series" | "sections";

export function ContentManagement() {
  const { success, error, info } = useToast();
  const [activeTab, setActiveTab] = useState<ContentSubTab>("banners");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data states
  const [banners, setBanners] = useState<IHeroBanner[]>([]);
  const [sections, setSections] = useState<IHomeSection[]>([]);
  const [allMedia, setAllMedia] = useState<IMovie[]>([]);

  // Modals
  const [isBannerModalOpen, setIsBannerModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<IHeroBanner | null>(null);
  const [bannerForm, setBannerForm] = useState({
    title: "",
    subtitle: "",
    description: "",
    mediaType: "MOVIE" as "MOVIE" | "SERIES" | "CUSTOM",
    movieId: "",
    customImageUrl: "",
    badge: "FEATURED",
    ctaText: "WATCH NOW",
    ctaAction: "PLAY" as "PLAY" | "DETAILS" | "LINK",
    targetUrl: "",
    isActive: true,
  });

  const [isSectionModalOpen, setIsSectionModalOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<IHomeSection | null>(null);
  const [sectionForm, setSectionForm] = useState<{
    title: string;
    subtitle: string;
    sectionType: SectionType;
    contentType: SectionContentType;
    maxItems: number;
    isActive: boolean;
  }>({
    title: "",
    subtitle: "",
    sectionType: "MOVIE_ROW",
    contentType: "MOVIE",
    maxItems: 20,
    isActive: true,
  });

  // Media Picker Dialog for Section Items
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [pickerTargetSectionId, setPickerTargetSectionId] = useState<string | null>(null);
  const [pickerMediaTypeFilter, setPickerMediaTypeFilter] = useState<"ALL" | "MOVIE" | "SERIES">("ALL");
  const [pickerSearchQuery, setPickerSearchQuery] = useState("");
  const [replaceTargetIndex, setReplaceTargetIndex] = useState<number | null>(null);

  // Fetch all CMS data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [bannersRes, sectionsRes, moviesRes] = await Promise.all([
        api.banners.getAll(),
        api.sections.getAll(),
        api.movies.getAll({ limit: 150 }),
      ]);
      setBanners(bannersRes.data || []);
      setSections(sectionsRes.data || []);
      setAllMedia(moviesRes.data || []);
    } catch (err: any) {
      error(err.message || "Failed to load Home CMS data");
    } finally {
      setLoading(false);
    }
  }, [error]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Derived sections
  const top10Section = useMemo(
    () => sections.find((s) => s.key === "top_10_blockbusters"),
    [sections]
  );
  const topSeriesSection = useMemo(
    () => sections.find((s) => s.key === "top_series"),
    [sections]
  );

  // ==========================================
  // Hero Banners Logic
  // ==========================================

  const handleOpenCreateBanner = () => {
    setEditingBanner(null);
    setBannerForm({
      title: "",
      subtitle: "",
      description: "",
      mediaType: "MOVIE",
      movieId: "",
      customImageUrl: "",
      badge: "FEATURED",
      ctaText: "WATCH NOW",
      ctaAction: "PLAY",
      targetUrl: "",
      isActive: true,
    });
    setIsBannerModalOpen(true);
  };

  const handleOpenEditBanner = (banner: IHeroBanner) => {
    setEditingBanner(banner);
    const mId = typeof banner.movieId === "object" ? banner.movieId?._id : banner.movieId;
    setBannerForm({
      title: banner.title || "",
      subtitle: banner.subtitle || "",
      description: banner.description || "",
      mediaType: banner.mediaType || "MOVIE",
      movieId: mId || "",
      customImageUrl: banner.customImageUrl || "",
      badge: banner.badge || "FEATURED",
      ctaText: banner.ctaText || "WATCH NOW",
      ctaAction: banner.ctaAction || "PLAY",
      targetUrl: banner.targetUrl || "",
      isActive: banner.isActive,
    });
    setIsBannerModalOpen(true);
  };

  const handleSaveBanner = async () => {
    if (!bannerForm.title.trim()) {
      error("Banner title is required");
      return;
    }

    try {
      setSaving(true);
      const payload: any = {
        ...bannerForm,
        movieId: bannerForm.movieId || undefined,
        customImageUrl: bannerForm.customImageUrl || undefined,
      };

      if (editingBanner) {
        await api.banners.update(editingBanner._id, payload);
        success("Hero banner updated successfully");
      } else {
        await api.banners.create(payload);
        success("Hero banner created successfully");
      }
      setIsBannerModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to save hero banner");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteBanner = async (id: string) => {
    if (!confirm("Are you sure you want to delete this hero banner?")) return;
    try {
      await api.banners.delete(id);
      success("Banner deleted");
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to delete banner");
    }
  };

  const handleToggleBannerActive = async (banner: IHeroBanner) => {
    try {
      await api.banners.update(banner._id, { isActive: !banner.isActive });
      success(`Banner marked ${!banner.isActive ? "active" : "inactive"}`);
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to toggle status");
    }
  };

  const handleMoveBanner = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= banners.length) return;

    const newBanners = [...banners];
    const temp = newBanners[index];
    newBanners[index] = newBanners[targetIndex];
    newBanners[targetIndex] = temp;

    setBanners(newBanners);
    try {
      await api.banners.reorder(newBanners.map((b) => b._id));
      success("Banner order updated");
    } catch (err: any) {
      error("Failed to reorder banners");
      loadData();
    }
  };

  // ==========================================
  // Section Items Management
  // ==========================================

  const handleOpenItemPicker = (
    sectionId: string,
    contentType: "MOVIE" | "SERIES" | "MIXED",
    replaceIdx: number | null = null
  ) => {
    setPickerTargetSectionId(sectionId);
    setPickerMediaTypeFilter(
      contentType === "MOVIE" ? "MOVIE" : contentType === "SERIES" ? "SERIES" : "ALL"
    );
    setPickerSearchQuery("");
    setReplaceTargetIndex(replaceIdx);
    setIsMediaPickerOpen(true);
  };

  const handleSelectMediaForSection = async (media: IMovie) => {
    if (!pickerTargetSectionId) return;

    const section = sections.find((s) => s._id === pickerTargetSectionId);
    if (!section) return;

    const currentItems = [...section.items];

    if (replaceTargetIndex !== null && replaceTargetIndex >= 0) {
      // Replace item
      currentItems[replaceTargetIndex] = {
        ...currentItems[replaceTargetIndex],
        movieId: media,
      };
    } else {
      // Check if already in section
      const alreadyExists = currentItems.some((item) => {
        const id = typeof item.movieId === "object" ? item.movieId?._id : item.movieId;
        return id === media._id;
      });

      if (alreadyExists) {
        info(`"${media.title}" is already in this section`);
        return;
      }

      currentItems.push({
        movieId: media,
        order: currentItems.length + 1,
        customTag:
          section.sectionType === "TOP_10" ? `#${currentItems.length + 1}` : undefined,
      });
    }

    try {
      setSaving(true);
      const payloadItems = currentItems.map((item, idx) => ({
        movieId: typeof item.movieId === "object" ? item.movieId._id : item.movieId,
        order: idx + 1,
        customTag: item.customTag,
      }));

      await api.sections.updateItems(section._id, payloadItems);
      success(`Updated items in "${section.title}"`);
      setIsMediaPickerOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to update section items");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveSectionItem = async (section: IHomeSection, itemIndex: number) => {
    const updated = [...section.items];
    updated.splice(itemIndex, 1);

    try {
      const payloadItems = updated.map((item, idx) => ({
        movieId: typeof item.movieId === "object" ? item.movieId._id : item.movieId,
        order: idx + 1,
        customTag: item.customTag,
      }));

      await api.sections.updateItems(section._id, payloadItems);
      success("Item removed from section");
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to remove item");
    }
  };

  const handleMoveSectionItem = async (
    section: IHomeSection,
    index: number,
    direction: "up" | "down"
  ) => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= section.items.length) return;

    const updated = [...section.items];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;

    try {
      const payloadItems = updated.map((item, idx) => ({
        movieId: typeof item.movieId === "object" ? item.movieId._id : item.movieId,
        order: idx + 1,
        customTag: item.customTag,
      }));

      await api.sections.updateItems(section._id, payloadItems);
      success("Order updated");
      loadData();
    } catch (err: any) {
      error("Failed to reorder items");
    }
  };

  const handleUpdateItemTag = async (
    section: IHomeSection,
    itemIndex: number,
    newTag: string
  ) => {
    const updated = [...section.items];
    updated[itemIndex] = {
      ...updated[itemIndex],
      customTag: newTag,
    };

    try {
      const payloadItems = updated.map((item, idx) => ({
        movieId: typeof item.movieId === "object" ? item.movieId._id : item.movieId,
        order: idx + 1,
        customTag: item.customTag,
      }));

      await api.sections.updateItems(section._id, payloadItems);
      loadData();
    } catch (err: any) {
      error("Failed to update badge");
    }
  };

  // ==========================================
  // Section Meta (Create / Edit / Toggle / Move)
  // ==========================================

  const handleToggleSectionActive = async (section: IHomeSection) => {
    try {
      await api.sections.update(section._id, { isActive: !section.isActive });
      success(`Section ${!section.isActive ? "enabled" : "disabled"}`);
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to toggle section");
    }
  };

  const handleMoveSection = async (index: number, direction: "up" | "down") => {
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= sections.length) return;

    const newSections = [...sections];
    const temp = newSections[index];
    newSections[index] = newSections[targetIndex];
    newSections[targetIndex] = temp;

    setSections(newSections);
    try {
      await api.sections.reorder(newSections.map((s) => s._id));
      success("Sections reordered");
    } catch (err: any) {
      error("Failed to reorder sections");
      loadData();
    }
  };

  const handleOpenCreateSection = () => {
    setEditingSection(null);
    setSectionForm({
      title: "",
      subtitle: "",
      sectionType: "MOVIE_ROW",
      contentType: "MOVIE",
      maxItems: 20,
      isActive: true,
    });
    setIsSectionModalOpen(true);
  };

  const handleOpenEditSection = (section: IHomeSection) => {
    setEditingSection(section);
    setSectionForm({
      title: section.title,
      subtitle: section.subtitle || "",
      sectionType: section.sectionType,
      contentType: section.contentType,
      maxItems: section.maxItems || 20,
      isActive: section.isActive,
    });
    setIsSectionModalOpen(true);
  };

  const handleSaveSection = async () => {
    if (!sectionForm.title.trim()) {
      error("Section title is required");
      return;
    }

    try {
      setSaving(true);
      if (editingSection) {
        await api.sections.update(editingSection._id, sectionForm);
        success("Section updated successfully");
      } else {
        await api.sections.create(sectionForm);
        success("New section created successfully");
      }
      setIsSectionModalOpen(false);
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to save section");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteSection = async (id: string) => {
    const target = sections.find((s) => s._id === id);
    if (
      target &&
      (target.isSystem ||
        ["latest_movies", "latest_series", "top_10_blockbusters", "top_series"].includes(target.key))
    ) {
      error("Protected System Section: This section cannot be deleted. You can reorder it using the Up/Down arrows or toggle its visibility.");
      return;
    }

    if (!confirm("Are you sure you want to delete this custom section?")) return;
    try {
      await api.sections.delete(id);
      success("Section deleted");
      loadData();
    } catch (err: any) {
      error(err.message || "Failed to delete section");
    }
  };

  // Filtered media for picker dialog
  const filteredPickerMedia = useMemo(() => {
    return allMedia.filter((m) => {
      const matchesType =
        pickerMediaTypeFilter === "ALL" || m.type === pickerMediaTypeFilter;
      const matchesQuery =
        !pickerSearchQuery.trim() ||
        m.title.toLowerCase().includes(pickerSearchQuery.toLowerCase()) ||
        (m.genres || []).some((g) =>
          g.toLowerCase().includes(pickerSearchQuery.toLowerCase())
        );
      return matchesType && matchesQuery;
    });
  }, [allMedia, pickerMediaTypeFilter, pickerSearchQuery]);

  return (
    <div className="space-y-6">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Sparkles className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-white tracking-tight">
              Home Content Management
            </h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Dynamically curate the hero slider, Top 10 Blockbusters, Top Series, and
            app home sections with zero code changes.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-semibold border border-slate-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-amber-500" : ""}`} />
          Refresh Feed
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-800 pb-3">
        <button
          onClick={() => setActiveTab("banners")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "banners"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
          }`}
        >
          <Sparkles className="w-4 h-4" />
          Hero Slider ({banners.length})
        </button>

        <button
          onClick={() => setActiveTab("blockbusters")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "blockbusters"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
          }`}
        >
          <Trophy className="w-4 h-4" />
          Top 10 Blockbusters ({top10Section?.items?.length || 0}/10)
        </button>

        <button
          onClick={() => setActiveTab("series")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "series"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
          }`}
        >
          <Tv className="w-4 h-4" />
          Top Series ({topSeriesSection?.items?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("sections")}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition ${
            activeTab === "sections"
              ? "bg-amber-500 text-black shadow-lg shadow-amber-500/20"
              : "bg-slate-900/60 text-slate-400 hover:text-white hover:bg-slate-800/80 border border-slate-800"
          }`}
        >
          <Layers className="w-4 h-4" />
          All Sections ({sections.length})
        </button>
      </div>

      {/* ========================================================
          SUB-TAB 1: HERO SLIDER / BANNERS
      ======================================================== */}
      {activeTab === "banners" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">Main Spotlight Slider Banners</h2>
              <p className="text-xs text-slate-400">
                These banners appear at the top of the mobile app home screen in the hero carousel.
              </p>
            </div>
            <button
              onClick={handleOpenCreateBanner}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Add Banner
            </button>
          </div>

          {banners.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Sparkles className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No banners created yet</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Add Banner" to highlight a movie or series in the home carousel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {banners.map((banner, index) => {
                const movie = typeof banner.movieId === "object" ? banner.movieId : null;
                const bgImage =
                  banner.customImageUrl || movie?.backdrop || movie?.poster || "";

                return (
                  <div
                    key={banner._id}
                    className={`group relative rounded-2xl border overflow-hidden flex flex-col justify-between transition-all ${
                      banner.isActive
                        ? "bg-slate-900/70 border-slate-800 hover:border-amber-500/40"
                        : "bg-slate-950/60 border-slate-800/50 opacity-60"
                    }`}
                  >
                    {/* Visual Preview Header */}
                    <div className="relative h-44 bg-slate-950 overflow-hidden">
                      {bgImage ? (
                        <img
                          src={bgImage}
                          alt={banner.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900 text-slate-600">
                          <Film className="w-12 h-12" />
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-transparent to-black/60" />

                      {/* Top Badges */}
                      <div className="absolute top-3 left-3 flex items-center gap-2">
                        <span className="px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-[10px] font-black text-amber-400 border border-amber-500/30">
                          #{index + 1}
                        </span>
                        {banner.badge && (
                          <span className="px-2.5 py-1 rounded-md bg-amber-500 text-black text-[10px] font-black uppercase">
                            {banner.badge}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded bg-slate-800/80 text-[10px] font-bold text-slate-300">
                          {banner.mediaType}
                        </span>
                      </div>

                      {/* Active Status Badge */}
                      <button
                        onClick={() => handleToggleBannerActive(banner)}
                        className={`absolute top-3 right-3 p-1.5 rounded-lg border backdrop-blur-md transition ${
                          banner.isActive
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/40"
                            : "bg-slate-800/80 text-slate-400 border-slate-700"
                        }`}
                        title={banner.isActive ? "Active (Click to disable)" : "Inactive (Click to enable)"}
                      >
                        {banner.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                      </button>

                      {/* Bottom Title inside thumbnail */}
                      <div className="absolute bottom-3 left-3 right-3">
                        <h3 className="text-lg font-black text-white leading-tight drop-shadow-md line-clamp-1">
                          {banner.title}
                        </h3>
                        {banner.subtitle && (
                          <p className="text-xs text-amber-300/90 font-medium line-clamp-1 mt-0.5">
                            {banner.subtitle}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Card Body & Info */}
                    <div className="p-4 flex-1 flex flex-col justify-between">
                      {banner.description && (
                        <p className="text-xs text-slate-400 line-clamp-2 mb-3">
                          {banner.description}
                        </p>
                      )}

                      {movie && (
                        <div className="text-[11px] text-slate-400 flex items-center justify-between py-2 border-t border-slate-800/70">
                          <span>Linked: <strong className="text-white">{movie.title}</strong></span>
                          {movie.rating && (
                            <span className="text-amber-400 font-bold">★ {movie.rating}</span>
                          )}
                        </div>
                      )}

                      {/* Card Actions */}
                      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleMoveBanner(index, "up")}
                            disabled={index === 0}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title="Move Up"
                          >
                            <ChevronUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleMoveBanner(index, "down")}
                            disabled={index === banners.length - 1}
                            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                            title="Move Down"
                          >
                            <ChevronDown className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleOpenEditBanner(banner)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                            title="Edit Banner"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteBanner(banner._id)}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Delete Banner"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 2: TOP 10 BLOCKBUSTERS
      ======================================================== */}
      {activeTab === "blockbusters" && top10Section && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-white">Top 10 Blockbusters Curator</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select up to 10 blockbuster movies from the library and arrange their exact 1–10 positions.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleSectionActive(top10Section)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  top10Section.isActive
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {top10Section.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {top10Section.isActive ? "Section Active in App" : "Section Disabled"}
              </button>

              <button
                onClick={() =>
                  handleOpenItemPicker(top10Section._id, "MOVIE", null)
                }
                disabled={top10Section.items.length >= 10}
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-40 disabled:cursor-not-allowed text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add Movie Slot ({top10Section.items.length}/10)
              </button>
            </div>
          </div>

          {top10Section.items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Trophy className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No blockbuster movies in Top 10</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Add Movie Slot" to pick the #1 movie from your library.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {top10Section.items.map((item, index) => {
                const movie = typeof item.movieId === "object" ? item.movieId : null;
                const rankNumber = index + 1;

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900/70 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 gap-4 transition"
                  >
                    {/* Rank Badge + Thumbnail + Title */}
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-sm shrink-0 shadow-md ${
                          rankNumber === 1
                            ? "bg-gradient-to-br from-amber-400 to-amber-600 text-black shadow-amber-500/30"
                            : rankNumber === 2
                            ? "bg-slate-300 text-slate-900"
                            : rankNumber === 3
                            ? "bg-amber-700/80 text-amber-200"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}
                      >
                        {rankNumber}
                      </div>

                      <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                        {movie?.poster || movie?.backdrop ? (
                          <img
                            src={movie.poster || movie.backdrop}
                            alt={movie?.title || "Movie"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Film className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white truncate">
                            {movie?.title || "Unknown Movie"}
                          </h4>
                          {movie?.rating && (
                            <span className="text-xs text-amber-400 font-bold shrink-0">
                              ★ {movie.rating.toFixed(1)}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {movie?.releaseYear || "2024"} •{" "}
                          {Array.isArray(movie?.genres)
                            ? movie.genres.join(", ")
                            : movie?.genres || "Action"}
                        </p>
                      </div>
                    </div>

                    {/* Tag Editor + Position Buttons + Remove */}
                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      {/* Custom Rank Tag Badge */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500 hidden md:inline">
                          Badge:
                        </span>
                        <input
                          type="text"
                          defaultValue={item.customTag || ""}
                          placeholder={`#${rankNumber}`}
                          onBlur={(e) =>
                            handleUpdateItemTag(top10Section, index, e.target.value)
                          }
                          className="w-28 px-2 py-1 rounded bg-slate-950 border border-slate-800 text-xs text-amber-400 font-semibold focus:border-amber-500 outline-none"
                        />
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleMoveSectionItem(top10Section, index, "up")
                          }
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleMoveSectionItem(top10Section, index, "down")
                          }
                          disabled={index === top10Section.items.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Replace */}
                      <button
                        onClick={() =>
                          handleOpenItemPicker(top10Section._id, "MOVIE", index)
                        }
                        className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 font-semibold transition"
                      >
                        Replace
                      </button>

                      {/* Remove */}
                      <button
                        onClick={() => handleRemoveSectionItem(top10Section, index)}
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="Remove from Top 10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 3: TOP SERIES
      ======================================================== */}
      {activeTab === "series" && topSeriesSection && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-gradient-to-r from-amber-500/10 via-slate-900 to-slate-900 p-5 rounded-2xl border border-amber-500/20">
            <div>
              <div className="flex items-center gap-2">
                <Tv className="w-5 h-5 text-amber-500" />
                <h2 className="text-lg font-bold text-white">Top TV Series Curator</h2>
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Select and reorder the television series displayed in the "Top Series" section of the mobile app.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => handleToggleSectionActive(topSeriesSection)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                  topSeriesSection.isActive
                    ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border-slate-700"
                }`}
              >
                {topSeriesSection.isActive ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                {topSeriesSection.isActive ? "Section Active in App" : "Section Disabled"}
              </button>

              <button
                onClick={() =>
                  handleOpenItemPicker(topSeriesSection._id, "SERIES", null)
                }
                className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
              >
                <Plus className="w-4 h-4" />
                Add Series
              </button>
            </div>
          </div>

          {topSeriesSection.items.length === 0 ? (
            <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800">
              <Tv className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <p className="text-slate-300 font-semibold">No TV series selected</p>
              <p className="text-xs text-slate-500 mt-1">
                Click "+ Add Series" to choose a series from your library.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {topSeriesSection.items.map((item, index) => {
                const series = typeof item.movieId === "object" ? item.movieId : null;

                return (
                  <div
                    key={index}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 bg-slate-900/70 hover:bg-slate-900 rounded-xl border border-slate-800 hover:border-slate-700 gap-4 transition"
                  >
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <span className="text-slate-500 font-bold text-sm w-6 text-center">
                        #{index + 1}
                      </span>

                      <div className="w-12 h-16 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                        {series?.poster || series?.backdrop ? (
                          <img
                            src={series.poster || series.backdrop}
                            alt={series?.title || "Series"}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Tv className="w-5 h-5" />
                          </div>
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-bold text-white truncate">
                            {series?.title || "Unknown Series"}
                          </h4>
                          <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[10px] font-black uppercase">
                            {series?.totalSeasons || 1} SEASONS
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 truncate mt-0.5">
                          {series?.releaseYear || "2024"} •{" "}
                          {Array.isArray(series?.genres)
                            ? series.genres.join(", ")
                            : series?.genres || "Drama"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 self-end sm:self-center shrink-0">
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() =>
                            handleMoveSectionItem(topSeriesSection, index, "up")
                          }
                          disabled={index === 0}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Up"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() =>
                            handleMoveSectionItem(topSeriesSection, index, "down")
                          }
                          disabled={index === topSeriesSection.items.length - 1}
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                          title="Move Down"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          handleRemoveSectionItem(topSeriesSection, index)
                        }
                        className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                        title="Remove Series"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ========================================================
          SUB-TAB 4: DYNAMIC HOME SECTIONS
      ======================================================== */}
      {activeTab === "sections" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold text-white">All Dynamic Home Sections</h2>
              <p className="text-xs text-slate-400">
                Organize the order of sections on the mobile app home screen or create custom curated sections.
              </p>
            </div>
            <button
              onClick={handleOpenCreateSection}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Plus className="w-4 h-4" />
              Create Custom Section
            </button>
          </div>

          <div className="space-y-3">
            {sections.map((section, index) => (
              <div
                key={section._id}
                className={`p-4 rounded-xl border flex flex-col md:flex-row md:items-center justify-between gap-4 transition ${
                  section.isActive
                    ? "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                    : "bg-slate-950/60 border-slate-800/40 opacity-60"
                }`}
              >
                {/* Section Details */}
                <div className="flex items-center gap-4 flex-1 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-black text-slate-400 border border-slate-700 shrink-0">
                    {index + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h3 className="text-base font-bold text-white">{section.title}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-slate-300 border border-slate-700">
                        {section.sectionType}
                      </span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                        {section.contentType}
                      </span>
                      {section.isSystem && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          SYSTEM
                        </span>
                      )}
                    </div>
                    {section.subtitle && (
                      <p className="text-xs text-slate-400 mt-0.5">{section.subtitle}</p>
                    )}
                    <p className="text-[11px] text-slate-500 mt-1">
                      Contains <strong className="text-slate-300">{section.items.length}</strong> items • Key: <code className="text-amber-400/80">{section.key}</code>
                    </p>
                  </div>
                </div>

                {/* Section Actions */}
                <div className="flex items-center gap-2.5 shrink-0 self-end md:self-center">
                  {/* Active Toggle */}
                  <button
                    onClick={() => handleToggleSectionActive(section)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition ${
                      section.isActive
                        ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                        : "bg-slate-800 text-slate-400 border-slate-700"
                    }`}
                  >
                    {section.isActive ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    {section.isActive ? "Active" : "Disabled"}
                  </button>

                  {/* Manage Content button */}
                  <button
                    onClick={() => {
                      if (section.key === "top_10_blockbusters") {
                        setActiveTab("blockbusters");
                      } else if (section.key === "top_series") {
                        setActiveTab("series");
                      } else {
                        handleOpenItemPicker(section._id, section.contentType, null);
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs font-bold transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    Manage Items ({section.items.length})
                  </button>

                  {/* Reorder Up/Down */}
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveSection(index, "up")}
                      disabled={index === 0}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move Section Up"
                    >
                      <ChevronUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleMoveSection(index, "down")}
                      disabled={index === sections.length - 1}
                      className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition"
                      title="Move Section Down"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Edit Settings */}
                  <button
                    onClick={() => handleOpenEditSection(section)}
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                    title="Edit Settings"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>

                  {/* Delete (prevented if system section) */}
                  {section.isSystem ||
                  ["latest_movies", "latest_series", "top_10_blockbusters", "top_series"].includes(section.key) ? (
                    <span
                      className="p-1.5 rounded-lg bg-slate-800/40 text-slate-500 border border-slate-700/40 cursor-not-allowed"
                      title="System section protected (cannot be deleted)"
                    >
                      <Lock className="w-4 h-4 text-slate-500" />
                    </span>
                  ) : (
                    <button
                      onClick={() => handleDeleteSection(section._id)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                      title="Delete Section"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================
          MODAL: CREATE / EDIT HERO BANNER
      ======================================================== */}
      <Modal
        isOpen={isBannerModalOpen}
        onClose={() => setIsBannerModalOpen(false)}
        title={editingBanner ? "Edit Hero Banner" : "Create Hero Slider Banner"}
        subtitle="Configure the visual spotlight banner shown at the top of the mobile home feed."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Banner Title *
            </label>
            <input
              type="text"
              value={bannerForm.title}
              onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              placeholder="e.g. BREAKING BAD / DUNE: PART TWO"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Subtitle / Tagline
              </label>
              <input
                type="text"
                value={bannerForm.subtitle}
                onChange={(e) => setBannerForm({ ...bannerForm, subtitle: e.target.value })}
                placeholder="e.g. Remember My Name"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Top Badge Tag
              </label>
              <input
                type="text"
                value={bannerForm.badge}
                onChange={(e) => setBannerForm({ ...bannerForm, badge: e.target.value })}
                placeholder="e.g. EXCLUSIVE / #1 HIT / NEW"
                className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Link to Library Movie / Series
              </label>
              <select
                value={bannerForm.movieId}
                onChange={(e) => {
                  const selectedId = e.target.value;
                  const found = allMedia.find((m) => m._id === selectedId);
                  setBannerForm({
                    ...bannerForm,
                    movieId: selectedId,
                    title: bannerForm.title || found?.title || "",
                    subtitle: bannerForm.subtitle || found?.description?.slice(0, 80) || "",
                    mediaType: found?.type === "SERIES" ? "SERIES" : "MOVIE",
                    customImageUrl: bannerForm.customImageUrl || found?.backdrop || found?.poster || "",
                  });
                }}
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="">-- None (Custom Banner) --</option>
                {allMedia.map((m) => (
                  <option key={m._id} value={m._id}>
                    [{m.type}] {m.title} ({m.releaseYear || "2024"})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Media Type
              </label>
              <select
                value={bannerForm.mediaType}
                onChange={(e) =>
                  setBannerForm({
                    ...bannerForm,
                    mediaType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="MOVIE">Movie</option>
                <option value="SERIES">TV Series</option>
                <option value="CUSTOM">Custom Promotional</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Custom Backdrop / Banner Image URL
            </label>
            <input
              type="text"
              value={bannerForm.customImageUrl}
              onChange={(e) => setBannerForm({ ...bannerForm, customImageUrl: e.target.value })}
              placeholder="https://... (Leave blank to use selected Movie/Series backdrop)"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Short Description / Overview
            </label>
            <textarea
              rows={2}
              value={bannerForm.description}
              onChange={(e) => setBannerForm({ ...bannerForm, description: e.target.value })}
              placeholder="Synopsis or promotional text..."
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none resize-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                CTA Button Text
              </label>
              <input
                type="text"
                value={bannerForm.ctaText}
                onChange={(e) => setBannerForm({ ...bannerForm, ctaText: e.target.value })}
                placeholder="WATCH NOW"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                CTA Action
              </label>
              <select
                value={bannerForm.ctaAction}
                onChange={(e) =>
                  setBannerForm({ ...bannerForm, ctaAction: e.target.value as any })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="PLAY">Start Video Playback</option>
                <option value="DETAILS">Open Details Page</option>
                <option value="LINK">External Link</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="bannerActiveCheckbox"
              checked={bannerForm.isActive}
              onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="bannerActiveCheckbox" className="text-sm font-semibold text-white">
              Active (Visible in App)
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsBannerModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveBanner}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Banner"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          MODAL: CREATE / EDIT SECTION SETTINGS
      ======================================================== */}
      <Modal
        isOpen={isSectionModalOpen}
        onClose={() => setIsSectionModalOpen(false)}
        title={editingSection ? "Edit Section Settings" : "Create New Dynamic Section"}
        subtitle="Configure the section title, layout type, and content filters."
      >
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Section Title *
            </label>
            <input
              type="text"
              value={sectionForm.title}
              onChange={(e) => setSectionForm({ ...sectionForm, title: e.target.value })}
              placeholder="e.g. Trending Movies / Must Watch Series"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Subtitle
            </label>
            <input
              type="text"
              value={sectionForm.subtitle}
              onChange={(e) => setSectionForm({ ...sectionForm, subtitle: e.target.value })}
              placeholder="e.g. Popular with viewers today"
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Layout Style
              </label>
              <select
                value={sectionForm.sectionType}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    sectionType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="MOVIE_ROW">Horizontal Scroll Row</option>
                <option value="SERIES_ROW">Series Horizontal Row</option>
                <option value="TOP_10">Top 10 Numbered Rank List</option>
                <option value="GRID">2-Column Grid</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Content Allowed
              </label>
              <select
                value={sectionForm.contentType}
                onChange={(e) =>
                  setSectionForm({
                    ...sectionForm,
                    contentType: e.target.value as any,
                  })
                }
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              >
                <option value="MOVIE">Movies Only</option>
                <option value="SERIES">TV Series Only</option>
                <option value="MIXED">Mixed (Movies & Series)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Maximum Items to Show
            </label>
            <input
              type="number"
              min={1}
              max={50}
              value={sectionForm.maxItems}
              onChange={(e) =>
                setSectionForm({ ...sectionForm, maxItems: parseInt(e.target.value) || 20 })
              }
              className="w-full px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="sectionActiveCheckbox"
              checked={sectionForm.isActive}
              onChange={(e) => setSectionForm({ ...sectionForm, isActive: e.target.checked })}
              className="w-4 h-4 rounded text-amber-500 focus:ring-amber-500"
            />
            <label htmlFor="sectionActiveCheckbox" className="text-sm font-semibold text-white">
              Active in Mobile App
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              onClick={() => setIsSectionModalOpen(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSection}
              disabled={saving}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold shadow-lg shadow-amber-500/20 transition"
            >
              <Save className="w-4 h-4" />
              {saving ? "Saving..." : "Save Section"}
            </button>
          </div>
        </div>
      </Modal>

      {/* ========================================================
          MODAL: MEDIA SELECTOR FOR SECTION ITEMS
      ======================================================== */}
      <Modal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        title="Select Movie / Series"
        subtitle="Search and select existing content from your library to add to this section."
        maxWidth="2xl"
      >
        <div className="space-y-4">
          {/* Search bar & Type Filter */}
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <input
                type="text"
                value={pickerSearchQuery}
                onChange={(e) => setPickerSearchQuery(e.target.value)}
                placeholder="Search by title or genre..."
                className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-amber-500 outline-none"
              />
            </div>

            <div className="flex items-center rounded-xl bg-slate-900 border border-slate-800 p-1">
              <button
                onClick={() => setPickerMediaTypeFilter("ALL")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  pickerMediaTypeFilter === "ALL"
                    ? "bg-amber-500 text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                onClick={() => setPickerMediaTypeFilter("MOVIE")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  pickerMediaTypeFilter === "MOVIE"
                    ? "bg-amber-500 text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Movies
              </button>
              <button
                onClick={() => setPickerMediaTypeFilter("SERIES")}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                  pickerMediaTypeFilter === "SERIES"
                    ? "bg-amber-500 text-black"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Series
              </button>
            </div>
          </div>

          {/* Media List */}
          <div className="max-h-96 overflow-y-auto space-y-2 pr-1">
            {filteredPickerMedia.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No matching movies or series found.
              </div>
            ) : (
              filteredPickerMedia.map((media) => (
                <div
                  key={media._id}
                  onClick={() => handleSelectMediaForSection(media)}
                  className="flex items-center justify-between p-2.5 rounded-xl bg-slate-900/60 hover:bg-slate-800 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700/60">
                      {media.poster || media.backdrop ? (
                        <img
                          src={media.poster || media.backdrop}
                          alt={media.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-600">
                          {media.type === "SERIES" ? <Tv className="w-4 h-4" /> : <Film className="w-4 h-4" />}
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white group-hover:text-amber-400 truncate">
                          {media.title}
                        </span>
                        <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-800 text-slate-400">
                          {media.type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {media.releaseYear || "2024"} •{" "}
                        {Array.isArray(media.genres) ? media.genres.join(", ") : media.genres || ""}
                        {media.rating ? ` • ★ ${media.rating}` : ""}
                      </p>
                    </div>
                  </div>

                  <span className="px-3 py-1.5 rounded-lg bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black font-bold text-xs shrink-0 transition">
                    Select
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
