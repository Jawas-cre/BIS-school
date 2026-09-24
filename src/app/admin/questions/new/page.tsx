import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { visibleSubjects } from "@/lib/subjects";
import { QuestionForm } from "../question-form";
import { saveQuestion } from "../../_actions/content";

export const metadata: Metadata = { title: "New question" };

export default async function NewQuestion() {
  const staff = await requireStaff();
  const subjects = await visibleSubjects(staff.centerId);
  return (
    <div>
      <PageHeader title="New question" subtitle="Visible only to your center's students. Use any platform subject or one of your own." />
      <QuestionForm action={saveQuestion.bind(null, null)} subjects={subjects} />
    </div>
  );
}
