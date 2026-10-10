"use client";

import { AppButton } from "@/components/common/app-button";
import { crestInitials } from "@/components/layout/app-sidebar";
import { notify } from "@/lib/notify";
import { printIdCard } from "@/lib/print-id-card";
import { useGetStudentPhotoQuery } from "@/store/api/students-api";

export type PrintIdCardButtonProps = {
  studentId: string;
  schoolName: string;
  schoolAddress: string | null;
  schoolPhone: string | null;
  name: string;
  admissionNo: string;
  classLabel: string | null;
  session: string | null;
  photo: { updatedAt: string } | null;
  position: string | null;
};

/** FEATURES.md §3.7 — a printable ID card: photo, admission number, class, session, school branding, and front/back. */
export function PrintIdCardButton({
  studentId,
  schoolName,
  schoolAddress,
  schoolPhone,
  name,
  admissionNo,
  classLabel,
  session,
  photo,
  position,
}: PrintIdCardButtonProps) {
  const { data } = useGetStudentPhotoQuery({ studentId, version: photo?.updatedAt ?? "" }, { skip: !photo });

  function print() {
    if (!classLabel || !session) {
      notify.warning(`${name} has no active enrolment, so there's no class or session to print.`);
      return;
    }
    printIdCard({
      schoolName,
      schoolAddress,
      schoolPhone,
      initials: crestInitials(schoolName),
      name,
      admissionNo,
      classLabel,
      session,
      photoDataUrl: data?.dataUrl ?? null,
      position,
    });
  }

  return (
    <AppButton type="button" variant="secondary" onClick={print}>
      Preview ID card
    </AppButton>
  );
}
