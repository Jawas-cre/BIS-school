import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { UnitForm } from "../unit-form";
import { saveUnit } from "../../_actions/content";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminRoadmap.editUnit);

export default async function EditUnit({ params }: PageProps<"/admin/roadmap/[unitId]">) {
  const staff = await requireStaff();
  const { unitId } = await params;
  const unit = await db.roadmapUnit.findFirst({ where: { id: unitId, centerId: staff.centerId }, include: { subject: { include: { topics: { orderBy: { order: "asc" } } } } } });
  if (!unit) notFound();
  const t = await getT();
  return (
    <div>
      <PageHeader eyebrow={unit.subject.name} title={fmt(t.adminRoadmap.editTitle, { title: unit.title })} />
      <UnitForm
        action={saveUnit.bind(null, unit.id, unit.subjectId)}
        topics={unit.subject.topics.map((x) => ({ id: x.id, name: x.name }))}
        unit={{ title: unit.title, topicId: unit.topicId, summary: unit.summary, videoUrl: unit.videoUrl, notes: unit.notes }}
      />
    </div>
  );
}
