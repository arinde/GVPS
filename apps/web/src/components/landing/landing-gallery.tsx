import { Camera } from "lucide-react";
import { LandingPhoto } from "@/components/landing/landing-photo";
import { Reveal } from "@/components/landing/reveal";

export type LandingGalleryProps = { id: string; photos: string[] };

/**
 * School life in pictures. Renders nothing until the school adds photos
 * (gallery-1.jpg, gallery-2.jpg, … in public/images), so the page never shows
 * an empty gallery.
 */
export function LandingGallery({ id, photos }: LandingGalleryProps) {
  if (photos.length === 0) return null;

  return (
    <section id={id} className="bg-canvas scroll-mt-16">
      <div className="mx-auto max-w-6xl px-4 py-16 sm:px-8 md:py-20">
        <Reveal>
          <h2 className="text-3xl font-bold">School life</h2>
          <p className="text-body mt-2">A glimpse of our students at work and play.</p>
        </Reveal>
        <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-3">
          {photos.map((src, index) => (
            <Reveal key={src} delay={(index % 3) * 100} className={index === 0 ? "col-span-2 row-span-2" : ""}>
              <LandingPhoto
                src={src}
                alt={`School life photo ${index + 1}`}
                icon={Camera}
                className={index === 0 ? "aspect-square" : "aspect-[4/3]"}
                sizes="(min-width: 768px) 33vw, 50vw"
              />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
