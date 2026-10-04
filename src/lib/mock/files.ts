import "server-only";
import path from "node:path";

// Uploaded listening recordings and writing pictures live next to the database, outside the
// program files, so updates never touch them: data/mock-files/<id>.
export const FILES_DIR = path.join(process.cwd(), "data", "mock-files");
export const filePath = (id: string) => path.join(FILES_DIR, id.replace(/[^a-z0-9]/gi, ""));

export const MAX_UPLOAD_BYTES = 150 * 1024 * 1024;
/** Audio for Listening and pictures for Writing Task 1. SVG is left out: it can carry scripts. */
export const ALLOWED_TYPES: Record<string, "audio" | "image"> = {
  "audio/mpeg": "audio",
  "audio/mp3": "audio",
  "audio/mp4": "audio",
  "audio/x-m4a": "audio",
  "audio/aac": "audio",
  "audio/wav": "audio",
  "audio/x-wav": "audio",
  "audio/wave": "audio",
  "audio/ogg": "audio",
  "audio/webm": "audio",
  "image/png": "image",
  "image/jpeg": "image",
  "image/gif": "image",
  "image/webp": "image",
};
