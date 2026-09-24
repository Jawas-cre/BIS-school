import { SearchX } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { getT } from "@/lib/i18n/server";

export default async function NotFound() {
  const t = await getT();
  return (
    <div className="grid min-h-dvh place-items-center px-5">
      <div className="max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand-soft text-brand">
          <SearchX className="size-6" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-extrabold">{t.notFound.title}</h1>
        <p className="mt-2 text-muted">{t.notFound.text}</p>
        <ButtonLink href="/" className="mt-6">{t.notFound.home}</ButtonLink>
      </div>
    </div>
  );
}
