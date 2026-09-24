import type { Metadata } from "next";
import { requireStudentArea } from "@/lib/auth";
import { AssistantShell } from "./shell";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function AssistantPage({ searchParams }: PageProps<"/assistant">) {
  const user = await requireStudentArea();
  const { q } = await searchParams;
  return <AssistantShell userId={user.id} conversationId={null} initialDraft={typeof q === "string" ? q.slice(0, 2000) : ""} />;
}
