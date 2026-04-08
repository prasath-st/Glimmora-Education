import { faker } from "@faker-js/faker";
import type {
  MinistryDashboard,
  InstitutionSummary,
  InstitutionDetail,
  MinistryCompliance,
  SimulationResult,
  ScenarioComparison,
  MinistryReport,
  QualityIndicator,
  MinistryBudget,
  MinistrySettings,
} from "@/lib/api/types/ministry.types";
import type { ComplianceStatus, RiskLevel } from "@/lib/api/types/common.types";

faker.seed(47);

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

// ─── Realistic Indian Institution Data ───────────────────────────────────────

const REGIONS = ["North", "South", "East", "West", "Central"] as const;

const CITIES_BY_REGION: Record<string, string[]> = {
  North: ["New Delhi", "Lucknow", "Chandigarh", "Jaipur", "Dehradun", "Varanasi", "Amritsar", "Shimla", "Agra"],
  South: ["Bangalore", "Chennai", "Hyderabad", "Thiruvananthapuram", "Coimbatore", "Mysore", "Kochi", "Visakhapatnam", "Madurai"],
  East: ["Kolkata", "Bhubaneswar", "Patna", "Guwahati", "Ranchi", "Siliguri", "Imphal", "Shillong"],
  West: ["Mumbai", "Pune", "Ahmedabad", "Goa", "Baroda", "Surat", "Nagpur", "Indore", "Nashik"],
  Central: ["Bhopal", "Raipur", "Jabalpur", "Allahabad", "Kanpur", "Gwalior"],
};

const UNIVERSITY_NAMES = [
  "Indian Institute of Technology Delhi",
  "Indian Institute of Technology Bombay",
  "Indian Institute of Technology Madras",
  "Indian Institute of Technology Kharagpur",
  "Indian Institute of Technology Kanpur",
  "Jawaharlal Nehru University",
  "University of Delhi",
  "Banaras Hindu University",
  "Jadavpur University",
  "Anna University",
  "Savitribai Phule Pune University",
  "University of Hyderabad",
  "Aligarh Muslim University",
  "Osmania University",
  "Manipal Academy of Higher Education",
];

const COLLEGE_NAMES = [
  "St. Xavier's College Mumbai",
  "Loyola College Chennai",
  "Presidency College Kolkata",
  "Miranda House New Delhi",
  "Lady Shri Ram College for Women",
  "Hindu College Delhi",
  "Fergusson College Pune",
  "Christ University Bangalore",
  "Madras Christian College",
  "St. Stephen's College Delhi",
  "Ramjas College Delhi",
  "Kirori Mal College Delhi",
  "Hansraj College Delhi",
  "Sri Venkateswara College Delhi",
  "Gargi College Delhi",
];

const INSTITUTE_NAMES = [
  "Indian Statistical Institute Kolkata",
  "Indian Institute of Science Bangalore",
  "National Institute of Technology Trichy",
  "National Institute of Technology Warangal",
  "National Institute of Technology Surathkal",
  "BITS Pilani",
  "Indian Institute of Management Ahmedabad",
  "Indian Institute of Management Bangalore",
  "National Institute of Design Ahmedabad",
  "Indian Institute of Information Technology Allahabad",
  "National Law School of India University",
  "Tata Institute of Fundamental Research",
  "Indian Institute of Space Science and Technology",
  "National Institute of Technology Rourkela",
  "National Institute of Technology Calicut",
];

const DEPARTMENTS = [
  "Computer Science & Engineering",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Civil Engineering",
  "Biotechnology",
  "Physics",
  "Chemistry",
  "Mathematics & Statistics",
  "Management Studies",
  "Humanities & Social Sciences",
  "Electronics & Communication",
  "Chemical Engineering",
  "Aerospace Engineering",
  "Environmental Science",
];

