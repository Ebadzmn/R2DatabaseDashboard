"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api-client";
import { ISystemStatus, IAppUpdateConfig } from "@/lib/types";
import {
  X,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Link as LinkIcon,
  Plus,
  Trash2,
  ShieldAlert,
  Smartphone,
  ExternalLink,
} from "lucide-react";

interface AppUpdateControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  systemStatus: ISystemStatus | null;
  onStatusUpdated: (status: ISystemStatus) => void;
}

export function AppUpdateControlModal({
  isOpen,
  onClose,
  systemStatus,
  onStatusUpdated,
}: AppUpdateControlModalProps) {
  const currentUpdate = systemStatus?.appUpdate;

  const [isUpdateActive, setIsUpdateActive] = useState(false);
  const [isForceUpdate, setIsForceUpdate] = useState(false);
  const [latestVersion, setLatestVersion] = useState("1.0.0");
  const [minVersion, setMinVersion] = useState("1.0.0");
  const [title, setTitle] = useState("New Update Available!");
  const [message, setMessage] = useState(
    "A new version of CineCore is available with performance improvements and new features."
  );
  const [releaseNotes, setReleaseNotes] = useState<string[]>([
    "Performance optimizations and smoother playback",
    "Enhanced user interface and community features",
    "Bug fixes and security updates",
  ]);
  const [newNote, setNewNote] = useState("");
  const [downloadUrl, setDownloadUrl] = useState("https://cinecore.io/download/cinecore.apk");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (currentUpdate) {
      setIsUpdateActive(Boolean(currentUpdate.isUpdateActive));
      setIsForceUpdate(Boolean(currentUpdate.isForceUpdate));
      setLatestVersion(currentUpdate.latestVersion || "1.0.0");
      setMinVersion(currentUpdate.minVersion || "1.0.0");
      setTitle(currentUpdate.title || "New Update Available!");
      setMessage(
        currentUpdate.message ||
          "A new version of CineCore is available with performance improvements and new features."
      );
      setReleaseNotes(
        Array.isArray(currentUpdate.releaseNotes) && currentUpdate.releaseNotes.length > 0
          ? currentUpdate.releaseNotes
          : [
              "Performance optimizations and smoother playback",
              "Enhanced user interface and community features",
              "Bug fixes and security updates",
            ]
      );
      setDownloadUrl(currentUpdate.downloadUrl || "https://cinecore.io/download/cinecore.apk");
    }
  }, [currentUpdate, isOpen]);

  if (!isOpen) return null;

  const handleAddNote = () => {
    if (newNote.trim()) {
      setReleaseNotes([...releaseNotes, newNote.trim()]);
      setNewNote("");
    }
  };

  const handleRemoveNote = (index: number) => {
    setReleaseNotes(releaseNotes.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const payload: Partial<IAppUpdateConfig> = {
        isUpdateActive,
        isForceUpdate,
        latestVersion: latestVersion.trim(),
        minVersion: minVersion.trim(),
        title: title.trim(),
        message: message.trim(),
        releaseNotes,
        downloadUrl: downloadUrl.trim(),
      };

      const res = await api.system.updateAppUpdate(payload);
      onStatusUpdated(res.data);
      setSuccessMsg("App update configuration successfully broadcasted!");
      setTimeout(() => {
        onClose();
      }, 1200);
    } catch (err: any) {
      setErrorMsg(err?.message || "Failed to save update configuration.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-[#0b0e17] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-800 sticky top-0 bg-[#0b0e17]/95 backdrop-blur-sm z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-500 to-amber-500 flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
              <UploadCloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
                App Update & Version Control
                {isUpdateActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/30">
                    Live Announcement
                  </span>
                )}
              </h2>
              <p className="text-xs text-slate-400">
                Push update alerts, release notes, and direct APK download links to mobile users
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSave} className="p-6 space-y-6">
          {errorMsg && (
            <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-400 text-xs flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Master Toggle */}
          <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/60 flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="text-sm font-semibold text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-400" />
                Enable App Update Prompt
              </div>
              <p className="text-xs text-slate-400">
                When active, users with older versions will see the update notification on app launch
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={isUpdateActive}
                onChange={(e) => setIsUpdateActive(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-gradient-to-r peer-checked:from-rose-500 peer-checked:to-red-600"></div>
            </label>
          </div>

          {/* Required vs Non-Required (Force Update) */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              Update Enforcement Policy
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setIsForceUpdate(false)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  !isForceUpdate
                    ? "bg-rose-500/10 border-rose-500/50 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-emerald-400" />
                    Non-Required (Optional)
                  </span>
                  {!isForceUpdate && <CheckCircle2 className="w-4 h-4 text-rose-400" />}
                </div>
                <p className="text-xs text-slate-400">
                  User can dismiss with &quot;Later / Skip&quot; and continue using the app normally.
                </p>
              </div>

              <div
                onClick={() => setIsForceUpdate(true)}
                className={`cursor-pointer p-4 rounded-xl border transition-all ${
                  isForceUpdate
                    ? "bg-amber-500/10 border-amber-500/50 text-white"
                    : "bg-slate-900/40 border-slate-800 text-slate-400 hover:border-slate-700"
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold text-sm flex items-center gap-2">
                    <ShieldAlert className="w-4 h-4 text-amber-400" />
                    Required (Force Update)
                  </span>
                  {isForceUpdate && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
                </div>
                <p className="text-xs text-slate-400">
                  Blocks app completely with a mandatory update screen until they install the APK.
                </p>
              </div>
            </div>
          </div>

          {/* Version Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Target / Latest Version
              </label>
              <input
                type="text"
                value={latestVersion}
                onChange={(e) => setLatestVersion(e.target.value)}
                placeholder="e.g. 1.1.0"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Users below this version will be prompted.</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Minimum Supported Version
              </label>
              <input
                type="text"
                value={minVersion}
                onChange={(e) => setMinVersion(e.target.value)}
                placeholder="e.g. 1.0.0"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 font-mono"
              />
              <p className="text-[11px] text-slate-500 mt-1">Any version below this is strictly forced.</p>
            </div>
          </div>

          {/* Download URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              Direct Download Link (APK or Web Page)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <LinkIcon className="absolute left-3.5 top-3 w-4 h-4 text-slate-500" />
                <input
                  type="url"
                  value={downloadUrl}
                  onChange={(e) => setDownloadUrl(e.target.value)}
                  placeholder="https://cinecore.io/download/cinecore-v1.1.0.apk"
                  required
                  className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
                />
              </div>
              {downloadUrl && (
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
                  title="Test Link"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Test Link
                </a>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Direct APK link, Cloudflare R2 bucket download, or Play Store / website link.
            </p>
          </div>

          {/* Title & Description */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Update Dialog Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="New Update Available!"
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                Message / Overview
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={2}
                placeholder="Explain the importance of this update..."
                required
                className="w-full bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500 resize-none"
              />
            </div>
          </div>

          {/* Release Notes list */}
          <div>
            <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
              What&apos;s New / Release Notes
            </label>
            <div className="space-y-2 mb-3">
              {releaseNotes.map((note, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2.5 bg-slate-900/80 border border-slate-800 rounded-lg text-xs text-slate-200 group"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                    <span>{note}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveNote(index)}
                    className="text-slate-500 hover:text-rose-400 p-1 rounded transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddNote();
                  }
                }}
                placeholder="Add a new feature note (e.g. Ultra HD 4K player enhancements)..."
                className="flex-1 bg-slate-900/80 border border-slate-700/80 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-rose-500"
              />
              <button
                type="button"
                onClick={handleAddNote}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Note
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-3 sticky bottom-0 bg-[#0b0e17] py-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-5 py-2.5 rounded-xl text-xs font-bold bg-gradient-to-r from-rose-600 to-red-600 hover:from-rose-500 hover:to-red-500 text-white shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <UploadCloud className="w-4 h-4" />
                  Save & Broadcast Update
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

