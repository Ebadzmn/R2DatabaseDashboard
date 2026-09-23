"use client";

import React, { useState, useRef, useMemo, useEffect } from "react";
import { IMovie, IEpisode, IStorageAccount } from "@/lib/types";
import { DirectR2Uploader } from "@/lib/upload-client";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import {
  UploadCloud,
  Film,
  Tv,
  CheckCircle2,
  AlertCircle,
  X,
  Play,
  RotateCw,
  Cpu,
  Layers,
  HardDrive,
  Clock,
  Sparkles,
  Server,
  Database,
  Search,
  Check,
  Calendar,
  Star,
  ArrowRight,
  ShieldCheck,
  Globe,
  DownloadCloud,
  Link2,
} from "lucide-react";

interface UploadStudioProps {
  movies: IMovie[];
  storages?: IStorageAccount[];
  initialTargetMovie?: IMovie | null;
  initialTargetEpisode?: IEpisode | null;
  onUploadSuccess: () => void;
  onNavigateMovies: () => void;
  onNavigateSeries?: () => void;
}

export function UploadStudio({
  movies,
  storages = [],
  initialTargetMovie = null,
  initialTargetEpisode = null,
  onUploadSuccess,
  onNavigateMovies,
  onNavigateSeries,
}: UploadStudioProps) {
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Step 1: Storage Account Selection (Pre-selected)
  const activeStorages = useMemo(() => storages.filter((s) => s.status === "ACTIVE"), [storages]);
  const [selectedStorageId, setSelectedStorageId] = useState<string>("");

  // Source Mode: Local File vs Remote URL
  const [sourceMode, setSourceMode] = useState<"LOCAL_FILE" | "REMOTE_URL">("LOCAL_FILE");

  // 2. Step 2 (Option A): Local File Selection
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // 2. Step 2 (Option B): Remote URL Downloader
  const [remoteUrl, setRemoteUrl] = useState("");
  const [remoteFileName, setRemoteFileName] = useState("");
  const [isRemoteDownloading, setIsRemoteDownloading] = useState(false);
  const [remoteSessionId, setRemoteSessionId] = useState<string | null>(null);
  const [remoteProgress, setRemoteProgress] = useState<{
    percentage: number;
    loadedBytes: number;
    totalBytes: number;
    speedBytesPerSec: number;
    etaSeconds?: number;
    status: string;
    fileName?: string;
  } | null>(null);
  const remotePollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // 3. Step 3: Assignment & Target Search
  const [mediaTypeTab, setMediaTypeTab] = useState<"ALL" | "MOVIE" | "SERIES">("ALL");
  const [movieSearchQuery, setMovieSearchQuery] = useState("");
  const [selectedMovie, setSelectedMovie] = useState<IMovie | null>(initialTargetMovie);

  // Series Season & Episode selection
  const [selectedSeasonNumber, setSelectedSeasonNumber] = useState<number>(1);
  const [selectedEpisodeId, setSelectedEpisodeId] = useState<string>("");
  const [selectedEpisodeNumber, setSelectedEpisodeNumber] = useState<number>(1);

  React.useEffect(() => {
    if (initialTargetMovie) {
      setSelectedMovie(initialTargetMovie);
      if (initialTargetMovie.type === "SERIES") {
        setMediaTypeTab("SERIES");
      }
    }
    if (initialTargetEpisode) {
      setSelectedSeasonNumber(initialTargetEpisode.seasonNumber || 1);
      setSelectedEpisodeId(initialTargetEpisode._id || "");
      setSelectedEpisodeNumber(initialTargetEpisode.episodeNumber || 1);
    }
  }, [initialTargetMovie, initialTargetEpisode]);

  // Derive unique seasons for selected series
  const seriesSeasons = useMemo(() => {
    if (!selectedMovie || selectedMovie.type !== "SERIES") return [1];
    const seasonsSet = new Set<number>();
    if (selectedMovie.totalSeasons && selectedMovie.totalSeasons > 0) {
      for (let i = 1; i <= selectedMovie.totalSeasons; i++) seasonsSet.add(i);
    }
    if (selectedMovie.episodes && selectedMovie.episodes.length > 0) {
      selectedMovie.episodes.forEach((e) => seasonsSet.add(e.seasonNumber || 1));
    }
    if (seasonsSet.size === 0) seasonsSet.add(1);
    return Array.from(seasonsSet).sort((a, b) => a - b);
  }, [selectedMovie]);

  // Filter episodes for current selected season
  const seasonEpisodes = useMemo(() => {
    if (!selectedMovie?.episodes) return [];
    return selectedMovie.episodes
      .filter((e) => e.seasonNumber === selectedSeasonNumber)
      .sort((a, b) => a.episodeNumber - b.episodeNumber);
  }, [selectedMovie, selectedSeasonNumber]);

  // When selected series changes or season changes, update episode selection
  React.useEffect(() => {
    if (selectedMovie?.type === "SERIES") {
      if (seasonEpisodes.length > 0 && (!selectedEpisodeId || !seasonEpisodes.some(e => e._id === selectedEpisodeId))) {
        setSelectedEpisodeId(seasonEpisodes[0]._id);
        setSelectedEpisodeNumber(seasonEpisodes[0].episodeNumber);
      }
    }
  }, [selectedMovie, selectedSeasonNumber, seasonEpisodes, selectedEpisodeId]);

  // Upload Progress State
  const [isUploading, setIsUploading] = useState(false);
  const [uploader, setUploader] = useState<DirectR2Uploader | null>(null);
  const [progressData, setProgressData] = useState<{
    percentage: number;
    loadedBytes: number;
    totalBytes: number;
    speedBytesPerSec: number;
    currentPart?: number;
    totalParts?: number;
    status: string;
    mode?: "DIRECT_R2" | "BACKEND_PIPELINE";
  } | null>(null);

  const [completedUpload, setCompletedUpload] = useState<boolean>(false);

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  // Filter Catalog items for assignment search
  const filteredCatalog = useMemo(() => {
    return movies.filter((item) => {
      const matchesType =
        mediaTypeTab === "ALL"
          ? true
          : mediaTypeTab === "MOVIE"
          ? item.type === "MOVIE" || !item.type
          : item.type === "SERIES";

      const matchesSearch =
        movieSearchQuery.trim() === "" ||
        item.title.toLowerCase().includes(movieSearchQuery.toLowerCase()) ||
        item.slug.toLowerCase().includes(movieSearchQuery.toLowerCase()) ||
        (item.description && item.description.toLowerCase().includes(movieSearchQuery.toLowerCase()));

      return matchesType && matchesSearch;
    });
  }, [movies, mediaTypeTab, movieSearchQuery]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setCompletedUpload(false);
    setProgressData(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setCompletedUpload(false);

    const isSeries = selectedMovie?.type === "SERIES";

    const directUploader = new DirectR2Uploader(
      selectedFile,
      selectedMovie?._id || undefined,
      selectedStorageId || undefined,
      (progress) => {
        setProgressData(progress);
      },
      isSeries
        ? {
            episodeId: selectedEpisodeId || undefined,
            seasonNumber: selectedSeasonNumber,
            episodeNumber: selectedEpisodeNumber,
          }
        : undefined
    );

    setUploader(directUploader);

    try {
      await directUploader.start();
      setCompletedUpload(true);
      const targetLabel = isSeries
        ? `"${selectedMovie?.title}" (S${selectedSeasonNumber}E${selectedEpisodeNumber})`
        : selectedMovie
        ? `"${selectedMovie.title}"`
        : "new catalog entry";
      success(
        "Upload Completed Successfully",
        `Video stream safely uploaded to Cloudflare R2 and assigned to ${targetLabel}.`
      );
      onUploadSuccess();
    } catch (err: any) {
      if (err.message !== "Upload cancelled by user") {
        error("Upload Failed", err.message || "Failed to upload video to Cloudflare R2.");
      }
    } finally {
      setIsUploading(false);
      setUploader(null);
    }
  };

  const handleAbort = () => {
    if (uploader) {
      uploader.abort();
      warning("Upload Cancelled", "Upload session aborted and reserved storage has been released.");
      setIsUploading(false);
      setUploader(null);
    }
  };

  // Remote download polling effect
  useEffect(() => {
    if (!isRemoteDownloading || !remoteSessionId) {
      if (remotePollIntervalRef.current) {
        clearInterval(remotePollIntervalRef.current);
        remotePollIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      try {
        const res = await api.uploads.getById(remoteSessionId);
        const session = res.data;
        if (!session) return;

        setRemoteProgress({
          percentage: session.progress || 0,
          loadedBytes: session.uploadedBytes || 0,
          totalBytes: session.fileSize || 0,
          speedBytesPerSec: session.downloadSpeedBytesPerSec || 0,
          etaSeconds: session.etaSeconds,
          status: session.status,
          fileName: session.fileName,
        });

        if (session.status === "COMPLETED") {
          if (remotePollIntervalRef.current) {
            clearInterval(remotePollIntervalRef.current);
            remotePollIntervalRef.current = null;
          }
          setIsRemoteDownloading(false);
          setCompletedUpload(true);
          success(
            "Remote Download Completed",
            `Video stream successfully saved to Cloudflare R2 and dispatched to BullMQ HLS transcoding!`
          );
          onUploadSuccess();
        } else if (session.status === "FAILED") {
          if (remotePollIntervalRef.current) {
            clearInterval(remotePollIntervalRef.current);
            remotePollIntervalRef.current = null;
          }
          setIsRemoteDownloading(false);
          error("Remote Download Failed", session.errorMessage || "Remote video download failed.");
        } else if (session.status === "ABORTED") {
          if (remotePollIntervalRef.current) {
            clearInterval(remotePollIntervalRef.current);
            remotePollIntervalRef.current = null;
          }
          setIsRemoteDownloading(false);
          warning("Download Cancelled", "Remote download session was aborted.");
        }
      } catch (err: any) {
        console.error("Polling remote download status failed:", err);
      }
    };

    poll();
    remotePollIntervalRef.current = setInterval(poll, 1200);

    return () => {
      if (remotePollIntervalRef.current) {
        clearInterval(remotePollIntervalRef.current);
        remotePollIntervalRef.current = null;
      }
    };
  }, [isRemoteDownloading, remoteSessionId, onUploadSuccess, success, error, warning]);

  const handleStartRemoteDownload = async () => {
    if (!remoteUrl.trim()) {
      warning("Missing URL", "Please enter a valid remote video download link.");
      return;
    }

    setIsRemoteDownloading(true);
    setCompletedUpload(false);
    setRemoteProgress({
      percentage: 0,
      loadedBytes: 0,
      totalBytes: 0,
      speedBytesPerSec: 0,
      status: "DOWNLOADING",
      fileName: remoteFileName.trim() || undefined,
    });

    const isSeries = selectedMovie?.type === "SERIES";

    try {
      const res = await api.uploads.initRemoteDownload({
        url: remoteUrl.trim(),
        fileName: remoteFileName.trim() || undefined,
        movieId: selectedMovie?._id,
        storageAccountId: selectedStorageId || undefined,
        ...(isSeries
          ? {
              episodeId: selectedEpisodeId || undefined,
              seasonNumber: selectedSeasonNumber,
              episodeNumber: selectedEpisodeNumber,
            }
          : {}),
      });

      const sid = (res.data as any).sessionId || (res.data as any).uploadSessionId;
      setRemoteSessionId(sid);
      success(
        "Download Started on Server",
        "The server is now streaming video packets directly into Cloudflare R2."
      );
    } catch (err: any) {
      setIsRemoteDownloading(false);
      error("Download Failed to Start", err.message || "Could not initialize remote download.");
    }
  };

  const handleCancelRemoteDownload = async () => {
    if (!remoteSessionId) return;
    try {
      await api.uploads.cancelRemoteDownload(remoteSessionId);
      warning("Cancelling...", "Sent abort request to remote download stream.");
    } catch (err: any) {
      error("Cancel Failed", err.message);
    }
  };

  const resetUpload = () => {
    setSelectedFile(null);
    setSelectedMovie(null);
    setSelectedEpisodeId("");
    setProgressData(null);
    setRemoteProgress(null);
    setRemoteSessionId(null);
    setIsRemoteDownloading(false);
    setRemoteUrl("");
    setRemoteFileName("");
    setCompletedUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0f172a] border border-indigo-500/20 shadow-2xl flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Cloudflare R2 Video Upload & Remote Downloader Hub
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              1. Select R2 Node ➔ 2. Local File or Remote URL ➔ 3. Assign & Stream to R2
            </p>
          </div>
        </div>
      </div>

      {/* STEP 1: SELECT R2 STORAGE ACCOUNT */}
      <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              1
            </span>
            <h3 className="text-sm font-bold text-white">Select Target Cloudflare R2 Account</h3>
          </div>
          <span className="text-xs text-slate-400">
            {activeStorages.length} Active Storage Nodes
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {/* Auto Rotate Option Card */}
          <div
            onClick={() => setSelectedStorageId("")}
            className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
              selectedStorageId === ""
                ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30"
                : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                <span className="font-semibold text-xs text-white">⚡ Auto-Rotate Node</span>
              </div>
              {selectedStorageId === "" && <Check className="w-4 h-4 text-indigo-400" />}
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Auto-selects the R2 storage account with optimal available space and priority.
            </p>
          </div>

          {/* Specific R2 Nodes */}
          {activeStorages.map((storage) => {
            const isSelected = selectedStorageId === storage._id;
            const freeBytes = storage.maxStorageBytes - storage.usedStorageBytes - storage.reservedStorageBytes;
            const freeGB = (Math.max(0, freeBytes) / (1024 * 1024 * 1024)).toFixed(1);
            return (
              <div
                key={storage._id}
                onClick={() => setSelectedStorageId(storage._id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <div className="flex items-center gap-2 truncate">
                      <Database className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-xs text-white truncate">{storage.name}</span>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400 shrink-0" />}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">
                    Bucket: <span className="text-slate-300">[{storage.bucketName}]</span>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
                  <span className="text-emerald-400 font-medium">{freeGB} GB Free</span>
                  <span className="text-slate-400 font-mono">{storage.usagePercentage}% used</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 2: VIDEO SOURCE SELECTION (LOCAL FILE VS REMOTE URL) */}
      <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-800/80 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
              2
            </span>
            <h3 className="text-sm font-bold text-white">Choose Video Source</h3>
          </div>

          {/* Dual Source Mode Switcher */}
          <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              type="button"
              onClick={() => {
                if (!isUploading && !isRemoteDownloading) setSourceMode("LOCAL_FILE");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sourceMode === "LOCAL_FILE"
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <UploadCloud className="w-3.5 h-3.5" />
              <span>📁 Local Video File</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (!isUploading && !isRemoteDownloading) setSourceMode("REMOTE_URL");
              }}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                sourceMode === "REMOTE_URL"
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-md shadow-cyan-600/30"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Globe className="w-3.5 h-3.5" />
              <span>🌐 Remote URL Downloader</span>
            </button>
          </div>
        </div>

        {sourceMode === "LOCAL_FILE" ? (
          /* OPTION A: LOCAL FILE DROPZONE */
          !selectedFile ? (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-10 text-center cursor-pointer transition-all ${
                isDragging
                  ? "border-indigo-500 bg-indigo-500/5 scale-[1.01]"
                  : "border-slate-700/80 hover:border-slate-600 bg-slate-900/40 hover:bg-slate-900/60"
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                accept="video/*,.mp4,.mkv,.mov,.webm,.ts"
                className="hidden"
              />
              <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <UploadCloud className="w-7 h-7" />
              </div>
              <h4 className="text-sm font-bold text-slate-200">
                Drop movie or episode video file here, or <span className="text-indigo-400">browse</span>
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                Supports MP4, MKV, MOV, WEBM (Atomic multi-part presigned R2 chunks)
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <Film className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-white truncate">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Size: <span className="font-mono text-slate-200">{formatBytes(selectedFile.size)}</span>
                    {" • "}
                    Type: <span className="font-mono text-slate-200">{selectedFile.type || "video/mp4"}</span>
                  </p>
                </div>
              </div>

              {!isUploading && !completedUpload && (
                <button
                  onClick={resetUpload}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                  title="Remove file"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )
        ) : (
          /* OPTION B: REMOTE URL INPUT PANEL */
          <div className="space-y-4 animate-in fade-in">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Direct Video Download Link (HTTP / HTTPS)
              </label>
              <div className="relative">
                <Globe className="w-4 h-4 text-cyan-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="url"
                  placeholder="https://example.com/videos/movie-1080p.mp4"
                  value={remoteUrl}
                  disabled={isRemoteDownloading}
                  onChange={(e) => {
                    setRemoteUrl(e.target.value);
                    setCompletedUpload(false);
                  }}
                  className="w-full pl-10 pr-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all font-mono"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5 leading-relaxed">
                Provide a direct downloadable video link (MP4, MKV, etc.). The server streams packets directly to Cloudflare R2 with zero local disk bottleneck.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Custom File Name (Optional)
                </label>
                <div className="relative">
                  <Film className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="e.g. Inception.2010.1080p.mp4"
                    value={remoteFileName}
                    disabled={isRemoteDownloading}
                    onChange={(e) => setRemoteFileName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-all"
                  />
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/20 border border-cyan-500/20 flex items-center gap-3">
                <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
                <div className="text-[11px] text-cyan-200/90 leading-tight">
                  <span className="font-semibold block text-cyan-300">Atomic R2 Stream</span>
                  Transfers in 10MB memory chunks with live speed & ETA metrics.
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* STEP 3: ASSIGN TO MOVIE / SERIES CATALOG */}
      {((sourceMode === "LOCAL_FILE" && selectedFile) ||
        (sourceMode === "REMOTE_URL" && remoteUrl.trim().length > 5)) &&
        !isUploading &&
        !isRemoteDownloading &&
        !completedUpload && (
        <div className="p-6 rounded-2xl bg-[#0f172a]/90 border border-slate-800/80 shadow-xl space-y-4 animate-in fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-6 h-6 rounded-full bg-indigo-600 text-white font-bold text-xs flex items-center justify-center">
                3
              </span>
              <div>
                <h3 className="text-sm font-bold text-white">Assign to Movie / Series</h3>
                <p className="text-[11px] text-slate-400">Search and link this video to an existing movie or TV show</p>
              </div>
            </div>

            {/* Type Filters */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setMediaTypeTab("ALL")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaTypeTab === "ALL" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                All ({movies.length})
              </button>
              <button
                type="button"
                onClick={() => setMediaTypeTab("MOVIE")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaTypeTab === "MOVIE" ? "bg-indigo-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                🎬 Movies
              </button>
              <button
                type="button"
                onClick={() => setMediaTypeTab("SERIES")}
                className={`px-3 py-1 rounded-lg font-medium transition-all ${
                  mediaTypeTab === "SERIES" ? "bg-purple-600 text-white" : "text-slate-400 hover:text-white"
                }`}
              >
                📺 Series
              </button>
            </div>
          </div>

          {/* Search bar inside Catalog */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search previously created movies or series by title..."
              value={movieSearchQuery}
              onChange={(e) => setMovieSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
            />
          </div>

          {/* Catalog Item Selection List */}
          <div className="max-h-64 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
            {/* Option: Create Brand New Record from File */}
            <div
              onClick={() => setSelectedMovie(null)}
              className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                selectedMovie === null
                  ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-white">
                    {sourceMode === "LOCAL_FILE"
                      ? `➕ Create New Record: "${selectedFile?.name.replace(/\.[^/.]+$/, "")}"`
                      : `➕ Create New Record: "${remoteFileName.trim() || remoteUrl.split("/").pop()?.split("?")[0]?.replace(/\.[^/.]+$/, "") || "Remote Video"}"`}
                  </h4>
                  <p className="text-[10px] text-slate-400">
                    Automatically creates a draft catalog entry from {sourceMode === "LOCAL_FILE" ? "video filename" : "remote URL file"}
                  </p>
                </div>
              </div>
              {selectedMovie === null && <Check className="w-4 h-4 text-indigo-400" />}
            </div>

            {/* Existing Movies List */}
            {filteredCatalog.map((item) => {
              const isSelected = selectedMovie?._id === item._id;
              return (
                <div
                  key={item._id}
                  onClick={() => setSelectedMovie(item)}
                  className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                    isSelected
                      ? "bg-indigo-950/40 border-indigo-500 ring-1 ring-indigo-500/30"
                      : "bg-slate-900/60 border-slate-800 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {/* Poster thumbnail */}
                    <div className="w-8 h-11 rounded bg-slate-800 shrink-0 overflow-hidden border border-slate-700/60 flex items-center justify-center text-slate-500">
                      {item.poster ? (
                        <img src={item.poster} alt="" className="w-full h-full object-cover" />
                      ) : item.type === "SERIES" ? (
                        <Tv className="w-4 h-4" />
                      ) : (
                        <Film className="w-4 h-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white truncate">{item.title}</span>
                        <span
                          className={`text-[9px] px-1.5 py-0.2 rounded font-semibold uppercase ${
                            item.type === "SERIES"
                              ? "bg-purple-950/80 text-purple-300 border border-purple-500/30"
                              : "bg-indigo-950/80 text-indigo-300 border border-indigo-500/30"
                          }`}
                        >
                          {item.type || "MOVIE"}
                        </span>
                        {item.releaseYear && (
                          <span className="text-[10px] text-slate-400">{item.releaseYear}</span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {item.description || `Slug: /${item.slug}`}
                      </p>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-medium ${
                        item.status === "READY"
                          ? "text-emerald-400 bg-emerald-500/10"
                          : item.status === "PROCESSING"
                          ? "text-amber-400 bg-amber-500/10"
                          : "text-slate-400 bg-slate-800"
                      }`}
                    >
                      {item.status}
                    </span>
                    {isSelected && <Check className="w-4 h-4 text-indigo-400" />}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Series Season & Episode Selection Sub-panel */}
          {selectedMovie && selectedMovie.type === "SERIES" && (
            <div className="p-4 rounded-xl bg-purple-950/30 border border-purple-500/30 space-y-3 animate-in fade-in">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-300">
                <Tv className="w-4 h-4" />
                <span>Assign Video to Series Episode: "{selectedMovie.title}"</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Season Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Select Season</label>
                  <select
                    value={selectedSeasonNumber}
                    onChange={(e) => setSelectedSeasonNumber(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                  >
                    {seriesSeasons.map((s) => (
                      <option key={s} value={s}>
                        Season {s} ({selectedMovie.episodes?.filter((e) => e.seasonNumber === s).length || 0} episodes)
                      </option>
                    ))}
                  </select>
                </div>

                {/* Episode Selector */}
                <div>
                  <label className="block text-[11px] font-semibold text-slate-300 mb-1">Select Episode</label>
                  {seasonEpisodes.length === 0 ? (
                    <div className="px-3 py-2 bg-slate-900/60 border border-slate-800 rounded-xl text-xs text-amber-400">
                      No episodes found for Season {selectedSeasonNumber}. Upload will attach to Ep 1.
                    </div>
                  ) : (
                    <select
                      value={selectedEpisodeId}
                      onChange={(e) => {
                        const epId = e.target.value;
                        setSelectedEpisodeId(epId);
                        const ep = seasonEpisodes.find((x) => x._id === epId);
                        if (ep) setSelectedEpisodeNumber(ep.episodeNumber);
                      }}
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-purple-500"
                    >
                      {seasonEpisodes.map((ep) => (
                        <option key={ep._id} value={ep._id}>
                          Episode {ep.episodeNumber}: {ep.title} {ep.sourceObjectKey ? "(Has Video)" : "(Empty)"}
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Final Action Launch Button */}
          <div className="pt-3 border-t border-slate-800">
            <button
              onClick={sourceMode === "LOCAL_FILE" ? handleStartUpload : handleStartRemoteDownload}
              className={`w-full py-3.5 px-6 rounded-xl font-bold text-sm text-white shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
                sourceMode === "LOCAL_FILE"
                  ? "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 hover:from-indigo-500 hover:to-purple-500 shadow-indigo-600/30 hover:shadow-indigo-600/50"
                  : "bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 shadow-cyan-600/30 hover:shadow-cyan-600/50"
              }`}
            >
              {sourceMode === "LOCAL_FILE" ? (
                <UploadCloud className="w-5 h-5" />
              ) : (
                <DownloadCloud className="w-5 h-5" />
              )}
              <span>
                {sourceMode === "LOCAL_FILE" ? "Upload & Assign Video" : "Start Server Download & Stream to R2"} to{" "}
                {selectedMovie?.type === "SERIES"
                  ? `"${selectedMovie.title}" (Season ${selectedSeasonNumber} • Episode ${selectedEpisodeNumber})`
                  : selectedMovie
                  ? `"${selectedMovie.title}"`
                  : "New Record"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Live Upload Progress Section */}
      {isUploading && progressData && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-indigo-500/40 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-indigo-500"></span>
              </span>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {progressData.status === "INITIALIZING"
                    ? "Reserving R2 Storage & Generating Part URLs..."
                    : progressData.status === "UPLOADING"
                    ? "Uploading Video Stream to Cloudflare R2..."
                    : progressData.status === "COMPLETING"
                    ? "Committing Multipart ETags & Dispatching BullMQ..."
                    : progressData.status}
                </span>
                <span className="text-[11px] text-slate-400">
                  {selectedMovie ? `Target: ${selectedMovie.title}` : "Creating new catalog record"}
                </span>
              </div>
            </div>

            <button
              onClick={handleAbort}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all"
            >
              Cancel Upload
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-300 to-emerald-400 font-mono tracking-tight">
                {progressData.percentage}%
              </span>
              <span className="text-xs font-semibold text-slate-400">completed</span>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-emerald-400 font-mono">
                {formatBytes(progressData.speedBytesPerSec)}/s
              </div>
              {progressData.speedBytesPerSec > 0 && progressData.loadedBytes < progressData.totalBytes && (
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ETA: ~
                  {Math.ceil(
                    (progressData.totalBytes - progressData.loadedBytes) / progressData.speedBytesPerSec
                  )}{" "}
                  seconds
                </div>
              )}
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
              style={{ width: `${Math.max(1, progressData.percentage)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Uploaded</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block truncate">
                {formatBytes(progressData.loadedBytes)} / {formatBytes(progressData.totalBytes)}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Parts</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block">
                {progressData.currentPart && progressData.totalParts
                  ? `Chunk ${progressData.currentPart} / ${progressData.totalParts}`
                  : "Single Part"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Pipeline</span>
              <span className="font-mono text-indigo-400 font-semibold mt-0.5 block truncate">
                {progressData.mode === "BACKEND_PIPELINE" ? "R2 Bridge" : "Direct R2"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Remote URL Download Progress Section */}
      {isRemoteDownloading && remoteProgress && (
        <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0a1b2a] to-[#0c1220] border border-cyan-500/40 shadow-2xl space-y-5 animate-in fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              <div>
                <span className="text-xs font-bold text-white uppercase tracking-wider block">
                  {remoteProgress.status === "INITIALIZED"
                    ? "Connecting to remote URL & initializing R2 multipart..."
                    : remoteProgress.status === "DOWNLOADING"
                    ? "Server Streaming Remote URL ➔ Cloudflare R2..."
                    : remoteProgress.status === "COMPLETED"
                    ? "Download Complete! Transcoder Dispatching..."
                    : remoteProgress.status}
                </span>
                <span className="text-[11px] text-cyan-300 font-mono truncate max-w-md block">
                  {remoteProgress.fileName || remoteFileName || remoteUrl}
                </span>
              </div>
            </div>

            <button
              onClick={handleCancelRemoteDownload}
              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-rose-400 hover:text-white bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-all cursor-pointer"
            >
              Cancel Download
            </button>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div className="flex items-baseline gap-2">
              <span className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-300 to-emerald-400 font-mono tracking-tight">
                {remoteProgress.percentage}%
              </span>
              <span className="text-xs font-semibold text-slate-400">downloaded & uploaded to R2</span>
            </div>

            <div className="text-right">
              <div className="text-sm font-bold text-cyan-400 font-mono">
                {formatBytes(remoteProgress.speedBytesPerSec)}/s
              </div>
              {remoteProgress.etaSeconds && remoteProgress.etaSeconds > 0 ? (
                <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                  ETA: ~{remoteProgress.etaSeconds}s remaining
                </div>
              ) : null}
            </div>
          </div>

          <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-blue-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-cyan-500/50"
              style={{ width: `${Math.max(1, remoteProgress.percentage)}%` }}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 pt-1 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Streamed</span>
              <span className="font-mono text-slate-200 font-semibold mt-0.5 block truncate">
                {formatBytes(remoteProgress.loadedBytes)} / {remoteProgress.totalBytes > 0 ? formatBytes(remoteProgress.totalBytes) : "Streaming"}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">Source Mode</span>
              <span className="font-mono text-cyan-400 font-semibold mt-0.5 block truncate">
                Direct URL Stream
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-900/60 border border-slate-800/80 text-center">
              <span className="text-[10px] text-slate-500 block uppercase font-medium">R2 Storage Node</span>
              <span className="font-mono text-emerald-400 font-semibold mt-0.5 block truncate">
                {selectedStorageId
                  ? storages.find((s) => s._id === selectedStorageId)?.name || "Target R2"
                  : "Auto-Rotate R2"}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Success Completion State */}
      {completedUpload && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
          <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-base font-bold text-white">
              {sourceMode === "REMOTE_URL"
                ? "Remote Video Downloaded & Uploaded to R2"
                : "Upload & Assignment Completed"}
            </h4>
            <p className="text-xs text-emerald-300/90 mt-1 max-w-md mx-auto leading-relaxed">
              Video safely written to selected Cloudflare R2 bucket. BullMQ worker is now transcoding 1080p, 720p, and 480p adaptive HLS renditions.
            </p>
          </div>

          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={onNavigateMovies}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all"
            >
              View in Movies Studio
            </button>
            <button
              onClick={resetUpload}
              className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-all"
            >
              Upload Another Video
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
