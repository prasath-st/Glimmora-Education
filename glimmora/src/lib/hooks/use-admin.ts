"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api/client";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  CreateUserRequest,
  AiModel,
  BiasReport,
  AiOverrideLog,
  ReportTemplate,
  GeneratedReport,
  InstitutionSettings,
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
  CourseOffering,
  CreateCourseOfferingRequest,
  AssignFacultyRequest,
  Section,
  Department,
} from "@/lib/api/types/admin.types";
import type { PaginationMeta } from "@/lib/api/types/common.types";

// === Dashboard ===
export function useAdminDashboard() {
  return useQuery({
    queryKey: ["admin", "dashboard"],
    queryFn: () => api.get<AdminDashboard>("/api/admin/dashboard"),
    select: (res) => res.data,
  });
}

// === Analytics ===
export function useAnalytics() {
  return useQuery({
    queryKey: ["admin", "analytics"],
    queryFn: () => api.get<InstitutionalAnalytics>("/api/admin/analytics"),
    select: (res) => res.data,
  });
}

// === Compliance ===
export function useCompliancePulse() {
  return useQuery({
    queryKey: ["admin", "compliance", "pulse"],
    queryFn: () => api.get<CompliancePulse>("/api/admin/compliance/pulse"),
    select: (res) => res.data,
  });
}

export function useComplianceDeviations(params?: { status?: string; severity?: string }) {
  const sp = new URLSearchParams();
  if (params?.status) sp.set("status", params.status);
  if (params?.severity) sp.set("severity", params.severity);
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "compliance", "deviations", params],
    queryFn: () => api.get<ComplianceDeviation[]>(`/api/admin/compliance/deviations${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

export function useResolveDeviation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resolution }: { id: string; resolution: string }) =>
      api.patch(`/api/admin/compliance/deviations/${id}`, { resolution }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "compliance"] });
    },
  });
}

// === Audit Trail ===
export function useAuditTrail(params?: {
  search?: string;
  action?: string;
  role?: string;
  outcome?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.action) sp.set("action", params.action);
  if (params?.role) sp.set("role", params.role);
  if (params?.outcome) sp.set("outcome", params.outcome);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "audit-trail", params],
    queryFn: () => api.get<AuditLogEntry[]>(`/api/admin/compliance/audit-trail${qs ? `?${qs}` : ""}`),
    select: (res) => ({ entries: res.data, meta: res.meta as PaginationMeta }),
  });
}

// === Users ===
export function useAdminUsers(params?: {
  search?: string;
  role?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.role) sp.set("role", params.role);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "users", params],
    queryFn: () => api.get<AdminUser[]>(`/api/admin/users${qs ? `?${qs}` : ""}`),
    select: (res) => ({ users: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useAdminUserDetail(userId: string) {
  return useQuery({
    queryKey: ["admin", "user", userId],
    queryFn: () => api.get<AdminUser>(`/api/admin/users/${userId}`),
    select: (res) => res.data,
    enabled: !!userId,
  });
}

export function useCreateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateUserRequest) => api.post<AdminUser>("/api/admin/users", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useBulkImportUsers() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { users: BulkImportUserRequest[] }) =>
      api.post<{ imported: number; invited: number; errors: number }>(
        "/api/admin/users/bulk",
        data,
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

export function useUpdateUser() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdminUser>) =>
      api.patch<AdminUser>(`/api/admin/users/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}

// Resend the login-invitation email for a user that's still pending.
// Used by the Users-page 3-dot row action.
export function useResendInvitation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: string) =>
      api.post<AdminUser>(`/api/admin/users/${userId}/resend-invitation`, {}),
    onSuccess: (_, userId) => {
      qc.invalidateQueries({ queryKey: ["admin", "user", userId] });
      qc.invalidateQueries({ queryKey: ["admin", "users"] });
    },
  });
}


// === AI Governance ===
export function useAiGovernanceOverview() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "overview"],
    queryFn: () =>
      api.get<{ totalModels: number; activeModels: number; avgAccuracy: number; avgBias: number; recentOverrides: number }>(
        "/api/admin/ai-governance/overview"
      ),
    select: (res) => res.data,
  });
}

export function useAiModels() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "models"],
    queryFn: () => api.get<AiModel[]>("/api/admin/ai-governance/models"),
    select: (res) => res.data,
  });
}

export function useAiModelDetail(modelId: string) {
  return useQuery({
    queryKey: ["admin", "ai-governance", "model", modelId],
    queryFn: () => api.get<AiModel>(`/api/admin/ai-governance/models/${modelId}`),
    select: (res) => res.data,
    enabled: !!modelId,
  });
}

