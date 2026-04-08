import type { Identifiable, Timestamps, RiskLevel, AppealStatus, CredentialStatus, PipelineStage } from "./common.types";

// === Dashboard ===
export interface StudentDashboard {
  gpa: { current: number; trend: "up" | "down" | "stable"; previousSemester: number };
  creditsCompleted: number;
  creditsRequired: number;
  currentCourses: number;
  riskLevel: RiskLevel;
  riskAlerts: RiskAlert[];
  upcomingDeadlines: Deadline[];
  skillRadarPreview: SkillScore[];
  recentActivity: ActivityItem[];
}

export interface RiskAlert extends Identifiable {
  type: "academic" | "attendance" | "engagement";
  severity: RiskLevel;
  message: string;
  courseId?: string;
  courseName?: string;
  triggeredAt: string;
}

export interface Deadline {
  id: string;
  title: string;
  courseId: string;
  courseName: string;
  dueDate: string;
  type: "assignment" | "exam" | "project";
}

export interface ActivityItem {
  id: string;
  title: string;
  description: string;
  timestamp: string;
  type: "grade" | "credential" | "recommendation" | "appeal" | "application";
}

// === Academics ===
export interface Course extends Identifiable, Timestamps {
  code: string;
  name: string;
  instructor: string;
  instructorId: string;
  credits: number;
  semester: string;
  grade?: string;
  gradePoints?: number;
  attendance: number;
  status: "active" | "completed" | "withdrawn";
  schedule?: string;
  room?: string;
  assignments: Assignment[];
}

export interface Assignment extends Identifiable {
  title: string;
  type: "assignment" | "exam" | "project" | "quiz";
  dueDate: string;
  score?: number;
  maxScore: number;
  weight: number;
  status: "upcoming" | "submitted" | "graded" | "late" | "missed";
  submittedAt?: string;
  feedback?: string;
}

export interface TranscriptSemester {
  semester: string;
  year: string;
  courses: Course[];
  semesterGpa: number;
  cumulativeGpa: number;
  creditsAttempted: number;
  creditsEarned: number;
}

// === Skills ===
export interface SkillScore {
  skillId: string;
  skillName: string;
  category: string;
  score: number;
  benchmark: number;
  trend: "up" | "down" | "stable";
}

export interface SkillEvolutionPoint {
  date: string;
  skills: Record<string, number>;
}

export interface SkillGap {
  skillName: string;
  currentScore: number;
  requiredScore: number;
  gap: number;
  recommendedResources: { title: string; type: string; url: string }[];
}

// === Credentials ===
export interface Credential extends Identifiable, Timestamps {
  title: string;
  type: "degree" | "certificate" | "badge" | "transcript";
  issuer: string;
  issuedDate: string;
  expiryDate?: string;
  status: CredentialStatus;
  verificationHash?: string;
  verificationUrl?: string;
  description: string;
  skills: string[];
  metadata: Record<string, string>;
}

// === Placement ===
export interface CareerReadiness {
  overallScore: number;
  breakdown: { category: string; score: number; maxScore: number }[];
  topSkills: string[];
  gapSkills: string[];
  matchedJobs: number;
  applicationsActive: number;
}

export interface JobMatch extends Identifiable {
  title: string;
  company: string;
  companyLogo?: string;
  location: string;
  type: "full_time" | "internship" | "part_time" | "contract";
  salary?: { min: number; max: number; currency: string };
  matchScore: number;
  matchExplanation: string;
  requiredSkills: string[];
  matchedSkills: string[];
  gapSkills: string[];
  postedDate: string;
  deadline: string;
  description: string;
  applied: boolean;
}

export interface Application extends Identifiable, Timestamps {
  jobId: string;
  jobTitle: string;
  company: string;
  status: PipelineStage;
  appliedDate: string;
  lastActivityDate: string;
  nextStep?: string;
  notes?: string;
  timeline: { date: string; event: string; status: PipelineStage }[];
}

export interface PortfolioItem extends Identifiable, Timestamps {
  title: string;
  description: string;
  type: "project" | "paper" | "certification" | "award" | "other";
  url?: string;
  fileUrl?: string;
  skills: string[];
  isPublic: boolean;
}

// === Recommendations ===
export interface StudentRecommendation extends Identifiable, Timestamps {
  type: "course" | "skill" | "job" | "resource" | "intervention";
  title: string;
  description: string;
  confidence: number;
  priority: "high" | "medium" | "low";
  actionLabel: string;
  actionUrl?: string;
  status: "pending" | "approved" | "dismissed";
  dismissReason?: string;
  explanation: {
    summary: string;
    factors: { name: string; value: string | number; weight: number; direction: "positive" | "negative" | "neutral" }[];
    dataSources: string[];
    modelVersion: string;
    generatedAt: string;
  };
}

// === Appeals ===
export interface Appeal extends Identifiable, Timestamps {
  courseId: string;
  courseName: string;
  courseCode: string;
  assessmentName: string;
  assessmentType: string;
  currentScore: number;
  maxScore: number;
  appealReason: string;
  supportingDocuments: { name: string; url: string; size: number }[];
  status: AppealStatus;
  reviewerName?: string;
  reviewerNote?: string;
  resolvedScore?: number;
  resolvedAt?: string;
  timeline: { date: string; event: string; actor: string }[];
}

export interface CreateAppealRequest {
  courseId: string;
  assessmentId: string;
  reason: string;
  supportingDocuments?: File[];
}

// === Settings ===
export interface StudentProfile {
  name: string;
  email: string;
  studentId: string;
  department: string;
  program: string;
  enrollmentYear: number;
  expectedGraduation: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  interests: string[];
  socialLinks: { platform: string; url: string }[];
}

export interface NotificationPreferences {
  email: boolean;
  push: boolean;
  riskAlerts: boolean;
  gradeUpdates: boolean;
  deadlineReminders: boolean;
  jobMatches: boolean;
  recommendations: boolean;
}
