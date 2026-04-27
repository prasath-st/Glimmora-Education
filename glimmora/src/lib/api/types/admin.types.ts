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
  maxCapacity: number;
  status: "draft" | "active" | "archived";
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

// === Semesters ===
export interface Semester extends Identifiable, Timestamps {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
  status: "upcoming" | "active" | "completed";
  courseCount: number;
}

export interface CreateSemesterRequest {
  name: string;
  year: string;
  startDate: string;
  endDate: string;
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