export function useUpdateAiModel() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AiModel>) =>
      api.patch<AiModel>(`/api/admin/ai-governance/models/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "model", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "models"] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "overview"] });
    },
  });
}

export function useTriggerRetrain() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (modelId: string) =>
      api.post<AiModel>(`/api/admin/ai-governance/models/${modelId}/retrain`, {}),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "models"] });
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "overview"] });
    },
  });
}

export function useBiasReports() {
  return useQuery({
    queryKey: ["admin", "ai-governance", "bias-reports"],
    queryFn: () => api.get<BiasReport[]>("/api/admin/ai-governance/bias-reports"),
    select: (res) => res.data,
  });
}

export function useReviewBiasReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reviewedBy }: { id: string; reviewedBy: string }) =>
      api.patch<BiasReport>(`/api/admin/ai-governance/bias-reports/${id}/review`, { reviewedBy }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "ai-governance", "bias-reports"] });
    },
  });
}

export function useBiasReportDetail(reportId: string) {
  return useQuery({
    queryKey: ["admin", "ai-governance", "bias-report", reportId],
    queryFn: () => api.get<BiasReport>(`/api/admin/ai-governance/bias-reports/${reportId}`),
    select: (res) => res.data,
    enabled: !!reportId,
  });
}

export function useOverrideLog(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "ai-governance", "overrides", params],
    queryFn: () => api.get<AiOverrideLog[]>(`/api/admin/ai-governance/overrides${qs ? `?${qs}` : ""}`),
    select: (res) => ({ overrides: res.data, meta: res.meta as PaginationMeta }),
  });
}

// === Reports ===
export function useReportTemplates() {
  return useQuery({
    queryKey: ["admin", "reports", "templates"],
    queryFn: () => api.get<ReportTemplate[]>("/api/admin/reports/templates"),
    select: (res) => res.data,
  });
}

export function useGeneratedReports(params?: { page?: number; pageSize?: number }) {
  const sp = new URLSearchParams();
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "reports", "generated", params],
    queryFn: () => api.get<GeneratedReport[]>(`/api/admin/reports/generated${qs ? `?${qs}` : ""}`),
    select: (res) => ({ reports: res.data, meta: res.meta as PaginationMeta }),
    refetchInterval: (query) => {
      const data = query.state.data?.data as GeneratedReport[] | undefined;
      const anyPending = data?.some((r) => r.status === "generating");
      return anyPending ? 2000 : false;
    },
  });
}

export function useGenerateReport() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { templateId: string; parameters: Record<string, string> }) =>
      api.post<GeneratedReport>("/api/admin/reports/generate", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "reports", "generated"] });
    },
  });
}

// === Settings ===
export function useInstitutionSettings() {
  return useQuery({
    queryKey: ["admin", "settings"],
    queryFn: () => api.get<InstitutionSettings>("/api/admin/settings"),
    select: (res) => res.data,
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<InstitutionSettings>) =>
      api.patch<InstitutionSettings>("/api/admin/settings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "settings"] });
    },
  });
}

// === Courses ===
export function useAdminCourses(params?: {
  search?: string;
  department?: string;
  semester?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.department) sp.set("department", params.department);
  if (params?.semester) sp.set("semester", params.semester);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "courses", params],
    queryFn: () => api.get<AdminCourse[]>(`/api/admin/courses${qs ? `?${qs}` : ""}`),
    select: (res) => ({ courses: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useAdminCourseDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course", id],
    queryFn: () => api.get<AdminCourse>(`/api/admin/courses/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

// Returns the CourseOffering view (joined with catalog/section/programme) for a
// single offering. Use this in offering-centric UIs that need fields like
// `catalogCode`, `catalogName`, `programmeName` etc. — the bare /courses/:id
// endpoint returns AdminCourse without those joined fields.
export function useOfferingDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course-offering", id],
    queryFn: () => api.get<CourseOffering>(`/api/admin/course-offerings/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseRequest) =>
      api.post<AdminCourse>("/api/admin/courses", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateCourse() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AdminCourse>) =>
      api.patch<AdminCourse>(`/api/admin/courses/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.id] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });
}

export function useEnrollStudents() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentIds }: { courseId: string; studentIds: string[] }) =>
      api.post(`/api/admin/courses/${courseId}/enroll`, { studentIds }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.courseId] });
    },
  });
}

export function useUnenrollStudent() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ courseId, studentId }: { courseId: string; studentId: string }) =>
      api.delete(`/api/admin/courses/${courseId}/enroll/${studentId}`),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course", vars.courseId] });
    },
  });
}

// === Semesters ===
export function useSemesters() {
  return useQuery({
    queryKey: ["admin", "semesters"],
    queryFn: () => api.get<Semester[]>("/api/admin/semesters"),
    select: (res) => res.data,
  });
}