const CHANCELLOR_NAMES = [
  "Prof. Rajesh Kumar Sharma",
  "Dr. Meenakshi Sundaram",
  "Prof. Anil Kumar Gupta",
  "Dr. Sujata Banerjee",
  "Prof. Venkataraman Iyer",
  "Dr. Priya Nair",
  "Prof. Ashok Kumar Mishra",
  "Dr. Lakshmi Devi Reddy",
  "Prof. Suresh Chandra Das",
  "Dr. Ananya Ghosh",
  "Prof. Harish Chandra Verma",
  "Dr. Kavitha Subramaniam",
  "Prof. Mohan Lal Aggarwal",
  "Dr. Deepika Mehta",
  "Prof. Gopalakrishnan Nambiar",
  "Dr. Padma Vasudevan",
  "Prof. Rameshwar Prasad Singh",
  "Dr. Saraswathi Rajan",
  "Prof. Dilip Kumar Bose",
  "Dr. Nirmala Srinivasan",
  "Prof. Kishore Mahapatra",
  "Dr. Usha Patel",
  "Prof. Biswanath Roy",
  "Dr. Malathi Krishnamurthy",
  "Prof. Jagdish Prasad Tiwari",
  "Dr. Revathi Gopalan",
  "Prof. Satish Chandra Misra",
  "Dr. Bhagyalakshmi Rao",
  "Prof. Amitabh Dutta",
  "Dr. Vijayalakshmi Hegde",
  "Prof. Pankaj Kumar Jha",
  "Dr. Indira Raghavan",
  "Prof. Srinivas Murthy",
  "Dr. Geeta Sharma",
  "Prof. Debashish Mukherjee",
  "Dr. Thulasi Bai",
  "Prof. Raghunath Mishra",
  "Dr. Sumitra Deshpande",
  "Prof. Manoj Kumar Pandey",
  "Dr. Jayashree Menon",
  "Prof. Shyam Sundar Yadav",
  "Dr. Aruna Kamath",
  "Prof. Tapas Kumar Sen",
  "Dr. Prema Chandrasekhar",
  "Prof. Ashutosh Bhattacharya",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const DEVIATION_DESCRIPTIONS = [
  "Data privacy policy not updated per DPDP Act 2023 guidelines",
  "Student grievance redressal mechanism response time exceeds SLA",
  "Faculty workload exceeds UGC mandated maximum contact hours",
  "Incomplete mandatory disclosure on institution website",
  "Delayed submission of annual quality assurance report",
  "Non-compliance with reservation policy in faculty recruitment",
  "Library resource allocation below NAAC prescribed minimum",
  "Research ethics committee not constituted as per UGC norms",
  "Examination conduct irregularity reported by students",
  "Fee structure revision without regulatory approval",
  "Placement data discrepancy in NIRF submission",
  "Lab safety audit overdue by more than 6 months",
  "Student mentor ratio exceeds AICTE recommended limit",
  "Gender sensitization committee meeting frequency below norms",
  "Environmental audit pending beyond statutory deadline",
  "Anti-ragging committee report not filed within due date",
  "Internal quality assurance cell meetings below minimum frequency",
  "Disability accessibility infrastructure non-compliant",
  "Financial audit findings pending resolution beyond 90 days",
  "Student feedback mechanism not implemented across all departments",
];

const SIMULATION_INSIGHTS = {
  budget: [
    "A 15% budget increase yields diminishing returns after year 3 without complementary faculty hiring",
    "Infrastructure investment shows strongest ROI when paired with digital learning initiatives",
    "Regional disparity in budget utilization suggests need for capacity building in Eastern institutions",
    "Research funding allocation of 20%+ correlates with 35% improvement in institutional rankings",
    "Scholarship expansion to 25% of budget improves enrollment diversity by 18% within 2 years",
  ],
  hiring: [
    "Hiring 500 additional faculty nationally reduces student-faculty ratio from 24:1 to 18:1",
    "Targeted hiring in STEM disciplines shows 2.3x return on research output within 3 years",
    "Faculty retention improves by 22% when combined with competitive compensation revision",
    "PhD-qualified faculty hiring in tier-2 institutions closes quality gap by 15 percentage points",
    "Industry-experienced faculty hiring improves placement rates by 12% on average",
  ],
  enrollment: [
    "Expanding enrollment by 10% without proportional infrastructure investment decreases quality scores",
    "Online program enrollment growth of 25% achievable with existing digital infrastructure",
    "Rural enrollment increases 30% with satellite campus and transportation subsidy combination",
    "International student enrollment grows 3x with simplified visa processing and scholarship bundling",
    "Vocational program enrollment responds most strongly to industry partnership announcements",
  ],
  policy: [
    "Mandatory accreditation renewal within 5 years improves compliance scores by 28%",
    "Performance-linked funding model increases institutional accountability metrics by 35%",
    "Standardized learning outcome assessment framework reduces inter-institutional quality variance",
    "National credit transfer framework increases student mobility by 40% within 2 years",
    "Open educational resource mandate reduces student textbook expenditure by 60%",
  ],
};

// ─── Cached institutions for cross-generator consistency ─────────────────────

let _cachedInstitutions: InstitutionSummary[] | null = null;

function getOrGenerateInstitutions(count: number = 45): InstitutionSummary[] {
  if (_cachedInstitutions && _cachedInstitutions.length === count) {
    return _cachedInstitutions;
  }

  // Reset seed for deterministic generation
  faker.seed(47);

  const allNames = [
    ...UNIVERSITY_NAMES.map((n) => ({ name: n, type: "university" as const })),
    ...COLLEGE_NAMES.map((n) => ({ name: n, type: "college" as const })),
    ...INSTITUTE_NAMES.map((n) => ({ name: n, type: "institute" as const })),
  ];

  const institutions: InstitutionSummary[] = [];

  for (let i = 0; i < count; i++) {
    const entry = allNames[i % allNames.length];
    const region = REGIONS[i % REGIONS.length];
    const cities = CITIES_BY_REGION[region];
    const city = cities[i % cities.length];

    const complianceScore = faker.number.int({ min: 52, max: 98 });
    let complianceStatus: ComplianceStatus = "compliant";
    if (complianceScore < 60) complianceStatus = "non_compliant";
    else if (complianceScore < 75) complianceStatus = "at_risk";

    const enrollmentBase = entry.type === "university"
      ? faker.number.int({ min: 15000, max: 50000 })
      : entry.type === "college"
        ? faker.number.int({ min: 2000, max: 12000 })
        : faker.number.int({ min: 3000, max: 20000 });

    const accreditationOptions = ["accredited", "provisional", "under_review", "expired"] as const;
    const accreditationWeights = [0.65, 0.2, 0.1, 0.05];
    const accreditationRand = faker.number.float({ min: 0, max: 1 });
    let accreditationStatus: InstitutionSummary["accreditationStatus"] = "accredited";
    let cumWeight = 0;
    for (let j = 0; j < accreditationOptions.length; j++) {
      cumWeight += accreditationWeights[j];
      if (accreditationRand <= cumWeight) {
        accreditationStatus = accreditationOptions[j];
        break;
      }
    }

    institutions.push({
      id: id("inst"),
      name: entry.name,
      type: entry.type,
      region,
      city,
      enrollment: enrollmentBase,
      retentionRate: roundTo(faker.number.float({ min: 72, max: 96 }), 1),
      graduationRate: roundTo(faker.number.float({ min: 62, max: 94 }), 1),
      complianceScore,
      complianceStatus,
      placementRate: roundTo(faker.number.float({ min: 55, max: 95 }), 1),
      facultyStudentRatio: roundTo(faker.number.float({ min: 10, max: 30 }), 1),
      researchOutput: faker.number.int({ min: 20, max: 800 }),
      ranking: i + 1,
      accreditationStatus,
    });
  }

  _cachedInstitutions = institutions;
  return institutions;
}

// ─── Generator Functions ─────────────────────────────────────────────────────

export function generateInstitutions(count: number = 45): InstitutionSummary[] {
  return getOrGenerateInstitutions(count);
}

export function generateMinistryDashboard(): MinistryDashboard {
  const institutions = getOrGenerateInstitutions();

  const compliant = institutions.filter((i) => i.complianceStatus === "compliant").length;
  const atRisk = institutions.filter((i) => i.complianceStatus === "at_risk").length;
  const nonCompliant = institutions.filter((i) => i.complianceStatus === "non_compliant").length;

  const totalEnrollment = institutions.reduce((sum, i) => sum + i.enrollment, 0);
  // Target ~580K so we adjust
  const enrollmentScale = 580000 / totalEnrollment;
  const scaledEnrollment = Math.round(totalEnrollment * enrollmentScale);

  const byRegion = REGIONS.map((region) => {
    const regionInsts = institutions.filter((i) => i.region === region);
    const regionEnrollment = regionInsts.reduce((sum, i) => sum + i.enrollment, 0);
    return { region, count: Math.round(regionEnrollment * enrollmentScale) };
  });

  const avgGradRate = roundTo(
    institutions.reduce((sum, i) => sum + i.graduationRate, 0) / institutions.length,
    1,
  );

  const avgCompliance = roundTo(
    institutions.reduce((sum, i) => sum + i.complianceScore, 0) / institutions.length,
    1,
  );

  const totalDeviations = institutions.filter((i) => i.complianceStatus !== "compliant").length * 2 +
    faker.number.int({ min: 3, max: 8 });

  return {
    institutions: {
      total: institutions.length,
      compliant,
      atRisk,
      nonCompliant,
    },
    enrollment: {
      national: scaledEnrollment,
      trend: roundTo(faker.number.float({ min: 2.5, max: 5.8 }), 1),
      byRegion,
    },
    graduation: {
      nationalRate: Math.min(avgGradRate, 78.4),
      trend: roundTo(faker.number.float({ min: 0.5, max: 2.2 }), 1),
    },
    compliance: {
      nationalScore: Math.min(Math.round(avgCompliance), 82),
      deviations: totalDeviations,
    },
    budgetUtilization: 74.3,
    highlights: [
      { label: "New Institutions Onboarded", value: "3 this quarter", trend: "up" as const },
      { label: "NIRF Rankings Published", value: "2026 cycle complete", trend: "stable" as const },
      { label: "Digital Learning Adoption", value: "68% institutions", trend: "up" as const },
      { label: "Research Output Growth", value: "+12.4% YoY", trend: "up" as const },
      { label: "Faculty Vacancies", value: "4,200 unfilled", trend: "down" as const },
      { label: "Student Grievances Resolved", value: "94.2% within SLA", trend: "up" as const },
    ],
  };
}

export function generateInstitutionDetail(institutionId: string): InstitutionDetail | null {
  const institutions = getOrGenerateInstitutions();
  const summary = institutions.find((i) => i.id === institutionId);
  if (!summary) return null;

  const currentYear = 2026;
  const established = faker.number.int({ min: 1920, max: 2005 });

  const enrollmentHistory = Array.from({ length: 6 }, (_, i) => ({
    year: currentYear - 5 + i,
    count: Math.round(summary.enrollment * (0.85 + i * 0.03 + faker.number.float({ min: -0.02, max: 0.02 }))),
  }));

  const performanceTrend = Array.from({ length: 6 }, (_, i) => ({
    year: currentYear - 5 + i,
    retention: roundTo(summary.retentionRate - 5 + i * 1.0 + faker.number.float({ min: -0.5, max: 0.5 }), 1),
    graduation: roundTo(summary.graduationRate - 4 + i * 0.8 + faker.number.float({ min: -0.5, max: 0.5 }), 1),
    placement: roundTo(summary.placementRate - 6 + i * 1.2 + faker.number.float({ min: -0.5, max: 0.5 }), 1),
  }));

  const complianceHistory = Array.from({ length: 12 }, (_, i) => ({
    date: pastDate(Math.max(1, (12 - i) * 30)),
    score: Math.min(100, Math.max(40, summary.complianceScore - 10 + i * 0.8 + faker.number.int({ min: -3, max: 3 }))),
  }));

  const numDepts = faker.number.int({ min: 6, max: 12 });
  const departmentBreakdown = DEPARTMENTS.slice(0, numDepts).map((name) => ({
    name,
    enrollment: faker.number.int({ min: 150, max: 3500 }),
    faculty: faker.number.int({ min: 12, max: 120 }),
    researchOutput: faker.number.int({ min: 5, max: 150 }),
  }));

  const numDeviations = faker.number.int({ min: 1, max: 5 });
  const recentDeviations = Array.from({ length: numDeviations }, () => ({
    description: pick(DEVIATION_DESCRIPTIONS),
    severity: pick(["high", "medium", "low"] as RiskLevel[]),
    date: pastDate(Math.max(1, faker.number.int({ min: 10, max: 180 }))),
    resolved: faker.datatype.boolean({ probability: 0.6 }),
  }));

  const websiteName = summary.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 20);

  return {
    ...summary,
    established,
    website: `https://www.${websiteName}.ac.in`,
    chancellor: pick(CHANCELLOR_NAMES),
    departments: numDepts,
    programs: faker.number.int({ min: 30, max: 180 }),
    budget: faker.number.int({ min: 20_000_000, max: 500_000_000 }),
    enrollmentHistory,
    performanceTrend,
    complianceHistory,
    departmentBreakdown,
    recentDeviations,
  };
}

