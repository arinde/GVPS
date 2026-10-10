/**
 * A sensible default subject catalogue for Primary, Junior and Senior
 * secondary — the standard Nigerian curriculum spread, with Senior's
 * electives split by department using the schema's own `stream` field.
 * Every subject and offering is looked up before it is created, so this is
 * safe to run against real data and safe to run more than once. It only
 * ever adds — nothing is renamed or removed. Use the Subjects screen to
 * delete anything the school doesn't want, or add more.
 *
 * Run: npm run db:seed:subjects -w apps/api
 */
import { PrismaClient, Stream } from "@prisma/client";

const prisma = new PrismaClient();

type Section = "PRIMARY" | "JUNIOR" | "SENIOR";
type OfferAt = { section: Section; stream?: Stream };
type CatalogueEntry = { name: string; code: string; offerAt: OfferAt[] };

const CATALOGUE: CatalogueEntry[] = [
  // Across every section.
  { name: "Mathematics", code: "MTH", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }, { section: "SENIOR" }] },
  {
    name: "English Language",
    code: "ENG",
    offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }, { section: "SENIOR" }],
  },
  {
    name: "Civic Education",
    code: "CIV",
    offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }, { section: "SENIOR" }],
  },
  {
    name: "Christian Religious Studies",
    code: "CRS",
    offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }, { section: "SENIOR" }],
  },

  // Primary and Junior.
  { name: "Basic Science", code: "BSC", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  { name: "Social Studies", code: "SOS", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  { name: "Computer Studies", code: "ICT", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  { name: "Creative Arts", code: "CRA", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  { name: "Physical and Health Education", code: "PHE", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  { name: "Home Economics", code: "HEC", offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }] },
  {
    name: "Agricultural Science",
    code: "AGR",
    offerAt: [{ section: "PRIMARY" }, { section: "JUNIOR" }, { section: "SENIOR", stream: Stream.SCIENCE }],
  },
  {
    name: "French",
    code: "FRE",
    offerAt: [{ section: "JUNIOR" }, { section: "SENIOR", stream: Stream.ARTS }],
  },

  // Primary only.
  { name: "Verbal Reasoning", code: "VER", offerAt: [{ section: "PRIMARY" }] },
  { name: "Quantitative Reasoning", code: "QNT", offerAt: [{ section: "PRIMARY" }] },

  // Junior only.
  { name: "Basic Technology", code: "BTE", offerAt: [{ section: "JUNIOR" }] },
  { name: "Business Studies", code: "BUS", offerAt: [{ section: "JUNIOR" }] },

  // Senior — Science department.
  { name: "Physics", code: "PHY", offerAt: [{ section: "SENIOR", stream: Stream.SCIENCE }] },
  { name: "Chemistry", code: "CHE", offerAt: [{ section: "SENIOR", stream: Stream.SCIENCE }] },
  { name: "Biology", code: "BIO", offerAt: [{ section: "SENIOR", stream: Stream.SCIENCE }] },
  { name: "Further Mathematics", code: "FMT", offerAt: [{ section: "SENIOR", stream: Stream.SCIENCE }] },
  { name: "Geography", code: "GEO", offerAt: [{ section: "SENIOR", stream: Stream.SCIENCE }] },

  // Senior — Arts department.
  { name: "Literature in English", code: "LIT", offerAt: [{ section: "SENIOR", stream: Stream.ARTS }] },
  { name: "Government", code: "GOV", offerAt: [{ section: "SENIOR", stream: Stream.ARTS }] },
  { name: "History", code: "HIS", offerAt: [{ section: "SENIOR", stream: Stream.ARTS }] },
  { name: "Fine Art", code: "ART", offerAt: [{ section: "SENIOR", stream: Stream.ARTS }] },

  // Senior — Commercial department.
  { name: "Financial Accounting", code: "ACC", offerAt: [{ section: "SENIOR", stream: Stream.COMMERCIAL }] },
  { name: "Commerce", code: "COM", offerAt: [{ section: "SENIOR", stream: Stream.COMMERCIAL }] },
  { name: "Economics", code: "ECO", offerAt: [{ section: "SENIOR", stream: Stream.COMMERCIAL }] },
  { name: "Office Practice", code: "OFP", offerAt: [{ section: "SENIOR", stream: Stream.COMMERCIAL }] },
];

async function main(): Promise<void> {
  const school = await prisma.school.findFirstOrThrow();
  const levels = await prisma.classLevel.findMany({ where: { schoolId: school.id } });
  const levelsBySection = new Map<Section, typeof levels>();
  for (const level of levels) {
    const list = levelsBySection.get(level.section as Section) ?? [];
    list.push(level);
    levelsBySection.set(level.section as Section, list);
  }

  let subjectsCreated = 0;
  let offeringsCreated = 0;

  for (const entry of CATALOGUE) {
    let subject = await prisma.subject.findFirst({ where: { schoolId: school.id, code: entry.code } });
    if (!subject) {
      subject = await prisma.subject.create({ data: { schoolId: school.id, name: entry.name, code: entry.code } });
      subjectsCreated++;
    }

    for (const target of entry.offerAt) {
      for (const level of levelsBySection.get(target.section) ?? []) {
        const existing = await prisma.subjectOffering.findFirst({
          where: { schoolId: school.id, subjectId: subject.id, classLevelId: level.id, stream: target.stream ?? null },
        });
        if (!existing) {
          await prisma.subjectOffering.create({
            data: {
              schoolId: school.id,
              subjectId: subject.id,
              classLevelId: level.id,
              stream: target.stream ?? null,
              isCore: true,
            },
          });
          offeringsCreated++;
        }
      }
    }
  }

  console.log(`Subjects created: ${subjectsCreated}. Offerings created: ${offeringsCreated}.`);
  console.log("Nothing was renamed or removed. Edit the result under Subjects.");
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
