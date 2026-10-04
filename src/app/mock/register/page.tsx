import Link from "next/link";
import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getCandidate, mockCenter } from "@/lib/mock/session";
import { MockShell } from "@/components/mock/mock-header";
import { Card, CardBody } from "@/components/ui/card";
import { Field, Input } from "@/components/ui/form";
import { ActionForm } from "@/components/action-form";
import { registerCandidate } from "../actions";
import { getT, pageTitle } from "@/lib/i18n/server";

export const generateMetadata = pageTitle((t) => t.mock.registerTitle) as () => Promise<Metadata>;

export default async function MockRegister({ searchParams }: PageProps<"/mock/register">) {
  if (await getCandidate()) redirect("/mock/home");
  const sp = await searchParams;
  const [t, center] = await Promise.all([getT(), mockCenter(sp.c)]);
  if (!center) notFound();
  const M = t.mock;
  return (
    <MockShell centerName={center.name} accent={center.accent}>
      <Card className="mx-auto max-w-lg">
        <CardBody className="space-y-5">
          <div>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{M.registerTitle}</h1>
            <p className="mt-1 text-sm text-muted">{M.registerText}</p>
          </div>
          <ActionForm action={registerCandidate.bind(null, center.id)} submitLabel={M.registerButton} submitClassName="w-full" pendingText={M.creating}>
            <Field label={M.fullName} hint={M.fullNameHint}>
              <Input name="name" required autoComplete="name" maxLength={80} />
            </Field>
            <Field label={M.phone}>
              <Input name="phone" type="tel" required autoComplete="tel" placeholder="+998 90 123 45 67" />
            </Field>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={M.pin} hint={M.pinHint}>
                <Input name="pin" type="password" required inputMode="numeric" autoComplete="new-password" minLength={4} maxLength={8} />
              </Field>
              <Field label={M.repeatPin}>
                <Input name="pin2" type="password" required inputMode="numeric" autoComplete="new-password" minLength={4} maxLength={8} />
              </Field>
            </div>
          </ActionForm>
          <p className="border-t border-line pt-4 text-sm text-muted">
            {M.haveAccount}{" "}
            <Link href={`/mock?c=${center.slug}`} className="font-semibold text-brand hover:underline">
              {M.logIn}
            </Link>
          </p>
        </CardBody>
      </Card>
    </MockShell>
  );
}
