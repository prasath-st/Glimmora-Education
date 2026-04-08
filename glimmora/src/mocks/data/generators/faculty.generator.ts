import { faker } from "@faker-js/faker";
import type {
  FacultyDashboard,
  UpcomingClass,
  GrantAlert,
  FacultyStudentListItem,
  FacultyStudentDetail,
  Intervention,
  FacultyCourse,
  FacultyCourseDetail,
  FacultyGrant,
  FacultyCollaboration,
  FacultyPublication,
  AiBriefing,
  FacultyProfile,
} from "@/lib/api/types/faculty.types";
import type { RiskLevel, InterventionStatus } from "@/lib/api/types/common.types";

faker.seed(43);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
const currentYear = now.getFullYear();
const currentMonth = now.getMonth();
const currentSemester = currentMonth < 6 ? "Spring" : "Fall";
const currentSemesterLabel = `${currentSemester} ${currentYear}`;

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

function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => faker.number.float() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// ─── Realistic Constants ──────────────────────────────────────────────────────

const FACULTY_COURSES_TAUGHT: {
  code: string;
  name: string;
  credits: number;
  schedule: string;
  room: string;
  totalStudents: number;
}[] = [
  { code: "CS 201", name: "Data Structures & Algorithms", credits: 4, schedule: "MWF 9:00-9:50 AM", room: "CS Building 301", totalStudents: 45 },
  { code: "CS 401", name: "Machine Learning", credits: 3, schedule: "TTh 1:00-2:15 PM", room: "Tech Hall 210", totalStudents: 38 },
  { code: "CS 405", name: "Deep Learning", credits: 3, schedule: "MWF 11:00-11:50 AM", room: "AI Lab 105", totalStudents: 32 },
  { code: "CS 440", name: "Natural Language Processing", credits: 3, schedule: "TTh 3:00-4:15 PM", room: "CS Building 405", totalStudents: 28 },
  { code: "CS 510", name: "Advanced Machine Learning", credits: 3, schedule: "MW 4:30-5:45 PM", room: "Graduate Center 112", totalStudents: 18 },
];

const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mathematics",
  "Data Science",
  "Information Systems",
  "Biomedical Engineering",
  "Physics",
  "Statistics",
];

const PROGRAMS = [
  "B.S. Computer Science",
  "B.S. Data Science",
  "M.S. Computer Science",
  "M.S. Artificial Intelligence",
  "Ph.D. Computer Science",
  "B.S. Software Engineering",
];

const RISK_FACTORS = [
  "Declining GPA trend",
  "Low attendance (below 70%)",
  "Missing assignments (3+)",
  "Failed midterm exam",
  "No class participation",
  "Late submissions pattern",
  "Academic probation",
  "Financial hold on account",
  "Mental health concerns noted",
  "Dropped prerequisite course",
  "Poor lab performance",
  "Incomplete homework submissions",
];

const STUDENT_SKILLS = [
  "Python", "Java", "C++", "JavaScript", "TypeScript",
  "Data Structures", "Algorithms", "Machine Learning",
  "Deep Learning", "NLP", "Computer Vision", "SQL",
  "Statistics", "Linear Algebra", "Calculus",
  "Git", "Docker", "AWS", "React", "TensorFlow",
  "PyTorch", "Scikit-learn", "Pandas", "NumPy",
];

const GRADE_LETTERS = ["A", "A-", "B+", "B", "B-", "C+", "C", "C-", "D", "F"];

const INTERVENTION_TYPES: Intervention["type"][] = [
  "academic_support",
  "counseling",
  "mentoring",
  "schedule_adjustment",
  "financial_aid",
];

const INTERVENTION_DESCRIPTIONS: Record<Intervention["type"], string[]> = {
  academic_support: [
    "Weekly tutoring sessions for core algorithm concepts",
    "Study group facilitation for exam preparation",
    "One-on-one office hours for assignment help",
    "Supplementary problem sets with guided solutions",
  ],
  counseling: [
    "Referral to academic counseling for course planning",
    "Stress management and academic balance support",
    "Career direction counseling for undecided students",
  ],
  mentoring: [
    "Paired with senior graduate student mentor",
    "Industry mentor connection for research guidance",
    "Faculty mentoring for graduate school preparation",
  ],
  schedule_adjustment: [
    "Reduced course load recommendation for current semester",
    "Lab section reassignment to accommodate work schedule",
    "Extended deadline arrangement for documented circumstances",
  ],
  financial_aid: [
    "Emergency grant application assistance",
    "Work-study position referral in CS department",
    "Scholarship application support for next semester",
  ],
};

const FUNDING_BODIES = [
  { name: "National Science Foundation (NSF)", prefix: "NSF" },
  { name: "National Institutes of Health (NIH)", prefix: "NIH" },
  { name: "Defense Advanced Research Projects Agency (DARPA)", prefix: "DARPA" },
  { name: "EU Horizon Europe", prefix: "HORIZON" },
  { name: "Department of Energy (DOE)", prefix: "DOE" },
  { name: "Google Research", prefix: "GOOGLE" },
  { name: "Microsoft Research", prefix: "MSR" },
  { name: "Amazon Science", prefix: "AMAZON" },
  { name: "Meta AI Research", prefix: "META" },
  { name: "OpenAI Research Fund", prefix: "OPENAI" },
  { name: "Toyota Research Institute", prefix: "TRI" },
  { name: "Allen Institute for AI", prefix: "AI2" },
];

