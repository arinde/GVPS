import { existsSync } from "node:fs";
import path from "node:path";

const EXTENSIONS = ["jpg", "jpeg", "png", "webp"];
const IMAGE_DIR = path.join(process.cwd(), "public", "images");

/**
 * The public URL of a school photo in `public/images/`, or null when it has
 * not been added yet. Lets the landing page show a photo the moment the file
 * is dropped in, and a drawn placeholder until then — never a broken image.
 * Server components only: it reads the file system, so a client import fails the build.
 */
export function publicImage(name: string): string | null {
  const extension = EXTENSIONS.find((candidate) => existsSync(path.join(IMAGE_DIR, `${name}.${candidate}`)));
  return extension ? `/images/${name}.${extension}` : null;
}

/** Every numbered photo present in a series: gallery-1, gallery-2, … up to `max`. */
export function publicImageSeries(prefix: string, max: number): string[] {
  return Array.from({ length: max }, (_, index) => publicImage(`${prefix}-${index + 1}`)).filter(
    (src): src is string => src !== null,
  );
}
