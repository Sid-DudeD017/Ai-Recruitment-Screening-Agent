/**
 * Abstract file storage interface.
 * Implementations: Vercel Blob (production), Local FS (dev fallback).
 */
export interface StorageService {
  /**
   * Upload a file and return its public URL
   */
  upload(
    file: Buffer | Blob,
    fileName: string,
    options?: { contentType?: string; folder?: string }
  ): Promise<{ url: string; fileName: string }>;

  /**
   * Delete a file by URL
   */
  delete(url: string): Promise<void>;
}
