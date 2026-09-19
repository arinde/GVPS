// A passport photo is 35×45 mm; 360×460 px is plenty for screen and print,
// and as a JPEG it is a few tens of kilobytes. Shrinking in the browser keeps
// uploads fast on a weak connection and the database small.
const MAX_WIDTH = 360;
const MAX_HEIGHT = 460;
const QUALITY = 0.82;

export class PhotoError extends Error {}

/**
 * Reads an image file and returns it as a resized JPEG data URL. Throws
 * PhotoError with a message fit to show when the file is not a usable image.
 */
export async function resizePhoto(file: File): Promise<string> {
  if (!file.type.startsWith("image/")) throw new PhotoError("Choose a photograph — this file is not an image.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new PhotoError("This image could not be read. Try a JPEG or PNG photo.");
  }

  const scale = Math.min(1, MAX_WIDTH / bitmap.width, MAX_HEIGHT / bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) throw new PhotoError("This browser cannot prepare the photo. Try another browser.");
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();

  return canvas.toDataURL("image/jpeg", QUALITY);
}

/** Splits a data URL into what the API takes: { mimeType, base64 }. */
export function photoPayload(dataUrl: string): { mimeType: string; base64: string } {
  const [header = "", base64 = ""] = dataUrl.split(",");
  const mimeType = header.replace(/^data:/, "").replace(/;base64$/, "");
  return { mimeType, base64 };
}