const GRANT_TOPICS = [
  "Explainable AI",
  "Federated Learning",
  "Responsible AI",
  "AI Safety",
  "Large Language Models",
  "Multimodal Learning",
  "Reinforcement Learning",
  "Graph Neural Networks",
  "AI for Education",
  "Computational Biology",
  "Robotics & Autonomy",
  "Privacy-Preserving ML",
  "AI Fairness & Bias",
  "Quantum Machine Learning",
  "Edge AI & Efficient Computing",
];

const RESEARCH_INSTITUTIONS = [
  "MIT",
  "Stanford University",
  "Carnegie Mellon University",
  "UC Berkeley",
  "University of Toronto",
  "ETH Zurich",
  "University of Oxford",
  "Georgia Institute of Technology",
  "University of Washington",
  "Tsinghua University",
  "National University of Singapore",
  "Max Planck Institute",
  "University of Cambridge",
  "EPFL",
  "Seoul National University",
];

const JOURNAL_NAMES = [
  "Nature Machine Intelligence",
  "IEEE Transactions on Pattern Analysis and Machine Intelligence",
  "Journal of Machine Learning Research",
  "Artificial Intelligence",
  "Neural Computation",
  "Machine Learning",
  "ACM Computing Surveys",
  "IEEE Transactions on Neural Networks and Learning Systems",
  "Data Mining and Knowledge Discovery",
  "Pattern Recognition",
];

const CONFERENCE_NAMES = [
  "NeurIPS",
  "ICML",
  "ICLR",
  "AAAI",
  "CVPR",
  "ACL",
  "EMNLP",
  "KDD",
  "IJCAI",
  "SIGIR",
];

// ─── Stable Student Pool ──────────────────────────────────────────────────────

interface StudentSeed {
  id: string;
  studentId: string;
  name: string;
  email: string;
  department: string;
  program: string;
  semester: number;
  gpa: number;
  riskLevel: RiskLevel;
  riskFactors: string[];
  lastActivity: string;
  avatarUrl: string | null;
  attendanceRate: number;
  enrollmentYear: number;
  phone: string;
}

let _studentPool: StudentSeed[] | null = null;

