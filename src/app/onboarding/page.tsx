import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { homeFor, requireUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { LanguageMenu } from "@/components/language-menu";
import { ThemeMenu } from "@/components/theme-menu";
import { fmt } from "@/lib/i18n/format";
import { getT, pageTitle } from "@/lib/i18n/server";
import { OnboardingForm } from "./onboarding-form";

export const generateMetadata = pageTitle((t) => t.onboarding.title);

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect(homeFor(user.role));
  const t = await getT();

  const [universities, branches, groups] = await Promise.all([
    db.university.findMany({ orderBy: [{ country: "asc" }, { rank: "asc" }], select: { id: true, name: true, country: true } }),
    db.branch.findMany({ where: { centerId: user.centerId ?? "" }, orderBy: { name: "asc" } }),
    db.group.findMany({
      where: { centerId: user.centerId ?? "" },
      orderBy: { name: "asc" },
      select: { id: true, name: true, branchId: true, schedule: true, subject: { select: { name: true, color: true } } },
    }),
  ]);

  return (
    <div className="min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <div className="flex items-center justify-between gap-3">
          <Logo subtitle={user.center?.name} />
          <div className="flex items-center gap-1">
            <LanguageMenu />
            <ThemeMenu />
          </div>
        </div>
        <div className="mt-10 animate-fade-up">
          <p className="text-sm font-bold tracking-wider text-brand uppercase">{t.onboarding.step}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">{fmt(t.onboarding.heading, { name: user.name.split(" ")[0] })}</h1>
          <p className="mt-2 text-muted">{t.onboarding.intro}</p>
          <OnboardingForm
            universities={universities}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            groups={groups}
            joined={user.memberships.map((m) => m.groupId)}
          />
        </div>
      </div>
    </div>
  );
}
