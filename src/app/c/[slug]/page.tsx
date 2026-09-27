import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { CenterSite } from "@/components/site/center-site";

// Every center's public website: courses, teachers, results, branches, FAQ and a trial lesson form.
export async function generateMetadata({ params }: PageProps<"/c/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const center = await db.center.findUnique({ where: { slug }, select: { name: true, heroText: true, about: true } });
  return center ? { title: { absolute: center.name }, description: center.heroText || center.about || undefined } : {};
}

export default async function CenterPage({ params }: PageProps<"/c/[slug]">) {
  const { slug } = await params;
  const center = await db.center.findUnique({ where: { slug }, select: { id: true } });
  if (!center) notFound();
  return <CenterSite centerId={center.id} />;
}
