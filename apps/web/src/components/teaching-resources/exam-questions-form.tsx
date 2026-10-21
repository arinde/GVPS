"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2 } from "lucide-react";
import { AppButton } from "@/components/common/app-button";
import { ContentCard } from "@/components/common/content-card";
import { FormField, controlProps } from "@/components/common/form-field";
import { NativeSelect } from "@/components/common/native-select";
import { Textarea } from "@/components/common/textarea";
import { TextInput } from "@/components/common/text-input";
import { PasteToFill } from "@/components/teaching-resources/paste-to-fill";
import { ResourceMetaFields, type ResourceMeta } from "@/components/teaching-resources/resource-meta-fields";
import { notify } from "@/lib/notify";
import { parseExamQuestions } from "@/lib/parse-teaching-resource";
import { useListClassLevelsQuery, useListSessionsQuery } from "@/store/api/academic-api";
import { useListSubjectsQuery } from "@/store/api/subjects-api";
import {
  useCreateTeachingResourceMutation,
  useUpdateTeachingResourceMutation,
  type ExamQuestion,
  type ExamQuestionsContent,
  type TeachingResource,
} from "@/store/api/teaching-resources-api";

const QUESTION_TYPES = [
  { value: "OBJECTIVE", label: "Objective (multiple choice)" },
  { value: "THEORY", label: "Theory" },
];

const EMPTY_QUESTION = (number: number): ExamQuestion => ({
  number,
  text: "",
  type: "OBJECTIVE",
  options: ["", "", "", ""],
  correctAnswer: "",
  marks: 1,
});

export type ExamQuestionsFormProps = { resource?: TeachingResource & { content: ExamQuestionsContent } };

