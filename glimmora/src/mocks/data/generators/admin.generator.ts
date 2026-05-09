import { faker } from "@faker-js/faker";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceCategory,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  AiModel,
  BiasReport,
  AiOverrideLog,
  ReportTemplate,
  ReportParameter,
  GeneratedReport,
  InstitutionSettings,
  Semester,
  AdminCourse,
  Program,
  AcademicYear,
  CourseCatalog,
  CourseType,
  Section,
  Department,
} from "@/lib/api/types/admin.types";
import type {
  PortalRole,
  RiskLevel,
  ComplianceStatus,
  ModelStatus,
} from "@/lib/api/types/common.types";

faker.seed(44);

// ─── Helpers ──────────────────────────────────────────────────────────────────

function id(prefix: string): string {
  return `${prefix}_${faker.string.alphanumeric(12)}`;
}

function isoDate(date: Date): string {
  return date.toISOString();
}

function pastDate(daysBack: number): string {
  return isoDate(faker.date.recent({ days: Math.max(1, daysBack) }));
}

function futureDate(daysAhead: number): string {
  return isoDate(faker.date.soon({ days: Math.max(1, daysAhead) }));
}

function pick<T>(arr: T[]): T {
  return arr[faker.number.int({ min: 0, max: arr.length - 1 })];
}

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// ─── Realistic Constants ──────────────────────────────────────────────────────

const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mathematics",
  "Physics",
  "Business Administration",
  "Biotechnology",
  "Civil Engineering",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const MODULES = [
  "Dashboard",
  "Students",
  "Courses",
  "Research",
  "Compliance",
  "Users",
  "AI",
  "Reports",
  "Settings",
];

const AUDIT_ACTIONS = [
  "login",
  "data_export",
  "role_change",
  "user_create",
  "config_update",
  "report_generate",
  "permission_change",
  "credential_issue",
  "compliance_review",
  "integration_sync",
];

const AUDIT_RESOURCES = [
  "user",
  "role",
  "report",
  "credential",
  "integration",
  "compliance",
  "setting",
  "course",
  "student",
  "model",
];

const FIRST_NAMES = [
  "Aarav", "Priya", "Rahul", "Sneha", "Vikram",
  "Ananya", "Rohan", "Kavya", "Aditya", "Meera",
  "Arjun", "Divya", "Siddharth", "Nisha", "Karan",
  "Ishita", "Manish", "Pooja", "Suresh", "Lakshmi",
  "Deepak", "Ritu", "Nitin", "Swathi", "Gaurav",
  "Anjali", "Bharath", "Shreya", "Rajesh", "Sunita",
];

const LAST_NAMES = [
  "Sharma", "Patel", "Gupta", "Singh", "Kumar",
  "Reddy", "Nair", "Joshi", "Menon", "Iyer",
  "Verma", "Chatterjee", "Banerjee", "Das", "Mukherjee",
  "Rao", "Pillai", "Desai", "Shah", "Mehta",
];

// Real university role mix: students dominate at ~94%, faculty ~5%, with a
// handful of admin and placement officers per cohort. With generateUsers(2000)
// this produces ~1,880 students / ~100 faculty / ~10 admin / ~10 placement and
// a believable faculty-student ratio of ~1:18.
const ROLE_DISTRIBUTION: PortalRole[] = [
  ...Array(188).fill("student"),
  ...Array(10).fill("faculty"),
  ...Array(1).fill("admin"),
  ...Array(1).fill("placement"),
] as PortalRole[];

const AI_MODEL_DEFINITIONS = [
  {
    name: "Student Risk Predictor",
    domain: "Student Success",
    description: "Identifies at-risk students based on academic performance, attendance, and engagement patterns to enable early intervention.",
    version: "3.2.1",
  },
  {
    name: "Research Optimization Engine",
    domain: "Research Management",
    description: "Optimizes research grant matching and resource allocation across departments using historical funding data.",
    version: "2.1.0",
  },
  {
    name: "Compliance Monitor",
    domain: "Regulatory Compliance",
    description: "Continuously monitors institutional practices against GDPR, FERPA, and DPDP frameworks to detect potential violations.",
    version: "1.4.2",
  },
  {
    name: "Placement Matching Agent",
    domain: "Career Services",
    description: "Matches students to job opportunities based on skills, preferences, academic performance, and employer requirements.",
    version: "2.8.0",
  },
  {
    name: "Curriculum Advisor",
    domain: "Academic Planning",
    description: "Recommends curriculum adjustments based on industry trends, student outcomes, and accreditation requirements.",
    version: "1.2.3",
  },
];

// ─── Institutional KPIs (shared between Dashboard + Analytics) ────────────────
// Single source of truth so the two pages can never disagree. Anything that's
// computable from live data (totalEnrollment, facultyCount, ratios, per-dept
// student counts, active courses) is derived at request time. Anything with
// no underlying data (rates, GPA, research output, multi-year trends) is
// generated once via the seeded faker so values stay stable across requests.

interface StableKpiPool {
  retentionRate: number;
  retentionRateLastYear: number;
  graduationRate: number;
  graduationRateLastYear: number;
  avgGpa: number;
  avgGpaLastYear: number;
  placementRate: number;
  placementRateLastYear: number;
  researchOutput: number;
  researchOutputLastYear: number;
  complianceScoreLastYear: number;
  monthlyEnrollmentDeltas: number[]; // 12 deltas applied around the live total
  yearlyEnrollmentDeltas: number[]; // 5 historical deltas
  yearlyRetention: number[];
  yearlyGraduation: number[];
  departmentRates: {
    department: string;
    retention: number;
    graduation: number;
    avgGpa: number;
    placementRate: number;
  }[];
}

// Generated ONCE at module load — deterministic via the faker.seed(44) at top.
const STABLE_KPI_POOL: StableKpiPool = {
  retentionRate: roundTo(faker.number.float({ min: 85, max: 89 }), 1),
  retentionRateLastYear: roundTo(faker.number.float({ min: 83, max: 87 }), 1),
  graduationRate: roundTo(faker.number.float({ min: 80, max: 84 }), 1),
  graduationRateLastYear: roundTo(faker.number.float({ min: 78, max: 83 }), 1),
  avgGpa: roundTo(faker.number.float({ min: 3.30, max: 3.55 }), 2),
  avgGpaLastYear: roundTo(faker.number.float({ min: 3.25, max: 3.50 }), 2),
  placementRate: roundTo(faker.number.float({ min: 75, max: 82 }), 1),
  placementRateLastYear: roundTo(faker.number.float({ min: 76, max: 83 }), 1),
  researchOutput: faker.number.int({ min: 320, max: 360 }),
  researchOutputLastYear: faker.number.int({ min: 300, max: 340 }),
  complianceScoreLastYear: faker.number.int({ min: 82, max: 87 }),
  monthlyEnrollmentDeltas: MONTHS.map(() =>
    faker.number.int({ min: -400, max: 400 }),
  ),
  yearlyEnrollmentDeltas: Array.from({ length: 5 }, () =>
    faker.number.int({ min: -800, max: 800 }),
  ),
  yearlyRetention: Array.from({ length: 5 }, () =>
    roundTo(faker.number.float({ min: 82, max: 89 }), 1),
  ),
  yearlyGraduation: Array.from({ length: 5 }, () =>
    roundTo(faker.number.float({ min: 76, max: 84 }), 1),
  ),
  departmentRates: DEPARTMENTS.map((department) => ({
    department,
    retention: roundTo(faker.number.float({ min: 78, max: 95 }), 1),
    graduation: roundTo(faker.number.float({ min: 72, max: 92 }), 1),
    avgGpa: roundTo(faker.number.float({ min: 3.0, max: 3.8 }), 2),
    placementRate: roundTo(faker.number.float({ min: 65, max: 95 }), 1),
  })),
};

