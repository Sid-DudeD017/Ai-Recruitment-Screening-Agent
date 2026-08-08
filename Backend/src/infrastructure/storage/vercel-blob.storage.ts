import { put, del } from "@vercel/blob";
import type { StorageService } from "./storage.interface";
import { createModuleLogger } from "@/shared/utils/logger";

const logger = createModuleLogger("vercel-blob-storage");

/**
 * Vercel Blob storage implementation.
 * Zero-config on Vercel — requires BLOB_READ_WRITE_TOKEN env var.
 */
export const vercelBlobStorage: StorageService = {
  async upload(file, fileName, options) {
    const folder = options?.folder || "uploads";
    const path = `${folder}/${Date.now()}-${fileName}`;

    const blob = await put(path, file, {
      access: "public",
      contentType: options?.contentType,
    });

    logger.info({ fileName, url: blob.url }, "File uploaded to Vercel Blob");

    return {
      url: blob.url,
      fileName,
    };
  },

  async delete(url) {
    await del(url);
    logger.info({ url }, "File deleted from Vercel Blob");
  },
};
