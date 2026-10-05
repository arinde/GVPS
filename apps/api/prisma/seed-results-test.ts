/**
 * Dev-only test data for the results flow: a principal, two subject teachers,
 * a form teacher, one parent, three students in a dedicated "TEST" arm of
 * Primary 4, and scores for the current term. Safe to rerun — every record is
 * looked up before it is created. Never touches existing students or classes.
 *
 * Run: npm run db:seed:results-test -w apps/api
 */
import { EnrolmentStatus, GuardianRelationship, PrismaClient, Role, Sex } from "@prisma/client";
import * as argon2 from "argon2";

const prisma = new PrismaClient();

// Dev-only password for the test accounts below. Printed at the end, never used outside dev.
const TEST_PASSWORD = "TestPass123!";
const ARM_NAME = "TEST";
const LEVEL_NAME = "Primary 4";

const ACCOUNTS = {
  principal: { email: "principal.test@gvps.test", firstName: "Test", lastName: "Principal", roles: [Role.PRINCIPAL] },
  mathsTeacher: {
    email: "maths.test@gvps.test",
    firstName: "Test",
    lastName: "MathsTeacher",
    roles: [Role.SUBJECT_TEACHER],
  },
  englishTeacher: {
    email: "english.test@gvps.test",
    firstName: "Test",
    lastName: "EnglishTeacher",
    roles: [Role.SUBJECT_TEACHER],
  },
  formTeacher: { email: "form.test@gvps.test", firstName: "Test", lastName: "FormTeacher", roles: [Role.FORM_TEACHER] },
} as const;

const PARENT_PHONE = "08011110001";

const STUDENTS = [
  {
    admissionNo: "TEST-0001",
    firstName: "Ada",
    lastName: "Testone",
    sex: Sex.FEMALE,
    maths: [35, 52],
    english: [30, 50],
  },
  {
    admissionNo: "TEST-0002",
    firstName: "Bola",
    lastName: "Testtwo",
    sex: Sex.MALE,
    maths: [28, 45],
    english: [36, 58],
  },
  // English Exam left blank on purpose, so the "submit with blank cells" check has something to catch.
  {
    admissionNo: "TEST-0003",
    firstName: "Chidi",
    lastName: "Testthree",
    sex: Sex.MALE,
    maths: [22, 40],
    english: [25, null],
  },
] as const;