interface LiveKpis {
  totalEnrollment: number;
  totalEnrollmentLastYear: number;
  facultyCount: number;
  facultyStudentRatio: number;
  activeCourseCount: number;
  studentsByDepartment: { name: string; count: number }[];
  enrollmentByDepartment: { department: string; enrollment: number }[];
}

/** Compute live counts from the seed users[]/courses[] arrays. */
export function computeLiveKpis(users: AdminUser[], courses: AdminCourse[]): LiveKpis {
  const students = users.filter((u) => u.role === "student");
  const faculty = users.filter((u) => u.role === "faculty");
  const totalEnrollment = students.length;
  const facultyCount = Math.max(1, faculty.length);
  const facultyStudentRatio = roundTo(totalEnrollment / facultyCount, 1);
  const activeCourseCount = courses.filter((c) => c.status === "active").length;

  const studentsByDepartment = DEPARTMENTS.map((name) => ({
    name,
    count: students.filter((s) => s.department === name).length,
  }));

  // Last year's total derives from this year minus a stable growth factor
  // (~3.8% retention growth) so the trend % stays plausible and reconciled.
  const totalEnrollmentLastYear = Math.round(totalEnrollment / 1.038);

  return {
    totalEnrollment,
    totalEnrollmentLastYear,
    facultyCount,
    facultyStudentRatio,
    activeCourseCount,
    studentsByDepartment,
    enrollmentByDepartment: studentsByDepartment.map((d) => ({
      department: d.name,
      enrollment: d.count,
    })),
  };
}

/** Build the Dashboard response from the unified KPI pool + live counts. */
export function buildAdminDashboard(
  live: LiveKpis,
  compliance: { score: number; status: ComplianceStatus; unresolvedDeviations: number },
): AdminDashboard {
  const enrollmentTrendPct = roundTo(
    ((live.totalEnrollment - live.totalEnrollmentLastYear) /
      Math.max(1, live.totalEnrollmentLastYear)) *
      100,
    1,
  );

  // Build a 12-month series anchored on live total ± stable deltas so the
  // chart line doesn't drift further from the headline number than ±400.
  const enrollmentTrend = MONTHS.map((month, i) => ({
    month,
    count: live.totalEnrollment + STABLE_KPI_POOL.monthlyEnrollmentDeltas[i],
  }));

  return {
    enrollment: {
      total: live.totalEnrollment,
      trend: enrollmentTrendPct,
      byDepartment: live.studentsByDepartment,
    },
    retention: {
      rate: STABLE_KPI_POOL.retentionRate,
      trend: roundTo(
        STABLE_KPI_POOL.retentionRate - STABLE_KPI_POOL.retentionRateLastYear,
        1,
      ),
    },
    graduation: {
      rate: STABLE_KPI_POOL.graduationRate,
      trend: roundTo(
        STABLE_KPI_POOL.graduationRate - STABLE_KPI_POOL.graduationRateLastYear,
        1,
      ),
    },
    compliance: {
      score: compliance.score,
      status: compliance.status,
      deviations: compliance.unresolvedDeviations,
    },
    facultyStudentRatio: live.facultyStudentRatio,
    enrollmentTrend,
  };
}

/** Build the Analytics response from the same unified KPI pool. */
export function buildAnalytics(
  live: LiveKpis,
  compliance: { score: number },
): InstitutionalAnalytics {
  // Trend tag: derived from current vs last-year comparison so it stays
  // consistent with the change shown on the card.
  const direction = (cur: number, prev: number): "up" | "down" | "stable" => {
    if (cur > prev) return "up";
    if (cur < prev) return "down";
    return "stable";
  };

  const kpis = [
    {
      name: "Total Enrollment",
      value: live.totalEnrollment,
      previousValue: live.totalEnrollmentLastYear,
      unit: "students",
      trend: direction(live.totalEnrollment, live.totalEnrollmentLastYear),
    },
    {
      name: "Retention Rate",
      value: STABLE_KPI_POOL.retentionRate,
      previousValue: STABLE_KPI_POOL.retentionRateLastYear,
      unit: "%",
      trend: direction(
        STABLE_KPI_POOL.retentionRate,
        STABLE_KPI_POOL.retentionRateLastYear,
      ),
    },
    {
      name: "Graduation Rate",
      value: STABLE_KPI_POOL.graduationRate,
      previousValue: STABLE_KPI_POOL.graduationRateLastYear,
      unit: "%",
      trend: direction(
        STABLE_KPI_POOL.graduationRate,
        STABLE_KPI_POOL.graduationRateLastYear,
      ),
    },
    {
      name: "Average GPA",
      value: STABLE_KPI_POOL.avgGpa,
      previousValue: STABLE_KPI_POOL.avgGpaLastYear,
      unit: "points",
      trend: direction(STABLE_KPI_POOL.avgGpa, STABLE_KPI_POOL.avgGpaLastYear),
    },
    {
      name: "Placement Rate",
      value: STABLE_KPI_POOL.placementRate,
      previousValue: STABLE_KPI_POOL.placementRateLastYear,
      unit: "%",
      trend: direction(
        STABLE_KPI_POOL.placementRate,
        STABLE_KPI_POOL.placementRateLastYear,
      ),
    },
    {
      name: "Faculty-Student Ratio",
      value: live.facultyStudentRatio,
      previousValue: live.facultyStudentRatio + 0.4, // last year — slightly higher students/faculty
      unit: ":1",
      trend: "up" as const,
    },
    {
      name: "Research Output",
      value: STABLE_KPI_POOL.researchOutput,
      previousValue: STABLE_KPI_POOL.researchOutputLastYear,
      unit: "papers",
      trend: direction(
        STABLE_KPI_POOL.researchOutput,
        STABLE_KPI_POOL.researchOutputLastYear,
      ),
    },
    {
      name: "Compliance Score",
      value: compliance.score,
      previousValue: STABLE_KPI_POOL.complianceScoreLastYear,
      unit: "score",
      trend: direction(compliance.score, STABLE_KPI_POOL.complianceScoreLastYear),
    },
  ];

  // Per-department comparison: live student count + stable per-dept rates.
  const departmentComparison = STABLE_KPI_POOL.departmentRates.map((rates) => {
    const enrollment =
      live.enrollmentByDepartment.find((d) => d.department === rates.department)
        ?.enrollment ?? 0;
    return {
      department: rates.department,
      enrollment,
      retention: rates.retention,
      graduation: rates.graduation,
      avgGpa: rates.avgGpa,
      placementRate: rates.placementRate,
    };
  });

  // Yearly trends: anchor each year on live total ± stable yearly delta so the
  // last point matches the headline Total Enrollment.
  const yearlyTrends = Array.from({ length: 5 }, (_, i) => {
    const year = (2022 + i).toString();
    const isCurrent = i === 4;
    return {
      year,
      enrollment: isCurrent
        ? live.totalEnrollment
        : live.totalEnrollment + STABLE_KPI_POOL.yearlyEnrollmentDeltas[i],
      retention: STABLE_KPI_POOL.yearlyRetention[i],
      graduation: STABLE_KPI_POOL.yearlyGraduation[i],
    };
  });

  return { kpis, departmentComparison, yearlyTrends };
}

