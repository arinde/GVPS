"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, Send } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { EnquiryFields } from "@/components/landing/enquiry-fields";
import { withoutFieldErrors } from "@/lib/api-error";
import { notify } from "@/lib/notify";
import { useGetEnquiryOptionsQuery, useSubmitEnquiryMutation, type EnquiryRequest } from "@/store/api/enquiries-api";

const EMPTY: EnquiryRequest = { parentName: "", phone: "", email: "", childName: "", interest: "", message: "" };

/**
 * The public admission enquiry form. Sends to the office without signing in;
 * the office sees it under Enquiries. Validated here for speed and again by
 * the API. The draft is the visitor's own typing (AGENTS.md §2).
 */
export function EnquiryForm() {
  const { data: options } = useGetEnquiryOptionsQuery();
  const [submit, { isLoading }] = useSubmitEnquiryMutation();
  const [draft, setDraft] = useState<EnquiryRequest>(EMPTY);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sentTo, setSentTo] = useState<string>();

  function patch(changes: Partial<EnquiryRequest>) {
    setDraft((previous) => ({ ...previous, ...changes }));
    setErrors((current) => withoutFieldErrors(current, Object.keys(changes)));
  }

  function localErrors(): Record<string, string> {
    const found: Record<string, string> = {};
    if (draft.parentName.trim().length < 2) found.parentName = "Enter your name";
    if (draft.phone.replace(/\D/g, "").length < 10) found.phone = "Enter a phone number we can call";
    if (!draft.interest) found.interest = "Choose what you are enquiring about";
    return found;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const found = localErrors();
    if (Object.keys(found).length) {
      setErrors(found);
      return;
    }
    const body = Object.fromEntries(Object.entries(draft).filter(([, value]) => value !== "")) as EnquiryRequest;
    try {
      await submit(body).unwrap();
      setSentTo(draft.parentName.trim());
      setDraft(EMPTY);
      notify.success("Enquiry sent", { description: "The school office will contact you soon." });
    } catch (error) {
      setErrors(notify.error(error, "Your enquiry could not be sent. Please call the school office.").fieldErrors);
    }
  }

  if (sentTo) {
    return (
      <div role="status" className="flex flex-col items-center gap-3 py-8 text-center">
        <CheckCircle2 className="text-success-foreground size-12" aria-hidden="true" />
        <p className="text-lg font-semibold">Thank you, {sentTo}.</p>
        <p className="text-body text-sm">Your enquiry has reached the school office. They will contact you soon.</p>
        <AppButton variant="secondary" size="small" onClick={() => setSentTo(undefined)}>
          Send another enquiry
        </AppButton>
      </div>
    );
  }

  const interests = (options?.interests ?? []).map((interest) => ({ value: interest, label: interest }));

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
      <EnquiryFields value={draft} onChange={patch} errors={errors} interests={interests} disabled={isLoading} />

      {/* Not for people: hidden from sight and from screen readers. Bots fill every field. */}
      <input
        type="text"
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="absolute -left-[9999px] size-px opacity-0"
        value={draft.website ?? ""}
        onChange={(event) => patch({ website: event.target.value })}
      />

      <AppButton type="submit" disabled={isLoading} className="self-start">
        <Send aria-hidden="true" />
        {isLoading ? "Sending…" : "Send enquiry"}
      </AppButton>
    </form>
  );
}
