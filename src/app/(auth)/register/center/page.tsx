import Link from "next/link";
import { CenterForm } from "./center-form";
import { centerSignupOpen } from "@/lib/signup";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.auth.centerTitle);

export default async function RegisterCenterPage() {
  const t = await getT();
  if (!(await centerSignupOpen())) {
    return (
      <div className="animate-fade-up">
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.auth.centerSignupClosedTitle}</h1>
        <p className="mt-2 text-muted">{t.auth.centerSignupClosedText}</p>
        <p className="mt-8 text-center text-sm text-muted">
          <Link href="/register" className="font-semibold text-brand hover:underline">{t.auth.joinWithCenterCode}</Link>
          {" · "}
          <Link href="/login" className="font-semibold text-brand hover:underline">{t.auth.logIn}</Link>
        </p>
      </div>
    );
  }
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">{t.auth.centerHeading}</h1>
      <p className="mt-2 text-muted">{t.auth.centerSubtitle}</p>
      <CenterForm />
      <p className="mt-8 text-center text-sm text-muted">
        {t.auth.alreadyRegistered}{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          {t.auth.logIn}
        </Link>
      </p>
    </div>
  );
}