export function generateCompliancePulse(): CompliancePulse {
  const categoryDefs = [
    { name: "Data Privacy", items: ["GDPR Consent Management", "Data Encryption at Rest", "Access Control Policies", "Data Breach Response Plan", "Right to Erasure Process"] },
    { name: "Academic Standards", items: ["Curriculum Review Cycle", "Assessment Integrity", "Grading Rubric Consistency", "Credit Transfer Policies", "Accreditation Alignment"] },
    { name: "Financial Audit", items: ["Budget Reconciliation", "Expenditure Tracking", "Grant Fund Usage", "Tuition Fee Compliance", "Vendor Payment Records"] },
    { name: "Safety & Security", items: ["Campus Security Protocols", "Emergency Response Plan", "Lab Safety Compliance", "Fire Safety Inspections", "Cybersecurity Audit"] },
    { name: "Accreditation", items: ["NBA Criteria Compliance", "NAAC Self-Study Report", "Program Learning Outcomes", "Faculty Qualifications", "Infrastructure Standards"] },
    { name: "Research Ethics", items: ["IRB Approval Process", "Data Handling Protocols", "Plagiarism Detection", "Conflict of Interest Disclosure", "Publication Ethics"] },
  ];

  const categories: ComplianceCategory[] = categoryDefs.map((cat) => {
    const items = cat.items.map((name) => {
      const r = faker.number.float({ min: 0, max: 1 });
      const status: "pass" | "fail" | "warning" = r < 0.7 ? "pass" : r < 0.9 ? "warning" : "fail";
      const detailMap = {
        pass: "Fully compliant — last verified " + pastDate(30).split("T")[0],
        warning: "Minor issues found — review recommended by " + futureDate(14).split("T")[0],
        fail: "Non-compliant — immediate action required",
      };
      return { name, status, detail: detailMap[status] };
    });

    const passCount = items.filter((i) => i.status === "pass").length;
    const score = Math.round((passCount / items.length) * 100);
    const status: ComplianceStatus =
      score >= 80 ? "compliant" : score >= 60 ? "at_risk" : "non_compliant";

    return {
      name: cat.name,
      score,
      status,
      checkedAt: pastDate(7),
      items,
    };
  });

  const deviationDescriptions = [
    { category: "Data Privacy", severity: "high" as RiskLevel, description: "Unencrypted student PII found in legacy database backup from 2023 migration." },
    { category: "Financial Audit", severity: "medium" as RiskLevel, description: "Three vendor invoices exceeding ₹5L processed without dual-authorization approval." },
    { category: "Academic Standards", severity: "low" as RiskLevel, description: "Two course syllabi for Spring 2026 not yet uploaded to accreditation portal." },
    { category: "Safety & Security", severity: "medium" as RiskLevel, description: "Lab safety inspection overdue for Biotechnology Department wet lab by 12 days." },
    { category: "Research Ethics", severity: "high" as RiskLevel, description: "IRB approval expired for ongoing human-subjects study in Psychology department." },
  ];

  const recentDeviations: ComplianceDeviation[] = deviationDescriptions.map((d, i) => {
    const isResolved = i === 2;
    return {
      id: id("dev"),
      category: d.category,
      severity: d.severity,
      description: d.description,
      detectedAt: pastDate(Math.max(1, 30 - i * 5)),
      resolvedAt: isResolved ? pastDate(Math.max(1, 5)) : undefined,
      resolution: isResolved ? "Syllabi uploaded and verified by department head." : undefined,
      assignedTo: isResolved ? undefined : faker.person.fullName(),
      createdAt: pastDate(Math.max(1, 30 - i * 5)),
      updatedAt: pastDate(Math.max(1, i + 1)),
    };
  });

  const frameworkScores = [
    { framework: "GDPR", score: 91, status: "compliant" as ComplianceStatus },
    { framework: "FERPA", score: 87, status: "compliant" as ComplianceStatus },
    { framework: "DPDP Act", score: 83, status: "compliant" as ComplianceStatus },
    { framework: "ISO 27001", score: 76, status: "at_risk" as ComplianceStatus },
  ];

  const overallScore = Math.round(
    categories.reduce((sum, c) => sum + c.score, 0) / categories.length
  );
  const overallStatus: ComplianceStatus =
    overallScore >= 80 ? "compliant" : overallScore >= 60 ? "at_risk" : "non_compliant";

  return {
    overallScore,
    status: overallStatus,
    categories,
    recentDeviations,
    frameworkScores,
  };
}

export function generateAuditLog(count: number = 100): AuditLogEntry[] {
  const userPool = Array.from({ length: 20 }, () => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    return {
      userId: id("usr"),
      userName: `${firstName} ${lastName}`,
      userRole: pick(["admin", "faculty", "student", "placement"] as PortalRole[]),
    };
  });

  return Array.from({ length: count }, (_, i) => {
    const user = pick(userPool);
    const action = pick(AUDIT_ACTIONS);
    const resource = pick(AUDIT_RESOURCES);
    const outcome: "success" | "failure" = faker.number.float({ min: 0, max: 1 }) < 0.92 ? "success" : "failure";

    const detailMap: Record<string, string> = {
      login: `${outcome === "success" ? "Successful" : "Failed"} login attempt from ${faker.internet.ip()}`,
      data_export: `Exported ${faker.number.int({ min: 50, max: 5000 })} ${resource} records to CSV`,
      role_change: `Changed role from ${pick(["student", "faculty"] as PortalRole[])} to ${pick(["admin", "placement"] as PortalRole[])}`,
      user_create: `Created new ${pick(["student", "faculty", "admin"] as PortalRole[])} account`,
      config_update: `Updated ${resource} configuration settings`,
      report_generate: `Generated ${pick(["enrollment", "compliance", "financial", "performance"])} report`,
      permission_change: `Modified permissions for ${pick(MODULES)} module`,
      credential_issue: `Issued ${pick(["degree", "certificate", "badge"])} credential`,
      compliance_review: `Completed compliance review for ${pick(DEPARTMENTS)}`,
      integration_sync: `Triggered sync for ${pick(["Student Records", "Financial System", "HR System", "SSO Provider"])}`,
    };

    return {
      id: id("aud"),
      timestamp: pastDate(Math.max(1, 90 - i)),
      userId: user.userId,
      userName: user.userName,
      userRole: user.userRole,
      action,
      resource,
      resourceId: id(resource.slice(0, 3)),
      details: detailMap[action] || `Performed ${action} on ${resource}`,
      ipAddress: faker.internet.ip(),
      outcome,
    };
  });
}

