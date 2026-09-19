import type { LucideIcon } from "lucide-react";
import {
  Baby,
  BookMarked,
  BookOpenText,
  Bus,
  FlaskConical,
  GraduationCap,
  HandHeart,
  Monitor,
  Palette,
  School,
  Users,
  UsersRound,
} from "lucide-react";

export type SchoolSection = {
  name: string;
  /** A short line under the name, e.g. the classes in a stage. */
  classes?: string;
  description: string;
  icon: LucideIcon;
};

export type SchoolContact = {
  address?: string;
  /** Shown as written; dialled in international form. */
  phones?: string[];
  email?: string;
  hours?: string;
  proprietress?: string;
};

export type SchoolFacility = {
  /** Also the photo's file name in public/images/, e.g. "computer-lab.jpg". */
  photo: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export type TutorialCentre = {
  title: string;
  summary: string;
  points: string[];
};

export type SchoolProfile = {
  name: string;
  shortName: string;
  headline: string;
  motto: string;
  established: number;
  summary: string;
  sections: SchoolSection[];
  /** Life beyond lessons: activities, trips, faith and the people. Same card shape as the stages. */
  beyondTheClassroom: SchoolSection[];
  portalPoints: string[];
  facilities: SchoolFacility[];
  tutorialCentre: TutorialCentre;
  /** Only what the school has confirmed. A missing field is left off the page, never guessed. */
  contact: SchoolContact;
};

/**
 * What the public landing page says about the school. Kept in one place so
 * the office's wording, contact details and photos can be changed without
 * touching layout code. Only facts the system itself holds are stated here —
 * the classes and departments the school runs; everything else waits for the
 * school to supply it.
 */
export const SCHOOL_PROFILE: SchoolProfile = {
  name: "Great Vision Private School",
  shortName: "GVPS",
  headline: "Great Vision Private School",
  motto: "Leading for a greater future",
  established: 2012,
  summary:
    "From Creche to Senior Secondary, one school follows every child's journey — with a family portal that keeps parents close to their children's school life.",
  sections: [
    {
      name: "Early years",
      classes: "Creche · Nursery 1–2 · KG 1–2",
      description: "A caring first step into school, where the youngest learners build confidence through play.",
      icon: Baby,
    },
    {
      name: "Primary",
      classes: "Primary 1–6",
      description: "Strong foundations in reading, numeracy and the habits that carry a child through school.",
      icon: BookOpenText,
    },
    {
      name: "Junior secondary",
      classes: "JSS 1–3",
      description: "A broad curriculum that prepares students for the choices ahead.",
      icon: School,
    },
    {
      name: "Senior secondary",
      classes: "SSS 1–3 · Science, Arts, Commercial",
      description: "Focused study in the department that fits each student's goals.",
      icon: GraduationCap,
    },
  ],
  beyondTheClassroom: [
    {
      name: "Extracurricular activities",
      description: "Activities outside the timetable that build teamwork, talent and confidence.",
      icon: Users,
    },
    {
      name: "Excursions",
      description: "Educational trips that take learning beyond the classroom walls.",
      icon: Bus,
    },
    {
      name: "Art classes",
      description: "Space for every child to draw, paint and create.",
      icon: Palette,
    },
    {
      name: "Social clubs",
      description: "Clubs where students find their interests and make friends across classes.",
      icon: UsersRound,
    },
    {
      name: "Faith and values",
      description: "A religious establishment where character and values are part of every school day.",
      icon: HandHeart,
    },
    {
      name: "Dedicated staff",
      description: "Teachers and staff committed to every child's growth, in and out of class.",
      icon: GraduationCap,
    },
  ],
  portalPoints: [
    "One sign-in shows every one of your children at the school.",
    "See each child's class, form teacher and the details the school holds.",
    "Your login is issued by the school office — no sign-up, no one else's records.",
  ],
  facilities: [
    {
      photo: "computer-lab",
      name: "Computer laboratory",
      description: "Hands-on computer lessons, so students grow up confident with the tools they will use.",
      icon: Monitor,
    },
    {
      photo: "science-lab",
      name: "Science laboratory",
      description: "Practical work in physics, chemistry and biology, as the senior curriculum expects.",
      icon: FlaskConical,
    },
    {
      photo: "tutorial-centre",
      name: "WAEC and JAMB tutorial centre",
      description: "Focused preparation for the exams that open the door to university, right inside the school.",
      icon: BookMarked,
    },
  ],
  tutorialCentre: {
    title: "WAEC and JAMB tutorial centre",
    summary:
      "Inside the school, our tutorial centre prepares candidates for the West African Senior School Certificate Examination and the JAMB UTME.",
    points: ["WAEC (SSCE) preparation", "JAMB (UTME) preparation", "Held within the school premises"],
  },
  contact: {
    address: "10/12 Alfia Tayo Street, Ayetoro, Itele, Ogun State",
    phones: ["0808 795 9017"],
    proprietress: "Mrs Arinde Abosede",
  },
};
