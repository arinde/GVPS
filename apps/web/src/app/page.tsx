import Link from "next/link";
import { ClipboardList, UserPlus, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const ENTRY_POINTS = [
  {
    href: "/students/new",
    title: "Register a student",
    description: "Bio data, guardians and this session's enrolment. The admission number is allocated on save.",
    icon: UserPlus,
  },
  {
    href: "/students",
    title: "Student registry",
    description: "Search the roll by name or admission number.",
    icon: Users,
  },
];

export default function Home() {
  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-12">
      <h1 className="text-3xl">Overview</h1>
      <p className="text-muted-foreground mt-1 text-sm">
        Phase 1: getting the school roll into the system. Results and fees come later.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {ENTRY_POINTS.map((entry) => {
          const Icon = entry.icon;
          return (
            <Card key={entry.href}>
              <CardHeader>
                <Icon className="text-muted-foreground size-5" aria-hidden="true" />
                <CardTitle>{entry.title}</CardTitle>
                <CardDescription>{entry.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button variant="outline" render={<Link href={entry.href} />}>
                  Open
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <p className="text-muted-foreground mt-8 flex items-center gap-2 text-xs">
        <ClipboardList className="size-4" aria-hidden="true" />
        Signed-out visitors are sent to the sign-in page.
      </p>
    </div>
  );
}
