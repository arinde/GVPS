import { useState } from "react";
import { usePhotoChoice } from "@/components/common/use-photo-choice";
import { notify } from "@/lib/notify";
import { photoPayload } from "@/lib/resize-photo";
import { useSetStudentPhotoMutation } from "@/store/api/students-api";

/**
 * The photo chosen during registration. It is held, resized, until the
 * student exists, then uploaded. Optional throughout: a missing or failed
 * photo never blocks or undoes a registration (FEATURES.md §3.5).
 */
export function useRegistrationPhoto() {
  // Local form state with no other source, which is what useState is for (AGENTS.md §2).
  const [photo, setPhoto] = useState<string | null>(null);
  const choice = usePhotoChoice();
  const [setStudentPhoto, { isLoading: isUploading }] = useSetStudentPhotoMutation();

  async function choose(file: File) {
    const dataUrl = await choice.prepare(file);
    if (dataUrl) setPhoto(dataUrl);
  }

  async function upload(studentId: string, name: string) {
    if (!photo) return;
    try {
      await setStudentPhoto({ studentId, ...photoPayload(photo) }).unwrap();
    } catch (error) {
      notify.error(error, `${name} is registered, but the photo did not upload. Add it from their profile.`);
    }
  }

  return {
    photo,
    choose,
    upload,
    clear: () => setPhoto(null),
    isUploading,
    preparing: choice.preparing,
    error: choice.error,
  };
}
