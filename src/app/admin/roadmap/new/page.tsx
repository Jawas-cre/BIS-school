import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { panelBase, requireStaff } from "@/lib/auth";
import { visibleSubjects } from "@/lib/subjects";
import { PageHeader } from "@/components/ui/misc";
import { UnitForm } from "../unit-form";
import { saveUnit } from "../../_actions/content";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminRoadmap.newUnit);

export default async function NewUnit({ searchParams }: PageProps<"/admin/roadmap/new">) {
  const staff = await requireStaff();
  const base = panelBase(staff.role);
  const { subject: subjectId } = await searchParams;
  const subject = (await visibleSubjects(staff.centerId)).find((s) => s.id === subjectId);
  if (!subject) redirect(`${base}/roadmap`);
  const customized = subject.centerId === staff.centerId || (await db.roadmapUnit.count({ where: { centerId: staff.centerId, subjectId: subject.id } })) > 0;
  if (!customized) redirect(`${base}/roadmap?subject=${subject.id}`);
  const t = await getT();
  return (
    <div>
      <PageHeader eyebrow={subject.name} title={t.adminRoadmap.newUnitTitle} />
      <UnitForm action={saveUnit.bind(null, null, subject.id)} topics={subject.topics.map((x) => ({ id: x.id, name: x.name }))} />
    </div>
  );
}
