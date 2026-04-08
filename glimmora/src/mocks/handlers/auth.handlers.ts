import { http, HttpResponse, delay } from "msw";
import type { LoginRequest, LoginResponse } from "@/lib/api/types/auth.types";

const MOCK_USERS = [
  {
    id: "usr_student_01",
    email: "student@glimmora.dev",
    password: "glimmora123",
    name: "Alex Rivera",
    role: "student" as const,
    department: "Computer Science",
    avatarUrl: null,
    tenantId: "tenant_univ_01",
    lastLoginAt: null,
  },
  {
    id: "usr_faculty_01",
    email: "faculty@glimmora.dev",
    password: "glimmora123",
    name: "Dr. Sarah Chen",
    role: "faculty" as const,
    department: "Computer Science",
    avatarUrl: null,
    tenantId: "tenant_univ_01",
    lastLoginAt: null,
  },
  {
    id: "usr_admin_01",
    email: "admin@glimmora.dev",
    password: "glimmora123",
    name: "James Mitchell",
    role: "admin" as const,
    department: "Administration",
    avatarUrl: null,
    tenantId: "tenant_univ_01",
    lastLoginAt: null,
  },
  {
    id: "usr_research_01",
    email: "research@glimmora.dev",
    password: "glimmora123",
    name: "Dr. Priya Patel",
    role: "research" as const,
    department: "Biomedical Engineering",
    avatarUrl: null,
    tenantId: "tenant_univ_01",
    lastLoginAt: null,
  },
  {
    id: "usr_placement_01",
    email: "placement@glimmora.dev",
    password: "glimmora123",
    name: "Maria Santos",
    role: "placement" as const,
    department: "Career Services",
    avatarUrl: null,
    tenantId: "tenant_univ_01",
    lastLoginAt: null,
  },
  {
    id: "usr_ministry_01",
    email: "ministry@glimmora.dev",
    password: "glimmora123",
    name: "Robert Okafor",
    role: "ministry" as const,
    department: "Ministry of Education",
    avatarUrl: null,
    tenantId: "tenant_ministry_01",
    lastLoginAt: null,
  },
];

let activeSessions: Map<string, (typeof MOCK_USERS)[number]> = new Map();

export const authHandlers = [
  http.post("/api/auth/login", async ({ request }) => {
    await delay(400);

    const body = (await request.json()) as LoginRequest;

    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Email and password are required",
            details: {
              email: !body.email ? ["Email is required"] : [],
              password: !body.password ? ["Password is required"] : [],
            },
          },
        },
        { status: 422 }
      );
    }

    const user = MOCK_USERS.find(
      (u) => u.email === body.email && u.password === body.password
    );

    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Invalid email or password",
          },
        },
        { status: 401 }
      );
    }

    const accessToken = `mock_access_${user.id}_${Date.now()}`;
    const refreshToken = `mock_refresh_${user.id}_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    activeSessions.set(accessToken, user);

    const { password: _, ...userWithoutPassword } = user;
    const now = new Date().toISOString();

    const response: LoginResponse = {
      user: {
        ...userWithoutPassword,
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: now,
        lastLoginAt: now,
      },
      accessToken,
      refreshToken,
      expiresAt,
    };

    return HttpResponse.json({ data: response });
  }),

  http.post("/api/auth/logout", async ({ request }) => {
    await delay(200);

    const authHeader = request.headers.get("Authorization");
    if (authHeader) {
      const token = authHeader.replace("Bearer ", "");
      activeSessions.delete(token);
    }

    return HttpResponse.json({ data: { success: true } });
  }),

  http.get("/api/auth/me", async ({ request }) => {
    await delay(200);

    const authHeader = request.headers.get("Authorization");
    if (!authHeader) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "No token provided" } },
        { status: 401 }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const user = activeSessions.get(token);

    if (!user) {
      return HttpResponse.json(
        { error: { code: "UNAUTHORIZED", message: "Invalid or expired token" } },
        { status: 401 }
      );
    }

    const { password: _, ...userWithoutPassword } = user;
    return HttpResponse.json({
      data: {
        ...userWithoutPassword,
        createdAt: "2024-01-15T00:00:00.000Z",
        updatedAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(),
      },
    });
  }),

  http.post("/api/auth/refresh", async () => {
    await delay(200);

    const newAccessToken = `mock_access_refreshed_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    return HttpResponse.json({
      data: { accessToken: newAccessToken, expiresAt },
    });
  }),

  http.post("/api/auth/forgot-password", async ({ request }) => {
    await delay(600);

    const body = (await request.json()) as { email: string };

    if (!body.email) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Email is required",
            details: { email: ["Email is required"] },
          },
        },
        { status: 422 }
      );
    }

    return HttpResponse.json({
      data: {
        message:
          "If an account exists with this email, you will receive a password reset link.",
      },
    });
  }),

  http.post("/api/auth/reset-password", async ({ request }) => {
    await delay(600);

    const body = (await request.json()) as {
      token: string;
      password: string;
      confirmPassword: string;
    };

    if (!body.token || !body.password) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Token and password are required",
          },
        },
        { status: 422 }
      );
    }

    if (body.password.length < 8) {
      return HttpResponse.json(
        {
          error: {
            code: "VALIDATION_ERROR",
            message: "Password must be at least 8 characters",
            details: {
              password: ["Password must be at least 8 characters"],
            },
          },
        },
        { status: 422 }
      );
    }

    return HttpResponse.json({
      data: { message: "Password has been reset successfully." },
    });
  }),
];
