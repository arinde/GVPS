import { GraduationCap, UserPlus, type LucideIcon } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";

type EntryPoint = { href: string; title: string; description: string; action: string; icon: LucideIcon };

const REGISTER: EntryPoint = {
  href: "/students/new",
  title: "Register a student",
  description: "Bio data, guardians and this session's enrolment. The admission number is allocated on save.",
  action: "Register student",
  icon: UserPlus,
};

const REGISTRY: EntryPoint = {
  href: "/students",
  title: "Student registry",
  description: "Search the roll by name or admission number.",
  action: "Open registry",
  icon: GraduationCap,
};

export type QuickLinksDashboardProps = { greeting: string; canRegister: boolean };

/**
 * The home page for everyone but school leadership, until the teacher home
 * (STITCH-SCREENS.md screen 13) is built with scores and attendance.
 */
export function QuickLinksDashboard({ greeting, canRegister }: QuickLinksDashboardProps) {
  const entries = canRegister ? [REGISTER, REGISTRY] : [REGISTRY];
  return (
    <PageContainer>
      <PageHeader title={greeting} />

      <div className="grid gap-5 sm:grid-cols-2 xl:max-w-4xl">
        {entries.map(({ href, title, description, action, icon: Icon }) => (
          <ContentCard key={href} className="flex flex-col gap-3">
            <Icon className="text-primary size-6" aria-hidden="true" />
            <h2 className="text-base">{title}</h2>
            <p className="text-body text-sm">{description}</p>
            <AppLinkButton href={href} variant="secondary" className="mt-auto self-start">
              {action}
            </AppLinkButton>
          </ContentCard>
        ))}
      </div>
    </PageContainer>
  );
}
