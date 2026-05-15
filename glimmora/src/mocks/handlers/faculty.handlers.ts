import { http, HttpResponse, delay } from "msw";
import type {
  FacultyDashboard,
  FacultyStudentListItem,
  FacultyCourse,
  FacultyCourseDetail,
  AiBriefing,
  FacultyProfile,
  CourseModule,
  CourseMaterial,
  FacultyAssignment,
  StudentSubmission,
  GradebookEntry,
  AttendanceSession,
  CreateModuleRequest,
  CreateAssignmentRequest,
  GradeSubmissionRequest,
  CreateAttendanceSessionRequest,
} from "@/lib/api/types/faculty.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";
import {
  generateFacultyDashboard,
  generateFacultyStudents,
  generateFacultyStudentDetail,
  generateFacultyCourses,
  generateFacultyCourseDetail,
  generateBriefings,
  generateFacultyProfile,
  generateCourseModules,
  generateFacultyAssignments,
  generateStudentSubmissions,
  generateGradebook,
  generateAttendanceSessions,
  getFacultyTerms,
} from "@/mocks/data/generators/faculty.generator";
import { getAssessmentsByCourse } from "@/mocks/data/db";
import type { Assessment } from "@/lib/api/types/assessment.types";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: FacultyDashboard = generateFacultyDashboard();
const students: FacultyStudentListItem[] = generateFacultyStudents(48);
const courses: FacultyCourse[] = generateFacultyCourses(5);
let briefings: AiBriefing[] = generateBriefings();
let profile: FacultyProfile = generateFacultyProfile();
let facultyNotifPrefs = {
  email: true,
  push: true,
  studentRiskAlerts: true,
  briefingReady: true,
};

// ─── LMS Data Caches (keyed by courseId) ─────────────────────────────────────
const courseModulesCache: Record<string, CourseModule[]> = {};
const courseAssignmentsCache: Record<string, FacultyAssignment[]> = {};
const submissionsCache: Record<string, StudentSubmission[]> = {};
const gradebookCache: Record<string, GradebookEntry[]> = {};
const attendanceCache: Record<string, AttendanceSession[]> = {};

function getModules(courseId: string): CourseModule[] {
  if (!courseModulesCache[courseId]) {
    courseModulesCache[courseId] = generateCourseModules(courseId);
  }
  return courseModulesCache[courseId];
}

function getAssignments(courseId: string): FacultyAssignment[] {
  if (!courseAssignmentsCache[courseId]) {
    courseAssignmentsCache[courseId] = generateFacultyAssignments(courseId);
  }
  return courseAssignmentsCache[courseId];
}

function getSubmissions(assignmentId: string): StudentSubmission[] {
  if (!submissionsCache[assignmentId]) {
    submissionsCache[assignmentId] = generateStudentSubmissions(assignmentId);
  }
  return submissionsCache[assignmentId];
}

function getGradebookData(courseId: string): GradebookEntry[] {
  if (!gradebookCache[courseId]) {
    gradebookCache[courseId] = generateGradebook(courseId);
  }
  // Reconcile per-row assessment cells against the current assessment store so
  // faculty-created or deleted assessments propagate without busting the cache.
  return reconcileAssessmentCells(courseId, gradebookCache[courseId]);
}

