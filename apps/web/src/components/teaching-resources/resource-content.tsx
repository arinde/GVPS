import { ContentCard } from "@/components/common/content-card";
import type {
  ExamQuestionsContent,
  LectureNoteContent,
  SchemeOfWorkContent,
  TeachingResource,
} from "@/store/api/teaching-resources-api";

export type ResourceContentProps = { resource: TeachingResource };

/** Read-only rendering of a resource's content, once it is submitted or approved. Presentational (AGENTS.md §1). */
export function ResourceContent({ resource }: ResourceContentProps) {
  if (resource.type === "SCHEME_OF_WORK") return <SchemeOfWork content={resource.content as SchemeOfWorkContent} />;
  if (resource.type === "LECTURE_NOTE") return <LectureNote content={resource.content as LectureNoteContent} />;
  return <ExamQuestions content={resource.content as ExamQuestionsContent} />;
}

function SchemeOfWork({ content }: { content: SchemeOfWorkContent }) {
  return (
    <div className="flex flex-col gap-4">
      {content.weeks.map((week) => (
        <ContentCard key={week.week} className="flex flex-col gap-2">
          <h2 className="text-base font-semibold">
            Week {week.week} — {week.topic}
          </h2>
          {week.objectives ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Objectives: </span>
              {week.objectives}
            </p>
          ) : null}
          {week.activities ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Activities: </span>
              {week.activities}
            </p>
          ) : null}
          {week.resources ? (
            <p className="text-sm">
              <span className="text-muted-foreground">Resources: </span>
              {week.resources}
            </p>
          ) : null}
        </ContentCard>
      ))}
    </div>
  );
}

function LectureNote({ content }: { content: LectureNoteContent }) {
  return (
    <ContentCard className="flex flex-col gap-4">
      {content.objectives ? (
        <div>
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">Objectives</h2>
          <p className="text-sm whitespace-pre-wrap">{content.objectives}</p>
        </div>
      ) : null}
      <div>
        <h2 className="text-muted-foreground text-xs font-semibold uppercase">Content</h2>
        <p className="text-sm whitespace-pre-wrap">{content.body}</p>
      </div>
      {content.references ? (
        <div>
          <h2 className="text-muted-foreground text-xs font-semibold uppercase">References</h2>
          <p className="text-sm whitespace-pre-wrap">{content.references}</p>
        </div>
      ) : null}
    </ContentCard>
  );
}

function ExamQuestions({ content }: { content: ExamQuestionsContent }) {
  return (
    <div className="flex flex-col gap-4">
      {content.instructions ? (
        <ContentCard>
          <p className="text-sm whitespace-pre-wrap">{content.instructions}</p>
        </ContentCard>
      ) : null}
      {content.questions.map((question) => (
        <ContentCard key={question.number} className="flex flex-col gap-2">
          <p className="text-sm font-semibold">
            {question.number}. {question.text}{" "}
            <span className="text-muted-foreground font-normal">({question.marks} marks)</span>
          </p>
          {question.type === "OBJECTIVE" ? (
            <ol className="flex flex-col gap-1 pl-4 text-sm" style={{ listStyleType: "upper-alpha" }}>
              {question.options
                .filter((option) => option.trim())
                .map((option) => (
                  <li key={option} className={option === question.correctAnswer ? "font-semibold" : undefined}>
                    {option}
                  </li>
                ))}
            </ol>
          ) : null}
        </ContentCard>
      ))}
    </div>
  );
}
