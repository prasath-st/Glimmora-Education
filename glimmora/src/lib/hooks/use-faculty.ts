"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  FacultyDashboard,
  FacultyStudentListItem,
  FacultyStudentDetail,
  FacultyCourse,
  FacultyCourseDetail,
  AiBriefing,
  FacultyProfile,
  FacultyNotificationPreferences,
  CourseModule,
  CourseMaterial,
  CreateModuleRequest,
  FacultyAssignment,
  CreateAssignmentRequest,
  StudentSubmission,
  GradeSubmissionRequest,
  GradebookEntry,
  AttendanceSession,
  CreateAttendanceSessionRequest,
} from "@/lib/api/types/faculty.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";

// === Dashboard ===
export function useFacultyDashboard() {
  return useQuery({
    queryKey: ["faculty", "dashboard"],
    queryFn: () => api.get<FacultyDashboard>("/api/faculty/me/dashboard"),
    select: (res) => res.data,
  });
}

// === Students ===
export function useFacultyStudents(params?: {
  search?: string;
  riskLevel?: string;
  page?: number;
  pageSize?: number;
}) {
  const searchParams = new URLSearchParams();
  if (params?.search) searchParams.set("search", params.search);
  if (params?.riskLevel) searchParams.set("riskLevel", params.riskLevel);
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.pageSize) searchParams.set("pageSize", String(params.pageSize));
  const qs = searchParams.toString();

  return useQuery({
    queryKey: ["faculty", "students", params],
    queryFn: () =>
      api.get<FacultyStudentListItem[]>(
        `/api/faculty/me/students${qs ? `?${qs}` : ""}`
      ),
    select: (res) => ({
      students: res.data,
      meta: res.meta as PaginationMeta,
    }),
  });
}

export function useFacultyStudentDetail(studentId: string) {
  return useQuery({
    queryKey: ["faculty", "student", studentId],
    queryFn: () =>
      api.get<FacultyStudentDetail>(`/api/faculty/me/students/${studentId}`),
    select: (res) => res.data,
    enabled: !!studentId,
  });
}

// === Courses ===
export function useFacultyCourses() {
  return useQuery({
    queryKey: ["faculty", "courses"],
    queryFn: () => api.get<FacultyCourse[]>("/api/faculty/me/courses"),
    select: (res) => res.data,
  });
}

export function useFacultyCourseDetail(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId],
    queryFn: () =>
      api.get<FacultyCourseDetail>(`/api/faculty/me/courses/${courseId}`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

// === Briefings ===
export function useBriefings() {
  return useQuery({
    queryKey: ["faculty", "briefings"],
    queryFn: () => api.get<AiBriefing[]>("/api/faculty/me/briefings"),
    select: (res) => res.data,
  });
}

export function useBriefingDetail(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "briefing", courseId],
    queryFn: () =>
      api.get<AiBriefing>(`/api/faculty/me/briefings/${courseId}`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

export function useToggleBriefingAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      courseId,
      actionIndex,
    }: {
      courseId: string;
      actionIndex: number;
    }) =>
      api.patch(
        `/api/faculty/me/briefings/${courseId}/action-items/${actionIndex}`
      ),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["faculty", "briefing", variables.courseId],
      });
      queryClient.invalidateQueries({ queryKey: ["faculty", "briefings"] });
    },
  });
}

// === Profile ===
export function useFacultyProfile() {
  return useQuery({
    queryKey: ["faculty", "profile"],
    queryFn: () => api.get<FacultyProfile>("/api/faculty/me/profile"),
    select: (res) => res.data,
  });
}

export function useUpdateFacultyProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FacultyProfile>) =>
      api.patch<FacultyProfile>("/api/faculty/me/profile", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "profile"] });
    },
  });
}

// === Notification Preferences ===
export function useFacultyNotificationPreferences() {
  return useQuery({
    queryKey: ["faculty", "notification-preferences"],
    queryFn: () => api.get<FacultyNotificationPreferences>("/api/faculty/me/notification-preferences"),
    select: (res) => res.data,
  });
}

export function useUpdateFacultyNotificationPreferences() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<FacultyNotificationPreferences>) =>
      api.patch<FacultyNotificationPreferences>("/api/faculty/me/notification-preferences", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "notification-preferences"] });
    },
  });
}

// === Course Modules (LMS) ===
export function useCourseModules(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId, "modules"],
    queryFn: () =>
      api.get<CourseModule[]>(`/api/faculty/me/courses/${courseId}/modules`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

export function useCreateModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: CreateModuleRequest) =>
      api.post<CourseModule>(`/api/faculty/me/courses/${courseId}/modules`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "modules"] });
    },
  });
}

export function useDeleteModule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId }: { courseId: string; moduleId: string }) =>
      api.delete(`/api/faculty/me/courses/${courseId}/modules/${moduleId}`),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "modules"] });
    },
  });
}

export function useUploadMaterial() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, moduleId, ...data }: { courseId: string; moduleId: string; title: string; type: string; fileName?: string }) =>
      api.post<CourseMaterial>(`/api/faculty/me/courses/${courseId}/modules/${moduleId}/materials`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "modules"] });
    },
  });
}

// === Faculty Assignments (LMS) ===
export function useFacultyAssignments(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId, "assignments"],
    queryFn: () =>
      api.get<FacultyAssignment[]>(`/api/faculty/me/courses/${courseId}/assignments`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

export function useCreateAssignment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: CreateAssignmentRequest) =>
      api.post<FacultyAssignment>(`/api/faculty/me/courses/${courseId}/assignments`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "assignments"] });
    },
  });
}

export function useAssignmentSubmissions(courseId: string, assignmentId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId, "assignment", assignmentId, "submissions"],
    queryFn: () =>
      api.get<StudentSubmission[]>(`/api/faculty/me/courses/${courseId}/assignments/${assignmentId}/submissions`),
    select: (res) => res.data,
    enabled: !!courseId && !!assignmentId,
  });
}

export function useGradeSubmission() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, submissionId, ...data }: { courseId: string; submissionId: string; score: number; feedback: string }) =>
      api.patch<StudentSubmission>(`/api/faculty/me/courses/${courseId}/submissions/${submissionId}/grade`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId] });
    },
  });
}

// === Gradebook ===
export function useCourseGradebook(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId, "gradebook"],
    queryFn: () =>
      api.get<GradebookEntry[]>(`/api/faculty/me/courses/${courseId}/gradebook`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

// === Attendance ===
export function useCourseAttendance(courseId: string) {
  return useQuery({
    queryKey: ["faculty", "course", courseId, "attendance"],
    queryFn: () =>
      api.get<AttendanceSession[]>(`/api/faculty/me/courses/${courseId}/attendance`),
    select: (res) => res.data,
    enabled: !!courseId,
  });
}

export function useCreateAttendanceSession() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, ...data }: CreateAttendanceSessionRequest) =>
      api.post<AttendanceSession>(`/api/faculty/me/courses/${courseId}/attendance`, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "attendance"] });
    },
  });
}

export function useUpdateAttendanceRecords() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, sessionId, records }: { courseId: string; sessionId: string; records: { studentId: string; status: "present" | "absent" | "late" }[] }) =>
      api.patch<AttendanceSession>(`/api/faculty/me/courses/${courseId}/attendance/${sessionId}`, { records }),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["faculty", "course", variables.courseId, "attendance"] });
    },
  });
}
