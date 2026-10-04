import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { BookOpenText, Clock, Headphones, PenLine, ShieldCheck } from "lucide-react";
import { db } from "@/lib/db";
import { getCandidate, mockCenter } from "@/lib/mock/session";
import { MockShell } from "@/components/mock/mock-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/action-form";
import { loginCandidate } from "./actions";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata({ searchParams }: PageProps<"/mock">): Promise<Metadata> {
  const [t, center] = await Promise.all([getT(), mockCenter((await searchParams).c)]);
  return { title: { absolute: center ? `${t.mock.brand} · ${center.name}` : t.mock.brand } };
}

const FEATURE_ICONS = [ShieldCheck, Headphones, PenLine];

export default async function MockLanding({ searchParams }: PageProps<"/mock">) {
  if (await getCandidate()) redirect("/mock/home");
  const sp = await searchParams;
  const [t, center] = await Promise.all([getT(), mockCenter(sp.c)]);
  const M = t.mock;

  if (!center) {
    // A platform with many centers: pick the one you're taking the mock with.
    const centers = await db.center.findMany({ where: { mockTests: { some: { published: true } } }, orderBy: { name: "asc" }, select: { name: true, slug: true, city: true } });
    return (
      <MockShell>
        <h1 className="font-display text-3xl font-extrabold tracking-tight">{M.pickCenter}</h1>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {centers.map((c) => (
            <Link key={c.slug} href={`/mock?c=${c.slug}`} className="rounded-2xl border border-line bg-surface p-5 font-semibold shadow-card hover:border-brand">
              {c.name}
              {c.city && <span className="block text-sm font-normal text-muted">{c.city}</span>}
            </Link>
          ))}
          {centers.length === 0 && <p className="text-muted">{M.noCenters}</p>}
        </div>
      </MockShell>
    );
  }

  const q = `?c=${center.slug}`;
  return (
    <MockShell centerName={center.name} accent={center.accent}>
      <div className="grid gap-10 lg:grid-cols-[1.2fr_1fr] lg:items-start">
        <section>
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-semibold text-ink-2">
            <Clock className="size-3.5 text-brand" /> {M.format}
          </span>
          <h1 className="mt-4 font-display text-4xl leading-tight font-extrabold tracking-tight">{M.landingTitle}</h1>
          <p className="mt-4 text-lg text-muted">{M.landingText}</p>
          <ul className="mt-8 space-y-4">
            {M.features.map((f, i) => {
              const Icon = FEATURE_ICONS[i] ?? BookOpenText;
              return (
                <li key={f.title} className="flex gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-soft text-brand">
                    <Icon className="size-5" />
                  </span>
                  <span>
                    <span className="block font-semibold">{f.title}</span>
                    <span className="block text-sm text-muted">{f.text}</span>
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
        <Card>
          <CardBody className="space-y-5">
            <h2 className="font-display text-xl font-bold">{M.logIn}</h2>
            <ActionForm action={loginCandidate.bind(null, center.id)} submitLabel={M.logInButton} submitClassName="w-full" pendingText={M.loggingIn}>
              <Field label={M.login} hint={M.loginHint}>
                <Input name="login" required autoComplete="username" inputMode="tel" />
              </Field>
              <Field label={M.pin}>
                <Input name="pin" type="password" required inputMode="numeric" autoComplete="current-password" maxLength={8} />
              </Field>
            </ActionForm>
            <p className="border-t border-line pt-4 text-sm text-muted">
              {M.noAccount}{" "}
              <Link href={`/mock/register${q}`} className="font-semibold text-brand hover:underline">
                {M.register}
              </Link>
            </p>
          </CardBody>
        </Card>
      </div>
      <p className="mt-12 text-center text-sm text-muted">
        <Link href="/mock/admin" className="hover:text-brand">
          {M.staffLink}
        </Link>
      </p>
    </MockShell>
  );
}
