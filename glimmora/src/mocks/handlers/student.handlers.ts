import { http, HttpResponse, delay } from "msw";
import type {
  StudentDashboard,
  Course,
  TranscriptSemester,
  SkillScore,
  SkillEvolutionPoint,
  SkillGap,
  Credential,
  CareerReadiness,
  JobMatch,
  Application,
  PortfolioItem,
  StudentRecommendation,
  Appeal,
  StudentProfile,
  NotificationPreferences,
} from "@/lib/api/types/student.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";
import {
  generateStudentDashboard,
  generateCourses,
  generateTranscript,
  generateSkills,
  generateSkillEvolution,
  generateSkillGaps,
  generateCredentials,
  generateCareerReadiness,
  generateJobMatches,
  generateApplications,
  generatePortfolioItems,
  generateRecommendations,
  generateAppeals,
  generateStudentProfile,
  generateNotificationPreferences,
} from "@/mocks/data/generators/student.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: StudentDashboard = generateStudentDashboard();
let courses: Course[] = generateCourses(16);
const transcript: TranscriptSemester[] = generateTranscript();
const skills: SkillScore[] = generateSkills(10);
const skillEvolution: SkillEvolutionPoint[] = generateSkillEvolution(12);
const skillGaps: SkillGap[] = generateSkillGaps(4);
let credentials: Credential[] = generateCredentials(7);
const careerReadiness: CareerReadiness = generateCareerReadiness();
let jobMatches: JobMatch[] = generateJobMatches(10);
let applications: Application[] = generateApplications(5);
let portfolioItems: PortfolioItem[] = generatePortfolioItems(6);
let recommendations: StudentRecommendation[] = generateRecommendations(6);
let appeals: Appeal[] = generateAppeals(3);
let profile: StudentProfile = generateStudentProfile();
let notificationPrefs: NotificationPreferences =
  generateNotificationPreferences();

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

