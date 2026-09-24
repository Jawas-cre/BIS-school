import type { Metadata } from "next";
import Link from "next/link";
import { CenterForm } from "./center-form";

export const metadata: Metadata = { title: "Create your learning center" };

export default function RegisterCenterPage() {
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Bring your learning center online</h1>
      <p className="mt-2 text-muted">
        Get your own space with groups, branches, content and analytics. Your students join with an invite code.
      </p>
      <CenterForm />
      <p className="mt-8 text-center text-sm text-muted">
        Already registered?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
