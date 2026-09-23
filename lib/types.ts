export type MovieStatus = "DRAFT" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
export type MovieType = "MOVIE" | "SERIES";

export interface IEpisode {
  _id: string;
  seasonNumber: number;
  episodeNumber: number;
  title: string;
  overview?: string;
  stillPath?: string;
  duration?: number;
  airDate?: string;
  rating?: number;
  sourceStorageId?: string;
  hlsStorageId?: string;
  hlsMasterKey?: string;
  sourceObjectKey?: string;
  sourceUrl?: string;
  fileSize?: number;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  status: MovieStatus;
  processingProgress?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IMovie {
  _id: string;
  title: string;
  slug: string;
  description?: string;
  poster?: string;
  backdrop?: string;
  type: MovieType;
  releaseYear?: number;
  genres: string[];
  duration?: number;
  rating?: number;
  director?: string;
  cast?: { name: string; character?: string; image?: string }[];
  trailerUrl?: string;
  tmdbId?: number;
  totalSeasons?: number;
  episodes?: IEpisode[];
  sourceStorageId?: string;
  hlsStorageId?: string;
  hlsMasterKey?: string;
  sourceObjectKey?: string;
  sourceUrl?: string;
  fileSize?: number;
  videoCodec?: string;
  audioCodec?: string;
  resolution?: string;
  status: MovieStatus;
  processingProgress?: number;
  processingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ITmdbSearchResult {
  id: number;
  title: string;
  type: "MOVIE" | "SERIES";
  overview: string;
  poster: string | null;
  backdrop: string | null;
  releaseDate?: string;
  releaseYear?: number;
  rating: number;
  voteCount: number;
}

export interface ITmdbDetails {
  id: number;
  title: string;
  tagline?: string;
  overview: string;
  poster: string | null;
  backdrop: string | null;
  releaseYear?: number;
  releaseDate?: string;
  genres: string[];
  duration?: number;
  rating?: number;
  voteCount?: number;
  cast: { name: string; character?: string; image?: string }[];
  director?: string;
  trailerUrl?: string;
  type: "MOVIE" | "SERIES";
  numberOfSeasons?: number;
  numberOfEpisodes?: number;
  seasons?: Array<{
    seasonNumber: number;
    name: string;
    episodeCount: number;
    overview: string;
    posterPath: string | null;
    airDate?: string;
  }>;
}


export type StorageStatus = "ACTIVE" | "INACTIVE" | "FULL" | "ERROR";

export interface IStorageAccount {
  _id: string;
  name: string;
  provider: "CLOUDFLARE_R2";
  accountId: string;
  bucketName: string;
  endpoint: string;
  publicUrl?: string;
  accessKeyIdPreview?: string;
  maxStorageBytes: number;
  usedStorageBytes: number;
  reservedStorageBytes: number;
  availableStorageBytes: number;
  usagePercentage: number;
  priority: number;
  status: StorageStatus;
  lastCheckedAt?: string;
  lastError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IAdminUser {
  _id: string;
  email: string;
  name: string;
  role: "ADMIN";
  lastLoginAt?: string;
  createdAt?: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  code?: string;
  details?: unknown;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

export interface MovieQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: MovieStatus;
  genre?: string;
  year?: number;
  sortBy?: "createdAt" | "title" | "releaseYear" | "duration";
  sortOrder?: "asc" | "desc";
}

export interface InitUploadResponse {
  uploadSessionId: string;
  uploadId?: string;
  storageAccountId: string;
  objectKey: string;
  directPutUrl?: string;
  partUrls?: { partNumber: number; url: string }[];
  status: string;
}

export interface PartETag {
  PartNumber: number;
  ETag: string;
}

export interface PlaybackResponse {
  movieId: string;
  title: string;
  type: string;
  url: string;
  proxyUrl?: string;
  sourceUrl?: string;
  duration?: number;
  resolution?: string;
  sourceStorageProvider?: string;
  episodeId?: string;
  seriesTitle?: string;
  episodeTitle?: string;
  seasonNumber?: number;
  episodeNumber?: number;
}

export interface TestStorageInput {
  accountId: string;
  bucketName: string;
  endpoint: string;
  accessKeyId: string;
  secretAccessKey: string;
}

export interface CreateStorageInput extends TestStorageInput {
  name: string;
  publicUrl?: string;
  maxStorageBytes?: number;
  priority?: number;
  status?: "ACTIVE" | "INACTIVE";
}

export type UploadSessionStatus =
  | "INITIALIZED"
  | "UPLOADING"
  | "DOWNLOADING"
  | "COMPLETED"
  | "FAILED"
  | "ABORTED";

export interface IUploadSession {
  _id: string;
  movieId?: string;
  episodeId?: string;
  storageAccountId: string;
  fileName: string;
  fileSize: number;
  uploadedBytes: number;
  progress: number;
  status: UploadSessionStatus;
  sourceType?: "LOCAL_UPLOAD" | "REMOTE_URL";
  remoteUrl?: string;
  downloadSpeedBytesPerSec?: number;
  etaSeconds?: number;
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface InitRemoteDownloadResponse {
  sessionId: string;
  objectKey: string;
  fileName: string;
  fileSize: number;
  status: string;
}
