import { http, HttpResponse, delay } from "msw";
import type {
  LearningPath,
  TutorSession,
  TutorDashboard,
  RecommendedLesson,
  StartSessionRequest,
} from "@/lib/api/types/tutor.types";
import {
  generateTutorDashboard,
  generateLearningPaths,
  generateTutorSession,
  generateRecommendedLessons,
} from "@/mocks/data/generators/tutor.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: TutorDashboard = generateTutorDashboard();
let learningPaths: LearningPath[] = generateLearningPaths();
let sessions: Map<string, TutorSession> = new Map();
let recommended: RecommendedLesson[] = generateRecommendedLessons(8);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function randomDelay(): Promise<void> {
  return delay(Math.floor(Math.random() * 400) + 200);
}

function notFound(resource: string) {
  return HttpResponse.json(
    {
      error: {
        code: "NOT_FOUND",
        message: `${resource} not found`,
      },
    },
    { status: 404 }
  );
}

function validationError(details: Record<string, string[]>) {
  return HttpResponse.json(
    {
      error: {
        code: "VALIDATION_ERROR",
        message: "Validation failed",
        details,
      },
    },
    { status: 422 }
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const tutorHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/students/me/tutor/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Learning Paths (list) ─────────────────────────────────────────────────
  http.get("/api/students/me/tutor/learning-paths", async () => {
    await randomDelay();
    return HttpResponse.json({ data: learningPaths });
  }),

  // ── Learning Path (single) ────────────────────────────────────────────────
  http.get("/api/students/me/tutor/learning-paths/:pathId", async ({ params }) => {
    await randomDelay();
    const path = learningPaths.find((p) => p.id === params.pathId);
    if (!path) return notFound("Learning path");
    return HttpResponse.json({ data: path });
  }),

  // ── Start / Resume a Learning Path ────────────────────────────────────────
  http.post("/api/students/me/tutor/learning-paths/:pathId/start", async ({ params }) => {
    await randomDelay();
    const pathIndex = learningPaths.findIndex((p) => p.id === params.pathId);
    if (pathIndex === -1) return notFound("Learning path");

    const path = learningPaths[pathIndex];

    if (path.status === "completed") {
      return validationError({
        pathId: ["This learning path is already completed"],
      });
    }

    const now = new Date().toISOString();

    // If not_started, unlock the first module
    if (path.status === "not_started" || path.status === "paused") {
      const updatedModules = path.modules.map((mod, index) => {
        if (index === 0 && mod.status === "locked") {
          return { ...mod, status: "available" as const };
        }
        // If paused, the first non-completed module should be available
        if (path.status === "paused" && mod.status === "locked") {
          const prevCompleted = index === 0 || path.modules[index - 1].status === "completed";
          if (prevCompleted) {
            return { ...mod, status: "available" as const };
          }
        }
        return mod;
      });

      const updatedPath: LearningPath = {
        ...path,
        status: "in_progress",
        modules: updatedModules,
        updatedAt: now,
      };

      learningPaths = learningPaths.map((p) =>
        p.id === params.pathId ? updatedPath : p
      );

      return HttpResponse.json({ data: updatedPath });
    }

    // Already in progress — just return it
    return HttpResponse.json({ data: path });
  }),

  // ── Pause a Learning Path ─────────────────────────────────────────────────
  http.post("/api/students/me/tutor/learning-paths/:pathId/pause", async ({ params }) => {
    await randomDelay();
    const pathIndex = learningPaths.findIndex((p) => p.id === params.pathId);
    if (pathIndex === -1) return notFound("Learning path");

    const path = learningPaths[pathIndex];

    if (path.status !== "in_progress") {
      return validationError({
        pathId: ["Only in-progress paths can be paused"],
      });
    }

    const now = new Date().toISOString();
    const updatedPath: LearningPath = {
      ...path,
      status: "paused",
      updatedAt: now,
    };

    learningPaths = learningPaths.map((p) =>
      p.id === params.pathId ? updatedPath : p
    );

    return HttpResponse.json({ data: updatedPath });
  }),

  // ── Get Session ───────────────────────────────────────────────────────────
  http.get("/api/students/me/tutor/sessions/:sessionId", async ({ params }) => {
    await randomDelay();
    const sessionId = params.sessionId as string;
    const session = sessions.get(sessionId);
    if (!session) return notFound("Tutor session");
    return HttpResponse.json({ data: session });
  }),

  // ── Start a New Session ───────────────────────────────────────────────────
  http.post("/api/students/me/tutor/sessions/start", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as StartSessionRequest;
    const errors: Record<string, string[]> = {};

    if (!body.moduleId) {
      errors.moduleId = ["Module ID is required"];
    }
    if (!body.pathId) {
      errors.pathId = ["Path ID is required"];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Validate path exists
    const path = learningPaths.find((p) => p.id === body.pathId);
    if (!path) {
      return validationError({ pathId: ["Learning path not found"] });
    }

    // Validate module exists and is available
    const mod = path.modules.find((m) => m.id === body.moduleId);
    if (!mod) {
      return validationError({ moduleId: ["Module not found in this path"] });
    }

    if (mod.status === "locked") {
      return validationError({
        moduleId: ["This module is locked. Complete previous modules first."],
      });
    }

    if (mod.status === "completed") {
      return validationError({
        moduleId: ["This module is already completed. You can review it but not restart."],
      });
    }

    // Generate session
    const session = generateTutorSession(body.moduleId);
    session.pathId = body.pathId;
    session.pathName = path.title;
    session.moduleId = body.moduleId;
    session.moduleName = mod.title;

    // Update module status to in_progress
    learningPaths = learningPaths.map((p) => {
      if (p.id !== body.pathId) return p;
      return {
        ...p,
        modules: p.modules.map((m) =>
          m.id === body.moduleId ? { ...m, status: "in_progress" as const } : m
        ),
        updatedAt: new Date().toISOString(),
      };
    });

    sessions.set(session.id, session);

    return HttpResponse.json({ data: session }, { status: 201 });
  }),

  // ── Complete a Section ────────────────────────────────────────────────────
  http.post(
    "/api/students/me/tutor/sessions/:sessionId/complete-section",
    async ({ params, request }) => {
      await randomDelay();
      const sessionId = params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) return notFound("Tutor session");

      const body = (await request.json()) as { sectionId?: string };

      if (!body.sectionId) {
        return validationError({ sectionId: ["Section ID is required"] });
      }

      const sectionIndex = session.content.sections.findIndex(
        (s) => s.id === body.sectionId
      );

      if (sectionIndex === -1) {
        return validationError({ sectionId: ["Section not found in this session"] });
      }

      // Mark section as completed
      const updatedSections = session.content.sections.map((s) =>
        s.id === body.sectionId ? { ...s, completed: true } : s
      );

      const updatedSession: TutorSession = {
        ...session,
        content: {
          ...session.content,
          sections: updatedSections,
        },
        updatedAt: new Date().toISOString(),
      };

      sessions.set(sessionId, updatedSession);

      return HttpResponse.json({ data: updatedSession });
    }
  ),

  // ── Submit Quiz ───────────────────────────────────────────────────────────
  http.post(
    "/api/students/me/tutor/sessions/:sessionId/submit-quiz",
    async ({ params, request }) => {
      await randomDelay();
      const sessionId = params.sessionId as string;
      const session = sessions.get(sessionId);
      if (!session) return notFound("Tutor session");

      if (!session.quiz) {
        return validationError({
          quiz: ["This session does not have a quiz"],
        });
      }

      if (session.quiz.attempts >= session.quiz.maxAttempts) {
        return validationError({
          quiz: ["Maximum quiz attempts reached"],
        });
      }

      const body = (await request.json()) as {
        answers?: { questionId: string; answer: string }[];
      };

      if (!body.answers || !Array.isArray(body.answers)) {
        return validationError({
          answers: ["Answers array is required"],
        });
      }

      // Grade the quiz
      const gradedQuestions = session.quiz.questions.map((q) => {
        const userAnswer = body.answers!.find((a) => a.questionId === q.id);
        const isCorrect = userAnswer
          ? userAnswer.answer === q.correctAnswer
          : false;
        return {
          ...q,
          userAnswer: userAnswer?.answer,
          isCorrect,
        };
      });

      const correctCount = gradedQuestions.filter((q) => q.isCorrect).length;
      const score = Math.round((correctCount / gradedQuestions.length) * 100);
      const passed = score >= session.quiz.passingScore;
      const now = new Date().toISOString();

      const updatedQuiz = {
        ...session.quiz,
        questions: gradedQuestions,
        attempts: session.quiz.attempts + 1,
        bestScore: Math.max(session.quiz.bestScore ?? 0, score),
      };

      const updatedSession: TutorSession = {
        ...session,
        quiz: updatedQuiz,
        score,
        status: passed ? "completed" : session.status,
        completedAt: passed ? now : undefined,
        updatedAt: now,
      };

      sessions.set(sessionId, updatedSession);

      // If passed, update the module in the learning path
      if (passed) {
        learningPaths = learningPaths.map((p) => {
          if (p.id !== session.pathId) return p;

          const updatedModules = p.modules.map((m, index) => {
            if (m.id === session.moduleId) {
              return {
                ...m,
                status: "completed" as const,
                score,
                maxScore: 100,
                completedAt: now,
              };
            }
            // Unlock next module if current was completed
            if (
              index > 0 &&
              p.modules[index - 1].id === session.moduleId &&
              m.status === "locked"
            ) {
              return { ...m, status: "available" as const };
            }
            return m;
          });

          const completedModules = updatedModules.filter(
            (m) => m.status === "completed"
          ).length;
          const progress = Math.round(
            (completedModules / updatedModules.length) * 100
          );
          const pathCompleted = completedModules === updatedModules.length;

          return {
            ...p,
            modules: updatedModules,
            completedModules,
            progress,
            status: pathCompleted
              ? ("completed" as const)
              : p.status,
            updatedAt: now,
          };
        });
      }

      return HttpResponse.json({ data: updatedSession });
    }
  ),

  // ── Recommended Lessons ───────────────────────────────────────────────────
  http.get("/api/students/me/tutor/recommended", async () => {
    await randomDelay();
    return HttpResponse.json({ data: recommended });
  }),

  // ── Weekly Goal Preference ───────────────────────────────────────────────
  http.patch("/api/students/me/tutor/preferences", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as { weeklyGoalTarget?: number };
    if (body.weeklyGoalTarget !== undefined) {
      (dashboard as { weeklyGoal: { target: number; completed: number } }).weeklyGoal.target = body.weeklyGoalTarget;
    }
    return HttpResponse.json({ data: { weeklyGoalTarget: dashboard.weeklyGoal.target } });
  }),

  // ── Bookmarks ────────────────────────────────────────────────────────────
  http.get("/api/students/me/tutor/bookmarks", async () => {
    await randomDelay();
    return HttpResponse.json({ data: [] });
  }),

  http.post("/api/students/me/tutor/bookmarks", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as { sectionId: string; sectionTitle: string; pathTitle: string; skill: string };
    const bookmark = {
      id: `bm_${Date.now()}`,
      ...body,
      createdAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: bookmark }, { status: 201 });
  }),
];
