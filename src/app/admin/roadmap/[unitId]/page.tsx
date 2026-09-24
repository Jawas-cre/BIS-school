import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { UnitForm } from "../unit-form";
import { saveUnit } from "../../_actions/content";

export const metadata: Metadata = { title: "Edit unit" };

export default async function EditUnit({ params }: PageProps<"/admin/roadmap/[unitId]">) {
  const staff = await requireStaff();
  const { unitId } = await params;
  const unit = await db.roadmapUnit.findFirst({ where: { id: unitId, centerId: staff.centerId }, include: { subject: { include: { topics: { orderBy: { order: "asc" } } } } } });
  if (!unit) notFound();
  return (
    <div>
      <PageHeader eyebrow={unit.subject.name} title={`Edit: ${unit.title}`} />
      <UnitForm action={saveUnit.bind(null, unit.id, unit.subjectId)} topics={unit.subject.topics} unit={unit} />
    </div>
  );
}
