import { http, HttpResponse, delay } from "msw";
import type {
  InstitutionSummary,
  InstitutionDetail,
  MinistryDashboard,
  MinistryCompliance,
  SimulationResult,
  SimulationConfig,
  ScenarioComparison,
  MinistryReport,
  QualityIndicator,
  MinistryBudget,
  MinistrySettings,
} from "@/lib/api/types/ministry.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";
import {
  generateMinistryDashboard,
  generateInstitutions,
  generateInstitutionDetail,
  generateMinistryCompliance,
  generateSimulationResults,
  generateScenarioComparison,
  generateReports,
  generateQualityIndicators,
  generateMinistryBudget,
  generateMinistrySettings,
} from "@/mocks/data/generators/ministry.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: MinistryDashboard = generateMinistryDashboard();
const institutions: InstitutionSummary[] = generateInstitutions(45);
const compliance: MinistryCompliance = generateMinistryCompliance();
let simulations: SimulationResult[] = generateSimulationResults();
let reports: MinistryReport[] = generateReports();
const qualityIndicators: QualityIndicator[] = generateQualityIndicators();
const budget: MinistryBudget = generateMinistryBudget();
let settings: MinistrySettings = generateMinistrySettings();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paginate<T>(
  items: T[],
  url: URL,
): { data: T[]; meta: PaginationMeta } {
  const page = Math.max(1, Number(url.searchParams.get("page")) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(url.searchParams.get("pageSize")) || 20),
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
  fields: (keyof T)[],
): T[] {
  if (!search) return items;
  const lower = search.toLowerCase();
  return items.filter((item) =>
    fields.some((f) => {
      const val = item[f];
      return typeof val === "string" && val.toLowerCase().includes(lower);
    }),
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
    { status: 404 },
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
    { status: 422 },
  );
}

// ─── Handlers ─────────────────────────────────────────────────────────────────