function reconcileAssessmentCells(
  courseId: string,
  entries: GradebookEntry[],
): GradebookEntry[] {
  const liveAssessments = getAssessmentsByCourse(courseId);
  const liveIds = new Set(liveAssessments.map((a) => a.id));

  return entries.map((entry) => {
    const keptCells = (entry.assessments ?? []).filter((c) => liveIds.has(c.assessmentId));
    const knownIds = new Set(keptCells.map((c) => c.assessmentId));

    const newCells: GradebookEntry["assessments"] = liveAssessments
      .filter((a: Assessment) => !knownIds.has(a.id))
      .map((a: Assessment) => {
        // Newly-added assessments default to ungraded for every student. Once
        // an attempt lands the student's row will get filled in below.
        return {
          assessmentId: a.id,
          title: a.title,
          score: null,
          maxScore: a.maxScore,
          weight: a.weight,
          status: "pending",
        };
      });

    const merged = [...keptCells, ...newCells];

    // Keep title/maxScore/weight in sync if faculty edits an assessment.
    const aligned = merged.map((cell) => {
      const live = liveAssessments.find((a: Assessment) => a.id === cell.assessmentId);
      if (!live) return cell;
      return {
        ...cell,
        title: live.title,
        maxScore: live.maxScore,
        weight: live.weight,
      };
    });

    // Recompute the weighted average to reflect the current cell set.
    let weightedSum = 0;
    let totalWeight = 0;
    for (const c of entry.assignments) {
      if (c.score !== null) {
        weightedSum += (c.score / c.maxScore) * c.weight;
        totalWeight += c.weight;
      }
    }
    for (const c of aligned) {
      if (c.score !== null) {
        weightedSum += (c.score / c.maxScore) * c.weight;
        totalWeight += c.weight;
      }
    }
    const weightedAverage = totalWeight > 0 ? Math.round(((weightedSum / totalWeight) * 100) * 10) / 10 : 0;

    return { ...entry, assessments: aligned, weightedAverage };
  });
}

function getAttendanceSessions(courseId: string): AttendanceSession[] {
  if (!attendanceCache[courseId]) {
    attendanceCache[courseId] = generateAttendanceSessions(courseId);
  }
  return attendanceCache[courseId];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paginate<T>(
  items: T[],
  url: URL
): { data: T[]; meta: PaginationMeta } {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize")) || 20)
  );
  const total = items.length;
  const totalPages = Math.ceil(total / pageSize);
  const start = (page - 1) * pageSize;
  const data = items.slice(start, start + pageSize);
  return { data, meta: { page, pageSize, total, totalPages } };
}

function searchFilter<T>(
  items: T[],
  search: string | null,
  fields: (keyof T)[]
): T[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => {
      const val = item[f];
      return typeof val === "string" && val.toLowerCase().includes(lower);
    })
  );
}

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

