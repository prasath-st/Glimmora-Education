import { http, HttpResponse, delay } from "msw";
import type {
  CompliancePulse,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  AiModel,
  BiasReport,
  AiOverrideLog,
  ReportTemplate,
  GeneratedReport,
  InstitutionSettings,
  CreateUserRequest,
  AdminCourse,
  CreateCourseRequest,
  Semester,
  CreateSemesterRequest,
  Program,
  CreateProgramRequest,
  AcademicYear,
  CreateAcademicYearRequest,
  BulkImportUserRequest,
  CourseCatalog,
  CreateCourseCatalogRequest,
  CourseType,
  CourseOffering,
  CreateCourseOfferingRequest,
  AssignFacultyRequest,
  Section,
  Department,
} from "@/lib/api/types/admin.types";
import type { PaginationMeta, PortalRole } from "@/lib/api/types/common.types";
import {
  buildAdminDashboard,
  buildAnalytics,
  computeLiveKpis,
  generateCompliancePulse,
  generateAuditLog,
  generateUsers,
  generateAiModels,
  generateBiasReports,
  generateOverrideLog,
  generateReportTemplates,
  generateReports,
  generateSettings,
  generateSemesters,
  generateCourses,
  generatePrograms,
  generateAcademicYears,
  generateDepartments,
  generateCatalogs,
  generateSections,
} from "@/mocks/data/generators/admin.generator";

// ─── Generate data once at module level ───────────────────────────────────────

let compliancePulse: CompliancePulse = generateCompliancePulse();
let auditLog: AuditLogEntry[] = generateAuditLog(100);
let users: AdminUser[] = generateUsers(2000);
const aiModels: AiModel[] = generateAiModels();
let biasReports: BiasReport[] = generateBiasReports();
let overrideLog: AiOverrideLog[] = generateOverrideLog();
const reportTemplates: ReportTemplate[] = generateReportTemplates();
let generatedReports: GeneratedReport[] = generateReports();
let settings: InstitutionSettings = generateSettings();
let semesters: Semester[] = generateSemesters();
let programs: Program[] = generatePrograms();
let courses: AdminCourse[] = generateCourses();
let academicYears: AcademicYear[] = generateAcademicYears();
let departments: Department[] = generateDepartments();
let catalogs: CourseCatalog[] = generateCatalogs();
let sections: Section[] = generateSections(programs);

// Initially sync top-level semesters from academic years' nested semesters
semesters = [
  ...semesters,
  ...academicYears.flatMap((y) => y.semesters),
];

// ─── Course Catalog & Offering helpers ────────────────────────────────────────
// Joins a raw AdminCourse (offering) with catalog/section/programme data so
// the offerings list can render rich rows without N+1 lookups on the client.
function toOfferingView(c: AdminCourse): CourseOffering {
  const catalog = catalogs.find((cat) => cat.id === c.catalogId);
  return {
    id: c.id,
    catalogId: c.catalogId ?? catalog?.id ?? "",
    catalogCode: catalog?.code ?? c.code,
    catalogName: catalog?.name ?? c.name,
    courseType: c.courseType ?? catalog?.courseType ?? "core",
    academicYearId: c.academicYearId ?? "",
    academicYearName: c.academicYearName ?? "",
    semesterId: c.semesterId,
    semesterName: c.semesterName,
    studyYear: c.studyYear ?? 1,
    programmeId: c.programmeId ?? "",
    programmeName: c.programmeName ?? "",
    department: c.department,
    sectionId: c.sectionId ?? "",
    sectionName: c.sectionName ?? "",
    facultyId: c.facultyId || null,
    facultyName: c.facultyName || null,
    enrolledCount: c.enrolledCount,
    enrolledStudentIds: c.enrolledStudentIds,
    maxCapacity: c.maxCapacity,
    lectureHours: c.lectureHours ?? catalog?.lectureHours ?? 3,
    tutorialHours: c.tutorialHours ?? catalog?.tutorialHours ?? 0,
    practicalHours: c.practicalHours ?? catalog?.practicalHours ?? 0,
    syllabusSnapshot: c.syllabusSnapshot ?? catalog?.syllabus ?? "",
    regulationSnapshot: c.regulationSnapshot ?? catalog?.regulation ?? "",
    creditsSnapshot: c.creditsSnapshot ?? c.credits,
    status: c.status,
    createdAt: c.createdAt,
    updatedAt: c.updatedAt,
  };
}