function getStudentPool(): StudentSeed[] {
  if (_studentPool) return _studentPool;

  faker.seed(43);
  const pool: StudentSeed[] = [];

  for (let i = 0; i < 48; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const name = `${firstName} ${lastName}`;
    const gpa = roundTo(faker.number.float({ min: 1.2, max: 4.0 }), 2);
    let riskLevel: RiskLevel = "none";
    let riskFactors: string[] = [];

    if (gpa < 2.0) {
      riskLevel = "high";
      riskFactors = pickN(RISK_FACTORS, faker.number.int({ min: 3, max: 5 }));
    } else if (gpa < 2.5) {
      riskLevel = "medium";
      riskFactors = pickN(RISK_FACTORS, faker.number.int({ min: 1, max: 3 }));
    } else if (gpa < 3.0) {
      riskLevel = "low";
      riskFactors = pickN(RISK_FACTORS, faker.number.int({ min: 0, max: 1 }));
    }

    // Override a few students to ensure high-risk cases
    if (i < 3) {
      riskLevel = "high";
      riskFactors = pickN(RISK_FACTORS, faker.number.int({ min: 3, max: 5 }));
    } else if (i < 6) {
      riskLevel = "medium";
      riskFactors = pickN(RISK_FACTORS, faker.number.int({ min: 2, max: 3 }));
    }

    pool.push({
      id: id("stu"),
      studentId: `STU${String(2024000 + i).padStart(7, "0")}`,
      name,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@university.edu`,
      department: pick(DEPARTMENTS),
      program: pick(PROGRAMS),
      semester: faker.number.int({ min: 1, max: 8 }),
      gpa: i < 3 ? roundTo(faker.number.float({ min: 1.2, max: 1.9 }), 2) : gpa,
      riskLevel,
      riskFactors,
      lastActivity: pastDate(faker.number.int({ min: 1, max: 14 })),
      avatarUrl: faker.datatype.boolean(0.3) ? faker.image.avatar() : null,
      attendanceRate: riskLevel === "high"
        ? roundTo(faker.number.float({ min: 45, max: 70 }), 1)
        : riskLevel === "medium"
          ? roundTo(faker.number.float({ min: 65, max: 82 }), 1)
          : roundTo(faker.number.float({ min: 80, max: 98 }), 1),
      enrollmentYear: currentYear - faker.number.int({ min: 0, max: 4 }),
      phone: faker.phone.number({ style: "national" }),
    });
  }

  _studentPool = pool;
  return pool;
}

// Assign courses to students (each student takes 2-4 of faculty's courses)
function getStudentCourses(studentIndex: number): string[] {
  const courseCount = 2 + (studentIndex % 3);
  return FACULTY_COURSES_TAUGHT
    .slice(0, courseCount)
    .map((c) => c.code);
}

// ─── Generators ───────────────────────────────────────────────────────────────

export function generateFacultyDashboard(): FacultyDashboard {
  faker.seed(43);
  const students = getStudentPool();
  const atRiskStudents = students.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium");

  const todayHour = now.getHours();
  const upcomingClasses: UpcomingClass[] = FACULTY_COURSES_TAUGHT.slice(0, 3).map((c, i) => {
    const hour = todayHour + i + 1;
    const startTime = `${hour % 12 || 12}:00 ${hour < 12 ? "AM" : "PM"}`;
    const endTime = `${(hour + 1) % 12 || 12}:00 ${hour + 1 < 12 ? "AM" : "PM"}`;
    const courseStudents = students.filter((_, si) => getStudentCourses(si).includes(c.code));
    return {
      courseId: id("crs"),
      courseName: c.name,
      courseCode: c.code,
      time: startTime,
      endTime,
      room: c.room,
      studentsAtRisk: courseStudents.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium").length,
      totalStudents: c.totalStudents,
    };
  });

  const grantAlerts: GrantAlert[] = FUNDING_BODIES.slice(0, 3).map((fb) => ({
    id: id("ga"),
    title: `${fb.prefix}-${faker.number.int({ min: 2025, max: 2026 })}: ${pick(GRANT_TOPICS)}`,
    fundingBody: fb.name,
    deadline: futureDate(faker.number.int({ min: 14, max: 90 })),
    amount: faker.number.int({ min: 50000, max: 500000 }),
    alignmentScore: roundTo(faker.number.float({ min: 0.72, max: 0.96 }), 2),
    isNew: faker.datatype.boolean(0.6),
  }));

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyTrend = weekDays.map((day) => ({
    day,
    atRisk: faker.number.int({ min: 4, max: 9 }),
    interventions: faker.number.int({ min: 1, max: 4 }),
  }));

  return {
    atRiskStudentCount: atRiskStudents.filter((s) => s.riskLevel === "high").length,
    activeInterventions: 3,
    totalStudents: students.length,
    upcomingClasses,
    grantAlerts,
    researchMetrics: {
      publications: 47,
      citations: 1823,
      hIndex: 22,
      activeGrants: 3,
    },
    weeklyTrend,
  };
}

export function generateFacultyStudents(count: number = 48): FacultyStudentListItem[] {
  faker.seed(43);
  const pool = getStudentPool();
  return pool.slice(0, count).map((s, i) => ({
    id: s.id,
    name: s.name,
    studentId: s.studentId,
    email: s.email,
    department: s.department,
    program: s.program,
    semester: s.semester,
    gpa: s.gpa,
    riskLevel: s.riskLevel,
    riskFactors: s.riskFactors,
    lastActivity: s.lastActivity,
    avatarUrl: s.avatarUrl,
    courses: getStudentCourses(i),
    attendanceRate: s.attendanceRate,
  }));
}

export function generateFacultyStudentDetail(studentId: string): FacultyStudentDetail | null {
  faker.seed(43);
  const pool = getStudentPool();
  const studentIndex = pool.findIndex((s) => s.id === studentId);
  if (studentIndex === -1) return null;
  const s = pool[studentIndex];

  // Generate GPA history (6 semesters)
  const semesters = ["Fall", "Spring"];
  const gpaHistory: { semester: string; gpa: number }[] = [];
  let runningGpa = roundTo(faker.number.float({ min: 2.8, max: 3.8 }), 2);
  for (let i = 0; i < 6; i++) {
    const semYear = currentYear - 3 + Math.floor(i / 2);
    const semLabel = `${semesters[i % 2]} ${semYear}`;
    const delta = faker.number.float({ min: -0.3, max: 0.2 });
    runningGpa = roundTo(Math.max(1.0, Math.min(4.0, runningGpa + delta)), 2);
    gpaHistory.push({ semester: semLabel, gpa: runningGpa });
  }
  // Make current GPA match the last entry
  gpaHistory[gpaHistory.length - 1].gpa = s.gpa;

  // Generate attendance history (last 20 class sessions)
  const attendanceStatuses: ("present" | "absent" | "late")[] = ["present", "absent", "late"];
  const attendanceHistory = Array.from({ length: 20 }, (_, i) => {
    const daysAgo = 20 - i;
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    // Weight towards present for good students, absent for at-risk
    let status: "present" | "absent" | "late";
    const roll = faker.number.float({ min: 0, max: 1 });
    if (s.riskLevel === "high") {
      status = roll < 0.45 ? "present" : roll < 0.75 ? "absent" : "late";
    } else if (s.riskLevel === "medium") {
      status = roll < 0.65 ? "present" : roll < 0.85 ? "absent" : "late";
    } else {
      status = roll < 0.85 ? "present" : roll < 0.95 ? "late" : "absent";
    }
    return {
      date: isoDate(date),
      status,
      courseName: pick(FACULTY_COURSES_TAUGHT.slice(0, 3)).name,
    };
  });

  // Generate skills
  const skillNames = pickN(STUDENT_SKILLS, faker.number.int({ min: 6, max: 10 }));
  const skills = skillNames.map((name) => ({
    name,
    score: roundTo(faker.number.float({ min: 30, max: 95 }), 0),
    trend: pick(["up", "down", "stable"] as const),
  }));

  // Generate interventions for this student
  const interventionCount = s.riskLevel === "high" ? 3 : s.riskLevel === "medium" ? 2 : faker.number.int({ min: 0, max: 1 });
  const interventions: Intervention[] = Array.from({ length: interventionCount }, () => {
    const type = pick(INTERVENTION_TYPES);
    const descriptions = INTERVENTION_DESCRIPTIONS[type];
    const status = pick(["planned", "active", "completed", "abandoned"] as InterventionStatus[]);
    const startDate = pastDate(faker.number.int({ min: 7, max: 60 }));
    return {
      id: id("int"),
      studentId: s.id,
      studentName: s.name,
      type,
      description: pick(descriptions),
      goals: [
        `Improve ${pick(["attendance", "assignment completion", "exam scores", "participation"])} by ${faker.number.int({ min: 10, max: 30 })}%`,
        `Achieve minimum GPA of ${roundTo(faker.number.float({ min: 2.0, max: 3.0 }), 1)} by end of semester`,
      ],
      status,
      startDate,
      endDate: status === "completed" ? pastDate(faker.number.int({ min: 1, max: 5 })) : undefined,
      outcomes: status === "completed" ? "Student showed measurable improvement in targeted areas" : undefined,
      notes: [
        {
          date: startDate,
          content: "Initial assessment completed. Student is aware of support plan.",
          author: "Dr. Sarah Chen",
        },
        {
          date: pastDate(faker.number.int({ min: 1, max: 6 })),
          content: pick([
            "Follow-up meeting conducted. Student showing early signs of engagement.",
            "Student attended tutoring session. Needs continued support.",
            "Checked in with student via email. Will schedule in-person meeting.",
            "Progress review: moderate improvement in targeted areas.",
          ]),
          author: "Dr. Sarah Chen",
        },
      ],
      createdBy: "usr_faculty_01",
      createdAt: startDate,
      updatedAt: pastDate(faker.number.int({ min: 1, max: 3 })),
    };
  });

  // Risk alerts
  const riskAlerts = s.riskFactors.map((factor) => ({
    type: pick(["academic", "attendance", "engagement", "financial"]),
    severity: s.riskLevel as RiskLevel,
    message: factor,
    date: pastDate(faker.number.int({ min: 1, max: 14 })),
  }));

  // Course performance
  const courses = getStudentCourses(studentIndex);
  const coursePerformance = courses.map((code) => {
    const courseInfo = FACULTY_COURSES_TAUGHT.find((c) => c.code === code);
    const gradeIndex = s.riskLevel === "high"
      ? faker.number.int({ min: 5, max: 9 })
      : s.riskLevel === "medium"
        ? faker.number.int({ min: 3, max: 6 })
        : faker.number.int({ min: 0, max: 3 });
    return {
      courseCode: code,
      courseName: courseInfo?.name ?? code,
      grade: GRADE_LETTERS[gradeIndex],
      attendance: roundTo(faker.number.float({
        min: s.riskLevel === "high" ? 45 : s.riskLevel === "medium" ? 65 : 82,
        max: s.riskLevel === "high" ? 72 : s.riskLevel === "medium" ? 85 : 98,
      }), 1),
      assignments: roundTo(faker.number.float({
        min: s.riskLevel === "high" ? 40 : s.riskLevel === "medium" ? 60 : 80,
        max: s.riskLevel === "high" ? 70 : s.riskLevel === "medium" ? 85 : 100,
      }), 1),
    };
  });

  return {
    id: s.id,
    name: s.name,
    studentId: s.studentId,
    email: s.email,
    phone: s.phone,
    department: s.department,
    program: s.program,
    semester: s.semester,
    gpa: s.gpa,
    riskLevel: s.riskLevel,
    riskFactors: s.riskFactors,
    lastActivity: s.lastActivity,
    avatarUrl: s.avatarUrl,
    courses,
    attendanceRate: s.attendanceRate,
    enrollmentYear: s.enrollmentYear,
    creditsCompleted: faker.number.int({ min: 30, max: 120 }),
    creditsRequired: 128,
    skills,
    gpaHistory,
    attendanceHistory,
    interventions,
    riskAlerts,
    coursePerformance,
  };
}

export function generateInterventions(count: number = 10): Intervention[] {
  faker.seed(43);
  const pool = getStudentPool();
  const atRiskStudents = pool.filter((s) => s.riskLevel === "high" || s.riskLevel === "medium");

  return Array.from({ length: count }, (_, i) => {
    const student = atRiskStudents[i % atRiskStudents.length];
    const type = INTERVENTION_TYPES[i % INTERVENTION_TYPES.length];
    const descriptions = INTERVENTION_DESCRIPTIONS[type];
    const statuses: InterventionStatus[] = ["planned", "active", "active", "completed", "completed", "active", "planned", "abandoned", "active", "completed"];
    const status = statuses[i % statuses.length];
    const startDate = pastDate(faker.number.int({ min: 7, max: 90 }));
    const noteCount = faker.number.int({ min: 1, max: 4 });

    const notes: { date: string; content: string; author: string }[] = [];
    for (let n = 0; n < noteCount; n++) {
      notes.push({
        date: pastDate(faker.number.int({ min: 1, max: 30 })),
        content: pick([
          "Initial assessment and goal-setting session completed.",
          "Student showed improvement in targeted areas during weekly check-in.",
          "Discussed strategies for better time management and study habits.",
          "Referred student to writing center for additional support.",
          "Student missed scheduled session. Will follow up via email.",
          "Positive feedback from TA regarding recent lab performance.",
          "Mid-intervention review: on track for 2 of 3 goals.",
          "Student expressed interest in research opportunities. Connected with lab.",
          "Attendance has improved by 15% since intervention start.",
          "Final review scheduled for next week.",
        ]),
        author: pick(["Dr. Sarah Chen", "Dr. Sarah Chen", "TA: Michael Park", "Academic Advisor: Lisa Wong"]),
      });
    }

    // Sort notes by date descending
    notes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return {
      id: id("int"),
      studentId: student.id,
      studentName: student.name,
      type,
      description: pick(descriptions),
      goals: [
        `Improve ${pick(["GPA", "attendance", "assignment completion rate", "class participation"])} to acceptable levels`,
        `Complete all ${pick(["homework", "lab", "project"])} submissions on time for remainder of semester`,
        `Attend ${faker.number.int({ min: 2, max: 4 })} additional tutoring sessions per week`,
      ],
      status,
      startDate,
      endDate: status === "completed" || status === "abandoned" ? pastDate(faker.number.int({ min: 1, max: 7 })) : undefined,
      outcomes: status === "completed"
        ? pick([
          "Student GPA improved from 1.8 to 2.4 over the intervention period.",
          "Attendance improved by 25%. Student is now attending all scheduled sessions.",
          "All targeted goals met. Student removed from at-risk list.",
          "Partial improvement observed. Continuing with adjusted support plan.",
        ])
        : status === "abandoned"
          ? "Student withdrew from the course. Intervention no longer applicable."
          : undefined,
      notes,
      createdBy: "usr_faculty_01",
      createdAt: startDate,
      updatedAt: pastDate(faker.number.int({ min: 1, max: 5 })),
    };
  });
}

export function generateFacultyCourses(count: number = 5): FacultyCourse[] {
  faker.seed(43);
  return FACULTY_COURSES_TAUGHT.slice(0, count).map((c) => {
    const totalStudents = c.totalStudents;
    const studentsAtRisk = faker.number.int({ min: 2, max: Math.floor(totalStudents * 0.2) });
    return {
      id: id("crs"),
      code: c.code,
      name: c.name,
      semester: currentSemesterLabel,
      credits: c.credits,
      totalStudents,
      studentsAtRisk,
      averageGrade: roundTo(faker.number.float({ min: 2.6, max: 3.5 }), 2),
      attendanceRate: roundTo(faker.number.float({ min: 78, max: 94 }), 1),
      schedule: c.schedule,
      room: c.room,
      createdAt: pastDate(120),
      updatedAt: pastDate(1),
    };
  });
}

export function generateFacultyCourseDetail(courseId: string): FacultyCourseDetail | null {
  faker.seed(43);
  const courses = generateFacultyCourses();
  const course = courses.find((c) => c.id === courseId);
  if (!course) return null;

  const courseInfo = FACULTY_COURSES_TAUGHT.find((c) => c.code === course.code);
  if (!courseInfo) return null;

  // Generate students in this course
  const pool = getStudentPool();
  const courseStudents = pool.slice(0, course.totalStudents).map((s) => {
    const gradeIndex = s.riskLevel === "high"
      ? faker.number.int({ min: 5, max: 9 })
      : s.riskLevel === "medium"
        ? faker.number.int({ min: 3, max: 6 })
        : faker.number.int({ min: 0, max: 3 });
    return {
      id: s.id,
      name: s.name,
      gpa: s.gpa,
      attendance: s.attendanceRate,
      grade: GRADE_LETTERS[gradeIndex],
      riskLevel: s.riskLevel,
    };
  });

  // Grade distribution
  const gradeDistribution = GRADE_LETTERS.slice(0, 8).map((grade) => ({
    grade,
    count: faker.number.int({ min: 1, max: Math.floor(course.totalStudents / 4) }),
  }));

  // Attendance trend over 12 weeks
  const attendanceTrend = Array.from({ length: 12 }, (_, i) => ({
    week: `Week ${i + 1}`,
    rate: roundTo(faker.number.float({ min: 72, max: 96 }), 1),
  }));

  // Assignment completion rates
  const assignmentNames = [
    "Homework 1: Foundations",
    "Homework 2: Implementation",
    "Homework 3: Analysis",
    "Lab 1: Hands-on Exercise",
    "Lab 2: Group Project",
    "Midterm Exam",
    "Project Milestone 1",
    "Project Milestone 2",
    "Homework 4: Advanced Topics",
    "Final Project Submission",
  ];
  const assignmentCompletion = assignmentNames.slice(0, 8).map((name) => ({
    name,
    submitted: faker.number.int({ min: Math.floor(course.totalStudents * 0.7), max: course.totalStudents }),
    total: course.totalStudents,
    averageScore: roundTo(faker.number.float({ min: 62, max: 92 }), 1),
  }));

  // Engagement metrics
  const engagementMetrics = [
    { metric: "Forum Posts per Student", value: roundTo(faker.number.float({ min: 2, max: 8 }), 1), benchmark: 5.0 },
    { metric: "Office Hours Visits (weekly avg)", value: roundTo(faker.number.float({ min: 3, max: 12 }), 1), benchmark: 8.0 },
    { metric: "Assignment Avg. Submission Time (hrs before deadline)", value: roundTo(faker.number.float({ min: 2, max: 24 }), 1), benchmark: 12.0 },
    { metric: "Video Lecture Completion Rate (%)", value: roundTo(faker.number.float({ min: 55, max: 90 }), 1), benchmark: 75.0 },
    { metric: "Peer Review Participation (%)", value: roundTo(faker.number.float({ min: 60, max: 95 }), 1), benchmark: 80.0 },
  ];

  return {
    ...course,
    students: courseStudents,
    gradeDistribution,
    attendanceTrend,
    assignmentCompletion,
    engagementMetrics,
  };
}

export function generateGrants(count: number = 10): FacultyGrant[] {
  faker.seed(43);
  const statuses: FacultyGrant["status"][] = ["discovered", "interested", "drafting", "submitted", "funded", "rejected", "discovered", "interested", "funded", "drafting"];

  return Array.from({ length: count }, (_, i) => {
    const fb = FUNDING_BODIES[i % FUNDING_BODIES.length];
    const status = statuses[i % statuses.length];
    const topics = pickN(GRANT_TOPICS, faker.number.int({ min: 2, max: 4 }));

    return {
      id: id("grt"),
      title: `${fb.prefix}-${faker.number.int({ min: 2025, max: 2027 })}-${faker.string.alphanumeric(4).toUpperCase()}: ${topics[0]} ${pick(["Research Program", "Initiative", "Grant", "Fellowship", "Collaborative Award"])}`,
      fundingBody: fb.name,
      amount: faker.number.int({ min: 50000, max: 2000000 }),
      currency: fb.name.includes("EU") ? "EUR" : "USD",
      alignmentScore: roundTo(faker.number.float({ min: 0.55, max: 0.98 }), 2),
      successProbability: roundTo(faker.number.float({ min: 0.15, max: 0.85 }), 2),
      deadline: futureDate(faker.number.int({ min: 14, max: 180 })),
      topics,
      status,
      matchExplanation: pick([
        "Strong alignment with your published work on neural network architectures and explainability research.",
        "Your recent publications on federated learning directly address the call's focus areas.",
        "Interdisciplinary scope matches your collaboration profile in AI for education.",
        "Aligns with your expertise in NLP and multimodal learning from recent conference papers.",
        "Your h-index and publication record meet the eligibility criteria. Topic overlap is high.",
        "Matches your ongoing research in responsible AI and bias detection methodologies.",
        "Strong fit based on your lab's work in efficient edge computing for ML inference.",
        "Your co-authored papers with the target institution increase collaboration score.",
      ]),
      requirements: pickN([
        "PI must hold tenure-track or tenured position",
        "Maximum 3-year project duration",
        "Budget cap: $500,000 per year",
        "Requires institutional letter of support",
        "Open to international collaborations",
        "Must include plan for broadening participation",
        "Data management plan required",
        "Quarterly progress reports",
        "Results must be published open-access",
        "Requires matching funds from institution",
      ], faker.number.int({ min: 3, max: 5 })),
    };
  });
}

export function generateCollaborations(count: number = 15): FacultyCollaboration[] {
  faker.seed(43);
  const expertiseAreas = [
    ["Machine Learning", "Deep Learning", "Computer Vision"],
    ["Natural Language Processing", "Computational Linguistics", "Text Mining"],
    ["Reinforcement Learning", "Robotics", "Autonomous Systems"],
    ["Graph Neural Networks", "Network Analysis", "Social Computing"],
    ["AI Safety", "Explainable AI", "Trustworthy AI"],
    ["Federated Learning", "Privacy-Preserving ML", "Distributed Systems"],
    ["Quantum Computing", "Quantum Machine Learning", "Optimization"],
    ["Computational Biology", "Bioinformatics", "Drug Discovery"],
    ["Computer Vision", "Medical Imaging", "Pattern Recognition"],
    ["Edge Computing", "IoT", "Efficient ML"],
    ["Multimodal Learning", "Audio Processing", "Speech Recognition"],
    ["AI for Education", "Intelligent Tutoring", "Learning Analytics"],
    ["Generative Models", "GANs", "Diffusion Models"],
    ["Knowledge Graphs", "Semantic Web", "Information Extraction"],
    ["Time Series Analysis", "Anomaly Detection", "Predictive Maintenance"],
  ];

  return Array.from({ length: count }, (_, i) => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const institution = RESEARCH_INSTITUTIONS[i % RESEARCH_INSTITUTIONS.length];
    const dept = pick(["Computer Science", "Electrical Engineering", "Data Science", "Statistics", "Mathematics", "Biomedical Engineering"]);
    const expertise = expertiseAreas[i % expertiseAreas.length];

    return {
      id: id("col"),
      name: `Dr. ${firstName} ${lastName}`,
      institution,
      department: dept,
      expertise,
      sharedPublications: faker.number.int({ min: 0, max: 8 }),
      matchScore: roundTo(faker.number.float({ min: 0.60, max: 0.97 }), 2),
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@${institution.toLowerCase().replace(/\s+/g, "").replace(/[^a-z]/g, "")}.edu`,
      avatarUrl: faker.datatype.boolean(0.4) ? faker.image.avatar() : null,
    };
  });
}

