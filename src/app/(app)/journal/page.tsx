import { requireStudentArea } from "@/lib/auth";
import { studentJournal } from "@/lib/journal";
import { JournalView } from "@/components/journal-view";
import { PageHeader } from "@/components/ui/misc";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.journal.myTitle);

export default async function JournalPage() {
  const user = await requireStudentArea();
  const t = await getT();
  const entries = await studentJournal(user.id);
  return (
    <div className="space-y-6">
      <PageHeader title={t.journal.myTitle} subtitle={t.journal.mySubtitle} />
      <JournalView entries={entries} />
    </div>
  );
}