export function useCreateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSemesterRequest) =>
      api.post<Semester>("/api/admin/semesters", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Semester>) =>
      api.patch<Semester>(`/api/admin/semesters/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

// === Programs & Degrees ===

export function usePrograms(params?: { search?: string; degreeType?: string; status?: string }) {
  return useQuery({
    queryKey: ["admin", "programs", params],
    queryFn: () => {
      const sp = new URLSearchParams();
      if (params?.search) sp.set("search", params.search);
      if (params?.degreeType) sp.set("degreeType", params.degreeType);
      if (params?.status) sp.set("status", params.status);
      const qs = sp.toString();
      return api.get<Program[]>(`/api/admin/programs${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useCreateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateProgramRequest) =>
      api.post<Program>("/api/admin/programs", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

export function useUpdateProgram() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Program>) =>
      api.patch<Program>(`/api/admin/programs/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "programs"] });
    },
  });
}

// === Academic Years ===

export function useAcademicYears() {
  return useQuery({
    queryKey: ["admin", "academic-years"],
    queryFn: () => api.get<AcademicYear[]>("/api/admin/academic-years"),
    select: (res) => res.data,
  });
}

export function useCreateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateAcademicYearRequest) =>
      api.post<AcademicYear>("/api/admin/academic-years", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

export function useUpdateAcademicYear() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<AcademicYear>) =>
      api.patch<AcademicYear>(`/api/admin/academic-years/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
    },
  });
}

export function useUpdateNestedSemester() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<Semester>) =>
      api.patch<Semester>(`/api/admin/semesters/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "academic-years"] });
      qc.invalidateQueries({ queryKey: ["admin", "semesters"] });
    },
  });
}

// === Departments (master data) ===
export function useDepartments() {
  return useQuery({
    queryKey: ["admin", "departments"],
    queryFn: () => api.get<Department[]>("/api/admin/departments"),
    select: (res) => res.data,
  });
}

// === Sections (programme cohort) ===
export function useSections(params?: { programmeId?: string; studyYear?: number }) {
  const sp = new URLSearchParams();
  if (params?.programmeId) sp.set("programmeId", params.programmeId);
  if (params?.studyYear) sp.set("studyYear", String(params.studyYear));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "sections", params],
    queryFn: () => api.get<Section[]>(`/api/admin/sections${qs ? `?${qs}` : ""}`),
    select: (res) => res.data,
  });
}

// === Course Catalog ===
export function useCourseCatalog(params?: {
  search?: string;
  departmentId?: string;
  courseType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.departmentId) sp.set("departmentId", params.departmentId);
  if (params?.courseType) sp.set("courseType", params.courseType);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "course-catalog", params],
    queryFn: () =>
      api.get<CourseCatalog[]>(`/api/admin/course-catalog${qs ? `?${qs}` : ""}`),
    select: (res) => ({ catalog: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useCatalogDetail(id: string) {
  return useQuery({
    queryKey: ["admin", "course-catalog", "detail", id],
    queryFn: () => api.get<CourseCatalog>(`/api/admin/course-catalog/${id}`),
    select: (res) => res.data,
    enabled: !!id,
  });
}

export function useCreateCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseCatalogRequest) =>
      api.post<CourseCatalog>("/api/admin/course-catalog", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
    },
  });
}

export function useUpdateCatalog() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...data }: { id: string } & Partial<CourseCatalog>) =>
      api.patch<CourseCatalog>(`/api/admin/course-catalog/${id}`, data),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
      qc.invalidateQueries({
        queryKey: ["admin", "course-catalog", "detail", vars.id],
      });
    },
  });
}

// === Course Offerings ===
export function useCourseOfferings(params?: {
  search?: string;
  catalogId?: string;
  academicYearId?: string;
  semesterId?: string;
  programmeId?: string;
  sectionId?: string;
  department?: string;
  courseType?: string;
  status?: string;
  page?: number;
  pageSize?: number;
}) {
  const sp = new URLSearchParams();
  if (params?.search) sp.set("search", params.search);
  if (params?.catalogId) sp.set("catalogId", params.catalogId);
  if (params?.academicYearId) sp.set("academicYearId", params.academicYearId);
  if (params?.semesterId) sp.set("semesterId", params.semesterId);
  if (params?.programmeId) sp.set("programmeId", params.programmeId);
  if (params?.sectionId) sp.set("sectionId", params.sectionId);
  if (params?.department) sp.set("department", params.department);
  if (params?.courseType) sp.set("courseType", params.courseType);
  if (params?.status) sp.set("status", params.status);
  if (params?.page) sp.set("page", String(params.page));
  if (params?.pageSize) sp.set("pageSize", String(params.pageSize));
  const qs = sp.toString();
  return useQuery({
    queryKey: ["admin", "course-offerings", params],
    queryFn: () =>
      api.get<CourseOffering[]>(`/api/admin/course-offerings${qs ? `?${qs}` : ""}`),
    select: (res) => ({ offerings: res.data, meta: res.meta as PaginationMeta }),
  });
}

export function useCreateOffering() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateCourseOfferingRequest) =>
      api.post<CourseOffering>("/api/admin/course-offerings", data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
      qc.invalidateQueries({ queryKey: ["admin", "course-catalog"] });
    },
  });
}

export function useAssignFaculty() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      offeringId,
      facultyId,
    }: { offeringId: string } & AssignFacultyRequest) =>
      api.post<CourseOffering>(
        `/api/admin/course-offerings/${offeringId}/assign-faculty`,
        { facultyId },
      ),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin", "course-offerings"] });
      qc.invalidateQueries({ queryKey: ["admin", "courses"] });
    },
  });
}
