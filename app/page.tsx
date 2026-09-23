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
import { SeriesList } from "@/components/movies/SeriesList";
import { MovieModal } from "@/components/movies/MovieModal";
import { MoviePlaybackModal } from "@/components/movies/MoviePlaybackModal";
import { SeriesEpisodesModal } from "@/components/movies/SeriesEpisodesModal";
import { StorageList } from "@/components/storage/StorageList";
import { AddStorageModal } from "@/components/storage/AddStorageModal";
import { UploadStudio } from "@/components/uploads/UploadStudio";
import { ConfirmDeleteModal } from "@/components/ui/ConfirmDeleteModal";
import { IEpisode } from "@/lib/types";

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
  const [createModalMediaType, setCreateModalMediaType] = useState<"MOVIE" | "SERIES">("MOVIE");
  const [editingMovie, setEditingMovie] = useState<IMovie | null>(null);
  const [playbackMovie, setPlaybackMovie] = useState<IMovie | null>(null);
  const [playbackEpisode, setPlaybackEpisode] = useState<{ series: IMovie; episode: IEpisode } | null>(null);
  const [deleteTargetMovie, setDeleteTargetMovie] = useState<IMovie | null>(null);
  const [isAddStorageModalOpen, setIsAddStorageModalOpen] = useState(false);
  const [targetMovieForUpload, setTargetMovieForUpload] = useState<IMovie | null>(null);
  const [targetEpisodeForUpload, setTargetEpisodeForUpload] = useState<IEpisode | null>(null);
  const [episodesModalSeries, setEpisodesModalSeries] = useState<IMovie | null>(null);

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

  // Periodic background sync for transcoding movies and R2 storage
  useEffect(() => {
    if (!isAuthenticated) return;

    // Periodic storage & catalog sync every 10 seconds
    const syncInterval = setInterval(() => {
      api.storage.getAll().then((res) => {
        if (res.data) setStorages(res.data);
      }).catch(() => {});
    }, 10000);

    return () => clearInterval(syncInterval);
  }, [isAuthenticated]);

  // Fast polling if any movie is currently transcoding
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
    }, 1500);

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

  const handleDeleteMoviePrompt = (id: string) => {
    const movie = movies.find((m) => m._id === id);
    if (movie) {
      setDeleteTargetMovie(movie);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteTargetMovie) return;
    const id = deleteTargetMovie._id;
    try {
      await api.movies.delete(id);
      success("Movie Deleted", `"${deleteTargetMovie.title}" and its R2 storage assets were deleted.`);
      setMovies((prev) => prev.filter((m) => m._id !== id));
      setDeleteTargetMovie(null);
    } catch (err: any) {
      error("Delete Failed", err.message || "Could not delete movie.");
      throw err;
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
      case "series":
        return {
          title: "Series & Shows Studio",
          subtitle: "Manage TV series, episodes, TMDB auto-imported seasons, and streaming",
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
  const singleMovies = movies.filter((m) => m.type === "MOVIE" || !m.type);
  const seriesList = movies.filter((m) => m.type === "SERIES");
  const tabHeader = getTabTitle();

  const handleOpenCreateMovie = () => {
    setCreateModalMediaType("MOVIE");
    setIsCreateMovieModalOpen(true);
  };

  const handleOpenCreateSeries = () => {
    setCreateModalMediaType("SERIES");
    setIsCreateMovieModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-slate-100 flex">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onTabChange={setCurrentTab}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        activeStoragesCount={activeStoragesCount}
        totalMoviesCount={singleMovies.length}
        totalSeriesCount={seriesList.length}
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
          onOpenNewMovie={handleOpenCreateMovie}
          onOpenNewSeries={handleOpenCreateSeries}
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
              movies={singleMovies}
              onSelectMovie={(m) => setPlaybackMovie(m)}
              onEditMovie={(m) => setEditingMovie(m)}
              onDeleteMovie={handleDeleteMoviePrompt}
              onPlayMovie={(m) => setPlaybackMovie(m)}
              onReprocessMovie={handleReprocessMovie}
              onUploadVideo={(m) => {
                setTargetMovieForUpload(m);
                setCurrentTab("upload");
              }}
              onOpenCreate={handleOpenCreateMovie}
              onRefresh={fetchData}
              isLoading={loadingData}
            />
          )}

          {currentTab === "series" && (
            <SeriesList
              series={seriesList}
              onSelectSeries={(s) => setEpisodesModalSeries(s)}
              onEditSeries={(s) => setEditingMovie(s)}
              onDeleteSeries={handleDeleteMoviePrompt}
              onPlaySeries={(s) => setPlaybackMovie(s)}
              onReprocessSeries={handleReprocessMovie}
              onUploadVideo={(s) => {
                setTargetMovieForUpload(s);
                setTargetEpisodeForUpload(null);
                setCurrentTab("upload");
              }}
              onManageEpisodes={(s) => setEpisodesModalSeries(s)}
              onOpenCreate={handleOpenCreateSeries}
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
              storages={storages}
              initialTargetMovie={targetMovieForUpload}
              initialTargetEpisode={targetEpisodeForUpload}
              onUploadSuccess={fetchData}
              onNavigateMovies={() => setCurrentTab("movies")}
              onNavigateSeries={() => setCurrentTab("series")}
            />
          )}
        </main>
      </div>

      {/* Create Movie/Series Modal */}
      <MovieModal
        isOpen={isCreateMovieModalOpen}
        onClose={() => setIsCreateMovieModalOpen(false)}
        onSubmit={handleCreateMovie}
        defaultType={createModalMediaType}
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
        episode={playbackEpisode?.episode}
        isOpen={!!playbackMovie}
        onClose={() => {
          setPlaybackMovie(null);
          setPlaybackEpisode(null);
        }}
      />

      {/* Series Seasons & Episodes Studio Modal */}
      <SeriesEpisodesModal
        series={episodesModalSeries}
        isOpen={!!episodesModalSeries}
        onClose={() => setEpisodesModalSeries(null)}
        onUploadForEpisode={(s, ep) => {
          setEpisodesModalSeries(null);
          setTargetMovieForUpload(s);
          setTargetEpisodeForUpload(ep);
          setCurrentTab("upload");
        }}
        onPlayEpisode={(s, ep) => {
          setPlaybackEpisode({ series: s, episode: ep });
          setPlaybackMovie(s);
        }}
        onRefreshSeries={async () => {
          await fetchData();
          if (episodesModalSeries) {
            try {
              const res = await api.movies.getById(episodesModalSeries._id);
              if (res.data) setEpisodesModalSeries(res.data);
            } catch (e) {}
          }
        }}
      />

      {/* Confirm Delete & Purge Modal */}
      <ConfirmDeleteModal
        isOpen={!!deleteTargetMovie}
        movie={deleteTargetMovie}
        onClose={() => setDeleteTargetMovie(null)}
        onConfirm={handleConfirmDelete}
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
