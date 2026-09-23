"use client";

import React, { useState, useMemo } from "react";
import { Modal } from "@/components/ui/Modal";
import { IMovie, IEpisode, MovieStatus } from "@/lib/types";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import {
  Layers,
  Plus,
  Play,
  RotateCw,
  Trash2,
  Edit2,
  UploadCloud,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  Film,
  Calendar,
  Check,
  X,
  ExternalLink,
} from "lucide-react";

interface SeriesEpisodesModalProps {
  series: IMovie | null;
  isOpen: boolean;
  onClose: () => void;
  onUploadForEpisode: (series: IMovie, episode: IEpisode) => void;
  onPlayEpisode: (series: IMovie, episode: IEpisode) => void;
  onRefreshSeries: () => Promise<void>;
}

export function SeriesEpisodesModal({
  series,
  isOpen,
  onClose,
  onUploadForEpisode,
  onPlayEpisode,
  onRefreshSeries,
}: SeriesEpisodesModalProps) {
  const { success, error, info } = useToast();

  const [activeSeason, setActiveSeason] = useState<number>(1);
  const [isImportingTmdb, setIsImportingTmdb] = useState(false);

  // New Episode / Edit Episode Modal state
  const [isEditingEpisode, setIsEditingEpisode] = useState(false);
  const [targetEpisodeId, setTargetEpisodeId] = useState<string | null>(null);
  const [epSeasonNumber, setEpSeasonNumber] = useState<number>(1);
  const [epEpisodeNumber, setEpEpisodeNumber] = useState<number>(1);
  const [epTitle, setEpTitle] = useState("");
  const [epOverview, setEpOverview] = useState("");
  const [epStillPath, setEpStillPath] = useState("");
  const [epDuration, setEpDuration] = useState<number | undefined>();
  const [isSavingEpisode, setIsSavingEpisode] = useState(false);

  // Derive unique seasons from episodes or totalSeasons
  const seasonsList = useMemo(() => {
    if (!series) return [1];
    const seasonsSet = new Set<number>();
    if (series.totalSeasons && series.totalSeasons > 0) {
      for (let i = 1; i <= series.totalSeasons; i++) seasonsSet.add(i);
    }
    if (series.episodes && series.episodes.length > 0) {
      series.episodes.forEach((e) => seasonsSet.add(e.seasonNumber || 1));
    }
    if (seasonsSet.size === 0) seasonsSet.add(1);
    return Array.from(seasonsSet).sort((a, b) => a - b);
  }, [series]);

  // Episodes for active season
  const currentSeasonEpisodes = useMemo(() => {
    if (!series?.episodes) return [];
    return series.episodes
      .filter((e) => e.seasonNumber === activeSeason)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [series, activeSeason]);

  if (!series || !isOpen) return null;

  const handleOpenAddEpisode = () => {
    setTargetEpisodeId(null);
    setEpSeasonNumber(activeSeason);
    const nextEpNum = currentSeasonEpisodes.length > 0
      ? Math.max(...currentSeasonEpisodes.map((e) => e.episodeNumber)) + 1
      : 1;
    setEpEpisodeNumber(nextEpNum);
    setEpTitle(`Episode ${nextEpNum}`);
    setEpOverview("");
    setEpStillPath("");
    setEpDuration(undefined);
    setIsEditingEpisode(true);
  };

  const handleOpenEditEpisode = (ep: IEpisode) => {
    setTargetEpisodeId(ep._id);
    setEpSeasonNumber(ep.seasonNumber);
    setEpEpisodeNumber(ep.episodeNumber);
    setEpTitle(ep.title);
    setEpOverview(ep.overview || "");
    setEpStillPath(ep.stillPath || "");
    setEpDuration(ep.duration ? Math.round(ep.duration / 60) : undefined);
    setIsEditingEpisode(true);
  };

  const handleSaveEpisode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!epTitle.trim()) return;

    try {
      setIsSavingEpisode(true);
      if (targetEpisodeId) {
        await api.movies.updateEpisode(series._id, targetEpisodeId, {
          seasonNumber: epSeasonNumber,
          episodeNumber: epEpisodeNumber,
          title: epTitle.trim(),
          overview: epOverview.trim() || undefined,
          stillPath: epStillPath.trim() || undefined,
          duration: epDuration ? epDuration * 60 : undefined,
        });
        success("Episode Updated", `"${epTitle}" details saved.`);
      } else {
        await api.movies.addEpisode(series._id, {
          seasonNumber: epSeasonNumber,
          episodeNumber: epEpisodeNumber,
          title: epTitle.trim(),
          overview: epOverview.trim() || undefined,
          stillPath: epStillPath.trim() || undefined,
          duration: epDuration ? epDuration * 60 : undefined,
        });
        success("Episode Added", `"${epTitle}" added to Season ${epSeasonNumber}.`);
      }
      setIsEditingEpisode(false);
      await onRefreshSeries();
    } catch (err: any) {
      error("Action Failed", err.message || "Could not save episode.");
    } finally {
      setIsSavingEpisode(false);
    }
  };

  const handleDeleteEpisode = async (episodeId: string, title: string) => {
    if (!confirm(`Delete "${title}"? Any associated R2 video files will be purged.`)) return;

    try {
      await api.movies.deleteEpisode(series._id, episodeId);
      success("Episode Deleted", `"${title}" has been deleted.`);
      await onRefreshSeries();
    } catch (err: any) {
      error("Delete Failed", err.message || "Could not delete episode.");
    }
  };

  const handleImportTmdb = async () => {
    if (!series.tmdbId) {
      error("TMDB ID Missing", "This series does not have a TMDB ID assigned. Edit series and search TMDB first.");
      return;
    }

    try {
      setIsImportingTmdb(true);
      info("Importing Seasons...", "Auto-fetching all season episodes and artwork from TMDB...");
      await api.movies.importTmdbEpisodes(series._id);
      success("Seasons & Episodes Imported", "Successfully populated season hierarchy and episodes!");
      await onRefreshSeries();
    } catch (err: any) {
      error("Import Failed", err.message || "Failed to import from TMDB.");
    } finally {
      setIsImportingTmdb(false);
    }
  };

  const handleAddNewSeason = () => {
    const nextSeason = Math.max(...seasonsList, 0) + 1;
    setActiveSeason(nextSeason);
    setTargetEpisodeId(null);
    setEpSeasonNumber(nextSeason);
    setEpEpisodeNumber(1);
    setEpTitle(`Episode 1`);
    setEpOverview("");
    setEpStillPath("");
    setEpDuration(undefined);
    setIsEditingEpisode(true);
  };

  const getStatusBadge = (status: MovieStatus, progress?: number) => {
    switch (status) {
      case "READY":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Ready
          </span>
        );
      case "PROCESSING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20 animate-pulse">
            <RotateCw className="w-3 h-3 animate-spin" />
            Transcoding {progress ? `${progress}%` : ""}
          </span>
        );
      case "UPLOADING":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Clock className="w-3 h-3" />
            Uploading
          </span>
        );
      case "FAILED":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <AlertCircle className="w-3 h-3" />
            Failed
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Draft
          </span>
        );
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={series.title}
        subtitle="Series Season & Episode Hierarchy Studio"
        maxWidth="4xl"
      >
        <div className="space-y-6">
          {/* Header Action Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-950/50 via-slate-900 to-indigo-950/40 border border-purple-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-14 rounded-lg bg-slate-800 overflow-hidden shrink-0 border border-slate-700">
                {series.poster || series.backdrop ? (
                  <img src={series.poster || series.backdrop} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-600">
                    <Film className="w-4 h-4" />
                  </div>
                )}
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>{series.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px] font-mono border border-purple-500/30">
                    {series.episodes?.length || 0} Episodes
                  </span>
                </h4>
                <p className="text-xs text-slate-400 mt-0.5">
                  Organize seasons, auto-fetch TMDB episodes, and upload video files per episode.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {series.tmdbId && (
                <button
                  onClick={handleImportTmdb}
                  disabled={isImportingTmdb}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow-md shadow-purple-600/30 transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                  title="Auto-import all season episodes from TMDB"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isImportingTmdb ? "animate-spin" : ""}`} />
                  <span>{isImportingTmdb ? "Importing..." : "Auto-Import TMDB"}</span>
                </button>
              )}
              <button
                onClick={handleOpenAddEpisode}
                className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Episode</span>
              </button>
            </div>
          </div>

          {/* Season Tabs Rail */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3 overflow-x-auto custom-scrollbar">
            {seasonsList.map((seasonNum) => {
              const count = series.episodes?.filter((e) => e.seasonNumber === seasonNum).length || 0;
              const isActive = activeSeason === seasonNum;
              return (
                <button
                  key={seasonNum}
                  onClick={() => setActiveSeason(seasonNum)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all shrink-0 cursor-pointer ${
                    isActive
                      ? "bg-purple-600 text-white shadow-lg shadow-purple-600/30"
                      : "bg-slate-900/90 text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-800"
                  }`}
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>Season {seasonNum}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                      isActive ? "bg-purple-800 text-purple-200" : "bg-slate-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Add New Season Button */}
            <button
              onClick={handleAddNewSeason}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-purple-300 hover:bg-purple-500/10 border border-dashed border-slate-700 hover:border-purple-500/40 transition-all shrink-0 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Season</span>
            </button>
          </div>

          {/* Current Season Episodes Grid / List */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Season {activeSeason} Episodes ({currentSeasonEpisodes.length})
              </h5>
            </div>

            {currentSeasonEpisodes.length === 0 ? (
              <div className="p-8 rounded-2xl bg-slate-900/40 border border-slate-800 text-center">
                <Layers className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                <p className="text-xs text-slate-400 font-medium">
                  No episodes created for Season {activeSeason} yet.
                </p>
                <div className="mt-3 flex items-center justify-center gap-2">
                  <button
                    onClick={handleOpenAddEpisode}
                    className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Create Episode 1</span>
                  </button>
                  {series.tmdbId && (
                    <button
                      onClick={handleImportTmdb}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-all flex items-center gap-1.5"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                      <span>Import from TMDB</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {currentSeasonEpisodes.map((ep) => (
                  <div
                    key={ep._id}
                    className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 hover:border-purple-500/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                  >
                    <div className="flex items-start sm:items-center gap-3.5 min-w-0">
                      {/* Episode Thumbnail */}
                      <div className="w-24 aspect-[16/10] rounded-xl bg-slate-800 overflow-hidden shrink-0 relative border border-slate-700/60">
                        {ep.stillPath ? (
                          <img src={ep.stillPath} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-600">
                            <Film className="w-4 h-4" />
                          </div>
                        )}
                        <div className="absolute top-1 left-1 px-1.5 py-0.2 rounded bg-black/70 font-mono text-[9px] text-white font-semibold">
                          E{ep.episodeNumber.toString().padStart(2, "0")}
                        </div>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h6 className="text-sm font-semibold text-slate-100 group-hover:text-purple-300 transition-colors truncate">
                            {ep.episodeNumber}. {ep.title}
                          </h6>
                          {getStatusBadge(ep.status, ep.processingProgress)}
                        </div>

                        <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                          {ep.duration && (
                            <span>{Math.round(ep.duration / 60)} min</span>
                          )}
                          {ep.airDate && (
                            <>
                              <span>•</span>
                              <span>{ep.airDate}</span>
                            </>
                          )}
                          {ep.resolution && (
                            <>
                              <span>•</span>
                              <span className="text-emerald-400 font-mono">{ep.resolution}</span>
                            </>
                          )}
                        </div>

                        {ep.overview && (
                          <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 max-w-xl">
                            {ep.overview}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Actions per Episode */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {ep.status === "READY" && (
                        <button
                          onClick={() => onPlayEpisode(series, ep)}
                          className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1"
                          title="Stream Episode"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Play</span>
                        </button>
                      )}

                      <button
                        onClick={() => onUploadForEpisode(series, ep)}
                        className="px-2.5 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-semibold transition-all flex items-center gap-1 cursor-pointer"
                        title="Upload/Replace Episode Video File"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        <span>{ep.sourceObjectKey ? "Replace Video" : "Upload Video"}</span>
                      </button>

                      <button
                        onClick={() => handleOpenEditEpisode(ep)}
                        className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
                        title="Edit Episode Info"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDeleteEpisode(ep._id, ep.title)}
                        className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
                        title="Delete Episode"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>

      {/* Edit / Create Episode Sub-Modal */}
      {isEditingEpisode && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="relative w-full max-w-lg bg-[#0e1526] border border-purple-500/30 rounded-3xl shadow-2xl p-6">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800">
              <h4 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-purple-400" />
                <span>{targetEpisodeId ? "Edit Episode" : "Add Episode"}</span>
              </h4>
              <button
                onClick={() => setIsEditingEpisode(false)}
                className="p-1 text-slate-400 hover:text-white rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEpisode} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Season #</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={epSeasonNumber}
                    onChange={(e) => setEpSeasonNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Episode #</label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={epEpisodeNumber}
                    onChange={(e) => setEpEpisodeNumber(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Episode Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pilot, The Beginning..."
                  value={epTitle}
                  onChange={(e) => setEpTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Duration (minutes)</label>
                  <input
                    type="number"
                    placeholder="e.g. 45"
                    value={epDuration || ""}
                    onChange={(e) => setEpDuration(e.target.value ? parseInt(e.target.value, 10) : undefined)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Thumbnail / Still URL</label>
                  <input
                    type="url"
                    placeholder="https://image.tmdb.org/..."
                    value={epStillPath}
                    onChange={(e) => setEpStillPath(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Overview / Synopsis</label>
                <textarea
                  rows={2}
                  placeholder="Episode summary..."
                  value={epOverview}
                  onChange={(e) => setEpOverview(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsEditingEpisode(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingEpisode || !epTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow transition-all flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  <span>{isSavingEpisode ? "Saving..." : "Save Episode"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