/** FEATURES.md — an exam question set: instructions, then each question with its marks and (for objectives) options. */
export function ExamQuestionsForm({ resource }: ExamQuestionsFormProps) {
  const router = useRouter();
  const { data: subjects = [] } = useListSubjectsQuery();
  const { data: classLevels = [] } = useListClassLevelsQuery();
  const { data: sessions = [] } = useListSessionsQuery();
  const terms = sessions.flatMap((session) => session.terms);

  const [meta, setMeta] = useState<ResourceMeta>({
    title: resource?.title ?? "",
    subjectId: resource?.subjectId ?? "",
    classLevelId: resource?.classLevelId ?? "",
    termId: resource?.termId ?? "",
  });
  const [instructions, setInstructions] = useState(resource?.content.instructions ?? "");
  const [questions, setQuestions] = useState<ExamQuestion[]>(resource?.content.questions ?? [EMPTY_QUESTION(1)]);
  const [create, { isLoading: creating }] = useCreateTeachingResourceMutation();
  const [update, { isLoading: updating }] = useUpdateTeachingResourceMutation();
  const saving = creating || updating;

  function updateQuestion(index: number, patch: Partial<ExamQuestion>) {
    setQuestions((current) => current.map((question, i) => (i === index ? { ...question, ...patch } : question)));
  }

  function updateOption(questionIndex: number, optionIndex: number, text: string) {
    setQuestions((current) =>
      current.map((question, i) =>
        i === questionIndex
          ? { ...question, options: question.options.map((option, j) => (j === optionIndex ? text : option)) }
          : question,
      ),
    );
  }

  async function handleSave() {
    if (!meta.title.trim() || !meta.subjectId || !meta.classLevelId || !meta.termId) {
      notify.warning("Fill in the title, subject, class and term first.");
      return;
    }
    if (questions.some((question) => !question.text.trim())) {
      notify.warning("Every question needs its text.");
      return;
    }

    const body = { type: "EXAM_QUESTIONS" as const, ...meta, content: { instructions, questions } };
    try {
      const saved = resource ? await update({ id: resource.id, body }).unwrap() : await create(body).unwrap();
      notify.success(resource ? "Exam questions updated" : "Exam questions saved as a draft");
      router.push(`/teaching-resources/${saved.id}`);
    } catch (error) {
      notify.error(error, "Could not save these exam questions.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      <ContentCard>
        <ResourceMetaFields
          value={meta}
          onChange={setMeta}
          errors={{}}
          subjectOptions={subjects.map((subject) => ({ value: subject.id, label: subject.name }))}
          classLevelOptions={classLevels.map((level) => ({ value: level.id, label: level.name }))}
          termOptions={terms.map((term) => ({ value: term.id, label: term.name }))}
        />
      </ContentCard>

      <ContentCard>
        <FormField id="instructions" label="Instructions" hint="Shown at the top of the paper, e.g. time allowed.">
          <Textarea
            {...controlProps("instructions")}
            rows={3}
            value={instructions}
            onChange={(event) => setInstructions(event.target.value)}
          />
        </FormField>
      </ContentCard>

      <PasteToFill
        hint="Paste a question bank you've already typed up — number each question, letter the options, and mark Answer: and (marks) where you have them."
        example={
          "1. What is the capital of Nigeria?\nA. Lagos\nB. Abuja\nC. Kano\nD. Ibadan\nAnswer: B (1 marks)\n\n2. Explain photosynthesis. (10 marks)"
        }
        onParse={(text) => {
          const parsed = parseExamQuestions(text);
          setInstructions(parsed.instructions);
          setQuestions(parsed.questions.length > 0 ? parsed.questions : [EMPTY_QUESTION(1)]);
          notify.success(`Parsed ${parsed.questions.length} question${parsed.questions.length === 1 ? "" : "s"}`, {
            description: "Check each one over before saving.",
          });
        }}
      />

      <div className="flex flex-col gap-4">
        {questions.map((question, index) => {
          const nonEmptyOptions = question.options.filter((option) => option.trim());
          return (
            <ContentCard key={index} className="flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <h2 className="text-base">Question {question.number}</h2>
                {questions.length > 1 ? (
                  <AppButton
                    type="button"
                    variant="ghost"
                    size="small"
                    aria-label={`Remove question ${question.number}`}
                    onClick={() => setQuestions((current) => current.filter((_, i) => i !== index))}
                  >
                    <Trash2 aria-hidden="true" />
                  </AppButton>
                ) : null}
              </div>

              <FormField id={`text-${index}`} label="Question" required>
                <Textarea
                  {...controlProps(`text-${index}`)}
                  rows={2}
                  value={question.text}
                  onChange={(event) => updateQuestion(index, { text: event.target.value })}
                />
              </FormField>

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField id={`type-${index}`} label="Type">
                  <NativeSelect
                    {...controlProps(`type-${index}`)}
                    options={QUESTION_TYPES}
                    value={question.type}
                    onChange={(event) => updateQuestion(index, { type: event.target.value as ExamQuestion["type"] })}
                  />
                </FormField>
                <FormField id={`marks-${index}`} label="Marks">
                  <TextInput
                    {...controlProps(`marks-${index}`)}
                    type="number"
                    min={0}
                    value={question.marks}
                    onChange={(event) => updateQuestion(index, { marks: Number(event.target.value) || 0 })}
                  />
                </FormField>
              </div>

              {/* Options and the correct answer only apply to an objective question (AGENTS.md §12). */}
              {question.type === "OBJECTIVE" ? (
                <>
                  <div className="grid gap-3 sm:grid-cols-2">
                    {question.options.map((option, optionIndex) => (
                      <FormField
                        key={optionIndex}
                        id={`option-${index}-${optionIndex}`}
                        label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                      >
                        <TextInput
                          {...controlProps(`option-${index}-${optionIndex}`)}
                          value={option}
                          onChange={(event) => updateOption(index, optionIndex, event.target.value)}
                        />
                      </FormField>
                    ))}
                  </div>
                  <FormField id={`correct-${index}`} label="Correct answer">
                    <NativeSelect
                      {...controlProps(`correct-${index}`)}
                      options={nonEmptyOptions.map((option) => ({ value: option, label: option }))}
                      placeholder="Choose the correct option"
                      value={question.correctAnswer}
                      onChange={(event) => updateQuestion(index, { correctAnswer: event.target.value })}
                    />
                  </FormField>
                </>
              ) : null}
            </ContentCard>
          );
        })}

        <div>
          <AppButton
            type="button"
            variant="secondary"
            onClick={() => setQuestions((current) => [...current, EMPTY_QUESTION(current.length + 1)])}
          >
            <Plus aria-hidden="true" />
            Add question
          </AppButton>
        </div>
      </div>

      <div>
        <AppButton type="button" onClick={handleSave} disabled={saving}>
          {saving ? "Saving…" : "Save draft"}
        </AppButton>
      </div>
    </div>
  );
}
