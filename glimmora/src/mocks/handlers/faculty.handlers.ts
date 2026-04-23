import { http, HttpResponse, delay } from "msw";
import type {
  FacultyDashboard,
  FacultyStudentListItem,
  Intervention,
  CreateInterventionRequest,
  FacultyCourse,
  FacultyCourseDetail,
  FacultyGrant,
  FacultyCollaboration,
  FacultyPublication,
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
  generateInterventions,
  generateFacultyCourses,
  generateFacultyCourseDetail,
  generateGrants,
  generateCollaborations,
  generatePublications,
  generateBriefings,
  generateFacultyProfile,
  generateCourseModules,
  generateFacultyAssignments,
  generateStudentSubmissions,
  generateGradebook,
  generateAttendanceSessions,
} from "@/mocks/data/generators/faculty.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: FacultyDashboard = generateFacultyDashboard();
const students: FacultyStudentListItem[] = generateFacultyStudents(48);
let interventions: Intervention[] = generateInterventions(10);
const courses: FacultyCourse[] = generateFacultyCourses(5);
let grants: FacultyGrant[] = generateGrants(10);
let collaborations: FacultyCollaboration[] = generateCollaborations(15);
let publications: FacultyPublication[] = generatePublications(20);
let briefings: AiBriefing[] = generateBriefings();
let profile: FacultyProfile = generateFacultyProfile();
let facultyNotifPrefs = {
  email: true,
  push: true,
  studentRiskAlerts: true,
  interventionUpdates: true,
  grantDeadlines: true,
  briefingReady: true,
  collaborationRequests: false,
  citationAlerts: false,
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
  return gradebookCache[courseId];
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
      activeInterventions: interventions.filter((i) => i.status === "active").length,
      totalStudents: students.length,
    };
    return HttpResponse.json({ data: liveData });
  }),

  // ── Students ──────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/students", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const riskLevel = url.searchParams.get("riskLevel");

    let filtered = [...students];

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

  // ── Interventions ─────────────────────────────────────────────────────────
  http.get("/api/faculty/me/interventions", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let filtered = [...interventions];

    if (status && ["planned", "active", "completed", "abandoned"].includes(status)) {
      filtered = filtered.filter((i) => i.status === status);
    }

    // Sort by most recently updated
    filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/faculty/me/interventions/:interventionId", async ({ params }) => {
    await randomDelay();
    const intervention = interventions.find((i) => i.id === params.interventionId);
    if (!intervention) return notFound("Intervention");
    return HttpResponse.json({ data: intervention });
  }),

  http.post("/api/faculty/me/interventions", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateInterventionRequest;
    const errors: Record<string, string[]> = {};

    if (!body.studentId) {
      errors.studentId = ["Student ID is required"];
    } else {
      const student = students.find((s) => s.id === body.studentId);
      if (!student) {
        errors.studentId = ["Student not found"];
      }
    }

    if (!body.type || !["academic_support", "counseling", "mentoring", "schedule_adjustment", "financial_aid"].includes(body.type)) {
      errors.type = ["Type must be one of: academic_support, counseling, mentoring, schedule_adjustment, financial_aid"];
    }

    if (!body.description || body.description.trim().length < 10) {
      errors.description = ["Description is required and must be at least 10 characters"];
    }

    if (!body.goals || body.goals.length === 0) {
      errors.goals = ["At least one goal is required"];
    }

    if (!body.startDate) {
      errors.startDate = ["Start date is required"];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const student = students.find((s) => s.id === body.studentId)!;
    const now = new Date().toISOString();

    const newIntervention: Intervention = {
      id: `int_${Date.now()}`,
      studentId: body.studentId,
      studentName: student.name,
      type: body.type,
      description: body.description,
      goals: body.goals,
      status: "planned",
      startDate: body.startDate,
      notes: [
        {
          date: now,
          content: "Intervention created and awaiting activation.",
          author: "Dr. Sarah Chen",
        },
      ],
      createdBy: "usr_faculty_01",
      createdAt: now,
      updatedAt: now,
    };

    interventions = [newIntervention, ...interventions];

    return HttpResponse.json({ data: newIntervention }, { status: 201 });
  }),

  http.patch("/api/faculty/me/interventions/:interventionId", async ({ params, request }) => {
    await randomDelay();
    const interventionId = params.interventionId as string;
    const idx = interventions.findIndex((i) => i.id === interventionId);
    if (idx === -1) return notFound("Intervention");

    const body = (await request.json()) as {
      status?: string;
      note?: { content: string };
      outcomes?: string;
    };
    const errors: Record<string, string[]> = {};

    if (body.status !== undefined) {
      if (!["planned", "active", "completed", "abandoned"].includes(body.status)) {
        errors.status = ["Status must be one of: planned, active, completed, abandoned"];
      }
    }

    if (body.note !== undefined) {
      if (!body.note.content || body.note.content.trim().length < 5) {
        errors["note.content"] = ["Note content is required and must be at least 5 characters"];
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const now = new Date().toISOString();
    const current = interventions[idx];
    const updated = { ...current, updatedAt: now };

    if (body.status) {
      updated.status = body.status as Intervention["status"];
      if (body.status === "completed" || body.status === "abandoned") {
        updated.endDate = now;
      }
    }

    if (body.outcomes) {
      updated.outcomes = body.outcomes;
    }

    if (body.note) {
      updated.notes = [
        { date: now, content: body.note.content, author: "Dr. Sarah Chen" },
        ...current.notes,
      ];
    }

    interventions = interventions.map((i) => (i.id === interventionId ? updated : i));

    return HttpResponse.json({ data: updated });
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

  // ── Grants ────────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/grants", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let filtered = [...grants];

    if (status && ["discovered", "interested", "drafting", "submitted", "funded", "rejected"].includes(status)) {
      filtered = filtered.filter((g) => g.status === status);
    }

    // Sort by alignment score descending
    filtered.sort((a, b) => b.alignmentScore - a.alignmentScore);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Collaborations ────────────────────────────────────────────────────────
  http.get("/api/faculty/me/collaborations", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let filtered = [...collaborations];

    filtered = searchFilter(filtered, search, [
      "name",
      "institution",
      "department",
    ] as (keyof FacultyCollaboration)[]);

    // Also search in expertise arrays
    if (search) {
      const lower = search.toLowerCase();
      const searchInExpertise = collaborations.filter((c) =>
        c.expertise.some((e) => e.toLowerCase().includes(lower))
      );
      // Merge without duplicates
      const ids = new Set(filtered.map((c) => c.id));
      for (const c of searchInExpertise) {
        if (!ids.has(c.id)) {
          filtered.push(c);
          ids.add(c.id);
        }
      }
    }

    // Sort by match score descending
    filtered.sort((a, b) => b.matchScore - a.matchScore);

    return HttpResponse.json({ data: filtered });
  }),

  // ── Publications ──────────────────────────────────────────────────────────
  http.get("/api/faculty/me/publications", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    let filtered = [...publications];

    if (type && ["journal", "conference", "book_chapter", "preprint"].includes(type)) {
      filtered = filtered.filter((p) => p.type === type);
    }

    filtered = searchFilter(filtered, search, [
      "title",
      "journal",
    ] as (keyof FacultyPublication)[]);

    // Also search in coAuthors
    if (search) {
      const lower = search.toLowerCase();
      const searchInAuthors = publications.filter((p) =>
        p.coAuthors.some((a) => a.toLowerCase().includes(lower))
      );
      const ids = new Set(filtered.map((p) => p.id));
      for (const p of searchInAuthors) {
        if (!ids.has(p.id)) {
          filtered.push(p);
          ids.add(p.id);
        }
      }
    }

    // Sort by year descending, then citations descending
    filtered.sort((a, b) => b.year - a.year || b.citations - a.citations);

    return HttpResponse.json({ data: filtered });
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

  // ── Grant Status Change ───────────────────────────────────────────────────
  http.patch("/api/faculty/me/grants/:grantId", async ({ params, request }) => {
    await randomDelay();
    const grantId = params.grantId as string;
    const idx = grants.findIndex((g) => g.id === grantId);
    if (idx === -1) return notFound("Grant");

    const body = (await request.json()) as { status?: string };
    if (!body.status || !["discovered", "interested", "drafting", "submitted", "funded", "rejected"].includes(body.status)) {
      return validationError({ status: ["Status must be one of: discovered, interested, drafting, submitted, funded, rejected"] });
    }

    const now = new Date().toISOString();
    grants = grants.map((g) =>
      g.id === grantId ? { ...g, status: body.status as FacultyGrant["status"] } : g
    );

    return HttpResponse.json({ data: grants.find((g) => g.id === grantId) });
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

  // ── Intervention Note Edit/Delete ────────────────────────────────────────
  http.patch("/api/faculty/me/interventions/:interventionId/notes/:noteIndex", async ({ params, request }) => {
    await randomDelay();
    const interventionId = params.interventionId as string;
    const noteIndex = Number(params.noteIndex);
    const intervention = interventions.find((i) => i.id === interventionId);
    if (!intervention) return notFound("Intervention");
    if (isNaN(noteIndex) || noteIndex < 0 || noteIndex >= intervention.notes.length) {
      return notFound("Note");
    }

    const body = (await request.json()) as { content: string };
    if (!body.content || body.content.trim().length < 5) {
      return validationError({ content: ["Note must be at least 5 characters"] });
    }

    const now = new Date().toISOString();
    const updatedNotes = [...intervention.notes];
    updatedNotes[noteIndex] = { ...updatedNotes[noteIndex], content: body.content, date: now };

    interventions = interventions.map((i) =>
      i.id === interventionId ? { ...i, notes: updatedNotes, updatedAt: now } : i
    );

    return HttpResponse.json({ data: interventions.find((i) => i.id === interventionId) });
  }),

  http.delete("/api/faculty/me/interventions/:interventionId/notes/:noteIndex", async ({ params }) => {
    await randomDelay();
    const interventionId = params.interventionId as string;
    const noteIndex = Number(params.noteIndex);
    const intervention = interventions.find((i) => i.id === interventionId);
    if (!intervention) return notFound("Intervention");
    if (isNaN(noteIndex) || noteIndex < 0 || noteIndex >= intervention.notes.length) {
      return notFound("Note");
    }

    const now = new Date().toISOString();
    const updatedNotes = intervention.notes.filter((_, i) => i !== noteIndex);

    interventions = interventions.map((i) =>
      i.id === interventionId ? { ...i, notes: updatedNotes, updatedAt: now } : i
    );

    return HttpResponse.json({ data: interventions.find((i) => i.id === interventionId) });
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
      "researchInterests",
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
