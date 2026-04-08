import { faker } from "@faker-js/faker";
import type {
  PlacementDashboard,
  PlacementStudent,
  Employer,
  EmployerJob,
  MatchResult,
  PipelineItem,
  PlacementReport,
  PlacementSettings,
} from "@/lib/api/types/placement.types";
import type {
  RiskLevel,
  MatchStatus,
  PipelineStage,
} from "@/lib/api/types/common.types";

faker.seed(46);

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
  "Business Administration",
  "Biotechnology",
  "Civil Engineering",
  "Information Technology",
];

const PROGRAMS = [
  "B.Tech",
  "M.Tech",
  "B.Sc",
  "M.Sc",
  "MBA",
  "BBA",
  "Ph.D",
];

const TECH_SKILLS = [
  "Python",
  "JavaScript",
  "TypeScript",
  "React",
  "Node.js",
  "Java",
  "C++",
  "SQL",
  "AWS",
  "Docker",
  "Kubernetes",
  "Machine Learning",
  "Data Analysis",
  "Git",
  "REST APIs",
  "GraphQL",
  "TensorFlow",
  "PyTorch",
  "Go",
  "Rust",
  "MongoDB",
  "PostgreSQL",
  "Redis",
  "CI/CD",
  "Agile",
  "System Design",
  "Microservices",
  "Cloud Computing",
  "DevOps",
  "Cybersecurity",
];

const SOFT_SKILLS = [
  "Communication",
  "Leadership",
  "Problem Solving",
  "Teamwork",
  "Critical Thinking",
  "Time Management",
  "Adaptability",
  "Project Management",
];

const ALL_SKILLS = [...TECH_SKILLS, ...SOFT_SKILLS];

const EMPLOYER_DATA: {
  name: string;
  industry: string;
  size: Employer["size"];
  website: string;
}[] = [
  { name: "Google", industry: "Technology", size: "enterprise", website: "https://google.com" },
  { name: "Microsoft", industry: "Technology", size: "enterprise", website: "https://microsoft.com" },
  { name: "Amazon", industry: "Technology", size: "enterprise", website: "https://amazon.jobs" },
  { name: "TCS", industry: "IT Services", size: "enterprise", website: "https://tcs.com" },
  { name: "Infosys", industry: "IT Services", size: "enterprise", website: "https://infosys.com" },
  { name: "Wipro", industry: "IT Services", size: "enterprise", website: "https://wipro.com" },
  { name: "Deloitte", industry: "Consulting", size: "enterprise", website: "https://deloitte.com" },
  { name: "McKinsey & Company", industry: "Consulting", size: "large", website: "https://mckinsey.com" },
  { name: "Goldman Sachs", industry: "Finance", size: "large", website: "https://goldmansachs.com" },
  { name: "JPMorgan Chase", industry: "Finance", size: "enterprise", website: "https://jpmorgan.com" },
  { name: "Apple", industry: "Technology", size: "enterprise", website: "https://apple.com" },
  { name: "Meta", industry: "Technology", size: "enterprise", website: "https://meta.com" },
  { name: "Accenture", industry: "Consulting", size: "enterprise", website: "https://accenture.com" },
  { name: "IBM", industry: "Technology", size: "enterprise", website: "https://ibm.com" },
  { name: "Salesforce", industry: "Technology", size: "large", website: "https://salesforce.com" },
];

const JOB_TITLES = [
  "Software Engineer",
  "Data Analyst",
  "Product Manager",
  "Frontend Developer",
  "Backend Developer",
  "Full Stack Developer",
  "Machine Learning Engineer",
  "DevOps Engineer",
  "Cloud Architect",
  "Business Analyst",
  "UX Designer",
  "QA Engineer",
  "Data Scientist",
  "Systems Engineer",
  "Security Analyst",
];

