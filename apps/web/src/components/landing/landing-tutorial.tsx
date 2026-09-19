import { ArrowRight, BookMarked, CheckCircle2 } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { LandingPhoto } from "@/components/landing/landing-photo";
import { Reveal } from "@/components/landing/reveal";
import type { TutorialCentre } from "@/lib/school-profile";

export type LandingTutorialProps = {
  id: string;
  centre: TutorialCentre;
  photoSrc: string | null;
  /** Where "Enquire" goes — the contact section. */
  enquireHref: string;
};

/** The WAEC and JAMB tutorial centre, given its own band so exam candidates find it at a glance. */
export function LandingTutorial({ id, centre, photoSrc, enquireHref }: LandingTutorialProps) {
  return (
    <section id={id} className="bg-navy relative scroll-mt-16 overflow-hidden text-[#FCFAFA]">
      <div
        aria-hidden="true"
        className="motion-safe:animate-float absolute -top-24 -left-24 size-80 rounded-full border-[40px] border-white/5"
      />
      <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        <Reveal>
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">Exam preparation</p>
          <h2 className="mt-2 text-3xl font-bold text-white">{centre.title}</h2>
          <p className="mt-3 opacity-85">{centre.summary}</p>
          <ul className="mt-6 flex flex-col gap-3">
            {centre.points.map((point) => (
              <li key={point} className="flex items-center gap-3 text-sm">
                <CheckCircle2 className="text-primary size-5 shrink-0" aria-hidden="true" />
                {point}
              </li>
            ))}
          </ul>
          <AppLinkButton href={enquireHref} className="mt-8">
            Enquire about the tutorial centre
            <ArrowRight aria-hidden="true" />
          </AppLinkButton>
        </Reveal>

        <Reveal delay={150}>
          <LandingPhoto
            src={photoSrc}
            alt="Students at the tutorial centre"
            icon={BookMarked}
            className="aspect-[4/3] shadow-2xl ring-1 ring-white/10"
            sizes="(min-width: 768px) 50vw, 100vw"
          />
        </Reveal>
      </div>
    </section>
  );
}
