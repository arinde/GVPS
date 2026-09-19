import { useState } from "react";
import { PhotoError, resizePhoto } from "@/lib/resize-photo";

/**
 * Turns a chosen file into a small JPEG data URL, tracking the wait and any
 * readable error. Shared by registration and the student profile so both
 * treat a bad file the same way.
 */
export function usePhotoChoice() {
  const [preparing, setPreparing] = useState(false);
  const [error, setError] = useState<string>();

  /** Resolves to the data URL, or null when the file could not be used (the error is set). */
  async function prepare(file: File): Promise<string | null> {
    setPreparing(true);
    setError(undefined);
    try {
      return await resizePhoto(file);
    } catch (caught) {
      setError(caught instanceof PhotoError ? caught.message : "This photo could not be prepared. Try another.");
      return null;
    } finally {
      setPreparing(false);
    }
  }

  return { prepare, preparing, error, clearError: () => setError(undefined) };
}
