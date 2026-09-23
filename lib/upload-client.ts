import { api } from "./api-client";
import { PartETag } from "./types";

const PART_SIZE = 10 * 1024 * 1024; // 10MB per chunk for multipart
const MULTIPART_THRESHOLD = 50 * 1024 * 1024; // 50MB

export interface UploadProgressCallback {
  (progress: {
    percentage: number;
    loadedBytes: number;
    totalBytes: number;
    speedBytesPerSec: number;
    currentPart?: number;
    totalParts?: number;
    status: "INITIALIZING" | "UPLOADING" | "COMPLETING" | "DONE" | "ABORTED" | "ERROR";
    mode?: "DIRECT_R2" | "BACKEND_PIPELINE";
  }): void;
}

export class DirectR2Uploader {
  private file: File;
  private movieId?: string;
  private episodeId?: string;
  private seasonNumber?: number;
  private episodeNumber?: number;
  private storageAccountId?: string;
  private onProgress?: UploadProgressCallback;
  private abortController: AbortController;
  private sessionId?: string;
  private isAborted = false;
  private useBackendProxy = false;

  constructor(
    file: File,
    movieId?: string,
    storageAccountId?: string,
    onProgress?: UploadProgressCallback,
    options?: {
      episodeId?: string;
      seasonNumber?: number;
      episodeNumber?: number;
    }
  ) {
    this.file = file;
    this.movieId = movieId;
    this.storageAccountId = storageAccountId;
    this.onProgress = onProgress;
    this.episodeId = options?.episodeId;
    this.seasonNumber = options?.seasonNumber;
    this.episodeNumber = options?.episodeNumber;
    this.abortController = new AbortController();
  }

  public abort() {
    this.isAborted = true;
    this.abortController.abort();
    if (this.sessionId) {
      api.uploads.abort(this.sessionId).catch((err) => {
        console.warn("Failed to notify server of abort:", err);
      });
    }
    this.onProgress?.({
      percentage: 0,
      loadedBytes: 0,
      totalBytes: this.file.size,
      speedBytesPerSec: 0,
      status: "ABORTED",
    });
  }

