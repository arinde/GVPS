"use client";

import { PhotoPicker } from "@/components/common/photo-picker";
import { usePhotoChoice } from "@/components/common/use-photo-choice";
import { notify } from "@/lib/notify";
import { photoPayload } from "@/lib/resize-photo";
import { useGetStudentPhotoQuery, useSetStudentPhotoMutation } from "@/store/api/students-api";

export type StudentProfilePhotoProps = {
  studentId: string;
  name: string;
  /** From the profile record: present when a photo exists. */
  photo: { updatedAt: string } | null;
  /** Whether this person may add or change it — the roles that register students. */
  canUpload: boolean;
};

/**
 * The passport photo on a student's profile: shown when there is one, and
 * added or replaced in place by staff who register students. The API applies
 * the same class scope as the record itself.
 */
export function StudentProfilePhoto({ studentId, name, photo, canUpload }: StudentProfilePhotoProps) {
  const { data } = useGetStudentPhotoQuery({ studentId, version: photo?.updatedAt ?? "" }, { skip: !photo });
  const [setStudentPhoto, { isLoading: isUploading }] = useSetStudentPhotoMutation();
  const choice = usePhotoChoice();

  async function choose(file: File) {
    const dataUrl = await choice.prepare(file);
    if (!dataUrl) return;
    try {
      await setStudentPhoto({ studentId, ...photoPayload(dataUrl) }).unwrap();
      notify.success(photo ? `Photo of ${name} replaced` : `Photo of ${name} added`);
    } catch (error) {
      notify.error(error, `Could not save the photo of ${name}.`);
    }
  }

  return (
    <PhotoPicker
      className="self-center"
      photoUrl={data?.dataUrl ?? null}
      alt={`Passport photograph of ${name}`}
      onPick={canUpload ? choose : undefined}
      disabled={choice.preparing || isUploading}
      busyLabel={choice.preparing ? "Preparing photo…" : isUploading ? "Saving photo…" : undefined}
      error={choice.error}
    />
  );
}
