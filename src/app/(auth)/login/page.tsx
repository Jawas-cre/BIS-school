import Link from "next/link";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { LoginForm } from "./login-form";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.auth.loginTitle);

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  if ((await db.user.count()) === 0) redirect("/setup");
  const t = await getT();
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.auth.welcomeBack}</h1>
      <p className="mt-2 text-muted">{t.auth.loginSubtitle}</p>
      <LoginForm next={typeof next === "string" ? next : ""} />
      <p className="mt-8 text-center text-sm text-muted">
        {t.auth.newStudent}{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          {t.auth.joinWithCenterCode}
        </Link>
        <br />
        {t.auth.runningCenter}{" "}
        <Link href="/register/center" className="font-semibold text-brand hover:underline">
          {t.auth.createYourCenter}
        </Link>
      </p>
    </div>
  );
}