  public async start(): Promise<{ sessionId: string; movieId?: string }> {
    const fileSize = this.file.size;
    const isMultipart = fileSize >= MULTIPART_THRESHOLD;
    const totalParts = isMultipart ? Math.ceil(fileSize / PART_SIZE) : 1;

    this.onProgress?.({
      percentage: 0,
      loadedBytes: 0,
      totalBytes: fileSize,
      speedBytesPerSec: 0,
      currentPart: 0,
      totalParts,
      status: "INITIALIZING",
    });

    // 1. Initialize upload session with backend
    const initRes = await api.uploads.init({
      fileName: this.file.name,
      fileSize: this.file.size,
      contentType: this.file.type || "video/mp4",
      movieId: this.movieId,
      episodeId: this.episodeId,
      seasonNumber: this.seasonNumber,
      episodeNumber: this.episodeNumber,
      storageAccountId: this.storageAccountId || undefined,
      partCount: isMultipart ? totalParts : undefined,
    });

    this.sessionId = initRes.data.uploadSessionId;
    const uploadSessionId = this.sessionId;

    const startTime = Date.now();
    let totalLoadedBytes = 0;

    if (!isMultipart && initRes.data.directPutUrl) {
      // Single direct PUT for small files (<50MB)
      let directSuccess = false;
      try {
        await this.uploadSinglePut(initRes.data.directPutUrl, startTime);
        directSuccess = true;
      } catch (err) {
        console.warn("Direct R2 single PUT failed. Falling back to backend pipeline...", err);
        await this.uploadSinglePutToBackend(uploadSessionId, startTime);
      }

      this.onProgress?.({
        percentage: 100,
        loadedBytes: fileSize,
        totalBytes: fileSize,
        speedBytesPerSec: 0,
        status: "COMPLETING",
      });

      if (directSuccess) {
        await api.uploads.complete(uploadSessionId);
      }
    } else {
      // Multipart upload for large files (>=50MB)
      const partsETags: PartETag[] = [];
      const partUrlsMap = new Map<number, string>();

      // Populate initial batch of presigned part URLs
      if (initRes.data.partUrls) {
        initRes.data.partUrls.forEach((p) => partUrlsMap.set(p.partNumber, p.url));
      }

      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (this.isAborted) throw new Error("Upload cancelled by user");

        const startByte = (partNumber - 1) * PART_SIZE;
        const endByte = Math.min(startByte + PART_SIZE, fileSize);
        const chunk = this.file.slice(startByte, endByte);

        let partUrl = partUrlsMap.get(partNumber);
        if (!partUrl && !this.useBackendProxy) {
          try {
            const fetchBatchRes = await api.uploads.getPartUrls(
              uploadSessionId,
              partNumber,
              Math.min(10, totalParts - partNumber + 1)
            );
            fetchBatchRes.data.forEach((p) => partUrlsMap.set(p.partNumber, p.url));
            partUrl = partUrlsMap.get(partNumber);
          } catch {
            this.useBackendProxy = true;
          }
        }

        let etag = "";
        let attempt = 0;
        const maxAttempts = 3;

        while (attempt < maxAttempts) {
          if (this.isAborted) throw new Error("Upload cancelled by user");
          attempt++;

          try {
            if (!this.useBackendProxy && partUrl) {
              try {
                etag = await this.uploadChunkDirectR2(
                  partUrl,
                  chunk,
                  partNumber,
                  totalParts,
                  totalLoadedBytes,
                  fileSize,
                  startTime
                );
              } catch (directErr: any) {
                console.warn(
                  `Direct R2 upload part ${partNumber} failed (likely Cloudflare CORS). Falling back to high-performance backend pipeline...`,
                  directErr
                );
                this.useBackendProxy = true;
                etag = await this.uploadChunkToBackend(
                  uploadSessionId,
                  chunk,
                  partNumber,
                  totalParts,
                  totalLoadedBytes,
                  fileSize,
                  startTime
                );
              }
            } else {
              etag = await this.uploadChunkToBackend(
                uploadSessionId,
                chunk,
                partNumber,
                totalParts,
                totalLoadedBytes,
                fileSize,
                startTime
              );
            }

            break; // Success, exit retry loop
          } catch (chunkErr: any) {
            if (this.isAborted) throw chunkErr;
            if (attempt >= maxAttempts) {
              throw new Error(
                `Failed to upload part ${partNumber} after ${maxAttempts} attempts: ${chunkErr.message}`
              );
            }
            // Backoff 1s before retry
            await new Promise((res) => setTimeout(res, 1000));
          }
        }

        partsETags.push({ PartNumber: partNumber, ETag: etag });
        totalLoadedBytes += chunk.size;
      }

      // Finalize multipart upload on backend
      this.onProgress?.({
        percentage: 99,
        loadedBytes: fileSize,
        totalBytes: fileSize,
        speedBytesPerSec: 0,
        currentPart: totalParts,
        totalParts,
        status: "COMPLETING",
        mode: this.useBackendProxy ? "BACKEND_PIPELINE" : "DIRECT_R2",
      });

      await api.uploads.complete(uploadSessionId, partsETags);
    }

    this.onProgress?.({
      percentage: 100,
      loadedBytes: fileSize,
      totalBytes: fileSize,
      speedBytesPerSec: 0,
      status: "DONE",
    });

