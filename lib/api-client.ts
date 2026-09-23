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
} from "./types";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:5003/api";

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

      throw new ApiError(
        json.message || `Request failed with status ${res.status}`,
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

  // Movies Management
  movies: {
    getAll: (params: MovieQueryParams = {}) => {
      const query = new URLSearchParams();
      if (params.page) query.append("page", params.page.toString());
      if (params.limit) query.append("limit", params.limit.toString());
      if (params.search) query.append("search", params.search);
      if (params.status) query.append("status", params.status);
      if (params.genre) query.append("genre", params.genre);
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
};

export { ApiError };