export function generateUsers(count: number = 60): AdminUser[] {
  return Array.from({ length: count }, (_, i) => {
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const role = ROLE_DISTRIBUTION[i % ROLE_DISTRIBUTION.length];
    // 82% active, 8% pending invitation (recently provisioned, hasn't
    // activated yet), 6% inactive, 4% suspended — reflects a real fleet
    // mid-term where some onboarded students/faculty haven't logged in yet.
    const statusRoll = faker.number.float({ min: 0, max: 1 });
    const status: "active" | "inactive" | "suspended" | "pending_invitation" =
      statusRoll < 0.82
        ? "active"
        : statusRoll < 0.9
          ? "pending_invitation"
          : statusRoll < 0.96
            ? "inactive"
            : "suspended";

    const createdAt = pastDate(
      Math.max(1, faker.number.int({ min: 90, max: 730 })),
    );

    return {
      id: id("usr"),
      email: faker.internet
        .email({ firstName, lastName, provider: "glimmora.edu" })
        .toLowerCase(),
      name,
      role,
      department: pick(DEPARTMENTS),
      status,
      lastLoginAt:
        status === "active"
          ? pastDate(Math.max(1, faker.number.int({ min: 1, max: 14 })))
          : null,
      // Pending users were "invited" at some point in the recent past, so
      // their Resend / Pending-since UX has something to render.
      invitedAt:
        status === "pending_invitation"
          ? pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 })))
          : null,
      avatarUrl: faker.image.avatar(),
      phone: faker.phone.number({ style: "international" }),
      tenantId: "tenant_glimmora_main",
      createdAt,
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))),
    };
  });
}


export function generateAiModels(): AiModel[] {
  return AI_MODEL_DEFINITIONS.map((def) => {
    // One training, one inactive, the rest active — reflects a typical fleet
    // mid-cycle with at least one model under retrain.
    const statuses: ModelStatus[] = ["active", "training", "active", "active", "inactive"];
    const status = statuses[AI_MODEL_DEFINITIONS.indexOf(def)];

    return {
      id: id("mdl"),
      name: def.name,
      version: def.version,
      domain: def.domain,
      status,
      accuracy: roundTo(faker.number.float({ min: 0.82, max: 0.96 }), 3),
      lastTrainedAt: pastDate(Math.max(1, faker.number.int({ min: 7, max: 90 }))),
      dataPoints: faker.number.int({ min: 25000, max: 500000 }),
      biasScore: roundTo(faker.number.float({ min: 0.02, max: 0.15 }), 3),
      fairnessMetrics: [
        { demographic: "Gender", score: roundTo(faker.number.float({ min: 0.88, max: 0.98 }), 3) },
        { demographic: "Ethnicity", score: roundTo(faker.number.float({ min: 0.85, max: 0.97 }), 3) },
        { demographic: "Age Group", score: roundTo(faker.number.float({ min: 0.90, max: 0.99 }), 3) },
        { demographic: "Socioeconomic", score: roundTo(faker.number.float({ min: 0.82, max: 0.95 }), 3) },
      ],
      description: def.description,
      owner: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    };
  });
}

