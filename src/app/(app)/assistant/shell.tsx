import Link from "next/link";
import { MessageSquare, Plus, Trash2 } from "lucide-react";
import { db } from "@/lib/db";
import { AI_DAILY_LIMIT } from "@/lib/ai";
import { cn, timeAgo } from "@/lib/utils";
import { Chat } from "./chat";
import { deleteConversation } from "./actions";

/** Conversation list + chat pane shared by /assistant and /assistant/[id]. */
export async function AssistantShell({ userId, conversationId, initialDraft }: { userId: string; conversationId: string | null; initialDraft: string }) {
  const [conversations, messages] = await Promise.all([
    db.aiConversation.findMany({ where: { userId }, orderBy: { updatedAt: "desc" }, take: 30 }),
    conversationId ? db.aiMessage.findMany({ where: { conversationId }, orderBy: { createdAt: "asc" } }) : [],
  ]);

  return (
    <div className="-mx-4 -my-6 grid h-[calc(100dvh-4rem)] sm:-mx-6 lg:-mx-8 lg:-my-8 lg:grid-cols-[280px_1fr]">
      <aside className="hidden min-h-0 flex-col border-r border-line bg-surface lg:flex">
        <div className="p-3">
          <Link href="/assistant" className="flex h-10 items-center justify-center gap-2 rounded-xl bg-brand text-sm font-semibold text-white hover:bg-brand-strong">
            <Plus className="size-4" /> New chat
          </Link>
        </div>
        <nav className="min-h-0 flex-1 space-y-0.5 overflow-y-auto px-2 pb-3" aria-label="Conversations">
          {conversations.length === 0 && <p className="px-3 py-6 text-center text-sm text-muted">No conversations yet.</p>}
          {conversations.map((c) => (
            <div key={c.id} className={cn("group flex items-center rounded-xl", c.id === conversationId ? "bg-brand-soft" : "hover:bg-surface-2")}>
              <Link href={`/assistant/${c.id}`} className="flex min-w-0 flex-1 items-center gap-2.5 px-3 py-2.5">
                <MessageSquare className={cn("size-4 shrink-0", c.id === conversationId ? "text-brand" : "text-muted")} />
                <span className="min-w-0">
                  <span className={cn("block truncate text-sm font-medium", c.id === conversationId ? "text-brand" : "text-ink")}>{c.title}</span>
                  <span className="block text-[11px] text-muted">{timeAgo(c.updatedAt)}</span>
                </span>
              </Link>
              <form action={deleteConversation.bind(null, c.id)}>
                <button aria-label="Delete conversation" className="mr-1.5 hidden rounded-lg p-1.5 text-muted group-hover:block hover:bg-surface hover:text-danger">
                  <Trash2 className="size-3.5" />
                </button>
              </form>
            </div>
          ))}
        </nav>
        <p className="border-t border-line px-4 py-3 text-[11px] text-muted">Up to {AI_DAILY_LIMIT} messages per day. AI can make mistakes — double-check important facts.</p>
      </aside>
      <Chat
        key={conversationId ?? "new"}
        conversationId={conversationId}
        initialMessages={messages.map((m) => ({ id: m.id, role: m.role as "user" | "assistant", content: m.content }))}
        initialDraft={initialDraft}
      />
    </div>
  );
}