export const facultyHandlers = [
  // ── Dashboard (live KPIs) ──────────────────────────────────────────────────
  http.get("/api/faculty/me/dashboard", async () => {
    await randomDelay();
    const liveData = {
      ...dashboard,
      atRiskStudentCount: students.filter((s) => s.riskLevel === "high").length,
      totalStudents: students.length,
    };
    return HttpResponse.json({ data: liveData });
  }),

  // ── Students ──────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/terms", async () => {
    await randomDelay();
    return HttpResponse.json({ data: getFacultyTerms() });
  }),

  http.get("/api/faculty/me/students", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const riskLevel = url.searchParams.get("riskLevel");
    const term = url.searchParams.get("term");

    let filtered = [...students];

    // Default to the active term if no term param is sent, so consumers that
    // don't yet pass `term` still see the current roster rather than every
    // student across history.
    const terms = getFacultyTerms();
    const activeTerm = terms.find((t) => t.isCurrent)?.value ?? terms[0]?.value;
    const effectiveTerm = term ?? activeTerm;
    if (effectiveTerm) {
      filtered = filtered.filter((s) => s.terms?.includes(effectiveTerm));
    }

    if (riskLevel && ["high", "medium", "low", "none"].includes(riskLevel)) {
      filtered = filtered.filter((s) => s.riskLevel === riskLevel);
    }

    filtered = searchFilter(filtered, search, [
      "name",
      "email",
      "studentId",
      "department",
    ] as (keyof FacultyStudentListItem)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/faculty/me/students/:studentId", async ({ params }) => {
    await randomDelay();
    const studentId = params.studentId as string;

    // Check if student exists in our list
    const student = students.find((s) => s.id === studentId);
    if (!student) return notFound("Student");

    const detail = generateFacultyStudentDetail(studentId);
    if (!detail) return notFound("Student");

    return HttpResponse.json({ data: detail });
  }),

  // ── Courses ───────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/courses", async () => {
    await randomDelay();
    return HttpResponse.json({ data: courses });
  }),

  http.get("/api/faculty/me/courses/:courseId", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");

    const detail = generateFacultyCourseDetail(courseId);
    if (!detail) return notFound("Course");

    return HttpResponse.json({ data: detail });
  }),

  // ── Briefings ─────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/briefings", async () => {
    await randomDelay();
    return HttpResponse.json({ data: briefings });
  }),

  http.get("/api/faculty/me/briefings/:courseId", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const briefing = briefings.find((b) => b.courseId === courseId);
    if (!briefing) return notFound("Briefing");
    return HttpResponse.json({ data: briefing });
  }),

  http.patch("/api/faculty/me/briefings/:courseId/action-items/:index", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const index = Number(params.index);

    const briefingIdx = briefings.findIndex((b) => b.courseId === courseId);
    if (briefingIdx === -1) return notFound("Briefing");

    const briefing = briefings[briefingIdx];
    if (isNaN(index) || index < 0 || index >= briefing.actionItems.length) {
      return HttpResponse.json(
        {
          error: {
            code: "NOT_FOUND",
            message: "Action item not found at the specified index",
          },
        },
        { status: 404 }
      );
    }

    let body: { completed?: boolean };
    try {
      body = (await request.json()) as { completed?: boolean };
    } catch {
      return validationError({ completed: ["Request body must include 'completed' boolean field"] });
    }

    if (typeof body.completed !== "boolean") {
      return validationError({ completed: ["'completed' must be a boolean value"] });
    }

    // Update the action item
    const updatedActionItems = [...briefing.actionItems];
    updatedActionItems[index] = { ...updatedActionItems[index], completed: body.completed };

    const updatedBriefing = { ...briefing, actionItems: updatedActionItems };
    briefings = briefings.map((b) => (b.courseId === courseId ? updatedBriefing : b));

    return HttpResponse.json({ data: updatedBriefing });
  }),


  // ── Notification Preferences ─────────────────────────────────────────────
  http.get("/api/faculty/me/notification-preferences", async () => {
    await randomDelay();
    return HttpResponse.json({ data: facultyNotifPrefs });
  }),

  http.patch("/api/faculty/me/notification-preferences", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Record<string, boolean>;

    for (const key of Object.keys(body)) {
      if (key in facultyNotifPrefs) {
        (facultyNotifPrefs as Record<string, boolean>)[key] = body[key];
      }
    }

    return HttpResponse.json({ data: facultyNotifPrefs });
  }),

  // ── Course Modules (LMS) ──────────────────────────────────────────────────
  http.get("/api/faculty/me/courses/:courseId/modules", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: getModules(courseId) });
  }),

  http.post("/api/faculty/me/courses/:courseId/modules", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");

    const body = (await request.json()) as { title?: string; description?: string };
    const errors: Record<string, string[]> = {};
    if (!body.title || body.title.trim().length === 0) errors.title = ["Module title is required"];
    if (!body.description || body.description.trim().length === 0) errors.description = ["Description is required"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    const modules = getModules(courseId);
    const newModule: CourseModule = {
      id: `mod_${Date.now()}`,
      courseId,
      title: body.title!,
      description: body.description!,
      order: modules.length + 1,
      materials: [],
    };
    courseModulesCache[courseId] = [...modules, newModule];
    return HttpResponse.json({ data: newModule }, { status: 201 });
  }),

  http.delete("/api/faculty/me/courses/:courseId/modules/:moduleId", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const moduleId = params.moduleId as string;
    const modules = getModules(courseId);
    const idx = modules.findIndex((m) => m.id === moduleId);
    if (idx === -1) return notFound("Module");

    courseModulesCache[courseId] = modules.filter((m) => m.id !== moduleId);
    return HttpResponse.json({ data: { success: true } });
  }),

  http.post("/api/faculty/me/courses/:courseId/modules/:moduleId/materials", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const moduleId = params.moduleId as string;
    const modules = getModules(courseId);
    const moduleIdx = modules.findIndex((m) => m.id === moduleId);
    if (moduleIdx === -1) return notFound("Module");

    const body = (await request.json()) as { title?: string; type?: string; fileName?: string };
    const errors: Record<string, string[]> = {};
    if (!body.title || body.title.trim().length === 0) errors.title = ["Title is required"];
    if (!body.type || !["pdf", "video", "slides", "link"].includes(body.type)) errors.type = ["Type must be pdf, video, slides, or link"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    const newMaterial: CourseMaterial = {
      id: `mat_${Date.now()}`,
      moduleId,
      title: body.title!,
      type: body.type as CourseMaterial["type"],
      url: `/uploads/courses/${courseId}/${Date.now()}.${body.type === "pdf" ? "pdf" : body.type === "video" ? "mp4" : "pptx"}`,
      fileSize: body.type !== "link" ? 2048000 : undefined,
      duration: body.type === "video" ? 1800 : undefined,
      uploadedAt: new Date().toISOString(),
    };

    const updatedModule = { ...modules[moduleIdx], materials: [...modules[moduleIdx].materials, newMaterial] };
    courseModulesCache[courseId] = modules.map((m) => (m.id === moduleId ? updatedModule : m));
    return HttpResponse.json({ data: newMaterial }, { status: 201 });
  }),

  // ── Assignments (LMS) ───────────────────────────────────────────────────
  http.get("/api/faculty/me/courses/:courseId/assignments", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: getAssignments(courseId) });
  }),

  http.post("/api/faculty/me/courses/:courseId/assignments", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");

    const body = (await request.json()) as CreateAssignmentRequest;
    const errors: Record<string, string[]> = {};
    if (!body.title || body.title.trim().length === 0) errors.title = ["Title is required"];
    if (!body.description) errors.description = ["Description is required"];
    if (!body.type) errors.type = ["Assignment type is required"];
    if (!body.dueDate) errors.dueDate = ["Due date is required"];
    if (!body.maxScore || body.maxScore < 1) errors.maxScore = ["Max score must be at least 1"];
    if (!body.weight || body.weight < 1 || body.weight > 100) errors.weight = ["Weight must be 1-100"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    const assignments = getAssignments(courseId);
    const newAssignment: FacultyAssignment = {
      id: `asg_${Date.now()}`,
      courseId,
      title: body.title,
      description: body.description,
      type: body.type,
      dueDate: body.dueDate,
      maxScore: body.maxScore,
      weight: body.weight,
      status: "draft",
      submissionCount: 0,
      gradedCount: 0,
      rubric: body.rubric || [],
    };
    courseAssignmentsCache[courseId] = [...assignments, newAssignment];
    return HttpResponse.json({ data: newAssignment }, { status: 201 });
  }),

  // ── Submissions ──────────────────────────────────────────────────────────
  http.get("/api/faculty/me/courses/:courseId/assignments/:assignmentId/submissions", async ({ params }) => {
    await randomDelay();
    const assignmentId = params.assignmentId as string;
    return HttpResponse.json({ data: getSubmissions(assignmentId) });
  }),

  http.patch("/api/faculty/me/courses/:courseId/submissions/:submissionId/grade", async ({ params, request }) => {
    await randomDelay();
    const submissionId = params.submissionId as string;
    const body = (await request.json()) as { score?: number; feedback?: string };
    const errors: Record<string, string[]> = {};
    if (body.score === undefined || body.score < 0) errors.score = ["Score cannot be negative"];
    if (!body.feedback || body.feedback.trim().length === 0) errors.feedback = ["Feedback is required"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Find and update in all caches
    for (const key of Object.keys(submissionsCache)) {
      const subs = submissionsCache[key];
      const idx = subs.findIndex((s) => s.id === submissionId);
      if (idx !== -1) {
        submissionsCache[key] = subs.map((s) =>
          s.id === submissionId ? { ...s, score: body.score, feedback: body.feedback, status: "graded" as const } : s
        );
        return HttpResponse.json({ data: submissionsCache[key].find((s) => s.id === submissionId) });
      }
    }
    return notFound("Submission");
  }),

  // ── Gradebook ────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/courses/:courseId/gradebook", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: getGradebookData(courseId) });
  }),

  // ── Attendance ───────────────────────────────────────────────────────────
  http.get("/api/faculty/me/courses/:courseId/attendance", async ({ params }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: getAttendanceSessions(courseId) });
  }),

  http.post("/api/faculty/me/courses/:courseId/attendance", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const course = courses.find((c) => c.id === courseId);
    if (!course) return notFound("Course");

    const body = (await request.json()) as CreateAttendanceSessionRequest;
    const errors: Record<string, string[]> = {};
    if (!body.date) errors.date = ["Date is required"];
    if (!body.topic || body.topic.trim().length === 0) errors.topic = ["Topic is required"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    const sessions = getAttendanceSessions(courseId);
    // Create new session with default "present" for all students
    const studentNames = [
      "Alice Johnson", "Bob Williams", "Carol Martinez", "David Brown", "Eva Chen",
      "Frank Kim", "Grace Patel", "Henry Nguyen", "Irene Thompson", "James Garcia",
      "Karen Lee", "Liam Davis", "Monica Wilson", "Nathan Taylor", "Olivia Anderson",
    ];
    const records = studentNames.map((name) => ({
      studentId: `stu_${Date.now()}_${name.replace(/\s/g, "")}`,
      studentName: name,
      status: "present" as const,
    }));

    const newSession: AttendanceSession = {
      id: `att_${Date.now()}`,
      courseId,
      date: body.date,
      topic: body.topic,
      records,
      presentCount: records.length,
      absentCount: 0,
      lateCount: 0,
    };
    attendanceCache[courseId] = [newSession, ...sessions];
    return HttpResponse.json({ data: newSession }, { status: 201 });
  }),

  http.patch("/api/faculty/me/courses/:courseId/attendance/:sessionId", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.courseId as string;
    const sessionId = params.sessionId as string;
    const sessions = getAttendanceSessions(courseId);
    const idx = sessions.findIndex((s) => s.id === sessionId);
    if (idx === -1) return notFound("Attendance session");

    const body = (await request.json()) as { records: { studentId: string; status: "present" | "absent" | "late" }[] };

    const currentSession = sessions[idx];
    const updatedRecords = currentSession.records.map((r) => {
      const update = body.records.find((u) => u.studentId === r.studentId);
      return update ? { ...r, status: update.status } : r;
    });

    const updatedSession: AttendanceSession = {
      ...currentSession,
      records: updatedRecords,
      presentCount: updatedRecords.filter((r) => r.status === "present").length,
      absentCount: updatedRecords.filter((r) => r.status === "absent").length,
      lateCount: updatedRecords.filter((r) => r.status === "late").length,
    };

    attendanceCache[courseId] = sessions.map((s) => (s.id === sessionId ? updatedSession : s));
    return HttpResponse.json({ data: updatedSession });
  }),

  // ── Profile ───────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/profile", async () => {
    await randomDelay();
    return HttpResponse.json({ data: profile });
  }),

  http.patch("/api/faculty/me/profile", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<FacultyProfile>;
    const errors: Record<string, string[]> = {};

    if (body.name !== undefined && body.name.trim().length === 0) {
      errors.name = ["Name cannot be empty"];
    }

    if (body.email !== undefined) {
      const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRe.test(body.email)) {
        errors.email = ["Invalid email format"];
      }
    }

    if (body.phone !== undefined && body.phone.trim().length > 0) {
      const phoneRe = /^\+?[\d\s\-()]{7,20}$/;
      if (!phoneRe.test(body.phone)) {
        errors.phone = ["Invalid phone number format"];
      }
    }

    if (body.officeHours !== undefined && body.officeHours.trim().length === 0) {
      errors.officeHours = ["Office hours cannot be empty"];
    }

    if (body.office !== undefined && body.office.trim().length === 0) {
      errors.office = ["Office location cannot be empty"];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Merge updates (only allow safe fields)
    const allowedFields = [
      "name",
      "phone",
      "bio",
      "avatarUrl",
      "officeHours",
      "office",
      "expertise",
      "socialLinks",
    ] as const;

    const profileRecord = profile as unknown as Record<string, unknown>;
    const bodyRecord = body as Record<string, unknown>;
    for (const key of allowedFields) {
      if (bodyRecord[key] !== undefined) {
        profileRecord[key] = bodyRecord[key];
      }
    }

    return HttpResponse.json({ data: profile });
  }),
];