export function generateBiasReports(): BiasReport[] {
  const models = generateAiModels();

  const reportDefs = [
    { modelIdx: 0, overallScore: 92 },
    { modelIdx: 1, overallScore: 87 },
    { modelIdx: 2, overallScore: 95 },
    { modelIdx: 3, overallScore: 78 },
    { modelIdx: 4, overallScore: 84 },
  ];

  return reportDefs.map((def) => {
    const model = models[def.modelIdx];
    const demographics = [
      { group: "Gender - Male", metric: "Equal Opportunity", value: roundTo(faker.number.float({ min: 0.85, max: 0.98 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Gender - Female", metric: "Equal Opportunity", value: roundTo(faker.number.float({ min: 0.83, max: 0.97 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Gender - Non-Binary", metric: "Equal Opportunity", value: roundTo(faker.number.float({ min: 0.78, max: 0.96 }), 3), threshold: 0.85, status: "warning" as const },
      { group: "Ethnicity - General", metric: "Demographic Parity", value: roundTo(faker.number.float({ min: 0.87, max: 0.99 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Ethnicity - OBC", metric: "Demographic Parity", value: roundTo(faker.number.float({ min: 0.82, max: 0.95 }), 3), threshold: 0.85, status: "warning" as const },
      { group: "Ethnicity - SC/ST", metric: "Demographic Parity", value: roundTo(faker.number.float({ min: 0.75, max: 0.93 }), 3), threshold: 0.85, status: "fail" as const },
      { group: "Age - Under 20", metric: "Predictive Equality", value: roundTo(faker.number.float({ min: 0.88, max: 0.97 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Age - 20-25", metric: "Predictive Equality", value: roundTo(faker.number.float({ min: 0.90, max: 0.99 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Age - Over 25", metric: "Predictive Equality", value: roundTo(faker.number.float({ min: 0.80, max: 0.94 }), 3), threshold: 0.85, status: "warning" as const },
      { group: "Socioeconomic - Low Income", metric: "Equalized Odds", value: roundTo(faker.number.float({ min: 0.72, max: 0.90 }), 3), threshold: 0.85, status: "fail" as const },
      { group: "Socioeconomic - Middle Income", metric: "Equalized Odds", value: roundTo(faker.number.float({ min: 0.87, max: 0.97 }), 3), threshold: 0.85, status: "pass" as const },
      { group: "Socioeconomic - High Income", metric: "Equalized Odds", value: roundTo(faker.number.float({ min: 0.91, max: 0.99 }), 3), threshold: 0.85, status: "pass" as const },
    ];

    // Adjust statuses based on values
    demographics.forEach((d) => {
      if (d.value >= d.threshold) d.status = "pass";
      else if (d.value >= d.threshold - 0.05) d.status = "warning";
      else d.status = "fail";
    });

    const recommendations = [
      "Increase training data representation for underrepresented demographic groups.",
      "Apply fairness-aware regularization during next model training cycle.",
      "Review feature importance to identify proxy variables for protected attributes.",
      "Conduct targeted A/B testing with balanced demographic cohorts.",
      "Implement post-processing calibration for equalized odds across income groups.",
    ];

    return {
      id: id("br"),
      modelId: model.id,
      modelName: model.name,
      reportDate: pastDate(Math.max(1, faker.number.int({ min: 7, max: 60 }))),
      overallScore: def.overallScore,
      demographics,
      recommendations: faker.helpers.arrayElements(recommendations, { min: 2, max: 4 }),
      reviewedBy: faker.number.float({ min: 0, max: 1 }) > 0.3 ? `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}` : undefined,
      createdAt: pastDate(Math.max(1, faker.number.int({ min: 7, max: 60 }))),
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 14 }))),
    };
  });
}

export function generateOverrideLog(): AiOverrideLog[] {
  const overrideDefs = [
    { model: "Student Risk Predictor", original: "High Risk — Recommend Academic Probation", overridden: "Medium Risk — Assign Faculty Mentor", reason: "Student showed significant improvement in last 3 assignments; probation would be premature.", entity: "Student: Aarav Sharma (STU-2024-1847)" },
    { model: "Placement Matching Agent", original: "Not Recommended for Axiom Software", overridden: "Recommended — Fast-Track Interview", reason: "Candidate has exceptional open-source contributions not captured in academic transcript.", entity: "Student: Priya Patel (STU-2023-0921)" },
    { model: "Curriculum Advisor", original: "Drop Advanced ML Course", overridden: "Continue with Additional Support", reason: "Student is struggling but highly motivated; dropping course would delay graduation by a semester.", entity: "Student: Kavya Singh (STU-2024-1102)" },
    { model: "Compliance Monitor", original: "Flag as Non-Compliant", overridden: "Compliant with Conditions", reason: "Department submitted corrective action plan; full compliance expected within 30 days.", entity: "Department: Biotechnology" },
    { model: "Student Risk Predictor", original: "Low Risk — No Action", overridden: "Medium Risk — Schedule Check-in", reason: "Faculty advisor noted concerning behavioral changes not reflected in academic metrics.", entity: "Student: Siddharth Reddy (STU-2024-0756)" },
    { model: "Research Optimization Engine", original: "Reject Grant Application", overridden: "Forward to Committee Review", reason: "Novel interdisciplinary approach not well-evaluated by current model parameters.", entity: "Grant: SERB-2026-AI-0042" },
    { model: "Placement Matching Agent", original: "Match Score: 42% — Skip", overridden: "Match Score Override: 78% — Include", reason: "Student is career-switching from mechanical engineering; prior skills highly transferable.", entity: "Student: Vikram Kumar (STU-2023-1455)" },
  ];

  return overrideDefs.map((def) => ({
    id: id("ovr"),
    timestamp: pastDate(Math.max(1, faker.number.int({ min: 3, max: 60 }))),
    modelName: def.model,
    originalDecision: def.original,
    overriddenTo: def.overridden,
    reason: def.reason,
    overriddenBy: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    affectedEntity: def.entity,
  }));
}

export function generateReportTemplates(): ReportTemplate[] {
  return [
    {
      id: id("tpl"),
      name: "Enrollment Summary Report",
      description: "Comprehensive enrollment statistics by department, program, and demographic breakdown.",
      category: "enrollment",
      parameters: [
        { name: "academicYear", type: "select", label: "Academic Year", required: true, options: [{ value: "2025-26", label: "2025-26" }, { value: "2024-25", label: "2024-25" }, { value: "2023-24", label: "2023-24" }] },
        { name: "department", type: "select", label: "Department", required: false, options: DEPARTMENTS.map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "_"), label: d })) },
        { name: "startDate", type: "date", label: "Start Date", required: true },
        { name: "endDate", type: "date", label: "End Date", required: true },
      ],
      lastGenerated: pastDate(Math.max(1, 5)),
    },
    {
      id: id("tpl"),
      name: "Compliance Audit Report",
      description: "Detailed compliance status across all regulatory frameworks with deviation history and remediation progress.",
      category: "compliance",
      parameters: [
        { name: "framework", type: "select", label: "Framework", required: true, options: [{ value: "all", label: "All Frameworks" }, { value: "gdpr", label: "GDPR" }, { value: "ferpa", label: "FERPA" }, { value: "dpdp", label: "DPDP Act" }, { value: "iso27001", label: "ISO 27001" }] },
        { name: "startDate", type: "date", label: "Period Start", required: true },
        { name: "endDate", type: "date", label: "Period End", required: true },
      ],
      lastGenerated: pastDate(Math.max(1, 12)),
    },
    {
      id: id("tpl"),
      name: "Financial Statement",
      description: "Budget utilization, expenditure breakdown, and financial health indicators by department.",
      category: "financial",
      parameters: [
        { name: "quarter", type: "select", label: "Quarter", required: true, options: [{ value: "q1", label: "Q1 (Jan-Mar)" }, { value: "q2", label: "Q2 (Apr-Jun)" }, { value: "q3", label: "Q3 (Jul-Sep)" }, { value: "q4", label: "Q4 (Oct-Dec)" }] },
        { name: "fiscalYear", type: "select", label: "Fiscal Year", required: true, options: [{ value: "2025-26", label: "2025-26" }, { value: "2024-25", label: "2024-25" }] },
        { name: "department", type: "select", label: "Department", required: false, options: DEPARTMENTS.map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "_"), label: d })) },
      ],
      lastGenerated: pastDate(Math.max(1, 20)),
    },
    {
      id: id("tpl"),
      name: "Department Performance Dashboard",
      description: "Key performance indicators per department including enrollment, retention, graduation, and placement rates.",
      category: "performance",
      parameters: [
        { name: "department", type: "select", label: "Department", required: true, options: DEPARTMENTS.map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "_"), label: d })) },
        { name: "academicYear", type: "select", label: "Academic Year", required: true, options: [{ value: "2025-26", label: "2025-26" }, { value: "2024-25", label: "2024-25" }] },
      ],
      lastGenerated: pastDate(Math.max(1, 8)),
    },
    {
      id: id("tpl"),
      name: "Student Retention Analysis",
      description: "Deep-dive into student retention patterns, at-risk cohorts, and intervention effectiveness.",
      category: "enrollment",
      parameters: [
        { name: "cohortYear", type: "select", label: "Cohort Year", required: true, options: [{ value: "2025", label: "2025 Cohort" }, { value: "2024", label: "2024 Cohort" }, { value: "2023", label: "2023 Cohort" }] },
        { name: "riskLevel", type: "select", label: "Risk Level Filter", required: false, options: [{ value: "all", label: "All Levels" }, { value: "high", label: "High Risk" }, { value: "medium", label: "Medium Risk" }, { value: "low", label: "Low Risk" }] },
      ],
    },
    {
      id: id("tpl"),
      name: "AI Governance Summary",
      description: "Overview of AI model performance, bias assessments, override frequency, and fairness compliance.",
      category: "compliance",
      parameters: [
        { name: "startDate", type: "date", label: "Period Start", required: true },
        { name: "endDate", type: "date", label: "Period End", required: true },
      ],
    },
    {
      id: id("tpl"),
      name: "Research Output Report",
      description: "Research publications, citations, grant utilization, and collaboration metrics.",
      category: "performance",
      parameters: [
        { name: "department", type: "select", label: "Department", required: false, options: DEPARTMENTS.map((d) => ({ value: d.toLowerCase().replace(/\s+/g, "_"), label: d })) },
        { name: "startDate", type: "date", label: "Period Start", required: true },
        { name: "endDate", type: "date", label: "Period End", required: true },
      ],
      lastGenerated: pastDate(Math.max(1, 15)),
    },
    {
      id: id("tpl"),
      name: "Custom Data Export",
      description: "Flexible data export with custom field selection and filters for ad-hoc analysis.",
      category: "custom",
      parameters: [
        { name: "dataSource", type: "select", label: "Data Source", required: true, options: [{ value: "students", label: "Students" }, { value: "courses", label: "Courses" }, { value: "faculty", label: "Faculty" }, { value: "research", label: "Research" }] },
        { name: "format", type: "select", label: "Output Format", required: true, options: [{ value: "pdf", label: "PDF" }, { value: "csv", label: "CSV" }, { value: "xlsx", label: "Excel" }] },
        { name: "customFilter", type: "text", label: "Custom Filter (optional)", required: false },
      ],
    },
  ];
}

