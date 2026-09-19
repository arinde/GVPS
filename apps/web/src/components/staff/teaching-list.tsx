import { X } from "lucide-react";
import type { TeachingAssignment } from "@/store/api/subjects-api";

export type TeachingListProps = {
  assignments: TeachingAssignment[];
  onRemove: (assignment: TeachingAssignment) => void;
  busyId?: string;
};

/** A teacher's subjects, each with the classes they teach it in; any class can be taken off. Presentational. */
export function TeachingList({ assignments, onRemove, busyId }: TeachingListProps) {
  if (assignments.length === 0) {
    return <p className="text-muted-foreground text-sm">No subjects assigned yet this session.</p>;
  }

  const bySubject = new Map<string, { name: string; code: string; items: TeachingAssignment[] }>();
  for (const assignment of assignments) {
    const entry = bySubject.get(assignment.subject.id) ?? { ...assignment.subject, items: [] };
    entry.items.push(assignment);
    bySubject.set(assignment.subject.id, entry);
  }

  return (
    <ul className="flex flex-col">
      {[...bySubject.values()].map((subject) => (
        <li
          key={subject.name}
          className="border-border flex flex-wrap items-center gap-2 border-b py-2.5 last:border-b-0"
        >
          <span className="text-foreground w-40 shrink-0 text-sm font-medium">
            {subject.name} <span className="text-muted-foreground font-mono text-xs">{subject.code}</span>
          </span>
          {subject.items.map((assignment) => {
            const label = `${assignment.classArm.classLevel.name}${assignment.classArm.name}`;
            return (
              <span
                key={assignment.id}
                className="bg-canvas border-border inline-flex items-center gap-1 rounded-full border py-0.5 pr-1 pl-3 text-xs"
              >
                {label}
                <button
                  type="button"
                  aria-label={`Stop ${subject.name} in ${label}`}
                  disabled={busyId === assignment.id}
                  onClick={() => onRemove(assignment)}
                  className="hover:bg-danger hover:text-danger-foreground rounded-full p-1 disabled:opacity-40"
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            );
          })}
        </li>
      ))}
    </ul>
  );
}
