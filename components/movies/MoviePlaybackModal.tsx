"use client";

import React, { useEffect, useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { IMovie, IEpisode, PlaybackResponse } from "@/lib/types";
import { api } from "@/lib/api-client";
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