export function generatePublications(count: number = 20): FacultyPublication[] {
  faker.seed(43);
  const publicationTitles = [
    "Attention-Guided Feature Fusion for Multi-Scale Object Detection",
    "Federated Learning with Differential Privacy: A Comprehensive Survey",
    "Transformer Architectures for Time Series Forecasting: A Benchmark Study",
    "Explaining Black-Box Models Through Counterfactual Analysis",
    "Graph Convolutional Networks for Molecular Property Prediction",
    "Self-Supervised Pre-Training for Low-Resource NLP Tasks",
    "Efficient Neural Architecture Search via Progressive Pruning",
    "Adversarial Robustness in Deep Learning: Challenges and Opportunities",
    "Multi-Agent Reinforcement Learning for Cooperative Navigation",
    "Bias Detection and Mitigation in Large Language Models",
    "Knowledge Distillation for Edge Deployment of Vision Transformers",
    "Continual Learning Without Catastrophic Forgetting: A Meta-Learning Approach",
    "Causal Inference in Observational Studies Using Neural Networks",
    "Scalable Bayesian Deep Learning for Uncertainty Quantification",
    "Cross-Modal Retrieval with Contrastive Language-Image Pre-Training",
    "Privacy-Preserving Federated Learning in Healthcare Applications",
    "Dynamic Sparse Training for Resource-Constrained Environments",
    "Neuro-Symbolic AI: Bridging Logic and Learning",
    "Multimodal Sentiment Analysis with Cross-Attention Mechanisms",
    "Reinforcement Learning from Human Feedback: Theory and Practice",
  ];

  const coAuthorPool = [
    "J. Kim", "R. Patel", "M. Zhang", "A. Thompson", "L. Garcia",
    "K. Nakamura", "P. Muller", "S. Okafor", "H. Liu", "D. Rossi",
    "T. Anderson", "Y. Wang", "B. Fernandez", "N. Gupta", "C. Park",
  ];

  const types: FacultyPublication["type"][] = [
    "journal", "conference", "journal", "conference", "conference",
    "journal", "preprint", "conference", "journal", "conference",
    "book_chapter", "journal", "conference", "preprint", "conference",
    "journal", "conference", "journal", "preprint", "conference",
  ];

  const statusMap: Record<FacultyPublication["type"], FacultyPublication["status"][]> = {
    journal: ["published", "published", "in_review", "accepted"],
    conference: ["published", "published", "published", "accepted"],
    book_chapter: ["published", "published"],
    preprint: ["preprint", "preprint", "in_review"],
  };

  return Array.from({ length: count }, (_, i) => {
    const type = types[i % types.length];
    const status = pick(statusMap[type]);
    const year = faker.number.int({ min: 2019, max: currentYear });
    const coAuthors = pickN(coAuthorPool, faker.number.int({ min: 2, max: 5 }));

    return {
      id: id("pub"),
      title: publicationTitles[i % publicationTitles.length],
      journal: type === "conference"
        ? `Proceedings of ${pick(CONFERENCE_NAMES)} ${year}`
        : type === "preprint"
          ? "arXiv"
          : pick(JOURNAL_NAMES),
      year,
      citations: year < currentYear - 1
        ? faker.number.int({ min: 5, max: 180 })
        : year === currentYear - 1
          ? faker.number.int({ min: 0, max: 45 })
          : faker.number.int({ min: 0, max: 8 }),
      coAuthors,
      doi: status === "published" || status === "accepted"
        ? `10.${faker.number.int({ min: 1000, max: 9999 })}/${faker.string.alphanumeric(8)}`
        : type === "preprint"
          ? `10.48550/arXiv.${year}.${faker.string.numeric(5)}`
          : undefined,
      type,
      status,
    };
  });
}

