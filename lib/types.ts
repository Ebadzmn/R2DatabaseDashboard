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
  screenshots?: string[];
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
  category?: string;
  categoryId?: string;
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
  screenshots?: string[];
  isPinned?: boolean;
  pinnedAt?: string;
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
  category?: string;
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
  | "DOWNLOADING"
  | "UPLOADING"
  | "COMPLETING"
  | "UPLOADED"
  | "PROCESSING"
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

// User Management Types
export type UserStatus = "ACTIVE" | "BLOCKED";

export interface IAppUser {
  id: string;
  _id?: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isGuest: boolean;
  status: UserStatus;
  blockReason?: string;
  blockedAt?: string;
  deviceId?: string;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IUserStats {
  totalUsers: number;
  activeUsers: number;
  blockedUsers: number;
  guestUsers: number;
  registeredUsers: number;
}

export interface UserQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: "ALL" | "ACTIVE" | "BLOCKED";
  type?: "ALL" | "REGISTERED" | "GUEST";
  sortBy?: "createdAt" | "lastLoginAt" | "displayName" | "email";
  sortOrder?: "asc" | "desc";
}

export interface ICategory {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  description?: string;
  order: number;
  isActive: boolean;
  movieCount?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface IGenre {
  _id: string;
  name: string;
  slug: string;
  icon: string;
  gradientStart?: string;
  gradientEnd?: string;
  description?: string;
  order: number;
  isActive: boolean;
  count?: number;
  createdAt?: string;
  updatedAt?: string;
}

export type BannerMediaType = "MOVIE" | "SERIES" | "CUSTOM";
export type BannerCtaAction = "PLAY" | "DETAILS" | "LINK";

export interface IHeroBanner {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  mediaType: BannerMediaType;
  movieId?: string | any;
  customImageUrl?: string;
  badge?: string;
  ctaText?: string;
  ctaAction?: BannerCtaAction;
  targetUrl?: string;
  order: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type SectionType = "TOP_10" | "MOVIE_ROW" | "SERIES_ROW" | "GRID" | "BANNER";
export type SectionContentType = "MOVIE" | "SERIES" | "MIXED";

export interface ISectionItem {
  movieId: string | any;
  order: number;
  customTag?: string;
  addedAt?: string;
}

export interface IHomeSection {
  _id: string;
  key: string;
  title: string;
  subtitle?: string;
  sectionType: SectionType;
  contentType: SectionContentType;
  items: ISectionItem[];
  maxItems?: number;
  order: number;
  isActive: boolean;
  isSystem: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface IWatchHistory {
  _id: string;
  userId: string;
  movieId: string | IMovie;
  movieType: "MOVIE" | "SERIES";
  seasonNumber?: number;
  episodeNumber?: number;
  episodeTitle?: string;
  positionSeconds: number;
  durationSeconds: number;
  progressPercentage: number;
  status: "NOT_COMPLETED" | "IN_PROGRESS" | "COMPLETED";
  lastAction?: string;
  lastWatchedAt: string;
  title: string;
  poster?: string;
  backdrop?: string;
  genres?: string[];
  createdAt?: string;
  updatedAt?: string;
}




// ==========================================
// Community Feed Types
// ==========================================
export type PostStatus = "ACTIVE" | "HIDDEN" | "REMOVED";
export type CommentStatus = "ACTIVE" | "REMOVED";
export type ReportContentType = "POST" | "COMMENT";
export type ReportStatus = "PENDING" | "UNDER_REVIEW" | "ACTION_TAKEN" | "REJECTED" | "RESOLVED" | "DISMISSED";
export type ReportReason =
  | "SPAM"
  | "INAPPROPRIATE"
  | "COPYRIGHT"
  | "HARASSMENT"
  | "MISLEADING"
  | "OTHER";

export interface ICommunityAuthor {
  _id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  isGuest?: boolean;
  status?: string;
}

export interface ICommunityPost {
  _id: string;
  authorId: ICommunityAuthor;
  caption: string;
  images: string[];
  movieId?: IMovie;
  likesCount: number;
  commentsCount: number;
  reportsCount: number;
  status: PostStatus;
  moderationReason?: string;
  moderatedBy?: string;
  moderatedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface IPostComment {
  _id: string;
  postId: string | { _id: string; caption?: string; images?: string[]; status?: string };
  authorId: ICommunityAuthor;
  content: string;
  status: CommentStatus;
  moderationReason?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IPostReport {
  _id: string;
  reportedContentType: ReportContentType;
  contentId: string;
  postId?: {
    _id: string;
    caption?: string;
    images?: string[];
    status?: string;
    authorId?: ICommunityAuthor;
  };
  reporterId: ICommunityAuthor;
  contentOwnerId?: ICommunityAuthor;
  reason: ReportReason;
  details?: string;
  status: ReportStatus;
  actionTaken?: string;
  userNotification?: string;
  adminNotes?: string;
  reviewedBy?: string;
  reviewedAt?: string;
  commentPreview?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface IFeedStats {
  totalPosts: number;
  totalComments: number;
  totalLikes: number;
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  removedPosts: number;
}

export interface IModerationAudit {
  _id: string;
  targetType: "POST" | "COMMENT";
  targetId: string;
  authorId: ICommunityAuthor;
  captionPreview?: string;
  images?: string[];
  movieId?: IMovie;
  action: "REMOVE" | "RESTORE" | "HIDE" | "ACTION_TAKEN" | "REJECT" | "RESOLVE";
  reason: string;
  adminId?: { _id: string; name?: string; email?: string; username?: string };
  reportIds?: string[];
  reporters?: ICommunityAuthor[];
  createdAt: string;
}

export interface IAppUpdateConfig {
  isUpdateActive: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  minVersion: string;
  title: string;
  message: string;
  releaseNotes: string[];
  downloadUrl: string;
}

export interface ISystemStatus {
  isMaintenance: boolean;
  title: string;
  message: string;
  estimatedDowntime?: string;
  supportContact?: string;
  appUpdate?: IAppUpdateConfig;
  updatedAt?: string;
}
