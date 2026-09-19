import Image from "next/image";
import type { LucideIcon } from "lucide-react";
import { cn } from "cn";

export type LandingPhotoProps = {
  /** A resolved public path, or null while the school has not added the photo. */
  src: string | null;
  alt: string;
  /** Drawn instead of a photo until one is added. */
  icon: LucideIcon;
  className?: string;
  sizes?: string;
};

/** A school photo in a rounded frame that zooms gently on hover; an illustrated panel until the photo exists. */
export function LandingPhoto({
  src,
  alt,
  icon: Icon,
  className,
  sizes = "(min-width: 768px) 33vw, 100vw",
}: LandingPhotoProps) {
  return (
    <div className={cn("group relative overflow-hidden rounded-xl", className)}>
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          sizes={sizes}
          className="object-cover motion-safe:transition-transform motion-safe:duration-700 motion-safe:group-hover:scale-105"
        />
      ) : (
        <div
          role="img"
          aria-label={`${alt} (photo coming soon)`}
          className="from-navy to-primary flex size-full items-center justify-center bg-gradient-to-br"
        >
          <Icon
            aria-hidden="true"
            className="size-16 text-white/85 motion-safe:transition-transform motion-safe:duration-500 motion-safe:group-hover:scale-110"
          />
        </div>
      )}
    </div>
  );
}
