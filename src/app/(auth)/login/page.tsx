import type { Metadata } from "next";
import Link from "next/link";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next } = await searchParams;
  return (
    <div className="animate-fade-up">
      <h1 className="font-display text-3xl font-extrabold tracking-tight">Welcome back</h1>
      <p className="mt-2 text-muted">Log in to continue learning.</p>
      <LoginForm next={typeof next === "string" ? next : ""} />
      <p className="mt-8 text-center text-sm text-muted">
        New student?{" "}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          Join with your center&apos;s code
        </Link>
        <br />
        Running a learning center?{" "}
        <Link href="/register/center" className="font-semibold text-brand hover:underline">
          Create your center
        </Link>
      </p>
    </div>
  );
}