async function main(): Promise<void> {
  if (process.env.NODE_ENV === "production") throw new Error("Refusing to seed test accounts in production.");

  const school = await prisma.school.findFirstOrThrow();
  const schoolId = school.id;
  const session = await prisma.academicSession.findFirstOrThrow({ where: { schoolId, isCurrent: true } });
  const term = await prisma.term.findFirstOrThrow({ where: { schoolId, sessionId: session.id, isCurrent: true } });
  const level = await prisma.classLevel.findFirstOrThrow({ where: { schoolId, name: LEVEL_NAME } });

  const passwordHash = await argon2.hash(TEST_PASSWORD);

  const staff: Record<keyof typeof ACCOUNTS, string> = {} as Record<keyof typeof ACCOUNTS, string>;
  for (const [key, account] of Object.entries(ACCOUNTS) as [
    keyof typeof ACCOUNTS,
    (typeof ACCOUNTS)[keyof typeof ACCOUNTS],
  ][]) {
    const existing = await prisma.staff.findFirst({ where: { schoolId, email: account.email } });
    const member =
      existing ??
      (await prisma.staff.create({
        data: {
          schoolId,
          email: account.email,
          passwordHash,
          mustChangePassword: false,
          firstName: account.firstName,
          lastName: account.lastName,
        },
      }));
    for (const role of account.roles) {
      await prisma.staffRole.upsert({
        where: { staffId_role: { staffId: member.id, role } },
        create: { staffId: member.id, role },
        update: {},
      });
    }
    staff[key] = member.id;
  }

  let arm = await prisma.classArm.findFirst({ where: { schoolId, classLevelId: level.id, name: ARM_NAME } });
  arm ??= await prisma.classArm.create({ data: { schoolId, classLevelId: level.id, name: ARM_NAME } });

  const subjects = {
    maths: await upsertSubject(schoolId, "Mathematics", "MTH"),
    english: await upsertSubject(schoolId, "English Language", "ENG"),
  };
  for (const subject of Object.values(subjects)) {
    const offered = await prisma.subjectOffering.findFirst({
      where: { schoolId, subjectId: subject.id, classLevelId: level.id },
    });
    if (!offered) {
      await prisma.subjectOffering.create({
        data: { schoolId, subjectId: subject.id, classLevelId: level.id, isCore: true },
      });
    }
  }

  await assign(schoolId, session.id, subjects.maths.id, arm.id, staff.mathsTeacher);
  await assign(schoolId, session.id, subjects.english.id, arm.id, staff.englishTeacher);

  const classAssignment = await prisma.classAssignment.findUnique({
    where: { sessionId_classArmId: { sessionId: session.id, classArmId: arm.id } },
  });
  if (!classAssignment) {
    await prisma.classAssignment.create({
      data: { schoolId, sessionId: session.id, classArmId: arm.id, staffId: staff.formTeacher },
    });
  }

  const components = await prisma.assessmentComponent.findMany({
    where: { schoolId, termId: term.id, section: level.section },
    orderBy: { createdAt: "asc" },
  });
  if (components.length !== 2) {
    throw new Error(
      "Expected two assessment components (CA and Exam) for this term's section. Run db:seed:assessment first.",
    );
  }
  const [ca, exam] = components;

  const studentIds: string[] = [];
  for (const row of STUDENTS) {
    let student = await prisma.student.findFirst({ where: { schoolId, admissionNo: row.admissionNo } });
    student ??= await prisma.student.create({
      data: {
        schoolId,
        admissionNo: row.admissionNo,
        firstName: row.firstName,
        lastName: row.lastName,
        dateOfBirth: new Date("2017-05-01"),
        sex: row.sex,
        admissionYear: 2026,
        admittedIntoLevelId: level.id,
      },
    });
    studentIds.push(student.id);

    const enrolment = await prisma.enrolment.findFirst({
      where: { schoolId, studentId: student.id, sessionId: session.id },
    });
    if (!enrolment) {
      await prisma.enrolment.create({
        data: {
          schoolId,
          studentId: student.id,
          sessionId: session.id,
          classArmId: arm.id,
          status: EnrolmentStatus.ACTIVE,
        },
      });
    }

    const scores: [string, string, number | null, number | null][] = [
      [subjects.maths.id, staff.mathsTeacher, row.maths[0], row.maths[1]],
      [subjects.english.id, staff.englishTeacher, row.english[0], row.english[1]],
    ];
    for (const [subjectId, enteredById, caValue, examValue] of scores) {
      for (const [component, value] of [
        [ca, caValue],
        [exam, examValue],
      ] as const) {
        if (value === null) continue;
        await prisma.score.upsert({
          where: {
            termId_studentId_subjectId_assessmentComponentId: {
              termId: term.id,
              studentId: student.id,
              subjectId,
              assessmentComponentId: component.id,
            },
          },
          create: {
            schoolId,
            termId: term.id,
            studentId: student.id,
            subjectId,
            classArmId: arm.id,
            assessmentComponentId: component.id,
            value,
            enteredById,
          },
          update: { value, enteredById },
        });
      }
    }
  }

  await seedParent(schoolId, studentIds[0], passwordHash);

  console.log(`\nTest data ready in ${LEVEL_NAME}${ARM_NAME} for ${term.name}, ${session.name}.\n`);
  console.log(`Password for every test account: ${TEST_PASSWORD}`);
  for (const [key, account] of Object.entries(ACCOUNTS)) console.log(`  ${account.email.padEnd(28)} ${key}`);
  console.log(`  Parent portal phone: ${PARENT_PHONE}`);
  console.log(`\nStudents: ${STUDENTS.map((s) => `${s.firstName} ${s.lastName} (${s.admissionNo})`).join(", ")}`);
  console.log("Testthree's English exam is blank, so submitting English should be refused until it is filled.\n");
}

/** Reuses a real subject with the same name or code rather than creating a duplicate. */
async function upsertSubject(schoolId: string, name: string, code: string) {
  const existing = await prisma.subject.findFirst({ where: { schoolId, OR: [{ code }, { name }] } });
  return existing ?? prisma.subject.create({ data: { schoolId, name, code } });
}

async function assign(schoolId: string, sessionId: string, subjectId: string, classArmId: string, staffId: string) {
  const existing = await prisma.subjectAssignment.findFirst({
    where: { schoolId, sessionId, subjectId, classArmId },
  });
  if (!existing) {
    await prisma.subjectAssignment.create({ data: { schoolId, sessionId, subjectId, classArmId, staffId } });
  }
}

async function seedParent(schoolId: string, studentId: string, passwordHash: string) {
  let guardian = await prisma.guardian.findFirst({ where: { schoolId, phone: PARENT_PHONE } });
  guardian ??= await prisma.guardian.create({
    data: { schoolId, firstName: "Test", lastName: "Parent", phone: PARENT_PHONE, email: "parent.test@gvps.test" },
  });
  const link = await prisma.studentGuardian.findFirst({ where: { studentId, guardianId: guardian.id } });
  if (!link) {
    await prisma.studentGuardian.create({
      data: {
        schoolId,
        studentId,
        guardianId: guardian.id,
        relationship: GuardianRelationship.FATHER,
        isPrimary: true,
      },
    });
  }
  const account = await prisma.parentAccount.findFirst({ where: { schoolId, phone: PARENT_PHONE } });
  if (!account) {
    await prisma.parentAccount.create({
      data: { schoolId, phone: PARENT_PHONE, passwordHash, mustChangePassword: false },
    });
  }
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
