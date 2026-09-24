import Link from "next/link";
import { RegisterForm } from "./register-form";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.auth.registerTitle);

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { code } = await searchParams;
  const t = await getT();
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.auth.registerHeading}</h1>
      <p className="mt-2 text-muted">{t.auth.registerSubtitle}</p>
      <RegisterForm code={typeof code === "string" ? code : ""} />
      <p className="mt-8 text-center text-sm text-muted">
        {t.auth.haveAccount}{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          {t.auth.logIn}
        </Link>
      </p>
    </div>
  );
}
