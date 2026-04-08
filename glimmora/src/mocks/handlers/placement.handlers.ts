import { http, HttpResponse, delay } from "msw";
import type {
  PlacementDashboard,
  PlacementStudent,
  Employer,
  MatchResult,
  MatchRunConfig,
  PipelineItem,
  PlacementReport,
  PlacementSettings,
} from "@/lib/api/types/placement.types";
import type { PaginationMeta, PipelineStage, MatchStatus } from "@/lib/api/types/common.types";
import {
  generatePlacementDashboard,
  generatePlacementStudents,
  generateEmployers,
  generateMatchResults,
  generatePipeline,
  generatePlacementReport,
  generatePlacementSettings,
} from "@/mocks/data/generators/placement.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: PlacementDashboard = generatePlacementDashboard();
let students: PlacementStudent[] = generatePlacementStudents(50);
let employers: Employer[] = generateEmployers(15);
let matchResults: MatchResult[] = generateMatchResults(25);
let pipeline: PipelineItem[] = generatePipeline(30);
const report: PlacementReport = generatePlacementReport();
let settings: PlacementSettings = generatePlacementSettings();

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

export const placementHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/placement/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Students ──────────────────────────────────────────────────────────────
  http.get("/api/placement/students", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const department = url.searchParams.get("department");
    const minScore = url.searchParams.get("minScore");

    let filtered = [...students];

    if (department && department !== "all") {
      filtered = filtered.filter((s) => s.department === department);
    }

    if (minScore) {
      const min = Number(minScore);
      if (!isNaN(min)) {
        filtered = filtered.filter((s) => s.employabilityScore >= min);
      }
    }

    filtered = searchFilter(filtered, search, [
      "name",
      "studentId",
      "department",
      "program",
    ] as (keyof PlacementStudent)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Employers ─────────────────────────────────────────────────────────────
  http.get("/api/placement/employers", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const industry = url.searchParams.get("industry");

    let filtered = [...employers];

    if (industry && industry !== "all") {
      filtered = filtered.filter((e) => e.industry === industry);
    }

    filtered = searchFilter(filtered, search, [
      "name",
      "industry",
      "contactName",
    ] as (keyof Employer)[]);

    // Return employers without full job postings in list view (lighter payload)
    const lightEmployers = filtered.map(({ jobPostings, hiringHistory, ...rest }) => ({
      ...rest,
      jobPostings: [],
      hiringHistory: [],
    }));

    const result = paginate(lightEmployers as Employer[], url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.get("/api/placement/employers/:employerId", async ({ params }) => {
    await randomDelay();
    const employerId = params.employerId as string;
    const employer = employers.find((e) => e.id === employerId);
    if (!employer) return notFound("Employer");
    return HttpResponse.json({ data: employer });
  }),

  http.post("/api/placement/employers", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<Employer>;
    const errors: Record<string, string[]> = {};

    if (!body.name) errors.name = ["Company name is required"];
    if (!body.industry) errors.industry = ["Industry is required"];
    if (!body.contactEmail) errors.contactEmail = ["Contact email is required"];
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.contactEmail))
      errors.contactEmail = ["Invalid email format"];
    if (!body.contactName) errors.contactName = ["Contact name is required"];
    if (!body.description) errors.description = ["Description is required"];

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newEmployer: Employer = {
      id: `emp_${Date.now()}`,
      name: body.name!,
      industry: body.industry!,
      size: body.size || "medium",
      logo: body.logo,
      activeJobPostings: 0,
      totalHires: 0,
      engagementScore: 0,
      verificationRequests: 0,
      contactEmail: body.contactEmail!,
      contactName: body.contactName!,
      website: body.website,
      description: body.description!,
      hiringHistory: [],
      jobPostings: [],
      createdAt: now,
      updatedAt: now,
    };

    employers = [newEmployer, ...employers];
    return HttpResponse.json({ data: newEmployer }, { status: 201 });
  }),

  // ── Matching ──────────────────────────────────────────────────────────────
  http.post("/api/placement/matching/run", async ({ request }) => {
    await randomDelay();
    const config = (await request.json()) as MatchRunConfig;

    // Simulate running the matching engine — generate fresh results
    const maxResults = config.maxResults || 25;
    const newResults = generateMatchResults(maxResults);

    // Apply filters based on config
    let filtered = newResults;
    if (config.department) {
      filtered = filtered.filter((r) => r.studentDepartment === config.department);
    }

    matchResults = [...filtered, ...matchResults];

    return HttpResponse.json({
      data: {
        runId: `run_${Date.now()}`,
        resultsGenerated: filtered.length,
        timestamp: new Date().toISOString(),
        config,
      },
    }, { status: 201 });
  }),

  http.get("/api/placement/matching/results", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let filtered = [...matchResults];

    if (status && ["pending", "approved", "rejected"].includes(status)) {
      filtered = filtered.filter((m) => m.status === (status as MatchStatus));
    }

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  http.post("/api/placement/matching/:matchId/approve", async ({ params }) => {
    await randomDelay();
    const matchId = params.matchId as string;
    const idx = matchResults.findIndex((m) => m.id === matchId);
    if (idx === -1) return notFound("Match");

    if (matchResults[idx].status !== "pending") {
      return validationError({
        status: [`Match has already been ${matchResults[idx].status}`],
      });
    }

    const now = new Date().toISOString();
    matchResults[idx] = {
      ...matchResults[idx],
      status: "approved",
      reviewedBy: "Placement Officer",
      reviewedAt: now,
    };

    // Automatically create a pipeline item for the approved match
    const newPipelineItem: PipelineItem = {
      id: `pipe_${Date.now()}`,
      studentId: matchResults[idx].studentId,
      studentName: matchResults[idx].studentName,
      jobId: matchResults[idx].jobId,
      jobTitle: matchResults[idx].jobTitle,
      company: matchResults[idx].company,
      stage: "matched",
      movedToStageAt: now,
      notes: `Auto-created from approved match (score: ${matchResults[idx].matchScore})`,
      nextAction: "Send application materials",
    };
    pipeline = [newPipelineItem, ...pipeline];

    return HttpResponse.json({ data: matchResults[idx] });
  }),

  http.post("/api/placement/matching/:matchId/reject", async ({ params, request }) => {
    await randomDelay();
    const matchId = params.matchId as string;
    const idx = matchResults.findIndex((m) => m.id === matchId);
    if (idx === -1) return notFound("Match");

    if (matchResults[idx].status !== "pending") {
      return validationError({
        status: [`Match has already been ${matchResults[idx].status}`],
      });
    }

    const now = new Date().toISOString();
    matchResults[idx] = {
      ...matchResults[idx],
      status: "rejected",
      reviewedBy: "Placement Officer",
      reviewedAt: now,
    };

    return HttpResponse.json({ data: matchResults[idx] });
  }),

  // ── Pipeline ──────────────────────────────────────────────────────────────
  http.get("/api/placement/pipeline", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const stage = url.searchParams.get("stage");

    let filtered = [...pipeline];

    if (stage && ["matched", "applied", "interviewed", "offered", "placed", "rejected"].includes(stage)) {
      filtered = filtered.filter((p) => p.stage === (stage as PipelineStage));
    }

    return HttpResponse.json({ data: filtered });
  }),

  http.patch("/api/placement/pipeline/:itemId", async ({ params, request }) => {
    await randomDelay();
    const itemId = params.itemId as string;
    const body = (await request.json()) as {
      stage?: PipelineStage;
      notes?: string;
      nextAction?: string;
    };

    const idx = pipeline.findIndex((p) => p.id === itemId);
    if (idx === -1) return notFound("Pipeline item");

    const validStages: PipelineStage[] = [
      "matched", "applied", "interviewed", "offered", "placed", "rejected",
    ];

    if (body.stage && !validStages.includes(body.stage)) {
      return validationError({
        stage: [`Invalid stage. Must be one of: ${validStages.join(", ")}`],
      });
    }

    const now = new Date().toISOString();
    pipeline[idx] = {
      ...pipeline[idx],
      ...(body.stage && { stage: body.stage, movedToStageAt: now }),
      ...(body.notes !== undefined && { notes: body.notes }),
      ...(body.nextAction !== undefined && { nextAction: body.nextAction }),
    };

    return HttpResponse.json({ data: pipeline[idx] });
  }),

  // ── Reports ───────────────────────────────────────────────────────────────
  http.get("/api/placement/reports", async () => {
    await randomDelay();
    return HttpResponse.json({ data: report });
  }),

  // ── Settings ──────────────────────────────────────────────────────────────
  http.get("/api/placement/settings", async () => {
    await randomDelay();
    return HttpResponse.json({ data: settings });
  }),

  http.patch("/api/placement/settings", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<PlacementSettings>;

    // Deep merge settings
    settings = {
      ...settings,
      matchingPreferences: {
        ...settings.matchingPreferences,
        ...(body.matchingPreferences || {}),
      },
      equityParameters: {
        ...settings.equityParameters,
        ...(body.equityParameters || {}),
      },
      notifications: {
        ...settings.notifications,
        ...(body.notifications || {}),
      },
    };

    return HttpResponse.json({ data: settings });
  }),
];
