import type {
  Identifiable,
  Timestamps,
  TenantScoped,
  PortalRole,
  RiskLevel,
  ComplianceStatus,
  CredentialStatus,
  ModelStatus,
} from "./common.types";

// === Dashboard ===
export interface AdminDashboard {
  enrollment: { total: number; trend: number; byDepartment: { name: string; count: number }[] };
  retention: { rate: number; trend: number };
  graduation: { rate: number; trend: number };
  compliance: { score: number; status: ComplianceStatus; deviations: number };
  facultyStudentRatio: number;
  enrollmentTrend: { month: string; count: number }[];
}

// === Analytics ===
export interface InstitutionalAnalytics {
  kpis: {
    name: string;
    value: number;
    previousValue: number;
    unit: string;
    trend: "up" | "down" | "stable";
  }[];
  departmentComparison: {
    department: string;
    enrollment: number;
    retention: number;
    graduation: number;
    avgGpa: number;
    placementRate: number;
  }[];
  yearlyTrends: {
    year: string;
    enrollment: number;
    retention: number;
    graduation: number;
  }[];
}

// === Compliance ===
export interface CompliancePulse {
  overallScore: number;
  status: ComplianceStatus;
  categories: ComplianceCategory[];
  recentDeviations: ComplianceDeviation[];
  frameworkScores: { framework: string; score: number; status: ComplianceStatus }[];
}

export interface ComplianceCategory {
  name: string;
  score: number;
  status: ComplianceStatus;
  checkedAt: string;
  items: { name: string; status: "pass" | "fail" | "warning"; detail: string }[];
}

export interface ComplianceDeviation extends Identifiable, Timestamps {
  category: string;
  severity: RiskLevel;
  description: string;
  detectedAt: string;
  resolvedAt?: string;
  resolution?: string;
  assignedTo?: string;
}

// === Audit Trail ===
export interface AuditLogEntry extends Identifiable {
  timestamp: string;
  userId: string;
  userName: string;
  userRole: PortalRole;
  action: string;
  resource: string;
  resourceId: string;
  details: string;
  ipAddress: string;
  outcome: "success" | "failure";
}

// === Users & Roles ===
export interface AdminUser extends Identifiable, Timestamps, TenantScoped {
  email: string;
  name: string;
  role: PortalRole;
  department: string;
  status: "active" | "inactive" | "suspended";
  lastLoginAt: string | null;
  avatarUrl: string | null;
  phone?: string;
  // Student-specific
  studentId?: string;
  program?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  currentSemester?: string;
  // Faculty-specific
  employeeId?: string;
  designation?: string;
  specialization?: string;
}

// === Programs & Degrees ===
export type DegreeType = "UG" | "PG" | "Diploma" | "PhD";

export interface Program extends Identifiable, Timestamps {
  name: string;
  department: string;
  duration: number; // years
  totalSemesters: number;
  degreeType: DegreeType;
  status: "active" | "inactive";
  studentCount: number;
}

export interface CreateProgramRequest {
  name: string;
  department: string;
  duration: number;
  totalSemesters: number;
  degreeType: DegreeType;
}

export interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: PortalRole;
  department: string;
  studentId?: string;
  program?: string;
  academicYearStart?: string;
  academicYearEnd?: string;
  currentSemester?: string;
  employeeId?: string;
  designation?: string;
  specialization?: string;
}

export interface RoleDefinition {
  role: PortalRole;
  label: string;
  description: string;
  userCount: number;
  permissions: Permission[];
}

export interface Permission {
  module: string;
  actions: { name: string; allowed: boolean }[];
}

// === Budget ===
export interface BudgetOverview {
  totalBudget: number;
  spent: number;
  remaining: number;
  utilizationRate: number;
  byDepartment: { department: string; allocated: number; spent: number }[];
  monthlySpend: { month: string; amount: number }[];
  alerts: BudgetAlert[];
}

