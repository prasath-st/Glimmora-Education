"use client";

import { useEffect, useMemo, useState } from "react";
import { Plus, Trash2, Loader2, AlertCircle } from "lucide-react";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { useCreateAssessment, useUpdateAssessment } from "@/lib/hooks/use-faculty";
import { ApiError } from "@/lib/api/client";
import type {
  Assessment,
  AssessmentType,
  QuestionType,
} from "@/lib/api/types/assessment.types";
import { cn } from "@/lib/utils/cn";

type DraftQuestion = {
  prompt: string;
  type: QuestionType;
  options: string[];
  correctAnswer: string;
  points: number;
  explanation: string;
};

interface AssessmentDrawerProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  /** When provided, drawer is in EDIT mode for this assessment. Otherwise CREATE mode. */
  editing?: Assessment | null;
  onSaved?: (assessment: Assessment) => void;
}

const ASSESSMENT_TYPE_LABELS: Record<AssessmentType, string> = {
  quiz: "Quiz",
  midterm: "Midterm",
  final: "Final",
  exam: "Exam",
};

const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  multiple_choice: "Multiple Choice",
  true_false: "True / False",
  short_answer: "Short Answer",
};

function blankQuestion(type: QuestionType = "multiple_choice"): DraftQuestion {
  return {
    prompt: "",
    type,
    options: type === "multiple_choice" ? ["", ""] : [],
    correctAnswer: type === "true_false" ? "True" : "",
    points: 5,
    explanation: "",
  };
}

