import type { Metadata } from "next";
import { Building2 } from "lucide-react";
import { db } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/auth";
import { PageHeader, StatTile } from "@/components/ui/misc";
import { formatDate } from "@/lib/utils";

export const metadata: Metadata = { title: "Centers" };

export default async function PlatformHome() {
  await requireSuperAdmin();
  const [centers, students, attempts, questions] = await Promise.all([
    db.center.findMany({ orderBy: { createdAt: "desc" }, include: { _count: { select: { users: true, groups: true, branches: true, questions: true, tests: true } } } }),
    db.user.count({ where: { role: "STUDENT" } }),
    db.testAttempt.count({ where: { status: "COMPLETED" } }),
    db.question.count(),
  ]);
  return (
    <div className="space-y-6">
      <PageHeader title="Learning centers" subtitle="Every center on the platform. Centers sign up themselves at /register/center." />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatTile label="Centers" value={centers.length} icon={<Building2 className="size-4" />} />
        <StatTile label="Students" value={students.toLocaleString()} />
        <StatTile label="Tests completed" value={attempts.toLocaleString()} />
        <StatTile label="Questions" value={questions.toLocaleString()} />
      </div>
      <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
        <table className="w-full min-w-[640px] text-sm">
          <thead>
            <tr className="border-b border-line text-left text-xs text-muted">
              <th className="px-5 py-3 font-semibold">Center</th>
              <th className="px-3 py-3 font-semibold">Invite code</th>
              <th className="px-3 py-3 text-right font-semibold">People</th>
              <th className="px-3 py-3 text-right font-semibold">Groups</th>
              <th className="px-3 py-3 text-right font-semibold">Own questions</th>
              <th className="px-5 py-3 text-right font-semibold">Joined</th>
            </tr>
          </thead>
          <tbody>
            {centers.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-0">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-2.5">
                    <span className="size-3 rounded-full" style={{ background: c.accent }} />
                    <span className="font-semibold">{c.name}</span>
                    <span className="text-xs text-muted">{c.city}</span>
                  </div>
                </td>
                <td className="px-3 py-3 font-mono">{c.inviteCode}</td>
                <td className="px-3 py-3 text-right tabular-nums">{c._count.users}</td>
                <td className="px-3 py-3 text-right tabular-nums">{c._count.groups}</td>
                <td className="px-3 py-3 text-right tabular-nums">{c._count.questions}</td>
                <td className="px-5 py-3 text-right text-muted">{formatDate(c.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
