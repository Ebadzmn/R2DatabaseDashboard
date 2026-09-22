"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { IMovie, IStorageAccount } from "@/lib/types";
import { useToast } from "@/components/ui/Toast";

// Layout Components
import { Sidebar, NavTab } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";

// Views
import { OverviewStats } from "@/components/dashboard/OverviewStats";
import { MovieList } from "@/components/movies/MovieList";
import { MovieModal } from "@/components/movies/MovieModal";
import { MoviePlaybackModal } from "@/components/movies/MoviePlaybackModal";
import { StorageList } from "@/components/storage/StorageList";
import { AddStorageModal } from "@/components/storage/AddStorageModal";
import { UploadStudio } from "@/components/uploads/UploadStudio";

export default function DashboardPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const { success, error, info } = useToast();

  const [currentTab, setCurrentTab] = useState<NavTab>("overview");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Data states
  const [movies, setMovies] = useState<IMovie[]>([]);
  const [storages, setStorages] = useState<IStorageAccount[]>([]);
  const [loadingData, setLoadingData] = useState(true);

  // Modals
  const [isCreateMovieModalOpen, setIsCreateMovieModalOpen] = useState(false);
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [playbackMovie, setPlaybackMovie] = useState<IMovie | null>(null);
  const [isAddStorageModalOpen, setIsAddStorageModalOpen] = useState(false);

  // Redirect to login if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, authLoading, router]);

  // Fetch all primary dashboard data
  const fetchData = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const [moviesRes, storageRes] = await Promise.all([
        api.movies.getAll({ limit: 100 }),
        api.storage.getAll(),
      ]);
      setMovies(moviesRes.data || []);
      setStorages(storageRes.data || []);
    } catch (err: any) {
      console.error("Failed to load dashboard data:", err);
    } finally {
      setLoadingData(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated, fetchData]);

  // Periodic polling if any movie is currently transcoding
  useEffect(() => {
    const hasTranscoding = movies.some(
      (m) => m.status === "PROCESSING" || m.status === "UPLOADING"
    );

    if (!hasTranscoding) return;

    const interval = setInterval(() => {
      api.movies
        .getAll({ limit: 100 })
        .then((res) => {
          setMovies(res.data || []);
        })
        .catch(() => {});
    }, 4000);

    return () => clearInterval(interval);
  }, [movies]);

  // Movie Handlers
  const handleCreateMovie = async (data: Partial<IMovie>) => {
    try {
      await api.movies.create(data);
      success("Movie Created", `"${data.title}" successfully added to the catalog.`);
      await fetchData();
    } catch (err: any) {
      error("Creation Failed", err.message || "Could not create movie record.");
      throw err;
    }
  };

  const handleUpdateMovie = async (data: Partial<IMovie>) => {
    if (!editingMovie) return;
    try {
      await api.movies.update(editingMovie._id, data);
      success("Movie Updated", `"${data.title || editingMovie.title}" has been updated.`);
      setEditingMovie(null);
      await fetchData();
    } catch (err: any) {
      error("Update Failed", err.message || "Could not update movie record.");
      throw err;
    }
  };

  const handleDeleteMovie = async (id: string) => {
    const movie = movies.find((m) => m._id === id);
    if (!confirm(`Are you sure you want to delete "${movie?.title || "this movie"}"? R2 objects and HLS segments will be purged.`)) {
      return;
    }

    try {
      await api.movies.delete(id);
      success("Movie Deleted", "Movie and its Cloudflare R2 assets queued for deletion.");
      setMovies((prev) => prev.filter((m) => m._id !== id));
    } catch (err: any) {
      error("Delete Failed", err.message || "Could not delete movie.");
    }
  };

  const handleReprocessMovie = async (id: string) => {
    try {
      await api.movies.reprocess(id);
      info("Processing Queued", "BullMQ background video transcoding has been queued.");
      setMovies((prev) =>
        prev.map((m) => (m._id === id ? { ...m, status: "PROCESSING", processingProgress: 0 } : m))
      );
    } catch (err: any) {
      error("Transcode Request Failed", err.message || "Could not queue processing.");
    }
  };

  // Storage Handlers
  const handleRecalculateStorage = async (id: string) => {
    try {
      info("Synchronizing", "Querying Cloudflare R2 bucket objects directly...");
      const res = await api.storage.recalculate(id);
      success(
        "Usage Recalculated",
        `R2 Bucket contains ${res.data.totalObjects} objects (${(res.data.totalBytes / (1024 * 1024 * 1024)).toFixed(2)} GB).`
      );
      await fetchData();
    } catch (err: any) {
      error("Recalculation Failed", err.message || "Failed to synchronize with R2 bucket.");
    }
  };

  const handleToggleStorageStatus = async (id: string, currentStatus: string) => {
    try {
      if (currentStatus === "ACTIVE") {
        await api.storage.deactivate(id);
        success("Storage Deactivated", "Node will no longer receive new upload reservations.");
      } else {
        await api.storage.activate(id);
        success("Storage Activated", "Node is now active for upload capacity rotation.");
      }
      await fetchData();
    } catch (err: any) {
      error("Action Failed", err.message || "Failed to toggle storage node status.");
    }
  };

  const handleDeleteStorage = async (id: string) => {
    if (!confirm("Are you sure you want to remove this storage account from the cluster?")) {
      return;
    }

    try {
      await api.storage.delete(id);
      success("Storage Removed", "R2 account deleted from active storage registry.");
      setStorages((prev) => prev.filter((s) => s._id !== id));
    } catch (err: any) {
      error("Deletion Blocked", err.message || "Could not delete storage account.");
    }
  };

  if (authLoading || (!isAuthenticated && !authLoading)) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center text-slate-400">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono">Authenticating CineCore Admin...</span>
        </div>
      </div>
    );
  }

  const getTabTitle = () => {
    switch (currentTab) {
      case "overview":
        return {
          title: "Platform Overview",
          subtitle: "Real-time metrics, R2 storage gauge, and streaming operations",
        };
      case "movies":
        return {
          title: "Movies Studio",
          subtitle: "Manage video metadata, adaptive HLS streams, and transcoding jobs",
        };
      case "storage":
        return {
          title: "Cloudflare R2 Storage Nodes",
          subtitle: "Dynamic multi-storage accounts with zero-downtime automated rotation",
        };
      case "upload":
        return {
          title: "Direct-to-R2 Upload Station",
          subtitle: "Direct multipart presigned uploads bypassing server memory limits",
        };
    }
  };

  const activeStoragesCount = storages.filter((s) => s.status === "ACTIVE").length;
  const tabHeader = getTabTitle();

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeStoragesCount={activeStoragesCount}
        totalMoviesCount={movies.length}
      />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ${
          sidebarCollapsed ? "pl-20" : "pl-64"
        }`}
      >
        {/* Top Sticky Header */}
        <Header
          title={tabHeader.title}
          subtitle={tabHeader.subtitle}
          onOpenNewMovie={() => setIsCreateMovieModalOpen(true)}
          onOpenUpload={() => setCurrentTab("upload")}
        />

        {/* Dynamic Page Views */}
        <main className="flex-1 p-8 overflow-y-auto">
          {currentTab === "overview" && (
            <OverviewStats
              movies={movies}
              storages={storages}
              onNavigateTab={setCurrentTab}
              onSelectMovie={(m) => setPlaybackMovie(m)}
            />
          )}

          {currentTab === "movies" && (
            <MovieList
              movies={movies}
              onSelectMovie={(m) => setPlaybackMovie(m)}
              onEditMovie={(m) => setEditingMovie(m)}
              onDeleteMovie={handleDeleteMovie}
              onPlayMovie={(m) => setPlaybackMovie(m)}
              onReprocessMovie={handleReprocessMovie}
              onOpenCreate={() => setIsCreateMovieModalOpen(true)}
              onRefresh={fetchData}
              isLoading={loadingData}
            />
          )}

          {currentTab === "storage" && (
            <StorageList
              storages={storages}
              onOpenAddModal={() => setIsAddStorageModalOpen(true)}
              onRecalculate={handleRecalculateStorage}
              onToggleStatus={handleToggleStorageStatus}
              onDelete={handleDeleteStorage}
              onRefresh={fetchData}
              isLoading={loadingData}
            />
          )}

          {currentTab === "upload" && (
            <UploadStudio
              movies={movies}
              onUploadSuccess={fetchData}
              onNavigateMovies={() => setCurrentTab("movies")}
            />
          )}
        </main>
      </div>

      {/* Create Movie Modal */}
      <MovieModal
        isOpen={isCreateMovieModalOpen}
        onClose={() => setIsCreateMovieModalOpen(false)}
        onSubmit={handleCreateMovie}
      />

      {/* Edit Movie Modal */}
      <MovieModal
        isOpen={!!editingMovie}
        onClose={() => setEditingMovie(null)}
        onSubmit={handleUpdateMovie}
        initialData={editingMovie}
        isEditing={true}
      />

      {/* HLS Playback Modal */}
      <MoviePlaybackModal
        movie={playbackMovie}
        isOpen={!!playbackMovie}
        onClose={() => setPlaybackMovie(null)}
      />

      {/* Add R2 Storage Modal */}
      <AddStorageModal
        isOpen={isAddStorageModalOpen}
        onClose={() => setIsAddStorageModalOpen(false)}
        onSuccess={fetchData}
      />
    </div>
  );
}
