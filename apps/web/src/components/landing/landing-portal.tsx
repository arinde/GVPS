import { CheckCircle2, Smartphone } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { Reveal } from "@/components/landing/reveal";

export type LandingPortalProps = { id: string; points: string[] };

/** Tells parents the family portal exists and how they get in. */
export function LandingPortal({ id, points }: LandingPortalProps) {
  return (
    <section id={id} className="scroll-mt-16 bg-white">
      <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        <Reveal>
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">For parents and guardians</p>
          <h2 className="mt-2 text-3xl font-bold">The family portal</h2>
          <p className="text-body mt-3">
            Follow your children&apos;s school life from your phone. Ask the school office for your login slip.
          </p>
          <ul className="mt-6 flex flex-col gap-3">
            {points.map((point) => (
              <li key={point} className="flex items-start gap-3 text-sm">
                <CheckCircle2 className="text-success-foreground mt-0.5 size-5 shrink-0" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <AppLinkButton href="/portal/login" className="mt-8">
            Sign in to the family portal
          </AppLinkButton>
        </Reveal>

        {/* A phone-shaped illustration of the portal, drawn with the design tokens rather than an image. */}
        <Reveal delay={150} className="flex justify-center">
          <div
            aria-hidden="true"
            className="border-navy motion-safe:animate-float w-64 rounded-[2rem] border-8 bg-white p-4 shadow-xl [animation-duration:9s]"
          >
            <div className="bg-navy flex items-center gap-2 rounded-lg p-3 text-white">
              <Smartphone className="size-4" />
              <span className="text-xs font-semibold">Family portal</span>
            </div>
            {["Your children", "Class and form teacher", "School details"].map((line, index) => (
              <div key={line} className={`mt-3 rounded-lg p-3 ${index % 2 ? "bg-stat-yellow" : "bg-stat-lavender"}`}>
                <div className="bg-navy/70 h-2 w-24 rounded-full" />
                <p className="text-body mt-2 text-[10px]">{line}</p>
              </div>
            ))}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