export function generateMinistryCompliance(): MinistryCompliance {
  const institutions = getOrGenerateInstitutions();

  const avgScore = roundTo(
    institutions.reduce((sum, i) => sum + i.complianceScore, 0) / institutions.length,
    1,
  );

  const byInstitution = institutions.map((inst) => ({
    id: inst.id,
    name: inst.name,
    score: inst.complianceScore,
    status: inst.complianceStatus,
    deviations: inst.complianceStatus === "compliant"
      ? faker.number.int({ min: 0, max: 1 })
      : inst.complianceStatus === "at_risk"
        ? faker.number.int({ min: 2, max: 4 })
        : faker.number.int({ min: 3, max: 8 }),
  }));

  const byFramework = [
    {
      framework: "DPDP Act 2023",
      avgScore: roundTo(faker.number.float({ min: 70, max: 88 }), 1),
      institutions: institutions.length,
      compliant: faker.number.int({ min: 28, max: 38 }),
    },
    {
      framework: "GDPR (International Programs)",
      avgScore: roundTo(faker.number.float({ min: 65, max: 82 }), 1),
      institutions: faker.number.int({ min: 12, max: 20 }),
      compliant: faker.number.int({ min: 8, max: 16 }),
    },
    {
      framework: "FERPA (US Partnerships)",
      avgScore: roundTo(faker.number.float({ min: 60, max: 78 }), 1),
      institutions: faker.number.int({ min: 8, max: 15 }),
      compliant: faker.number.int({ min: 5, max: 12 }),
    },
    {
      framework: "ISO 27001",
      avgScore: roundTo(faker.number.float({ min: 68, max: 85 }), 1),
      institutions: institutions.length,
      compliant: faker.number.int({ min: 25, max: 35 }),
    },
  ];

  const numDeviations = faker.number.int({ min: 10, max: 18 });
  const recentDeviations = Array.from({ length: numDeviations }, () => {
    const inst = pick(institutions);
    return {
      id: id("dev"),
      institution: inst.name,
      description: pick(DEVIATION_DESCRIPTIONS),
      severity: pick(["high", "medium", "low"] as RiskLevel[]),
      date: pastDate(Math.max(1, faker.number.int({ min: 5, max: 90 }))),
      resolved: faker.datatype.boolean({ probability: 0.5 }),
    };
  });

  const trend = MONTHS.map((month, i) => ({
    month,
    score: roundTo(
      Math.min(100, Math.max(60, avgScore - 6 + i * 0.5 + faker.number.float({ min: -2, max: 2 }))),
      1,
    ),
  }));

  return {
    nationalScore: Math.round(avgScore),
    byInstitution,
    byFramework,
    recentDeviations,
    trend,
  };
}

