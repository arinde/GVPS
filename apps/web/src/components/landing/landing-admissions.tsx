import type { ReactNode } from "react";
import { Clock, Mail, MapPin, Phone, UserRound } from "lucide-react";
import { Reveal } from "@/components/landing/reveal";
import type { SchoolContact } from "@/lib/school-profile";

export type LandingAdmissionsProps = {
  id: string;
  schoolName: string;
  contact: SchoolContact;
  /** The enquiry form, placed beside the contact details. */
  form: ReactNode;
};

/** "0808 795 9017" -> "tel:+2348087959017", so a tap on a phone dials it. */
function telHref(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  return `tel:${digits.startsWith("0") ? `+234${digits.slice(1)}` : `+${digits}`}`;
}

/**
 * Admissions and contact. Shows only the details the school has confirmed —
 * a missing one is left off rather than guessed.
 */
export function LandingAdmissions({ id, schoolName, contact, form }: LandingAdmissionsProps) {
  const rows: { icon: typeof MapPin; label: string; value: ReactNode }[] = [
    { icon: UserRound, label: "Proprietress", value: contact.proprietress },
    { icon: MapPin, label: "Address", value: contact.address },
    {
      icon: Phone,
      label: "Phone",
      value: contact.phones?.length
        ? contact.phones.map((phone, index) => (
            <span key={phone}>
              {index > 0 ? " · " : null}
              <a href={telHref(phone)} className="text-primary hover:underline">
                {phone}
              </a>
            </span>
          ))
        : null,
    },
    {
      icon: Mail,
      label: "Email",
      value: contact.email ? (
        <a href={`mailto:${contact.email}`} className="text-primary hover:underline">
          {contact.email}
        </a>
      ) : null,
    },
    { icon: Clock, label: "Office hours", value: contact.hours },
  ].filter((row) => row.value);

  return (
    <section id={id} className="bg-canvas scroll-mt-16">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-8 md:grid-cols-2 md:py-20">
        <Reveal className="flex flex-col gap-6">
          <div>
            <h2 className="text-3xl font-bold">Admissions</h2>
            <p className="text-body mt-3">
              {schoolName} admits children from Creche through to Senior Secondary. Send an enquiry — about a place, or
              the WAEC and JAMB tutorial centre — and the school office will get back to you. You are also welcome to
              call or visit.
            </p>
          </div>

          <div className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Contact the school office</h3>
            <dl className="mt-4 flex flex-col gap-4">
              {rows.map(({ icon: Icon, label, value }) => (
                <div key={label} className="flex items-start gap-3">
                  <Icon className="text-primary mt-0.5 size-5 shrink-0" aria-hidden="true" />
                  <div>
                    <dt className="text-muted-foreground text-xs">{label}</dt>
                    <dd className="text-foreground text-sm font-medium">{value}</dd>
                  </div>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>

        <Reveal delay={150}>
          <div className="border-border rounded-xl border bg-white p-6 shadow-sm">
            <h3 className="text-lg font-semibold">Send an enquiry</h3>
            <p className="text-muted-foreground mb-4 text-sm">The school office will get back to you by phone.</p>
            {form}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
