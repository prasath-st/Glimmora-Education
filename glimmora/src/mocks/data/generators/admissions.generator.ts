import { faker } from "@faker-js/faker";
import type {
  AdmissionsDashboard,
  AdmissionApplication,
  AdmissionStatus,
  ApplicantProfile,
  ApplicationDocument,
  ReviewNote,
  AdmissionPredictions,
  AdmissionRecommendation,
} from "@/lib/api/types/admissions.types";
import type { RiskLevel } from "@/lib/api/types/common.types";

faker.seed(49);

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
  "Electronics & Communication",
  "Mechanical Engineering",
  "Artificial Intelligence",
  "Business Administration",
  "Physics",
  "Mathematics",
  "Biotechnology",
];

const PROGRAMS = [
  "B.Tech Computer Science",
  "B.Tech ECE",
  "B.Tech Mechanical",
  "M.Tech AI & ML",
  "M.Tech VLSI Design",
  "MBA General Management",
  "MBA Finance",
  "M.Sc Physics",
  "M.Sc Mathematics",
  "M.Sc Biotechnology",
  "Ph.D Computer Science",
  "Ph.D Physics",
];

const PROGRAM_DEPARTMENT_MAP: Record<string, string> = {
  "B.Tech Computer Science": "Computer Science",
  "B.Tech ECE": "Electronics & Communication",
  "B.Tech Mechanical": "Mechanical Engineering",
  "M.Tech AI & ML": "Artificial Intelligence",
  "M.Tech VLSI Design": "Electronics & Communication",
  "MBA General Management": "Business Administration",
  "MBA Finance": "Business Administration",
  "M.Sc Physics": "Physics",
  "M.Sc Mathematics": "Mathematics",
  "M.Sc Biotechnology": "Biotechnology",
  "Ph.D Computer Science": "Computer Science",
  "Ph.D Physics": "Physics",
};

const INDIAN_FIRST_NAMES = [
  "Aarav", "Vivaan", "Aditya", "Vihaan", "Arjun", "Sai", "Reyansh", "Ayaan",
  "Krishna", "Ishaan", "Shaurya", "Atharv", "Advik", "Pranav", "Advaith",
  "Aadhya", "Ananya", "Diya", "Saanvi", "Isha", "Anika", "Myra", "Riya",
  "Priya", "Kavya", "Meera", "Neha", "Tanvi", "Shreya", "Pooja",
  "Rahul", "Amit", "Rohan", "Karan", "Vikram", "Nikhil", "Sanjay", "Deepak",
  "Manish", "Suresh", "Rajesh", "Naveen", "Harish", "Gaurav", "Akash",
];

const INDIAN_LAST_NAMES = [
  "Sharma", "Verma", "Patel", "Gupta", "Singh", "Kumar", "Reddy", "Nair",
  "Iyer", "Joshi", "Mehta", "Bhat", "Rao", "Pillai", "Menon",
  "Chatterjee", "Banerjee", "Das", "Mukherjee", "Ghosh", "Sinha", "Mishra",
  "Agarwal", "Kapoor", "Malhotra", "Saxena", "Tiwari", "Pandey", "Dubey", "Jain",
];

const INTERNATIONAL_NAMES = [
  { first: "James", last: "Wilson" },
  { first: "Sarah", last: "Thompson" },
  { first: "Michael", last: "Chen" },
  { first: "Emily", last: "Johnson" },
  { first: "Ahmed", last: "Al-Rashid" },
  { first: "Fatima", last: "Hassan" },
  { first: "Yuki", last: "Tanaka" },
  { first: "Wei", last: "Zhang" },
  { first: "Oluwaseun", last: "Adeyemi" },
  { first: "Sophia", last: "Mueller" },
  { first: "Carlos", last: "Rodriguez" },
  { first: "Amara", last: "Okafor" },
  { first: "Liam", last: "O'Brien" },
  { first: "Hyun-Ji", last: "Kim" },
  { first: "Anh", last: "Nguyen" },
];

const NATIONALITIES = [
  "Indian", "Indian", "Indian", "Indian", "Indian", "Indian", "Indian",
  "American", "British", "Chinese", "Japanese", "Nigerian",
  "German", "South Korean", "Vietnamese",
];

const STATUSES: AdmissionStatus[] = [
  "submitted", "submitted", "submitted",
  "under_review", "under_review", "under_review", "under_review",
  "interview_scheduled", "interview_scheduled",
  "interview_completed",
  "accepted", "accepted", "accepted",
  "rejected", "rejected",
  "waitlisted",
  "enrolled",
  "withdrawn",
];

