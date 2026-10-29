import {
  ApiResponse,
  IAdminUser,
  IMovie,
  IStorageAccount,
  MovieQueryParams,
  InitUploadResponse,
  PartETag,
  PlaybackResponse,
  TestStorageInput,
  CreateStorageInput,
  ITmdbSearchResult,
  ITmdbDetails,
  IUploadSession,
  InitRemoteDownloadResponse,
  IAppUser,
  IUserStats,
  UserQueryParams,
  ICategory,
  IGenre,
  IHeroBanner,
  IHomeSection,
  ICommunityPost,
  IPostComment,
  IPostReport,
  IFeedStats,
  IModerationAudit,
  PostStatus,
  ReportStatus,
  ReportContentType,
  ISystemStatus,
  IAppUpdateConfig,
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5000/api";

class ApiError extends Error {
  public code?: string;
  public status: number;
  public details?: unknown;

  constructor(message: string, status: number, code?: string, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("admin_token");
  }
  return null;
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ data: T; meta?: ApiResponse["meta"]; message?: string }> {
  const url = `${API_BASE_URL}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
  const token = getToken();

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const json: ApiResponse<T> = await res.json().catch(() => ({
      success: false,
      message: `Failed to parse response (Status: ${res.status})`,
    }));

    if (!res.ok || !json.success) {
      if (res.status === 401 && typeof window !== "undefined") {
        localStorage.removeItem("admin_token");
        localStorage.removeItem("admin_user");
        // Dispatch custom event for auth listeners
        window.dispatchEvent(new Event("auth_unauthorized"));
      }

      let errMessage = json.message || `Request failed with status ${res.status}`;
      if (json.details && Array.isArray(json.details) && json.details.length > 0) {
        const detailMsgs = json.details
          .map((d) => (d && d.message ? `${d.path ? d.path + ": " : ""}${d.message}` : (typeof d === "string" ? d : JSON.stringify(d))))
          .join(", ");
        errMessage = `${errMessage}: ${detailMsgs}`;
      }

      throw new ApiError(
        errMessage,
        res.status,
        json.code,
        json.details
      );
    }

    return {
      data: json.data as T,
      meta: json.meta,
      message: json.message,
    };
  } catch (err: any) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(
      err.message || "Network error. Backend server may be offline.",
      0,
      "NETWORK_ERROR"
    );
  }
}

export const api = {
  // System Health
  health: () => request<{ status: string; uptime: number; timestamp: string }>("/health"),

  // Authentication
  auth: {
    login: async (email: string, password: string) => {
      const res = await request<{ token: string; user: IAdminUser }>("/admin/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      if (typeof window !== "undefined" && res.data.token) {
        localStorage.setItem("admin_token", res.data.token);
        localStorage.setItem("admin_user", JSON.stringify(res.data.user));
      }
      return res;
    },
    logout: async () => {
      try {
        await request("/admin/auth/logout", { method: "POST" });
      } finally {
        if (typeof window !== "undefined") {
          localStorage.removeItem("admin_token");
          localStorage.removeItem("admin_user");
        }
      }
    },
    me: () => request<IAdminUser>("/admin/auth/me"),
  },

  // Storage Accounts Management
  storage: {
    getAll: () => request<IStorageAccount[]>("/admin/storage"),
    getById: (id: string) => request<IStorageAccount>(`/admin/storage/${id}`),
    test: (input: TestStorageInput) =>
      request<{ success: boolean; message: string }>("/admin/storage/test", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    create: (input: CreateStorageInput) =>
      request<IStorageAccount>("/admin/storage", {
        method: "POST",
        body: JSON.stringify(input),
      }),
    update: (id: string, input: Partial<CreateStorageInput>) =>
      request<IStorageAccount>(`/admin/storage/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      }),
    delete: (id: string) =>
      request<void>(`/admin/storage/${id}`, { method: "DELETE" }),
    recalculate: (id: string) =>
      request<{ totalObjects: number; totalBytes: number }>(
        `/admin/storage/${id}/recalculate`,
        { method: "POST" }
      ),
    activate: (id: string) =>
      request<IStorageAccount>(`/admin/storage/${id}/activate`, { method: "POST" }),
    deactivate: (id: string) =>
      request<IStorageAccount>(`/admin/storage/${id}/deactivate`, { method: "POST" }),
  },

  // Categories Management
  categories: {
    getAll: (includeInactive: boolean = true) =>
      request<ICategory[]>(`/admin/categories?includeInactive=${includeInactive}`),
    getPublic: () => request<ICategory[]>("/categories"),
    getById: (id: string) => request<ICategory>(`/admin/categories/${id}`),
    create: (data: Partial<ICategory>) =>
      request<ICategory>("/admin/categories", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<ICategory>) =>
      request<ICategory>(`/admin/categories/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/admin/categories/${id}`, { method: "DELETE" }),
  },

  // Genres Management
  genres: {
    getAll: (includeInactive: boolean = true) =>
      request<IGenre[]>(`/admin/genres?includeInactive=${includeInactive}`),
    getPublic: () => request<IGenre[]>("/genres"),
    getById: (id: string) => request<IGenre>(`/admin/genres/${id}`),
    create: (data: Partial<IGenre>) =>
      request<IGenre>("/admin/genres", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<IGenre>) =>
      request<IGenre>(`/admin/genres/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/admin/genres/${id}`, { method: "DELETE" }),
  },

  // Movies Management
  movies: {
    getAll: (params: MovieQueryParams = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.genre) query.append("genre", params.genre);
      if (params.category) query.append("category", params.category);
      if (params.year) query.append("year", params.year.toString());
      if (params.sortBy) query.append("sortBy", params.sortBy);
      if (params.sortOrder) query.append("sortOrder", params.sortOrder);

      const qs = query.toString();
      return request<IMovie[]>(`/admin/movies${qs ? `?${qs}` : ""}`);
    },
    getById: (id: string) => request<IMovie>(`/admin/movies/${id}`),
    create: (data: Partial<IMovie>) =>
      request<IMovie>("/admin/movies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<IMovie>) =>
      request<IMovie>(`/admin/movies/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<void>(`/admin/movies/${id}`, { method: "DELETE" }),
    togglePin: (id: string) =>
      request<IMovie>(`/admin/movies/${id}/pin`, { method: "PATCH" }),
    process: (id: string) =>
      request<{ message: string }>(`/admin/movies/${id}/process`, { method: "POST" }),
    reprocess: (id: string) =>
      request<{ message: string }>(`/admin/movies/${id}/reprocess`, { method: "POST" }),
    getStatus: (id: string) =>
      request<{
        status: IMovie["status"];
        progress: number;
        error?: string;
        metadata?: {
          duration?: number;
          resolution?: string;
          videoCodec?: string;
          audioCodec?: string;
        };
        episodes?: any[];
      }>(`/admin/movies/${id}/status`),
    getPlayback: (id: string) => request<PlaybackResponse>(`/movies/${id}/playback`),
    uploadScreenshot: async (
      movieId: string,
      file: File,
      options?: { seasonNumber?: number; episodeNumber?: number }
    ) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return request<{ url: string; screenshots: string[] }>(
        `/admin/movies/${movieId}/screenshots/upload`,
        {
          method: "POST",
          body: JSON.stringify({
            image: base64,
            filename: file.name,
            seasonNumber: options?.seasonNumber,
            episodeNumber: options?.episodeNumber,
          }),
        }
      );
    },
    uploadImage: async (file: File) => {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      return request<{ url: string; key: string }>("/admin/movies/upload-image", {
        method: "POST",
        body: JSON.stringify({
          image: base64,
          filename: file.name,
        }),
      });
    },
    captureScreenshots: (id: string, seasonNumber?: number, episodeNumber?: number) => {
      const qs =
        seasonNumber !== undefined && episodeNumber !== undefined
          ? `?season=${seasonNumber}&episode=${episodeNumber}`
          : "";
      return request<{ screenshots: string[] }>(
        `/admin/movies/${id}/screenshots/capture${qs}`,
        { method: "POST" }
      );
    },
    // Series Episodes
    addEpisode: (
      id: string,
      data: {
        seasonNumber: number;
        episodeNumber: number;
        title: string;
        overview?: string;
        stillPath?: string;
        duration?: number;
        airDate?: string;
        rating?: number;
      }
    ) =>
      request<any>(`/admin/movies/${id}/episodes`, {
        method: "POST",
        body: JSON.stringify(data),
      }),
    updateEpisode: (id: string, episodeId: string, data: Partial<any>) =>
      request<any>(`/admin/movies/${id}/episodes/${episodeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    deleteEpisode: (id: string, episodeId: string) =>
      request<void>(`/admin/movies/${id}/episodes/${episodeId}`, { method: "DELETE" }),
    importTmdbEpisodes: (id: string) =>
      request<IMovie>(`/admin/movies/${id}/seasons/import-tmdb`, { method: "POST" }),
    getEpisodePlayback: (id: string, season: number, episode: number) =>
      request<PlaybackResponse>(`/movies/${id}/seasons/${season}/episodes/${episode}/playback`),
  },

  // Direct-to-R2 Upload Management
  uploads: {
    init: (data: {
      fileName: string;
      fileSize: number;
      contentType?: string;
      movieId?: string;
      episodeId?: string;
      seasonNumber?: number;
      episodeNumber?: number;
      storageAccountId?: string;
      partCount?: number;
    }) =>
      request<InitUploadResponse>("/admin/uploads/init", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    getPartUrls: (sessionId: string, startPart: number, count: number) =>
      request<{ partNumber: number; url: string }[]>(
        `/admin/uploads/${sessionId}/part-urls?startPart=${startPart}&count=${count}`
      ),
    complete: (sessionId: string, parts?: PartETag[]) =>
      request<any>(`/admin/uploads/${sessionId}/complete`, {
        method: "POST",
        body: JSON.stringify({ parts }),
      }),
    abort: (sessionId: string) =>
      request<any>(`/admin/uploads/${sessionId}/abort`, { method: "POST" }),
    getById: (sessionId: string) => request<IUploadSession>(`/admin/uploads/${sessionId}`),
    initRemoteDownload: (data: {
      url: string;
      fileName?: string;
      movieId?: string;
      episodeId?: string;
      seasonNumber?: number;
      episodeNumber?: number;
      storageAccountId?: string;
    }) =>
      request<InitRemoteDownloadResponse>("/admin/uploads/remote-url", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    cancelRemoteDownload: (sessionId: string) =>
      request<{ success: boolean; message: string }>(
        `/admin/uploads/remote-url/${sessionId}/cancel`,
        { method: "POST" }
      ),
    uploadChunkEndpoint: (sessionId: string, partNumber: number) => ({
      url: `${API_BASE_URL}/admin/uploads/${sessionId}/part/${partNumber}`,
      token: getToken(),
    }),
    uploadDirectEndpoint: (sessionId: string) => ({
      url: `${API_BASE_URL}/admin/uploads/${sessionId}/direct`,
      token: getToken(),
    }),
  },

  // TMDB Metadata Integration
  tmdb: {
    search: (query: string, type: "movie" | "tv" | "multi" = "multi", page = 1) =>
      request<{
        page: number;
        totalResults: number;
        totalPages: number;
        results: ITmdbSearchResult[];
      }>(`/admin/tmdb/search?query=${encodeURIComponent(query)}&type=${type}&page=${page}`),
    getDetails: (id: string | number, type: "movie" | "tv" = "movie") =>
      request<ITmdbDetails>(`/admin/tmdb/details/${id}?type=${type}`),
    getSeasonEpisodes: (tvId: string | number, seasonNumber: number) =>
      request<{
        seasonNumber: number;
        name: string;
        overview: string;
        posterPath: string | null;
        episodes: Array<{
          episodeNumber: number;
          title: string;
          overview: string;
          duration?: number;
          stillPath: string | null;
          airDate?: string;
          rating: number;
        }>;
      }>(`/admin/tmdb/tv/${tvId}/season/${seasonNumber}`),
  },

  // End-Users & Guest Management
  users: {
    getAll: (params: UserQueryParams = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.status && params.status !== "ALL") query.append("status", params.status);
      if (params.type && params.type !== "ALL") query.append("type", params.type);
      if (params.sortBy) query.append("sortBy", params.sortBy);
      if (params.sortOrder) query.append("sortOrder", params.sortOrder);

      const qs = query.toString();
      return request<{ users: IAppUser[]; stats: IUserStats }>(
        `/admin/users${qs ? `?${qs}` : ""}`
      );
    },
    getStats: () => request<IUserStats>("/admin/users/stats"),
    getById: (id: string) => request<IAppUser>(`/admin/users/${id}`),
    block: (id: string, reason?: string) =>
      request<IAppUser>(`/admin/users/${id}/block`, {
        method: "POST",
        body: JSON.stringify({ reason }),
      }),
    unblock: (id: string) =>
      request<IAppUser>(`/admin/users/${id}/unblock`, {
        method: "POST",
      }),
    updateStatus: (id: string, status: "ACTIVE" | "BLOCKED", reason?: string) =>
      request<IAppUser>(`/admin/users/${id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status, reason }),
      }),
    delete: (id: string) =>
      request<{ id: string; deleted: boolean }>(`/admin/users/${id}`, {
        method: "DELETE",
      }),
  },
  banners: {
    getAll: () => request<IHeroBanner[]>("/admin/banners"),
    create: (data: Partial<IHeroBanner>) =>
      request<IHeroBanner>("/admin/banners", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<IHeroBanner>) =>
      request<IHeroBanner>(`/admin/banners/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/admin/banners/${id}`, {
        method: "DELETE",
      }),
    reorder: (orderedIds: string[]) =>
      request<{ reordered: boolean }>("/admin/banners/reorder", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      }),
  },
  sections: {
    getAll: () => request<IHomeSection[]>("/admin/home-sections"),
    getById: (id: string) => request<IHomeSection>(`/admin/home-sections/${id}`),
    create: (data: Partial<IHomeSection>) =>
      request<IHomeSection>("/admin/home-sections", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: string, data: Partial<IHomeSection>) =>
      request<IHomeSection>(`/admin/home-sections/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateItems: (
      id: string,
      items: Array<{ movieId: string; order?: number; customTag?: string }>
    ) =>
      request<IHomeSection>(`/admin/home-sections/${id}/items`, {
        method: "PUT",
        body: JSON.stringify({ items }),
      }),
    delete: (id: string) =>
      request<{ deleted: boolean }>(`/admin/home-sections/${id}`, {
        method: "DELETE",
      }),
    reorder: (orderedIds: string[]) =>
      request<{ reordered: boolean }>("/admin/home-sections/reorder", {
        method: "PUT",
        body: JSON.stringify({ orderedIds }),
      }),
  },
  // Community Feed Moderation
  community: {
    getStats: () => request<IFeedStats>("/admin/community/stats"),
    getPosts: (params: { page?: number; limit?: number; status?: PostStatus; search?: string; minReports?: number } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status) query.append("status", params.status);
      if (params.search) query.append("search", params.search);
      if (params.minReports) query.append("minReports", params.minReports.toString());
      const qs = query.toString();
      return request<ICommunityPost[]>(
        `/admin/community/posts${qs ? `?${qs}` : ""}`
      );
    },
    moderatePost: (id: string, action: "REMOVE" | "RESTORE" | "HIDE", reason?: string) =>
      request<ICommunityPost>(`/admin/community/posts/${id}/moderate`, {
        method: "PATCH",
        body: JSON.stringify({ action, reason }),
      }),
    deletePost: (id: string) =>
      request<{ success: boolean }>(`/admin/community/posts/${id}`, {
        method: "DELETE",
      }),
    getReports: (params: { page?: number; limit?: number; status?: string; reason?: string; contentType?: ReportContentType; postId?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.status && params.status !== "ALL") query.append("status", params.status);
      if (params.reason && params.reason !== "ALL") query.append("reason", params.reason);
      if (params.postId) query.append("postId", params.postId);
      if (params.contentType) query.append("contentType", params.contentType);
      const qs = query.toString();
      return request<IPostReport[]>(
        `/admin/community/reports${qs ? `?${qs}` : ""}`
      );
    },
    resolveReport: (id: string, data: { status: ReportStatus; adminNotes?: string; userNotification?: string; actionOnContent?: "REMOVE" | "RESTORE" | "NONE"; contentRemovalReason?: string }) =>
      request<IPostReport>(`/admin/community/reports/${id}/resolve`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    getModerationHistory: (params: { page?: number; limit?: number; search?: string; action?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.action && params.action !== "ALL") query.append("action", params.action);
      const qs = query.toString();
      return request<IModerationAudit[]>(
        `/admin/community/history${qs ? `?${qs}` : ""}`
      );
    },
    getComments: (params: { page?: number; limit?: number; search?: string } = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      const qs = query.toString();
      return request<IPostComment[]>(
        `/admin/community/comments${qs ? `?${qs}` : ""}`
      );
    },
    deleteComment: (id: string) =>
      request<{ success: boolean }>(`/admin/community/comments/${id}`, {
        method: "DELETE",
      }),
  },
  system: {
    getStatus: () => request<ISystemStatus>("/admin/system/status"),
    updateStatus: (data: {
      isMaintenance: boolean;
      title?: string;
      message?: string;
      estimatedDowntime?: string;
      supportContact?: string;
    }) =>
      request<ISystemStatus>("/admin/system/status", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    updateAppUpdate: (data: Partial<IAppUpdateConfig>) =>
      request<ISystemStatus>("/admin/system/app-update", {
        method: "PUT",
        body: JSON.stringify(data),
      }),
  },
};

export { ApiError };