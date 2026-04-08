import { http, HttpResponse, delay } from "msw";
import type {
  ResearchDashboard,
  ResearchGrant,
  MyGrant,
  Collaborator,
  CollaborationGraph,
  ResearchPublication,
  TopicAnalytics,
  ResearchPerformance,
  ResearchProfile,
} from "@/lib/api/types/research.types";
import type { PaginationMeta, GrantStatus } from "@/lib/api/types/common.types";
import {
  generateResearchDashboard,
  generateGrants,
  generateMyGrants,
  generateCollaborators,
  generateCollaborationGraph,
  generatePublications,
  generateTopicAnalytics,
  generatePerformance,
  generateResearchProfile,
} from "@/mocks/data/generators/research.generator";

// ─── Generate data once at module level ───────────────────────────────────────

const dashboard: ResearchDashboard = generateResearchDashboard();
const grants: ResearchGrant[] = generateGrants(12);
let myGrants: MyGrant[] = generateMyGrants(6);
const collaborators: Collaborator[] = generateCollaborators(15);
const collaborationGraph: CollaborationGraph = generateCollaborationGraph();
const publications: ResearchPublication[] = generatePublications(20);
const topicAnalytics: TopicAnalytics = generateTopicAnalytics();
const performance: ResearchPerformance = generatePerformance();
let profile: ResearchProfile = generateResearchProfile();

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

export const researchHandlers = [
  // ── Dashboard ─────────────────────────────────────────────────────────────
  http.get("/api/research/me/dashboard", async () => {
    await randomDelay();
    return HttpResponse.json({ data: dashboard });
  }),

  // ── Grant Discovery ───────────────────────────────────────────────────────
  http.get("/api/research/grants/discover", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const status = url.searchParams.get("status");

    let filtered = [...grants];

    if (
      status &&
      ["discovered", "interested", "drafting", "submitted", "funded", "rejected"].includes(status)
    ) {
      filtered = filtered.filter((g) => g.status === (status as GrantStatus));
    }

    // Sort by alignment score descending
    filtered.sort((a, b) => b.alignmentScore - a.alignmentScore);

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Single Grant Detail ───────────────────────────────────────────────────
  http.get("/api/research/grants/:grantId", async ({ params }) => {
    await randomDelay();
    const grantId = params.grantId as string;
    const grant = grants.find((g) => g.id === grantId);
    if (!grant) return notFound("Grant");
    return HttpResponse.json({ data: grant });
  }),

  // ── My Grants (proposals) ────────────────────────────────────────────────
  http.get("/api/research/me/grants", async () => {
    await randomDelay();
    return HttpResponse.json({ data: myGrants });
  }),

  // ── Update My Grant Status ────────────────────────────────────────────────
  http.patch("/api/research/me/grants/:grantId", async ({ params, request }) => {
    await randomDelay();
    const grantId = params.grantId as string;
    const idx = myGrants.findIndex((g) => g.id === grantId);
    if (idx === -1) return notFound("Grant");

    const body = (await request.json()) as Partial<MyGrant>;
    const errors: Record<string, string[]> = {};

    if (body.status !== undefined) {
      const validStatuses: MyGrant["status"][] = [
        "drafting",
        "submitted",
        "under_review",
        "funded",
        "rejected",
      ];
      if (!validStatuses.includes(body.status)) {
        errors.status = [
          "Status must be one of: drafting, submitted, under_review, funded, rejected",
        ];
      }
    }

    if (body.title !== undefined && body.title.trim().length === 0) {
      errors.title = ["Title cannot be empty"];
    }

    if (Object.keys(errors).length > 0) {
      return validationError(errors);
    }

    const now = new Date().toISOString();
    const current = myGrants[idx];
    const updated: MyGrant = { ...current, updatedAt: now };

    if (body.status) {
      updated.status = body.status;
      if (body.status === "submitted" && !updated.submittedDate) {
        updated.submittedDate = now;
      }
      if (body.status === "funded" || body.status === "rejected") {
        updated.responseDate = now;
      }
    }

    if (body.title) updated.title = body.title;
    if (body.topics) updated.topics = body.topics;
    if (body.feedback !== undefined) updated.feedback = body.feedback;

    myGrants = myGrants.map((g) => (g.id === grantId ? updated : g));

    return HttpResponse.json({ data: updated });
  }),

  // ── Collaborations ────────────────────────────────────────────────────────
  http.get("/api/research/me/collaborations", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const search = url.searchParams.get("search");

    let filtered = [...collaborators];

    filtered = searchFilter(filtered, search, [
      "name",
      "institution",
      "department",
    ] as (keyof Collaborator)[]);

    // Also search in expertise arrays
    if (search) {
      const lower = search.toLowerCase();
      const searchInExpertise = collaborators.filter((c) =>
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

  // ── Collaboration Graph ───────────────────────────────────────────────────
  http.get("/api/research/me/collaborations/graph", async () => {
    await randomDelay();
    return HttpResponse.json({ data: collaborationGraph });
  }),

  // ── Publications ──────────────────────────────────────────────────────────
  http.get("/api/research/me/publications", async ({ request }) => {
    await randomDelay();
    const url = new URL(request.url);
    const type = url.searchParams.get("type");
    const search = url.searchParams.get("search");

    let filtered = [...publications];

    if (
      type &&
      ["journal", "conference", "book_chapter", "preprint"].includes(type)
    ) {
      filtered = filtered.filter(
        (p) => p.type === (type as ResearchPublication["type"])
      );
    }

    filtered = searchFilter(filtered, search, [
      "title",
      "journal",
    ] as (keyof ResearchPublication)[]);

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

    const result = paginate(filtered, url);
    return HttpResponse.json({ data: result.data, meta: result.meta });
  }),

  // ── Topic Trends ──────────────────────────────────────────────────────────
  http.get("/api/research/topics/trends", async () => {
    await randomDelay();
    return HttpResponse.json({ data: topicAnalytics });
  }),

  // ── Performance ───────────────────────────────────────────────────────────
  http.get("/api/research/me/performance", async () => {
    await randomDelay();
    return HttpResponse.json({ data: performance });
  }),

  // ── Profile (GET) ─────────────────────────────────────────────────────────
  http.get("/api/research/me/profile", async () => {
    await randomDelay();
    return HttpResponse.json({ data: profile });
  }),

  // ── Profile (PATCH) ───────────────────────────────────────────────────────
  http.patch("/api/research/me/profile", async ({ request }) => {
    await randomDelay();
    const body = (await request.json()) as Partial<ResearchProfile>;
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

    if (body.orcid !== undefined && body.orcid.trim().length > 0) {
      const orcidRe = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/;
      if (!orcidRe.test(body.orcid)) {
        errors.orcid = ["ORCID must be in format 0000-0000-0000-0000"];
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
      "researchInterests",
      "expertise",
      "orcid",
      "googleScholar",
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
