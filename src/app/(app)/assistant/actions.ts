"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { requireUser } from "@/lib/auth";

export async function deleteConversation(id: string) {
  const user = await requireUser();
  await db.aiConversation.deleteMany({ where: { id, userId: user.id } });
  revalidatePath("/assistant");
  redirect("/assistant");
}