export interface BudgetAlert extends Identifiable {
  department: string;
  type: "overspend" | "approaching_limit" | "anomaly";
  message: string;
  severity: RiskLevel;
  date: string;
}

// === AI Governance ===
export interface AiModel extends Identifiable {
  name: string;
  version: string;
  domain: string;
  status: ModelStatus;
  accuracy: number;
  lastTrainedAt: string;
  dataPoints: number;
  biasScore: number;
  fairnessMetrics: { demographic: string; score: number }[];
  description: string;
  owner: string;
}

export interface BiasReport extends Identifiable, Timestamps {
  modelId: string;
  modelName: string;
  reportDate: string;
  overallScore: number;
  demographics: {
    group: string;
    metric: string;
    value: number;
    threshold: number;
    status: "pass" | "fail" | "warning";
  }[];
  recommendations: string[];
  reviewedBy?: string;
}

export interface AiOverrideLog extends Identifiable {
  timestamp: string;
  modelName: string;
  originalDecision: string;
  overriddenTo: string;
  reason: string;
  overriddenBy: string;
  affectedEntity: string;
}

// === Credentials Management ===
export interface AdminCredential extends Identifiable, Timestamps {
  studentName: string;
  studentId: string;
  title: string;
  type: "degree" | "certificate" | "badge" | "transcript";
  status: CredentialStatus;
  issuedDate: string;
  verificationHash?: string;
  revokedAt?: string;
  revokedReason?: string;
}

export interface IssueCredentialRequest {
  studentId: string;
  title: string;
  type: "degree" | "certificate" | "badge" | "transcript";
  description: string;
}

// === Reports ===
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: "compliance" | "enrollment" | "financial" | "performance" | "custom";
  parameters: ReportParameter[];
  lastGenerated?: string;
}

export interface ReportParameter {
  name: string;
  type: "date" | "select" | "text";
  label: string;
  required: boolean;
  options?: { value: string; label: string }[];
}

export interface GeneratedReport extends Identifiable, Timestamps {
  templateId: string;
  templateName: string;
  status: "generating" | "completed" | "failed";
  parameters: Record<string, string>;
  downloadUrl?: string;
  generatedBy: string;
  fileSize?: number;
}

// === Courses ===
// AdminCourse is the OFFERING view — what gets taught in a specific term to a
// specific cohort. Faculty/student portals read this. New fields (catalogId,
// academicYearId, sectionId, studyYear, courseType, lecture/tutorial/practical
// hours) are populated for offerings created via the new flow; legacy seed
// rows fill them with sensible defaults.
export interface AdminCourse extends Identifiable, Timestamps {
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  semesterId: string;
  semesterName: string;
  facultyId: string;
  facultyName: string;
  enrolledCount: number;
  enrolledStudentIds?: string[];
  maxCapacity: number;
  status: "draft" | "active" | "archived";
  // — New offering-shape fields —
  catalogId?: string;
  academicYearId?: string;
  academicYearName?: string;
  studyYear?: 1 | 2 | 3 | 4 | 5;
  programmeId?: string;
  programmeName?: string;
  sectionId?: string;
  sectionName?: string;
  courseType?: CourseType;
  lectureHours?: number;
  tutorialHours?: number;
  practicalHours?: number;
  // Snapshot of the catalog at offering-creation time. Lets past offerings
  // keep the syllabus/credits they were taught with even when the catalog
  // is later edited (Issue 8 in the brief).
  syllabusSnapshot?: string;
  regulationSnapshot?: string;
  creditsSnapshot?: number;
}

export interface CreateCourseRequest {
  code: string;
  name: string;
  description: string;
  credits: number;
  department: string;
  semesterId: string;
  facultyId: string;
  maxCapacity: number;
}

export interface BulkEnrollRequest {
  courseId: string;
  studentIds: string[];
}

