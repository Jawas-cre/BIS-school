import Link from "next/link";
import { CenterForm } from "./center-form";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.auth.centerTitle);

export default async function RegisterCenterPage() {
  const t = await getT();
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
