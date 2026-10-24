"use client";

import React, { useEffect, useState, useRef } from "react";
import { Modal } from "@/components/ui/Modal";
import { IMovie, IEpisode, PlaybackResponse } from "@/lib/types";
import { api } from "@/lib/api-client";
import { resolveImageUrl } from "@/lib/image-url";
import { useToast } from "@/components/ui/Toast";
import {
  Play,
  Copy,
  Check,
  ShieldCheck,
  ExternalLink,
  Film,
  HardDrive,
  Info,
  Layers,
  Trash2,
  Plus,
  Edit2,
  Sparkles,
  RefreshCw,
  UploadCloud,
} from "lucide-react";

import { CustomHlsPlayer } from "@/components/player/CustomHlsPlayer";

interface MoviePlaybackModalProps {
  movie: IMovie | null;
  episode?: IEpisode | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MoviePlaybackModal({
  movie,
  episode,
  isOpen,
  onClose,
}: MoviePlaybackModalProps) {
  const [playbackData, setPlaybackData] = useState<PlaybackResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedHls, setCopiedHls] = useState(false);
  const [copiedSource, setCopiedSource] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { success: showToastSuccess, error: showToastError } = useToast();
  const [activeScreenshots, setActiveScreenshots] = useState<string[]>([]);
  const [isUpdatingScreenshot, setIsUpdatingScreenshot] = useState(false);
  const [newScreenshotUrl, setNewScreenshotUrl] = useState("");
  const [showAddScreenshot, setShowAddScreenshot] = useState(false);

  useEffect(() => {
    if (episode?.screenshots && episode.screenshots.length > 0) {
      setActiveScreenshots(episode.screenshots);
    } else if (movie?.screenshots && movie.screenshots.length > 0) {
      setActiveScreenshots(movie.screenshots);
    } else {
      setActiveScreenshots([]);
    }
  }, [movie, episode]);

  const handleDeleteScreenshot = async (idxToRemove: number) => {
    if (!movie) return;
    const remaining = activeScreenshots.filter((_, i) => i !== idxToRemove);
    try {
      setIsUpdatingScreenshot(true);
      if (episode) {
        await api.movies.updateEpisode(movie._id, episode._id, { screenshots: remaining });
        episode.screenshots = remaining;
      } else {
        await api.movies.update(movie._id, { screenshots: remaining });
        movie.screenshots = remaining;
      }
      setActiveScreenshots(remaining);
      showToastSuccess("Screenshot Deleted", "The preview screenshot was removed successfully.");
    } catch (err: any) {
      showToastError("Delete Failed", err?.message || "Could not delete screenshot.");
    } finally {
      setIsUpdatingScreenshot(false);
    }
  };

  const handleSetAsPoster = async (url: string) => {
    if (!movie) return;
    try {
      setIsUpdatingScreenshot(true);
      await api.movies.update(movie._id, { poster: url });
      movie.poster = url;
      showToastSuccess("Poster Updated", "This screenshot is now set as the movie poster!");
    } catch (err: any) {
      showToastError("Update Failed", err?.message || "Could not update poster.");
    } finally {
      setIsUpdatingScreenshot(false);
    }
  };

  const handleSetAsBackdrop = async (url: string) => {
    if (!movie) return;
    try {
      setIsUpdatingScreenshot(true);
      await api.movies.update(movie._id, { backdrop: url });
      movie.backdrop = url;
      showToastSuccess("Backdrop Updated", "This screenshot is now set as the movie backdrop!");
    } catch (err: any) {
      showToastError("Update Failed", err?.message || "Could not update backdrop.");
    } finally {
      setIsUpdatingScreenshot(false);
    }
  };

  const [isCapturing, setIsCapturing] = useState(false);

