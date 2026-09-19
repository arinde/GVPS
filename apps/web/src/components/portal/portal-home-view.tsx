"use client";

import Link from "next/link";
import { ContentCard } from "@/components/common/content-card";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PortalChildPhoto } from "@/components/portal/portal-child-photo";
import { PortalChildView } from "@/components/portal/portal-child-view";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { currentClassLabel } from "@/components/portal/portal-labels";
import { useListPortalChildrenQuery } from "@/store/api/portal-api";

/**
 * The portal's first screen. One child goes straight to their page; several
 * get a card each, since a parent with three children should pick, not dig.
 */
export function PortalHomeView() {
  const { data: children = [], isLoading, isError } = useListPortalChildrenQuery();

  if (isLoading) {
    return (
      <p className="text-muted-foreground text-sm" role="status">
        Loading your children…
      </p>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" role="alert">
        <AlertDescription>Your children could not be loaded. Check the connection and refresh.</AlertDescription>
      </Alert>
    );
  }

  if (children.length === 0) {
    return (
      <ContentCard>
        <EmptyState
          title="No children linked yet"
          description="No student record lists this phone number. Ask the school office to check the number they have for you."
        />
      </ContentCard>
    );
  }

  const [only] = children;
  if (children.length === 1 && only) return <PortalChildView studentId={only.id} />;

  return (
    <>
      <PageHeader title="Your children" subtitle={`${children.length} children at the school`} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {children.map((child) => {
          const name = `${child.firstName} ${child.lastName}`;
          return (
            <Link
              key={child.id}
              href={`/portal/children/${child.id}`}
              className="focus-visible:ring-ring rounded-xl focus-visible:ring-2 focus-visible:outline-none"
            >
              <ContentCard className="hover:bg-zebra flex items-center gap-4 transition-colors">
                <PortalChildPhoto
                  studentId={child.id}
                  name={name}
                  photo={child.photo}
                  className="w-[72px] shrink-0 [&>div]:h-24 [&>div]:w-[72px]"
                />
                <div className="min-w-0">
                  <p className="text-foreground truncate font-semibold">{name}</p>
                  <p className="text-body text-sm">{currentClassLabel(child.enrolments)}</p>
                  <p className="text-muted-foreground font-mono text-xs">{child.admissionNo}</p>
                </div>
              </ContentCard>
            </Link>
          );
        })}
      </div>
    </>
  );
}
