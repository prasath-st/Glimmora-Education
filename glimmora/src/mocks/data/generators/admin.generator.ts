import { faker } from "@faker-js/faker";
import type {
  AdminDashboard,
  InstitutionalAnalytics,
  CompliancePulse,
  ComplianceCategory,
  ComplianceDeviation,
  AuditLogEntry,
  AdminUser,
  RoleDefinition,
  Permission,
  BudgetOverview,
  BudgetAlert,
  AiModel,
  BiasReport,
  AiOverrideLog,
  AdminCredential,
  ReportTemplate,
  ReportParameter,
  GeneratedReport,
  InstitutionSettings,
  Semester,
  AdminCourse,
} from "@/lib/api/types/admin.types";
import type {
  PortalRole,
  RiskLevel,
  ComplianceStatus,
  CredentialStatus,
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

const ACTIONS_PER_MODULE = ["view", "create", "edit", "delete", "export"];

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

const ROLE_DISTRIBUTION: PortalRole[] = [
  ...Array(25).fill("student"),
  ...Array(15).fill("faculty"),
  ...Array(8).fill("admin"),
  ...Array(5).fill("research"),
  ...Array(4).fill("placement"),
  ...Array(3).fill("ministry"),
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
  {
    name: "Financial Aid Allocator",
    domain: "Financial Services",
    description: "Optimizes financial aid distribution based on need, merit, and institutional priorities while ensuring equitable access.",
    version: "2.0.1",
  },
  {
    name: "Faculty Workload Balancer",
    domain: "HR & Operations",
    description: "Analyzes and balances faculty teaching loads, research commitments, and administrative duties across departments.",
    version: "1.1.0",
  },
];

// ─── Generators ───────────────────────────────────────────────────────────────

export function generateAdminDashboard(): AdminDashboard {
  const byDepartment = DEPARTMENTS.map((name) => ({
    name,
    count: faker.number.int({ min: 800, max: 2200 }),
  }));
  const total = byDepartment.reduce((sum, d) => sum + d.count, 0);

  const enrollmentTrend = MONTHS.map((month) => ({
    month,
    count: faker.number.int({ min: 11200, max: 12800 }),
  }));

  return {
    enrollment: {
      total,
      trend: roundTo(faker.number.float({ min: 1.2, max: 4.8 }), 1),
      byDepartment,
    },
    retention: {
      rate: roundTo(faker.number.float({ min: 85, max: 89 }), 1),
      trend: roundTo(faker.number.float({ min: 0.5, max: 2.5 }), 1),
    },
    graduation: {
      rate: roundTo(faker.number.float({ min: 80, max: 84 }), 1),
      trend: roundTo(faker.number.float({ min: 0.3, max: 1.8 }), 1),
    },
    compliance: {
      score: faker.number.int({ min: 86, max: 91 }),
      status: "compliant" as ComplianceStatus,
      deviations: faker.number.int({ min: 2, max: 6 }),
    },
    facultyStudentRatio: roundTo(faker.number.float({ min: 15, max: 22 }), 1),
    enrollmentTrend,
  };
}

export function generateAnalytics(): InstitutionalAnalytics {
  const kpis = [
    {
      name: "Total Enrollment",
      value: 12347,
      previousValue: 11892,
      unit: "students",
      trend: "up" as const,
    },
    {
      name: "Retention Rate",
      value: 87.2,
      previousValue: 85.8,
      unit: "%",
      trend: "up" as const,
    },
    {
      name: "Graduation Rate",
      value: 82.1,
      previousValue: 81.5,
      unit: "%",
      trend: "up" as const,
    },
    {
      name: "Average GPA",
      value: 3.42,
      previousValue: 3.38,
      unit: "points",
      trend: "up" as const,
    },
    {
      name: "Placement Rate",
      value: 78.6,
      previousValue: 79.1,
      unit: "%",
      trend: "down" as const,
    },
    {
      name: "Faculty-Student Ratio",
      value: 18.3,
      previousValue: 18.7,
      unit: ":1",
      trend: "up" as const,
    },
    {
      name: "Research Output",
      value: 342,
      previousValue: 328,
      unit: "papers",
      trend: "up" as const,
    },
    {
      name: "Compliance Score",
      value: 88,
      previousValue: 85,
      unit: "score",
      trend: "up" as const,
    },
  ];

  const departmentComparison = DEPARTMENTS.map((department) => ({
    department,
    enrollment: faker.number.int({ min: 800, max: 2200 }),
    retention: roundTo(faker.number.float({ min: 78, max: 95 }), 1),
    graduation: roundTo(faker.number.float({ min: 72, max: 92 }), 1),
    avgGpa: roundTo(faker.number.float({ min: 3.0, max: 3.8 }), 2),
    placementRate: roundTo(faker.number.float({ min: 65, max: 95 }), 1),
  }));

  const yearlyTrends = Array.from({ length: 5 }, (_, i) => {
    const year = (2022 + i).toString();
    return {
      year,
      enrollment: faker.number.int({ min: 10500, max: 12500 }),
      retention: roundTo(faker.number.float({ min: 82, max: 89 }), 1),
      graduation: roundTo(faker.number.float({ min: 76, max: 84 }), 1),
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
      userRole: pick(["admin", "faculty", "student", "research", "placement", "ministry"] as PortalRole[]),
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
      role_change: `Changed role from ${pick(["student", "faculty"] as PortalRole[])} to ${pick(["admin", "research"] as PortalRole[])}`,
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
    const statusRoll = faker.number.float({ min: 0, max: 1 });
    const status: "active" | "inactive" | "suspended" =
      statusRoll < 0.82 ? "active" : statusRoll < 0.94 ? "inactive" : "suspended";

    return {
      id: id("usr"),
      email: faker.internet.email({ firstName, lastName, provider: "glimmora.edu" }).toLowerCase(),
      name,
      role,
      department: pick(DEPARTMENTS),
      status,
      lastLoginAt: status === "active" ? pastDate(Math.max(1, faker.number.int({ min: 1, max: 14 }))) : null,
      avatarUrl: faker.image.avatar(),
      phone: faker.phone.number({ style: "international" }),
      tenantId: "tenant_glimmora_main",
      createdAt: pastDate(Math.max(1, faker.number.int({ min: 90, max: 730 }))),
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))),
    };
  });
}