  const handleAutoCapture = async () => {
    if (!movie) return;
    try {
      setIsCapturing(true);
      const res = await api.movies.captureScreenshots(
        movie._id,
        episode?.seasonNumber,
        episode?.episodeNumber
      );
      if (res.data?.screenshots && res.data.screenshots.length > 0) {
        setActiveScreenshots(res.data.screenshots);
        if (episode) {
          episode.screenshots = res.data.screenshots;
        } else {
          movie.screenshots = res.data.screenshots;
        }
        showToastSuccess("Screenshots Extracted", "4 preview frames successfully extracted from video!");
      }
    } catch (err: any) {
      showToastError("Extraction Failed", err?.message || "Could not extract screenshots.");
    } finally {
      setIsCapturing(false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !movie) return;

    try {
      setIsUploadingFile(true);
      const res = await api.movies.uploadScreenshot(movie._id, file, {
        seasonNumber: episode?.seasonNumber,
        episodeNumber: episode?.episodeNumber,
      });

      if (res.data?.screenshots) {
        setActiveScreenshots(res.data.screenshots);
        if (episode) {
          episode.screenshots = res.data.screenshots;
        } else {
          movie.screenshots = res.data.screenshots;
        }
      } else if (res.data?.url) {
        setActiveScreenshots((prev) => [...prev, res.data.url]);
      }

      e.target.value = "";
      showToastSuccess("Screenshot Uploaded", "Custom screenshot image uploaded to R2 successfully!");
    } catch (err: any) {
      showToastError("Upload Failed", err?.message || "Could not upload screenshot file.");
    } finally {
      setIsUploadingFile(false);
    }
  };

  const handleAddScreenshot = async () => {
    if (!movie || !newScreenshotUrl.trim()) return;
    const updated = [...activeScreenshots, newScreenshotUrl.trim()];
    try {
      setIsUpdatingScreenshot(true);
      if (episode) {
        await api.movies.updateEpisode(movie._id, episode._id, { screenshots: updated });
        episode.screenshots = updated;
      } else {
        await api.movies.update(movie._id, { screenshots: updated });
        movie.screenshots = updated;
      }
      setActiveScreenshots(updated);
      setNewScreenshotUrl("");
      setShowAddScreenshot(false);
      showToastSuccess("Screenshot Added", "New screenshot URL was added successfully.");
    } catch (err: any) {
      showToastError("Add Failed", err?.message || "Could not add screenshot.");
    } finally {
      setIsUpdatingScreenshot(false);
    }
  };

  useEffect(() => {
    if (movie && isOpen) {
      setLoading(true);
      setError(null);

      const fetchPromise =
        episode && movie.type === "SERIES"
          ? api.movies.getEpisodePlayback(movie._id, episode.seasonNumber, episode.episodeNumber)
          : api.movies.getPlayback(movie._id);

      fetchPromise
        .then((res) => {
          setPlaybackData(res.data);
        })
        .catch((err) => {
          setError(err.message || "Failed to retrieve playback stream");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setPlaybackData(null);
      setError(null);
    }
  }, [movie, episode, isOpen]);

  const handleCopyHls = () => {
    if (playbackData?.url) {
      navigator.clipboard.writeText(playbackData.url);
      setCopiedHls(true);
      setTimeout(() => setCopiedHls(false), 2500);
    }
  };

  const handleCopySource = () => {
    if (playbackData?.sourceUrl) {
      navigator.clipboard.writeText(playbackData.sourceUrl);
      setCopiedSource(true);
      setTimeout(() => setCopiedSource(false), 2500);
    }
  };

  if (!movie) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={movie.title}
      subtitle="HLS Adaptive Bitrate Stream Inspector & Multi-Quality Player"
      maxWidth="4xl"
    >
      <div className="space-y-6">
        {/* Stream URL Banner */}
        {loading ? (
          <div className="p-8 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Resolving secure HLS CDN endpoint...</p>
          </div>
        ) : error ? (
          <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-3">
            <Info className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        ) : playbackData ? (
          <>
            {/* Premium Custom HLS Player */}
            {(() => {
              const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";
              const streamProxyUrl = playbackData.proxyUrl
                ? playbackData.proxyUrl.startsWith("http")
                  ? playbackData.proxyUrl
                  : `${apiBase.replace(/\/api\/?$/, "")}${playbackData.proxyUrl}`
                : `${apiBase}/movies/${movie._id}/stream/master.m3u8`;

              return (
                <CustomHlsPlayer
                  src={streamProxyUrl}
                  directSrc={playbackData.url}
                  poster={movie.backdrop || movie.poster}
                  title={movie.title}
                  autoPlay={false}
                />
              );
            })()}

            {/* URL Boxes Section */}
            <div className="space-y-3">
              {/* Public Direct Source Video URL Box */}
              {playbackData.sourceUrl && (
                <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30 uppercase">
                        Public Development URL
                      </span>
                      <span className="text-xs font-semibold text-slate-200">
                        Direct Video File URL (MP4 / Source)
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <a
                        href={playbackData.sourceUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 transition-all"
                        title="Open file in new tab"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        <span>Open</span>
                      </a>
                      <button
                        onClick={handleCopySource}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white shadow transition-all cursor-pointer"
                      >
                        {copiedSource ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedSource ? "Copied Link" : "Copy Video Link"}</span>
                      </button>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-purple-300 break-all select-all">
                    {playbackData.sourceUrl}
                  </div>
                </div>
              )}

              {/* HLS Master Playlist URL */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                      HLS Adaptive Stream
                    </span>
                    <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                      <Play className="w-3.5 h-3.5 text-emerald-400 fill-current" />
                      Master Playlist URL (<code className="text-emerald-400 font-mono">master.m3u8</code>)
                    </span>
                  </div>

                  <button
                    onClick={handleCopyHls}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow transition-all cursor-pointer"
                  >
                    {copiedHls ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedHls ? "Copied Link" : "Copy Stream URL"}</span>
                  </button>
                </div>

                <div className="p-2.5 rounded-lg bg-black/60 border border-slate-800 font-mono text-xs text-emerald-300 break-all select-all">
                  {playbackData.url}
                </div>
              </div>
            </div>

            {/* Preview Screenshots Manager (View, Add, Delete, Set Poster/Backdrop) */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Preview Screenshots ({activeScreenshots.length})
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingFile}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-emerald-600/20 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-600/30 transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Upload screenshot from device"
                  >
                    <UploadCloud className="w-3.5 h-3.5" />
                    <span>{isUploadingFile ? "Uploading..." : "Upload File"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddScreenshot(!showAddScreenshot)}
                    className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-600/30 transition-all flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add URL</span>
                  </button>
                </div>
              </div>

              {/* Add Screenshot URL Input */}
              {showAddScreenshot && (
                <div className="flex gap-2 p-2.5 rounded-lg bg-slate-950 border border-indigo-500/30">
                  <input
                    type="url"
                    placeholder="Enter image URL (https://...)"
                    value={newScreenshotUrl}
                    onChange={(e) => setNewScreenshotUrl(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-900 border border-slate-700 rounded text-xs text-slate-200 focus:outline-none focus:border-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddScreenshot}
                    disabled={isUpdatingScreenshot || !newScreenshotUrl.trim()}
                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white rounded text-xs font-semibold cursor-pointer"
                  >
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddScreenshot(false)}
                    className="px-2 py-1.5 text-xs text-slate-400 hover:text-slate-200"
                  >
                    Cancel
                  </button>
                </div>
              )}

              {activeScreenshots.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {activeScreenshots.map((imgUrl, idx) => (
                    <div
                      key={idx}
                      className="group relative rounded-lg overflow-hidden border border-slate-800 bg-slate-950 aspect-video shadow-md block"
                    >
                      <img
                        src={resolveImageUrl(imgUrl, movie?._id)}
                        alt={`Screenshot frame ${idx + 1}`}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          const target = e.currentTarget;
                          const filename = imgUrl.split("/").pop() || `screenshot_${idx + 1}.jpg`;
                          const apiBase = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";
                          const proxyUrl = episode && movie?._id
                            ? `${apiBase}/movies/${movie._id}/seasons/${episode.seasonNumber}/episodes/${episode.episodeNumber}/screenshots/${filename}`
                            : movie?._id
                            ? `${apiBase}/movies/${movie._id}/screenshots/${filename}`
                            : "";
                          if (proxyUrl && target.src !== proxyUrl) {
                            target.src = proxyUrl;
                          }
                        }}
                      />

                      {/* Frame index badge */}
                      <span className="absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-mono bg-black/75 text-slate-300 border border-white/10 z-10">
                        #{idx + 1}
                      </span>

                      {/* Top Action buttons */}
                      <div className="absolute top-1 right-1 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/75 p-0.5 rounded backdrop-blur-xs z-10">
                        <button
                          type="button"
                          onClick={() => handleSetAsPoster(imgUrl)}
                          title="Set as Movie Poster"
                          disabled={isUpdatingScreenshot}
                          className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-indigo-600/90 hover:bg-indigo-600 text-white transition-all cursor-pointer"
                        >
                          Poster
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetAsBackdrop(imgUrl)}
                          title="Set as Movie Backdrop"
                          disabled={isUpdatingScreenshot}
                          className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-purple-600/90 hover:bg-purple-600 text-white transition-all cursor-pointer"
                        >
                          Backdrop
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteScreenshot(idx)}
                          title="Delete screenshot"
                          disabled={isUpdatingScreenshot}
                          className="p-1 text-rose-400 hover:text-rose-300 hover:bg-rose-500/20 rounded transition-all cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>

                      {/* Bottom view link */}
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-between p-1.5">
                        <a
                          href={resolveImageUrl(imgUrl, movie?._id)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-white font-medium flex items-center gap-1 hover:text-indigo-300"
                        >
                          <ExternalLink className="w-3 h-3 text-indigo-300" /> Open Full
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center rounded-xl bg-slate-950/60 border border-dashed border-slate-800 space-y-2.5">
                  <p className="text-xs text-slate-400">
                    No preview screenshots found for this video.
                  </p>
                  <button
                    type="button"
                    onClick={handleAutoCapture}
                    disabled={isCapturing}
                    className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 mx-auto transition-all cursor-pointer shadow-md"
                  >
                    <Sparkles className={`w-3.5 h-3.5 ${isCapturing ? "animate-spin" : ""}`} />
                    <span>{isCapturing ? "Extracting 4 Frames with FFmpeg..." : "Extract 4 Screenshots Now"}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Stream Specs Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Resolution</span>
                <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                  {movie.resolution || playbackData.resolution || "1080p Multi"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Video Codec</span>
                <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                  {movie.videoCodec || "H.264 (AVC)"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Audio Codec</span>
                <div className="text-sm font-bold text-slate-200 mt-1 font-mono">
                  {movie.audioCodec || "AAC Stereo"}
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800">
                <span className="text-[11px] text-slate-400 uppercase font-medium">Protocols</span>
                <div className="text-sm font-bold text-emerald-400 mt-1 font-mono">
                  HLS v4 / M3U8
                </div>
              </div>
            </div>

            {/* Security Assurance */}
            <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/20 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
              <p className="text-xs text-emerald-300/90 leading-relaxed">
                Zero-secret exposure: Cloudflare R2 bucket credentials and S3 secret keys are never revealed in public streaming URLs or API responses.
              </p>
            </div>
          </>
        ) : null}
      </div>
    </Modal>
  );
}
