import { z } from "zod";

// The browser shrinks the photo to a small JPEG before sending it, so a real
// passport photo is a few tens of kilobytes. The cap stays under the JSON body
// limit and refuses anything that skipped the resize.
const MAX_BASE64_LENGTH = 95_000;

export const StudentPhotoSchema = z.object({
  mimeType: z.enum(["image/jpeg", "image/png", "image/webp"], "Upload a JPEG, PNG or WebP image"),
  base64: z
    .string()
    .min(1, "Choose a photograph")
    .max(MAX_BASE64_LENGTH, "This photograph is too large. Choose a smaller image")
    .regex(/^[A-Za-z0-9+/]+={0,2}$/, "This file is not a readable image"),
});

export type StudentPhotoDto = z.infer<typeof StudentPhotoSchema>;
