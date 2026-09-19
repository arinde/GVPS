import { CircleCheck } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { StatusPill, type StatusPillProps } from "@/components/common/status-pill";

export type AttentionItem = {
  id: string;
  pill: Omit<StatusPillProps, "children"> & { text: string };
  title: string;
  detail: string;
  action: { href: string; label: string };
};

export type AttentionListProps = { items: AttentionItem[] };

/** STITCH-SCREENS.md screen 1, region 1: what only the superadmin can clear. */
export function AttentionList({ items }: AttentionListProps) {
  return (
    <ContentCard flush>
      <div className="border-border flex flex-wrap items-baseline gap-x-2.5 border-b px-5 py-3">
        <h2 className="text-base">Waiting on you</h2>
        <p className="text-muted-foreground text-xs">Only you can action these</p>
      </div>

      {items.length === 0 ? (
        <p className="text-body flex items-center gap-2 px-5 py-4 text-sm">
          <CircleCheck className="text-success-foreground size-4" aria-hidden="true" />
          Nothing needs you right now.
        </p>
      ) : (
        <ul>
          {items.map((item) => (
            <li
              key={item.id}
              className="border-border flex flex-wrap items-center gap-3 border-b px-5 py-[11px] last:border-b-0"
            >
              <StatusPill tone={item.pill.tone} shape={item.pill.shape}>
                {item.pill.text}
              </StatusPill>
              <div className="min-w-0 flex-1">
                <p className="text-foreground text-sm font-medium">{item.title}</p>
                <p className="text-muted-foreground text-xs">{item.detail}</p>
              </div>
              <AppLinkButton href={item.action.href} variant="secondary" size="small">
                {item.action.label}
              </AppLinkButton>
            </li>
          ))}
        </ul>
      )}
    </ContentCard>
  );
}