// === Course Catalog (design-time, master) ===
// One catalog row defines what a course IS. Many offerings reuse it across
// terms and sections. Owning department is optional — cross-cutting courses
// (Communication Skills, etc.) leave it null.
export type CourseType = "core" | "programme_elective" | "open_elective";

export interface CourseCatalog extends Identifiable, Timestamps {
  code: string;
  name: string;
  description: string;
  syllabus: string;
  regulation: string;
  credits: number;
  courseType: CourseType;
  owningDepartmentId: string | null;
  owningDepartmentName: string | null;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  status: "active" | "archived";
  offeringCount: number;
}

export interface CreateCourseCatalogRequest {
  code: string;
  name: string;
  description: string;
  syllabus: string;
  regulation: string;
  credits: number;
  courseType: CourseType;
  owningDepartmentId: string | null;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
}

// === Sections (programme cohort) ===
// Section is a cohort within a (programme, study year). Section "CSE-A Year 2"
// is the unit you assign offerings to. Programme + studyYear + sectionName is
// the natural identity.
export interface Section extends Identifiable, Timestamps {
  name: string;
  programmeId: string;
  programmeName: string;
  department: string;
  studyYear: 1 | 2 | 3 | 4 | 5;
  studentCount: number;
  status: "active" | "archived";
}

// === Departments (master data) ===
export interface Department extends Identifiable, Timestamps {
  name: string;
  code: string;
  hodName?: string;
  status: "active" | "archived";
}

// === Course Offering (run-time, instance) ===
// Enriched view returned by /api/admin/course-offerings. Field-compatible
// superset of AdminCourse plus joined catalog/section/programme data so the
// list table can render without N+1 lookups.
export interface CourseOffering extends Identifiable, Timestamps {
  catalogId: string;
  catalogCode: string;
  catalogName: string;
  courseType: CourseType;
  academicYearId: string;
  academicYearName: string;
  semesterId: string;
  semesterName: string;
  studyYear: 1 | 2 | 3 | 4 | 5;
  programmeId: string;
  programmeName: string;
  department: string;
  sectionId: string;
  sectionName: string;
  facultyId: string | null;
  facultyName: string | null;
  enrolledCount: number;
  maxCapacity: number;
  lectureHours: number;
  tutorialHours: number;
  practicalHours: number;
  // Snapshot of catalog at creation time — frozen for transcript fidelity.
  syllabusSnapshot: string;
  regulationSnapshot: string;
  creditsSnapshot: number;
  status: "draft" | "active" | "archived";
}

export interface CreateCourseOfferingRequest {
  catalogId: string;
  academicYearId: string;
  semesterId: string;
  studyYear: 1 | 2 | 3 | 4 | 5;
  sectionId: string;
  facultyId: string | null;
  maxCapacity: number;
}

export interface AssignFacultyRequest {
  facultyId: string;
}

// === Semesters ===
export interface Semester extends Identifiable, Timestamps {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  courseCount: number;
  academicYearId?: string;
}

export interface CreateSemesterRequest {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  academicYearId?: string;
}

// === Academic Year ===
export interface AcademicYear extends Identifiable, Timestamps {
  name: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  semesters: Semester[];
}

export interface CreateAcademicYearRequest {
  name: string;
  startDate: string;
  endDate: string;
}

// === Bulk Import ===
export interface BulkImportUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: "student" | "faculty" | "admin" | "placement";
  department: string;
  studentId?: string;
  program?: string;
  employeeId?: string;
}

// === Settings ===
export interface InstitutionSettings {
  name: string;
  shortName: string;
  domain: string;
  timezone: string;
  locale: string;
  academicYear: string;
  logo?: string;
  primaryColor: string;
  visibility: {
    shareWithMinistry: boolean;
    anonymizeData: boolean;
    publicProfile: boolean;
  };
  dataRetention: {
    studentRecords: number;
    auditLogs: number;
    analyticsData: number;
  };
}
