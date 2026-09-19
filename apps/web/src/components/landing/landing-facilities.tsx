import { LandingPhoto } from "@/components/landing/landing-photo";
import { Reveal } from "@/components/landing/reveal";
import type { SchoolFacility } from "@/lib/school-profile";

export type LandingFacility = Omit<SchoolFacility, "photo"> & { photoSrc: string | null };

export type LandingFacilitiesProps = { id: string; facilities: LandingFacility[] };

/** The school's facilities, each with its photo (or a drawn panel until one is added). */
export function LandingFacilities({ id, facilities }: LandingFacilitiesProps) {
  return (
    <section id={id} className="scroll-mt-16 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-20">
        <Reveal>
          <h2 className="text-3xl font-bold">Our facilities</h2>
          <p className="text-body mt-2 max-w-2xl">Spaces built for learning by doing.</p>
        </Reveal>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {facilities.map((facility, index) => (
            <Reveal key={facility.name} delay={index * 120}>
              <article className="border-border flex h-full flex-col overflow-hidden rounded-xl border bg-white shadow-sm motion-safe:transition-all motion-safe:duration-300 motion-safe:hover:-translate-y-1 motion-safe:hover:shadow-lg">
                <LandingPhoto
                  src={facility.photoSrc}
                  alt={facility.name}
                  icon={facility.icon}
                  className="aspect-[4/3] rounded-none"
                />
                <div className="flex flex-col gap-2 p-5">
                  <h3 className="text-lg font-semibold">{facility.name}</h3>
                  <p className="text-body text-sm">{facility.description}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
