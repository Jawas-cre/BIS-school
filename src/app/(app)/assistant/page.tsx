import { requireStudentArea } from "@/lib/auth";
import { pageTitle } from "@/lib/i18n/server";
import { AssistantShell } from "./shell";

export const generateMetadata = pageTitle((t) => t.nav.assistant);

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const user = await requireStudentArea();
  const { q } = await searchParams;
  return <AssistantShell userId={user.id} conversationId={null} initialDraft={typeof q === "string" ? q.slice(0, 2000) : ""} />;
}
