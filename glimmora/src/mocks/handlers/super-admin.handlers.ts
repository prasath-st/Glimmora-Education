import { http, HttpResponse, delay } from "msw";
import type {
  University,
  Ministry,
  CreateUniversityRequest,
  CreateMinistryRequest,
  PlatformMonitoring,
  PlatformAuditEntry,
  PlatformSettings,
} from "@/lib/api/types/super-admin.types";
import {
  generateSuperAdminDashboard,
  generateUniversities,
  generateMinistries,
  generatePlatformMonitoring,
  generatePlatformAuditLog,
  generatePlatformSettings,
} from "@/mocks/data/generators/super-admin.generator";
import { faker } from "@faker-js/faker";

const randomDelay = () => delay(faker.number.int({ min: 200, max: 600 }));

const dashboard = generateSuperAdminDashboard();
const universities: University[] = generateUniversities();
const ministries: Ministry[] = generateMinistries();
const monitoring: PlatformMonitoring = generatePlatformMonitoring();
const auditLog: PlatformAuditEntry[] = generatePlatformAuditLog();
let platformSettings: PlatformSettings = generatePlatformSettings();

export const superAdminHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────
  http.get("/api/super-admin/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Universities ──────────────────────────────────────────────────────
  http.get("/api/super-admin/universities", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    let filtered = [...universities];
    if (search) {
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(search) ||
          u.city.toLowerCase().includes(search) ||
          u.adminEmail.toLowerCase().includes(search)
      );
    }
    if (status && status !== "all") {
      filtered = filtered.filter((u) => u.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),

  http.get("/api/super-admin/universities/:id", async ({ params }) => {
    await randomDelay();
    const university = universities.find((u) => u.id === params.id);
    if (!university) {
      return new HttpResponse(null, { status: 404 });
    }
    return HttpResponse.json({ data: university });
  }),

  http.post("/api/super-admin/universities", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateUniversityRequest;
    const newUniversity: University = {
      id: `univ_${String(universities.length + 1).padStart(2, "0")}`,
      ...body,
      status: "active",
      userCount: 1,
      studentCount: 0,
      facultyCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    universities.push(newUniversity);
    return HttpResponse.json({ data: newUniversity }, { status: 201 });
  }),

  http.patch("/api/super-admin/universities/:id", async ({ params, request }) => {
    await randomDelay();
    const university = universities.find((u) => u.id === params.id);
    if (!university) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as Partial<University>;
    Object.assign(university, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json({ data: university });
  }),

  // ── Ministries ────────────────────────────────────────────────────────
  http.get("/api/super-admin/ministries", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const status = url.searchParams.get("status");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    let filtered = [...ministries];
    if (search) {
      filtered = filtered.filter(
        (m) =>
          m.name.toLowerCase().includes(search) ||
          m.contactName.toLowerCase().includes(search)
      );
    }
    if (status && status !== "all") {
      filtered = filtered.filter((m) => m.status === status);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),

  http.get("/api/super-admin/ministries/:id", async ({ params }) => {
    await randomDelay();
    const ministry = ministries.find((m) => m.id === params.id);
    if (!ministry) {
      return new HttpResponse(null, { status: 404 });
    }
    // Include linked university details
    const linkedUniversities = universities.filter((u) =>
      ministry.linkedUniversityIds.includes(u.id)
    );
    return HttpResponse.json({
      data: { ...ministry, linkedUniversities },
    });
  }),

  http.post("/api/super-admin/ministries", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as CreateMinistryRequest;
    const newMinistry: Ministry = {
      id: `ministry_${String(ministries.length + 1).padStart(2, "0")}`,
      ...body,
      status: "active",
      linkedUniversityIds: [],
      linkedUniversityCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    ministries.push(newMinistry);
    return HttpResponse.json({ data: newMinistry }, { status: 201 });
  }),

  http.patch("/api/super-admin/ministries/:id", async ({ params, request }) => {
    await randomDelay();
    const ministry = ministries.find((m) => m.id === params.id);
    if (!ministry) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as Partial<Ministry>;
    Object.assign(ministry, body, { updatedAt: new Date().toISOString() });
    return HttpResponse.json({ data: ministry });
  }),

  http.patch("/api/super-admin/ministries/:id/link", async ({ params, request }) => {
    await randomDelay();
    const ministry = ministries.find((m) => m.id === params.id);
    if (!ministry) {
      return new HttpResponse(null, { status: 404 });
    }
    const body = (await request.json()) as { universityId: string; action: "link" | "unlink" };
    if (body.action === "link") {
      if (!ministry.linkedUniversityIds.includes(body.universityId)) {
        ministry.linkedUniversityIds.push(body.universityId);
        ministry.linkedUniversityCount = ministry.linkedUniversityIds.length;
      }
    } else {
      ministry.linkedUniversityIds = ministry.linkedUniversityIds.filter(
        (id) => id !== body.universityId
      );
      ministry.linkedUniversityCount = ministry.linkedUniversityIds.length;
    }
    ministry.updatedAt = new Date().toISOString();
    return HttpResponse.json({ data: ministry });
  }),

  // ── Monitoring ───────────────────────────────────────────────────────
  http.get("/api/super-admin/monitoring", async () => {
    await randomDelay();
    return HttpResponse.json({ data: monitoring });
  }),

  // ── Audit Log ────────────────────────────────────────────────────────
  http.get("/api/super-admin/audit-log", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search")?.toLowerCase();
    const action = url.searchParams.get("action");
    const page = Number(url.searchParams.get("page") || "1");
    const pageSize = Number(url.searchParams.get("pageSize") || "20");

    let filtered = [...auditLog];
    if (search) {
      filtered = filtered.filter(
        (e) =>
          e.actorName.toLowerCase().includes(search) ||
          e.target.toLowerCase().includes(search) ||
          e.details.toLowerCase().includes(search)
      );
    }
    if (action && action !== "all") {
      filtered = filtered.filter((e) => e.action === action);
    }

    const total = filtered.length;
    const start = (page - 1) * pageSize;
    const paginated = filtered.slice(start, start + pageSize);

    return HttpResponse.json({
      data: paginated,
      meta: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  }),

  // ── Settings ─────────────────────────────────────────────────────────
  http.get("/api/super-admin/settings", async () => {
    await randomDelay();
    return HttpResponse.json({ data: platformSettings });
  }),

  http.patch("/api/super-admin/settings", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<PlatformSettings>;
    platformSettings = { ...platformSettings, ...body };
    return HttpResponse.json({ data: platformSettings });
  }),
];