const AI_STRENGTHS = [
  "Exceptional academic record with consistent top-decile performance",
  "Strong research aptitude demonstrated through published papers",
  "Outstanding extracurricular leadership in technical clubs",
  "Impressive competitive programming achievements (national level)",
  "Well-rounded profile with balanced academic and non-academic strengths",
  "Excellent essay articulating clear career goals and motivation",
  "Strong recommendation letters from recognized faculty members",
  "Significant community service and social impact initiatives",
  "Demonstrated entrepreneurial mindset with startup experience",
  "International exposure through exchange programs and conferences",
  "Consistent academic improvement trajectory over last 3 years",
  "Multiple internship experiences at reputed organizations",
  "Active open-source contributor with notable GitHub portfolio",
  "National-level sports achievements alongside strong academics",
  "Published research in peer-reviewed journals at undergraduate level",
];

const AI_CONCERNS = [
  "Below-average performance in core mathematics courses",
  "Limited extracurricular involvement noted",
  "Essay lacks specificity about program alignment",
  "Recommendation letters are generic in nature",
  "Significant gap in academic timeline unexplained",
  "Inconsistent grade trajectory across semesters",
  "Limited exposure to practical/lab-based coursework",
  "No demonstrated interest in research or innovation",
  "Weak English proficiency may affect coursework performance",
  "Over-reliance on a single area of strength",
  "Disciplinary record flagged from previous institution",
  "Application submitted with incomplete supporting documents",
];

const REVIEW_COMMENTS = [
  "Reviewed academic transcripts — strong CGPA of 8.5+ across all semesters. Recommend proceeding to interview stage.",
  "Essay is compelling and shows genuine passion for the field. AI score aligns with manual assessment.",
  "Interviewed candidate via video call. Communication skills are above average. Technical knowledge is solid.",
  "Recommendation from Prof. Kumar at IIT Delhi is particularly strong. Candidate shows research potential.",
  "Documents verified. All transcripts authentic. International equivalency confirmed.",
  "Candidate demonstrated excellent problem-solving during technical interview. Panel recommends acceptance.",
  "Waitlisted due to capacity constraints in CS department. Strong candidate for next available slot.",
  "Financial aid application reviewed. Candidate qualifies for merit-cum-means scholarship.",
  "Second round interview completed. Candidate showed improvement from first round.",
  "Portfolio review completed. Projects demonstrate practical application of theoretical knowledge.",
  "Background verification completed. No concerns flagged.",
  "Committee decision: Accept with full scholarship based on exceptional academic merit.",
  "Application flagged for additional review — inconsistencies in timeline noted.",
  "Candidate withdrew application citing acceptance at another institution.",
];

const ADMISSIONS_OFFICERS = [
  "Dr. Rajesh Sharma",
  "Prof. Anita Desai",
  "Dr. Sunil Menon",
  "Ms. Priyanka Gupta",
  "Dr. Arun Nair",
  "Prof. Kavitha Rao",
  "Mr. Sameer Joshi",
  "Dr. Meena Iyer",
];

const DOC_NAMES: { name: string; type: ApplicationDocument["type"] }[] = [
  { name: "Academic Transcript", type: "transcript" },
  { name: "Personal Statement Essay", type: "essay" },
  { name: "Recommendation Letter — Faculty Advisor", type: "recommendation" },
  { name: "Recommendation Letter — Department Head", type: "recommendation" },
  { name: "Resume / Curriculum Vitae", type: "resume" },
  { name: "10th Grade Mark Sheet", type: "certificate" },
  { name: "12th Grade Mark Sheet", type: "certificate" },
  { name: "Entrance Exam Scorecard", type: "certificate" },
];

// ─── Application Generator ───────────────────────────────────────────────────

function generateApplicantName(isInternational: boolean): {
  name: string;
  nationality: string;
} {
  if (isInternational) {
    const intl = pick(INTERNATIONAL_NAMES);
    const nat = pick(NATIONALITIES.filter((n) => n !== "Indian"));
    return { name: `${intl.first} ${intl.last}`, nationality: nat };
  }
  return {
    name: `${pick(INDIAN_FIRST_NAMES)} ${pick(INDIAN_LAST_NAMES)}`,
    nationality: "Indian",
  };
}

function generateDocuments(): ApplicationDocument[] {
  const docCount = faker.number.int({ min: 4, max: DOC_NAMES.length });
  const selectedDocs = faker.helpers.arrayElements(DOC_NAMES, docCount);

  return selectedDocs.map((doc) => ({
    id: id("doc"),
    name: doc.name,
    type: doc.type,
    status: pick<ApplicationDocument["status"]>(["uploaded", "uploaded", "verified", "verified", "verified", "flagged"]),
    uploadedAt: pastDate(faker.number.int({ min: 10, max: 120 })),
  }));
}

