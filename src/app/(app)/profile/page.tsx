import type { Metadata } from "next";
import { Award, BookOpenCheck, ClipboardCheck, Flame, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { userTotals } from "@/lib/stats";
import { Avatar, PageHeader, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/utils";
import { PasswordForm, ProfileForm } from "./forms";

export const metadata: Metadata = { title: "Profile" };

export default async function ProfilePage() {
  const user = await requireStudentArea();
  const [totals, universities, branch] = await Promise.all([
    userTotals(user.id),
    db.university.findMany({ orderBy: [{ country: "asc" }, { rank: "asc" }], select: { id: true, name: true } }),
    user.branchId ? db.branch.findUnique({ where: { id: user.branchId } }) : null,
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Profile" />
      <div className="mb-6 flex flex-col gap-5 rounded-3xl border border-line bg-surface p-6 shadow-card sm:flex-row sm:items-center">
        <Avatar name={user.name} size={72} />
        <div className="flex-1">
          <h2 className="font-display text-2xl font-extrabold">{user.name}</h2>
          <p className="text-muted">{user.email}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {user.center && <Badge tone="brand">{user.center.name}</Badge>}
            {branch && <Badge>{branch.name}</Badge>}
            {user.grade && <Badge>{user.grade}</Badge>}
            {user.memberships.map((m) => <Badge key={m.groupId}>{m.group.name}</Badge>)}
            <Badge>Joined {formatDate(user.createdAt)}</Badge>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label="Experience" value={user.xp.toLocaleString()} hint="XP" icon={<Zap className="size-4" />} />
        <StatTile label="Streak" value={liveStreak(user)} hint="days" icon={<Flame className="size-4" />} />
        <StatTile label="Best streak" value={user.bestStreak} hint="days" icon={<Award className="size-4" />} />
        <StatTile label="Questions" value={totals.answered.toLocaleString()} hint={`${totals.accuracy}% accuracy`} icon={<BookOpenCheck className="size-4" />} />
        <StatTile label="Tests" value={totals.tests} hint={totals.avgTestScore !== null ? `average ${totals.avgTestScore}%` : "completed"} icon={<ClipboardCheck className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title="Your goal & details" subtitle="Shown on your dashboard and used to personalise the AI Assistant" />
          <CardBody>
            <ProfileForm
              universities={universities}
              defaults={{
                name: user.name,
                phone: user.phone ?? "",
                grade: user.grade ?? "",
                goal: user.goal ?? "",
                examDate: user.examDate?.toISOString().slice(0, 10) ?? "",
                targetUniId: user.targetUniId ?? "",
              }}
            />
          </CardBody>
        </Card>
        <Card className="self-start">
          <CardHeader title="Change password" />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
