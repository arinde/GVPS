import { GraduationCap, UserPlus } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { PageContainer } from "@/components/common/page-container";
import { PageHeader } from "@/components/common/page-header";

const ENTRY_POINTS = [
  {
    href: "/students/new",
    title: "Register a student",
    description: "Bio data, guardians and this session's enrolment. The admission number is allocated on save.",
    action: "Register student",
    icon: UserPlus,
  },
  {
    href: "/students",
    title: "Student registry",
    description: "Search the roll by name or admission number.",
    action: "Open registry",
    icon: GraduationCap,
  },
];

// A holding page until the dashboard proper (stat cards, registration
// progress per class — STITCH-SCREENS.md screen 1) is built.
export default function Home() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" subtitle="Phase 1: getting the school roll into the system." />

      <div className="grid gap-5 sm:grid-cols-2 xl:max-w-4xl">
        {ENTRY_POINTS.map((entry) => {
          const Icon = entry.icon;
          return (
            <ContentCard key={entry.href} className="flex flex-col gap-3">
              <Icon className="text-primary size-6" aria-hidden="true" />
              <h2 className="text-base">{entry.title}</h2>
              <p className="text-body text-sm">{entry.description}</p>
              <AppLinkButton href={entry.href} variant="secondary" className="mt-auto self-start">
                {entry.action}
              </AppLinkButton>
            </ContentCard>
          );
        })}
      </div>
    </PageContainer>
  );
}