export function generateSimulationResults(): SimulationResult[] {
  const simulations: SimulationResult[] = [
    {
      id: id("sim"),
      scenarioName: "15% National Budget Increase",
      type: "budget",
      parameters: {
        budgetIncreasePct: 15,
        allocationStrategy: "performance-weighted",
        effectiveYear: 2027,
      },
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: 2027 + i,
        metrics: {
          totalBudget: roundTo(2.5e9 * (1 + 0.15) * (1 + i * 0.03), 0),
          enrollmentGrowth: roundTo(3.2 + i * 0.8, 1),
          graduationRate: roundTo(78.4 + i * 1.1, 1),
          researchOutput: roundTo(12000 + i * 1800, 0),
          facultyHires: roundTo(400 + i * 150, 0),
        },
      })),
      insights: SIMULATION_INSIGHTS.budget.slice(0, 3),
      confidence: 0.82,
      status: "completed",
      createdAt: pastDate(Math.max(1, 14)),
      updatedAt: pastDate(Math.max(1, 14)),
    },
    {
      id: id("sim"),
      scenarioName: "STEM Faculty Hiring Initiative",
      type: "hiring",
      parameters: {
        newHires: 2500,
        disciplines: "STEM",
        phaseYears: 3,
        compensationRevisionPct: 12,
      },
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: 2027 + i,
        metrics: {
          facultyCount: roundTo(45000 + Math.min(i, 3) * 833, 0),
          studentFacultyRatio: roundTo(24 - Math.min(i, 3) * 2, 1),
          researchOutput: roundTo(12000 + i * 2200, 0),
          placementRate: roundTo(72 + i * 2.4, 1),
          retentionRate: roundTo(82 + i * 1.5, 1),
        },
      })),
      insights: SIMULATION_INSIGHTS.hiring.slice(0, 3),
      confidence: 0.78,
      status: "completed",
      createdAt: pastDate(Math.max(1, 10)),
      updatedAt: pastDate(Math.max(1, 10)),
    },
    {
      id: id("sim"),
      scenarioName: "10% Enrollment Expansion with Infrastructure",
      type: "enrollment",
      parameters: {
        enrollmentIncreasePct: 10,
        newClassrooms: 500,
        onlineProgramExpansion: "yes",
        ruralOutreachCenters: 50,
      },
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: 2027 + i,
        metrics: {
          totalEnrollment: roundTo(580000 * (1 + (i + 1) * 0.02), 0),
          onlineEnrollment: roundTo(45000 + i * 12000, 0),
          qualityScore: roundTo(78 - i * 0.3 + (i > 2 ? i * 0.5 : 0), 1),
          infrastructureIndex: roundTo(72 + i * 3.5, 1),
          accessibilityScore: roundTo(65 + i * 4.2, 1),
        },
      })),
      insights: SIMULATION_INSIGHTS.enrollment.slice(0, 3),
      confidence: 0.75,
      status: "completed",
      createdAt: pastDate(Math.max(1, 7)),
      updatedAt: pastDate(Math.max(1, 7)),
    },
    {
      id: id("sim"),
      scenarioName: "National Scholarship Expansion Policy",
      type: "policy",
      parameters: {
        scholarshipBudgetIncreasePct: 40,
        meritBasedPct: 60,
        needBasedPct: 40,
        targetDemographics: "SC/ST/OBC/EWS",
      },
      projections: Array.from({ length: 5 }, (_, i) => ({
        year: 2027 + i,
        metrics: {
          scholarshipRecipients: roundTo(120000 + i * 25000, 0),
          diversityIndex: roundTo(0.62 + i * 0.04, 2),
          dropoutReduction: roundTo(5 + i * 2.5, 1),
          enrollmentFromDisadvantaged: roundTo(18 + i * 2.8, 1),
          budgetImpact: roundTo(350e6 * (1 + i * 0.1), 0),
        },
      })),
      insights: SIMULATION_INSIGHTS.policy.slice(0, 3),
      confidence: 0.71,
      status: "completed",
      createdAt: pastDate(Math.max(1, 3)),
      updatedAt: pastDate(Math.max(1, 3)),
    },
  ];

  return simulations;
}

