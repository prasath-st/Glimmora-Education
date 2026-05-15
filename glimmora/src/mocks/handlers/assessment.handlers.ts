/**
 * Assessment handlers — used by BOTH faculty and student.
 *
 * Faculty endpoints:
 *   GET    /api/faculty/me/courses/:courseId/assessments
 *   POST   /api/faculty/me/courses/:courseId/assessments
 *   GET    /api/faculty/me/courses/:courseId/assessments/:assessmentId
 *   PATCH  /api/faculty/me/courses/:courseId/assessments/:assessmentId
 *   POST   /api/faculty/me/courses/:courseId/assessments/:assessmentId/publish
 *   POST   /api/faculty/me/courses/:courseId/assessments/:assessmentId/close
 *   DELETE /api/faculty/me/courses/:courseId/assessments/:assessmentId
 *   GET    /api/faculty/me/courses/:courseId/assessments/:assessmentId/attempts
 *
 * Student endpoints:
 *   GET    /api/students/me/courses/:courseId/assessments
 *   GET    /api/students/me/courses/:courseId/assessments/:assessmentId
 *   POST   /api/students/me/courses/:courseId/assessments/:assessmentId/start
 *   POST   /api/students/me/courses/:courseId/assessments/:assessmentId/submit
 *   GET    /api/students/me/courses/:courseId/assessments/:assessmentId/attempts/:attemptId
 */

import { http, HttpResponse, delay } from "msw";
import {
  getAssessmentsByCourse,
  getAssessmentById,
  appendAssessment,
  replaceAssessment,
  deleteAssessment as deleteAssessmentFromStore,
  appendAttempt,
  replaceAttempt,
  getAttemptsForStudent,
  getAttempts,
  getAttemptById,
  bestScoreFor,
  inProgressAttempt,
} from "@/mocks/data/db";
import { buildAssessmentFromRequest } from "@/mocks/data/generators/assessment.generator";
import type {
  Assessment,
  AssessmentAttempt,
  AssessmentQuestion,
  AttemptAnswer,
  CreateAssessmentRequest,
  GradedAttempt,
  StudentAssessmentDetail,
  StudentAssessmentListItem,
  StudentAssessmentQuestion,
  SubmitAttemptRequest,
  UpdateAssessmentRequest,
} from "@/lib/api/types/assessment.types";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function randomDelay(): Promise<void> {
  return delay(Math.floor(Math.random() * 300) + 150);
}

function notFound(resource: string) {
  return HttpResponse.json(
    { error: { code: "NOT_FOUND", message: `${resource} not found` } },
    { status: 404 },
  );
}

function validationError(details: Record<string, string[]>) {
  return HttpResponse.json(
    { error: { code: "VALIDATION_ERROR", message: "Validation failed", details } },
    { status: 422 },
  );
}

function forbidden(message: string) {
  return HttpResponse.json(
    { error: { code: "FORBIDDEN", message } },
    { status: 403 },
  );
}

function conflict(message: string) {
  return HttpResponse.json(
    { error: { code: "CONFLICT", message } },
    { status: 409 },
  );
}

