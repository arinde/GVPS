import type { Metadata } from "next";
import { EnquiryForm } from "@/components/landing/enquiry-form";
import { LandingAdmissions } from "@/components/landing/landing-admissions";
import { LandingFacilities } from "@/components/landing/landing-facilities";
import { LandingFooter } from "@/components/landing/landing-footer";
import { LandingGallery } from "@/components/landing/landing-gallery";
import { LandingHeader } from "@/components/landing/landing-header";
import { LandingHero } from "@/components/landing/landing-hero";
import { LandingPortal } from "@/components/landing/landing-portal";
import { LandingSections } from "@/components/landing/landing-sections";
import { LandingTutorial } from "@/components/landing/landing-tutorial";
import { publicImage, publicImageSeries } from "@/lib/public-image";
import { SCHOOL_PROFILE } from "@/lib/school-profile";

export const metadata: Metadata = {
  title: SCHOOL_PROFILE.name,
  description: SCHOOL_PROFILE.summary,
};

const ANCHORS = {
  school: "our-school",
  life: "school-life-beyond",
  facilities: "facilities",
  tutorial: "tutorial-centre",
  gallery: "school-life",
  portal: "family-portal",
  admissions: "admissions",
};

// Up to this many gallery photos: gallery-1.jpg … gallery-9.jpg in public/images.
const GALLERY_MAX = 9;

/**
 * The school's public front page. A server component: no session and no API
 * calls. Photos are picked up from public/images as the school adds them.
 */
export default function LandingPage() {
  const school = SCHOOL_PROFILE;
  const facilities = school.facilities.map(({ photo, ...facility }) => ({ ...facility, photoSrc: publicImage(photo) }));

  return (
    <div className="flex min-h-full flex-1 flex-col bg-white">
      <LandingHeader
        schoolName={school.name}
        shortName={school.shortName}
        links={[
          { href: `#${ANCHORS.school}`, label: "Our school" },
          { href: `#${ANCHORS.facilities}`, label: "Facilities" },
          { href: `#${ANCHORS.life}`, label: "School life" },
          { href: `#${ANCHORS.tutorial}`, label: "WAEC & JAMB" },
          { href: `#${ANCHORS.admissions}`, label: "Admissions" },
        ]}
      />
      <main className="flex-1">
        <LandingHero
          headline={school.headline}
          motto={school.motto}
          summary={school.summary}
          facts={[
            `Established ${school.established}`,
            "Creche to SSS 3",
            "Computer and science laboratories",
            "WAEC and JAMB tutorial centre",
          ]}
          photoSrc={publicImage("hero")}
        />
        <LandingSections
          id={ANCHORS.school}
          title="Our school"
          intro={`Four stages, one school, since ${school.established}. A child can start in Creche and finish Senior Secondary with us.`}
          sections={school.sections}
        />
        <LandingFacilities id={ANCHORS.facilities} facilities={facilities} />
        <LandingTutorial
          id={ANCHORS.tutorial}
          centre={school.tutorialCentre}
          photoSrc={publicImage("tutorial-centre")}
          enquireHref={`#${ANCHORS.admissions}`}
        />
        <LandingSections
          id={ANCHORS.life}
          title="Beyond the classroom"
          intro="Education here is more than lessons: faith, creativity, friendships and the world outside."
          sections={school.beyondTheClassroom}
          tone="white"
        />
        <LandingGallery id={ANCHORS.gallery} photos={publicImageSeries("gallery", GALLERY_MAX)} />
        <LandingPortal id={ANCHORS.portal} points={school.portalPoints} />
        <LandingAdmissions
          id={ANCHORS.admissions}
          schoolName={school.name}
          contact={school.contact}
          form={<EnquiryForm />}
        />
      </main>
      <LandingFooter
        schoolName={school.name}
        motto={school.motto}
        established={school.established}
        year={new Date().getFullYear()}
      />
    </div>
  );
}
