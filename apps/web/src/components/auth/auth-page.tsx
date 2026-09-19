import type { ReactNode } from "react";
import { ContentCard } from "@/components/common/content-card";

export type AuthPageProps = {
  title: string;
  description: string;
  children: ReactNode;
};

/**
 * The layout for the screens seen before the app shell: signing in, and
 * replacing a temporary password. A single card on the page canvas, with the
 * design system's section heading (STITCH-GLOBAL.md §3).
 */
export function AuthPage({ title, description, children }: AuthPageProps) {
  return (
    <div className="bg-canvas flex flex-1 items-center justify-center px-4 py-16">
      <ContentCard className="w-full max-w-sm">
        <div className="mb-5">
          <h1 className="text-xl">{title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        {children}
      </ContentCard>
    </div>
  );
}
