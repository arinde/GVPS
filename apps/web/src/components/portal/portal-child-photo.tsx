"use client";

import { PhotoPicker } from "@/components/common/photo-picker";
import { useGetPortalChildPhotoQuery } from "@/store/api/portal-api";

export type PortalChildPhotoProps = {
  studentId: string;
  name: string;
  photo: { updatedAt: string } | null;
  className?: string;
};

/** A child's passport photo in the portal: display only — the school keeps photos up to date. */
export function PortalChildPhoto({ studentId, name, photo, className }: PortalChildPhotoProps) {
  const { data } = useGetPortalChildPhotoQuery({ studentId, version: photo?.updatedAt ?? "" }, { skip: !photo });
  return <PhotoPicker className={className} photoUrl={data?.dataUrl ?? null} alt={`Passport photograph of ${name}`} />;
}
