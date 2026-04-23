import { http, HttpResponse, delay } from "msw";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  RoleDefinition,
  BudgetOverview,
  AiModel,
  BiasReport,
  AiOverrideLog,
  AdminCredential,
  ReportTemplate,
  GeneratedReport,
  InstitutionSettings,
  CreateUserRequest,
  IssueCredentialRequest,
  AdminCourse,
  CreateCourseRequest,
  Semester,
  CreateSemesterRequest,
} from "@/lib/api/types/admin.types";
import type { PaginationMeta, PortalRole } from "@/lib/api/types/common.types";
import {
  generateAdminDashboard,
  generateAnalytics,
  generateCompliancePulse,
  generateAuditLog,
  generateUsers,
  generateRoles,
  generateBudgetOverview,
  generateAiModels,
  generateBiasReports,
  generateOverrideLog,
  generateCredentials,
  generateReportTemplates,
  generateReports,
  generateSettings,
  generateSemesters,
  generateCourses,
} from "@/mocks/data/generators/admin.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: AdminDashboard = generateAdminDashboard();
const analytics: InstitutionalAnalytics = generateAnalytics();
let compliancePulse: CompliancePulse = generateCompliancePulse();
let auditLog: AuditLogEntry[] = generateAuditLog(100);
let users: AdminUser[] = generateUsers(60);
let roles: RoleDefinition[] = generateRoles();
const budget: BudgetOverview = generateBudgetOverview();
const aiModels: AiModel[] = generateAiModels();
const biasReports: BiasReport[] = generateBiasReports();
let overrideLog: AiOverrideLog[] = generateOverrideLog();
let credentials: AdminCredential[] = generateCredentials(30);
const reportTemplates: ReportTemplate[] = generateReportTemplates();
let generatedReports: GeneratedReport[] = generateReports();
let settings: InstitutionSettings = generateSettings();
let semesters: Semester[] = generateSemesters();
let courses: AdminCourse[] = generateCourses();

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
  http.get("/api/admin/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Analytics ─────────────────────────────────────────────────────────────
  http.get("/api/admin/analytics", async () => {
    await randomDelay();
    return HttpResponse.json({ data: analytics });
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

    let filtered = [...auditLog];

    if (action && action !== "all") {
      filtered = filtered.filter((e) => e.action === action);
    }
    if (role && role !== "all") {
      filtered = filtered.filter((e) => e.userRole === role);
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

    if (!body.name) errors.name = ["Name is required"];
    if (!body.role) errors.role = ["Role is required"];
    if (!body.department) errors.department = ["Department is required"];

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newUser: AdminUser = {
      id: `usr_${Date.now()}`,
      email: body.email,
      name: body.name,
      role: body.role,
      department: body.department,
      status: "active",
      lastLoginAt: null,
      avatarUrl: null,
      tenantId: "tenant_glimmora_main",
      createdAt: now,
      updatedAt: now,
    };

    users = [newUser, ...users];

    // Update role user counts
    roles = roles.map((r) =>
      r.role === body.role ? { ...r, userCount: r.userCount + 1 } : r
    );

    return HttpResponse.json({ data: newUser }, { status: 201 });
  }),

  http.post("/api/admin/users/bulk", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as {
      users?: { email: string; name: string; role: string; department: string }[];
    };

    if (!body.users || body.users.length === 0) {
      return validationError({ users: ["At least one user is required"] });
    }

    const now = new Date().toISOString();
    const newUsers: AdminUser[] = body.users.map((u) => ({
      id: `usr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      email: u.email,
      name: u.name,
      role: u.role as AdminUser["role"],
      department: u.department,
      status: "active" as const,
      lastLoginAt: null,
      avatarUrl: null,
      tenantId: "tenant_glimmora_main",
      createdAt: now,
      updatedAt: now,
    }));

    users = [...newUsers, ...users];

    // Update role user counts
    for (const u of newUsers) {
      roles = roles.map((r) =>
        r.role === u.role ? { ...r, userCount: r.userCount + 1 } : r
      );
    }

    return HttpResponse.json(
      { data: { imported: newUsers.length, errors: 0 } },
      { status: 201 }
    );
  }),

  http.patch("/api/admin/users/:userId", async ({ params, request }) => {
    await randomDelay();
    const userId = params.userId as string;
    const body = (await request.json()) as Partial<
      Pick<AdminUser, "role" | "status" | "department">
    >;

    const idx = users.findIndex((u) => u.id === userId);
    if (idx === -1) return notFound("User");

    const oldRole = users[idx].role;
    const now = new Date().toISOString();

    users[idx] = {
      ...users[idx],
      ...body,
      updatedAt: now,
    };

    // Update role counts if role changed
    if (body.role && body.role !== oldRole) {
      roles = roles.map((r) => {
        if (r.role === oldRole) return { ...r, userCount: Math.max(0, r.userCount - 1) };
        if (r.role === body.role) return { ...r, userCount: r.userCount + 1 };
        return r;
      });
    }

    return HttpResponse.json({ data: users[idx] });
  }),

  // ── Roles & Permissions ───────────────────────────────────────────────────
  http.get("/api/admin/roles", async () => {
    await randomDelay();
    return HttpResponse.json({ data: roles });
  }),

  http.patch("/api/admin/roles/:role/permissions", async ({ params, request }) => {
    await randomDelay();
    const roleKey = params.role as PortalRole;
    const body = (await request.json()) as {
      module: string;
      action: string;
      allowed: boolean;
    };

    const roleIdx = roles.findIndex((r) => r.role === roleKey);
    if (roleIdx === -1) return notFound("Role");

    if (!body.module || !body.action || typeof body.allowed !== "boolean") {
      return validationError({
        permissions: ["module, action, and allowed fields are required"],
      });
    }

    const permIdx = roles[roleIdx].permissions.findIndex(
      (p) => p.module === body.module
    );
    if (permIdx === -1) return notFound("Module");

    const actionIdx = roles[roleIdx].permissions[permIdx].actions.findIndex(
      (a) => a.name === body.action
    );
    if (actionIdx === -1) return notFound("Action");

    roles[roleIdx].permissions[permIdx].actions[actionIdx].allowed =
      body.allowed;

    return HttpResponse.json({ data: roles[roleIdx] });
  }),

  // ── Budget ────────────────────────────────────────────────────────────────
  http.get("/api/admin/budget", async () => {
    await randomDelay();
    return HttpResponse.json({ data: budget });
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
        averageAccuracy: Math.round(avgAccuracy * 1000) / 1000,
        averageBiasScore: Math.round(avgBias * 1000) / 1000,
        totalOverrides,
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

  http.get("/api/admin/ai-governance/overrides", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const result = paginate(overrideLog, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Credentials ───────────────────────────────────────────────────────────
  http.get("/api/admin/credentials", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const type = url.searchParams.get("type");
    const status = url.searchParams.get("status");

    let filtered = [...credentials];

    if (type && ["degree", "certificate", "badge", "transcript"].includes(type)) {
      filtered = filtered.filter((c) => c.type === type);
    }
    if (
      status &&
      ["active", "revoked", "expired", "pending_verification"].includes(status)
    ) {
      filtered = filtered.filter((c) => c.status === status);
    }
    filtered = searchFilter(filtered, search, [
      "studentName",
      "title",
      "studentId",
    ] as (keyof AdminCredential)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/admin/credentials", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as IssueCredentialRequest;
    const errors: Record<string, string[]> = {};

    if (!body.studentId) errors.studentId = ["Student ID is required"];
    if (!body.title) errors.title = ["Title is required"];
    if (!body.type) errors.type = ["Credential type is required"];
    if (!body.description) errors.description = ["Description is required"];

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newCredential: AdminCredential = {
      id: `cred_${Date.now()}`,
      studentName: "Pending Lookup",
      studentId: body.studentId,
      title: body.title,
      type: body.type,
      status: "pending_verification",
      issuedDate: now,
      createdAt: now,
      updatedAt: now,
    };

    credentials = [newCredential, ...credentials];
    return HttpResponse.json({ data: newCredential }, { status: 201 });
  }),

  http.post("/api/admin/credentials/:id/revoke", async ({ params, request }) => {
    await randomDelay();
    const credId = params.id as string;
    const body = (await request.json()) as { reason?: string };

    const idx = credentials.findIndex((c) => c.id === credId);
    if (idx === -1) return notFound("Credential");

    if (!body.reason) {
      return validationError({ reason: ["Revocation reason is required"] });
    }

    if (credentials[idx].status === "revoked") {
      return validationError({
        status: ["Credential is already revoked"],
      });
    }

    const now = new Date().toISOString();
    credentials[idx] = {
      ...credentials[idx],
      status: "revoked",
      revokedAt: now,
      revokedReason: body.reason,
      updatedAt: now,
    };

    return HttpResponse.json({ data: credentials[idx] });
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
    if (!body.department) errors.department = ["Department is required"];
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
    const course = courses.find((c) => c.id === params.id);
    if (!course) return notFound("Course");
    return HttpResponse.json({ data: course });
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
    const body = (await request.json()) as { studentIds?: string[] };

    const idx = courses.findIndex((c) => c.id === courseId);
    if (idx === -1) return notFound("Course");

    if (!body.studentIds || body.studentIds.length === 0) {
      return validationError({ studentIds: ["At least one student ID is required"] });
    }

    const course = courses[idx];
    const newCount = course.enrolledCount + body.studentIds.length;
    if (newCount > course.maxCapacity) {
      return validationError({
        studentIds: [`Enrollment would exceed capacity (${course.maxCapacity}). Currently enrolled: ${course.enrolledCount}`],
      });
    }

    const now = new Date().toISOString();
    courses[idx] = {
      ...courses[idx],
      enrolledCount: newCount,
      updatedAt: now,
    };

    return HttpResponse.json({
      data: {
        courseId,
        enrolledCount: newCount,
        newStudents: body.studentIds.length,
      },
    });
  }),

  // ── Semesters ────────────────────────────────────────────────────────────
  http.get("/api/admin/semesters", async () => {
    await randomDelay();
    return HttpResponse.json({ data: semesters });
  }),

  http.post("/api/admin/semesters", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateSemesterRequest;
    const errors: Record<string, string[]> = {};

    if (!body.name) errors.name = ["Semester name is required"];
    if (!body.year) errors.year = ["Year is required"];
    if (!body.startDate) errors.startDate = ["Start date is required"];
    if (!body.endDate) errors.endDate = ["End date is required"];

    if (body.startDate && body.endDate && new Date(body.startDate) >= new Date(body.endDate)) {
      errors.endDate = ["End date must be after start date"];
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
      createdAt: now,
      updatedAt: now,
    };

    semesters = [...semesters, newSemester];
    return HttpResponse.json({ data: newSemester }, { status: 201 });
  }),

  http.patch("/api/admin/semesters/:id", async ({ params, request }) => {
    await randomDelay();
    const semId = params.id as string;
    const body = (await request.json()) as Partial<Semester>;

    const idx = semesters.findIndex((s) => s.id === semId);
    if (idx === -1) return notFound("Semester");

    const now = new Date().toISOString();
    semesters[idx] = {
      ...semesters[idx],
      ...body,
      id: semId,
      updatedAt: now,
    };

    return HttpResponse.json({ data: semesters[idx] });
  }),
];
