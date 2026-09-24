import { Markdown } from "@/components/markdown";
import { cn } from "@/lib/utils";

/** Passage + question layout: a split view when the question comes with a passage. */
export function QuestionBody({
  passage,
  stem,
  children,
  split = true,
}: {
  passage: string | null;
  stem: string;
  children: React.ReactNode;
  split?: boolean;
}) {
  const hasPassage = Boolean(passage);
  const twoCol = split && hasPassage;
  return (
    <div className={cn("grid gap-6", twoCol && "lg:grid-cols-2 lg:gap-0")}>
      {hasPassage && (
        <div className={cn(twoCol && "lg:border-r lg:border-line lg:pr-8")}>
          <Markdown className="passage">{passage!}</Markdown>
        </div>
      )}
      <div className={cn(twoCol && "lg:pl-8")}>
        <Markdown className={cn("text-[15px] text-ink", hasPassage && "font-semibold")}>{stem}</Markdown>
        <div className="mt-5">{children}</div>
      </div>
    </div>
  );
}