export function generateScenarioComparison(ids: string[]): ScenarioComparison | null {
  const allSimulations = generateSimulationResults();
  const scenarios = ids.length > 0
    ? allSimulations.filter((s) => ids.includes(s.id))
    : allSimulations.slice(0, 2);

  if (scenarios.length < 2) return null;

  const finalYear = scenarios.map((s) => s.projections[s.projections.length - 1]);

  // Gather all unique metric names from both scenarios' final projections
  const allMetricNames = new Set<string>();
  finalYear.forEach((fy) => {
    Object.keys(fy.metrics).forEach((k) => allMetricNames.add(k));
  });

  const differentials = Array.from(allMetricNames).map((metricName) => ({
    metricName,
    values: scenarios.map((s) => {
      const lastProjection = s.projections[s.projections.length - 1];
      return {
        scenarioId: s.id,
        scenarioName: s.scenarioName,
        value: lastProjection.metrics[metricName] ?? 0,
      };
    }),
  }));

  return { scenarios, differentials };
}

export function generateReports(): MinistryReport[] {
  const reports: MinistryReport[] = [
    {
      id: id("rpt"),
      title: "National Higher Education Annual Report 2025-26",
      type: "national",
      status: "completed",
      generatedBy: "Ministry Analytics Division",
      downloadUrl: "/api/ministry/reports/download/national-annual-2026",
      fileSize: 4_850_000,
      parameters: { year: "2025-26", format: "PDF" },
      createdAt: pastDate(Math.max(1, 30)),
      updatedAt: pastDate(Math.max(1, 28)),
    },
    {
      id: id("rpt"),
      title: "Southern Region Institutional Performance Review",
      type: "regional",
      status: "completed",
      generatedBy: "Regional Assessment Cell",
      downloadUrl: "/api/ministry/reports/download/south-performance-q4",
      fileSize: 2_340_000,
      parameters: { region: "South", quarter: "Q4 2025", format: "PDF" },
      createdAt: pastDate(Math.max(1, 21)),
      updatedAt: pastDate(Math.max(1, 19)),
    },
    {
      id: id("rpt"),
      title: "DPDP Act Compliance Status Across Higher Education",
      type: "compliance",
      status: "completed",
      generatedBy: "Compliance Monitoring Unit",
      downloadUrl: "/api/ministry/reports/download/dpdp-compliance-2026",
      fileSize: 1_920_000,
      parameters: { framework: "DPDP Act 2023", format: "PDF" },
      createdAt: pastDate(Math.max(1, 15)),
      updatedAt: pastDate(Math.max(1, 13)),
    },
    {
      id: id("rpt"),
      title: "Budget Utilization Analysis: FY 2025-26",
      type: "budget",
      status: "completed",
      generatedBy: "Financial Planning Division",
      downloadUrl: "/api/ministry/reports/download/budget-utilization-fy26",
      fileSize: 3_100_000,
      parameters: { fiscalYear: "2025-26", format: "Excel" },
      createdAt: pastDate(Math.max(1, 12)),
      updatedAt: pastDate(Math.max(1, 10)),
    },
    {
      id: id("rpt"),
      title: "Eastern Region Access and Equity Report",
      type: "regional",
      status: "completed",
      generatedBy: "Equity and Inclusion Cell",
      downloadUrl: "/api/ministry/reports/download/east-equity-2026",
      fileSize: 1_780_000,
      parameters: { region: "East", focus: "Access & Equity", format: "PDF" },
      createdAt: pastDate(Math.max(1, 8)),
      updatedAt: pastDate(Math.max(1, 6)),
    },
    {
      id: id("rpt"),
      title: "NIRF Ranking Analysis and Institutional Benchmarking",
      type: "national",
      status: "completed",
      generatedBy: "Ministry Analytics Division",
      downloadUrl: "/api/ministry/reports/download/nirf-analysis-2026",
      fileSize: 5_200_000,
      parameters: { year: "2026", format: "PDF" },
      createdAt: pastDate(Math.max(1, 5)),
      updatedAt: pastDate(Math.max(1, 3)),
    },
    {
      id: id("rpt"),
      title: "Research Output and Innovation Ecosystem Report",
      type: "national",
      status: "generating",
      generatedBy: "Research and Innovation Division",
      parameters: { year: "2025-26", scope: "National", format: "PDF" },
      createdAt: pastDate(Math.max(1, 1)),
      updatedAt: pastDate(Math.max(1, 1)),
    },
    {
      id: id("rpt"),
      title: "Western Region Budget Allocation Efficiency",
      type: "budget",
      status: "completed",
      generatedBy: "Financial Planning Division",
      downloadUrl: "/api/ministry/reports/download/west-budget-efficiency",
      fileSize: 2_650_000,
      parameters: { region: "West", fiscalYear: "2025-26", format: "Excel" },
      createdAt: pastDate(Math.max(1, 2)),
      updatedAt: pastDate(Math.max(1, 1)),
    },
  ];

  return reports;
}

