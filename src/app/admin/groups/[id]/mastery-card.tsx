import { Trophy } from "lucide-react";
import { db } from "@/lib/db";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { MasteryLegend, MasterySquare } from "@/components/mastery";
import { masteryPercent, topicMastery } from "@/lib/mastery";
import { fmt } from "@/lib/i18n/format";
import { getT } from "@/lib/i18n/server";

/** The class mastery grid: each student's level on each topic of the group's subject. */
export async function MasteryCard({ subject, members, base }: { subject: { id: string; name: string }; members: { id: string; name: string }[]; base: string }) {
  const t = await getT();
  const M = t.mastery;
  const topics = await db.topic.findMany({ where: { subjectId: subject.id }, orderBy: { order: "asc" }, select: { id: true, name: true } });
  const topicIds = topics.map((x) => x.id);
  const levels = await topicMastery(members.map((m) => m.id), topicIds);
  const rows = members
    .map((m) => ({ ...m, levels: levels.get(m.id)!, percent: masteryPercent(levels.get(m.id), topicIds) }))
    .sort((a, b) => b.percent - a.percent);
  const average = rows.length ? Math.round(rows.reduce((sum, r) => sum + r.percent, 0) / rows.length) : 0;

  return (
    <Card>
      <CardHeader title={fmt(M.classTitle, { subject: subject.name })} subtitle={fmt(M.classSubtitle, { pct: average })} action={<Trophy className="size-4 text-muted" />} />
      <CardBody className="space-y-3">
        {rows.length === 0 || topics.length === 0 ? (
          <p className="text-sm text-muted">{t.adminGroups.noMembers}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="text-sm">
              <thead>
                <tr>
                  <th className="pr-3 pb-2 text-left text-xs font-semibold text-muted">{t.journal.student}</th>
                  <th className="px-2 pb-2 text-right text-xs font-semibold text-muted">{M.mastery}</th>
                  {topics.map((topic) => (
                    <th key={topic.id} className="h-28 px-1 pb-2 align-bottom">
                      <span className="block max-h-28 truncate text-left text-[11px] font-semibold text-muted [writing-mode:vertical-rl] rotate-180" title={topic.name}>
                        {topic.name}
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id}>
                    <td className="max-w-44 truncate py-1 pr-3 font-semibold">
                      <a href={`${base}/students/${r.id}`} className="hover:text-brand">{r.name}</a>
                    </td>
                    <td className="px-2 py-1 text-right font-bold tabular-nums">{r.percent}%</td>
                    {topics.map((topic) => {
                      const level = r.levels.get(topic.id) ?? "NOT_STARTED";
                      return (
                        <td key={topic.id} className="px-1 py-1 text-center">
                          <MasterySquare level={level} label={`${topic.name}: ${M.level[level]}`} className="size-4" />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <MasteryLegend />
      </CardBody>
    </Card>
  );
}