export function generateBriefings(): AiBriefing[] {
  faker.seed(43);
  const courses = generateFacultyCourses();
  const pool = getStudentPool();

  return courses.map((course) => {
    const courseInfo = FACULTY_COURSES_TAUGHT.find((c) => c.code === course.code);
    const atRiskStudents = pool
      .filter((s) => s.riskLevel === "high" || s.riskLevel === "medium")
      .slice(0, faker.number.int({ min: 2, max: 5 }));

    const studentsToWatch = atRiskStudents.map((s) => ({
      studentId: s.id,
      name: s.name,
      reason: pick([
        "Missed last 2 classes. GPA trending downward.",
        "Assignment 3 not submitted. Previously consistent student.",
        "Midterm score 15% below class average. May need tutoring.",
        "Attendance dropped from 90% to 65% in past 3 weeks.",
        "Late submission pattern emerging. Was on time for first 4 assignments.",
        "Scored significantly below personal average on recent quiz.",
        "No participation in discussion forums for 2 weeks.",
      ]),
      riskLevel: s.riskLevel,
    }));

    const keyInsights = pickN([
      `Class average on recent assignment was ${roundTo(faker.number.float({ min: 68, max: 82 }), 1)}%, ${pick(["above", "below"])} the historical average.`,
      `${faker.number.int({ min: 3, max: 8 })} students showed significant improvement since the midterm review session.`,
      `Attendance has ${pick(["improved by 5%", "declined by 3%", "remained stable"])} compared to last week.`,
      `The ${pick(["recursion", "dynamic programming", "backpropagation", "gradient descent", "attention mechanism"])} topic had the highest confusion rate in office hours.`,
      `${faker.number.int({ min: 2, max: 4 })} students are approaching the late submission threshold for the semester.`,
      `Forum activity spiked around the ${pick(["project milestone", "homework deadline", "midterm"])} — consider addressing common questions in class.`,
      `Top performers are engaging with optional challenge problems at a ${faker.number.int({ min: 60, max: 85 })}% rate.`,
    ], faker.number.int({ min: 3, max: 5 }));

    const topicSuggestions = pickN([
      "Review recursion fundamentals — multiple students struggling in lab",
      "Introduce practical coding exercise for the current theory module",
      "Consider a brief review of prerequisite linear algebra concepts",
      "Address common misconceptions about time complexity analysis",
      "Use real-world dataset for the upcoming ML project to increase engagement",
      "Introduce pair programming for next lab to help struggling students",
      "Schedule a Q&A session before the project milestone deadline",
      "Share industry guest lecture recording on practical applications",
    ], faker.number.int({ min: 2, max: 4 }));

    const actionItems: AiBriefing["actionItems"] = [
      { text: `Reach out to ${atRiskStudents[0]?.name ?? "at-risk student"} about missed assignments`, priority: "high", completed: false },
      { text: "Update grading rubric for Project Milestone 2 based on student feedback", priority: "medium", completed: false },
      { text: "Post supplementary resources for topics with high confusion rate", priority: "medium", completed: true },
      { text: "Schedule meeting with TA to discuss lab session adjustments", priority: "low", completed: false },
      { text: "Review and approve extension requests before Friday deadline", priority: "high", completed: false },
    ];

    const classMetrics: AiBriefing["classMetrics"] = [
      { metric: "Average Grade", value: `${roundTo(faker.number.float({ min: 72, max: 88 }), 1)}%`, trend: pick(["up", "down", "stable"]) },
      { metric: "Attendance Rate", value: `${roundTo(faker.number.float({ min: 78, max: 95 }), 1)}%`, trend: pick(["up", "down", "stable"]) },
      { metric: "Assignment Completion", value: `${roundTo(faker.number.float({ min: 80, max: 96 }), 1)}%`, trend: pick(["up", "stable"]) },
      { metric: "Students At Risk", value: `${course.studentsAtRisk}`, trend: pick(["down", "stable", "up"]) },
      { metric: "Forum Engagement", value: `${roundTo(faker.number.float({ min: 3, max: 8 }), 1)} posts/student`, trend: pick(["up", "stable"]) },
    ];

    return {
      id: id("brf"),
      courseId: course.id,
      courseName: course.name,
      courseCode: course.code,
      classTime: courseInfo?.schedule ?? course.schedule,
      generatedAt: new Date(now.getTime() - faker.number.int({ min: 30, max: 120 }) * 60 * 1000).toISOString(),
      keyInsights,
      studentsToWatch,
      topicSuggestions,
      actionItems,
      classMetrics,
    };
  });
}