export function generateRoles(): RoleDefinition[] {
  const roleDefs: { role: PortalRole; label: string; description: string; userCount: number }[] = [
    { role: "admin", label: "Administrator", description: "Full system access with configuration and user management capabilities.", userCount: 8 },
    { role: "faculty", label: "Faculty", description: "Course management, student advising, and research collaboration tools.", userCount: 15 },
    { role: "student", label: "Student", description: "Access to personal academic records, courses, career services, and credentials.", userCount: 25 },
    { role: "research", label: "Research Coordinator", description: "Research project management, grant tracking, and publication oversight.", userCount: 5 },
    { role: "placement", label: "Placement Officer", description: "Job posting management, employer relations, and student placement tracking.", userCount: 4 },
    { role: "ministry", label: "Ministry Official", description: "Read-only access to institutional analytics, compliance reports, and aggregate data.", userCount: 3 },
  ];

  const permissionsByRole: Record<PortalRole, Record<string, string[]>> = {
    admin: {
      Dashboard: ["view"], Students: ["view", "create", "edit", "delete", "export"],
      Courses: ["view", "create", "edit", "delete", "export"], Research: ["view", "create", "edit", "export"],
      Compliance: ["view", "create", "edit", "export"], Users: ["view", "create", "edit", "delete"],
      AI: ["view", "create", "edit"], Reports: ["view", "create", "export"],
      Settings: ["view", "edit"],
    },
    faculty: {
      Dashboard: ["view"], Students: ["view", "export"],
      Courses: ["view", "create", "edit"], Research: ["view", "create", "edit", "export"],
      Compliance: ["view"], Users: [],
      AI: ["view"], Reports: ["view", "create"],
      Settings: ["view"],
    },
    student: {
      Dashboard: ["view"], Students: ["view"],
      Courses: ["view"], Research: ["view"],
      Compliance: [], Users: [],
      AI: [], Reports: ["view"],
      Settings: ["view"],
    },
    research: {
      Dashboard: ["view"], Students: ["view"],
      Courses: ["view"], Research: ["view", "create", "edit", "delete", "export"],
      Compliance: ["view"], Users: [],
      AI: ["view"], Reports: ["view", "create", "export"],
      Settings: ["view"],
    },
    placement: {
      Dashboard: ["view"], Students: ["view", "export"],
      Courses: ["view"], Research: [],
      Compliance: [], Users: [],
      AI: ["view"], Reports: ["view", "create", "export"],
      Settings: ["view"],
    },
    ministry: {
      Dashboard: ["view"], Students: ["view", "export"],
      Courses: ["view"], Research: ["view"],
      Compliance: ["view", "export"], Users: [],
      AI: ["view"], Reports: ["view", "export"],
      Settings: [],
    },
    super_admin: {
      Dashboard: ["view"], Students: ["view", "create", "edit", "delete", "export"],
      Courses: ["view", "create", "edit", "delete", "export"], Research: ["view", "create", "edit", "export"],
      Compliance: ["view", "create", "edit", "export"], Users: ["view", "create", "edit", "delete"],
      AI: ["view", "create", "edit"], Reports: ["view", "create", "export"],
      Settings: ["view", "edit"],
    },
  };

  return roleDefs.map(({ role, label, description, userCount }) => {
    const rolePerms = permissionsByRole[role];
    const permissions: Permission[] = MODULES.map((mod) => ({
      module: mod,
      actions: ACTIONS_PER_MODULE.map((action) => ({
        name: action,
        allowed: (rolePerms[mod] || []).includes(action),
      })),
    }));

    return { role, label, description, userCount, permissions };
  });
}

