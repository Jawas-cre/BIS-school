import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { parseChoices } from "@/lib/quiz";
import { PageHeader } from "@/components/ui/misc";
import { visibleSubjects } from "@/lib/subjects";
import { QuestionForm } from "../question-form";
import { saveQuestion } from "../../_actions/content";

export const metadata: Metadata = { title: "Edit question" };

export default async function EditQuestion({ params }: PageProps<"/admin/questions/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const q = await db.question.findFirst({ where: { id, centerId: staff.centerId } });
  if (!q) notFound();
  const subjects = await visibleSubjects(staff.centerId);
  return (
    <div>
      <PageHeader title="Edit question" />
      <QuestionForm action={saveQuestion.bind(null, q.id)} subjects={subjects} initial={{ ...q, choices: parseChoices(q.choices) }} />
    </div>
  );
}
