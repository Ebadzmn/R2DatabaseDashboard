export type MovieStatus = "DRAFT" | "UPLOADING" | "PROCESSING" | "READY" | "FAILED";
export type MovieType = "MOVIE" | "SERIES";

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
  duration?: number;
  resolution?: string;
  sourceStorageProvider?: string;
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
