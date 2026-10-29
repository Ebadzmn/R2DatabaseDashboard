"use client";

import React, { useState, useEffect, useCallback } from "react";
import {
  MessageSquare,
  Heart,
  Flag,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Eye,
  EyeOff,
  Trash2,
  RefreshCw,
  Search,
  Filter,
  Film,
  User,
  Clock,
  Layers,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ShieldCheck,
  MessageCircle,
  Archive,
  UserCheck,
  Calendar,
  Info,
  History,
  FileText,
} from "lucide-react";
import { api } from "@/lib/api-client";
import {
  ICommunityPost,
  IPostComment,
  IPostReport,
  IFeedStats,
  IModerationAudit,
  ICommunityAuthor,
  PostStatus,
  ReportStatus,
} from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

type SubTab = "overview" | "posts" | "reports" | "history" | "comments";

const BACKEND_URL = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

function resolveAssetUrl(url?: string): string {
  if (!url || typeof url !== "string") return "";
  const trimmed = url.trim();
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://") || trimmed.startsWith("data:")) {
    return trimmed;
  }
  const cleanPath = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${BACKEND_URL}${cleanPath}`;
}

export function CommunityManagement() {
  const { success, error, info } = useToast();

  const [activeSubTab, setActiveSubTab] = useState<SubTab>("overview");
  const [stats, setStats] = useState<IFeedStats | null>(null);
  const [loading, setLoading] = useState(true);

  // Posts State
  const [posts, setPosts] = useState<ICommunityPost[]>([]);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postSearch, setPostSearch] = useState("");
  const [postStatusFilter, setPostStatusFilter] = useState<string>("ALL");

  // Reports State
  const [reports, setReports] = useState<IPostReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportStatusFilter, setReportStatusFilter] = useState<string>("PENDING");
  const [reportReasonFilter, setReportReasonFilter] = useState<string>("ALL");

  // Moderation History State
  const [historyLogs, setHistoryLogs] = useState<IModerationAudit[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historySearch, setHistorySearch] = useState("");

  // Comments State
  const [comments, setComments] = useState<IPostComment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentSearch, setCommentSearch] = useState("");

  // Target Modals
  const [selectedPost, setSelectedPost] = useState<ICommunityPost | null>(null);
  const [inspectUser, setInspectUser] = useState<ICommunityAuthor | null>(null);

  const handleInspectUser = useCallback((user: any) => {
    if (!user) return;
    if (typeof user === "string") {
      setInspectUser({ _id: user, displayName: "User", isGuest: false });
    } else {
      setInspectUser(user);
    }
  }, []);

  // Moderate Post Modal
  const [moderateTargetPost, setModerateTargetPost] = useState<ICommunityPost | null>(null);
  const [moderateAction, setModerateAction] = useState<"REMOVE" | "RESTORE" | "HIDE">("REMOVE");
  const [moderateReason, setModerateReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  // Resolve Report Modal
  const [resolveTargetReport, setResolveTargetReport] = useState<IPostReport | null>(null);
  const [resolveStatus, setResolveStatus] = useState<ReportStatus>("ACTION_TAKEN");
  const [resolveNotes, setResolveNotes] = useState("");
  const [resolveUserNotification, setResolveUserNotification] = useState(
    "Action taken: The reported content was removed for violating community guidelines."
  );
  const [resolveContentAction, setResolveContentAction] = useState<"REMOVE" | "RESTORE" | "NONE">("REMOVE");
  const [resolveContentReason, setResolveContentReason] = useState("Violation of community guidelines");

  // Load Feed Statistics
  const loadStats = useCallback(async () => {
    try {
      const res = await api.community.getStats();
      if (res.data) setStats(res.data);
    } catch (err: any) {
      console.error("Failed to load community stats:", err);
    }
  }, []);

  // Load Posts
  const loadPosts = useCallback(async () => {
    setPostsLoading(true);
    try {
      const res = await api.community.getPosts({
        status: postStatusFilter === "ALL" ? undefined : (postStatusFilter as PostStatus),
        search: postSearch.trim() || undefined,
        limit: 50,
      });
      if (res.data) setPosts(res.data);
    } catch (err: any) {
      error("Failed to load posts", err.message);
    } finally {
      setPostsLoading(false);
    }
  }, [postStatusFilter, postSearch, error]);

  // Load Reports
  const loadReports = useCallback(async () => {
    setReportsLoading(true);
    try {
      const res = await api.community.getReports({
        status: reportStatusFilter === "ALL" ? undefined : reportStatusFilter,
        reason: reportReasonFilter === "ALL" ? undefined : reportReasonFilter,
        limit: 50,
      });
      if (res.data) setReports(res.data);
    } catch (err: any) {
      error("Failed to load reports", err.message);
    } finally {
      setReportsLoading(false);
    }
  }, [reportStatusFilter, reportReasonFilter, error]);

  // Load Moderation History
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const res = await api.community.getModerationHistory({
        search: historySearch.trim() || undefined,
        limit: 50,
      });
      if (res.data) setHistoryLogs(res.data);
    } catch (err: any) {
      error("Failed to load history", err.message);
    } finally {
      setHistoryLoading(false);
    }
  }, [historySearch, error]);

  // Load Comments
  const loadComments = useCallback(async () => {
    setCommentsLoading(true);
    try {
      const res = await api.community.getComments({
        search: commentSearch.trim() || undefined,
        limit: 50,
      });
      if (res.data) setComments(res.data);
    } catch (err: any) {
      error("Failed to load comments", err.message);
    } finally {
      setCommentsLoading(false);
    }
  }, [commentSearch, error]);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await loadStats();
      await loadPosts();
      setLoading(false);
    };
    init();
  }, [loadStats, loadPosts]);

  // Handle Tab Switch
  const handleTabChange = (tab: SubTab) => {
    setActiveSubTab(tab);
    if (tab === "overview") loadStats();
    if (tab === "posts") loadPosts();
    if (tab === "reports") loadReports();
    if (tab === "history") loadHistory();
    if (tab === "comments") loadComments();
  };

  // Moderate Post Execution
  const handleExecuteModeration = async () => {
    if (!moderateTargetPost) return;
    setActionLoading(true);
    try {
      await api.community.moderatePost(
        moderateTargetPost._id,
        moderateAction,
        moderateReason.trim() || undefined
      );
      success("Post Moderated", `Post has been updated to ${moderateAction}`);
      setModerateTargetPost(null);
      setModerateReason("");
      loadPosts();
      loadStats();
    } catch (err: any) {
      error("Moderation Failed", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Resolve Report Execution
  const handleExecuteResolveReport = async () => {
    if (!resolveTargetReport) return;
    setActionLoading(true);
    try {
      await api.community.resolveReport(resolveTargetReport._id, {
        status: resolveStatus,
        adminNotes: resolveNotes.trim() || undefined,
        userNotification: resolveUserNotification.trim() || undefined,
        actionOnContent: resolveContentAction,
        contentRemovalReason: resolveContentReason.trim() || undefined,
      });
      success("Report Processed", `Report marked as ${resolveStatus}`);
      setResolveTargetReport(null);
      setResolveNotes("");
      setResolveContentReason("");
      loadReports();
      loadStats();
    } catch (err: any) {
      error("Action Failed", err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Delete Comment Execution
  const handleDeleteComment = async (commentId: string) => {
    if (!confirm("Are you sure you want to remove this comment as an administrator?")) return;
    try {
      await api.community.deleteComment(commentId);
      success("Comment Removed", "The comment was successfully removed");
      loadComments();
      loadStats();
    } catch (err: any) {
      error("Failed to delete comment", err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-[#121622]/80 backdrop-blur border border-slate-800/80 p-6 rounded-2xl shadow-xl">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-wide">
                Community Feed & Moderation
              </h1>
              <p className="text-xs text-slate-400">
                Manage user posts, review flagged content, resolve reports, and inspect moderation history
              </p>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Selector */}
        <div className="flex items-center bg-[#0d1017] p-1.5 rounded-xl border border-slate-800 self-start md:self-auto overflow-x-auto max-w-full">
          <button
            onClick={() => handleTabChange("overview")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
              activeSubTab === "overview"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => handleTabChange("posts")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "posts"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Posts
            {stats && stats.totalPosts > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-slate-900/40 text-current">
                {stats.totalPosts}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("reports")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "reports"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Reports
            {stats && stats.pendingReports > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-rose-500 text-white animate-pulse">
                {stats.pendingReports}
              </span>
            )}
          </button>
          <button
            onClick={() => handleTabChange("history")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "history"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <History className="w-3.5 h-3.5" />
            Audit History
          </button>
          <button
            onClick={() => handleTabChange("comments")}
            className={`px-4 py-2 rounded-lg text-xs font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
              activeSubTab === "comments"
                ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Comments
          </button>
        </div>
      </div>

      {/* SUB-TAB: OVERVIEW */}
      {activeSubTab === "overview" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[#121622]/70 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Community Posts</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {stats?.totalPosts.toLocaleString() ?? "..."}
                </h3>
                <span className="text-[11px] text-emerald-400 font-medium mt-1 inline-block">
                  Live on CineCore App
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <MessageSquare className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#121622]/70 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Comments</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {stats?.totalComments.toLocaleString() ?? "..."}
                </h3>
                <span className="text-[11px] text-blue-400 font-medium mt-1 inline-block">
                  User Interactions
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400">
                <MessageCircle className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#121622]/70 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Total Likes & Reactions</p>
                <h3 className="text-2xl font-bold text-white mt-1">
                  {stats?.totalLikes.toLocaleString() ?? "..."}
                </h3>
                <span className="text-[11px] text-rose-400 font-medium mt-1 inline-block">
                  Community Engagement
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Heart className="w-6 h-6" />
              </div>
            </div>

            <div className="bg-[#121622]/70 border border-slate-800/80 p-5 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-400 font-medium">Pending Reports</p>
                <h3 className="text-2xl font-bold text-rose-400 mt-1">
                  {stats?.pendingReports.toLocaleString() ?? "..."}
                </h3>
                <span className="text-[11px] text-amber-400 font-medium mt-1 inline-block">
                  {stats?.pendingReports ? "Action Required" : "All clean"}
                </span>
              </div>
              <div className="w-12 h-12 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-400">
                <Flag className="w-6 h-6" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#121622]/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
                  <ShieldAlert className="w-5 h-5 text-amber-400" />
                  Report Resolution Queue
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Review reported posts and comments. Approving or rejecting reports automatically notifies the reporting user and records auditable moderation decisions.
                </p>
              </div>
              <button
                onClick={() => handleTabChange("reports")}
                className="mt-4 px-4 py-2 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-semibold hover:bg-amber-500/20 flex items-center justify-between"
              >
                Open Reports <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#121622]/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
                  <Archive className="w-5 h-5 text-purple-400" />
                  Moderation Audit History
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Every post deleted or taken down through moderation is preserved here with the author ID, reporting users list, timestamp, and moderator reason.
                </p>
              </div>
              <button
                onClick={() => handleTabChange("history")}
                className="mt-4 px-4 py-2 bg-purple-500/10 text-purple-400 border border-purple-500/20 rounded-xl text-xs font-semibold hover:bg-purple-500/20 flex items-center justify-between"
              >
                View Audit History <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-[#121622]/60 border border-slate-800 p-6 rounded-2xl flex flex-col justify-between">
              <div>
                <h3 className="text-base font-semibold text-white flex items-center gap-2 mb-2">
                  <Film className="w-5 h-5 text-indigo-400" />
                  Movie & Series Feed Posts
                </h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Users share favorite movies and TV series. Tapping attached movie tags opens the video streaming playback and movie details screen on mobile.
                </p>
              </div>
              <button
                onClick={() => handleTabChange("posts")}
                className="mt-4 px-4 py-2 bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded-xl text-xs font-semibold hover:bg-indigo-500/20 flex items-center justify-between"
              >
                Browse Posts <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB: POSTS */}
      {activeSubTab === "posts" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121622]/70 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search captions or text..."
                value={postSearch}
                onChange={(e) => setPostSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadPosts()}
                className="w-full bg-[#0d1017] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <select
                value={postStatusFilter}
                onChange={(e) => setPostStatusFilter(e.target.value)}
                className="bg-[#0d1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active Only</option>
                <option value="HIDDEN">Hidden Only</option>
                <option value="REMOVED">Removed Only</option>
              </select>

              <button
                onClick={loadPosts}
                disabled={postsLoading}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${postsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {postsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">Loading community posts...</p>
            </div>
          ) : posts.length === 0 ? (
            <div className="bg-[#121622]/50 border border-slate-800 rounded-2xl p-12 text-center">
              <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Posts Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                No user posts match the current filter or search criteria.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {posts.map((post) => (
                <div
                  key={post._id}
                  className="bg-[#121622]/70 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700 transition-all space-y-3"
                >
                  {/* Author Header with Clickable User Profile */}
                  <div className="flex items-center justify-between">
                    <button
                      onClick={() => handleInspectUser(post.authorId)}
                      className="flex items-center gap-2.5 text-left group"
                    >
                      {post.authorId?.avatarUrl ? (
                        <img
                          src={resolveAssetUrl(post.authorId.avatarUrl)}
                          alt={post.authorId?.displayName || "User"}
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-amber-400 transition-colors"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-semibold text-white group-hover:text-amber-400 transition-colors">
                            {post.authorId?.displayName || "Anonymous User"}
                          </span>
                          {post.authorId?.isGuest && (
                            <span className="text-[9px] px-1.5 py-0.2 bg-slate-800 text-slate-400 rounded">
                              Guest
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-500 font-mono">
                          ID: {post.authorId?._id?.slice(-6) || "..."}
                        </span>
                      </div>
                    </button>

                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        post.status === "ACTIVE"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : post.status === "HIDDEN"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                      }`}
                    >
                      {post.status}
                    </span>
                  </div>

                  {/* Caption */}
                  <p className="text-xs text-slate-200 line-clamp-3 leading-relaxed whitespace-pre-wrap">
                    {post.caption}
                  </p>

                  {/* Image Thumbnails */}
                  {post.images && post.images.filter((img) => Boolean(img && img.trim())).length > 0 && (
                    <div className="grid grid-cols-3 gap-1.5 pt-1">
                      {post.images.filter((img) => Boolean(img && img.trim())).slice(0, 3).map((imgUrl, idx) => (
                        <div
                          key={idx}
                          className="relative aspect-video rounded-lg overflow-hidden bg-slate-900 border border-slate-800 cursor-pointer"
                          onClick={() => setSelectedPost(post)}
                        >
                          <img
                            src={resolveAssetUrl(imgUrl)}
                            alt="Post upload"
                            className="w-full h-full object-cover hover:scale-105 transition-transform"
                          />
                          {idx === 2 && post.images.filter((img) => Boolean(img && img.trim())).length > 3 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs font-bold text-white">
                              +{post.images.filter((img) => Boolean(img && img.trim())).length - 3}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Attached Movie Tag */}
                  {post.movieId && (
                    <div className="flex items-center gap-2 p-2 rounded-lg bg-[#0d1017] border border-slate-800/80">
                      {post.movieId?.poster && (
                        <img
                          src={resolveAssetUrl(post.movieId.poster)}
                          alt={post.movieId?.title || "Movie"}
                          className="w-6 h-8 rounded object-cover shrink-0"
                        />
                      )}
                      <div className="overflow-hidden">
                        <p className="text-[11px] font-medium text-amber-400 truncate">
                          {post.movieId?.title || "Untitled"}
                        </p>
                        <span className="text-[9px] text-slate-400">
                          {post.movieId?.type || "MOVIE"} • {post.movieId?.releaseYear || "Featured"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Counters & Moderation Actions */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-3 text-slate-400 text-xs">
                      <span className="flex items-center gap-1">
                        <Heart className="w-3.5 h-3.5 text-rose-400" />
                        {post.likesCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <MessageCircle className="w-3.5 h-3.5 text-blue-400" />
                        {post.commentsCount}
                      </span>
                      {post.reportsCount > 0 && (
                        <span className="flex items-center gap-1 text-rose-400 font-semibold">
                          <Flag className="w-3.5 h-3.5" />
                          {post.reportsCount}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {post.status === "ACTIVE" ? (
                        <button
                          onClick={() => {
                            setModerateTargetPost(post);
                            setModerateAction("HIDE");
                            setModerateReason("Hidden by moderator");
                          }}
                          title="Hide Post"
                          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-amber-400 hover:bg-slate-700 transition-colors"
                        >
                          <EyeOff className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            setModerateTargetPost(post);
                            setModerateAction("RESTORE");
                            setModerateReason("Restored by moderator");
                          }}
                          title="Restore Post"
                          className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 transition-colors"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setModerateTargetPost(post);
                          setModerateAction("REMOVE");
                          setModerateReason("Violation of community guidelines");
                        }}
                        title="Remove Post"
                        className="p-1.5 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: REPORTS (IMPROVED WORKFLOW) */}
      {activeSubTab === "reports" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121622]/70 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-2 overflow-x-auto max-w-full">
              <span className="text-xs text-slate-400 shrink-0">Filter Status:</span>
              <div className="flex items-center gap-1 bg-[#0d1017] p-1 rounded-lg border border-slate-800 shrink-0">
                {["PENDING", "UNDER_REVIEW", "ACTION_TAKEN", "REJECTED", "RESOLVED", "ALL"].map((st) => (
                  <button
                    key={st}
                    onClick={() => setReportStatusFilter(st)}
                    className={`px-3 py-1 rounded-md text-[11px] font-medium transition-all ${
                      reportStatusFilter === st
                        ? "bg-amber-500 text-slate-950 font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={reportReasonFilter}
                onChange={(e) => setReportReasonFilter(e.target.value)}
                className="bg-[#0d1017] border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
              >
                <option value="ALL">All Reasons</option>
                <option value="SPAM">Spam</option>
                <option value="INAPPROPRIATE">Inappropriate</option>
                <option value="HARASSMENT">Harassment</option>
                <option value="COPYRIGHT">Copyright</option>
                <option value="MISLEADING">Misleading</option>
                <option value="OTHER">Other</option>
              </select>

              <button
                onClick={loadReports}
                disabled={reportsLoading}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${reportsLoading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          </div>

          {reportsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">Loading reported items...</p>
            </div>
          ) : reports.length === 0 ? (
            <div className="bg-[#121622]/50 border border-slate-800 rounded-2xl p-12 text-center">
              <ShieldCheck className="w-12 h-12 text-emerald-500 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Reports Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no reports matching the selected filters.
              </p>
            </div>
          ) : (
            <div className="bg-[#121622]/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0d1017]/80 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Type & Reason</th>
                      <th className="py-3 px-4 font-semibold">Reported Content Preview</th>
                      <th className="py-3 px-4 font-semibold">Post Author</th>
                      <th className="py-3 px-4 font-semibold">Reporting User</th>
                      <th className="py-3 px-4 font-semibold">Date Reported</th>
                      <th className="py-3 px-4 font-semibold">Status</th>
                      <th className="py-3 px-4 font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {reports.map((report) => (
                      <tr key={report._id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="flex flex-col gap-1">
                            <span className="font-semibold text-white">
                              {report.reportedContentType}
                            </span>
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-medium bg-rose-500/10 text-rose-400 border border-rose-500/20 w-fit">
                              {report.reason}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          {report.reportedContentType === "POST" ? (
                            <div>
                              <p className="text-slate-300 line-clamp-2">
                                {report.postId?.caption || "[Post preview unavailable]"}
                              </p>
                              {report.details && (
                                <p className="text-[10px] text-amber-400/90 mt-1 italic">
                                  User note: "{report.details}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <div>
                              <p className="text-slate-300 line-clamp-2">
                                {report.commentPreview || "[Comment content]"}
                              </p>
                              {report.details && (
                                <p className="text-[10px] text-amber-400/90 mt-1 italic">
                                  User note: "{report.details}"
                                </p>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Clickable Post Author Profile */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleInspectUser(report.postId?.authorId || report.contentOwnerId)}
                            className="flex items-center gap-2 text-left group"
                          >
                            <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400">
                              <User className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-slate-200 group-hover:text-amber-400 font-semibold transition-colors">
                                {report.postId?.authorId?.displayName || report.contentOwnerId?.displayName || "Author"}
                              </p>
                              <span className="text-[9px] text-slate-500 font-mono">
                                ID: {(report.postId?.authorId?._id || report.contentOwnerId?._id)?.slice(-6) || "..."}
                              </span>
                            </div>
                          </button>
                        </td>

                        {/* Clickable Reporting User Profile */}
                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleInspectUser(report.reporterId)}
                            className="flex items-center gap-2 text-left group"
                          >
                            <div className="w-6 h-6 rounded-full bg-rose-500/10 text-rose-400 flex items-center justify-center group-hover:bg-rose-500/20">
                              <Flag className="w-3 h-3" />
                            </div>
                            <div>
                              <p className="text-slate-200 group-hover:text-rose-400 font-semibold transition-colors">
                                {report.reporterId?.displayName || "Reporter"}
                              </p>
                              <span className="text-[9px] text-slate-500 font-mono">
                                ID: {report.reporterId?._id?.slice(-6) || "..."}
                              </span>
                            </div>
                          </button>
                        </td>

                        <td className="py-3.5 px-4 text-slate-400">
                          {new Date(report.createdAt).toLocaleString([], {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              report.status === "PENDING"
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                                : report.status === "ACTION_TAKEN"
                                ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                                : report.status === "RESOLVED"
                                ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                                : "bg-slate-800 text-slate-400"
                            }`}
                          >
                            {report.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setResolveTargetReport(report);
                              setResolveStatus("ACTION_TAKEN");
                              setResolveContentAction("REMOVE");
                              setResolveContentReason(`Violation of guidelines: ${report.reason}`);
                              setResolveUserNotification("Action taken: The reported content was removed for violating community guidelines.");
                              setResolveNotes("Reviewed report and confirmed violation.");
                            }}
                            className="px-3 py-1 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-lg text-[11px] font-semibold transition-all"
                          >
                            Review & Act
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: MODERATION AUDIT HISTORY / DELETED POSTS (REQUIREMENT 3) */}
      {activeSubTab === "history" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121622]/70 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search deleted posts or reason..."
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadHistory()}
                className="w-full bg-[#0d1017] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={loadHistory}
              disabled={historyLoading}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${historyLoading ? "animate-spin" : ""}`} />
              Refresh Audit History
            </button>
          </div>

          {historyLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
              <p className="text-xs">Loading moderation history...</p>
            </div>
          ) : historyLogs.length === 0 ? (
            <div className="bg-[#121622]/50 border border-slate-800 rounded-2xl p-12 text-center">
              <Archive className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Moderation History Yet</h3>
              <p className="text-xs text-slate-400 mt-1">
                Deleted posts and audit logs will appear here when administrative takedowns occur.
              </p>
            </div>
          ) : (
            <div className="bg-[#121622]/70 border border-slate-800 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-800 bg-[#0d1017]/80 text-slate-400">
                      <th className="py-3 px-4 font-semibold">Action & Target</th>
                      <th className="py-3 px-4 font-semibold">Post Content Preview</th>
                      <th className="py-3 px-4 font-semibold">Author</th>
                      <th className="py-3 px-4 font-semibold">Reporting Users</th>
                      <th className="py-3 px-4 font-semibold">Moderator / Admin</th>
                      <th className="py-3 px-4 font-semibold">Date & Reason</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 text-slate-300">
                    {historyLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-850/40 transition-colors">
                        <td className="py-3.5 px-4">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
                            {log.action}
                          </span>
                          <p className="text-[10px] text-slate-500 font-mono mt-1">
                            ID: {log.targetId?.slice(-6)}
                          </p>
                        </td>

                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="text-slate-200 line-clamp-2">
                            {log.captionPreview || "[No caption text]"}
                          </p>
                          {log.images && log.images.length > 0 && (
                            <span className="text-[10px] text-indigo-400 flex items-center gap-1 mt-1">
                              <Film className="w-3 h-3" /> {log.images.length} image(s) archived
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <button
                            onClick={() => handleInspectUser(log.authorId)}
                            className="text-left group"
                          >
                            <p className="text-white group-hover:text-amber-400 font-semibold transition-colors">
                              {log.authorId?.displayName || "Author"}
                            </p>
                            <span className="text-[9px] text-slate-500 font-mono">
                              ID: {log.authorId?._id?.slice(-6) || "..."}
                            </span>
                          </button>
                        </td>

                        <td className="py-3.5 px-4">
                          {log.reporters && log.reporters.length > 0 ? (
                            <div className="flex items-center gap-1">
                              {log.reporters.slice(0, 2).map((rep, idx) => (
                                <button
                                  key={idx}
                                  onClick={() => handleInspectUser(rep)}
                                  className="text-[11px] text-slate-300 hover:text-rose-400 underline decoration-slate-600 block truncate max-w-[120px]"
                                >
                                  {rep?.displayName || (typeof rep === "string" ? (rep as string).slice(-6) : "Reporter")}
                                </button>
                              ))}
                              {log.reporters.length > 2 && (
                                <span className="text-[10px] text-slate-500">
                                  +{log.reporters.length - 2}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-500 text-[11px]">Direct Admin</span>
                          )}
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="text-slate-300 font-medium">
                            {log.adminId?.name || log.adminId?.username || "Admin"}
                          </span>
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="text-slate-200 font-medium">{log.reason}</p>
                          <span className="text-[10px] text-slate-500">
                            {new Date(log.createdAt).toLocaleString()}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUB-TAB: COMMENTS */}
      {activeSubTab === "comments" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-[#121622]/70 p-4 rounded-xl border border-slate-800">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search comments..."
                value={commentSearch}
                onChange={(e) => setCommentSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && loadComments()}
                className="w-full bg-[#0d1017] border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
              />
            </div>

            <button
              onClick={loadComments}
              disabled={commentsLoading}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-all self-end sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${commentsLoading ? "animate-spin" : ""}`} />
              Refresh Comments
            </button>
          </div>

          {commentsLoading ? (
            <div className="h-64 flex flex-col items-center justify-center text-slate-400 gap-3">
              <RefreshCw className="w-8 h-8 animate-spin text-amber-500" />
              <p className="text-xs">Loading comments...</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-[#121622]/50 border border-slate-800 rounded-2xl p-12 text-center">
              <MessageCircle className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-sm font-semibold text-white">No Comments Found</h3>
              <p className="text-xs text-slate-400 mt-1">
                There are no active comments matching your search.
              </p>
            </div>
          ) : (
            <div className="bg-[#121622]/70 border border-slate-800 rounded-xl divide-y divide-slate-800/60">
              {comments.map((comment) => (
                <div
                  key={comment._id}
                  className="p-4 flex items-start justify-between gap-4 hover:bg-slate-850/40 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <button
                      onClick={() => handleInspectUser(comment.authorId)}
                      className="group shrink-0"
                    >
                      {comment.authorId?.avatarUrl ? (
                        <img
                          src={resolveAssetUrl(comment.authorId.avatarUrl)}
                          alt="Author"
                          className="w-8 h-8 rounded-full object-cover border border-slate-700 group-hover:border-amber-400"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 group-hover:text-amber-400">
                          <User className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                    <div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleInspectUser(comment.authorId)}
                          className="text-xs font-semibold text-white hover:text-amber-400 transition-colors"
                        >
                          {comment.authorId?.displayName || "Anonymous User"}
                        </button>
                        <span className="text-[10px] text-slate-500">
                          {new Date(comment.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 leading-relaxed whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  </div>

                  <button
                    onClick={() => handleDeleteComment(comment._id)}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-colors shrink-0"
                    title="Remove Comment"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODAL: INSPECT USER PROFILE (REQUIREMENT 4) */}
      {inspectUser && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-indigo-400" />
                User Account Profile
              </h3>
              <button
                onClick={() => setInspectUser(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="flex items-center gap-4 py-2">
              {inspectUser.avatarUrl ? (
                <img
                  src={resolveAssetUrl(inspectUser.avatarUrl)}
                  alt={inspectUser.displayName || "User"}
                  className="w-16 h-16 rounded-full object-cover border-2 border-indigo-500/40"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                  <User className="w-8 h-8" />
                </div>
              )}
              <div>
                <h4 className="text-base font-bold text-white">{inspectUser.displayName}</h4>
                {inspectUser.email && (
                  <p className="text-xs text-slate-400">{inspectUser.email}</p>
                )}
                <div className="flex items-center gap-2 mt-1.5">
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded font-semibold ${
                      inspectUser.status === "BLOCKED"
                        ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                        : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                    }`}
                  >
                    {inspectUser.status || "ACTIVE"}
                  </span>
                  {inspectUser.isGuest && (
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                      Guest Device
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-[#0d1017] border border-slate-800 rounded-xl p-3 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-850">
                <span className="text-slate-400">Database User ID:</span>
                <span className="font-mono text-slate-200 select-all">{inspectUser._id}</span>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setInspectUser(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Moderate Post */}
      {moderateTargetPost && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-400" />
              Moderate Community Post
            </h3>
            <p className="text-xs text-slate-400">
              Select action and provide a reason for the internal audit history.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Action</label>
                <select
                  value={moderateAction}
                  onChange={(e) => setModerateAction(e.target.value as any)}
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="REMOVE">Remove Post (Audit Takendown)</option>
                  <option value="HIDE">Hide Post (Hide from public feed)</option>
                  <option value="RESTORE">Restore Post (Make active again)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">Reason / Note</label>
                <textarea
                  rows={3}
                  value={moderateReason}
                  onChange={(e) => setModerateReason(e.target.value)}
                  placeholder="e.g. Inappropriate content, copyright violation, etc."
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg p-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setModerateTargetPost(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteModeration}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm Moderation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Resolve Report (IMPROVED WORKFLOW) */}
      {resolveTargetReport && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Flag className="w-5 h-5 text-rose-400" />
              Resolve / Act on Report
            </h3>
            <p className="text-xs text-slate-400">
              Update the report status, execute automated takedowns if necessary, and specify user-facing notification messages.
            </p>

            <div className="space-y-3 pt-2">
              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Report Moderation Decision
                </label>
                <select
                  value={resolveStatus}
                  onChange={(e) => {
                    const st = e.target.value as ReportStatus;
                    setResolveStatus(st);
                    if (st === "ACTION_TAKEN") {
                      setResolveContentAction("REMOVE");
                      setResolveUserNotification("Action taken: The reported content was removed for violating community guidelines.");
                    } else if (st === "REJECTED" || st === "DISMISSED") {
                      setResolveContentAction("NONE");
                      setResolveUserNotification("Report reviewed: No guideline violation was found.");
                    }
                  }}
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="ACTION_TAKEN">ACTION TAKEN (Content violates guidelines)</option>
                  <option value="RESOLVED">RESOLVED (Issue addressed)</option>
                  <option value="REJECTED">REJECTED (No violation found)</option>
                  <option value="DISMISSED">DISMISSED (Invalid or spam report)</option>
                  <option value="UNDER_REVIEW">UNDER REVIEW (Investigation in progress)</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Action on Reported Content
                </label>
                <select
                  value={resolveContentAction}
                  onChange={(e) => setResolveContentAction(e.target.value as any)}
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="REMOVE">Remove Content (Take down post/comment & record in Audit History)</option>
                  <option value="NONE">None (Keep content active)</option>
                  <option value="RESTORE">Restore Content (If previously removed)</option>
                </select>
              </div>

              {resolveContentAction === "REMOVE" && (
                <div>
                  <label className="text-[11px] text-slate-400 font-medium block mb-1">
                    Content Removal Reason (For Audit Log)
                  </label>
                  <input
                    type="text"
                    value={resolveContentReason}
                    onChange={(e) => setResolveContentReason(e.target.value)}
                    placeholder="e.g. Violation of community standards: Harassment"
                    className="w-full bg-[#0d1017] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              )}

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Public Notification to Reporting User (Shown in "My Reports")
                </label>
                <textarea
                  rows={2}
                  value={resolveUserNotification}
                  onChange={(e) => setResolveUserNotification(e.target.value)}
                  placeholder="Message visible to the user who filed this report..."
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-medium block mb-1">
                  Private Internal Admin Note (Kept Confidential)
                </label>
                <textarea
                  rows={2}
                  value={resolveNotes}
                  onChange={(e) => setResolveNotes(e.target.value)}
                  placeholder="Private notes for moderation team..."
                  className="w-full bg-[#0d1017] border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setResolveTargetReport(null)}
                className="px-4 py-2 rounded-lg text-xs font-medium text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleExecuteResolveReport}
                disabled={actionLoading}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-amber-500 hover:bg-amber-400 text-slate-950 flex items-center gap-1.5"
              >
                {actionLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Confirm & Apply Decision
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: View Full Post & Images */}
      {selectedPost && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#121622] border border-slate-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-3">
                {selectedPost.authorId?.avatarUrl ? (
                  <img
                    src={resolveAssetUrl(selectedPost.authorId.avatarUrl)}
                    alt="Author"
                    className="w-9 h-9 rounded-full object-cover border border-slate-700"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                    <User className="w-5 h-5" />
                  </div>
                )}
                <div>
                  <h4 className="text-sm font-bold text-white">
                    {selectedPost.authorId?.displayName || "Cinephile User"}
                  </h4>
                  <span className="text-[10px] text-slate-500">
                    Posted {new Date(selectedPost.createdAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap">
              {selectedPost.caption}
            </p>

            {selectedPost.images && selectedPost.images.filter((img) => Boolean(img && img.trim())).length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                {selectedPost.images.filter((img) => Boolean(img && img.trim())).map((img, idx) => (
                  <a
                    key={idx}
                    href={resolveAssetUrl(img)}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl overflow-hidden border border-slate-800 aspect-video group relative block bg-black"
                  >
                    <img
                      src={resolveAssetUrl(img)}
                      alt={`Post attachment ${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-semibold gap-1 transition-opacity">
                      <ExternalLink className="w-4 h-4" /> Open Full Image
                    </div>
                  </a>
                ))}
              </div>
            )}

            {selectedPost.movieId && (
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0d1017] border border-slate-800">
                {selectedPost.movieId.poster && (
                  <img
                    src={resolveAssetUrl(selectedPost.movieId.poster)}
                    alt={selectedPost.movieId.title}
                    className="w-8 h-11 rounded object-cover"
                  />
                )}
                <div>
                  <p className="text-xs font-bold text-amber-400">
                    {selectedPost.movieId.title}
                  </p>
                  <span className="text-[10px] text-slate-400">
                    {selectedPost.movieId.type || "MOVIE"} • {selectedPost.movieId.releaseYear || "Featured"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between pt-3 border-t border-slate-800">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1">
                  <Heart className="w-4 h-4 text-rose-400" /> {selectedPost.likesCount}
                </span>
                <span className="flex items-center gap-1">
                  <MessageCircle className="w-4 h-4 text-blue-400" /> {selectedPost.commentsCount}
                </span>
                {selectedPost.reportsCount > 0 && (
                  <span className="flex items-center gap-1 text-rose-400 font-semibold">
                    <Flag className="w-4 h-4" /> {selectedPost.reportsCount} Reports
                  </span>
                )}
              </div>
              <button
                onClick={() => setSelectedPost(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
