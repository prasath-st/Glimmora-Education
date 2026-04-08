"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  StudentDashboard,
  TranscriptSemester,
  Course,
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

// === Dashboard ===
export function useStudentDashboard() {
  return useQuery({
    queryKey: ["student", "dashboard"],
    queryFn: () => api.get<StudentDashboard>("/api/students/me/dashboard"),
    select: (res) => res.data,
  });
}

// === Academics ===
export function useTranscript() {
  return useQuery({
    queryKey: ["student", "transcript"],
    queryFn: () => api.get<TranscriptSemester[]>("/api/students/me/transcript"),
    select: (res) => res.data,
  });
}

export function useCourses(params?: { status?: string; page?: number; pageSize?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.status) searchParams.set("status", params.status);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["student", "courses", params],
    queryFn: () => api.get<Course[]>(`/api/students/me/courses${qs ? `?${qs}` : ""}`),
    select: (res) => ({ courses: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["student", "course", courseId],
    queryFn: () => api.get<Course>(`/api/students/me/courses/${courseId}`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

// === Skills ===
export function useSkills() {
  return useQuery({
    queryKey: ["student", "skills"],
    queryFn: () => api.get<SkillScore[]>("/api/students/me/skills"),
    select: (res) => res.data,
  });
}

export function useSkillEvolution() {
  return useQuery({
    queryKey: ["student", "skills", "evolution"],
    queryFn: () => api.get<SkillEvolutionPoint[]>("/api/students/me/skills/evolution"),
    select: (res) => res.data,
  });
}

export function useSkillGaps() {
  return useQuery({
    queryKey: ["student", "skills", "gaps"],
    queryFn: () => api.get<SkillGap[]>("/api/students/me/skills/gaps"),
    select: (res) => res.data,
  });
}

// === Credentials ===
export function useCredentials() {
  return useQuery({
    queryKey: ["student", "credentials"],
    queryFn: () => api.get<Credential[]>("/api/students/me/credentials"),
    select: (res) => res.data,
  });
}

export function useCredentialDetail(credentialId: string) {
  return useQuery({
    queryKey: ["student", "credential", credentialId],
    queryFn: () => api.get<Credential>(`/api/students/me/credentials/${credentialId}`),
    select: (res) => res.data,
    enabled: !!credentialId,
  });
}

// === Placement ===
export function useCareerReadiness() {
  return useQuery({
    queryKey: ["student", "career-readiness"],
    queryFn: () => api.get<CareerReadiness>("/api/students/me/career-readiness"),
    select: (res) => res.data,
  });
}

export function useJobMatches(params?: { type?: string; minMatch?: number; page?: number; pageSize?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.minMatch) searchParams.set("minMatch", String(params.minMatch));
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["student", "jobs", params],
    queryFn: () => api.get<JobMatch[]>(`/api/students/me/jobs${qs ? `?${qs}` : ""}`),
    select: (res) => ({ jobs: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useJobDetail(jobId: string) {
  return useQuery({
    queryKey: ["student", "job", jobId],
    queryFn: () => api.get<JobMatch>(`/api/students/me/jobs/${jobId}`),
    select: (res) => res.data,
    enabled: !!jobId,
  });
}

export function useApplyToJob() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (jobId: string) =>
      api.post<Application>("/api/students/me/applications", { jobId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "jobs"] });
      queryClient.invalidateQueries({ queryKey: ["student", "applications"] });
      queryClient.invalidateQueries({ queryKey: ["student", "dashboard"] });
    },
  });
}

export function useApplications(params?: { page?: number; pageSize?: number }) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["student", "applications", params],
    queryFn: () => api.get<Application[]>(`/api/students/me/applications${qs ? `?${qs}` : ""}`),
    select: (res) => ({ applications: res.data, meta: res.meta as PaginationMeta }),
  });
}

// === Portfolio ===
export function usePortfolio() {
  return useQuery({
    queryKey: ["student", "portfolio"],
    queryFn: () => api.get<PortfolioItem[]>("/api/students/me/portfolio"),
    select: (res) => res.data,
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (item: Omit<PortfolioItem, "id" | "createdAt" | "updatedAt">) =>
      api.post<PortfolioItem>("/api/students/me/portfolio", item),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "portfolio"] });
    },
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (itemId: string) =>
      api.delete(`/api/students/me/portfolio/${itemId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "portfolio"] });
    },
  });
}

// === Recommendations ===
export function useRecommendations() {
  return useQuery({
    queryKey: ["student", "recommendations"],
    queryFn: () => api.get<StudentRecommendation[]>("/api/students/me/recommendations"),
    select: (res) => res.data,
  });
}

export function useApproveRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) =>
      api.post(`/api/students/me/recommendations/${id}/approve`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "recommendations"] });
    },
  });
}

export function useDismissRecommendation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      api.post(`/api/students/me/recommendations/${id}/dismiss`, { reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "recommendations"] });
    },
  });
}

// === Appeals ===
export function useAppeals() {
  return useQuery({
    queryKey: ["student", "appeals"],
    queryFn: () => api.get<Appeal[]>("/api/students/me/appeals"),
    select: (res) => res.data,
  });
}

export function useAppealDetail(appealId: string) {
  return useQuery({
    queryKey: ["student", "appeal", appealId],
    queryFn: () => api.get<Appeal>(`/api/students/me/appeals/${appealId}`),
    select: (res) => res.data,
    enabled: !!appealId,
  });
}

export function useCreateAppeal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: { courseId: string; assessmentId: string; reason: string }) =>
      api.post<Appeal>("/api/students/me/appeals", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "appeals"] });
    },
  });
}

// === Profile & Settings ===
export function useStudentProfile() {
  return useQuery({
    queryKey: ["student", "profile"],
    queryFn: () => api.get<StudentProfile>("/api/students/me/profile"),
    select: (res) => res.data,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<StudentProfile>) =>
      api.patch<StudentProfile>("/api/students/me/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "profile"] });
    },
  });
}

export function useNotificationPreferences() {
  return useQuery({
    queryKey: ["student", "notification-preferences"],
    queryFn: () => api.get<NotificationPreferences>("/api/students/me/notification-preferences"),
    select: (res) => res.data,
  });
}

export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<NotificationPreferences>) =>
      api.patch<NotificationPreferences>("/api/students/me/notification-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["student", "notification-preferences"] });
    },
  });
}