const LOCATIONS = [
  "Bangalore, India",
  "Hyderabad, India",
  "Mumbai, India",
  "Pune, India",
  "Chennai, India",
  "Delhi NCR, India",
  "Remote",
  "San Francisco, USA",
  "New York, USA",
  "London, UK",
  "Singapore",
];

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const PIPELINE_STAGES: PipelineStage[] = [
  "matched",
  "applied",
  "interviewed",
  "offered",
  "placed",
  "rejected",
];

const MATCH_EXPLANATIONS = [
  "Strong alignment between candidate's technical skills and job requirements. GPA and project experience indicate high potential.",
  "Excellent match on core competencies. Candidate's internship experience directly relevant to the role.",
  "Good skill overlap with some gaps in cloud technologies. Strong academic performance compensates.",
  "High match on soft skills and domain knowledge. Minor gaps in specific programming languages.",
  "Candidate's research background and analytical skills strongly align with data-focused role requirements.",
  "Solid technical foundation with relevant coursework. Leadership experience in campus activities is a plus.",
  "Strong problem-solving skills demonstrated through competitive programming. Good cultural fit indicators.",
  "Relevant project portfolio and open-source contributions align well with engineering role expectations.",
];

// ─── Generators ───────────────────────────────────────────────────────────────

function generateEmployerJob(companyName: string): EmployerJob {
  const jobType = pick<EmployerJob["type"]>(["full_time", "internship", "part_time", "contract"]);
  const postedDate = pastDate(60);
  const minSalary = faker.number.int({ min: 40000, max: 100000 });
  const maxSalary = minSalary + faker.number.int({ min: 10000, max: 60000 });

  return {
    id: id("job"),
    title: pick(JOB_TITLES),
    type: jobType,
    location: pick(LOCATIONS),
    salary: { min: minSalary, max: maxSalary },
    requiredSkills: faker.helpers.arrayElements(TECH_SKILLS, { min: 3, max: 6 }),
    postedDate,
    deadline: futureDate(faker.number.int({ min: 14, max: 90 })),
    applicants: faker.number.int({ min: 5, max: 200 }),
    status: pick<EmployerJob["status"]>(["active", "active", "active", "closed", "filled"]),
  };
}

export function generatePlacementDashboard(): PlacementDashboard {
  const placedMonthly = MONTHS.map((month) => {
    const target = faker.number.int({ min: 20, max: 35 });
    // Vary placed around target to create realistic trends
    const placed = Math.max(0, target + faker.number.int({ min: -10, max: 8 }));
    return { month, placed, target };
  });

  return {
    placementRate: 72.4,
    activeMatches: 45,
    pipeline: {
      matched: 45,
      applied: 38,
      interviewed: 22,
      offered: 14,
      placed: 87,
      rejected: 19,
    },
    upcomingDrives: [
      {
        name: "Campus Recruitment Drive 2026",
        company: "Google",
        date: futureDate(12),
        positions: 15,
      },
      {
        name: "Summer Internship Fair",
        company: "Microsoft",
        date: futureDate(18),
        positions: 25,
      },
      {
        name: "Off-Campus Hiring",
        company: "TCS",
        date: futureDate(25),
        positions: 50,
      },
      {
        name: "Lateral Placement Event",
        company: "Deloitte",
        date: futureDate(35),
        positions: 10,
      },
    ],
    topEmployers: [
      { name: "Google", hires: 18 },
      { name: "TCS", hires: 32 },
      { name: "Infosys", hires: 28 },
      { name: "Microsoft", hires: 14 },
      { name: "Amazon", hires: 12 },
    ],
    monthlyPlacements: placedMonthly,
  };
}

