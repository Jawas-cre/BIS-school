import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getT, pageTitle } from "@/lib/i18n/server";
import { SetupForm } from "./setup-form";

export const generateMetadata = pageTitle((t) => t.setup.title);

/** Only on a brand-new installation: the first person creates the center and their own admin account. */
export default async function SetupPage() {
  if ((await db.user.count()) > 0) redirect("/login");
  const t = await getT();
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.setup.heading}</h1>
      <p className="mt-2 text-muted">{t.setup.subtitle}</p>
      <SetupForm />
    </div>
  );
}
