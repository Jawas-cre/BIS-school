import Link from "next/link";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser, homeFor, isStaff } from "@/lib/auth";
import { ownerCenter } from "@/lib/site";
import { MockShell } from "@/components/mock/mock-header";
import { Card, CardBody } from "@/components/ui/card";
import { LoginForm } from "@/app/(auth)/login/login-form";
import { getT } from "@/lib/i18n/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getT();
  return { title: { absolute: `${t.mock.staffLoginTitle} · ${t.mock.brand}` } };
}

/** Staff sign in here with their email or teacher ID, in the CD mock's own look. */
export default async function MockStaffLogin({ searchParams }: PageProps<"/mock/staff">) {
  const { next } = await searchParams;
  const user = await getCurrentUser();
  if (user && isStaff(user.role)) redirect("/mock/admin");
  if (user) redirect(homeFor(user.role));
  // A brand-new copy without an admin yet: create the center and its admin first.
  if ((await db.user.count()) === 0) redirect("/setup");
  const [t, center] = await Promise.all([getT(), ownerCenter()]);
  const M = t.mock;
  const target = typeof next === "string" && next.startsWith("/mock/admin") ? next : "/mock/admin";
  return (
    <MockShell centerName={center?.name} accent={center?.accent}>
      <div className="mx-auto max-w-md">
        <Card>
          <CardBody>
            <h1 className="font-display text-2xl font-extrabold tracking-tight">{M.staffLoginTitle}</h1>
            <p className="mt-2 text-sm text-muted">{M.staffLoginText}</p>
            <LoginForm next={target} />
          </CardBody>
        </Card>
        <p className="mt-6 text-center text-sm">
          <Link href="/mock" className="font-semibold text-brand hover:underline">
            {M.toCandidateSite}
          </Link>
        </p>
      </div>
    </MockShell>
  );
}