export function generatePlacementStudents(count: number = 50): PlacementStudent[] {
  return Array.from({ length: count }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const employabilityScore = faker.number.int({ min: 15, max: 98 });
    const offerCount = faker.number.int({ min: 0, max: 4 });

    let riskLevel: RiskLevel;
    if (employabilityScore < 30) riskLevel = "high";
    else if (employabilityScore < 50) riskLevel = "medium";
    else if (employabilityScore < 70) riskLevel = "low";
    else riskLevel = "none";

    const topSkillCount = faker.number.int({ min: 3, max: 6 });
    const gapSkillCount = faker.number.int({ min: 1, max: 4 });
    const topSkills = faker.helpers.arrayElements(ALL_SKILLS, topSkillCount);
    const remainingSkills = ALL_SKILLS.filter((s) => !topSkills.includes(s));
    const gapSkills = faker.helpers.arrayElements(remainingSkills, gapSkillCount);

    return {
      id: id("stu"),
      name: `${firstName} ${lastName}`,
      studentId: `STU${faker.string.numeric(6)}`,
      department: pick(DEPARTMENTS),
      program: pick(PROGRAMS),
      gpa: roundTo(faker.number.float({ min: 2.0, max: 4.0 }), 2),
      employabilityScore,
      topSkills,
      gapSkills,
      riskLevel,
      applicationCount: faker.number.int({ min: 0, max: 20 }),
      offerCount,
      avatarUrl: null,
      graduationDate: futureDate(faker.number.int({ min: 30, max: 365 })),
    };
  });
}

export function generateEmployers(count: number = 15): Employer[] {
  return EMPLOYER_DATA.slice(0, count).map((emp) => {
    const now = new Date().toISOString();
    const jobPostings = Array.from(
      { length: faker.number.int({ min: 2, max: 6 }) },
      () => generateEmployerJob(emp.name)
    );

    const hiringHistory = [2022, 2023, 2024, 2025].map((year) => ({
      year,
      hires: faker.number.int({ min: 3, max: 40 }),
    }));

    const totalHires = hiringHistory.reduce((sum, h) => sum + h.hires, 0);

    return {
      id: id("emp"),
      name: emp.name,
      industry: emp.industry,
      size: emp.size,
      logo: undefined,
      activeJobPostings: jobPostings.filter((j) => j.status === "active").length,
      totalHires,
      engagementScore: faker.number.int({ min: 55, max: 98 }),
      verificationRequests: faker.number.int({ min: 0, max: 12 }),
      contactEmail: faker.internet.email({ provider: emp.website.replace("https://", "") }),
      contactName: faker.person.fullName(),
      website: emp.website,
      description: faker.company.catchPhrase() + ". " + faker.lorem.sentences(2),
      hiringHistory,
      jobPostings,
      createdAt: pastDate(365),
      updatedAt: now,
    };
  });
}

export function generateEmployerDetail(
  employers: Employer[],
  employerId: string
): Employer | undefined {
  return employers.find((e) => e.id === employerId);
}

export function generateMatchResults(count: number = 25): MatchResult[] {
  return Array.from({ length: count }, () => {
    const statusDistribution: MatchStatus[] = [
      "pending", "pending", "pending", "pending",
      "approved", "approved",
      "rejected",
    ];
    const status = pick(statusDistribution);
    const matchScore = faker.number.int({ min: 45, max: 98 });
    const matchedSkills = faker.helpers.arrayElements(TECH_SKILLS, { min: 2, max: 5 });
    const remainingSkills = TECH_SKILLS.filter((s) => !matchedSkills.includes(s));
    const gapSkills = faker.helpers.arrayElements(remainingSkills, { min: 1, max: 3 });

    return {
      id: id("match"),
      studentId: id("stu"),
      studentName: faker.person.fullName(),
      studentDepartment: pick(DEPARTMENTS),
      jobId: id("job"),
      jobTitle: pick(JOB_TITLES),
      company: pick(EMPLOYER_DATA).name,
      matchScore,
      explanation: pick(MATCH_EXPLANATIONS),
      matchedSkills,
      gapSkills,
      status,
      reviewedBy: status !== "pending" ? faker.person.fullName() : undefined,
      reviewedAt: status !== "pending" ? pastDate(7) : undefined,
    };
  });
}

