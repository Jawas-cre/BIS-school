import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { homeFor, requireUser } from "@/lib/auth";
import { Logo } from "@/components/logo";
import { OnboardingForm } from "./onboarding-form";

export const metadata: Metadata = { title: "Set up your profile" };

export default async function OnboardingPage() {
  const user = await requireUser();
  if (user.role !== "STUDENT") redirect(homeFor(user.role));

  const [universities, branches, groups] = await Promise.all([
    db.university.findMany({ orderBy: { rank: "asc" }, select: { id: true, name: true, country: true, satLow: true, satHigh: true } }),
    db.branch.findMany({ where: { centerId: user.centerId ?? "" }, orderBy: { name: "asc" } }),
    db.group.findMany({ where: { centerId: user.centerId ?? "" }, orderBy: { name: "asc" }, select: { id: true, name: true, branchId: true, schedule: true } }),
  ]);

  return (
    <div className="min-h-dvh px-5 py-8">
      <div className="mx-auto max-w-2xl">
        <Logo subtitle={user.center?.name} />
        <div className="mt-10 animate-fade-up">
          <p className="text-sm font-bold tracking-wider text-brand uppercase">Step 2 of 2</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold tracking-tight">
            Hi {user.name.split(" ")[0]}, let&apos;s set your goal
          </h1>
          <p className="mt-2 text-muted">
            This personalises your dashboard: countdown, score trajectory and the universities you&apos;re aiming for.
          </p>
          <OnboardingForm
            universities={universities}
            branches={branches.map((b) => ({ id: b.id, name: b.name }))}
            groups={groups}
            defaults={{
              targetScore: user.targetScore ?? 1450,
              examDate: user.examDate?.toISOString().slice(0, 10) ?? "",
              targetUniId: user.targetUniId ?? "",
            }}
          />
        </div>
      </div>
    </div>
  );
}
