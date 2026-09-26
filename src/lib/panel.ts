import "server-only";
import { revalidatePath } from "next/cache";

/** Staff pages exist in both panels (/admin for center admins, /teacher for teachers); refresh both. */
export function revalidatePanels(path = "") {
  revalidatePath(`/admin${path}`);
  revalidatePath(`/teacher${path}`);
}
