/**
 * Shared mock database used by BOTH faculty and student handlers.
 *
 * Each portal's handlers used to keep its own per-course caches, which meant
 * actions taken in one portal could not propagate to the other (e.g. faculty
 * publishing an assessment was invisible to students). This module is the
 * single source of truth that the backend will replace with a real DB.
 *
 * Currently in scope:
 *   • Assessment store (keyed by courseId)
 *   • Attempt store (keyed by assessmentId)
 *
 * Existing per-portal caches (modules, assignments, attendance, etc.) are
 * preserved in their respective handler files for now — moving those is a
 * larger refactor than this surface needs. New cross-portal entities (e.g.
 * assessments) live here from day one.
 */

import { generateCourseAssessments } from "@/mocks/data/generators/assessment.generator";
import type {
  Assessment,
  AssessmentAttempt,
  AttemptStatus,
} from "@/lib/api/types/assessment.types";

// ─── Assessments ─────────────────────────────────────────────────────────────

const assessmentsByCourse: Record<string, Assessment[]> = {};

/**
 * Returns all assessments for a course. Lazily seeds the first time a course
 * is touched, so both faculty's and student's course catalogs end up with
 * realistic data without us needing to know course IDs ahead of time.
 */
export function getAssessmentsByCourse(courseId: string): Assessment[] {
  if (!assessmentsByCourse[courseId]) {
    assessmentsByCourse[courseId] = generateCourseAssessments(courseId);
  }
  return assessmentsByCourse[courseId];
}

export function getAssessmentById(
  courseId: string,
  assessmentId: string,
): Assessment | undefined {
  return getAssessmentsByCourse(courseId).find((a) => a.id === assessmentId);
}

export function setAssessments(courseId: string, list: Assessment[]): void {
  assessmentsByCourse[courseId] = list;
}

export function appendAssessment(courseId: string, assessment: Assessment): void {
  const current = getAssessmentsByCourse(courseId);
  assessmentsByCourse[courseId] = [...current, assessment];
}

export function replaceAssessment(
  courseId: string,
  assessmentId: string,
  updater: (prev: Assessment) => Assessment,
): Assessment | undefined {
  const list = getAssessmentsByCourse(courseId);
  const idx = list.findIndex((a) => a.id === assessmentId);
  if (idx === -1) return undefined;
  const next = updater(list[idx]);
  assessmentsByCourse[courseId] = list.map((a, i) => (i === idx ? next : a));
  return next;
}

export function deleteAssessment(courseId: string, assessmentId: string): boolean {
  const list = getAssessmentsByCourse(courseId);
  const next = list.filter((a) => a.id !== assessmentId);
  if (next.length === list.length) return false;
  assessmentsByCourse[courseId] = next;
  return true;
}

// ─── Attempts (keyed by assessmentId) ────────────────────────────────────────

const attemptsByAssessment: Record<string, AssessmentAttempt[]> = {};

export function getAttempts(assessmentId: string): AssessmentAttempt[] {
  if (!attemptsByAssessment[assessmentId]) {
    attemptsByAssessment[assessmentId] = [];
  }
  return attemptsByAssessment[assessmentId];
}

export function getAttemptsForStudent(
  assessmentId: string,
  studentId: string,
): AssessmentAttempt[] {
  return getAttempts(assessmentId).filter((a) => a.studentId === studentId);
}

export function getAttemptById(
  assessmentId: string,
  attemptId: string,
): AssessmentAttempt | undefined {
  return getAttempts(assessmentId).find((a) => a.id === attemptId);
}

export function appendAttempt(assessmentId: string, attempt: AssessmentAttempt): void {
  const list = getAttempts(assessmentId);
  attemptsByAssessment[assessmentId] = [...list, attempt];
}

export function replaceAttempt(
  assessmentId: string,
  attemptId: string,
  updater: (prev: AssessmentAttempt) => AssessmentAttempt,
): AssessmentAttempt | undefined {
  const list = getAttempts(assessmentId);
  const idx = list.findIndex((a) => a.id === attemptId);
  if (idx === -1) return undefined;
  const next = updater(list[idx]);
  attemptsByAssessment[assessmentId] = list.map((a, i) => (i === idx ? next : a));
  return next;
}

/**
 * Best score across all submitted attempts for a student.
 */
export function bestScoreFor(assessmentId: string, studentId: string): number | undefined {
  const attempts = getAttemptsForStudent(assessmentId, studentId).filter(
    (a) => a.status === "submitted" && typeof a.score === "number",
  );
  if (attempts.length === 0) return undefined;
  return Math.max(...attempts.map((a) => a.score as number));
}

/**
 * Returns the in-progress attempt for this student on this assessment, if any.
 * Used to resume rather than start a new attempt.
 */
export function inProgressAttempt(
  assessmentId: string,
  studentId: string,
): AssessmentAttempt | undefined {
  return getAttemptsForStudent(assessmentId, studentId).find(
    (a) => a.status === ("in_progress" as AttemptStatus),
  );
}