export const ministryHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/ministry/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Institutions (list) ───────────────────────────────────────────────────
  http.get("/api/ministry/institutions", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");
    const region = url.searchParams.get("region");
    const type = url.searchParams.get("type");
    const complianceStatus = url.searchParams.get("complianceStatus");

    let filtered = [...institutions];

    if (region && region !== "all") {
      filtered = filtered.filter((i) => i.region === region);
    }
    if (type && ["university", "college", "institute"].includes(type)) {
      filtered = filtered.filter((i) => i.type === type);
    }
    if (
      complianceStatus &&
      ["compliant", "at_risk", "non_compliant"].includes(complianceStatus)
    ) {
      filtered = filtered.filter(
        (i) => i.complianceStatus === complianceStatus,
      );
    }

    filtered = searchFilter(filtered, search, [
      "name",
      "city",
      "region",
    ] as (keyof InstitutionSummary)[]);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Institution Detail ────────────────────────────────────────────────────
  http.get("/api/ministry/institutions/:institutionId", async ({ params }) => {
    await randomDelay();
    const institutionId = params.institutionId as string;
    const detail: InstitutionDetail | null =
      generateInstitutionDetail(institutionId);
    if (!detail) return notFound("Institution");
    return HttpResponse.json({ data: detail });
  }),

  // ── Compliance ────────────────────────────────────────────────────────────
  http.get("/api/ministry/compliance", async () => {
    await randomDelay();
    return HttpResponse.json({ data: compliance });
  }),

  // ── Simulation Results ────────────────────────────────────────────────────
  http.get("/api/ministry/simulation/results", async () => {
    await randomDelay();
    return HttpResponse.json({ data: simulations });
  }),

  // ── Run Simulation ────────────────────────────────────────────────────────
  http.post("/api/ministry/simulation/run", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<SimulationConfig>;
    const errors: Record<string, string[]> = {};

    if (!body.scenarioName)
      errors.scenarioName = ["Scenario name is required"];
    if (!body.type) errors.type = ["Simulation type is required"];
    if (
      body.type &&
      !["budget", "hiring", "enrollment", "policy"].includes(body.type)
    ) {
      errors.type = ["Invalid simulation type"];
    }
    if (!body.timeHorizonYears || body.timeHorizonYears < 1 || body.timeHorizonYears > 10) {
      errors.timeHorizonYears = ["Time horizon must be between 1 and 10 years"];
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newSimulation: SimulationResult = {
      id: `sim_${Date.now()}`,
      scenarioName: body.scenarioName!,
      type: body.type!,
      parameters: body.parameters || {},
      projections: Array.from(
        { length: body.timeHorizonYears || 5 },
        (_, i) => ({
          year: 2027 + i,
          metrics: {
            enrollmentGrowth: Math.round((3.0 + i * 0.6) * 10) / 10,
            graduationRate: Math.round((78 + i * 0.9) * 10) / 10,
            qualityScore: Math.round((80 + i * 1.1) * 10) / 10,
            budgetImpact: Math.round(2.5e9 * (1 + (i + 1) * 0.04)),
          },
        }),
      ),
      insights: [
        `Simulation "${body.scenarioName}" projects moderate improvements over ${body.timeHorizonYears || 5} years`,
        "Results are sensitive to implementation timeline assumptions",
        "Complementary policy measures may improve outcomes by 15-20%",
      ],
      confidence: 0.73,
      status: "running",
      createdAt: now,
      updatedAt: now,
    };

    simulations = [newSimulation, ...simulations];

    // Simulate completion after delay
    setTimeout(() => {
      const idx = simulations.findIndex((s) => s.id === newSimulation.id);
      if (idx !== -1) {
        simulations[idx] = {
          ...simulations[idx],
          status: "completed",
          updatedAt: new Date().toISOString(),
        };
      }
    }, 3000);

    return HttpResponse.json({ data: newSimulation }, { status: 201 });
  }),

  // ── Scenario Comparison ───────────────────────────────────────────────────
  http.get("/api/ministry/scenarios/compare", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const idsParam = url.searchParams.get("ids");

    if (!idsParam) {
      return validationError({
        ids: ["At least 2 scenario IDs are required for comparison"],
      });
    }

    const ids = idsParam.split(",").map((s) => s.trim()).filter(Boolean);
    if (ids.length < 2) {
      return validationError({
        ids: ["At least 2 scenario IDs are required for comparison"],
      });
    }

    const comparison: ScenarioComparison | null =
      generateScenarioComparison(ids);
    if (!comparison) {
      return notFound("One or more scenarios");
    }

    return HttpResponse.json({ data: comparison });
  }),

  // ── Reports (list) ────────────────────────────────────────────────────────
  http.get("/api/ministry/reports", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");

    let filtered = [...reports];

    if (
      type &&
      ["national", "regional", "institutional", "compliance", "budget"].includes(
        type,
      )
    ) {
      filtered = filtered.filter((r) => r.type === type);
    }

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Generate Report ───────────────────────────────────────────────────────
  http.post("/api/ministry/reports/generate", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as {
      title?: string;
      type?: MinistryReport["type"];
      parameters?: Record<string, string>;
    };

    const errors: Record<string, string[]> = {};
    if (!body.title) errors.title = ["Report title is required"];
    if (!body.type) errors.type = ["Report type is required"];
    if (
      body.type &&
      !["national", "regional", "institutional", "compliance", "budget"].includes(
        body.type,
      )
    ) {
      errors.type = ["Invalid report type"];
    }

    if (Object.keys(errors).length > 0) return validationError(errors);

    const now = new Date().toISOString();
    const newReport: MinistryReport = {
      id: `rpt_${Date.now()}`,
      title: body.title!,
      type: body.type!,
      status: "generating",
      generatedBy: "Ministry Portal User",
      parameters: body.parameters || {},
      createdAt: now,
      updatedAt: now,
    };

    reports = [newReport, ...reports];

    // Simulate report completion
    setTimeout(() => {
      const idx = reports.findIndex((r) => r.id === newReport.id);
      if (idx !== -1) {
        reports[idx] = {
          ...reports[idx],
          status: "completed",
          downloadUrl: `/api/ministry/reports/download/${newReport.id}`,
          fileSize: Math.floor(Math.random() * 4_000_000) + 500_000,
          updatedAt: new Date().toISOString(),
        };
      }
    }, 3000);

    return HttpResponse.json({ data: newReport }, { status: 201 });
  }),

  // ── Quality Indicators ────────────────────────────────────────────────────
  http.get("/api/ministry/quality-indicators", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const region = url.searchParams.get("region");
    const sort = url.searchParams.get("sort");

    let filtered = [...qualityIndicators];

    if (region && region !== "all") {
      filtered = filtered.filter((q) => q.region === region);
    }

    if (sort) {
      const sortKey = sort.replace(/^-/, "") as keyof QualityIndicator;
      const desc = sort.startsWith("-");
      filtered.sort((a, b) => {
        const aVal = a[sortKey];
        const bVal = b[sortKey];
        if (typeof aVal === "number" && typeof bVal === "number") {
          return desc ? bVal - aVal : aVal - bVal;
        }
        return 0;
      });
    }

    return HttpResponse.json({ data: filtered });
  }),

  // ── Budget ────────────────────────────────────────────────────────────────
  http.get("/api/ministry/budget", async () => {
    await randomDelay();
    return HttpResponse.json({ data: budget });
  }),

  // ── Settings ──────────────────────────────────────────────────────────────
  http.get("/api/ministry/settings", async () => {
    await randomDelay();
    return HttpResponse.json({ data: settings });
  }),

  http.patch("/api/ministry/settings", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<MinistrySettings>;

    // Deep merge settings
    settings = {
      ...settings,
      dashboardPreferences: {
        ...settings.dashboardPreferences,
        ...(body.dashboardPreferences || {}),
      },
      dataAccess: {
        ...settings.dataAccess,
        ...(body.dataAccess || {}),
      },
      notifications: {
        ...settings.notifications,
        ...(body.notifications || {}),
      },
    };

    return HttpResponse.json({ data: settings });
  }),
];
