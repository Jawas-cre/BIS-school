import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { UnitForm } from "../unit-form";
import { saveUnit } from "../../_actions/content";

export const metadata: Metadata = { title: "New unit" };

export default async function NewUnit() {
  const staff = await requireStaff();
  if ((await db.roadmapUnit.count({ where: { centerId: staff.centerId } })) === 0) redirect("/admin/roadmap");
  return (
    <div>
      <PageHeader title="New roadmap unit" />
      <UnitForm action={saveUnit.bind(null, null)} />
    </div>
  );
}
