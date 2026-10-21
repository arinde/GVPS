import type {
  ExamQuestionsContent,
  LectureNoteContent,
  SchemeOfWorkContent,
  TeachingResource,
} from "@/store/api/teaching-resources-api";

export type PrintTeachingResourceData = {
  schoolName: string;
  subjectName: string;
  classLevelName: string;
  termName: string;
  resource: TeachingResource;
};

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}

function nl2br(value: string): string {
  return escapeHtml(value).replace(/\n/g, "<br/>");
}

function schemeOfWorkBody(content: SchemeOfWorkContent): string {
  return content.weeks
    .map(
      (week) => `
        <tr>
          <td>${week.week}</td>
          <td>${escapeHtml(week.topic)}</td>
          <td>${nl2br(week.objectives)}</td>
          <td>${nl2br(week.activities)}</td>
          <td>${nl2br(week.resources)}</td>
        </tr>`,
    )
    .join("");
}

function lectureNoteBody(content: LectureNoteContent): string {
  return `
    ${content.objectives ? `<h2>Objectives</h2><p>${nl2br(content.objectives)}</p>` : ""}
    <h2>Content</h2>
    <p>${nl2br(content.body)}</p>
    ${content.references ? `<h2>References</h2><p>${nl2br(content.references)}</p>` : ""}
  `;
}

function examQuestionsBody(content: ExamQuestionsContent): string {
  const instructions = content.instructions ? `<p class="instructions">${nl2br(content.instructions)}</p>` : "";
  const questions = content.questions
    .map((question) => {
      const options =
        question.type === "OBJECTIVE"
          ? `<ol type="A">${question.options
              .filter((option) => option.trim())
              .map((option) => `<li>${escapeHtml(option)}</li>`)
              .join("")}</ol>`
          : `<div class="answer-space"></div>`;
      return `
        <div class="question">
          <p><strong>${question.number}.</strong> ${escapeHtml(question.text)} <span class="marks">(${question.marks} marks)</span></p>
          ${options}
        </div>`;
    })
    .join("");
  return instructions + questions;
}

/** A printable version of a teaching resource, same client-side print-window pattern as the ID card and sign-in slip. */
export function printTeachingResource(data: PrintTeachingResourceData): void {
  const printWindow = window.open("", "_blank", "width=800,height=900");
  if (!printWindow) return;

  const { resource } = data;
  const isScheme = resource.type === "SCHEME_OF_WORK";
  const body = isScheme
    ? `<table>
        <thead><tr><th>Week</th><th>Topic</th><th>Objectives</th><th>Activities</th><th>Resources</th></tr></thead>
        <tbody>${schemeOfWorkBody(resource.content as SchemeOfWorkContent)}</tbody>
      </table>`
    : resource.type === "LECTURE_NOTE"
      ? lectureNoteBody(resource.content as LectureNoteContent)
      : examQuestionsBody(resource.content as ExamQuestionsContent);

  printWindow.document.write(`
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
        <title>${escapeHtml(resource.title)}</title>
        <style>
          @page { margin: 16mm; }
          body { font-family: Arial, Helvetica, sans-serif; color: #282828; margin: 0; padding: 24px; }
          .print-bar { display: flex; gap: 8px; margin-bottom: 16px; }
          .print-bar button {
            font-family: inherit; font-size: 14px; font-weight: 600; border-radius: 8px;
            padding: 8px 20px; border: none; cursor: pointer;
          }
          .print-bar .primary { background: #2d88d4; color: #fff; }
          .print-bar .secondary { background: #fff; color: #282828; border: 1px solid #b9c5ce; }
          @media print { .print-bar { display: none; } }
          header { border-bottom: 2px solid #152259; padding-bottom: 12px; margin-bottom: 16px; }
          header h1 { font-size: 18px; margin: 0 0 4px; color: #152259; }
          header p { margin: 0; font-size: 13px; color: #4f4f4f; }
          h2 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.4px; color: #152259; margin: 16px 0 4px; }
          p { font-size: 13px; line-height: 1.6; }
          table { width: 100%; border-collapse: collapse; font-size: 12px; }
          th, td { border: 1px solid #dee6ec; padding: 6px 8px; text-align: left; vertical-align: top; }
          th { background: #eef3f7; }
          .instructions { font-style: italic; margin-bottom: 16px; }
          .question { margin-bottom: 14px; }
          .question .marks { color: #4f4f4f; font-weight: normal; }
          .answer-space { border-bottom: 1px dashed #b9c5ce; height: 24px; margin-top: 6px; }
        </style>
      </head>
      <body>
        <div class="print-bar">
          <button class="primary" onclick="window.print()">Print</button>
          <button class="secondary" onclick="window.close()">Close</button>
        </div>
        <header>
          <h1>${escapeHtml(data.schoolName)} — ${escapeHtml(resource.title)}</h1>
          <p>${escapeHtml(data.subjectName)} · ${escapeHtml(data.classLevelName)} · ${escapeHtml(data.termName)}</p>
        </header>
        ${body}
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
}
