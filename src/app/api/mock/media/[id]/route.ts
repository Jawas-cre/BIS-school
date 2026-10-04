import { createReadStream } from "node:fs";
import { stat } from "node:fs/promises";
import { Readable } from "node:stream";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { getCandidate } from "@/lib/mock/session";
import { filePath } from "@/lib/mock/files";

// Serves an uploaded recording or picture to the center's candidates and staff. Supports byte
// ranges: browsers ask for audio in pieces, and Safari won't play audio without them.
export async function GET(req: Request, { params }: RouteContext<"/api/mock/media/[id]">) {
  const { id } = await params;
  const file = await db.mockFile.findUnique({ where: { id } });
  if (!file) return new Response("Not found", { status: 404 });
  const [candidate, user] = await Promise.all([getCandidate(), getCurrentUser()]);
  const allowed = candidate?.centerId === file.centerId || (user && isStaff(user.role) && user.centerId === file.centerId);
  if (!allowed) return new Response("Not found", { status: 404 });

  const location = filePath(file.id);
  const size = await stat(location).then((s) => s.size).catch(() => null);
  if (size === null) return new Response("Not found", { status: 404 });
  const headers: Record<string, string> = {
    "Content-Type": file.mime,
    "Accept-Ranges": "bytes",
    "Cache-Control": "private, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };
  const range = req.headers.get("range")?.match(/^bytes=(\d*)-(\d*)$/);
  if (range && (range[1] || range[2])) {
    let start = range[1] ? Number(range[1]) : size - Number(range[2]);
    let end = range[1] && range[2] ? Number(range[2]) : size - 1;
    start = Math.max(0, start);
    end = Math.min(size - 1, end);
    if (start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${size}` } });
    const stream = Readable.toWeb(createReadStream(location, { start, end })) as ReadableStream;
    return new Response(stream, { status: 206, headers: { ...headers, "Content-Range": `bytes ${start}-${end}/${size}`, "Content-Length": String(end - start + 1) } });
  }
  const stream = Readable.toWeb(createReadStream(location)) as ReadableStream;
  return new Response(stream, { headers: { ...headers, "Content-Length": String(size) } });
}
