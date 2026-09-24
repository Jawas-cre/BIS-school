import { requireStaff } from "@/lib/auth";
import { PageHeader } from "@/components/ui/misc";
import { visibleSubjects } from "@/lib/subjects";
import { QuestionForm } from "../question-form";
import { saveQuestion } from "../../_actions/content";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.adminQuestions.newQuestion);

export default async function NewQuestion() {
  const staff = await requireStaff();
  const subjects = await visibleSubjects(staff.centerId);
  const t = await getT();
  return (
    <div>
      <PageHeader title={t.adminQuestions.newQuestion} subtitle={t.adminQuestions.newSubtitle} />
      <QuestionForm action={saveQuestion.bind(null, null)} subjects={subjects} />
    </div>
  );
}