export function generateFacultyProfile(): FacultyProfile {
  return {
    name: "Dr. Sarah Chen",
    email: "faculty@glimmora.dev",
    facultyId: "FAC2024001",
    department: "Computer Science",
    title: "Associate Professor",
    officeHours: "MWF 2:00-4:00 PM, TTh by appointment",
    office: "CS Building, Room 412",
    phone: "+1 (555) 234-5678",
    bio: "Associate Professor of Computer Science specializing in machine learning, natural language processing, and AI for education. My research focuses on developing interpretable ML models and applying AI techniques to improve educational outcomes. I lead the Intelligent Systems Lab, where we work on explainable AI, federated learning, and adaptive educational technology.",
    avatarUrl: null,
    researchInterests: [
      "Machine Learning",
      "Natural Language Processing",
      "Explainable AI",
      "AI for Education",
      "Federated Learning",
      "Deep Learning",
    ],
    expertise: [
      "Neural Network Architectures",
      "Transformer Models",
      "Transfer Learning",
      "Educational Data Mining",
      "Privacy-Preserving ML",
      "Statistical Learning Theory",
    ],
    socialLinks: [
      { platform: "Google Scholar", url: "https://scholar.google.com/citations?user=sarahchen" },
      { platform: "GitHub", url: "https://github.com/sarahchen-ml" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/dr-sarah-chen" },
      { platform: "Twitter", url: "https://twitter.com/sarahchen_ai" },
      { platform: "ORCID", url: "https://orcid.org/0000-0002-1234-5678" },
    ],
  };
}
