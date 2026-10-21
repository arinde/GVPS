import type {
  ExamQuestion,
  ExamQuestionsContent,
  LectureNoteContent,
  SchemeOfWorkWeek,
} from "@/store/api/teaching-resources-api";

/**
 * Turns one big pasted block of text into the structured shape each form
 * wants, so a teacher with an existing scheme/lecture/question bank typed up
 * elsewhere doesn't have to re-enter it field by field. Pattern-matching, not
 * AI (no budget for that yet) — the result is always a draft the teacher
 * reviews and fixes in the normal form afterward, never a final answer.
 */

// A week number can be given as a range ("Week 12–13") when it covers more
// than one calendar week (exams, a closing week) — only the first number is
// kept as this entry's number.
const WEEK_HEADER = /^week\s*(\d+)(?:\s*[–-]\s*\d+)?\s*[:.\-]?\s*(.*)$/i;
const OBJECTIVES_LABEL = /^objectives?\s*[:\-]\s*(.*)$/i;
const ACTIVITIES_LABEL = /^activities\s*[:\-]\s*(.*)$/i;
const RESOURCES_LABEL = /^resources?\s*[:\-]\s*(.*)$/i;
const REFERENCES_LABEL = /^references?\s*[:\-]\s*(.*)$/i;
const QUESTION_HEADER = /^(\d+)[.)]\s+(.*)$/;
const OPTION_LINE = /^[A-D][.)]\s+(.*)$/i;
const ANSWER_LABEL = /^answer\s*[:\-]\s*([A-D])\b/i;
const MARKS_PATTERN = /\(\s*(\d+)\s*marks?\s*\)/i;

// A pasted list commonly leads each line with a bullet — •, ●, ·, ‣, ▪, ◦, a
// dash or an asterisk — which would otherwise stop every "starts with" regex
// above from matching. Stripped once here so none of those patterns need to
// account for it themselves.
const BULLET_PREFIX = /^[\s•●·‣▪◦\-*]+/;

function nonEmptyLines(text: string): string[] {
  return text.split("\n").map((line) => line.trimEnd().replace(BULLET_PREFIX, ""));
}

export function parseSchemeOfWork(text: string): { weeks: SchemeOfWorkWeek[] } {
  const lines = nonEmptyLines(text);
  const headers: { index: number; match: RegExpExecArray }[] = [];
  lines.forEach((line, index) => {
    const match = WEEK_HEADER.exec(line);
    if (match) headers.push({ index, match });
  });

  // No "Week N" headers at all — fall back to blank-line-separated paragraphs.
  if (headers.length === 0) {
    const blocks = text
      .split(/\n\s*\n/)
      .map((block) => block.trim())
      .filter(Boolean);
    return {
      weeks: blocks.map((block, index) => {
        const [first, ...rest] = block.split("\n");
        return {
          week: index + 1,
          topic: first.trim(),
          objectives: rest.join(" ").trim(),
          activities: "",
          resources: "",
        };
      }),
    };
  }

  const weeks: SchemeOfWorkWeek[] = [];
  headers.forEach(({ index: start, match: header }, position) => {
    const end = headers[position + 1]?.index ?? lines.length;
    const week: SchemeOfWorkWeek = {
      week: Number(header[1]) || position + 1,
      topic: header[2].trim(),
      objectives: "",
      activities: "",
      resources: "",
    };

    let current: "objectives" | "activities" | "resources" | null = null;
    for (let i = start + 1; i < end; i++) {
      const line = lines[i];
      const objectivesMatch = OBJECTIVES_LABEL.exec(line);
      const activitiesMatch = ACTIVITIES_LABEL.exec(line);
      const resourcesMatch = RESOURCES_LABEL.exec(line);
      if (objectivesMatch) {
        current = "objectives";
        week.objectives = objectivesMatch[1].trim();
      } else if (activitiesMatch) {
        current = "activities";
        week.activities = activitiesMatch[1].trim();
      } else if (resourcesMatch) {
        current = "resources";
        week.resources = resourcesMatch[1].trim();
      } else if (current && line.trim()) {
        week[current] = week[current] ? `${week[current]} ${line.trim()}` : line.trim();
      } else if (!current && !week.topic && line.trim()) {
        week.topic = line.trim();
      }
    }
    weeks.push(week);
  });

  return { weeks };
}

export function parseLectureNote(text: string): LectureNoteContent {
  const lines = nonEmptyLines(text);
  const content: LectureNoteContent = { objectives: "", body: "", references: "" };
  let current: "objectives" | "body" | "references" = "body";
  let sawLabel = false;

  for (const line of lines) {
    const objectivesMatch = OBJECTIVES_LABEL.exec(line);
    const referencesMatch = REFERENCES_LABEL.exec(line);
    if (objectivesMatch) {
      current = "objectives";
      sawLabel = true;
      content.objectives = objectivesMatch[1].trim();
    } else if (referencesMatch) {
      current = "references";
      sawLabel = true;
      content.references = referencesMatch[1].trim();
    } else if (line.trim()) {
      content[current] = content[current] ? `${content[current]}\n${line.trim()}` : line.trim();
    }
  }

  // No labels found anywhere — the whole paste is just the lecture content.
  if (!sawLabel) return { objectives: "", body: text.trim(), references: "" };
  return content;
}

export function parseExamQuestions(text: string): ExamQuestionsContent {
  const lines = nonEmptyLines(text);
  const headers: { index: number; match: RegExpExecArray }[] = [];
  lines.forEach((line, index) => {
    const match = QUESTION_HEADER.exec(line);
    if (match) headers.push({ index, match });
  });

  if (headers.length === 0) {
    return { instructions: text.trim(), questions: [] };
  }

  const instructions = lines.slice(0, headers[0].index).join(" ").trim();
  const questions: ExamQuestion[] = [];

  headers.forEach(({ index: start, match: header }, position) => {
    const end = headers[position + 1]?.index ?? lines.length;
    const textParts = [header[2]];
    const options: string[] = [];
    let correctLetter: string | null = null;
    let marks = 1;

    for (let i = start + 1; i < end; i++) {
      const line = lines[i];
      const optionMatch = OPTION_LINE.exec(line);
      const answerMatch = ANSWER_LABEL.exec(line);
      const marksMatch = MARKS_PATTERN.exec(line);
      if (optionMatch) {
        options.push(optionMatch[1].replace(MARKS_PATTERN, "").trim());
      } else if (answerMatch) {
        correctLetter = answerMatch[1].toUpperCase();
      } else if (marksMatch) {
        marks = Number(marksMatch[1]) || 1;
      } else if (line.trim()) {
        textParts.push(line.trim());
      }
    }

    const marksInText = MARKS_PATTERN.exec(textParts.join(" "));
    if (marksInText) marks = Number(marksInText[1]) || marks;

    const correctIndex = correctLetter ? correctLetter.charCodeAt(0) - 65 : -1;
    questions.push({
      number: Number(header[1]) || position + 1,
      text: textParts.join(" ").replace(MARKS_PATTERN, "").trim(),
      type: options.length > 0 ? "OBJECTIVE" : "THEORY",
      options: options.length > 0 ? options : ["", "", "", ""],
      correctAnswer: correctIndex >= 0 ? (options[correctIndex] ?? "") : "",
      marks,
    });
  });

  return { instructions, questions };
}
