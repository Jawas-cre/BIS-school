import { mkdir, writeFile } from "node:fs/promises";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { ALLOWED_TYPES, FILES_DIR, filePath, MAX_UPLOAD_BYTES } from "@/lib/mock/files";
import { mediaUrl } from "@/lib/mock/tests";
import { getT } from "@/lib/i18n/server";

// Center staff upload a listening recording or a writing picture from the test editor.
export async function POST(req: Request) {
  const [user, t] = await Promise.all([getCurrentUser(), getT()]);
  const A = t.mockAdmin;
  if (!user || !isStaff(user.role) || !user.centerId) return NextResponse.json({ error: A.errUploadAuth }, { status: 401 });
  // Refuse a too-large upload before reading it (the form adds a little on top of the file).
  if (Number(req.headers.get("content-length") ?? 0) > MAX_UPLOAD_BYTES + 1024 * 1024) return NextResponse.json({ error: A.errUploadSize }, { status: 413 });
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: A.errUploadNone }, { status: 400 });
  const kind = ALLOWED_TYPES[file.type];
  if (!kind) return NextResponse.json({ error: A.errUploadType }, { status: 415 });
  if (file.size > MAX_UPLOAD_BYTES) return NextResponse.json({ error: A.errUploadSize }, { status: 413 });
  const record = await db.mockFile.create({ data: { centerId: user.centerId, name: file.name.slice(0, 120), mime: file.type, size: file.size } });
  await mkdir(FILES_DIR, { recursive: true });
  await writeFile(filePath(record.id), Buffer.from(await file.arrayBuffer()));
  return NextResponse.json({ id: record.id, url: mediaUrl(record.id), name: record.name, kind });
}
