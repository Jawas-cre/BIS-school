import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { AssistantShell } from "../shell";

export const metadata: Metadata = { title: "AI Assistant" };

export default async function ConversationPage({ params }: PageProps<"/assistant/[id]">) {
  const user = await requireStudentArea();
  const { id } = await params;
  const convo = await db.aiConversation.findFirst({ where: { id, userId: user.id } });
  if (!convo) notFound();
  return <AssistantShell userId={user.id} conversationId={convo.id} initialDraft="" />;
}
