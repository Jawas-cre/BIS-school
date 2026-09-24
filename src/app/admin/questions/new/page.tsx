import type { Metadata } from "next";
import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { QuestionForm } from "../question-form";
import { saveQuestion } from "../../_actions/content";

export const metadata: Metadata = { title: "New question" };

export default async function NewQuestion() {
  await requireStaff();
  return (
    <div>
      <PageHeader title="New question" subtitle="Visible only to your center's students." />
      <QuestionForm action={saveQuestion.bind(null, null)} />
    </div>
  );
}
