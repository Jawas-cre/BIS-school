import { Award, BookOpenCheck, ClipboardCheck, Flame, Zap } from "lucide-react";
import { db } from "@/lib/db";
import { requireStudentArea } from "@/lib/auth";
import { liveStreak } from "@/lib/activity";
import { userTotals } from "@/lib/stats";
import { Avatar, PageHeader, StatTile } from "@/components/ui/misc";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { fmt } from "@/lib/i18n/format";
import { getI18n, pageTitle } from "@/lib/i18n/server";
import { PasswordForm, ProfileForm } from "./forms";

export const generateMetadata = pageTitle((t) => t.nav.profile);

export default async function ProfilePage() {
  const user = await requireStudentArea();
  const { t, date, num } = await getI18n();
  const P = t.profile;
  const [totals, universities, branch] = await Promise.all([
    userTotals(user.id),
    db.university.findMany({ orderBy: [{ country: "asc" }, { rank: "asc" }], select: { id: true, name: true } }),
    user.branchId ? db.branch.findUnique({ where: { id: user.branchId } }) : null,
  ]);

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title={t.nav.profile} />
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
            <Badge>{fmt(P.joined, { date: date(user.createdAt) })}</Badge>
          </div>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-5">
        <StatTile label={P.experience} value={num(user.xp)} hint={P.xp} icon={<Zap className="size-4" />} />
        <StatTile label={P.streak} value={liveStreak(user)} hint={P.daysUnit} icon={<Flame className="size-4" />} />
        <StatTile label={P.bestStreak} value={user.bestStreak} hint={P.daysUnit} icon={<Award className="size-4" />} />
        <StatTile label={P.questions} value={num(totals.answered)} hint={fmt(P.accuracyPct, { pct: totals.accuracy })} icon={<BookOpenCheck className="size-4" />} />
        <StatTile label={P.tests} value={totals.tests} hint={totals.avgTestScore !== null ? fmt(P.averagePct, { pct: totals.avgTestScore }) : P.completed} icon={<ClipboardCheck className="size-4" />} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <Card>
          <CardHeader title={P.goalDetails} subtitle={P.goalDetailsSub} />
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
          <CardHeader title={P.changePassword} />
          <CardBody>
            <PasswordForm />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