function id(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 14)}`;
}

/** Derives the dev-student id from the auth token. Mock-only — backend infers from JWT. */
function studentIdFromRequest(request: Request): string {
  const auth = request.headers.get("Authorization") ?? "";
  // Token shape: mock_access_<userId>_<timestamp> — see auth.handlers.ts
  const m = auth.match(/Bearer mock_access_(.+)_\d+$/);
  if (m) return m[1];
  // Safe fallback for the dev student
  return "usr_student_01";
}

function sumPoints(questions: AssessmentQuestion[]): number {
  return questions.reduce((s, q) => s + q.points, 0);
}

function maxScoreOf(assessment: Assessment): number {
  return assessment.maxScore || sumPoints(assessment.questions);
}

/** Strips correctAnswer/explanation from the question so we never leak answers to students. */
function toStudentQuestion(q: AssessmentQuestion): StudentAssessmentQuestion {
  return {
    id: q.id,
    prompt: q.prompt,
    type: q.type,
    options: q.options,
    points: q.points,
  };
}

function deriveStudentStatus(
  assessment: Assessment,
  attemptsUsed: number,
  bestScore: number | undefined,
  hasInProgress: boolean,
): StudentAssessmentListItem["studentStatus"] {
  const now = Date.now();
  const opens = new Date(assessment.opensAt).getTime();
  const closes = new Date(assessment.closesAt).getTime();
  if (hasInProgress) return "in_progress";
  if (typeof bestScore === "number") return "completed";
  if (assessment.status !== "published") return "not_open";
  if (now < opens) return "not_open";
  if (now >= closes) return "closed";
  if (attemptsUsed >= assessment.attemptsAllowed) return "exhausted";
  return "open";
}

function toStudentListItem(
  assessment: Assessment,
  studentId: string,
): StudentAssessmentListItem {
  const attempts = getAttemptsForStudent(assessment.id, studentId);
  const submitted = attempts.filter((a) => a.status === "submitted");
  const hasInProgress = attempts.some((a) => a.status === "in_progress");
  const bestScore = bestScoreFor(assessment.id, studentId);
  const studentStatus = deriveStudentStatus(
    assessment,
    submitted.length,
    bestScore,
    hasInProgress,
  );
  const lastSubmitted = submitted
    .slice()
    .sort(
      (a, b) =>
        new Date(b.submittedAt ?? 0).getTime() - new Date(a.submittedAt ?? 0).getTime(),
    )[0];
  return {
    id: assessment.id,
    courseId: assessment.courseId,
    title: assessment.title,
    type: assessment.type,
    weight: assessment.weight,
    maxScore: maxScoreOf(assessment),
    questionCount: assessment.questions.length,
    timeLimitMinutes: assessment.timeLimitMinutes,
    attemptsAllowed: assessment.attemptsAllowed,
    opensAt: assessment.opensAt,
    closesAt: assessment.closesAt,
    attemptsUsed: submitted.length,
    bestScore,
    lastAttemptId: lastSubmitted?.id,
    studentStatus,
  };
}

function toStudentDetail(
  assessment: Assessment,
  studentId: string,
): StudentAssessmentDetail {
  const list = toStudentListItem(assessment, studentId);
  return {
    id: assessment.id,
    courseId: assessment.courseId,
    title: assessment.title,
    instructions: assessment.instructions,
    type: assessment.type,
    questions: assessment.questions.map(toStudentQuestion),
    maxScore: list.maxScore,
    weight: assessment.weight,
    timeLimitMinutes: assessment.timeLimitMinutes,
    attemptsAllowed: assessment.attemptsAllowed,
    opensAt: assessment.opensAt,
    closesAt: assessment.closesAt,
    attemptsUsed: list.attemptsUsed,
    bestScore: list.bestScore,
    lastAttemptId: list.lastAttemptId,
    studentStatus: list.studentStatus,
  };
}

/** Auto-grade an attempt. Short-answer comparison is case/whitespace-insensitive exact match. */
function gradeAttempt(
  assessment: Assessment,
  answers: AttemptAnswer[],
): { score: number; maxScore: number; graded: GradedAttempt["questionResults"] } {
  const answerByQ = new Map(answers.map((a) => [a.questionId, a.answer]));
  const graded = assessment.questions.map((q) => {
    const studentAnswer = (answerByQ.get(q.id) ?? "").trim();
    const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
    const isCorrect =
      studentAnswer.length > 0 && norm(studentAnswer) === norm(q.correctAnswer);
    return {
      questionId: q.id,
      prompt: q.prompt,
      type: q.type,
      options: q.options,
      studentAnswer,
      correctAnswer: q.correctAnswer,
      isCorrect,
      points: q.points,
      pointsAwarded: isCorrect ? q.points : 0,
      explanation: q.explanation,
    };
  });
  const score = graded.reduce((s, r) => s + r.pointsAwarded, 0);
  return { score, maxScore: sumPoints(assessment.questions), graded };
}

function buildGradedAttempt(
  assessment: Assessment,
  attempt: AssessmentAttempt,
): GradedAttempt {
  const graded = gradeAttempt(assessment, attempt.answers);
  return {
    id: attempt.id,
    assessmentId: assessment.id,
    assessmentTitle: assessment.title,
    courseId: assessment.courseId,
    attemptNumber: attempt.attemptNumber,
    startedAt: attempt.startedAt,
    submittedAt: attempt.submittedAt ?? attempt.startedAt,
    score: attempt.score ?? graded.score,
    maxScore: attempt.maxScore ?? graded.maxScore,
    questionResults: graded.graded,
  };
}

function validateCreateBody(
  body: CreateAssessmentRequest,
): Record<string, string[]> | null {
  const errors: Record<string, string[]> = {};
  if (!body.title || body.title.trim().length < 3) errors.title = ["Title must be at least 3 characters"];
  if (!body.instructions || body.instructions.trim().length < 10)
    errors.instructions = ["Instructions must be at least 10 characters"];
  if (!body.type) errors.type = ["Type is required"];
  if (typeof body.weight !== "number" || body.weight < 1 || body.weight > 100)
    errors.weight = ["Weight must be between 1 and 100"];
  if (typeof body.attemptsAllowed !== "number" || body.attemptsAllowed < 1 || body.attemptsAllowed > 10)
    errors.attemptsAllowed = ["Attempts allowed must be between 1 and 10"];
  if (!body.opensAt) errors.opensAt = ["Open date is required"];
  if (!body.closesAt) errors.closesAt = ["Close date is required"];
  if (body.opensAt && body.closesAt) {
    const opens = new Date(body.opensAt).getTime();
    const closes = new Date(body.closesAt).getTime();
    if (Number.isNaN(opens) || Number.isNaN(closes))
      errors.opensAt = ["Dates must be valid ISO strings"];
    else if (closes <= opens) errors.closesAt = ["Close date must be after the open date"];
  }
  if (!Array.isArray(body.questions) || body.questions.length === 0) {
    errors.questions = ["Add at least one question"];
  } else {
    body.questions.forEach((q, idx) => {
      const prefix = `questions.${idx}`;
      if (!q.prompt || q.prompt.trim().length < 3) errors[`${prefix}.prompt`] = ["Prompt is too short"];
      if (!q.correctAnswer || q.correctAnswer.trim().length === 0)
        errors[`${prefix}.correctAnswer`] = ["Correct answer is required"];
      if (typeof q.points !== "number" || q.points < 1)
        errors[`${prefix}.points`] = ["Points must be at least 1"];
      if (q.type === "multiple_choice") {
        if (!Array.isArray(q.options) || q.options.length < 2)
          errors[`${prefix}.options`] = ["At least 2 options required"];
        else if (!q.options.includes(q.correctAnswer))
          errors[`${prefix}.correctAnswer`] = ["Correct answer must match one of the options"];
      } else if (q.type === "true_false") {
        if (q.correctAnswer !== "True" && q.correctAnswer !== "False")
          errors[`${prefix}.correctAnswer`] = ["Must be True or False"];
      }
    });
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

// ─── Handlers ────────────────────────────────────────────────────────────────

export const assessmentHandlers = [
  // ═══════════════════════════════════════════════════════════════════════════
  // FACULTY: list assessments for a course
  // ═══════════════════════════════════════════════════════════════════════════
  http.get("/api/faculty/me/courses/:courseId/assessments", async ({ params }) => {
    await randomDelay();
    const courseId = String(params.courseId);
    return HttpResponse.json({ data: getAssessmentsByCourse(courseId) });
  }),

  // FACULTY: get one assessment (full, with correct answers)
  http.get(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId",
    async ({ params }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");
      return HttpResponse.json({ data: assessment });
    },
  ),

  // FACULTY: create
  http.post(
    "/api/faculty/me/courses/:courseId/assessments",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      let body: CreateAssessmentRequest;
      try {
        body = (await request.json()) as CreateAssessmentRequest;
      } catch {
        return validationError({ body: ["Invalid JSON body"] });
      }
      body.courseId = courseId;
      const errors = validateCreateBody(body);
      if (errors) return validationError(errors);
      const created = buildAssessmentFromRequest(body);
      appendAssessment(courseId, created);
      return HttpResponse.json({ data: created }, { status: 201 });
    },
  ),

  // FACULTY: update
  http.patch(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const existing = getAssessmentById(courseId, assessmentId);
      if (!existing) return notFound("Assessment");

      let body: UpdateAssessmentRequest;
      try {
        body = (await request.json()) as UpdateAssessmentRequest;
      } catch {
        return validationError({ body: ["Invalid JSON body"] });
      }

      // Build a candidate merge to re-validate against the create rules
      const candidate: CreateAssessmentRequest = {
        courseId,
        title: body.title ?? existing.title,
        instructions: body.instructions ?? existing.instructions,
        type: body.type ?? existing.type,
        questions: (body.questions ?? existing.questions).map((q) => ({
          prompt: q.prompt,
          type: q.type,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points,
          explanation: q.explanation,
        })),
        weight: body.weight ?? existing.weight,
        timeLimitMinutes:
          body.timeLimitMinutes !== undefined
            ? body.timeLimitMinutes
            : existing.timeLimitMinutes,
        attemptsAllowed: body.attemptsAllowed ?? existing.attemptsAllowed,
        opensAt: body.opensAt ?? existing.opensAt,
        closesAt: body.closesAt ?? existing.closesAt,
      };
      const errors = validateCreateBody(candidate);
      if (errors) return validationError(errors);

      // Status transitions: draft → published → closed only.
      if (body.status) {
        const allowed = new Set<Assessment["status"]>([
          existing.status,
          ...transitionsFrom(existing.status),
        ]);
        if (!allowed.has(body.status)) {
          return validationError({
            status: [`Cannot transition from ${existing.status} to ${body.status}`],
          });
        }
      }

      const updated = replaceAssessment(courseId, assessmentId, (prev) => {
        const rebuilt = buildAssessmentFromRequest(candidate);
        return {
          ...prev,
          ...rebuilt,
          id: prev.id,
          status: body.status ?? prev.status,
          createdAt: prev.createdAt,
          updatedAt: new Date().toISOString(),
        };
      });
      return HttpResponse.json({ data: updated });
    },
  ),

  // FACULTY: publish
  http.post(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId/publish",
    async ({ params }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const existing = getAssessmentById(courseId, assessmentId);
      if (!existing) return notFound("Assessment");
      if (existing.status === "closed")
        return conflict("Cannot publish a closed assessment");
      if (existing.questions.length === 0)
        return validationError({ questions: ["Add at least one question before publishing"] });
      const updated = replaceAssessment(courseId, assessmentId, (prev) => ({
        ...prev,
        status: "published",
        updatedAt: new Date().toISOString(),
      }));
      return HttpResponse.json({ data: updated });
    },
  ),

  // FACULTY: close
  http.post(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId/close",
    async ({ params }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const existing = getAssessmentById(courseId, assessmentId);
      if (!existing) return notFound("Assessment");
      if (existing.status !== "published")
        return conflict("Only published assessments can be closed");
      const updated = replaceAssessment(courseId, assessmentId, (prev) => ({
        ...prev,
        status: "closed",
        closesAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
      return HttpResponse.json({ data: updated });
    },
  ),

  // FACULTY: delete
  http.delete(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId",
    async ({ params }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const existing = getAssessmentById(courseId, assessmentId);
      if (!existing) return notFound("Assessment");
      if (existing.status === "published" || existing.status === "closed") {
        const attempts = getAttempts(assessmentId);
        if (attempts.length > 0) {
          return conflict(
            "Cannot delete an assessment with student attempts. Close it instead.",
          );
        }
      }
      deleteAssessmentFromStore(courseId, assessmentId);
      return HttpResponse.json({ data: { success: true } });
    },
  ),

  // FACULTY: attempts roll-up
  http.get(
    "/api/faculty/me/courses/:courseId/assessments/:assessmentId/attempts",
    async ({ params }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");
      const attempts = getAttempts(assessmentId);

      // Group by student
      const byStudent = new Map<string, AssessmentAttempt[]>();
      for (const a of attempts) {
        const arr = byStudent.get(a.studentId) ?? [];
        arr.push(a);
        byStudent.set(a.studentId, arr);
      }

      const data = Array.from(byStudent.entries()).map(([studentId, list]) => {
        const submitted = list.filter((a) => a.status === "submitted");
        const inProgress = list.some((a) => a.status === "in_progress");
        const best = submitted.reduce<number | undefined>(
          (acc, a) => (acc === undefined || (a.score ?? 0) > acc ? a.score : acc),
          undefined,
        );
        const last = submitted
          .slice()
          .sort(
            (a, b) =>
              new Date(b.submittedAt ?? "").getTime() -
              new Date(a.submittedAt ?? "").getTime(),
          )[0];
        return {
          studentId,
          studentName:
            studentId === "usr_student_01" ? "Alex Rivera" : `Student ${studentId.slice(-4)}`,
          attempts: list.length,
          bestScore: best,
          bestPercentage:
            best !== undefined
              ? Math.round((best / maxScoreOf(assessment)) * 1000) / 10
              : undefined,
          lastSubmittedAt: last?.submittedAt,
          status: inProgress
            ? ("in_progress" as const)
            : submitted.length > 0
              ? ("submitted" as const)
              : ("not_started" as const),
        };
      });

      return HttpResponse.json({ data });
    },
  ),

  // ═══════════════════════════════════════════════════════════════════════════
  // STUDENT: list assessments for a course (only those visible to them)
  // ═══════════════════════════════════════════════════════════════════════════
  http.get(
    "/api/students/me/courses/:courseId/assessments",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const studentId = studentIdFromRequest(request);
      const all = getAssessmentsByCourse(courseId);
      const visible = all
        .filter((a) => a.status === "published" || a.status === "closed")
        .map((a) => toStudentListItem(a, studentId));
      return HttpResponse.json({ data: visible });
    },
  ),

  // STUDENT: get one (strips correctAnswer/explanation)
  http.get(
    "/api/students/me/courses/:courseId/assessments/:assessmentId",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const studentId = studentIdFromRequest(request);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");
      if (assessment.status === "draft")
        return notFound("Assessment");
      return HttpResponse.json({ data: toStudentDetail(assessment, studentId) });
    },
  ),

  // STUDENT: start (or resume) an attempt
  http.post(
    "/api/students/me/courses/:courseId/assessments/:assessmentId/start",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const studentId = studentIdFromRequest(request);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");
      if (assessment.status !== "published")
        return forbidden("Assessment is not open");

      const now = Date.now();
      const opens = new Date(assessment.opensAt).getTime();
      const closes = new Date(assessment.closesAt).getTime();
      if (now < opens) return forbidden("Assessment has not opened yet");
      if (now >= closes) return forbidden("Assessment is closed");

      // Resume existing in_progress attempt instead of opening a new one.
      const existing = inProgressAttempt(assessmentId, studentId);
      if (existing) {
        // Check it hasn't already timed out — if so, mark it submitted with score 0.
        const expired = new Date(existing.expiresAt).getTime() <= now;
        if (expired) {
          const finalized = replaceAttempt(assessmentId, existing.id, (prev) => ({
            ...prev,
            status: "submitted",
            submittedAt: new Date().toISOString(),
            score: 0,
            maxScore: maxScoreOf(assessment),
            answers: prev.answers,
          }));
          return forbidden(
            `Your previous attempt timed out at ${finalized?.submittedAt}. Start a new one if you have attempts remaining.`,
          );
        }
        return HttpResponse.json({
          data: {
            attemptId: existing.id,
            attemptNumber: existing.attemptNumber,
            startedAt: existing.startedAt,
            expiresAt: existing.expiresAt,
          },
        });
      }

      const submittedAttempts = getAttemptsForStudent(assessmentId, studentId).filter(
        (a) => a.status === "submitted",
      );
      if (submittedAttempts.length >= assessment.attemptsAllowed)
        return forbidden("No attempts remaining");

      const startedAt = new Date(now).toISOString();
      const expiresAt = (() => {
        if (assessment.timeLimitMinutes) {
          const limit = now + assessment.timeLimitMinutes * 60_000;
          return new Date(Math.min(limit, closes)).toISOString();
        }
        return assessment.closesAt;
      })();

      const attempt: AssessmentAttempt = {
        id: id("att"),
        assessmentId,
        studentId,
        attemptNumber: submittedAttempts.length + 1,
        startedAt,
        expiresAt,
        status: "in_progress",
        answers: [],
      };
      appendAttempt(assessmentId, attempt);

      return HttpResponse.json(
        {
          data: {
            attemptId: attempt.id,
            attemptNumber: attempt.attemptNumber,
            startedAt: attempt.startedAt,
            expiresAt: attempt.expiresAt,
          },
        },
        { status: 201 },
      );
    },
  ),

  // STUDENT: submit
  http.post(
    "/api/students/me/courses/:courseId/assessments/:assessmentId/submit",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const studentId = studentIdFromRequest(request);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");

      let body: SubmitAttemptRequest;
      try {
        body = (await request.json()) as SubmitAttemptRequest;
      } catch {
        return validationError({ body: ["Invalid JSON body"] });
      }
      if (!Array.isArray(body.answers))
        return validationError({ answers: ["Answers array is required"] });

      const attempt = inProgressAttempt(assessmentId, studentId);
      if (!attempt) return forbidden("No active attempt to submit");

      const now = Date.now();
      // Late submissions are still accepted — we score what was sent and mark
      // the attempt submitted. We do not award bonus points for late.
      const { score, maxScore, graded } = gradeAttempt(assessment, body.answers);

      replaceAttempt(assessmentId, attempt.id, (prev) => ({
        ...prev,
        status: "submitted",
        submittedAt: new Date(now).toISOString(),
        answers: body.answers,
        score,
        maxScore,
      }));

      const result: GradedAttempt = {
        id: attempt.id,
        assessmentId,
        assessmentTitle: assessment.title,
        courseId,
        attemptNumber: attempt.attemptNumber,
        startedAt: attempt.startedAt,
        submittedAt: new Date(now).toISOString(),
        score,
        maxScore,
        questionResults: graded,
      };
      return HttpResponse.json({ data: result });
    },
  ),

  // STUDENT: read a past attempt's graded result
  http.get(
    "/api/students/me/courses/:courseId/assessments/:assessmentId/attempts/:attemptId",
    async ({ params, request }) => {
      await randomDelay();
      const courseId = String(params.courseId);
      const assessmentId = String(params.assessmentId);
      const attemptId = String(params.attemptId);
      const studentId = studentIdFromRequest(request);
      const assessment = getAssessmentById(courseId, assessmentId);
      if (!assessment) return notFound("Assessment");
      const attempt = getAttemptById(assessmentId, attemptId);
      if (!attempt || attempt.studentId !== studentId) return notFound("Attempt");
      if (attempt.status !== "submitted")
        return forbidden("This attempt is still in progress");
      return HttpResponse.json({ data: buildGradedAttempt(assessment, attempt) });
    },
  ),
];

// ─── Status transitions ──────────────────────────────────────────────────────

function transitionsFrom(status: Assessment["status"]): Assessment["status"][] {
  switch (status) {
    case "draft":
      return ["published"];
    case "published":
      return ["closed"];
    case "closed":
      return [];
  }
}
