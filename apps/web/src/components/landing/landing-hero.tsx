import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { AppLinkButton } from "@/components/common/app-button";
import { Reveal } from "@/components/landing/reveal";

export type LandingHeroProps = {
  headline: string;
  motto: string;
  summary: string;
  /** Short facts under the buttons, e.g. "Creche to SSS 3". */
  facts: string[];
  /** A photo of the school or its students, laid under a navy wash; none keeps the plain navy. */
  photoSrc: string | null;
};

/** The first screen: who the school is, and the two things visitors come for. */
export function LandingHero({ headline, motto, summary, facts, photoSrc }: LandingHeroProps) {
  return (
    <section className="bg-navy relative overflow-hidden text-[#FCFAFA]">
      {photoSrc ? (
        <>
          <Image src={photoSrc} alt="" fill priority sizes="100vw" className="object-cover" />
          <div aria-hidden="true" className="from-navy via-navy/90 to-navy/50 absolute inset-0 bg-gradient-to-r" />
        </>
      ) : null}
      {/* Soft rings behind the text; decoration only. */}
      <div
        aria-hidden="true"
        className="motion-safe:animate-float absolute -top-40 -right-40 size-[520px] rounded-full border-[60px] border-white/5"
      />
      <div
        aria-hidden="true"
        className="motion-safe:animate-float absolute -bottom-52 -left-24 size-[420px] rounded-full border-[48px] border-white/5 [animation-delay:-7s]"
      />

      <div className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-20 sm:px-8 md:py-28">
        <Reveal>
          <p className="text-primary text-sm font-semibold tracking-wide uppercase">Welcome to</p>
          <h1 className="mt-4 max-w-3xl text-4xl leading-tight font-bold text-white sm:text-5xl">{headline}</h1>
          <p className="text-primary mt-3 text-lg font-semibold italic sm:text-xl">“{motto}”</p>
        </Reveal>
        <Reveal delay={150}>
          <p className="max-w-2xl text-base opacity-85 sm:text-lg">{summary}</p>
        </Reveal>

        <Reveal delay={300} className="flex flex-wrap gap-3">
          <AppLinkButton href="#admissions">
            Admissions
            <ArrowRight aria-hidden="true" />
          </AppLinkButton>
          <AppLinkButton href="/portal/login" variant="secondary">
            Parents: sign in
          </AppLinkButton>
        </Reveal>

        <Reveal delay={450}>
          <ul className="mt-4 flex flex-wrap gap-x-6 gap-y-2 text-sm opacity-80">
            {facts.map((fact) => (
              <li key={fact} className="flex items-center gap-2">
                <span aria-hidden="true" className="bg-primary size-1.5 rounded-full" />
                {fact}
              </li>
            ))}
          </ul>
        </Reveal>
      </div>
    </section>
  );
}
