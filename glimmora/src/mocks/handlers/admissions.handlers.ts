import { http, HttpResponse, delay } from "msw";
import type {
  AdmissionsDashboard,
  AdmissionApplication,
  AdmissionStatus,
  AdmissionPredictions,
  AdmissionRecommendation,
  ReviewNote,
} from "@/lib/api/types/admissions.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";
import {
  generateAdmissionsDashboard,
  generateApplications,
  generatePredictions,
} from "@/mocks/data/generators/admissions.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: AdmissionsDashboard = generateAdmissionsDashboard();
let applications: AdmissionApplication[] = generateApplications(50);
let predictions: AdmissionPredictions = generatePredictions();

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

export const admissionsHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/admin/admissions/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Applications (list with search / filter / pagination) ─────────────────
  http.get("/api/admin/admissions/applications", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const status = url.searchParams.get("status");
    const department = url.searchParams.get("department");

    let filtered = [...applications];

    // Filter by status
    if (status && status !== "all") {
      filtered = filtered.filter((a) => a.status === (status as AdmissionStatus));
    }

    // Filter by department
    if (department && department !== "all") {
      filtered = filtered.filter((a) => a.department === department);
    }

    // Search by name, email, program
    filtered = searchFilter(filtered, search, [
      "applicantName",
      "email",
      "programApplied",
      "department",
    ] as (keyof AdmissionApplication)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Application Detail ────────────────────────────────────────────────────
  http.get("/api/admin/admissions/applications/:applicationId", async ({ params }) => {
    await randomDelay();
    const applicationId = params.applicationId as string;
    const application = applications.find((a) => a.id === applicationId);
    if (!application) return notFound("Application");
    return HttpResponse.json({ data: application });
  }),

  // ── Review Application (accept / reject / waitlist) ───────────────────────
  http.post("/api/admin/admissions/applications/:applicationId/review", async ({ params, request }) => {
    await randomDelay();
    const applicationId = params.applicationId as string;
    const body = (await request.json()) as { outcome: "accepted" | "rejected" | "waitlisted"; reason?: string };

    const idx = applications.findIndex((a) => a.id === applicationId);
    if (idx === -1) return notFound("Application");

    const errors: Record<string, string[]> = {};
    if (!body.outcome) {
      errors.outcome = ["Outcome is required"];
    } else if (!["accepted", "rejected", "waitlisted"].includes(body.outcome)) {
      errors.outcome = ["Outcome must be one of: accepted, rejected, waitlisted"];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Cannot review already finalized applications
    const finalStatuses: AdmissionStatus[] = ["accepted", "rejected", "waitlisted", "enrolled", "withdrawn"];
    if (finalStatuses.includes(applications[idx].status)) {
      return validationError({
        status: [`Application has already been ${applications[idx].status}. Cannot review again.`],
      });
    }

    const now = new Date().toISOString();
    applications[idx] = {
      ...applications[idx],
      status: body.outcome,
      decision: {
        outcome: body.outcome,
        decidedBy: "Current Admin",
        decidedAt: now,
        reason: body.reason,
      },
      updatedAt: now,
    };

    return HttpResponse.json({ data: applications[idx] });
  }),

  // ── Schedule Interview ────────────────────────────────────────────────────
  http.post("/api/admin/admissions/applications/:applicationId/schedule-interview", async ({ params, request }) => {
    await randomDelay();
    const applicationId = params.applicationId as string;
    const body = (await request.json()) as { date: string; time: string; interviewerName: string };

    const idx = applications.findIndex((a) => a.id === applicationId);
    if (idx === -1) return notFound("Application");

    const errors: Record<string, string[]> = {};
    if (!body.date) errors.date = ["Interview date is required"];
    if (!body.time) errors.time = ["Interview time is required"];
    if (!body.interviewerName) errors.interviewerName = ["Interviewer name is required"];
    if (Object.keys(errors).length > 0) return validationError(errors);

    // Cannot schedule interview for finalized applications
    const finalStatuses: AdmissionStatus[] = ["accepted", "rejected", "enrolled", "withdrawn"];
    if (finalStatuses.includes(applications[idx].status)) {
      return validationError({
        status: [`Cannot schedule interview for an application with status "${applications[idx].status}".`],
      });
    }

    const now = new Date().toISOString();
    const interviewDateTime = `${body.date}T${body.time}:00.000Z`;

    applications[idx] = {
      ...applications[idx],
      status: "interview_scheduled",
      interviewScheduled: interviewDateTime,
      updatedAt: now,
      reviewNotes: [
        ...applications[idx].reviewNotes,
        {
          id: `note_${Date.now()}`,
          author: "Current Admin",
          content: `Interview scheduled with ${body.interviewerName} on ${body.date} at ${body.time}.`,
          date: now,
          type: "interview" as const,
        },
      ],
    };

    return HttpResponse.json({ data: applications[idx] });
  }),

  // ── Add Review Note ───────────────────────────────────────────────────────
  http.post("/api/admin/admissions/applications/:applicationId/notes", async ({ params, request }) => {
    await randomDelay();
    const applicationId = params.applicationId as string;
    const body = (await request.json()) as { content: string; type: ReviewNote["type"] };

    const idx = applications.findIndex((a) => a.id === applicationId);
    if (idx === -1) return notFound("Application");

    const errors: Record<string, string[]> = {};
    if (!body.content || body.content.trim().length === 0) {
      errors.content = ["Note content is required"];
    }
    if (!body.type) {
      errors.type = ["Note type is required"];
    } else if (!["general", "academic", "interview", "decision"].includes(body.type)) {
      errors.type = ["Note type must be one of: general, academic, interview, decision"];
    }
    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newNote: ReviewNote = {
      id: `note_${Date.now()}`,
      author: "Current Admin",
      content: body.content.trim(),
      date: now,
      type: body.type,
    };

    applications[idx] = {
      ...applications[idx],
      reviewNotes: [...applications[idx].reviewNotes, newNote],
      updatedAt: now,
    };

    return HttpResponse.json({ data: newNote }, { status: 201 });
  }),

  // ── Predictions ───────────────────────────────────────────────────────────
  http.get("/api/admin/admissions/predictions", async () => {
    await randomDelay();
    return HttpResponse.json({ data: predictions });
  }),

  // ── Implement Recommendation ──────────────────────────────────────────────
  http.post("/api/admin/admissions/predictions/recommendations/:id/implement", async ({ params }) => {
    await randomDelay();
    const recId = params.id as string;
    const recIdx = predictions.recommendations.findIndex((r) => r.id === recId);
    if (recIdx === -1) return notFound("Recommendation");

    if (predictions.recommendations[recIdx].status !== "pending") {
      return validationError({
        status: [`Recommendation has already been ${predictions.recommendations[recIdx].status}.`],
      });
    }

    predictions = {
      ...predictions,
      recommendations: predictions.recommendations.map((r) =>
        r.id === recId ? { ...r, status: "implemented" as const } : r
      ),
    };

    return HttpResponse.json({ data: predictions.recommendations.find((r) => r.id === recId) });
  }),

  // ── Dismiss Recommendation ────────────────────────────────────────────────
  http.post("/api/admin/admissions/predictions/recommendations/:id/dismiss", async ({ params }) => {
    await randomDelay();
    const recId = params.id as string;
    const recIdx = predictions.recommendations.findIndex((r) => r.id === recId);
    if (recIdx === -1) return notFound("Recommendation");

    if (predictions.recommendations[recIdx].status !== "pending") {
      return validationError({
        status: [`Recommendation has already been ${predictions.recommendations[recIdx].status}.`],
      });
    }

    predictions = {
      ...predictions,
      recommendations: predictions.recommendations.map((r) =>
        r.id === recId ? { ...r, status: "dismissed" as const } : r
      ),
    };

    return HttpResponse.json({ data: predictions.recommendations.find((r) => r.id === recId) });
  }),
];
