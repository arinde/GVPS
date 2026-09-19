import { Reveal } from "@/components/landing/reveal";
import type { SchoolSection } from "@/lib/school-profile";

export type LandingSectionsProps = {
  id: string;
  title: string;
  intro: string;
  sections: SchoolSection[];
  /** Section background: the page canvas (default) or white, so neighbouring bands alternate. */
  tone?: "canvas" | "white";
};

/** A titled row of icon cards: the school's stages, or life beyond the classroom. */
export function LandingSections({ id, title, intro, sections, tone = "canvas" }: LandingSectionsProps) {
  return (
    <section id={id} className={`scroll-mt-16 ${tone === "white" ? "bg-white" : "bg-canvas"}`}>
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-20">
        <Reveal>
          <h2 className="text-3xl font-bold">{title}</h2>
          <p className="text-body mt-2 max-w-2xl">{intro}</p>
        </Reveal>

        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map(({ name, classes, description, icon: Icon }, index) => (
            <Reveal key={name} delay={index * 100}>
              <article
                className={`flex h-full flex-col gap-3 rounded-xl p-6 shadow-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg ${index % 2 ? "bg-stat-yellow" : "bg-stat-lavender"}`}
              >
                <span className="flex size-11 items-center justify-center rounded-full bg-white">
                  <Icon className="text-navy size-5" aria-hidden="true" />
                </span>
                <h3 className="text-lg font-semibold">{name}</h3>
                {classes ? <p className="text-foreground text-sm font-medium">{classes}</p> : null}
                <p className="text-body text-sm">{description}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
