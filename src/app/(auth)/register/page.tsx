import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = { title: "Join your center" };

export default async function RegisterPage({ searchParams }: PageProps<"/register">) {
  const { code } = await searchParams;
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Create your student account</h1>
      <p className="mt-2 text-muted">Your learning center gives you an invite code. Ask your teacher if you don&apos;t have one.</p>
      <RegisterForm code={typeof code === "string" ? code : ""} />
      <p className="mt-8 text-center text-sm text-muted">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          Log in
        </Link>
      </p>
    </div>
  );
}