export function generateReports(): GeneratedReport[] {
  const templates = generateReportTemplates();

  const reportDefs = [
    { templateIdx: 0, status: "completed" as const, params: { academicYear: "2025-26", startDate: "2025-07-01", endDate: "2026-03-31" } },
    { templateIdx: 1, status: "completed" as const, params: { framework: "all", startDate: "2025-01-01", endDate: "2025-12-31" } },
    { templateIdx: 2, status: "completed" as const, params: { quarter: "q1", fiscalYear: "2025-26" } },
    { templateIdx: 3, status: "completed" as const, params: { department: "computer_science", academicYear: "2025-26" } },
    { templateIdx: 5, status: "completed" as const, params: { startDate: "2025-06-01", endDate: "2026-03-01" } },
    { templateIdx: 7, status: "failed" as const, params: { dataSource: "students", format: "xlsx", customFilter: "department=physics" } },
  ];

  return reportDefs.map((def) => {
    const template = templates[def.templateIdx];
    return {
      id: id("rpt"),
      templateId: template.id,
      templateName: template.name,
      status: def.status,
      parameters: Object.fromEntries(Object.entries(def.params).filter(([, v]) => v !== undefined)) as Record<string, string>,
      downloadUrl: def.status === "completed" ? `/api/admin/reports/download/${id("file")}` : undefined,
      generatedBy: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
      fileSize: def.status === "completed" ? faker.number.int({ min: 45_000, max: 2_500_000 }) : undefined,
      createdAt: pastDate(Math.max(1, faker.number.int({ min: 3, max: 45 }))),
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 10 }))),
    };
  });
}

export function generateSettings(): InstitutionSettings {
  return {
    name: "Glimmora Institute of Technology",
    shortName: "GIT",
    domain: "glimmora.edu",
    timezone: "Asia/Kolkata",
    locale: "en-IN",
    academicYear: "2025-26",
    logo: "/images/glimmora-logo.png",
    primaryColor: "#4F46E5",
    visibility: {
      shareWithMinistry: true,
      anonymizeData: true,
      publicProfile: true,
    },
    dataRetention: {
      studentRecords: 7,
      auditLogs: 3,
      analyticsData: 5,
    },
  };
}

export function generateSemesters(): Semester[] {
  return [
    { id: "sem_01", name: "Fall 2024", year: "2024", startDate: "2024-08-15", endDate: "2024-12-20", status: "completed", courseCount: 45, createdAt: "2024-06-01T00:00:00Z", updatedAt: "2024-12-20T00:00:00Z" },
    { id: "sem_02", name: "Spring 2025", year: "2025", startDate: "2025-01-10", endDate: "2025-05-15", status: "completed", courseCount: 48, createdAt: "2024-11-01T00:00:00Z", updatedAt: "2025-05-15T00:00:00Z" },
    { id: "sem_03", name: "Fall 2025", year: "2025", startDate: "2025-08-15", endDate: "2025-12-20", status: "completed", courseCount: 52, createdAt: "2025-06-01T00:00:00Z", updatedAt: "2025-12-20T00:00:00Z" },
    { id: "sem_04", name: "Spring 2026", year: "2026", startDate: "2026-01-12", endDate: "2026-05-20", status: "active", courseCount: 50, createdAt: "2025-11-01T00:00:00Z", updatedAt: "2026-04-01T00:00:00Z" },
    { id: "sem_05", name: "Fall 2026", year: "2026", startDate: "2026-08-18", endDate: "2026-12-22", status: "upcoming", courseCount: 0, createdAt: "2026-03-01T00:00:00Z", updatedAt: "2026-03-01T00:00:00Z" },
  ];
}

// Single source of truth for the seed course list — used by both
// generateCatalogs() and generateCourses() so codes always line up.
type CourseSeed = {
  code: string;
  name: string;
  dept: string;
  credits: number;
  type: CourseType;
  /** L:T:P weekly hours */
  ltp: [number, number, number];
};

const COURSE_SEEDS: CourseSeed[] = [
  { code: "CS301", name: "Data Structures & Algorithms", dept: "Computer Science", credits: 4, type: "core", ltp: [3, 0, 2] },
  { code: "CS405", name: "Machine Learning", dept: "Computer Science", credits: 4, type: "core", ltp: [3, 1, 2] },
  { code: "CS302", name: "Operating Systems", dept: "Computer Science", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "CS410", name: "Computer Networks", dept: "Computer Science", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "CS420", name: "Cloud Computing", dept: "Computer Science", credits: 3, type: "programme_elective", ltp: [3, 0, 0] },
  { code: "EE201", name: "Circuit Analysis", dept: "Electrical Engineering", credits: 4, type: "core", ltp: [3, 0, 2] },
  { code: "EE305", name: "Digital Signal Processing", dept: "Electrical Engineering", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "EE410", name: "VLSI Design", dept: "Electrical Engineering", credits: 4, type: "programme_elective", ltp: [3, 0, 2] },
  { code: "ME201", name: "Thermodynamics", dept: "Mechanical Engineering", credits: 4, type: "core", ltp: [3, 1, 0] },
  { code: "ME302", name: "Fluid Mechanics", dept: "Mechanical Engineering", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "ME405", name: "Robotics Engineering", dept: "Mechanical Engineering", credits: 3, type: "programme_elective", ltp: [3, 0, 0] },
  { code: "MA201", name: "Linear Algebra", dept: "Mathematics", credits: 3, type: "core", ltp: [3, 1, 0] },
  { code: "MA301", name: "Probability & Statistics", dept: "Mathematics", credits: 3, type: "core", ltp: [3, 1, 0] },
  { code: "PH201", name: "Quantum Mechanics", dept: "Physics", credits: 4, type: "core", ltp: [3, 1, 0] },
  { code: "PH305", name: "Solid State Physics", dept: "Physics", credits: 3, type: "programme_elective", ltp: [3, 0, 0] },
  { code: "BA301", name: "Financial Management", dept: "Business Administration", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "BA405", name: "Strategic Marketing", dept: "Business Administration", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "BA410", name: "Operations Research", dept: "Business Administration", credits: 3, type: "programme_elective", ltp: [3, 0, 0] },
  { code: "BT201", name: "Molecular Biology", dept: "Biotechnology", credits: 4, type: "core", ltp: [3, 0, 2] },
  { code: "BT305", name: "Genetic Engineering", dept: "Biotechnology", credits: 4, type: "core", ltp: [3, 0, 2] },
  { code: "CE201", name: "Structural Analysis", dept: "Civil Engineering", credits: 4, type: "core", ltp: [3, 1, 0] },
  { code: "CE302", name: "Geotechnical Engineering", dept: "Civil Engineering", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "CS450", name: "Deep Learning", dept: "Computer Science", credits: 4, type: "programme_elective", ltp: [3, 0, 2] },
  { code: "EE420", name: "Power Systems", dept: "Electrical Engineering", credits: 3, type: "core", ltp: [3, 0, 0] },
  { code: "BA420", name: "Entrepreneurship & Innovation", dept: "Business Administration", credits: 3, type: "open_elective", ltp: [3, 0, 0] },
  // Open-elective examples — owned by Humanities-style cross-cutting "department"
  { code: "HUM101", name: "Communication Skills", dept: "Humanities", credits: 2, type: "open_elective", ltp: [2, 0, 0] },
  { code: "HUM202", name: "Professional Ethics", dept: "Humanities", credits: 2, type: "open_elective", ltp: [2, 0, 0] },
];