export function generateQualityIndicators(): QualityIndicator[] {
  const institutions = getOrGenerateInstitutions();

  return institutions.map((inst) => ({
    institutionId: inst.id,
    institutionName: inst.name,
    region: inst.region,
    facultyRatio: inst.facultyStudentRatio,
    researchOutput: inst.researchOutput,
    placementRate: inst.placementRate,
    studentSatisfaction: roundTo(faker.number.float({ min: 3.2, max: 4.8 }), 1),
    accreditationStatus: inst.accreditationStatus,
    overallScore: roundTo(
      (inst.placementRate * 0.25 +
        inst.graduationRate * 0.25 +
        inst.retentionRate * 0.2 +
        (100 - inst.facultyStudentRatio) * 0.15 +
        Math.min(inst.researchOutput / 8, 100) * 0.15),
      1,
    ),
  }));
}

export function generateMinistryBudget(): MinistryBudget {
  const institutions = getOrGenerateInstitutions();
  const totalBudget = 2_500_000_000; // $2.5B
  const utilized = Math.round(totalBudget * 0.743);
  const allocated = Math.round(totalBudget * 0.92);

  const byInstitution = institutions.map((inst) => {
    const weight = inst.type === "university"
      ? faker.number.float({ min: 0.025, max: 0.06 })
      : inst.type === "institute"
        ? faker.number.float({ min: 0.015, max: 0.04 })
        : faker.number.float({ min: 0.005, max: 0.02 });
    const instAllocated = Math.round(totalBudget * weight);
    const instUtilized = Math.round(instAllocated * faker.number.float({ min: 0.6, max: 0.92 }));
    return {
      id: inst.id,
      name: inst.name,
      allocated: instAllocated,
      utilized: instUtilized,
    };
  });

  const byCategory = [
    { category: "Infrastructure & Capital Works", amount: 625_000_000, percentage: 25.0 },
    { category: "Faculty Salaries & Benefits", amount: 750_000_000, percentage: 30.0 },
    { category: "Research Grants & Funding", amount: 375_000_000, percentage: 15.0 },
    { category: "Scholarships & Financial Aid", amount: 325_000_000, percentage: 13.0 },
    { category: "Operations & Administration", amount: 250_000_000, percentage: 10.0 },
    { category: "Technology & Digital Learning", amount: 100_000_000, percentage: 4.0 },
    { category: "Student Services & Welfare", amount: 75_000_000, percentage: 3.0 },
  ];

  const yearlyTrend = Array.from({ length: 5 }, (_, i) => {
    const year = 2022 + i;
    const budget = Math.round(2_000_000_000 * (1 + i * 0.06));
    const yearUtilized = Math.round(budget * (0.68 + i * 0.015));
    return { year, budget, utilized: yearUtilized };
  });

  const projections = Array.from({ length: 5 }, (_, i) => {
    const year = 2027 + i;
    const projected = Math.round(totalBudget * (1 + (i + 1) * 0.055));
    const lower = Math.round(projected * 0.92);
    const upper = Math.round(projected * 1.08);
    return { year, projected, lower, upper };
  });

  return {
    totalBudget,
    allocated,
    utilized,
    utilizationRate: 74.3,
    byInstitution,
    byCategory,
    yearlyTrend,
    projections,
  };
}

export function generateMinistrySettings(): MinistrySettings {
  return {
    dashboardPreferences: {
      defaultView: "overview",
      refreshInterval: 300,
      showAllInstitutions: true,
    },
    dataAccess: {
      anonymizeStudentData: true,
      requireApprovalForExport: true,
      dataRetentionYears: 7,
    },
    notifications: {
      complianceAlerts: true,
      budgetAlerts: true,
      institutionUpdates: true,
      weeklyDigest: true,
    },
  };
}