export function generateBudgetOverview(): BudgetOverview {
  const totalBudget = 45_000_000;

  const deptAllocations = [
    { department: "Computer Science", allocated: 8_500_000 },
    { department: "Electrical Engineering", allocated: 7_200_000 },
    { department: "Mechanical Engineering", allocated: 6_800_000 },
    { department: "Business Administration", allocated: 5_500_000 },
    { department: "Biotechnology", allocated: 5_200_000 },
    { department: "Mathematics", allocated: 4_100_000 },
    { department: "Physics", allocated: 4_000_000 },
    { department: "Civil Engineering", allocated: 3_700_000 },
  ];

  const byDepartment = deptAllocations.map((d) => {
    const utilizationRate = faker.number.float({ min: 0.62, max: 0.88 });
    return {
      department: d.department,
      allocated: d.allocated,
      spent: Math.round(d.allocated * utilizationRate),
    };
  });

  const totalSpent = byDepartment.reduce((sum, d) => sum + d.spent, 0);

  const monthlySpend = MONTHS.map((month) => ({
    month,
    amount: faker.number.int({ min: 2_800_000, max: 4_200_000 }),
  }));

  const alerts: BudgetAlert[] = [
    {
      id: id("ba"),
      department: "Computer Science",
      type: "approaching_limit" as const,
      message: "Computer Science department has utilized 87% of annual budget with 3 months remaining.",
      severity: "medium" as RiskLevel,
      date: pastDate(Math.max(1, 3)),
    },
    {
      id: id("ba"),
      department: "Biotechnology",
      type: "overspend" as const,
      message: "Biotechnology lab equipment purchases exceeded quarterly allocation by ₹12L.",
      severity: "high" as RiskLevel,
      date: pastDate(Math.max(1, 7)),
    },
    {
      id: id("ba"),
      department: "Business Administration",
      type: "anomaly" as const,
      message: "Unusual spike in travel expenses detected — 340% increase over last month.",
      severity: "medium" as RiskLevel,
      date: pastDate(Math.max(1, 2)),
    },
    {
      id: id("ba"),
      department: "Physics",
      type: "approaching_limit" as const,
      message: "Research grant fund for Physics nearly exhausted — 94% utilized.",
      severity: "low" as RiskLevel,
      date: pastDate(Math.max(1, 10)),
    },
  ];

  return {
    totalBudget,
    spent: totalSpent,
    remaining: totalBudget - totalSpent,
    utilizationRate: roundTo((totalSpent / totalBudget) * 100, 1),
    byDepartment,
    monthlySpend,
    alerts,
  };
}

