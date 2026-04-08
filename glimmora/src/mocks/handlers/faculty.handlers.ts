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
} from "@/lib/api/types/faculty.types";
import type { PaginationMeta, InterventionStatus } from "@/lib/api/types/common.types";
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
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/faculty/me/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
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
      status?: InterventionStatus;
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
      updated.status = body.status;
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