function generateReviewNotes(status: AdmissionStatus): ReviewNote[] {
  // Earlier statuses have fewer notes
  const noteCountByStatus: Record<string, number> = {
    submitted: 0,
    under_review: faker.number.int({ min: 1, max: 2 }),
    interview_scheduled: faker.number.int({ min: 1, max: 3 }),
    interview_completed: faker.number.int({ min: 2, max: 4 }),
    accepted: faker.number.int({ min: 2, max: 5 }),
    rejected: faker.number.int({ min: 1, max: 3 }),
    waitlisted: faker.number.int({ min: 2, max: 4 }),
    enrolled: faker.number.int({ min: 3, max: 5 }),
    withdrawn: faker.number.int({ min: 1, max: 3 }),
  };

  const count = noteCountByStatus[status] || 0;

  return Array.from({ length: count }, () => ({
    id: id("note"),
    author: pick(ADMISSIONS_OFFICERS),
    content: pick(REVIEW_COMMENTS),
    date: pastDate(faker.number.int({ min: 1, max: 90 })),
    type: pick<ReviewNote["type"]>(["general", "academic", "interview", "decision"]),
  }));
}

function generateAiProfile(): ApplicantProfile {
  const academicScore = faker.number.int({ min: 40, max: 95 });
  const extracurricularScore = faker.number.int({ min: 30, max: 90 });
  const essayScore = faker.number.int({ min: 50, max: 95 });
  const recommendationScore = faker.number.int({ min: 40, max: 95 });
  const overallFit = roundTo(
    (academicScore * 0.35 + extracurricularScore * 0.2 + essayScore * 0.25 + recommendationScore * 0.2),
    1
  );

  let riskLevel: RiskLevel;
  if (overallFit < 45) riskLevel = "high";
  else if (overallFit < 60) riskLevel = "medium";
  else if (overallFit < 75) riskLevel = "low";
  else riskLevel = "none";

  const strengthCount = faker.number.int({ min: 2, max: 4 });
  const concernCount = overallFit < 60 ? faker.number.int({ min: 2, max: 3 }) : faker.number.int({ min: 0, max: 2 });

  return {
    academicScore,
    extracurricularScore,
    essayScore,
    recommendationScore,
    overallFit,
    strengths: faker.helpers.arrayElements(AI_STRENGTHS, strengthCount),
    concerns: faker.helpers.arrayElements(AI_CONCERNS, concernCount),
    similarAcceptedStudents: faker.number.int({ min: 5, max: 85 }),
    predictedGpa: roundTo(faker.number.float({ min: 5.5, max: 9.8 }), 2),
    predictedGraduation: faker.number.int({ min: 55, max: 98 }),
    riskLevel,
  };
}