export function generateAiModels(): AiModel[] {
  return AI_MODEL_DEFINITIONS.map((def) => {
    const statuses: ModelStatus[] = ["active", "active", "active", "active", "training", "inactive", "active"];
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
    { modelIdx: 3, overallScore: 78 },
    { modelIdx: 5, overallScore: 95 },
    { modelIdx: 6, overallScore: 84 },
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
    { model: "Financial Aid Allocator", original: "Partial Scholarship (50%)", overridden: "Full Scholarship (100%)", reason: "Family financial situation changed drastically after parent job loss — verified by documentation.", entity: "Student: Rohan Gupta (STU-2025-0334)" },
    { model: "Curriculum Advisor", original: "Drop Advanced ML Course", overridden: "Continue with Additional Support", reason: "Student is struggling but highly motivated; dropping course would delay graduation by a semester.", entity: "Student: Kavya Singh (STU-2024-1102)" },
    { model: "Compliance Monitor", original: "Flag as Non-Compliant", overridden: "Compliant with Conditions", reason: "Department submitted corrective action plan; full compliance expected within 30 days.", entity: "Department: Biotechnology" },
    { model: "Student Risk Predictor", original: "Low Risk — No Action", overridden: "Medium Risk — Schedule Check-in", reason: "Faculty advisor noted concerning behavioral changes not reflected in academic metrics.", entity: "Student: Siddharth Reddy (STU-2024-0756)" },
    { model: "Research Optimization Engine", original: "Reject Grant Application", overridden: "Forward to Committee Review", reason: "Novel interdisciplinary approach not well-evaluated by current model parameters.", entity: "Grant: SERB-2026-AI-0042" },
    { model: "Placement Matching Agent", original: "Match Score: 42% — Skip", overridden: "Match Score Override: 78% — Include", reason: "Student is career-switching from mechanical engineering; prior skills highly transferable.", entity: "Student: Vikram Kumar (STU-2023-1455)" },
    { model: "Faculty Workload Balancer", original: "Assign 4 Courses Next Semester", overridden: "Assign 2 Courses + Research Release", reason: "Faculty member received major research grant requiring dedicated time allocation.", entity: "Faculty: Dr. Meera Nair (FAC-2019-0088)" },
    { model: "Financial Aid Allocator", original: "Merit Scholarship Renewal — Deny", overridden: "Merit Scholarship Renewal — Approve (Probationary)", reason: "GPA dip was due to documented medical leave; student has since recovered.", entity: "Student: Ananya Joshi (STU-2024-0667)" },
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

export function generateCredentials(count: number = 30): AdminCredential[] {
  const credentialTitles: Record<string, string[]> = {
    degree: ["Bachelor of Technology in Computer Science", "Master of Science in Data Analytics", "Bachelor of Engineering in Electrical", "Master of Business Administration", "Bachelor of Science in Mathematics"],
    certificate: ["AWS Certified Solutions Architect", "Google Cloud Professional", "TensorFlow Developer Certificate", "Cisco CCNA Certification", "Project Management Professional"],
    badge: ["Dean's List — Fall 2025", "Hackathon Winner 2025", "Research Excellence Award", "Community Service Honor", "Academic Integrity Pledge"],
    transcript: ["Official Transcript — Spring 2026", "Official Transcript — Fall 2025", "Consolidated Marksheet 2023-2026", "Semester Grade Report", "Transfer Credit Evaluation"],
  };

  const types: ("degree" | "certificate" | "badge" | "transcript")[] = ["degree", "certificate", "badge", "transcript"];
  const statuses: CredentialStatus[] = ["active", "active", "active", "pending_verification", "revoked", "expired"];

  return Array.from({ length: count }, () => {
    const type = pick(types);
    const title = pick(credentialTitles[type]);
    const status = pick(statuses);
    const firstName = pick(FIRST_NAMES);
    const lastName = pick(LAST_NAMES);

    return {
      id: id("cred"),
      studentName: `${firstName} ${lastName}`,
      studentId: id("stu"),
      title,
      type,
      status,
      issuedDate: pastDate(Math.max(1, faker.number.int({ min: 30, max: 365 }))),
      verificationHash: status === "active" ? faker.string.hexadecimal({ length: 64, casing: "lower" }).slice(2) : undefined,
      revokedAt: status === "revoked" ? pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))) : undefined,
      revokedReason: status === "revoked" ? pick(["Academic integrity violation", "Fraudulent documentation", "Administrative error — reissue pending", "Student request"]) : undefined,
      createdAt: pastDate(Math.max(1, faker.number.int({ min: 30, max: 400 }))),
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))),
    };
  });
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

