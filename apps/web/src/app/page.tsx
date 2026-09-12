import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">GVPS</h1>
      <p className="text-muted-foreground max-w-sm text-sm">
        School management system — placeholder homepage, nothing built here yet.
      </p>
      <Button render={<Link href="/login" />}>Sign in</Button>
    </div>
  );
}