function generateSingleApplication(): AdmissionApplication {
  const isInternational = faker.datatype.boolean(0.15);
  const { name, nationality } = generateApplicantName(isInternational);
  const program = pick(PROGRAMS);
  const department = PROGRAM_DEPARTMENT_MAP[program] || pick(DEPARTMENTS);
  const status = pick(STATUSES);
  const aiProfile = generateAiProfile();
  const aiScore = Math.round(aiProfile.overallFit);

  const applicationDate = pastDate(faker.number.int({ min: 10, max: 180 }));

  const resolvedStatuses: AdmissionStatus[] = ["accepted", "rejected", "waitlisted", "enrolled"];
  const hasDecision = resolvedStatuses.includes(status);

  const decisionOutcomeMap: Record<string, "accepted" | "rejected" | "waitlisted"> = {
    accepted: "accepted",
    rejected: "rejected",
    waitlisted: "waitlisted",
    enrolled: "accepted",
  };

  const emailFirst = name.toLowerCase().replace(/[\s'-]/g, ".").replace(/\.\./g, ".");
  const emailDomains = isInternational
    ? ["gmail.com", "yahoo.com", "outlook.com"]
    : ["gmail.com", "yahoo.in", "outlook.com", "rediffmail.com"];

  return {
    id: id("app"),
    applicantName: name,
    email: `${emailFirst}@${pick(emailDomains)}`,
    phone: isInternational
      ? `+${faker.number.int({ min: 1, max: 86 })} ${faker.string.numeric(10)}`
      : `+91 ${faker.string.numeric(10)}`,
    dateOfBirth: faker.date.birthdate({ min: 17, max: 30, mode: "age" }).toISOString().split("T")[0],
    nationality,
    programApplied: program,
    department,
    applicationDate,
    status,
    aiScore,
    aiProfile,
    documents: generateDocuments(),
    reviewNotes: generateReviewNotes(status),
    decision: hasDecision
      ? {
          outcome: decisionOutcomeMap[status] || "waitlisted",
          decidedBy: pick(ADMISSIONS_OFFICERS),
          decidedAt: pastDate(faker.number.int({ min: 1, max: 60 })),
          reason: faker.datatype.boolean(0.7)
            ? pick([
                "Strong academic profile and alignment with program objectives",
                "Exceptional performance in entrance examination and interview",
                "Does not meet minimum academic requirements for the program",
                "Capacity constraints — strong candidate placed on waiting list",
                "Outstanding research potential and faculty recommendation",
                "Inconsistencies found during background verification",
                "Merit-based selection after comprehensive evaluation",
                "Below threshold in AI-assisted screening; manual review confirmed",
              ])
            : undefined,
        }
      : undefined,
    interviewScheduled:
      status === "interview_scheduled" || status === "interview_completed"
        ? futureDate(faker.number.int({ min: 1, max: 30 }))
        : undefined,
    scholarshipEligible: aiScore >= 75 && faker.datatype.boolean(0.6),
    createdAt: applicationDate,
    updatedAt: pastDate(faker.number.int({ min: 1, max: 30 })),
  };
}

// ─── Exported Generators ──────────────────────────────────────────────────────

let _applications: AdmissionApplication[] | null = null;

function getApplications(count: number = 50): AdmissionApplication[] {
  if (!_applications) {
    _applications = Array.from({ length: count }, () => generateSingleApplication());
  }
  return _applications;
}

export function generateApplications(count: number = 50): AdmissionApplication[] {
  return getApplications(count);
}

export function generateApplicationDetail(
  applicationId: string
): AdmissionApplication | undefined {
  return getApplications().find((a) => a.id === applicationId);
}

export function generateAdmissionsDashboard(): AdmissionsDashboard {
  const pipeline = [
    { stage: "Submitted", count: 850 },
    { stage: "Under Review", count: 620 },
    { stage: "Interview Scheduled", count: 280 },
    { stage: "Interview Completed", count: 195 },
    { stage: "Decision Pending", count: 105 },
    { stage: "Finalized", count: 750 },
  ];

  const byDepartment = [
    { department: "Computer Science", applications: 680, accepted: 285, capacity: 300 },
    { department: "Electronics & Communication", applications: 420, accepted: 175, capacity: 200 },
    { department: "Mechanical Engineering", applications: 310, accepted: 140, capacity: 180 },
    { department: "Artificial Intelligence", applications: 390, accepted: 120, capacity: 120 },
    { department: "Business Administration", applications: 350, accepted: 155, capacity: 200 },
    { department: "Physics", applications: 240, accepted: 110, capacity: 150 },
    { department: "Mathematics", applications: 210, accepted: 105, capacity: 130 },
    { department: "Biotechnology", applications: 200, accepted: 110, capacity: 120 },
  ];

  const byMonth = [
    { month: "Sep 2025", applications: 480, decisions: 0 },
    { month: "Oct 2025", applications: 620, decisions: 45 },
    { month: "Nov 2025", applications: 410, decisions: 180 },
    { month: "Dec 2025", applications: 350, decisions: 320 },
    { month: "Jan 2026", applications: 520, decisions: 410 },
    { month: "Feb 2026", applications: 280, decisions: 380 },
    { month: "Mar 2026", applications: 140, decisions: 465 },
  ];

  const demographics = [
    { category: "Male", count: 1680, percentage: 60 },
    { category: "Female", count: 1064, percentage: 38 },
    { category: "Non-Binary / Other", count: 56, percentage: 2 },
    { category: "International Students", count: 420, percentage: 15 },
    { category: "Domestic Students", count: 2380, percentage: 85 },
    { category: "First-Generation College", count: 560, percentage: 20 },
    { category: "Economically Disadvantaged", count: 392, percentage: 14 },
    { category: "Rural Background", count: 336, percentage: 12 },
    { category: "Persons with Disabilities", count: 84, percentage: 3 },
    { category: "SC/ST Category", count: 448, percentage: 16 },
    { category: "OBC Category", count: 756, percentage: 27 },
  ];

  return {
    currentCycle: "2025-26",
    totalApplications: 2800,
    pendingReview: 450,
    accepted: 1200,
    rejected: 600,
    waitlisted: 250,
    acceptanceRate: 42,
    avgScore: 72,
    pipeline,
    byDepartment,
    byMonth,
    demographics,
  };
}

export function generatePredictions(): AdmissionPredictions {
  const enrollmentForecast = [
    { department: "Computer Science", predicted: 272, capacity: 300, likelihood: 0.91 },
    { department: "Electronics & Communication", predicted: 168, capacity: 200, likelihood: 0.84 },
    { department: "Mechanical Engineering", predicted: 122, capacity: 180, likelihood: 0.68 },
    { department: "Artificial Intelligence", predicted: 118, capacity: 120, likelihood: 0.98 },
    { department: "Business Administration", predicted: 142, capacity: 200, likelihood: 0.71 },
    { department: "Physics", predicted: 89, capacity: 150, likelihood: 0.59 },
    { department: "Mathematics", predicted: 78, capacity: 130, likelihood: 0.60 },
    { department: "Biotechnology", predicted: 95, capacity: 120, likelihood: 0.79 },
  ];

  const trendAnalysis = [
    { year: "2021-22", applications: 2100, accepted: 920, enrolled: 610, yield: 66.3 },
    { year: "2022-23", applications: 2350, accepted: 1020, enrolled: 665, yield: 65.2 },
    { year: "2023-24", applications: 2520, accepted: 1080, enrolled: 715, yield: 66.2 },
    { year: "2024-25", applications: 2680, accepted: 1150, enrolled: 748, yield: 65.0 },
    { year: "2025-26", applications: 2800, accepted: 1200, enrolled: 0, yield: 0 },
  ];

  const riskFactors = [
    {
      factor: "Declining Yield in Engineering Programs",
      impact: "high" as const,
      description:
        "Mechanical and Civil Engineering programs show a 4.2% yield decline over 3 years as students increasingly prefer CS and AI tracks. Targeted outreach and scholarship incentives are recommended.",
    },
    {
      factor: "International Student Visa Uncertainty",
      impact: "medium" as const,
      description:
        "Policy changes in student visa processing may affect 15% of international admits. Contingency over-admission of 5% recommended for affected programs.",
    },
    {
      factor: "Competing Offers from Peer Institutions",
      impact: "high" as const,
      description:
        "45% of top-scored applicants (AI score 85+) have concurrent applications at IITs and NITs. Early decision communication and enhanced scholarship offers could improve conversion.",
    },
    {
      factor: "Scholarship Budget Constraints",
      impact: "medium" as const,
      description:
        "Current scholarship budget covers only 60% of eligible candidates. This may result in 8-12% yield loss among financially constrained high-merit students.",
    },
  ];

  const recommendations: AdmissionRecommendation[] = [
    {
      id: id("rec"),
      title: "Increase Early Decision Incentives",
      description:
        "Offer a 10% tuition discount for applicants who confirm enrollment within 14 days of acceptance. Historical data suggests this could improve yield by 3-5% among top candidates.",
      impact: "high",
      category: "process",
      status: "pending",
    },
    {
      id: id("rec"),
      title: "Expand International Outreach in Southeast Asia",
      description:
        "Current international applicant pool is concentrated in 3 countries. Targeted digital campaigns and partnerships with feeder schools in Vietnam, Thailand, and Indonesia could diversify intake by 20%.",
      impact: "medium",
      category: "outreach",
      status: "pending",
    },
    {
      id: id("rec"),
      title: "Launch Merit-Cum-Means Scholarship for AI Program",
      description:
        "The M.Tech AI program is at 98% predicted capacity. A dedicated scholarship fund of INR 50L could attract 15-20 additional high-caliber candidates who currently choose competing programs.",
      impact: "high",
      category: "scholarship",
      status: "pending",
    },
    {
      id: id("rec"),
      title: "Increase Mechanical Engineering Intake Flexibility",
      description:
        "With only 68% predicted enrollment against capacity, consider reducing Mechanical seats by 20 and reallocating to CS/AI programs which are oversubscribed. This optimizes resource utilization.",
      impact: "medium",
      category: "capacity",
      status: "pending",
    },
    {
      id: id("rec"),
      title: "Automate Document Verification Pipeline",
      description:
        "Currently 35% of applications have pending document verification. Implementing AI-based document authentication could reduce verification time by 70% and free up 2 FTEs for candidate engagement.",
      impact: "medium",
      category: "process",
      status: "pending",
    },
  ];

  return {
    yieldRate: {
      predicted: 68,
      historicalAvg: 65,
      confidence: 0.82,
    },
    enrollmentForecast,
    qualityMetrics: {
      avgAiScore: 72,
      avgAcademicScore: 74.3,
      diversityIndex: 0.68,
      internationalRatio: 0.15,
    },
    trendAnalysis,
    riskFactors,
    recommendations,
  };
}