export function generateCourses(): AdminCourse[] {
  const courseDefs: { code: string; name: string; dept: string; credits: number }[] = [
    { code: "CS301", name: "Data Structures & Algorithms", dept: "Computer Science", credits: 4 },
    { code: "CS405", name: "Machine Learning", dept: "Computer Science", credits: 4 },
    { code: "CS302", name: "Operating Systems", dept: "Computer Science", credits: 3 },
    { code: "CS410", name: "Computer Networks", dept: "Computer Science", credits: 3 },
    { code: "CS420", name: "Cloud Computing", dept: "Computer Science", credits: 3 },
    { code: "EE201", name: "Circuit Analysis", dept: "Electrical Engineering", credits: 4 },
    { code: "EE305", name: "Digital Signal Processing", dept: "Electrical Engineering", credits: 3 },
    { code: "EE410", name: "VLSI Design", dept: "Electrical Engineering", credits: 4 },
    { code: "ME201", name: "Thermodynamics", dept: "Mechanical Engineering", credits: 4 },
    { code: "ME302", name: "Fluid Mechanics", dept: "Mechanical Engineering", credits: 3 },
    { code: "ME405", name: "Robotics Engineering", dept: "Mechanical Engineering", credits: 3 },
    { code: "MA201", name: "Linear Algebra", dept: "Mathematics", credits: 3 },
    { code: "MA301", name: "Probability & Statistics", dept: "Mathematics", credits: 3 },
    { code: "PH201", name: "Quantum Mechanics", dept: "Physics", credits: 4 },
    { code: "PH305", name: "Solid State Physics", dept: "Physics", credits: 3 },
    { code: "BA301", name: "Financial Management", dept: "Business Administration", credits: 3 },
    { code: "BA405", name: "Strategic Marketing", dept: "Business Administration", credits: 3 },
    { code: "BA410", name: "Operations Research", dept: "Business Administration", credits: 3 },
    { code: "BT201", name: "Molecular Biology", dept: "Biotechnology", credits: 4 },
    { code: "BT305", name: "Genetic Engineering", dept: "Biotechnology", credits: 4 },
    { code: "CE201", name: "Structural Analysis", dept: "Civil Engineering", credits: 4 },
    { code: "CE302", name: "Geotechnical Engineering", dept: "Civil Engineering", credits: 3 },
    { code: "CS450", name: "Deep Learning", dept: "Computer Science", credits: 4 },
    { code: "EE420", name: "Power Systems", dept: "Electrical Engineering", credits: 3 },
    { code: "BA420", name: "Entrepreneurship & Innovation", dept: "Business Administration", credits: 3 },
  ];

  const facultyNames = [
    "Dr. Aarav Sharma", "Dr. Priya Patel", "Dr. Rahul Gupta", "Dr. Sneha Singh",
    "Dr. Vikram Kumar", "Dr. Ananya Reddy", "Dr. Rohan Nair", "Dr. Kavya Joshi",
    "Dr. Aditya Menon", "Dr. Meera Iyer", "Dr. Arjun Verma", "Dr. Divya Chatterjee",
    "Dr. Siddharth Banerjee", "Dr. Nisha Das", "Dr. Karan Mukherjee",
  ];

  return courseDefs.map((def, i) => {
    const statusRoll = faker.number.float({ min: 0, max: 1 });
    const status: "draft" | "active" | "archived" = statusRoll < 0.82 ? "active" : statusRoll < 0.92 ? "draft" : "archived";
    const maxCapacity = faker.number.int({ min: 120, max: 200 });
    const enrolledCount = status === "active" ? faker.number.int({ min: 30, max: Math.min(120, maxCapacity) }) : status === "draft" ? 0 : faker.number.int({ min: 80, max: maxCapacity });
    const faculty = facultyNames[i % facultyNames.length];

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
      createdAt: "2025-11-15T00:00:00Z",
      updatedAt: pastDate(Math.max(1, faker.number.int({ min: 1, max: 30 }))),
    };
  });
}
