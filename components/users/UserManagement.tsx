"use client";

import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/lib/api-client";
import { IAppUser, IUserStats, UserStatus } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";
import {
  Users,
  UserCheck,
  UserX,
  Search,
  Filter,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Mail,
  Calendar,
  Clock,
  MoreVertical,
  CheckCircle2,
  Ban,
  Trash2,
  X,
  AlertTriangle,
} from "lucide-react";

type FilterTab = "ALL" | "REGISTERED" | "GUEST" | "ACTIVE" | "BLOCKED";

export function UserManagement() {
  const { success, error, info } = useToast();

  const [users, setUsers] = useState<IAppUser[]>([]);
  const [stats, setStats] = useState<IUserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Filters & Search
  const [activeTab, setActiveTab] = useState<FilterTab>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals & Action States
  const [blockTargetUser, setBlockTargetUser] = useState<IAppUser | null>(null);
  const [blockReason, setBlockReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [deleteTargetUser, setDeleteTargetUser] = useState<IAppUser | null>(null);

  // Fetch users & stats
  const fetchUsers = useCallback(async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);

    try {
      let statusParam: "ALL" | "ACTIVE" | "BLOCKED" = "ALL";
      let typeParam: "ALL" | "REGISTERED" | "GUEST" = "ALL";

      if (activeTab === "ACTIVE") statusParam = "ACTIVE";
      if (activeTab === "BLOCKED") statusParam = "BLOCKED";
      if (activeTab === "REGISTERED") typeParam = "REGISTERED";
      if (activeTab === "GUEST") typeParam = "GUEST";

      const res = await api.users.getAll({
        page,
        limit: 25,
        search: searchQuery.trim() || undefined,
        status: statusParam,
        type: typeParam,
        sortBy: "createdAt",
        sortOrder: "desc",
      });

      setUsers(res.data.users || []);
      if (res.data.stats) {
        setStats(res.data.stats);
      }
      if (res.meta) {
        setTotalPages(res.meta.totalPages || 1);
        setTotalCount(res.meta.total || 0);
      }
    } catch (err: any) {
      error("Failed to Load Users", err.message || "Could not retrieve user records.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab, page, searchQuery, error]);

  // Initial and reactive fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchUsers();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchUsers]);

  const getUserId = (u?: IAppUser | null) => (u ? u.id || u._id || "" : "");

  const getUserDisplayName = (u?: IAppUser | null) => {
    if (!u) return "User";
    if (u.displayName && typeof u.displayName === "string" && u.displayName.trim().length > 0) {
      return u.displayName.trim();
    }
    if (u.email && typeof u.email === "string" && u.email.trim().length > 0) {
      return u.email.split("@")[0];
    }
    if (u.isGuest) return "Guest User";
    return "Cinephile User";
  };

  const getUserInitial = (u?: IAppUser | null) => {
    const name = getUserDisplayName(u);
    return name.charAt(0).toUpperCase() || "U";
  };

  // Handle Block
  const handleConfirmBlock = async () => {
    if (!blockTargetUser) return;
    const targetId = getUserId(blockTargetUser);
    if (!targetId) return;

    setActionLoading(true);
    try {
      await api.users.block(targetId, blockReason.trim() || undefined);
      success("User Blocked", `"${getUserDisplayName(blockTargetUser)}" has been blocked from accessing the app.`);
      setUsers((prev) =>
        prev.map((u) => (getUserId(u) === targetId ? { ...u, status: "BLOCKED", blockReason: blockReason.trim() } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          blockedUsers: stats.blockedUsers + 1,
          activeUsers: Math.max(0, stats.activeUsers - 1),
        });
      }
      setBlockTargetUser(null);
      setBlockReason("");
    } catch (err: any) {
      error("Block Failed", err.message || "Failed to block user.");
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Unblock
  const handleUnblock = async (user: IAppUser) => {
    const targetId = getUserId(user);
    if (!targetId) return;

    try {
      await api.users.unblock(targetId);
      success("User Unblocked", `"${getUserDisplayName(user)}" is now active and can stream again.`);
      setUsers((prev) =>
        prev.map((u) => (getUserId(u) === targetId ? { ...u, status: "ACTIVE", blockReason: undefined } : u))
      );
      if (stats) {
        setStats({
          ...stats,
          activeUsers: stats.activeUsers + 1,
          blockedUsers: Math.max(0, stats.blockedUsers - 1),
        });
      }
    } catch (err: any) {
      error("Unblock Failed", err.message || "Failed to unblock user.");
    }
  };

  // Handle Delete
  const handleConfirmDelete = async () => {
    if (!deleteTargetUser) return;
    const targetId = getUserId(deleteTargetUser);
    if (!targetId) return;

    setActionLoading(true);
    try {
      await api.users.delete(targetId);
      success("User Deleted", `User "${getUserDisplayName(deleteTargetUser)}" was removed.`);
      setUsers((prev) => prev.filter((u) => getUserId(u) !== targetId));
      if (stats) {
        setStats({
          ...stats,
          totalUsers: Math.max(0, stats.totalUsers - 1),
          guestUsers: deleteTargetUser.isGuest ? Math.max(0, stats.guestUsers - 1) : stats.guestUsers,
          registeredUsers: !deleteTargetUser.isGuest ? Math.max(0, stats.registeredUsers - 1) : stats.registeredUsers,
          activeUsers: deleteTargetUser.status === "ACTIVE" ? Math.max(0, stats.activeUsers - 1) : stats.activeUsers,
          blockedUsers: deleteTargetUser.status === "BLOCKED" ? Math.max(0, stats.blockedUsers - 1) : stats.blockedUsers,
        });
      }
      setDeleteTargetUser(null);
    } catch (err: any) {
      error("Delete Failed", err.message || "Could not delete user.");
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (isoString?: string) => {
    if (!isoString) return "Never";
    const date = new Date(isoString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {/* Total Users */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Total Users</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-white tracking-tight">
            {stats?.totalUsers ?? "..."}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Registered & Guests combined</span>
        </div>

        {/* Registered Users */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Registered Users</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-blue-300 tracking-tight">
            {stats?.registeredUsers ?? "..."}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">With Email & Password</span>
        </div>

        {/* Guest Users */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Guest Users</span>
            <div className="w-8 h-8 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Smartphone className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-amber-300 tracking-tight">
            {stats?.guestUsers ?? "..."}
          </div>
          <span className="text-[11px] text-slate-400 mt-1 block">Device ID Instant Access</span>
        </div>

        {/* Active Users */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Active Streaming</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-400 tracking-tight">
            {stats?.activeUsers ?? "..."}
          </div>
          <span className="text-[11px] text-emerald-400/80 mt-1 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Unrestricted access
          </span>
        </div>

        {/* Blocked Users */}
        <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Blocked Users</span>
            <div className="w-8 h-8 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
              <Ban className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-rose-400 tracking-tight">
            {stats?.blockedUsers ?? "..."}
          </div>
          <span className="text-[11px] text-rose-400/80 mt-1 block">Blocked from streaming</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl p-4 shadow-lg shadow-black/20 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto p-1 bg-slate-900/80 border border-slate-800 rounded-xl">
          <button
            onClick={() => {
              setActiveTab("ALL");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ALL"
                ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            All Users ({stats?.totalUsers ?? 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("REGISTERED");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "REGISTERED"
                ? "bg-blue-600 text-white shadow-md shadow-blue-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Registered ({stats?.registeredUsers ?? 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("GUEST");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "GUEST"
                ? "bg-amber-600 text-white shadow-md shadow-amber-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Guest Users ({stats?.guestUsers ?? 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("ACTIVE");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "ACTIVE"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Active ({stats?.activeUsers ?? 0})
          </button>
          <button
            onClick={() => {
              setActiveTab("BLOCKED");
              setPage(1);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap cursor-pointer ${
              activeTab === "BLOCKED"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Blocked ({stats?.blockedUsers ?? 0})
          </button>
        </div>

        {/* Search Input & Refresh */}
        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name, email, device ID..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-8 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500/80 focus:ring-1 focus:ring-indigo-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <button
            onClick={() => fetchUsers(true)}
            disabled={refreshing}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-all cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl shadow-black/30">
        {loading ? (
          <div className="p-16 flex flex-col items-center justify-center text-slate-400 gap-3">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-mono">Loading users catalog...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <div className="w-14 h-14 rounded-2xl bg-slate-800/60 border border-slate-700/60 flex items-center justify-center text-slate-400 mb-3">
              <Users className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-white">No Users Found</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              {searchQuery
                ? `No user matched query "${searchQuery}". Try clearing search filter.`
                : "There are currently no users in this view."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-900/90 text-slate-400 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3.5 px-6">User / Identity</th>
                  <th className="py-3.5 px-4">Account Type</th>
                  <th className="py-3.5 px-4">Streaming Status</th>
                  <th className="py-3.5 px-4">Device / Client ID</th>
                  <th className="py-3.5 px-4">Registered Date</th>
                  <th className="py-3.5 px-4">Last Active</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {users.map((user) => {
                  const isBlocked = user.status === "BLOCKED";
                  const isGuest = user.isGuest;

                  return (
                    <tr
                      key={getUserId(user)}
                      className={`hover:bg-slate-800/30 transition-colors ${
                        isBlocked ? "bg-rose-950/10" : ""
                      }`}
                    >
                      {/* User Info */}
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-sm shrink-0 border ${
                              isGuest
                                ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                                : "bg-indigo-500/10 border-indigo-500/30 text-indigo-400"
                            }`}
                          >
                            {isGuest ? (
                              <Smartphone className="w-4 h-4" />
                            ) : (
                              getUserInitial(user)
                            )}
                          </div>
                          <div className="min-w-0">
                            <span className="font-semibold text-white block truncate">
                              {getUserDisplayName(user)}
                            </span>
                            <span className="text-[11px] text-slate-400 font-mono block truncate">
                              {user.email || "No Email (Guest Account)"}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Type Badge */}
                      <td className="py-4 px-4">
                        {isGuest ? (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Smartphone className="w-3 h-3" />
                            Guest User
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            <Mail className="w-3 h-3" />
                            Registered User
                          </span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-4 px-4">
                        {isBlocked ? (
                          <div className="flex flex-col">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/30 w-fit">
                              <Ban className="w-3 h-3" />
                              Blocked
                            </span>
                            {user.blockReason && (
                              <span className="text-[10px] text-rose-400/80 mt-0.5 italic max-w-xs truncate" title={user.blockReason}>
                                Reason: {user.blockReason}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Active
                          </span>
                        )}
                      </td>

                      {/* Device ID */}
                      <td className="py-4 px-4 font-mono text-[11px] text-slate-400">
                        {user.deviceId ? (
                          <span className="truncate block max-w-[120px]" title={user.deviceId}>
                            {user.deviceId.slice(0, 14)}...
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>

                      {/* Created At */}
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {formatDate(user.createdAt)}
                      </td>

                      {/* Last Active */}
                      <td className="py-4 px-4 text-slate-400 text-[11px]">
                        {formatDate(user.lastLoginAt)}
                      </td>

                      {/* Action Buttons */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {isBlocked ? (
                            <button
                              onClick={() => handleUnblock(user)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-emerald-600/20 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 transition-all cursor-pointer shadow-sm shadow-emerald-500/10"
                              title="Unblock this user"
                            >
                              <ShieldCheck className="w-3.5 h-3.5" />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => {
                                setBlockTargetUser(user);
                                setBlockReason("");
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold text-[11px] bg-rose-600/10 hover:bg-rose-600 text-rose-400 hover:text-white border border-rose-500/20 hover:border-rose-500 transition-all cursor-pointer"
                              title="Block this user"
                            >
                              <Ban className="w-3.5 h-3.5" />
                              <span>Block</span>
                            </button>
                          )}

                          <button
                            onClick={() => setDeleteTargetUser(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                            title="Delete user"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="py-3 px-6 bg-slate-900/60 border-t border-slate-800 flex items-center justify-between text-xs text-slate-400">
            <span>
              Showing page {page} of {totalPages} ({totalCount} total users)
            </span>
            <div className="flex items-center gap-2">
              <button
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all cursor-pointer"
              >
                Previous
              </button>
              <button
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-200 transition-all cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Block User Modal */}
      {blockTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f172a] border border-rose-500/30 rounded-3xl p-6 shadow-2xl shadow-rose-950/40 relative">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                  <Ban className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Block User</h3>
                  <p className="text-xs text-slate-400">
                    Restricts user from streaming CineCore movies
                  </p>
                </div>
              </div>
              <button
                onClick={() => setBlockTargetUser(null)}
                className="text-slate-400 hover:text-white p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 mb-4">
              <div className="text-xs text-slate-300 font-semibold">
                {getUserDisplayName(blockTargetUser)}
              </div>
              <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                {blockTargetUser.email || `Device: ${blockTargetUser.deviceId || getUserId(blockTargetUser)}`}
              </div>
              <div className="mt-2 text-[11px] text-rose-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Active tokens will be rejected immediately with 403 Forbidden.</span>
              </div>
            </div>

            <div className="mb-5">
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Reason for Blocking (Optional)
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Excessive scraping, terms violation, or suspicious multi-device activity..."
                value={blockReason}
                onChange={(e) => setBlockReason(e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-rose-500/80 focus:ring-1 focus:ring-rose-500/30 transition-all resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setBlockTargetUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmBlock}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30 hover:shadow-rose-600/50 flex items-center gap-2 cursor-pointer"
              >
                <Ban className="w-4 h-4" />
                <span>{actionLoading ? "Blocking..." : "Confirm Block"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete User Modal */}
      {deleteTargetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-[#0f172a] border border-slate-800 rounded-3xl p-6 shadow-2xl relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">Delete User Record</h3>
                <p className="text-xs text-slate-400">This action is permanent and cannot be undone.</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed">
              Are you sure you want to permanently delete user account{" "}
              <strong className="text-white">"{getUserDisplayName(deleteTargetUser)}"</strong>?
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteTargetUser(null)}
                className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/30 flex items-center gap-2 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{actionLoading ? "Deleting..." : "Delete Permanently"}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