export const studentHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/students/me/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Transcript ────────────────────────────────────────────────────────────
  http.get("/api/students/me/transcript", async () => {
    await randomDelay();
    return HttpResponse.json({ data: transcript });
  }),

  // ── Courses ───────────────────────────────────────────────────────────────
  http.get("/api/students/me/courses", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let filtered = [...courses];
    if (status && ["active", "completed", "withdrawn"].includes(status)) {
      filtered = filtered.filter((c) => c.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "name",
      "code",
      "instructor",
    ] as (keyof Course)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/students/me/courses/:courseId", async ({ params }) => {
    await randomDelay();
    const course = courses.find((c) => c.id === params.courseId);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: course });
  }),

  // ── Skills ────────────────────────────────────────────────────────────────
  http.get("/api/students/me/skills", async () => {
    await randomDelay();
    return HttpResponse.json({ data: skills });
  }),

  http.get("/api/students/me/skills/evolution", async () => {
    await randomDelay();
    return HttpResponse.json({ data: skillEvolution });
  }),

  http.get("/api/students/me/skills/gaps", async () => {
    await randomDelay();
    return HttpResponse.json({ data: skillGaps });
  }),

  // ── Credentials ───────────────────────────────────────────────────────────
  http.get("/api/students/me/credentials", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    let filtered = [...credentials];
    if (
      type &&
      ["degree", "certificate", "badge", "transcript"].includes(type)
    ) {
      filtered = filtered.filter((c) => c.type === type);
    }
    filtered = searchFilter(filtered, search, [
      "title",
      "issuer",
      "description",
    ] as (keyof Credential)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/students/me/credentials/:credentialId", async ({ params }) => {
    await randomDelay();
    const credential = credentials.find((c) => c.id === params.credentialId);
    if (!credential) return notFound("Credential");
    return HttpResponse.json({ data: credential });
  }),

  // ── Career Readiness ──────────────────────────────────────────────────────
  http.get("/api/students/me/career-readiness", async () => {
    await randomDelay();
    return HttpResponse.json({ data: careerReadiness });
  }),

  // ── Jobs ──────────────────────────────────────────────────────────────────
  http.get("/api/students/me/jobs", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");
    const minMatch = url.searchParams.get("minMatch");

    let filtered = [...jobMatches];

    if (
      type &&
      ["full_time", "internship", "part_time", "contract"].includes(type)
    ) {
      filtered = filtered.filter((j) => j.type === type);
    }
    if (minMatch) {
      const min = Number(minMatch);
      if (!isNaN(min)) {
        filtered = filtered.filter((j) => j.matchScore >= min);
      }
    }
    filtered = searchFilter(filtered, search, [
      "title",
      "company",
      "location",
    ] as (keyof JobMatch)[]);

    // Sort by match score descending by default
    filtered.sort((a, b) => b.matchScore - a.matchScore);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/students/me/jobs/:jobId", async ({ params }) => {
    await randomDelay();
    const job = jobMatches.find((j) => j.id === params.jobId);
    if (!job) return notFound("Job");
    return HttpResponse.json({ data: job });
  }),

  // ── Applications ──────────────────────────────────────────────────────────
  http.get("/api/students/me/applications", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const search = url.searchParams.get("search");

    let filtered = [...applications];
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "jobTitle",
      "company",
    ] as (keyof Application)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/students/me/applications", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as { jobId?: string };

    if (!body.jobId) {
      return validationError({ jobId: ["Job ID is required"] });
    }

    const job = jobMatches.find((j) => j.id === body.jobId);
    if (!job) {
      return validationError({ jobId: ["Job not found"] });
    }

    if (applications.some((a) => a.jobId === body.jobId)) {
      return validationError({
        jobId: ["You have already applied to this job"],
      });
    }

    const now = new Date().toISOString();
    const newApp: Application = {
      id: `app_${Date.now()}`,
      jobId: job.id,
      jobTitle: job.title,
      company: job.company,
      status: "applied",
      appliedDate: now,
      lastActivityDate: now,
      nextStep: "Awaiting initial screening",
      timeline: [
        { date: now, event: "Application submitted", status: "applied" },
      ],
      createdAt: now,
      updatedAt: now,
    };

    applications = [newApp, ...applications];

    // Mark job as applied
    jobMatches = jobMatches.map((j) =>
      j.id === body.jobId ? { ...j, applied: true } : j
    );

    return HttpResponse.json({ data: newApp }, { status: 201 });
  }),

  // ── Portfolio ─────────────────────────────────────────────────────────────
  http.get("/api/students/me/portfolio", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    let filtered = [...portfolioItems];
    if (
      type &&
      ["project", "paper", "certification", "award", "other"].includes(type)
    ) {
      filtered = filtered.filter((p) => p.type === type);
    }
    filtered = searchFilter(filtered, search, [
      "title",
      "description",
    ] as (keyof PortfolioItem)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/students/me/portfolio", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<PortfolioItem>;
    const errors: Record<string, string[]> = {};

    if (!body.title || body.title.trim().length === 0) {
      errors.title = ["Title is required"];
    }
    if (!body.description || body.description.trim().length === 0) {
      errors.description = ["Description is required"];
    }
    if (
      !body.type ||
      !["project", "paper", "certification", "award", "other"].includes(
        body.type
      )
    ) {
      errors.type = [
        "Type must be one of: project, paper, certification, award, other",
      ];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const now = new Date().toISOString();
    const newItem: PortfolioItem = {
      id: `port_${Date.now()}`,
      title: body.title!,
      description: body.description!,
      type: body.type!,
      url: body.url,
      fileUrl: body.fileUrl,
      skills: body.skills ?? [],
      isPublic: body.isPublic ?? false,
      createdAt: now,
      updatedAt: now,
    };

    portfolioItems = [newItem, ...portfolioItems];
    return HttpResponse.json({ data: newItem }, { status: 201 });
  }),

  http.delete(
    "/api/students/me/portfolio/:itemId",
    async ({ params }) => {
      await randomDelay();
      const idx = portfolioItems.findIndex((p) => p.id === params.itemId);
      if (idx === -1) return notFound("Portfolio item");

      const removed = portfolioItems[idx];
      portfolioItems = portfolioItems.filter((p) => p.id !== params.itemId);

      return HttpResponse.json({ data: removed });
    }
  ),

  // ── Recommendations ───────────────────────────────────────────────────────
  http.get("/api/students/me/recommendations", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");

    let filtered = [...recommendations];
    if (type) {
      filtered = filtered.filter((r) => r.type === type);
    }
    if (status) {
      filtered = filtered.filter((r) => r.status === status);
    }

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post(
    "/api/students/me/recommendations/:id/approve",
    async ({ params }) => {
      await randomDelay();
      const idx = recommendations.findIndex((r) => r.id === params.id);
      if (idx === -1) return notFound("Recommendation");

      recommendations = recommendations.map((r) =>
        r.id === params.id
          ? { ...r, status: "approved" as const, updatedAt: new Date().toISOString() }
          : r
      );

      return HttpResponse.json({
        data: recommendations.find((r) => r.id === params.id),
      });
    }
  ),

  http.post(
    "/api/students/me/recommendations/:id/dismiss",
    async ({ params, request }) => {
      await randomDelay();
      const idx = recommendations.findIndex((r) => r.id === params.id);
      if (idx === -1) return notFound("Recommendation");

      let dismissReason: string | undefined;
      try {
        const body = (await request.json()) as { reason?: string };
        dismissReason = body.reason;
      } catch {
        // No body is acceptable
      }

      recommendations = recommendations.map((r) =>
        r.id === params.id
          ? {
              ...r,
              status: "dismissed" as const,
              dismissReason,
              updatedAt: new Date().toISOString(),
            }
          : r
      );

      return HttpResponse.json({
        data: recommendations.find((r) => r.id === params.id),
      });
    }
  ),

  // ── Appeals ───────────────────────────────────────────────────────────────
  http.get("/api/students/me/appeals", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let filtered = [...appeals];
    if (status) {
      filtered = filtered.filter((a) => a.status === status);
    }

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/students/me/appeals/:appealId", async ({ params }) => {
    await randomDelay();
    const appeal = appeals.find((a) => a.id === params.appealId);
    if (!appeal) return notFound("Appeal");
    return HttpResponse.json({ data: appeal });
  }),

  http.post("/api/students/me/appeals", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as {
      courseId?: string;
      assessmentId?: string;
      reason?: string;
    };
    const errors: Record<string, string[]> = {};

    if (!body.courseId) {
      errors.courseId = ["Course ID is required"];
    }
    if (!body.assessmentId) {
      errors.assessmentId = ["Assessment ID is required"];
    }
    if (!body.reason || body.reason.trim().length < 20) {
      errors.reason = [
        "Appeal reason is required and must be at least 20 characters",
      ];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Find the course for context
    const course = courses.find((c) => c.id === body.courseId);

    const now = new Date().toISOString();
    const newAppeal: Appeal = {
      id: `apl_${Date.now()}`,
      courseId: body.courseId!,
      courseName: course?.name ?? "Unknown Course",
      courseCode: course?.code ?? "N/A",
      assessmentName: "Assessment",
      assessmentType: "assignment",
      currentScore: 0,
      maxScore: 100,
      appealReason: body.reason!,
      supportingDocuments: [],
      status: "pending",
      timeline: [
        { date: now, event: "Appeal submitted", actor: "Alex Rivera" },
      ],
      createdAt: now,
      updatedAt: now,
    };

    appeals = [newAppeal, ...appeals];
    return HttpResponse.json({ data: newAppeal }, { status: 201 });
  }),

  // ── Profile ───────────────────────────────────────────────────────────────
  http.get("/api/students/me/profile", async () => {
    await randomDelay();
    return HttpResponse.json({ data: profile });
  }),

  http.patch("/api/students/me/profile", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<StudentProfile>;
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

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    // Merge updates (only allow safe fields)
    const allowedFields = [
      "name",
      "phone",
      "bio",
      "avatarUrl",
      "interests",
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

  // ── Notification Preferences ──────────────────────────────────────────────
  http.get("/api/students/me/notification-preferences", async () => {
    await randomDelay();
    return HttpResponse.json({ data: notificationPrefs });
  }),

  http.patch("/api/students/me/notification-preferences", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<NotificationPreferences>;

    const booleanFields: (keyof NotificationPreferences)[] = [
      "email",
      "push",
      "riskAlerts",
      "gradeUpdates",
      "deadlineReminders",
      "jobMatches",
      "recommendations",
    ];

    const errors: Record<string, string[]> = {};
    for (const key of Object.keys(body) as (keyof NotificationPreferences)[]) {
      if (!booleanFields.includes(key)) {
        errors[key] = [`Unknown preference: ${key}`];
      } else if (typeof body[key] !== "boolean") {
        errors[key] = [`${key} must be a boolean`];
      }
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    notificationPrefs = { ...notificationPrefs, ...body };
    return HttpResponse.json({ data: notificationPrefs });
  }),
];