export function generatePipeline(count: number = 30): PipelineItem[] {
  const NEXT_ACTIONS: Record<PipelineStage, string[]> = {
    matched: ["Send application materials", "Schedule introductory call", "Review company profile"],
    applied: ["Follow up on application status", "Prepare for technical screening", "Submit additional documents"],
    interviewed: ["Send thank-you note", "Await interview feedback", "Prepare for next round"],
    offered: ["Review offer terms", "Negotiate compensation", "Accept or decline by deadline"],
    placed: ["Complete onboarding paperwork", "Attend orientation", "Start date confirmation"],
    rejected: ["Request feedback", "Apply to alternative positions", "Update profile and skills"],
  };

  return Array.from({ length: count }, () => {
    const stage = pick(PIPELINE_STAGES);
    const company = pick(EMPLOYER_DATA).name;

    return {
      id: id("pipe"),
      studentId: id("stu"),
      studentName: faker.person.fullName(),
      jobId: id("job"),
      jobTitle: pick(JOB_TITLES),
      company,
      stage,
      movedToStageAt: pastDate(30),
      notes: faker.datatype.boolean(0.6)
        ? faker.lorem.sentence()
        : undefined,
      nextAction: faker.datatype.boolean(0.7)
        ? pick(NEXT_ACTIONS[stage])
        : undefined,
    };
  });
}

export function generatePlacementReport(): PlacementReport {
  const byDepartment = DEPARTMENTS.map((department) => {
    const total = faker.number.int({ min: 30, max: 80 });
    const rate = roundTo(faker.number.float({ min: 55, max: 92 }), 1);
    const placed = Math.round((rate / 100) * total);
    return { department, rate, placed, total };
  });

  const byCohort = ["2023", "2024", "2025", "2026"].map((cohort) => ({
    cohort,
    rate: roundTo(faker.number.float({ min: 60, max: 85 }), 1),
    avgSalary: faker.number.int({ min: 45000, max: 120000 }),
  }));

  const equityMetrics: PlacementReport["equityMetrics"] = [
    { group: "Women in STEM", rate: 68.2, benchmark: 70, status: "below" },
    { group: "First-Generation Students", rate: 64.5, benchmark: 65, status: "at" },
    { group: "Rural Background", rate: 58.9, benchmark: 65, status: "below" },
    { group: "Economically Disadvantaged", rate: 62.1, benchmark: 60, status: "above" },
    { group: "Persons with Disabilities", rate: 55.3, benchmark: 55, status: "at" },
  ];

  const timeToPlacement: PlacementReport["timeToPlacement"] = [
    { stage: "Application to Interview", avgDays: 12 },
    { stage: "Interview to Offer", avgDays: 18 },
    { stage: "Offer to Acceptance", avgDays: 5 },
    { stage: "Acceptance to Start", avgDays: 45 },
    { stage: "Total Pipeline", avgDays: 80 },
  ];

  const topSkillsDemand: PlacementReport["topSkillsDemand"] = [
    { skill: "Python", demand: 89, supply: 72 },
    { skill: "JavaScript", demand: 82, supply: 78 },
    { skill: "React", demand: 75, supply: 55 },
    { skill: "Machine Learning", demand: 70, supply: 35 },
    { skill: "AWS", demand: 68, supply: 42 },
    { skill: "SQL", demand: 65, supply: 80 },
    { skill: "Docker", demand: 58, supply: 30 },
    { skill: "System Design", demand: 55, supply: 25 },
    { skill: "TypeScript", demand: 52, supply: 40 },
    { skill: "DevOps", demand: 48, supply: 28 },
  ];

  return {
    overallRate: 72.4,
    byDepartment,
    byCohort,
    equityMetrics,
    timeToPlacement,
    topSkillsDemand,
  };
}

export function generatePlacementSettings(): PlacementSettings {
  return {
    matchingPreferences: {
      minMatchScore: 60,
      maxResultsPerRun: 50,
      includeInternships: true,
      includePartTime: false,
      weightGpa: 0.25,
      weightSkills: 0.50,
      weightExperience: 0.25,
    },
    equityParameters: {
      enableEquityCheck: true,
      targetDiversityRate: 0.70,
      flagThreshold: 0.15,
    },
    notifications: {
      newMatches: true,
      employerMessages: true,
      pipelineUpdates: true,
      weeklyDigest: false,
    },
  };
}