function isoLocalNow(offsetMinutes = 0): string {
  const d = new Date(Date.now() + offsetMinutes * 60_000);
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function isoToLocalInput(iso: string): string {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function localInputToIso(local: string): string {
  if (!local) return "";
  const d = new Date(local);
  return d.toISOString();
}

export function AssessmentDrawer({
  open,
  onClose,
  courseId,
  editing,
  onSaved,
}: AssessmentDrawerProps) {
  const isEdit = Boolean(editing);
  const createMut = useCreateAssessment();
  const updateMut = useUpdateAssessment();

  const [title, setTitle] = useState("");
  const [instructions, setInstructions] = useState("");
  const [type, setType] = useState<AssessmentType>("quiz");
  const [weight, setWeight] = useState<number>(10);
  const [attemptsAllowed, setAttemptsAllowed] = useState<number>(1);
  const [timeLimitMinutes, setTimeLimitMinutes] = useState<string>("");
  const [opensAt, setOpensAt] = useState(isoLocalNow(0));
  const [closesAt, setClosesAt] = useState(isoLocalNow(60 * 24 * 7));
  const [questions, setQuestions] = useState<DraftQuestion[]>([blankQuestion()]);
  const [serverErrors, setServerErrors] = useState<Record<string, string[]>>({});

  // Initialize form when drawer opens or editing target changes
  useEffect(() => {
    if (!open) return;
    if (editing) {
      setTitle(editing.title);
      setInstructions(editing.instructions);
      setType(editing.type);
      setWeight(editing.weight);
      setAttemptsAllowed(editing.attemptsAllowed);
      setTimeLimitMinutes(
        editing.timeLimitMinutes ? String(editing.timeLimitMinutes) : "",
      );
      setOpensAt(isoToLocalInput(editing.opensAt));
      setClosesAt(isoToLocalInput(editing.closesAt));
      setQuestions(
        editing.questions.map((q) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.options ?? (q.type === "true_false" ? [] : ["", ""]),
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation ?? "",
        })),
      );
    } else {
      setTitle("");
      setInstructions("");
      setType("quiz");
      setWeight(10);
      setAttemptsAllowed(1);
      setTimeLimitMinutes("");
      setOpensAt(isoLocalNow(0));
      setClosesAt(isoLocalNow(60 * 24 * 7));
      setQuestions([blankQuestion()]);
    }
    setServerErrors({});
  }, [open, editing]);

  const totalPoints = useMemo(
    () => questions.reduce((s, q) => s + (Number(q.points) || 0), 0),
    [questions],
  );

  const clientErrors = useMemo(() => {
    const errs: Record<string, string> = {};
    if (title.trim().length < 3) errs.title = "Title must be at least 3 characters";
    if (instructions.trim().length < 10)
      errs.instructions = "Instructions must be at least 10 characters";
    if (!opensAt) errs.opensAt = "Required";
    if (!closesAt) errs.closesAt = "Required";
    if (opensAt && closesAt && new Date(closesAt).getTime() <= new Date(opensAt).getTime())
      errs.closesAt = "Must be after the open date";
    if (weight < 1 || weight > 100) errs.weight = "Weight must be 1–100";
    if (attemptsAllowed < 1 || attemptsAllowed > 10)
      errs.attemptsAllowed = "Attempts must be 1–10";
    if (timeLimitMinutes !== "") {
      const n = Number(timeLimitMinutes);
      if (Number.isNaN(n) || n < 1 || n > 360)
        errs.timeLimitMinutes = "1–360 minutes";
    }
    if (questions.length === 0) errs.questions = "Add at least one question";
    questions.forEach((q, i) => {
      if (q.prompt.trim().length < 3) errs[`q-${i}-prompt`] = "Prompt is required";
      if (q.points < 1) errs[`q-${i}-points`] = "Points must be at least 1";
      if (q.type === "multiple_choice") {
        const optsCleaned = q.options.map((o) => o.trim()).filter(Boolean);
        if (optsCleaned.length < 2)
          errs[`q-${i}-options`] = "Add at least 2 options";
        if (q.correctAnswer && !optsCleaned.includes(q.correctAnswer.trim()))
          errs[`q-${i}-correctAnswer`] = "Pick one of the options";
        if (!q.correctAnswer.trim())
          errs[`q-${i}-correctAnswer`] = "Select the correct option";
      }
      if (q.type === "true_false") {
        if (q.correctAnswer !== "True" && q.correctAnswer !== "False")
          errs[`q-${i}-correctAnswer`] = "Pick True or False";
      }
      if (q.type === "short_answer" && !q.correctAnswer.trim())
        errs[`q-${i}-correctAnswer`] = "Provide the canonical answer";
    });
    return errs;
  }, [title, instructions, opensAt, closesAt, weight, attemptsAllowed, timeLimitMinutes, questions]);

  const hasClientErrors = Object.keys(clientErrors).length > 0;
  const isPending = createMut.isPending || updateMut.isPending;

  function addQuestion(t: QuestionType) {
    setQuestions((prev) => [...prev, blankQuestion(t)]);
  }
  function removeQuestion(i: number) {
    setQuestions((prev) => prev.filter((_, idx) => idx !== i));
  }
  function updateQuestion(i: number, patch: Partial<DraftQuestion>) {
    setQuestions((prev) =>
      prev.map((q, idx) => (idx === i ? applyQuestionPatch(q, patch) : q)),
    );
  }
  function updateOption(qi: number, oi: number, value: string) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        const opts = [...q.options];
        const prevValue = opts[oi];
        opts[oi] = value;
        // If the correct answer was pointing at the old value, keep it pointing at the new one
        const newCorrect =
          q.correctAnswer === prevValue ? value : q.correctAnswer;
        return { ...q, options: opts, correctAnswer: newCorrect };
      }),
    );
  }
  function addOption(qi: number) {
    setQuestions((prev) =>
      prev.map((q, idx) =>
        idx === qi ? { ...q, options: [...q.options, ""] } : q,
      ),
    );
  }
  function removeOption(qi: number, oi: number) {
    setQuestions((prev) =>
      prev.map((q, idx) => {
        if (idx !== qi) return q;
        const removed = q.options[oi];
        const opts = q.options.filter((_, i) => i !== oi);
        const correctAnswer = q.correctAnswer === removed ? "" : q.correctAnswer;
        return { ...q, options: opts, correctAnswer };
      }),
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setServerErrors({});
    if (hasClientErrors) return;

    const payload = {
      title: title.trim(),
      instructions: instructions.trim(),
      type,
      weight,
      attemptsAllowed,
      timeLimitMinutes:
        timeLimitMinutes === "" ? undefined : Number(timeLimitMinutes),
      opensAt: localInputToIso(opensAt),
      closesAt: localInputToIso(closesAt),
      questions: questions.map((q) => ({
        prompt: q.prompt.trim(),
        type: q.type,
        options:
          q.type === "multiple_choice"
            ? q.options.map((o) => o.trim()).filter(Boolean)
            : undefined,
        correctAnswer: q.correctAnswer.trim(),
        points: q.points,
        explanation: q.explanation.trim() || undefined,
      })),
    };

    try {
      if (isEdit && editing) {
        const res = await updateMut.mutateAsync({
          courseId,
          assessmentId: editing.id,
          ...payload,
        });
        onSaved?.(res.data);
      } else {
        const res = await createMut.mutateAsync({
          courseId,
          ...payload,
        });
        onSaved?.(res.data);
      }
      onClose();
    } catch (err) {
      if (err instanceof ApiError && err.details) {
        setServerErrors(err.details);
      } else {
        setServerErrors({ form: ["Unexpected error. Please retry."] });
      }
    }
  }

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={isEdit ? `Edit ${editing?.title}` : "New Assessment"}
      description={
        isEdit
          ? "Update the assessment. Students with existing attempts will keep their scores."
          : "Author a quiz, midterm, or exam students will take in-browser."
      }
      footer={
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground">{questions.length}</span>{" "}
            {questions.length === 1 ? "question" : "questions"} ·{" "}
            <span className="font-semibold text-foreground">{totalPoints}</span> total points
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isPending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              form="assessment-form"
              disabled={isPending || hasClientErrors}
              className="inline-flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              {isEdit ? "Save Changes" : "Save Draft"}
            </button>
          </div>
        </div>
      }
    >
      <form id="assessment-form" onSubmit={handleSubmit} className="space-y-8">
        {serverErrors.form && (
          <div className="flex items-start gap-2 rounded-lg border border-danger/30 bg-danger-light/20 px-3 py-2 text-sm text-danger">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
            {serverErrors.form.join("; ")}
          </div>
        )}

        {/* Basics */}
        <section className="space-y-4">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Basics
          </h3>
          <Field
            label="Title"
            error={clientErrors.title || serverErrors.title?.[0]}
            required
          >
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Midterm Assessment"
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
            />
          </Field>
          <Field
            label="Instructions"
            error={clientErrors.instructions || serverErrors.instructions?.[0]}
            required
            hint="What students need to know before they start (max time, what's covered, etc.)."
          >
            <textarea
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Type">
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AssessmentType)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              >
                {(Object.keys(ASSESSMENT_TYPE_LABELS) as AssessmentType[]).map((t) => (
                  <option key={t} value={t}>
                    {ASSESSMENT_TYPE_LABELS[t]}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Weight (% of final grade)"
              error={clientErrors.weight || serverErrors.weight?.[0]}
              required
            >
              <input
                type="number"
                min={1}
                max={100}
                value={weight}
                onChange={(e) => setWeight(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field
              label="Attempts allowed"
              error={clientErrors.attemptsAllowed || serverErrors.attemptsAllowed?.[0]}
              required
            >
              <input
                type="number"
                min={1}
                max={10}
                value={attemptsAllowed}
                onChange={(e) => setAttemptsAllowed(Number(e.target.value))}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              />
            </Field>
            <Field
              label="Time limit (minutes)"
              error={clientErrors.timeLimitMinutes || serverErrors.timeLimitMinutes?.[0]}
              hint="Optional. Blank = no time limit."
            >
              <input
                type="number"
                min={1}
                max={360}
                value={timeLimitMinutes}
                onChange={(e) => setTimeLimitMinutes(e.target.value)}
                placeholder="e.g., 60"
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              />
            </Field>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Opens at"
              error={clientErrors.opensAt || serverErrors.opensAt?.[0]}
              required
            >
              <input
                type="datetime-local"
                value={opensAt}
                onChange={(e) => setOpensAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              />
            </Field>
            <Field
              label="Closes at"
              error={clientErrors.closesAt || serverErrors.closesAt?.[0]}
              required
            >
              <input
                type="datetime-local"
                value={closesAt}
                onChange={(e) => setClosesAt(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
              />
            </Field>
          </div>
        </section>

        {/* Questions */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
              Questions
            </h3>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => addQuestion("multiple_choice")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Multi-choice
              </button>
              <button
                type="button"
                onClick={() => addQuestion("true_false")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                T/F
              </button>
              <button
                type="button"
                onClick={() => addQuestion("short_answer")}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-medium hover:bg-muted"
              >
                <Plus className="h-3.5 w-3.5" />
                Short answer
              </button>
            </div>
          </div>

          {clientErrors.questions && (
            <p className="text-xs text-danger">{clientErrors.questions}</p>
          )}

          {questions.map((q, i) => (
            <div
              key={i}
              className="space-y-3 rounded-xl border border-border bg-card p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Question {i + 1} · {QUESTION_TYPE_LABELS[q.type]}
                </div>
                <button
                  type="button"
                  onClick={() => removeQuestion(i)}
                  disabled={questions.length === 1}
                  className="rounded-md p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-danger disabled:opacity-40"
                  aria-label="Remove question"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              <Field label="Prompt" error={clientErrors[`q-${i}-prompt`]}>
                <textarea
                  value={q.prompt}
                  onChange={(e) => updateQuestion(i, { prompt: e.target.value })}
                  rows={2}
                  placeholder="Question text…"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                />
              </Field>

              {q.type === "multiple_choice" && (
                <Field
                  label="Options (click the circle to mark the correct one)"
                  error={
                    clientErrors[`q-${i}-options`] ||
                    clientErrors[`q-${i}-correctAnswer`]
                  }
                >
                  <div className="space-y-2">
                    {q.options.map((opt, oi) => {
                      const isCorrect =
                        opt.trim().length > 0 && q.correctAnswer === opt;
                      return (
                        <div key={oi} className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => updateQuestion(i, { correctAnswer: opt })}
                            disabled={!opt.trim()}
                            className={cn(
                              "flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-colors",
                              isCorrect
                                ? "border-success bg-success text-white"
                                : "border-border hover:border-portal-accent",
                            )}
                            title={isCorrect ? "Correct answer" : "Mark as correct"}
                          >
                            {isCorrect && <div className="h-2 w-2 rounded-full bg-white" />}
                          </button>
                          <input
                            type="text"
                            value={opt}
                            onChange={(e) => updateOption(i, oi, e.target.value)}
                            placeholder={`Option ${oi + 1}`}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                          />
                          <button
                            type="button"
                            onClick={() => removeOption(i, oi)}
                            disabled={q.options.length <= 2}
                            className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-danger disabled:opacity-40"
                            aria-label="Remove option"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      );
                    })}
                    <button
                      type="button"
                      onClick={() => addOption(i)}
                      className="inline-flex items-center gap-1 text-xs font-medium text-portal-accent hover:underline"
                    >
                      <Plus className="h-3 w-3" />
                      Add option
                    </button>
                  </div>
                </Field>
              )}

              {q.type === "true_false" && (
                <Field
                  label="Correct answer"
                  error={clientErrors[`q-${i}-correctAnswer`]}
                >
                  <div className="flex gap-2">
                    {(["True", "False"] as const).map((v) => (
                      <button
                        key={v}
                        type="button"
                        onClick={() => updateQuestion(i, { correctAnswer: v })}
                        className={cn(
                          "flex-1 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
                          q.correctAnswer === v
                            ? "border-success bg-success-light/30 text-success"
                            : "border-border bg-card hover:bg-muted",
                        )}
                      >
                        {v}
                      </button>
                    ))}
                  </div>
                </Field>
              )}

              {q.type === "short_answer" && (
                <Field
                  label="Canonical correct answer"
                  hint="Matched case- and whitespace-insensitively. Keep it concise."
                  error={clientErrors[`q-${i}-correctAnswer`]}
                >
                  <input
                    type="text"
                    value={q.correctAnswer}
                    onChange={(e) =>
                      updateQuestion(i, { correctAnswer: e.target.value })
                    }
                    placeholder="e.g., 404"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                  />
                </Field>
              )}

              <div className="grid grid-cols-2 gap-3">
                <Field label="Points" error={clientErrors[`q-${i}-points`]}>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={q.points}
                    onChange={(e) =>
                      updateQuestion(i, { points: Number(e.target.value) })
                    }
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                  />
                </Field>
                <Field label="Explanation (optional)" hint="Shown to students on results page.">
                  <input
                    type="text"
                    value={q.explanation}
                    onChange={(e) =>
                      updateQuestion(i, { explanation: e.target.value })
                    }
                    placeholder="Why is this the right answer?"
                    className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:border-portal-accent focus:outline-none focus:ring-1 focus:ring-portal-accent"
                  />
                </Field>
              </div>
            </div>
          ))}
        </section>
      </form>
    </SlideDrawer>
  );
}

function applyQuestionPatch(
  q: DraftQuestion,
  patch: Partial<DraftQuestion>,
): DraftQuestion {
  // Type switch resets question-specific fields cleanly
  if (patch.type && patch.type !== q.type) {
    const next = patch.type;
    return {
      ...q,
      ...patch,
      type: next,
      options: next === "multiple_choice" ? ["", ""] : [],
      correctAnswer: next === "true_false" ? "True" : "",
    };
  }
  return { ...q, ...patch };
}

function Field({
  label,
  children,
  error,
  hint,
  required,
}: {
  label: string;
  children: React.ReactNode;
  error?: string;
  hint?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="ml-0.5 text-danger">*</span>}
      </label>
      {children}
      {hint && !error && (
        <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