    return { sessionId: uploadSessionId, movieId: this.movieId };
  }

  // Direct R2 chunk upload
  private async uploadChunkDirectR2(
    url: string,
    chunk: Blob,
    partNumber: number,
    totalParts: number,
    previouslyUploadedBytes: number,
    totalFileSize: number,
    startTime: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const currentTotalLoaded = previouslyUploadedBytes + event.loaded;
          const elapsedSec = (Date.now() - startTime) / 1000 || 0.001;
          const speed = currentTotalLoaded / elapsedSec;
          const percent = Math.min(99, Math.round((currentTotalLoaded / totalFileSize) * 100));

          this.onProgress?.({
            percentage: percent,
            loadedBytes: currentTotalLoaded,
            totalBytes: totalFileSize,
            speedBytesPerSec: speed,
            currentPart: partNumber,
            totalParts,
            status: "UPLOADING",
            mode: "DIRECT_R2",
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          let etag = xhr.getResponseHeader("ETag") || "";
          etag = etag.replace(/^"|"$/g, "");
          if (!etag) etag = `etag-part-${partNumber}`;
          resolve(etag);
        } else {
          reject(new Error(`Direct R2 status ${xhr.status}: ${xhr.statusText}`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during direct R2 PUT"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      this.abortController.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(chunk);
    });
  }

  // Backend pipeline chunk upload (zero CORS issue)
  private async uploadChunkToBackend(
    sessionId: string,
    chunk: Blob,
    partNumber: number,
    totalParts: number,
    previouslyUploadedBytes: number,
    totalFileSize: number,
    startTime: number
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const endpointInfo = api.uploads.uploadChunkEndpoint(sessionId, partNumber);
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", endpointInfo.url);
      xhr.setRequestHeader("Content-Type", "application/octet-stream");
      if (endpointInfo.token) {
        xhr.setRequestHeader("Authorization", `Bearer ${endpointInfo.token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const currentTotalLoaded = previouslyUploadedBytes + event.loaded;
          const elapsedSec = (Date.now() - startTime) / 1000 || 0.001;
          const speed = currentTotalLoaded / elapsedSec;
          const percent = Math.min(99, Math.round((currentTotalLoaded / totalFileSize) * 100));

          this.onProgress?.({
            percentage: percent,
            loadedBytes: currentTotalLoaded,
            totalBytes: totalFileSize,
            speedBytesPerSec: speed,
            currentPart: partNumber,
            totalParts,
            status: "UPLOADING",
            mode: "BACKEND_PIPELINE",
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            const etag = json.data?.etag || xhr.getResponseHeader("ETag")?.replace(/^"|"$/g, "") || `etag-part-${partNumber}`;
            resolve(etag);
          } catch {
            const etag = xhr.getResponseHeader("ETag")?.replace(/^"|"$/g, "") || `etag-part-${partNumber}`;
            resolve(etag);
          }
        } else {
          reject(new Error(`Backend upload failed (${xhr.status}: ${xhr.statusText})`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during backend chunk upload"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      this.abortController.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(chunk);
    });
  }

  // Single PUT for small files (<50MB) directly to R2
  private async uploadSinglePut(url: string, startTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url);
      xhr.setRequestHeader("Content-Type", this.file.type || "video/mp4");

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const elapsedSec = (Date.now() - startTime) / 1000 || 0.001;
          const speed = event.loaded / elapsedSec;
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));

          this.onProgress?.({
            percentage: percent,
            loadedBytes: event.loaded,
            totalBytes: event.total,
            speedBytesPerSec: speed,
            currentPart: 1,
            totalParts: 1,
            status: "UPLOADING",
            mode: "DIRECT_R2",
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Direct PUT failed with status ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error("Network error during direct PUT"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      this.abortController.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(this.file);
    });
  }

  // Single PUT for small files (<50MB) via backend
  private async uploadSinglePutToBackend(sessionId: string, startTime: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const endpointInfo = api.uploads.uploadDirectEndpoint(sessionId);
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", endpointInfo.url);
      xhr.setRequestHeader("Content-Type", this.file.type || "video/mp4");
      if (endpointInfo.token) {
        xhr.setRequestHeader("Authorization", `Bearer ${endpointInfo.token}`);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const elapsedSec = (Date.now() - startTime) / 1000 || 0.001;
          const speed = event.loaded / elapsedSec;
          const percent = Math.min(99, Math.round((event.loaded / event.total) * 100));

          this.onProgress?.({
            percentage: percent,
            loadedBytes: event.loaded,
            totalBytes: event.total,
            speedBytesPerSec: speed,
            currentPart: 1,
            totalParts: 1,
            status: "UPLOADING",
            mode: "BACKEND_PIPELINE",
          });
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`Backend direct upload failed with status ${xhr.status}`));
      };

      xhr.onerror = () => reject(new Error("Network error during backend upload"));
      xhr.onabort = () => reject(new Error("Upload aborted"));

      this.abortController.signal.addEventListener("abort", () => xhr.abort());
      xhr.send(this.file);
    });
  }
}
