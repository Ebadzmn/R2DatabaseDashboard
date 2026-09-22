"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/Modal";
import { CreateStorageInput } from "@/lib/types";
import { api } from "@/lib/api-client";
import {
  HardDrive,
  Key,
  Globe,
  Database,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  RotateCw,
  Plus,
} from "lucide-react";

interface AddStorageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function AddStorageModal({
  isOpen,
  onClose,
  onSuccess,
}: AddStorageModalProps) {
  const [name, setName] = useState("");
  const [accountId, setAccountId] = useState("");
  const [bucketName, setBucketName] = useState("");
  const [endpoint, setEndpoint] = useState("");
  const [publicUrl, setPublicUrl] = useState("");
  const [accessKeyId, setAccessKeyId] = useState("");
  const [secretAccessKey, setSecretAccessKey] = useState("");
  const [maxStorageGB, setMaxStorageGB] = useState(10);
  const [priority, setPriority] = useState(1);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Auto-generate endpoint when accountId changes if endpoint is empty
  const handleAccountIdChange = (val: string) => {
    setAccountId(val);
    if (!endpoint || endpoint.includes("cloudflarestorage.com")) {
      setEndpoint(`https://${val.trim()}.r2.cloudflarestorage.com`);
    }
  };

  const handleTestConnection = async () => {
    if (!accountId || !bucketName || !endpoint || !accessKeyId || !secretAccessKey) {
      setTestResult({
        success: false,
        message: "Please fill in Account ID, Bucket Name, Endpoint, and Keys to test.",
      });
      return;
    }

    setTesting(true);
    setTestResult(null);

    try {
      const res = await api.storage.test({
        accountId: accountId.trim(),
        bucketName: bucketName.trim(),
        endpoint: endpoint.trim(),
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
      });

      setTestResult({
        success: true,
        message: res.message || "R2 bucket credentials & permissions verified successfully!",
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || "Connection to Cloudflare R2 failed. Verify credentials and CORS.",
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    setSubmitting(true);

    try {
      await api.storage.create({
        name: name.trim(),
        accountId: accountId.trim(),
        bucketName: bucketName.trim(),
        endpoint: endpoint.trim(),
        publicUrl: publicUrl.trim() || undefined,
        accessKeyId: accessKeyId.trim(),
        secretAccessKey: secretAccessKey.trim(),
        maxStorageBytes: maxStorageGB * 1024 * 1024 * 1024,
        priority: Number(priority),
        status: "ACTIVE",
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      setSubmitError(err.message || "Failed to create storage account.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add Cloudflare R2 Storage Node"
      subtitle="Expand streaming capacity with zero downtime or backend server restarts"
      maxWidth="3xl"
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        {submitError && (
          <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{submitError}</span>
          </div>
        )}

        {/* Node Name & Priority */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Node Identifier Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <HardDrive className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. R2-01, R2-Backup"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Priority Order <span className="text-slate-500 font-normal">(1 = Highest)</span>
            </label>
            <input
              type="number"
              min={1}
              required
              value={priority}
              onChange={(e) => setPriority(Number(e.target.value))}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80"
            />
          </div>
        </div>

        {/* Cloudflare Account ID & Bucket Name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Cloudflare Account ID <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="e.g. 978e7a5dcf1145aeb50d511ce8af7c14"
              value={accountId}
              onChange={(e) => handleAccountIdChange(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Bucket Name <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Database className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="e.g. movie-streaming-bucket"
                value={bucketName}
                onChange={(e) => setBucketName(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
              />
            </div>
          </div>
        </div>

        {/* Endpoint & Public URL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              S3 API Endpoint <span className="text-rose-400">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="https://<accountId>.r2.cloudflarestorage.com"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              Public CDN Domain / R2 Dev URL <span className="text-slate-500 font-normal">(Optional)</span>
            </label>
            <div className="relative">
              <Globe className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="https://pub-xyz.r2.dev or https://cdn.movies.com"
                value={publicUrl}
                onChange={(e) => setPublicUrl(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
              />
            </div>
          </div>
        </div>

        {/* Access Key ID & Secret Access Key */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              R2 Access Key ID <span className="text-rose-400">*</span>
            </label>
            <div className="relative">
              <Key className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                placeholder="Enter Access Key ID"
                value={accessKeyId}
                onChange={(e) => setAccessKeyId(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1.5">
              R2 Secret Access Key <span className="text-rose-400">*</span>
            </label>
            <input
              type="password"
              required
              placeholder="Enter Secret Access Key"
              value={secretAccessKey}
              onChange={(e) => setSecretAccessKey(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 font-mono focus:outline-none focus:border-indigo-500/80"
            />
          </div>
        </div>

        {/* Max Storage Threshold */}
        <div>
          <label className="block text-xs font-semibold text-slate-300 mb-1.5">
            Max Storage Threshold (GB)
          </label>
          <input
            type="number"
            min={1}
            value={maxStorageGB}
            onChange={(e) => setMaxStorageGB(Number(e.target.value))}
            className="w-full px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-sm text-slate-200 focus:outline-none focus:border-indigo-500/80"
          />
          <span className="text-[11px] text-slate-500 mt-1 block">
            When capacity hits this threshold, uploads automatically rotate to the next active priority account.
          </span>
        </div>

        {/* Interactive Test Connection Bar */}
        <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400 shrink-0" />
            <span className="text-xs text-slate-300">
              Credentials are encrypted using AES-256-GCM before database storage.
            </span>
          </div>

          <button
            type="button"
            onClick={handleTestConnection}
            disabled={testing}
            className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white border border-slate-700 transition-all shrink-0 flex items-center gap-1.5 justify-center"
          >
            <RotateCw className={`w-3.5 h-3.5 ${testing ? "animate-spin" : ""}`} />
            <span>{testing ? "Testing R2..." : "Test R2 Connection"}</span>
          </button>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 animate-in fade-in ${
              testResult.success
                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/30 text-rose-300"
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            )}
            <span>{testResult.message}</span>
          </div>
        )}

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={submitting || !name || !accountId || !bucketName}
            className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg shadow-indigo-600/30 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>{submitting ? "Persisting..." : "Save & Activate Node"}</span>
          </button>
        </div>
      </form>
    </Modal>
  );
}
