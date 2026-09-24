import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { AI_DAILY_LIMIT, AI_HISTORY_LIMIT, AI_MODEL, TUTOR_SYSTEM, anthropic, studentContext } from "@/lib/ai";
import { accuracyBy } from "@/lib/stats";
import { dayKey } from "@/lib/utils";
import { fmt } from "@/lib/i18n/format";
import { getI18n } from "@/lib/i18n/server";

const Body = z.object({
  conversationId: z.string().nullish(),
  message: z.string().trim().min(1).max(4000),
});

function problem(status: number, message: string) {
  return Response.json({ error: message }, { status });
}

export async function POST(req: Request) {
  const { locale, t } = await getI18n();
  const A = t.assistant;
  const user = await getCurrentUser();
  if (!user) return problem(401, A.loginAgain);
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return problem(400, A.tooLong);
  const { message } = parsed.data;

  // Daily limit per student, reset at midnight Tashkent time (UTC+5, no DST).
  const startOfDay = new Date(`${dayKey()}T00:00:00+05:00`);
  const sentToday = await db.aiMessage.count({
    where: { role: "user", createdAt: { gte: startOfDay }, conversation: { userId: user.id } },
  });
  if (sentToday >= AI_DAILY_LIMIT) return problem(429, fmt(A.limit, { n: AI_DAILY_LIMIT }));

  let conversation = parsed.data.conversationId
    ? await db.aiConversation.findFirst({ where: { id: parsed.data.conversationId, userId: user.id } })
    : null;
  if (parsed.data.conversationId && !conversation) return problem(404, A.notFound);
  conversation ??= await db.aiConversation.create({
    data: { userId: user.id, title: message.replace(/\s+/g, " ").slice(0, 60) },
  });

  const history = await db.aiMessage.findMany({
    where: { conversationId: conversation.id },
    orderBy: { createdAt: "desc" },
    take: AI_HISTORY_LIMIT,
  });
  await db.aiMessage.create({ data: { conversationId: conversation.id, role: "user", content: message } });

  // Personalisation: subjects, goal, average test score and weakest topics.
  const [avg, byTopic] = await Promise.all([
    db.testAttempt.aggregate({ where: { userId: user.id, status: "COMPLETED" }, _avg: { score: true } }),
    accuracyBy([user.id], "topic"),
  ]);
  const weakIds = [...byTopic.entries()]
    .filter(([, v]) => v.total >= 8)
    .sort((a, b) => a[1].correct / a[1].total - b[1].correct / b[1].total)
    .slice(0, 3)
    .map(([k]) => k);
  const weakTopics = weakIds.length
    ? await db.topic.findMany({ where: { id: { in: weakIds } }, select: { name: true, subject: { select: { name: true } } } })
    : [];

  const messages: Anthropic.Beta.BetaMessageParam[] = [
    ...history.reverse().map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: message },
  ];
  // History must start with a user turn.
  while (messages.length && messages[0].role !== "user") messages.shift();

  const encoder = new TextEncoder();
  const conversationId = conversation.id;

  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      let text = "";
      let modelText = "";
      try {
        const stream = anthropic().beta.messages.stream(
          {
            model: AI_MODEL,
            max_tokens: 16000,
            output_config: { effort: "medium" },
            betas: ["server-side-fallback-2026-07-01"],
            fallbacks: "default",
            cache_control: { type: "ephemeral" },
            system: [
              { type: "text", text: TUTOR_SYSTEM },
              {
                type: "text",
                text: studentContext({
                  name: user.name,
                  grade: user.grade,
                  goal: user.goal,
                  examDate: user.examDate,
                  subjects: [...new Set(user.memberships.map((m) => m.group.subject?.name).filter((n): n is string => Boolean(n)))],
                  avgTestScore: avg._avg.score === null ? null : Math.round(avg._avg.score),
                  weakest: weakTopics.map((t) => `${t.name} (${t.subject.name})`),
                  centerName: user.center?.name ?? null,
                  locale,
                }),
              },
            ],
            messages,
          },
          { signal: req.signal },
        );
        stream.on("text", (delta) => {
          text += delta;
          modelText += delta;
          controller.enqueue(encoder.encode(delta));
        });
        const final = await stream.finalMessage();
        if (final.stop_reason === "refusal") {
          const note = `\n\n_${A.refusal}_`;
          text += note;
          controller.enqueue(encoder.encode(note));
        } else if (final.stop_reason === "max_tokens") {
          const note = `\n\n_${A.cutShort}_`;
          text += note;
          controller.enqueue(encoder.encode(note));
        }
      } catch (error) {
        const note =
          error instanceof Anthropic.AuthenticationError || (error instanceof Error && /api key|apiKey|credentials/i.test(error.message))
            ? A.notConfigured
            : error instanceof Anthropic.RateLimitError
              ? A.busy
              : error instanceof Anthropic.APIError
                ? fmt(A.apiError, { status: error.status ?? A.network })
                : req.signal.aborted
                  ? ""
                  : A.couldntRespond;
        if (note) {
          const chunk = `${text ? "\n\n" : ""}_${note}_`;
          text += chunk;
          controller.enqueue(encoder.encode(chunk));
        }
      } finally {
        // Error notices are shown to the student but never saved into the history sent to the model.
        if (modelText.trim()) {
          await db.aiMessage.create({ data: { conversationId, role: "assistant", content: text } });
        }
        await db.aiConversation.update({ where: { id: conversationId }, data: { updatedAt: new Date() } });
        controller.close();
      }
    },
  });

  return new Response(body, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Conversation-Id": conversationId,
    },
  });
}
