"use client";

import React, { useState, useEffect } from "react";
import { ISystemStatus } from "@/lib/types";
import { api } from "@/lib/api-client";
import { useToast } from "@/components/ui/Toast";
import {
  Wrench,
  Power,
  Clock,
  AlertTriangle,
  CheckCircle2,
  X,
  Mail,
  ShieldAlert,
} from "lucide-react";

interface MaintenanceControlModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStatusChanged?: (newStatus: ISystemStatus) => void;
}

export function MaintenanceControlModal({
  isOpen,
  onClose,
  onStatusChanged,
}: MaintenanceControlModalProps) {
  const { success, error } = useToast();

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isMaintenance, setIsMaintenance] = useState(false);
  const [title, setTitle] = useState("Under Scheduled Maintenance");
  const [message, setMessage] = useState(
    "CineCore is currently undergoing scheduled maintenance to upgrade streaming servers. Please check back shortly."
  );
  const [estimatedDowntime, setEstimatedDowntime] = useState("");
  const [supportContact, setSupportContact] = useState("support@cinecore.io");

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      api.system
        .getStatus()
        .then((res) => {
          setIsMaintenance(Boolean(res.data.isMaintenance));
          setTitle(res.data.title || "Under Scheduled Maintenance");
          setMessage(
            res.data.message ||
              "CineCore is currently undergoing scheduled maintenance to upgrade streaming servers. Please check back shortly."
          );
          setEstimatedDowntime(res.data.estimatedDowntime || "");
          setSupportContact(res.data.supportContact || "support@cinecore.io");
        })
        .catch((err) => {
          error("Error", "Failed to fetch current maintenance status: " + err.message);
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, error]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const res = await api.system.updateStatus({
        isMaintenance,
        title: title.trim(),
        message: message.trim(),
        estimatedDowntime: estimatedDowntime.trim(),
        supportContact: supportContact.trim(),
      });

      success(
        isMaintenance ? "App Maintenance Activated" : "App Brought Online",
        isMaintenance
          ? "The mobile app is now in maintenance mode. Users will see the maintenance screen."
          : "The mobile app is now live and fully operational for users."
      );

      onStatusChanged?.(res.data);
      onClose();
    } catch (err: any) {
      error("Update Failed", err.message || "Failed to update maintenance settings");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0e1320] border border-slate-800 rounded-3xl shadow-2xl shadow-black/90 overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-slate-800/80 bg-slate-900/40">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-2xl ${
                isMaintenance
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/30"
                  : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/30"
              }`}
            >
              {isMaintenance ? <Wrench className="w-5 h-5" /> : <Power className="w-5 h-5" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                Mobile App Control & Maintenance
              </h3>
              <p className="text-xs text-slate-400">
                Switch app online or trigger maintenance screen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-400">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-xs">Loading app configuration...</p>
          </div>
        ) : (
          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Master Toggle Banner */}
            <div
              className={`p-4 rounded-2xl border transition-all ${
                isMaintenance
                  ? "bg-rose-950/20 border-rose-500/40"
                  : "bg-emerald-950/20 border-emerald-500/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-3.5 h-3.5 rounded-full ${
                      isMaintenance ? "bg-rose-500 animate-pulse" : "bg-emerald-500"
                    }`}
                  />
                  <div>
                    <h4 className="text-sm font-bold text-white">
                      {isMaintenance ? "App Status: Maintenance Mode (OFF)" : "App Status: Live & Online (ON)"}
                    </h4>
                    <p className="text-xs text-slate-300">
                      {isMaintenance
                        ? "Users are currently blocked by the maintenance screen on mobile."
                        : "All users can browse, stream, and use the mobile app freely."}
                    </p>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <button
                  type="button"
                  onClick={() => setIsMaintenance(!isMaintenance)}
                  className={`relative inline-flex h-7 w-14 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    isMaintenance ? "bg-rose-600" : "bg-emerald-600"
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                      isMaintenance ? "translate-x-7" : "translate-x-0"
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Maintenance Details */}
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Maintenance Screen Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Under Scheduled Maintenance"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Maintenance Message (English)
                </label>
                <textarea
                  required
                  rows={3}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Explain why the app is temporarily down and when to return..."
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Estimated Downtime</span>
                  </label>
                  <input
                    type="text"
                    value={estimatedDowntime}
                    onChange={(e) => setEstimatedDowntime(e.target.value)}
                    placeholder="e.g. 45 Minutes, 2 Hours"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex items-center gap-1.5">
                    <Mail className="w-3.5 h-3.5 text-slate-400" />
                    <span>Support Contact</span>
                  </label>
                  <input
                    type="text"
                    value={supportContact}
                    onChange={(e) => setSupportContact(e.target.value)}
                    placeholder="support@cinecore.io"
                    className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500/80 transition-all"
                  />
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-800/80">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="px-4 py-2 text-xs font-semibold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/60 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-5 py-2.5 rounded-xl text-xs font-bold text-white transition-all shadow-lg flex items-center gap-2 ${
                  isMaintenance
                    ? "bg-rose-600 hover:bg-rose-500 shadow-rose-600/30"
                    : "bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30"
                }`}
              >
                {saving ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>{isMaintenance ? "Enable Maintenance" : "Save & Keep Online"}</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