// Live count of how many offerings reference each catalog row.
function catalogOfferingCount(catalogId: string): number {
  return courses.filter((c) => c.catalogId === catalogId).length;
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

export const adminHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  // Both Dashboard and Analytics derive from the SAME live counts + the same
  // stable KPI pool, so the two pages can never disagree on Total Enrollment,
  // Faculty-Student Ratio, Compliance Score, etc.
  http.get("/api/admin/dashboard", async () => {
    await randomDelay();
    const live = computeLiveKpis(users, courses);
    const unresolvedDeviations = compliancePulse.recentDeviations.filter(
      (d) => !d.resolvedAt,
    ).length;
    return HttpResponse.json({
      data: buildAdminDashboard(live, {
        score: compliancePulse.overallScore,
        status: compliancePulse.status,
        unresolvedDeviations,
      }),
    });
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  http.get("/api/admin/analytics", async () => {
    await randomDelay();
    const live = computeLiveKpis(users, courses);
    return HttpResponse.json({
      data: buildAnalytics(live, { score: compliancePulse.overallScore }),
    });
  }),

  // ── Compliance ────────────────────────────────────────────────────────────
  http.get("/api/admin/compliance/pulse", async () => {
    await randomDelay();
    return HttpResponse.json({ data: compliancePulse });
  }),

  http.get("/api/admin/compliance/deviations", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");
    const severity = url.searchParams.get("severity");

    let filtered = [...compliancePulse.recentDeviations];

    if (status === "resolved") {
      filtered = filtered.filter((d) => d.resolvedAt != null);
    } else if (status === "open") {
      filtered = filtered.filter((d) => d.resolvedAt == null);
    }

    if (severity && ["high", "medium", "low"].includes(severity)) {
      filtered = filtered.filter((d) => d.severity === severity);
    }

    return HttpResponse.json({ data: filtered });
  }),

  http.patch("/api/admin/compliance/deviations/:id", async ({ params, request }) => {
    await randomDelay();
    const deviationId = params.id as string;
    const body = (await request.json()) as { resolution?: string };

    const idx = compliancePulse.recentDeviations.findIndex(
      (d) => d.id === deviationId
    );
    if (idx === -1) return notFound("Deviation");

    if (!body.resolution) {
      return validationError({ resolution: ["Resolution description is required"] });
    }

    const now = new Date().toISOString();
    compliancePulse.recentDeviations[idx] = {
      ...compliancePulse.recentDeviations[idx],
      resolvedAt: now,
      resolution: body.resolution,
      assignedTo: undefined,
      updatedAt: now,
    };

    // Update compliance score
    const openCount = compliancePulse.recentDeviations.filter(
      (d) => d.resolvedAt == null
    ).length;
    compliancePulse = {
      ...compliancePulse,
      overallScore: Math.min(100, compliancePulse.overallScore + 2),
    };

    return HttpResponse.json({ data: compliancePulse.recentDeviations[idx] });
  }),

  // ── Audit Trail ───────────────────────────────────────────────────────────
  http.get("/api/admin/compliance/audit-trail", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const action = url.searchParams.get("action");
    const role = url.searchParams.get("role");
    const outcome = url.searchParams.get("outcome");

    let filtered = [...auditLog];

    if (action && action !== "all") {
      filtered = filtered.filter((e) => e.action === action);
    }
    if (role && role !== "all") {
      filtered = filtered.filter((e) => e.userRole === role);
    }
    if (outcome && (outcome === "success" || outcome === "failure")) {
      filtered = filtered.filter((e) => e.outcome === outcome);
    }
    filtered = searchFilter(filtered, search, [
      "userName",
      "action",
      "resource",
      "details",
    ] as (keyof AuditLogEntry)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Users ─────────────────────────────────────────────────────────────────
  http.get("/api/admin/users", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const role = url.searchParams.get("role");
    const status = url.searchParams.get("status");

    let filtered = [...users];

    if (role && role !== "all") {
      filtered = filtered.filter((u) => u.role === role);
    }
    if (status && ["active", "inactive", "suspended"].includes(status)) {
      filtered = filtered.filter((u) => u.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "name",
      "email",
      "department",
    ] as (keyof AdminUser)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/admin/users/:userId", async ({ params }) => {
    await randomDelay();
    const user = users.find((u) => u.id === params.userId);
    if (!user) return notFound("User");
    return HttpResponse.json({ data: user });
  }),

  http.post("/api/admin/users", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateUserRequest;
    const errors: Record<string, string[]> = {};

    if (!body.email) errors.email = ["Email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))
      errors.email = ["Invalid email format"];
    else if (users.some((u) => u.email === body.email))
      errors.email = ["A user with this email already exists"];

    if (!body.firstName) errors.firstName = ["First name is required"];
    if (!body.lastName) errors.lastName = ["Last name is required"];
    if (!body.role) errors.role = ["Role is required"];
    if (!body.department) errors.department = ["Specialization is required"];

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    // Default to sending the invitation when the flag is omitted; if false
    // the user is provisioned but invitedAt stays null until the admin
    // resends from the Users page.
    const willInvite = body.sendInvitation !== false;
    const newUser: AdminUser = {
      id: `usr_${Date.now()}`,
      email: body.email,
      name: `${body.firstName} ${body.lastName}`,
      role: body.role,
      department: body.department,
      status: "pending_invitation",
      lastLoginAt: null,
      invitedAt: willInvite ? now : null,
      avatarUrl: null,
      tenantId: "tenant_glimmora_main",
      createdAt: now,
      updatedAt: now,
      studentId: body.studentId,
      program: body.program,
      academicYearStart: body.academicYearStart,
      academicYearEnd: body.academicYearEnd,
      currentSemester: body.currentSemester,
      employeeId: body.employeeId,
      designation: body.designation,
      specialization: body.specialization,
    };

    users = [newUser, ...users];

    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  http.post("/api/admin/users/bulk", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as { users?: BulkImportUserRequest[] };

    if (!body.users || body.users.length === 0) {
      return validationError({ users: ["At least one user is required"] });
    }

    const now = new Date().toISOString();
    let invitedCount = 0;
    const newUsers: AdminUser[] = body.users.map((u) => {
      const willInvite = u.sendInvitation !== false;
      if (willInvite) invitedCount += 1;
      return {
        id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        email: u.email,
        name: `${u.firstName} ${u.lastName}`,
        role: u.role,
        department: u.department,
        status: "pending_invitation" as const,
        lastLoginAt: null,
        invitedAt: willInvite ? now : null,
        avatarUrl: null,
        tenantId: "tenant_glimmora_main",
        createdAt: now,
        updatedAt: now,
        studentId: u.studentId,
        program: u.program,
        employeeId: u.employeeId,
      };
    });

    users = [...newUsers, ...users];

    return HttpResponse.json(
      {
        data: {
          imported: newUsers.length,
          invited: invitedCount,
          errors: 0,
        },
      },
      { status: 201 },
    );
  }),

  // Resend the login-invitation email for a user that's still pending.
  // In production this would dispatch via SendGrid/SES/etc. and persist the
  // last-sent timestamp; here we simply touch invitedAt so the UI reflects it.
  http.post(
    "/api/admin/users/:userId/resend-invitation",
    async ({ params }) => {
      await randomDelay();
      const userId = params.userId as string;
      const idx = users.findIndex((u) => u.id === userId);
      if (idx === -1) return notFound("User");
      if (users[idx].status !== "pending_invitation") {
        return validationError({
          status: ["Invitation can only be resent while the user is pending"],
        });
      }
      const now = new Date().toISOString();
      users[idx] = {
        ...users[idx],
        invitedAt: now,
        updatedAt: now,
      };
      return HttpResponse.json({ data: users[idx] });
    },
  ),

  http.patch("/api/admin/users/:userId", async ({ params, request }) => {
    await randomDelay();
    const userId = params.userId as string;
    const body = (await request.json()) as Partial<
      Pick<AdminUser, "role" | "status" | "department">
    >;

    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return notFound("User");

    const now = new Date().toISOString();

    users[idx] = {
      ...users[idx],
      ...body,
      updatedAt: now,
    };

    return HttpResponse.json({ data: users[idx] });
  }),

  // ── AI Governance ─────────────────────────────────────────────────────────
  http.get("/api/admin/ai-governance/overview", async () => {
    await randomDelay();

    const activeModels = aiModels.filter((m) => m.status === "active").length;
    const avgAccuracy = aiModels.reduce((sum, m) => sum + m.accuracy, 0) / aiModels.length;
    const avgBias = aiModels.reduce((sum, m) => sum + m.biasScore, 0) / aiModels.length;
    const totalOverrides = overrideLog.length;
    const recentBiasReports = biasReports.length;

    return HttpResponse.json({
      data: {
        totalModels: aiModels.length,
        activeModels,
        avgAccuracy: Math.round(avgAccuracy * 1000) / 1000,
        avgBias: Math.round(avgBias * 1000) / 1000,
        recentOverrides: totalOverrides,
        recentBiasReports,
      },
    });
  }),

  http.get("/api/admin/ai-governance/models", async () => {
    await randomDelay();
    return HttpResponse.json({ data: aiModels });
  }),

  http.get("/api/admin/ai-governance/models/:modelId", async ({ params }) => {
    await randomDelay();
    const model = aiModels.find((m) => m.id === params.modelId);
    if (!model) return notFound("AI Model");
    return HttpResponse.json({ data: model });
  }),

  http.patch("/api/admin/ai-governance/models/:modelId", async ({ params, request }) => {
    await randomDelay();
    const id = params.modelId as string;
    const body = (await request.json()) as Partial<AiModel>;
    const idx = aiModels.findIndex((m) => m.id === id);
    if (idx === -1) return notFound("AI Model");
    aiModels[idx] = { ...aiModels[idx], ...body, id };
    return HttpResponse.json({ data: aiModels[idx] });
  }),

  http.post("/api/admin/ai-governance/models/:modelId/retrain", async ({ params }) => {
    await randomDelay();
    const id = params.modelId as string;
    const idx = aiModels.findIndex((m) => m.id === id);
    if (idx === -1) return notFound("AI Model");
    aiModels[idx] = {
      ...aiModels[idx],
      status: "training",
      lastTrainedAt: new Date().toISOString(),
    };
    // Simulate completion after 4s
    setTimeout(() => {
      const j = aiModels.findIndex((m) => m.id === id);
      if (j !== -1) {
        aiModels[j] = {
          ...aiModels[j],
          status: "active",
          accuracy: Math.min(0.999, aiModels[j].accuracy + (Math.random() * 0.02 - 0.005)),
          lastTrainedAt: new Date().toISOString(),
        };
      }
    }, 4000);
    return HttpResponse.json({ data: aiModels[idx] });
  }),

  http.get("/api/admin/ai-governance/bias-reports", async () => {
    await randomDelay();
    return HttpResponse.json({ data: biasReports });
  }),

  http.get("/api/admin/ai-governance/bias-reports/:reportId", async ({ params }) => {
    await randomDelay();
    const report = biasReports.find((r) => r.id === params.reportId);
    if (!report) return notFound("Bias Report");
    return HttpResponse.json({ data: report });
  }),

  http.patch("/api/admin/ai-governance/bias-reports/:reportId/review", async ({ params, request }) => {
    await randomDelay();
    const id = params.reportId as string;
    const body = (await request.json()) as { reviewedBy?: string };
    const idx = biasReports.findIndex((r) => r.id === id);
    if (idx === -1) return notFound("Bias Report");
    if (!body.reviewedBy) return validationError({ reviewedBy: ["Reviewer name required"] });
    biasReports[idx] = {
      ...biasReports[idx],
      reviewedBy: body.reviewedBy,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: biasReports[idx] });
  }),

  http.get("/api/admin/ai-governance/overrides", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const result = paginate(overrideLog, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Reports ───────────────────────────────────────────────────────────────
  http.get("/api/admin/reports/templates", async () => {
    await randomDelay();
    return HttpResponse.json({ data: reportTemplates });
  }),

  http.get("/api/admin/reports/generated", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const result = paginate(generatedReports, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/admin/reports/generate", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as {
      templateId?: string;
      parameters?: Record<string, string>;
    };

    if (!body.templateId) {
      return validationError({ templateId: ["Template ID is required"] });
    }

    const template = reportTemplates.find((t) => t.id === body.templateId);
    if (!template) return notFound("Report Template");

    // Validate required parameters
    const errors: Record<string, string[]> = {};
    for (const param of template.parameters) {
      if (param.required && (!body.parameters || !body.parameters[param.name])) {
        errors[param.name] = [`${param.label} is required`];
      }
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newReport: GeneratedReport = {
      id: `rpt_${Date.now()}`,
      templateId: template.id,
      templateName: template.name,
      status: "generating",
      parameters: body.parameters || {},
      generatedBy: "Current Admin User",
      createdAt: now,
      updatedAt: now,
    };

    generatedReports = [newReport, ...generatedReports];

    // Simulate report completion after a brief moment
    setTimeout(() => {
      const idx = generatedReports.findIndex((r) => r.id === newReport.id);
      if (idx !== -1) {
        generatedReports[idx] = {
          ...generatedReports[idx],
          status: "completed",
          downloadUrl: `/api/admin/reports/download/${newReport.id}`,
          fileSize: Math.floor(Math.random() * 2_000_000) + 100_000,
          updatedAt: new Date().toISOString(),
        };
      }
    }, 3000);

    return HttpResponse.json({ data: newReport }, { status: 201 });
  }),

  // ── Settings ──────────────────────────────────────────────────────────────
  http.get("/api/admin/settings", async () => {
    await randomDelay();
    return HttpResponse.json({ data: settings });
  }),

  http.patch("/api/admin/settings", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<InstitutionSettings>;

    // Deep merge settings
    settings = {
      ...settings,
      ...body,
      visibility: {
        ...settings.visibility,
        ...(body.visibility || {}),
      },
      dataRetention: {
        ...settings.dataRetention,
        ...(body.dataRetention || {}),
      },
    };

    return HttpResponse.json({ data: settings });
  }),

  // ── Courses ──────────────────────────────────────────────────────────────
  http.get("/api/admin/courses", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const department = url.searchParams.get("department");
    const semester = url.searchParams.get("semester");
    const status = url.searchParams.get("status");

    let filtered = [...courses];

    if (department) {
      filtered = filtered.filter((c) => c.department === department);
    }
    if (semester) {
      filtered = filtered.filter((c) => c.semesterId === semester);
    }
    if (status && ["draft", "active", "archived"].includes(status)) {
      filtered = filtered.filter((c) => c.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "name",
      "code",
      "facultyName",
    ] as (keyof AdminCourse)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/admin/courses", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateCourseRequest;
    const errors: Record<string, string[]> = {};

    if (!body.code) errors.code = ["Course code is required"];
    if (!body.name) errors.name = ["Course name is required"];
    if (!body.description) errors.description = ["Description is required"];
    if (!body.credits || body.credits < 1) errors.credits = ["Credits must be at least 1"];
    if (!body.department) errors.department = ["Specialization is required"];
    if (!body.semesterId) errors.semesterId = ["Semester is required"];
    if (!body.facultyId) errors.facultyId = ["Faculty is required"];
    if (!body.maxCapacity || body.maxCapacity < 1) errors.maxCapacity = ["Capacity must be at least 1"];

    if (courses.some((c) => c.code === body.code)) {
      errors.code = ["A course with this code already exists"];
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const sem = semesters.find((s) => s.id === body.semesterId);
    const now = new Date().toISOString();
    const newCourse: AdminCourse = {
      id: `crs_${Date.now()}`,
      code: body.code,
      name: body.name,
      description: body.description,
      credits: body.credits,
      department: body.department,
      semesterId: body.semesterId,
      semesterName: sem?.name ?? "Unknown",
      facultyId: body.facultyId,
      facultyName: "Assigned Faculty",
      enrolledCount: 0,
      maxCapacity: body.maxCapacity,
      status: "draft",
      createdAt: now,
      updatedAt: now,
    };

    courses = [newCourse, ...courses];

    // Update semester course count
    if (sem) {
      semesters = semesters.map((s) =>
        s.id === body.semesterId ? { ...s, courseCount: s.courseCount + 1 } : s
      );
    }

    return HttpResponse.json({ data: newCourse }, { status: 201 });
  }),

  http.get("/api/admin/courses/:id", async ({ params }) => {
    await randomDelay();
    const idx = courses.findIndex((c) => c.id === params.id);
    if (idx === -1) return notFound("Course");
    // Hydrate enrolledStudentIds on first detail fetch so roster shows seed students
    if (!courses[idx].enrolledStudentIds && courses[idx].enrolledCount > 0) {
      const matching = users
        .filter((u) => u.role === "student" && u.department === courses[idx].department)
        .slice(0, courses[idx].enrolledCount)
        .map((u) => u.id);
      courses[idx] = { ...courses[idx], enrolledStudentIds: matching };
    }
    return HttpResponse.json({ data: courses[idx] });
  }),

  http.patch("/api/admin/courses/:id", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.id as string;
    const body = (await request.json()) as Partial<AdminCourse>;

    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return notFound("Course");

    const now = new Date().toISOString();
    courses[idx] = {
      ...courses[idx],
      ...body,
      id: courseId,
      updatedAt: now,
    };

    return HttpResponse.json({ data: courses[idx] });
  }),

  http.post("/api/admin/courses/:id/enroll", async ({ params, request }) => {
    await randomDelay();
    const courseId = params.id as string;
    const body = (await request.json()) as { studentIds?: string[]; force?: boolean };

    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return notFound("Course");

    if (!body.studentIds || body.studentIds.length === 0) {
      return validationError({ studentIds: ["At least one student ID is required"] });
    }

    // Hydrate enrolledStudentIds from seed users matching course department on first enroll
    if (!courses[idx].enrolledStudentIds && courses[idx].enrolledCount > 0) {
      const matching = users
        .filter((u) => u.role === "student" && u.department === courses[idx].department)
        .slice(0, courses[idx].enrolledCount)
        .map((u) => u.id);
      courses[idx] = { ...courses[idx], enrolledStudentIds: matching };
    }

    const course = courses[idx];
    const existing = course.enrolledStudentIds ?? [];
    const dedupedNew = body.studentIds.filter((id) => !existing.includes(id));
    const newTotal = existing.length + dedupedNew.length;
    if (newTotal > course.maxCapacity) {
      return validationError({
        studentIds: [`Enrollment would exceed capacity (${course.maxCapacity}). Currently enrolled: ${existing.length}`],
      });
    }

    // Eligibility check: student must exist + (if force=false) must match course department
    const ineligible: { id: string; reason: string }[] = [];
    for (const sid of body.studentIds) {
      const student = users.find((u) => u.id === sid);
      if (!student) {
        ineligible.push({ id: sid, reason: "Student not found" });
        continue;
      }
      if (student.role !== "student") {
        ineligible.push({ id: sid, reason: `User ${student.name} is not a student` });
        continue;
      }
      if (!body.force && student.department !== course.department) {
        ineligible.push({
          id: sid,
          reason: `${student.name} is from ${student.department}, not ${course.department}`,
        });
      }
    }

    if (ineligible.length > 0) {
      return validationError({
        eligibility: ineligible.map((e) => `${e.id}: ${e.reason}`),
      });
    }

    const now = new Date().toISOString();
    const merged = [...existing, ...dedupedNew];
    courses[idx] = {
      ...courses[idx],
      enrolledCount: merged.length,
      enrolledStudentIds: merged,
      updatedAt: now,
    };

    return HttpResponse.json({
      data: {
        courseId,
        enrolledCount: merged.length,
        newStudents: dedupedNew.length,
      },
    });
  }),

  http.delete("/api/admin/courses/:id/enroll/:studentId", async ({ params }) => {
    await randomDelay();
    const courseId = params.id as string;
    const studentId = params.studentId as string;
    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return notFound("Course");
    const existing = courses[idx].enrolledStudentIds ?? [];
    if (!existing.includes(studentId)) return notFound("Enrollment");
    const updated = existing.filter((id) => id !== studentId);
    courses[idx] = {
      ...courses[idx],
      enrolledStudentIds: updated,
      enrolledCount: updated.length,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: { courseId, studentId } });
  }),

  // ── Semesters ────────────────────────────────────────────────────────────
  http.get("/api/admin/semesters", async () => {
    await randomDelay();
    // Derive courseCount live
    const withDerived = semesters.map((s) => ({
      ...s,
      courseCount: courses.filter((c) => c.semesterId === s.id).length || s.courseCount,
    }));
    return HttpResponse.json({ data: withDerived });
  }),

  http.post("/api/admin/semesters", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateSemesterRequest;
    const errors: Record<string, string[]> = {};

    if (!body.name) errors.name = ["Semester name is required"];
    if (!body.year) errors.year = ["Year is required"];
    if (!body.startDate) errors.startDate = ["Start date is required"];
    if (!body.endDate) errors.endDate = ["End date is required"];

    if (
      body.startDate &&
      body.endDate &&
      new Date(body.startDate) >= new Date(body.endDate)
    ) {
      errors.endDate = ["End date must be after start date"];
    }

    // Refuse duplicate semester name under the same academic year so the
    // calendar doesn't accumulate "Spring 2027 (1)", "Spring 2027 (2)".
    if (body.academicYearId && body.name) {
      const year = academicYears.find((y) => y.id === body.academicYearId);
      if (year?.semesters.some((s) => s.name === body.name)) {
        errors.name = [`A semester named "${body.name}" already exists in this year`];
      }
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newSemester: Semester = {
      id: `sem_${Date.now()}`,
      name: body.name,
      year: body.year,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "upcoming",
      courseCount: 0,
      academicYearId: body.academicYearId,
      createdAt: now,
      updatedAt: now,
    };

    semesters = [...semesters, newSemester];

    // Attach to the parent academic year so /academic-years reflects it
    // immediately (the page reads from the nested list).
    if (body.academicYearId) {
      academicYears = academicYears.map((y) =>
        y.id === body.academicYearId
          ? { ...y, semesters: [...y.semesters, newSemester], updatedAt: now }
          : y,
      );
    }

    return HttpResponse.json({ data: newSemester }, { status: 201 });
  }),

  http.delete("/api/admin/semesters/:id", async ({ params }) => {
    await randomDelay();
    const semId = params.id as string;
    const sem = semesters.find((s) => s.id === semId);
    if (!sem) return notFound("Semester");

    // Refuse delete when courses are attached — orphaning them would break
    // the catalog → offering link silently. Admin has to clear courses first.
    const attachedCourses = courses.filter((c) => c.semesterId === semId).length;
    if (attachedCourses > 0) {
      return validationError({
        semesterId: [
          `Cannot delete: ${attachedCourses} course${attachedCourses === 1 ? " is" : "s are"} scheduled in this semester. Archive or move them first.`,
        ],
      });
    }

    semesters = semesters.filter((s) => s.id !== semId);
    academicYears = academicYears.map((y) => ({
      ...y,
      semesters: y.semesters.filter((s) => s.id !== semId),
      updatedAt: new Date().toISOString(),
    }));

    return HttpResponse.json({ data: { id: semId } });
  }),

  http.patch("/api/admin/semesters/:id", async ({ params, request }) => {
    await randomDelay();
    const semId = params.id as string;
    const body = (await request.json()) as Partial<Semester>;

    const idx = semesters.findIndex((s) => s.id === semId);
    if (idx === -1) return notFound("Semester");

    if (body.startDate && body.endDate && new Date(body.startDate) >= new Date(body.endDate)) {
      return validationError({ endDate: ["End date must be after start date"] });
    }

    const now = new Date().toISOString();
    semesters[idx] = {
      ...semesters[idx],
      ...body,
      id: semId,
      updatedAt: now,
    };

    // Sync to nested academic year
    academicYears = academicYears.map((y) => ({
      ...y,
      semesters: y.semesters.map((s) =>
        s.id === semId ? { ...s, ...body, id: semId, updatedAt: now } : s
      ),
    }));

    return HttpResponse.json({ data: semesters[idx] });
  }),

  // ── Programs ──────────────────────────────────────────────────────────────

  http.get("/api/admin/programs", async ({ request }) => {
    await delay(200);
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const degreeType = url.searchParams.get("degreeType");
    const status = url.searchParams.get("status");

    // Derive studentCount live: prefer exact program match, fall back to department match
    const withDerivedCount = programs.map((p) => {
      const exactProgram = users.filter(
        (u) => u.role === "student" && u.program === p.name
      ).length;
      const byDept = users.filter(
        (u) => u.role === "student" && u.department === p.department
      ).length;
      return {
        ...p,
        studentCount: exactProgram > 0 ? exactProgram : byDept || p.studentCount,
      };
    });

    let filtered = withDerivedCount;
    if (search) filtered = filtered.filter((p) => p.name.toLowerCase().includes(search) || p.department.toLowerCase().includes(search));
    if (degreeType) filtered = filtered.filter((p) => p.degreeType === degreeType);
    if (status) filtered = filtered.filter((p) => p.status === status);

    return HttpResponse.json({ data: filtered });
  }),

  http.post("/api/admin/programs", async ({ request }) => {
    await delay(300);
    const body = (await request.json()) as CreateProgramRequest;
    const now = new Date().toISOString();
    const newProgram: Program = {
      id: `prog_${Date.now()}`,
      name: body.name,
      department: body.department,
      duration: body.duration,
      totalSemesters: body.totalSemesters,
      degreeType: body.degreeType,
      status: "active",
      studentCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    programs = [newProgram, ...programs];
    return HttpResponse.json({ data: newProgram }, { status: 201 });
  }),

  http.patch("/api/admin/programs/:id", async ({ params, request }) => {
    await delay(200);
    const id = params.id as string;
    const body = (await request.json()) as Partial<Program>;
    const idx = programs.findIndex((p) => p.id === id);
    if (idx === -1) return HttpResponse.json({ error: { code: "NOT_FOUND", message: "Program not found" } }, { status: 404 });
    programs[idx] = { ...programs[idx], ...body, id, updatedAt: new Date().toISOString() };
    return HttpResponse.json({ data: programs[idx] });
  }),

  // ── Academic Years ────────────────────────────────────────────────────────

  http.get("/api/admin/academic-years", async () => {
    await randomDelay();
    // Hydrate semesters from semesters list (so derived courseCount stays fresh)
    const hydrated = academicYears.map((y) => ({
      ...y,
      semesters: y.semesters.map((s) => {
        const live = semesters.find((ls) => ls.id === s.id);
        return live
          ? {
              ...live,
              courseCount: courses.filter((c) => c.semesterId === s.id).length || live.courseCount,
            }
          : s;
      }),
    }));
    return HttpResponse.json({ data: hydrated });
  }),

  http.post("/api/admin/academic-years", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateAcademicYearRequest;
    const errors: Record<string, string[]> = {};

    if (!body.name) errors.name = ["Academic year name is required"];
    if (!body.startDate) errors.startDate = ["Start date is required"];
    if (!body.endDate) errors.endDate = ["End date is required"];
    if (body.startDate && body.endDate && new Date(body.startDate) >= new Date(body.endDate)) {
      errors.endDate = ["End date must be after start date"];
    }
    if (academicYears.some((y) => y.name === body.name)) {
      errors.name = ["An academic year with this name already exists"];
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const yearId = `ay_${Date.now()}`;
    const yearStart = new Date(body.startDate);
    const yearEnd = new Date(body.endDate);
    const fallEnd = new Date(yearStart);
    fallEnd.setMonth(fallEnd.getMonth() + 4);
    const springStart = new Date(fallEnd);
    springStart.setDate(springStart.getDate() + 7);
    const yearLabel = body.name.replace(/[^0-9]/g, "").slice(0, 4);

    const fallSem: Semester = {
      id: `sem_${yearId}_fall`,
      name: `Fall ${yearLabel}`,
      year: yearLabel,
      startDate: yearStart.toISOString().split("T")[0],
      endDate: fallEnd.toISOString().split("T")[0],
      status: "upcoming",
      courseCount: 0,
      academicYearId: yearId,
      createdAt: now,
      updatedAt: now,
    };
    const springSem: Semester = {
      id: `sem_${yearId}_spring`,
      name: `Spring ${Number(yearLabel) + 1}`,
      year: String(Number(yearLabel) + 1),
      startDate: springStart.toISOString().split("T")[0],
      endDate: yearEnd.toISOString().split("T")[0],
      status: "upcoming",
      courseCount: 0,
      academicYearId: yearId,
      createdAt: now,
      updatedAt: now,
    };

    const newYear: AcademicYear = {
      id: yearId,
      name: body.name,
      startDate: body.startDate,
      endDate: body.endDate,
      status: "upcoming",
      semesters: [fallSem, springSem],
      createdAt: now,
      updatedAt: now,
    };
    academicYears = [...academicYears, newYear];
    semesters = [...semesters, fallSem, springSem];

    return HttpResponse.json({ data: newYear }, { status: 201 });
  }),

  http.patch("/api/admin/academic-years/:id", async ({ params, request }) => {
    await randomDelay();
    const yearId = params.id as string;
    const body = (await request.json()) as Partial<AcademicYear>;
    const idx = academicYears.findIndex((y) => y.id === yearId);
    if (idx === -1) return notFound("Academic Year");

    academicYears[idx] = {
      ...academicYears[idx],
      ...body,
      id: yearId,
      semesters: academicYears[idx].semesters,
      updatedAt: new Date().toISOString(),
    };
    return HttpResponse.json({ data: academicYears[idx] });
  }),

  http.delete("/api/admin/academic-years/:id", async ({ params }) => {
    await randomDelay();
    const yearId = params.id as string;
    const year = academicYears.find((y) => y.id === yearId);
    if (!year) return notFound("Academic Year");

    // Refuse if any semester under the year has attached courses. Admin
    // must clear courses first; partial cascade isn't safe here.
    const semIds = year.semesters.map((s) => s.id);
    const attachedCourses = courses.filter((c) =>
      semIds.includes(c.semesterId),
    ).length;
    if (attachedCourses > 0) {
      return validationError({
        academicYearId: [
          `Cannot delete: ${attachedCourses} course${attachedCourses === 1 ? " is" : "s are"} scheduled across this year's semesters. Archive or move them first.`,
        ],
      });
    }

    academicYears = academicYears.filter((y) => y.id !== yearId);
    semesters = semesters.filter((s) => !semIds.includes(s.id));

    return HttpResponse.json({ data: { id: yearId } });
  }),

  // ── Departments (master data for catalog ownership) ──────────────────────
  http.get("/api/admin/departments", async () => {
    await randomDelay();
    return HttpResponse.json({ data: departments });
  }),

  // ── Sections (programme cohort) ─────────────────────────────────────────
  http.get("/api/admin/sections", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const programmeId = url.searchParams.get("programmeId");
    const studyYear = url.searchParams.get("studyYear");
    let filtered = sections.filter((s) => s.status === "active");
    if (programmeId) filtered = filtered.filter((s) => s.programmeId === programmeId);
    if (studyYear) filtered = filtered.filter((s) => s.studyYear === Number(studyYear));
    return HttpResponse.json({ data: filtered });
  }),

  // ── Course Catalog (design-time master) ──────────────────────────────────
  http.get("/api/admin/course-catalog", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const departmentId = url.searchParams.get("departmentId");
    const courseType = url.searchParams.get("courseType");
    const status = url.searchParams.get("status");

    let filtered = [...catalogs];
    if (departmentId) filtered = filtered.filter((c) => c.owningDepartmentId === departmentId);
    if (courseType && ["core", "programme_elective", "open_elective"].includes(courseType)) {
      filtered = filtered.filter((c) => c.courseType === (courseType as CourseType));
    }
    if (status && ["active", "archived"].includes(status)) {
      filtered = filtered.filter((c) => c.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "name",
      "code",
      "description",
    ] as (keyof CourseCatalog)[]);

    // Hydrate live offering counts so the UI reflects current usage.
    const hydrated = filtered.map((c) => ({ ...c, offeringCount: catalogOfferingCount(c.id) }));
    const result = paginate(hydrated, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/admin/course-catalog", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateCourseCatalogRequest;
    const errors: Record<string, string[]> = {};

    if (!body.code) errors.code = ["Course code is required"];
    if (!body.name) errors.name = ["Course name is required"];
    if (!body.description) errors.description = ["Description is required"];
    if (!body.syllabus || body.syllabus.length < 20) {
      errors.syllabus = ["Syllabus must be at least 20 characters"];
    }
    if (!body.regulation) errors.regulation = ["Regulation is required (e.g. R22)"];
    if (!body.credits || body.credits < 1) errors.credits = ["Credits must be at least 1"];
    if (!["core", "programme_elective", "open_elective"].includes(body.courseType)) {
      errors.courseType = ["Pick a valid course type"];
    }
    // Composite key: (code, regulation) must be unique. Same code under a new
    // regulation is fine — that's how regulation versioning works (Issue 2,
    // Option B in the brief).
    if (
      body.code &&
      body.regulation &&
      catalogs.some((c) => c.code === body.code && c.regulation === body.regulation)
    ) {
      errors.code = [
        `Course "${body.code}" already exists under regulation ${body.regulation}. Use a new regulation or pick a different code.`,
      ];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const dept = body.owningDepartmentId
      ? departments.find((d) => d.id === body.owningDepartmentId)
      : null;
    const now = new Date().toISOString();
    const newCatalog: CourseCatalog = {
      id: `cat_${body.code.toLowerCase()}_${body.regulation.toLowerCase()}`,
      code: body.code,
      name: body.name,
      description: body.description,
      syllabus: body.syllabus,
      regulation: body.regulation,
      credits: body.credits,
      courseType: body.courseType,
      owningDepartmentId: dept?.id ?? null,
      owningDepartmentName: dept?.name ?? null,
      lectureHours: body.lectureHours ?? 3,
      tutorialHours: body.tutorialHours ?? 0,
      practicalHours: body.practicalHours ?? 0,
      status: "active",
      offeringCount: 0,
      createdAt: now,
      updatedAt: now,
    };
    catalogs = [newCatalog, ...catalogs];
    return HttpResponse.json({ data: newCatalog }, { status: 201 });
  }),

  http.get("/api/admin/course-catalog/:id", async ({ params }) => {
    await randomDelay();
    const cat = catalogs.find((c) => c.id === params.id);
    if (!cat) return notFound("Course catalog");
    return HttpResponse.json({
      data: { ...cat, offeringCount: catalogOfferingCount(cat.id) },
    });
  }),

  http.patch("/api/admin/course-catalog/:id", async ({ params, request }) => {
    await randomDelay();
    const id = params.id as string;
    const body = (await request.json()) as Partial<CourseCatalog>;
    const idx = catalogs.findIndex((c) => c.id === id);
    if (idx === -1) return notFound("Course catalog");

    // Edit-propagation rule (Issue 8 in the brief): existing offerings keep
    // their snapshot — they don't pick up the new syllabus/credits/regulation.
    // Future offerings created from this catalog will use the updated values.
    const now = new Date().toISOString();
    catalogs[idx] = {
      ...catalogs[idx],
      ...body,
      id,
      updatedAt: now,
    };
    return HttpResponse.json({ data: catalogs[idx] });
  }),

  // ── Course Offerings (run-time instances) ────────────────────────────────
  http.get("/api/admin/course-offerings", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const catalogId = url.searchParams.get("catalogId");
    const academicYearId = url.searchParams.get("academicYearId");
    const semesterId = url.searchParams.get("semesterId");
    const programmeId = url.searchParams.get("programmeId");
    const sectionId = url.searchParams.get("sectionId");
    const department = url.searchParams.get("department");
    const courseType = url.searchParams.get("courseType");
    const status = url.searchParams.get("status");

    let filtered = courses.map(toOfferingView);
    if (catalogId) filtered = filtered.filter((o) => o.catalogId === catalogId);
    if (academicYearId) filtered = filtered.filter((o) => o.academicYearId === academicYearId);
    if (semesterId) filtered = filtered.filter((o) => o.semesterId === semesterId);
    if (programmeId) filtered = filtered.filter((o) => o.programmeId === programmeId);
    if (sectionId) filtered = filtered.filter((o) => o.sectionId === sectionId);
    if (department) filtered = filtered.filter((o) => o.department === department);
    if (courseType && ["core", "programme_elective", "open_elective"].includes(courseType)) {
      filtered = filtered.filter((o) => o.courseType === courseType);
    }
    if (status && ["draft", "active", "archived"].includes(status)) {
      filtered = filtered.filter((o) => o.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "catalogCode",
      "catalogName",
      "sectionName",
      "facultyName",
    ] as (keyof CourseOffering)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/admin/course-offerings", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateCourseOfferingRequest;
    const errors: Record<string, string[]> = {};

    if (!body.catalogId) errors.catalogId = ["Pick a course from the catalog"];
    if (!body.academicYearId) errors.academicYearId = ["Select an academic year"];
    if (!body.semesterId) errors.semesterId = ["Select a semester"];
    if (!body.sectionId) errors.sectionId = ["Select a section"];
    if (!body.maxCapacity || body.maxCapacity < 1) {
      errors.maxCapacity = ["Capacity must be at least 1"];
    }

    const catalog = catalogs.find((c) => c.id === body.catalogId);
    if (body.catalogId && !catalog) {
      errors.catalogId = ["Catalog course not found"];
    }
    const section = sections.find((s) => s.id === body.sectionId);
    if (body.sectionId && !section) {
      errors.sectionId = ["Section not found"];
    }
    const ay = academicYears.find((y) => y.id === body.academicYearId);
    if (body.academicYearId && !ay) {
      errors.academicYearId = ["Academic year not found"];
    }
    const sem = semesters.find((s) => s.id === body.semesterId);
    if (body.semesterId && !sem) {
      errors.semesterId = ["Semester not found"];
    }

    // Duplicate guard: same (catalog, academicYear, semester, section) cannot
    // be offered twice — a section can't take the same course twice in one term.
    if (catalog && ay && sem && section) {
      const dupe = courses.find(
        (c) =>
          c.catalogId === catalog.id &&
          c.academicYearId === ay.id &&
          c.semesterId === sem.id &&
          c.sectionId === section.id,
      );
      if (dupe) {
        errors.sectionId = [
          `${catalog.code} is already offered to ${section.name} in ${sem.name}.`,
        ];
      }
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    if (!catalog || !ay || !sem || !section) {
      // Should never reach here after the checks above — narrow for TS.
      return validationError({ form: ["Could not resolve referenced entities"] });
    }

    const facultyUser = body.facultyId
      ? users.find((u) => u.id === body.facultyId && u.role === "faculty")
      : null;

    const now = new Date().toISOString();
    // Faculty-less offering = draft. Issue 4 in the brief surfaces this in
    // the list with a warning chip so it doesn't get forgotten.
    const offeringStatus: AdminCourse["status"] = facultyUser ? "active" : "draft";
    const newOffering: AdminCourse = {
      id: `crs_${Date.now()}`,
      code: catalog.code,
      name: catalog.name,
      description: catalog.description,
      credits: catalog.credits,
      department: section.department,
      semesterId: sem.id,
      semesterName: sem.name,
      facultyId: facultyUser?.id ?? "",
      facultyName: facultyUser?.name ?? "",
      enrolledCount: 0,
      maxCapacity: body.maxCapacity,
      status: offeringStatus,
      catalogId: catalog.id,
      academicYearId: ay.id,
      academicYearName: ay.name,
      studyYear: body.studyYear,
      programmeId: section.programmeId,
      programmeName: section.programmeName,
      sectionId: section.id,
      sectionName: section.name,
      courseType: catalog.courseType,
      lectureHours: catalog.lectureHours,
      tutorialHours: catalog.tutorialHours,
      practicalHours: catalog.practicalHours,
      // Snapshot frozen at creation — Issue 8 in the brief.
      syllabusSnapshot: catalog.syllabus,
      regulationSnapshot: catalog.regulation,
      creditsSnapshot: catalog.credits,
      createdAt: now,
      updatedAt: now,
    };

    courses = [newOffering, ...courses];

    // For core courses, auto-roster the section's existing students. For
    // electives, leave enrollment empty — students opt-in (Issue 5).
    if (catalog.courseType === "core") {
      const rosterStudents = users
        .filter(
          (u) =>
            u.role === "student" &&
            (u.department === section.department || u.program === section.programmeName),
        )
        .slice(0, Math.min(body.maxCapacity, section.studentCount))
        .map((u) => u.id);
      const updated = courses.find((c) => c.id === newOffering.id)!;
      updated.enrolledStudentIds = rosterStudents;
      updated.enrolledCount = rosterStudents.length;
    }

    return HttpResponse.json({ data: toOfferingView(newOffering) }, { status: 201 });
  }),

  http.get("/api/admin/course-offerings/:id", async ({ params }) => {
    await randomDelay();
    const idx = courses.findIndex((c) => c.id === params.id);
    if (idx === -1) return notFound("Course offering");
    // Hydrate enrolledStudentIds on first detail fetch so roster shows seed students
    if (!courses[idx].enrolledStudentIds && courses[idx].enrolledCount > 0) {
      const matching = users
        .filter((u) => u.role === "student" && u.department === courses[idx].department)
        .slice(0, courses[idx].enrolledCount)
        .map((u) => u.id);
      courses[idx] = { ...courses[idx], enrolledStudentIds: matching };
    }
    return HttpResponse.json({ data: toOfferingView(courses[idx]) });
  }),

  http.post(
    "/api/admin/course-offerings/:id/assign-faculty",
    async ({ params, request }) => {
      await randomDelay();
      const id = params.id as string;
      const body = (await request.json()) as AssignFacultyRequest;
      const idx = courses.findIndex((c) => c.id === id);
      if (idx === -1) return notFound("Course offering");

      const facultyUser = users.find(
        (u) => u.id === body.facultyId && u.role === "faculty",
      );
      if (!facultyUser) {
        return validationError({ facultyId: ["Faculty not found or not a faculty user"] });
      }

      const now = new Date().toISOString();
      courses[idx] = {
        ...courses[idx],
        facultyId: facultyUser.id,
        facultyName: facultyUser.name,
        // A draft offering becomes active once faculty is assigned.
        status: courses[idx].status === "draft" ? "active" : courses[idx].status,
        updatedAt: now,
      };
      return HttpResponse.json({ data: toOfferingView(courses[idx]) });
    },
  ),
];