function deptIdFromName(name: string): string {
  return `dept_${name.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "")}`;
}

function catalogIdFromCode(code: string): string {
  return `cat_${code.toLowerCase()}`;
}

export function generateDepartments(): Department[] {
  const now = new Date().toISOString();
  // Include cross-cutting "Humanities" host for open electives
  const allDepts = [...DEPARTMENTS, "Humanities"];
  return allDepts.map((name) => ({
    id: deptIdFromName(name),
    name,
    code: name
      .split(" ")
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 4),
    hodName: `Dr. ${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
    status: "active" as const,
    createdAt: now,
    updatedAt: now,
  }));
}

export function generateCatalogs(): CourseCatalog[] {
  const now = new Date().toISOString();
  return COURSE_SEEDS.map((seed) => {
    const [l, t, p] = seed.ltp;
    return {
      id: catalogIdFromCode(seed.code),
      code: seed.code,
      name: seed.name,
      description: `Comprehensive study of ${seed.name.toLowerCase()} covering fundamental and advanced topics in ${seed.dept}.`,
      syllabus:
        `Module 1: Foundations and core concepts of ${seed.name.toLowerCase()}.\n` +
        `Module 2: Theoretical frameworks and analytical methods.\n` +
        `Module 3: Practical applications, case studies, and lab work.\n` +
        `Module 4: Contemporary research directions and industry practice.\n` +
        `Module 5: Integrative project work and presentation.`,
      regulation: "R22",
      credits: seed.credits,
      courseType: seed.type,
      owningDepartmentId: deptIdFromName(seed.dept),
      owningDepartmentName: seed.dept,
      lectureHours: l,
      tutorialHours: t,
      practicalHours: p,
      status: "active" as const,
      offeringCount: 0, // hydrated live by handler from offerings count
      createdAt: now,
      updatedAt: now,
    };
  });
}

export function generateSections(programs: Program[]): Section[] {
  const now = new Date().toISOString();
  const sections: Section[] = [];
  for (const programme of programs.filter((p) => p.status === "active")) {
    // Generate 2 sections (A, B) per study year for the programme
    const yearsToCover = Math.min(programme.duration, 4);
    for (let year = 1; year <= yearsToCover; year++) {
      for (const letter of ["A", "B"]) {
        const sectionName = `${programme.name.split(" ")[0]}-${year}-${letter}`;
        sections.push({
          id: `sec_${programme.id}_y${year}_${letter.toLowerCase()}`,
          name: sectionName,
          programmeId: programme.id,
          programmeName: programme.name,
          department: programme.department,
          studyYear: year as 1 | 2 | 3 | 4 | 5,
          studentCount: faker.number.int({ min: 30, max: 60 }),
          status: "active" as const,
          createdAt: now,
          updatedAt: now,
        });
      }
    }
  }
  return sections;
}

export function generateCourses(): AdminCourse[] {
  const courseDefs: { code: string; name: string; dept: string; credits: number }[] =
    COURSE_SEEDS.map((s) => ({ code: s.code, name: s.name, dept: s.dept, credits: s.credits }));

  const facultyNames = [
    "Dr. Aarav Sharma", "Dr. Priya Patel", "Dr. Rahul Gupta", "Dr. Sneha Singh",
    "Dr. Vikram Kumar", "Dr. Ananya Reddy", "Dr. Rohan Nair", "Dr. Kavya Joshi",
    "Dr. Aditya Menon", "Dr. Meera Iyer", "Dr. Arjun Verma", "Dr. Divya Chatterjee",
    "Dr. Siddharth Banerjee", "Dr. Nisha Das", "Dr. Karan Mukherjee",
  ];

  // Map dept name → a representative active programme so we can backfill
  // programmeId/sectionId on legacy seed offerings. Engineering depts pick
  // the BTech programme; others fall back to whatever programme matches.
  const programmeByDept: Record<string, { progId: string; progName: string; section: string; studyYear: 1 | 2 | 3 | 4 }> = {
    "Computer Science": { progId: "prog_02", progName: "BTech Computer Science & Engineering", section: "BTech-2-A", studyYear: 2 },
    "Electrical Engineering": { progId: "prog_03", progName: "BTech Electronics & Communication", section: "BTech-2-A", studyYear: 2 },
    "Mechanical Engineering": { progId: "prog_02", progName: "BTech Computer Science & Engineering", section: "BTech-2-A", studyYear: 2 },
    "Mathematics": { progId: "prog_04", progName: "BSc Mathematics", section: "BSc-1-A", studyYear: 1 },
    "Physics": { progId: "prog_05", progName: "BSc Physics", section: "BSc-1-A", studyYear: 1 },
    "Business Administration": { progId: "prog_06", progName: "BBA Business Administration", section: "BBA-2-A", studyYear: 2 },
    "Biotechnology": { progId: "prog_02", progName: "BTech Computer Science & Engineering", section: "BTech-2-A", studyYear: 2 },
    "Civil Engineering": { progId: "prog_02", progName: "BTech Computer Science & Engineering", section: "BTech-2-A", studyYear: 2 },
    "Humanities": { progId: "prog_02", progName: "BTech Computer Science & Engineering", section: "BTech-1-A", studyYear: 1 },
  };

  return courseDefs.map((def, i) => {
    const statusRoll = faker.number.float({ min: 0, max: 1 });
    const status: "draft" | "active" | "archived" = statusRoll < 0.82 ? "active" : statusRoll < 0.92 ? "draft" : "archived";
    const maxCapacity = faker.number.int({ min: 120, max: 200 });
    const enrolledCount = status === "active" ? faker.number.int({ min: 30, max: Math.min(120, maxCapacity) }) : status === "draft" ? 0 : faker.number.int({ min: 80, max: maxCapacity });
    const faculty = facultyNames[i % facultyNames.length];
    const seed = COURSE_SEEDS[i];
    const [l, t, p] = seed.ltp;
    const prog = programmeByDept[def.dept] ?? programmeByDept["Computer Science"];
    // Section IDs follow the pattern produced by generateSections().
    // study-year letter "a" — match how generateSections() builds the id.
    const sectionId = `sec_${prog.progId}_y${prog.studyYear}_a`;

    return {
      id: `crs_${String(i + 1).padStart(3, "0")}`,
      code: def.code,
      name: def.name,
      description: `Comprehensive study of ${def.name.toLowerCase()} covering fundamental and advanced topics in ${def.dept}.`,
      credits: def.credits,
      department: def.dept,
      semesterId: "sem_04",
      semesterName: "Spring 2026",
      facultyId: `fac_${String((i % facultyNames.length) + 1).padStart(3, "0")}`,
      facultyName: faculty,
      enrolledCount,
      maxCapacity,
      status,
      // — Offering-shape fields backfilled —
      catalogId: catalogIdFromCode(def.code),
      academicYearId: "ay_02",
      academicYearName: "AY 2025-2026",
      studyYear: prog.studyYear,
      programmeId: prog.progId,
      programmeName: prog.progName,
      sectionId,
      sectionName: prog.section,
      courseType: seed.type,
      lectureHours: l,
      tutorialHours: t,
      practicalHours: p,
      syllabusSnapshot:
        `Module 1: Foundations and core concepts of ${def.name.toLowerCase()}.\n` +
        `Module 2: Theoretical frameworks and analytical methods.\n` +
        `Module 3: Practical applications, case studies, and lab work.\n` +
        `Module 4: Contemporary research directions and industry practice.\n` +
        `Module 5: Integrative project work and presentation.`,
      regulationSnapshot: "R22",
      creditsSnapshot: def.credits,
      createdAt: "2025-11-15T00:00:00Z",
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))),
    };
  });
}

// ── Programs & Degrees ──────────────────────────────────────────────────────

const PROGRAM_DATA: { name: string; department: string; duration: number; semesters: number; type: Program["degreeType"] }[] = [
  { name: "BSc Computer Science", department: "Computer Science", duration: 3, semesters: 6, type: "UG" },
  { name: "BTech Computer Science & Engineering", department: "Computer Science", duration: 4, semesters: 8, type: "UG" },
  { name: "BTech Electronics & Communication", department: "Electronics", duration: 4, semesters: 8, type: "UG" },
  { name: "BSc Mathematics", department: "Mathematics", duration: 3, semesters: 6, type: "UG" },
  { name: "BSc Physics", department: "Physics", duration: 3, semesters: 6, type: "UG" },
  { name: "BBA Business Administration", department: "Management", duration: 3, semesters: 6, type: "UG" },
  { name: "MSc Computer Science", department: "Computer Science", duration: 2, semesters: 4, type: "PG" },
  { name: "MTech Artificial Intelligence", department: "Computer Science", duration: 2, semesters: 4, type: "PG" },
  { name: "MBA", department: "Management", duration: 2, semesters: 4, type: "PG" },
  { name: "MSc Data Science", department: "Computer Science", duration: 2, semesters: 4, type: "PG" },
  { name: "PhD Computer Science", department: "Computer Science", duration: 4, semesters: 8, type: "PhD" },
  { name: "Diploma in Web Development", department: "Computer Science", duration: 1, semesters: 2, type: "Diploma" },
];

export function generatePrograms(): Program[] {
  return PROGRAM_DATA.map((p, i) => ({
    id: `prog_${String(i + 1).padStart(2, "0")}`,
    name: p.name,
    department: p.department,
    duration: p.duration,
    totalSemesters: p.semesters,
    degreeType: p.type,
    status: i < 10 ? "active" as const : "inactive" as const,
    studentCount: faker.number.int({ min: 20, max: 500 }),
    createdAt: faker.date.between({ from: "2024-01-01", to: "2025-06-01" }).toISOString(),
    updatedAt: faker.date.recent({ days: 60 }).toISOString(),
  }));
}

// ── Academic Years ──────────────────────────────────────────────────────────

const ACADEMIC_YEAR_DATA: { name: string; startDate: string; endDate: string; status: "upcoming" | "active" | "completed" }[] = [
  { name: "AY 2024-2025", startDate: "2024-08-01", endDate: "2025-05-31", status: "completed" },
  { name: "AY 2025-2026", startDate: "2025-08-01", endDate: "2026-05-31", status: "active" },
  { name: "AY 2026-2027", startDate: "2026-08-01", endDate: "2027-05-31", status: "upcoming" },
];

function deriveSemesterStatus(startDate: string, endDate: string): "upcoming" | "active" | "completed" {
  const now = Date.now();
  const start = new Date(startDate).getTime();
  const end = new Date(endDate).getTime();
  if (now < start) return "upcoming";
  if (now > end) return "completed";
  return "active";
}

export function generateAcademicYears(): AcademicYear[] {
  const now = new Date().toISOString();
  return ACADEMIC_YEAR_DATA.map((y, i) => {
    const yearStart = new Date(y.startDate);
    const yearEnd = new Date(y.endDate);
    const fallEnd = new Date(yearStart);
    fallEnd.setMonth(fallEnd.getMonth() + 4); // Aug → Dec
    const springStart = new Date(fallEnd);
    springStart.setDate(springStart.getDate() + 7); // 1 week break
    const yearLabel = y.name.replace("AY ", "").split("-")[0];

    const yearId = `ay_${String(i + 1).padStart(2, "0")}`;
    const fallSem: Semester = {
      id: `sem_${yearId}_fall`,
      name: `Fall ${yearLabel}`,
      year: yearLabel,
      startDate: yearStart.toISOString().split("T")[0],
      endDate: fallEnd.toISOString().split("T")[0],
      status: deriveSemesterStatus(yearStart.toISOString(), fallEnd.toISOString()),
      courseCount: faker.number.int({ min: 30, max: 60 }),
      academicYearId: yearId,
      createdAt: now,
      updatedAt: now,
    };
    const springSem: Semester = {
      id: `sem_${yearId}_spring`,
      name: `Spring ${Number(yearLabel) + 1}`,
      year: String(Number(yearLabel) + 1),
      startDate: springStart.toISOString().split("T")[0],
      endDate: yearEnd.toISOString().split("T")[0],
      status: deriveSemesterStatus(springStart.toISOString(), yearEnd.toISOString()),
      courseCount: faker.number.int({ min: 30, max: 60 }),
      academicYearId: yearId,
      createdAt: now,
      updatedAt: now,
    };

    return {
      id: yearId,
      name: y.name,
      startDate: y.startDate,
      endDate: y.endDate,
      status: y.status,
      semesters: [fallSem, springSem],
      createdAt: now,
      updatedAt: now,
    };
  });
}
