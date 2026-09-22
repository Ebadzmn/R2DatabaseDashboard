"use client";

import React, { useEffect, useRef, useState } from "react";
import Hls from "hls.js";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  Settings,
  RotateCcw,
  RotateCw,
  Check,
  Sparkles,
  Layers,
  Gauge,
  Sliders,
} from "lucide-react";

interface QualityLevel {
  id: number;
  height: number;
  width: number;
  bitrate: number;
  label: string;
}

interface CustomHlsPlayerProps {
  src: string;
  directSrc?: string;
  poster?: string;
  title?: string;
  autoPlay?: boolean;
}

export function CustomHlsPlayer({
  src,
  directSrc,
  poster,
  title,
  autoPlay = false,
}: CustomHlsPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const hlsRef = useRef<Hls | null>(null);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const playPromiseRef = useRef<Promise<void> | null>(null);

  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [isSpeedMenuOpen, setIsSpeedMenuOpen] = useState(false);
  const [isQualityMenuOpen, setIsQualityMenuOpen] = useState(false);

  // HLS Qualities
  const [qualityLevels, setQualityLevels] = useState<QualityLevel[]>([]);
  const [currentQuality, setCurrentQuality] = useState<number>(-1); // -1 = Auto
  const [autoQualityName, setAutoQualityName] = useState<string>("Auto");
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format time (HH:MM:SS or MM:SS)
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return "00:00";
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
    }
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  // Helper to extract levels from Hls instance
  const syncLevels = (hls: Hls) => {
    if (hls.levels && hls.levels.length > 0) {
      const levels: QualityLevel[] = hls.levels.map((level, idx) => ({
        id: idx,
        height: level.height,
        width: level.width,
        bitrate: level.bitrate,
        label: level.height ? `${level.height}p` : `Stream ${idx + 1}`,
      }));
      // Sort descending by height / bitrate
      levels.sort((a, b) => (b.height || b.bitrate) - (a.height || a.bitrate));
      setQualityLevels(levels);
    }
  };

  // Initialize Hls.js or native HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    setLoading(true);
    setErrorMessage(null);
    setQualityLevels([]);
    setCurrentQuality(-1);

    if (Hls.isSupported()) {
      if (hlsRef.current) {
        hlsRef.current.destroy();
      }

      const hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        backBufferLength: 60,
      });

      hlsRef.current = hls;
      hls.loadSource(src);
      hls.attachMedia(video);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);
        syncLevels(hls);
      });

      hls.on(Hls.Events.LEVEL_LOADED, () => {
        setLoading(false);
        syncLevels(hls);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        const lvl = hls.levels[data.level];
        if (lvl) {
          setAutoQualityName(lvl.height ? `${lvl.height}p` : "Auto");
        }
      });

      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) {
          switch (data.type) {
            case Hls.ErrorTypes.NETWORK_ERROR:
              // If proxy failed, try directSrc if available
              if (directSrc && hls.url !== directSrc) {
                hls.loadSource(directSrc);
              } else {
                hls.startLoad();
              }
              break;
            case Hls.ErrorTypes.MEDIA_ERROR:
              hls.recoverMediaError();
              break;
            default:
              hls.destroy();
              setErrorMessage("Fatal streaming playback error. Please try again.");
              break;
          }
        }
      });

      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Native Apple Safari HLS support
      video.src = src;
      const onLoaded = () => setLoading(false);
      video.addEventListener("loadedmetadata", onLoaded);
      return () => {
        video.removeEventListener("loadedmetadata", onLoaded);
      };
    } else {
      setErrorMessage("HLS playback is not supported in this browser.");
      setLoading(false);
    }
  }, [src, directSrc]);

  // Video Event Handlers - Safe Play/Pause handling preventing AbortError
  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      try {
        const promise = video.play();
        playPromiseRef.current = promise;
        await promise;
        setIsPlaying(true);
      } catch (err: any) {
        if (err.name !== "AbortError") {
          console.error("Playback start error:", err);
        }
      } finally {
        playPromiseRef.current = null;
      }
    } else {
      if (playPromiseRef.current) {
        // Wait for active play promise to resolve before pausing
        try {
          await playPromiseRef.current;
        } catch {
          // ignore aborted requests
        }
      }
      video.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video) return;
    setCurrentTime(video.currentTime);
    setDuration(video.duration || 0);

    if (video.buffered.length > 0) {
      const end = video.buffered.end(video.buffered.length - 1);
      setBuffered(end);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const time = parseFloat(e.target.value);
    video.currentTime = time;
    setCurrentTime(time);
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current;
    if (!video) return;
    const val = parseFloat(e.target.value);
    video.volume = val;
    setVolume(val);
    if (val === 0) {
      setIsMuted(true);
      video.muted = true;
    } else if (isMuted) {
      setIsMuted(false);
      video.muted = false;
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      setIsMuted(false);
      video.volume = volume || 0.5;
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      container.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const skipTime = (offset: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.min(Math.max(video.currentTime + offset, 0), duration || 0);
  };

  const handleSpeedChange = (speed: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.playbackRate = speed;
    setPlaybackSpeed(speed);
    setIsSpeedMenuOpen(false);
  };

  const handleQualityChange = (levelId: number) => {
    if (!hlsRef.current) return;
    // levelId -1 = Auto
    hlsRef.current.currentLevel = levelId;
    setCurrentQuality(levelId);
    setIsQualityMenuOpen(false);
  };

  // Activity mouse listener for hiding controls
  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    if (isPlaying) {
      controlsTimeoutRef.current = setTimeout(() => {
        if (!isQualityMenuOpen && !isSpeedMenuOpen) {
          setShowControls(false);
        }
      }, 3500);
    }
  };

  // Percent for seek bar
  const currentPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const bufferPercent = duration > 0 ? (buffered / duration) * 100 : 0;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => isPlaying && setShowControls(false)}
      className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden group select-none shadow-2xl border border-slate-800/80 font-sans"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        poster={poster}
        crossOrigin="anonymous"
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={() => {
          if (videoRef.current) setDuration(videoRef.current.duration);
        }}
        onClick={handlePlayPause}
        className="w-full h-full object-contain cursor-pointer"
        playsInline
      />

      {/* Loading Spinner */}
      {loading && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 backdrop-blur-xs z-20 pointer-events-none transition-all">
          <div className="relative">
            <div className="w-14 h-14 rounded-full border-3 border-indigo-500/20 border-t-indigo-500 animate-spin" />
            <Sparkles className="w-5 h-5 text-indigo-400 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-xs font-medium text-slate-300 mt-3 tracking-wide">
            Loading HLS Stream & Renditions...
          </p>
        </div>
      )}

      {/* Error Overlay */}
      {errorMessage && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/90 z-30 p-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
            <Layers className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-semibold text-slate-200">Stream Playback Unavailable</h4>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">{errorMessage}</p>
        </div>
      )}

      {/* Top Overlay Header (Title & Active Quality Badge) */}
      <div
        className={`absolute top-0 inset-x-0 p-4 bg-linear-to-b from-black/80 via-black/40 to-transparent z-20 flex items-center justify-between transition-opacity duration-300 pointer-events-none ${
          showControls ? "opacity-100" : "opacity-0"
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-auto">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
          <h3 className="text-sm font-semibold text-slate-100 drop-shadow truncate max-w-[280px] sm:max-w-md">
            {title || "Live Adaptive Stream"}
          </h3>
        </div>

        {qualityLevels.length > 0 && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-medium text-slate-200 pointer-events-auto shadow-md">
            <Gauge className="w-3 h-3 text-indigo-400" />
            <span>
              {currentQuality === -1
                ? `Auto (${autoQualityName})`
                : qualityLevels.find((q) => q.id === currentQuality)?.label || "Auto"}
            </span>
          </div>
        )}
      </div>

      {/* Center Big Play/Pause Splash on Click */}
      {!isPlaying && !loading && (
        <button
          onClick={handlePlayPause}
          className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/90 hover:bg-indigo-500 hover:scale-110 active:scale-95 text-white flex items-center justify-center shadow-2xl backdrop-blur-md border border-indigo-400/40 z-10 transition-all cursor-pointer"
        >
          <Play className="w-7 h-7 fill-current ml-1" />
        </button>
      )}

      {/* Bottom Controls Bar */}
      <div
        className={`absolute bottom-0 inset-x-0 pt-8 pb-3 px-4 bg-linear-to-t from-black/95 via-black/70 to-transparent z-20 transition-all duration-300 ${
          showControls ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
        }`}
      >
        {/* Progress / Seek Bar with Glow */}
        <div className="relative mb-3 flex items-center group/timeline">
          {/* Background Rail */}
          <div className="absolute inset-x-0 h-1.5 rounded-full bg-slate-700/60 overflow-hidden">
            {/* Buffered */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-slate-500/40 transition-all"
              style={{ width: `${bufferPercent}%` }}
            />
            {/* Played */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-linear-to-r from-indigo-500 to-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.8)]"
              style={{ width: `${currentPercent}%` }}
            />
          </div>

          {/* Interactive Range Input */}
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-4 opacity-0 cursor-pointer z-10"
          />

          {/* Scrubber Knob */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 bg-white rounded-full shadow-lg border-2 border-indigo-600 pointer-events-none transition-transform scale-0 group-hover/timeline:scale-100"
            style={{ left: `${currentPercent}%` }}
          />
        </div>

        {/* Controls Layout */}
        <div className="flex items-center justify-between gap-3 text-slate-200">
          {/* Left Controls: Play, Skips, Volume, Time */}
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handlePlayPause}
              className="p-1.5 rounded-lg hover:bg-white/10 text-white transition-colors cursor-pointer"
              title={isPlaying ? "Pause (Space)" : "Play (Space)"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-current" /> : <Play className="w-5 h-5 fill-current" />}
            </button>

            {/* Skip -10s */}
            <button
              onClick={() => skipTime(-10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Rewind 10s"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Skip +10s */}
            <button
              onClick={() => skipTime(10)}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title="Fast Forward 10s"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            {/* Volume Slider & Toggle */}
            <div className="flex items-center gap-2 group/volume">
              <button
                onClick={toggleMute}
                className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-5 h-5 text-rose-400" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </button>

              <div className="w-0 overflow-hidden group-hover/volume:w-20 transition-all duration-200 flex items-center">
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="w-18 h-1 accent-indigo-500 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            {/* Time Stamp */}
            <div className="text-xs font-mono font-medium text-slate-300 select-none">
              <span>{formatTime(currentTime)}</span>
              <span className="text-slate-600 mx-1">/</span>
              <span className="text-slate-500">{formatTime(duration)}</span>
            </div>
          </div>

          {/* Right Controls: Quality Selector, Speed, Fullscreen */}
          <div className="flex items-center gap-2 sm:gap-3 relative">
            {/* Speed Selector Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsSpeedMenuOpen(!isSpeedMenuOpen);
                  setIsQualityMenuOpen(false);
                }}
                className={`px-2 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                  playbackSpeed !== 1
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-300 border-slate-700/60"
                }`}
                title="Playback Speed"
              >
                {playbackSpeed}x
              </button>

              {isSpeedMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-28 bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl p-1.5 z-30 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                    Speed
                  </div>
                  {[0.5, 0.75, 1, 1.25, 1.5, 2].map((spd) => (
                    <button
                      key={spd}
                      onClick={() => handleSpeedChange(spd)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                        playbackSpeed === spd
                          ? "bg-indigo-600/20 text-indigo-400 font-semibold"
                          : "text-slate-300 hover:bg-slate-800/80"
                      }`}
                    >
                      <span>{spd === 1 ? "Normal" : `${spd}x`}</span>
                      {playbackSpeed === spd && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Resolution / Quality Selector Menu */}
            <div className="relative">
              <button
                onClick={() => {
                  setIsQualityMenuOpen(!isQualityMenuOpen);
                  setIsSpeedMenuOpen(false);
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold font-mono border transition-all cursor-pointer ${
                  currentQuality !== -1
                    ? "bg-indigo-600 text-white border-indigo-500"
                    : "bg-slate-900/80 hover:bg-slate-800 text-slate-200 border-slate-700/60"
                }`}
                title="Stream Quality"
              >
                <Sliders className="w-3.5 h-3.5 text-indigo-400" />
                <span>
                  {currentQuality === -1
                    ? `Auto (${autoQualityName})`
                    : qualityLevels.find((q) => q.id === currentQuality)?.label || "Auto"}
                </span>
              </button>

              {isQualityMenuOpen && (
                <div className="absolute bottom-full right-0 mb-3 w-40 bg-slate-950/95 backdrop-blur-md rounded-xl border border-slate-800 shadow-2xl p-1.5 z-30 space-y-0.5">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase text-slate-400 tracking-wider flex items-center justify-between">
                    <span>Quality</span>
                    <span className="text-indigo-400 text-[9px] font-bold">HLS ABR</span>
                  </div>

                  {/* Auto Rendition */}
                  <button
                    onClick={() => handleQualityChange(-1)}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                      currentQuality === -1
                        ? "bg-indigo-600/20 text-indigo-400 font-bold"
                        : "text-slate-300 hover:bg-slate-800/80"
                    }`}
                  >
                    <div className="flex flex-col text-left">
                      <span>Auto</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        Adaptive ({autoQualityName})
                      </span>
                    </div>
                    {currentQuality === -1 && <Check className="w-3.5 h-3.5" />}
                  </button>

                  {/* Individual Rendition levels */}
                  {qualityLevels.length > 0 ? (
                    qualityLevels.map((lvl) => (
                      <button
                        key={lvl.id}
                        onClick={() => handleQualityChange(lvl.id)}
                        className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-lg transition-colors cursor-pointer ${
                          currentQuality === lvl.id
                            ? "bg-indigo-600/20 text-indigo-400 font-bold"
                            : "text-slate-300 hover:bg-slate-800/80"
                        }`}
                      >
                        <div className="flex flex-col text-left">
                          <span className="font-medium">{lvl.label}</span>
                          {lvl.bitrate > 0 && (
                            <span className="text-[10px] text-slate-500 font-normal">
                              {Math.round(lvl.bitrate / 1000)} kbps
                            </span>
                          )}
                        </div>
                        {currentQuality === lvl.id && <Check className="w-3.5 h-3.5" />}
                      </button>
                    ))
                  ) : (
                    <div className="px-2.5 py-2 text-[11px] text-slate-400 text-center">
                      Probing renditions...
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 hover:text-white transition-colors cursor-pointer"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
