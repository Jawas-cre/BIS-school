"use server";

import Anthropic from "@anthropic-ai/sdk";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { aiClient, aiSettings } from "@/lib/ai";
import type { ActionState } from "@/components/action-form";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

async function save(key: string, value: string) {
  await db.setting.upsert({ where: { key: `ai.${key}` }, create: { key: `ai.${key}`, value }, update: { value } });
}

export async function saveAiSettings(_: ActionState, fd: FormData): Promise<ActionState> {
  await requireSuperAdmin();
  const t = await getT();
  const P = t.aiSettings;
  const parsed = z
    .object({
      provider: z.enum(["off", "claude", "omniroute"]),
      claudeKey: z.string().trim().max(300).default(""),
      claudeModel: z.string().trim().max(100).default(""),
      omnirouteUrl: z.union([z.literal(""), z.string().trim().url().refine((u) => /^https?:\/\//i.test(u))], { message: P.errUrl }).default(""),
      omnirouteKey: z.string().trim().max(300).default(""),
      omnirouteModel: z.string().trim().max(100).default(""),
    })
    .safeParse(Object.fromEntries(fd));
  if (!parsed.success) return { error: parsed.error.issues[0].message };
  const d = parsed.data;
  await save("provider", d.provider);
  await save("claudeModel", d.claudeModel);
  await save("omnirouteUrl", d.omnirouteUrl);
  await save("omnirouteModel", d.omnirouteModel);
  // Keys are never shown again; an empty field keeps the saved one.
  if (d.claudeKey) await save("claudeKey", d.claudeKey);
  if (d.omnirouteKey) await save("omnirouteKey", d.omnirouteKey);
  revalidatePath("/platform/ai");
  return { ok: P.saved };
}

/** Sends a one-word question through the saved connection and reports what came back. */
export async function testAiConnection(): Promise<ActionState> {
  await requireSuperAdmin();
  const t = await getT();
  const P = t.aiSettings;
  const settings = await aiSettings();
  if (settings.provider === "off") return { error: P.testOff };
  const model = settings.provider === "omniroute" ? settings.omnirouteModel : settings.claudeModel;
  try {
    const res = await aiClient(settings).messages.create(
      { model, max_tokens: 30, messages: [{ role: "user", content: "Reply with the single word OK." }] },
      { timeout: 45_000 },
    );
    const reply = res.content
      .map((block) => (block.type === "text" ? block.text : ""))
      .join("")
      .trim();
    return { ok: fmt(P.testOk, { model: res.model || model, reply: reply.slice(0, 80) || "—" }) };
  } catch (error) {
    if (error instanceof Anthropic.APIConnectionError) {
      return { error: settings.provider === "omniroute" ? fmt(P.testUnreachable, { url: settings.omnirouteUrl }) : P.testNoInternet };
    }
    if (error instanceof Anthropic.AuthenticationError) return { error: P.testAuth };
    if (error instanceof Anthropic.APIError) return { error: fmt(P.testFailed, { detail: error.message.slice(0, 200) }) };
    if (error instanceof Error && /api key|apiKey|credentials/i.test(error.message)) return { error: P.testAuth };
    return { error: fmt(P.testFailed, { detail: error instanceof Error ? error.message.slice(0, 200) : String(error) }) };
  }
}
