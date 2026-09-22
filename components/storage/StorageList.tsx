"use client";

import React from "react";
import { IStorageAccount } from "@/lib/types";
import {
  HardDrive,
  Plus,
  RotateCw,
  Power,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Key,
  Globe,
  Database,
  ArrowUpRight,
} from "lucide-react";

interface StorageListProps {
  storages: IStorageAccount[];
  onOpenAddModal: () => void;
  onRecalculate: (id: string) => Promise<void>;
  onToggleStatus: (id: string, currentStatus: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onRefresh: () => void;
  isLoading?: boolean;
}

export function StorageList({
  storages,
  onOpenAddModal,
  onRecalculate,
  onToggleStatus,
  onDelete,
  onRefresh,
  isLoading = false,
}: StorageListProps) {
  const formatGB = (bytes: number) => {
    return (bytes / (1024 * 1024 * 1024)).toFixed(2);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "ACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Active
          </span>
        );
      case "INACTIVE":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-800 text-slate-400 border border-slate-700">
            Inactive
          </span>
        );
      case "FULL":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertTriangle className="w-3.5 h-3.5" />
            Capacity Full
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            Error
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Actions Bar */}
      <div className="p-5 rounded-2xl bg-[#0f172a]/70 border border-slate-800/80 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-indigo-400" />
            Dynamic Multi-R2 Storage Cluster
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-xl leading-relaxed">
            Zero-downtime Cloudflare R2 nodes. The platform atomically selects the highest-priority active node with sufficient capacity for direct presigned uploads.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onRefresh}
            className="p-2.5 text-slate-400 hover:text-white rounded-xl bg-slate-900/90 border border-slate-800 hover:bg-slate-800 transition-colors"
            title="Refresh storage accounts"
          >
            <RotateCw className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-600/30 transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Add R2 Storage Node</span>
          </button>
        </div>
      </div>

      {/* Nodes Grid */}
      {storages.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-[#0f172a]/50 border border-slate-800/80">
          <Database className="w-12 h-12 mx-auto mb-3 text-slate-600 opacity-40" />
          <h4 className="text-base font-semibold text-slate-300">No R2 Storage Nodes Configured</h4>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Connect your first Cloudflare R2 bucket to start accepting direct uploads and streaming.
          </p>
          <button
            onClick={onOpenAddModal}
            className="mt-4 px-4 py-2 text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl transition-all"
          >
            Connect R2 Account
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {storages.map((storage) => {
            const usage = storage.usagePercentage || 0;
            const isFull = usage >= 95;

            return (
              <div
                key={storage._id}
                className="p-6 rounded-2xl bg-[#0f172a]/80 border border-slate-800/80 hover:border-slate-700/80 shadow-xl transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Header: Node name, Priority badge, Status */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                        <HardDrive className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-base tracking-tight">
                            {storage.name}
                          </h4>
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-mono">
                            Priority #{storage.priority}
                          </span>
                        </div>
                        <div className="text-xs text-slate-400 font-mono mt-0.5">
                          Bucket: <span className="text-slate-200">{storage.bucketName}</span>
                        </div>
                      </div>
                    </div>

                    <div>{getStatusBadge(storage.status)}</div>
                  </div>

                  {/* Storage Specs */}
                  <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 block text-[11px]">Endpoint</span>
                      <span className="text-slate-300 font-mono text-[11px] truncate block mt-0.5" title={storage.endpoint}>
                        {storage.endpoint.replace(/^https?:\/\//, "")}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800/80">
                      <span className="text-slate-500 block text-[11px]">Key ID Preview</span>
                      <span className="text-emerald-400 font-mono text-[11px] block mt-0.5">
                        {storage.accessKeyIdPreview || "••••••••"}
                      </span>
                    </div>
                  </div>

                  {/* Capacity Bar */}
                  <div className="mt-5 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-400 font-medium">Capacity Utilization</span>
                      <span className="font-mono text-slate-200 font-semibold">
                        {formatGB(storage.usedStorageBytes)} / {formatGB(storage.maxStorageBytes)} GB ({usage}%)
                      </span>
                    </div>

                    <div className="w-full h-2.5 bg-slate-800 rounded-full overflow-hidden flex">
                      <div
                        className={`h-full transition-all duration-500 ${
                          isFull
                            ? "bg-rose-500"
                            : usage > 75
                            ? "bg-amber-400"
                            : "bg-gradient-to-r from-emerald-500 to-teal-400"
                        }`}
                        style={{ width: `${Math.min(100, usage)}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1">
                      <span>Reserved: {formatGB(storage.reservedStorageBytes)} GB</span>
                      <span>Free: {formatGB(storage.availableStorageBytes)} GB</span>
                    </div>
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onRecalculate(storage._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="Query live R2 bucket to synchronize exact bytes"
                    >
                      <RotateCw className="w-3.5 h-3.5" />
                      <span>Recalculate</span>
                    </button>

                    <button
                      onClick={() => onToggleStatus(storage._id, storage.status)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                        storage.status === "ACTIVE"
                          ? "bg-amber-500/10 text-amber-400 hover:bg-amber-500/20"
                          : "bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20"
                      }`}
                    >
                      <Power className="w-3.5 h-3.5" />
                      <span>{storage.status === "ACTIVE" ? "Deactivate" : "Activate"}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => onDelete(storage._id)}
                    className="p-2 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors"
                    title="Delete Storage Node"
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
  );
}
