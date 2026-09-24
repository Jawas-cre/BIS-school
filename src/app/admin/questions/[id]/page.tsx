import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStaff } from "@/lib/auth";
import { parseChoices } from "@/lib/quiz";
import { PageHeader } from "@/components/ui/misc";
import { visibleSubjects } from "@/lib/subjects";
import { QuestionForm } from "../question-form";
import { saveQuestion } from "../../_actions/content";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminQuestions.editTitle);

export default async function EditQuestion({ params }: PageProps<"/admin/questions/[id]">) {
  const staff = await requireStaff();
  const { id } = await params;
  const q = await db.question.findFirst({ where: { id, centerId: staff.centerId } });
  if (!q) notFound();
  const subjects = await visibleSubjects(staff.centerId);
  const t = await getT();
  return (
    <div>
      <PageHeader title={t.adminQuestions.editTitle} />
      <QuestionForm action={saveQuestion.bind(null, q.id)} subjects={subjects} initial={{ ...q, choices: parseChoices(q.choices) }} />
    </div>
  );
}
