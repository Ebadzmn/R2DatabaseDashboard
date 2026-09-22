"use client";

import React, { useState, useRef } from "react";
import { IMovie } from "@/lib/types";
import { DirectR2Uploader } from "@/lib/upload-client";
import { useToast } from "@/components/ui/Toast";
import {
  UploadCloud,
  Film,
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
} from "lucide-react";

interface UploadStudioProps {
  movies: IMovie[];
  onUploadSuccess: () => void;
  onNavigateMovies: () => void;
}

export function UploadStudio({
  movies,
  onUploadSuccess,
  onNavigateMovies,
}: UploadStudioProps) {
  const { success, error, warning } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedMovieId, setSelectedMovieId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);

  // Upload state
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

    const directUploader = new DirectR2Uploader(
      selectedFile,
      selectedMovieId || undefined,
      (progress) => {
        setProgressData(progress);
      }
    );

    setUploader(directUploader);

    try {
      await directUploader.start();
      setCompletedUpload(true);
      success(
        "Upload Completed Successfully",
        "Direct R2 upload complete. Background FFmpeg HLS transcoding has been queued."
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

  const resetUpload = () => {
    setSelectedFile(null);
    setProgressData(null);
    setCompletedUpload(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-[#0f172a] border border-indigo-500/20 shadow-2xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <UploadCloud className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">
              Direct-to-R2 Multipart Upload Station
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Client uploads directly to Cloudflare R2 via presigned URLs. Bypasses backend memory limits and triggers automated BullMQ multi-rendition HLS transcoding.
            </p>
          </div>
        </div>
      </div>

      {/* Main Upload Box */}
      <div className="p-8 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 shadow-2xl space-y-6">
        {/* Dropzone */}
        {!selectedFile ? (
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${
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
            <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <UploadCloud className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-slate-200">
              Drop movie video file here, or <span className="text-indigo-400">browse</span>
            </h4>
            <p className="text-xs text-slate-500 mt-1">
              Supports MP4, MKV, MOV, WEBM (up to 10+ GB with atomic multi-part R2 chunking)
            </p>
          </div>
        ) : (
          /* File Preview Card */
          <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-4">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                <Film className="w-6 h-6" />
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
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                title="Remove file"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        )}

        {/* Association Settings */}
        {selectedFile && !isUploading && !completedUpload && (
          <div className="space-y-4 pt-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Attach to Movie Record
              </label>
              <select
                value={selectedMovieId}
                onChange={(e) => setSelectedMovieId(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80"
              >
                <option value="">
                  ➕ Automatically create a new movie record titled "{selectedFile.name.replace(/\.[^/.]+$/, "")}"
                </option>
                {movies.map((m) => (
                  <option key={m._id} value={m._id}>
                    Attach to: {m.title} ({m.releaseYear || "N/A"}) [{m.status}]
                  </option>
                ))}
              </select>
              <span className="text-[11px] text-slate-500 mt-1 block">
                If unselected, a draft movie will automatically be generated using the video filename.
              </span>
            </div>

            {/* Launch Upload Button */}
            <div className="pt-3">
              <button
                onClick={handleStartUpload}
                className="w-full py-3.5 px-6 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white shadow-xl shadow-indigo-600/30 hover:shadow-indigo-600/50 transition-all flex items-center justify-center gap-2"
              >
                <UploadCloud className="w-5 h-5" />
                <span>Begin Direct-to-R2 Upload</span>
              </button>
            </div>
          </div>
        )}

        {/* Live Upload Progress Section */}
        {isUploading && progressData && (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-[#131b2e] to-[#0c1220] border border-indigo-500/40 shadow-2xl space-y-5 animate-in fade-in">
            {/* Top Bar: Status, Mode Badge & Cancel Button */}
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
                    {progressData.mode === "BACKEND_PIPELINE"
                      ? "High-Performance Cloudflare R2 Pipeline (CORS-Free)"
                      : "Direct Cloudflare R2 S3 Upload"}
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

            {/* Prominent Large Percentage & ETA Row */}
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

            {/* Dynamic Glowing Progress Bar */}
            <div className="w-full h-3.5 bg-slate-900 rounded-full overflow-hidden p-0.5 border border-slate-700/80 shadow-inner">
              <div
                className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 rounded-full transition-all duration-300 shadow-lg shadow-indigo-500/50"
                style={{ width: `${Math.max(1, progressData.percentage)}%` }}
              />
            </div>

            {/* Detailed Metrics Breakdown */}
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


        {/* Success Completion State */}
        {completedUpload && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Upload Successfully Completed</h4>
              <p className="text-xs text-emerald-300/90 mt-1 max-w-md mx-auto leading-relaxed">
                Source video safely written to Cloudflare R2. BullMQ FFmpeg worker has been dispatched to transcode 1080p, 720p, and 480p adaptive HLS renditions.
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

      {/* R2 Multipart Direct Architecture Notes */}
      <div className="p-5 rounded-2xl bg-[#0f172a]/60 border border-slate-800/80 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
        <div className="flex items-start gap-3">
          <HardDrive className="w-4 h-4 text-indigo-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">Concurrency-Safe</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Atomic reservations ensure simultaneous multi-GB uploads never overflow configured bucket limits.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Layers className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">Direct S3 Streaming</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              Chunks travel straight from your browser to Cloudflare R2 edge locations with minimum latency.
            </span>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <Cpu className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold text-slate-200 block">Multi-Rendition HLS</span>
            <span className="text-slate-400 text-[11px] leading-relaxed">
              FFmpeg outputs 6-second segments and `master.m3u8` playlist for smooth adaptive streaming on web & mobile.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
