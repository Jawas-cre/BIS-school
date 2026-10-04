import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { mediaUrl, readContent } from "@/lib/mock/tests";
import { TestEditor } from "./editor";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mockAdmin.editTest) as () => Promise<Metadata>;

export default async function EditMockTest({ params }: PageProps<"/mock/admin/tests/[id]">) {
  const { id } = await params;
  const staff = await requireStaff();
  const t = await getT();
  const test = await db.mockTest.findFirst({ where: { id, centerId: staff.centerId } });
  if (!test) notFound();
  const content = readContent(test.content);
  const ids = [...content.listening.map((p) => p.audioId), ...content.writing.map((w) => w.imageId)].filter((x): x is string => !!x);
  const files = await db.mockFile.findMany({ where: { id: { in: ids }, centerId: staff.centerId }, select: { id: true, name: true } });
  return (
    <div className="space-y-4">
      <Link href="/mock/admin/tests" className="inline-flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-brand">
        <ArrowLeft className="size-4" /> {t.mockAdmin.navTests}
      </Link>
      <TestEditor id={test.id} initial={{ title: test.title, module: test.module, content }} files={Object.fromEntries(files.map((f) => [f.id, { name: f.name, url: mediaUrl(f.id) }]))} />
    </div>
  );
}
