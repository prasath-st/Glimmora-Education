import { faker } from "@faker-js/faker";
import { getAssessmentsByCourse } from "@/mocks/data/db";
import type {
  FacultyDashboard,
  UpcomingClass,
  FacultyStudentListItem,
  FacultyStudentDetail,
  FacultyCourse,
  FacultyCourseDetail,
  AiBriefing,
  FacultyProfile,
  CourseModule,
  CourseMaterial,
  FacultyAssignment,
  AssignmentRubric,
  StudentSubmission,
  GradebookEntry,
  AttendanceSession,
  AttendanceRecord,
} from "@/lib/api/types/faculty.types";
import type { RiskLevel } from "@/lib/api/types/common.types";

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

  const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const weeklyTrend = weekDays.map((day) => ({
    day,
    atRisk: faker.number.int({ min: 4, max: 9 }),
  }));

  return {
    atRiskStudentCount: atRiskStudents.filter((s) => s.riskLevel === "high").length,
    totalStudents: students.length,
    upcomingClasses,
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
    riskAlerts,
    coursePerformance,
  };
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

// ─── LMS Generators ──────────────────────────────────────────────────────────

const MODULE_TEMPLATES: { title: string; description: string; materials: { title: string; type: CourseMaterial["type"] }[] }[] = [
  {
    title: "Module 1: Foundations & Prerequisites",
    description: "Core concepts and mathematical foundations needed for the course. Reviews prerequisite knowledge and establishes baseline understanding.",
    materials: [
      { title: "Course Syllabus & Overview", type: "pdf" },
      { title: "Foundational Concepts Lecture", type: "video" },
      { title: "Mathematical Prerequisites Review", type: "slides" },
      { title: "Supplementary Reading List", type: "link" },
    ],
  },
  {
    title: "Module 2: Core Theory",
    description: "In-depth exploration of the core theoretical framework. Includes proofs, derivations, and analytical techniques.",
    materials: [
      { title: "Core Theory Lecture Notes", type: "pdf" },
      { title: "Theory Deep Dive - Part 1", type: "video" },
      { title: "Theory Deep Dive - Part 2", type: "video" },
      { title: "Practice Problems Set", type: "pdf" },
    ],
  },
  {
    title: "Module 3: Algorithms & Implementation",
    description: "Hands-on implementation of core algorithms. Bridges theory to practice with coding exercises and lab sessions.",
    materials: [
      { title: "Algorithm Design Slides", type: "slides" },
      { title: "Live Coding Session Recording", type: "video" },
      { title: "Implementation Guide", type: "pdf" },
      { title: "GitHub Starter Code Repository", type: "link" },
    ],
  },
  {
    title: "Module 4: Advanced Topics",
    description: "Extension of core concepts to advanced applications. Covers state-of-the-art approaches and recent research developments.",
    materials: [
      { title: "Advanced Topics Lecture", type: "video" },
      { title: "Research Paper Summaries", type: "pdf" },
      { title: "Case Study Presentation", type: "slides" },
    ],
  },
  {
    title: "Module 5: Project & Applications",
    description: "Capstone module focused on real-world application. Students apply learned concepts to practical projects.",
    materials: [
      { title: "Project Guidelines", type: "pdf" },
      { title: "Example Project Walkthrough", type: "video" },
      { title: "Evaluation Rubric", type: "pdf" },
      { title: "Dataset Repository", type: "link" },
    ],
  },
];

export function generateCourseModules(courseId: string): CourseModule[] {
  const moduleCount = faker.number.int({ min: 3, max: 5 });
  const templates = MODULE_TEMPLATES.slice(0, moduleCount);

  return templates.map((t, order) => {
    const moduleId = id("mod");
    const materialCount = faker.number.int({ min: 2, max: t.materials.length });
    const selectedMaterials = t.materials.slice(0, materialCount);

    const materials: CourseMaterial[] = selectedMaterials.map((m) => ({
      id: id("mat"),
      moduleId,
      title: m.title,
      type: m.type,
      url: m.type === "link"
        ? `https://resources.university.edu/${faker.string.alphanumeric(8)}`
        : `/uploads/courses/${courseId}/${faker.string.alphanumeric(12)}.${m.type === "pdf" ? "pdf" : m.type === "video" ? "mp4" : "pptx"}`,
      fileSize: m.type !== "link" ? faker.number.int({ min: 512000, max: 52428800 }) : undefined,
      duration: m.type === "video" ? faker.number.int({ min: 600, max: 5400 }) : undefined,
      uploadedAt: pastDate(faker.number.int({ min: 7, max: 90 })),
    }));

    return {
      id: moduleId,
      courseId,
      title: t.title,
      description: t.description,
      order: order + 1,
      materials,
    };
  });
}

// Quizzes / exams are no longer Assignments — they're authored as Assessments
// (see assessment.generator.ts). Faculty's seeded Assignments tab now shows
// only file-submission work: homeworks, projects, milestones.
const ASSIGNMENT_TEMPLATES: { title: string; description: string; type: FacultyAssignment["type"]; weight: number; maxScore: number }[] = [
  { title: "Homework 1: Foundations", description: "Apply foundational concepts through analytical problems and short coding exercises.", type: "assignment", weight: 10, maxScore: 100 },
  { title: "Homework 2: Core Implementation", description: "Implement core algorithms from scratch with correctness and efficiency analysis.", type: "assignment", weight: 10, maxScore: 100 },
  { title: "Project Milestone 1: Proposal", description: "Submit project proposal with problem statement, dataset description, and methodology plan.", type: "project", weight: 10, maxScore: 100 },
  { title: "Homework 3: Advanced Topics", description: "Problem set covering advanced algorithms, optimization, and analysis techniques.", type: "assignment", weight: 10, maxScore: 100 },
  { title: "Final Project Submission", description: "Complete project with implementation, evaluation, report, and presentation slides.", type: "project", weight: 25, maxScore: 100 },
];

export function generateFacultyAssignments(courseId: string): FacultyAssignment[] {
  const count = faker.number.int({ min: 5, max: 7 });
  const templates = ASSIGNMENT_TEMPLATES.slice(0, count);
  const statuses: FacultyAssignment["status"][] = ["published", "published", "published", "closed", "published", "draft", "draft"];

  return templates.map((t, i) => {
    const status = statuses[i % statuses.length];
    const totalStudents = faker.number.int({ min: 25, max: 45 });
    const submissionCount = status === "draft" ? 0 : faker.number.int({ min: Math.floor(totalStudents * 0.6), max: totalStudents });
    const gradedCount = status === "closed" ? submissionCount : status === "published" ? faker.number.int({ min: 0, max: submissionCount }) : 0;

    const rubricCount = faker.number.int({ min: 2, max: 3 });
    const rubricTemplates: AssignmentRubric[] = [
      { criterion: "Correctness", description: "Solution produces correct results for all test cases", maxPoints: Math.floor(t.maxScore * 0.4) },
      { criterion: "Code Quality", description: "Clean, well-documented code with proper structure and naming", maxPoints: Math.floor(t.maxScore * 0.3) },
      { criterion: "Analysis & Discussion", description: "Thorough analysis of results with insightful discussion", maxPoints: Math.floor(t.maxScore * 0.3) },
    ];

    return {
      id: id("asg"),
      courseId,
      title: t.title,
      description: t.description,
      type: t.type,
      dueDate: status === "closed" ? pastDate(faker.number.int({ min: 14, max: 60 })) : futureDate(faker.number.int({ min: 3, max: 45 })),
      maxScore: t.maxScore,
      weight: t.weight,
      status,
      submissionCount,
      gradedCount,
      rubric: rubricTemplates.slice(0, rubricCount),
    };
  });
}

const STUDENT_NAME_POOL = [
  "Alice Johnson", "Bob Williams", "Carol Martinez", "David Brown", "Eva Chen",
  "Frank Kim", "Grace Patel", "Henry Nguyen", "Irene Thompson", "James Garcia",
  "Karen Lee", "Liam Davis", "Monica Wilson", "Nathan Taylor", "Olivia Anderson",
];

export function generateStudentSubmissions(assignmentId: string): StudentSubmission[] {
  const count = faker.number.int({ min: 8, max: 15 });

  return Array.from({ length: count }, (_, i) => {
    const studentName = STUDENT_NAME_POOL[i % STUDENT_NAME_POOL.length];
    const isGraded = faker.datatype.boolean(0.6);
    const isLate = faker.datatype.boolean(0.15);
    const score = isGraded ? faker.number.int({ min: 45, max: 100 }) : undefined;

    return {
      id: id("sub"),
      assignmentId,
      studentId: id("stu"),
      studentName,
      submittedAt: pastDate(faker.number.int({ min: 1, max: 30 })),
      fileName: `${studentName.split(" ")[0].toLowerCase()}_${assignmentId.slice(-6)}.${pick(["pdf", "zip", "py", "ipynb"])}`,
      fileUrl: `/uploads/submissions/${faker.string.alphanumeric(16)}`,
      score,
      feedback: isGraded
        ? pick([
            "Good work overall. Strong implementation with clear documentation.",
            "Solid effort. Some edge cases missed in the analysis section.",
            "Excellent submission. Above-average quality in both code and writeup.",
            "Meets expectations. Consider expanding the discussion of results.",
            "Below average. Key concepts were not properly applied. See detailed notes.",
            "Great improvement from the last assignment. Keep it up!",
            "Partially correct. The algorithmic approach needs revision.",
          ])
        : undefined,
      status: isGraded ? "graded" : isLate ? "late" : "submitted",
    };
  });
}

export function generateGradebook(courseId: string): GradebookEntry[] {
  const assignments = generateFacultyAssignments(courseId);
  // Pull in current assessments for this course from the cross-portal store so
  // gradebook rows show one cell per in-browser quiz/exam too.
  const assessments = getAssessmentsByCourse(courseId);
  const studentCount = faker.number.int({ min: 12, max: 18 });

  return Array.from({ length: studentCount }, (_, i) => {
    const studentName = STUDENT_NAME_POOL[i % STUDENT_NAME_POOL.length];
    let weightedSum = 0;
    let totalWeight = 0;

    const assignmentScores = assignments.map((a) => {
      const hasSubmitted = faker.datatype.boolean(0.85);
      const score = hasSubmitted ? faker.number.int({ min: 40, max: 100 }) : null;
      if (score !== null) {
        weightedSum += (score / a.maxScore) * a.weight;
        totalWeight += a.weight;
      }
      return {
        assignmentId: a.id,
        title: a.title,
        score,
        maxScore: a.maxScore,
        weight: a.weight,
        status: score !== null ? "graded" : "pending",
      };
    });

    // Synthesise per-student best-scores for published/closed assessments;
    // drafts have no scores yet. Real student attempts will be folded in by
    // the handler at GET-time for the signed-in student.
    const assessmentScores = assessments.map((a) => {
      const isLive = a.status === "published" || a.status === "closed";
      const hasAttempted = isLive && faker.datatype.boolean(0.8);
      const score = hasAttempted
        ? faker.number.int({ min: Math.floor(a.maxScore * 0.4), max: a.maxScore })
        : null;
      if (score !== null) {
        weightedSum += (score / a.maxScore) * a.weight;
        totalWeight += a.weight;
      }
      return {
        assessmentId: a.id,
        title: a.title,
        score,
        maxScore: a.maxScore,
        weight: a.weight,
        status: score !== null ? "graded" : "pending",
      };
    });

    const weightedAverage = totalWeight > 0 ? roundTo((weightedSum / totalWeight) * 100, 1) : 0;

    return {
      studentId: id("stu"),
      studentName,
      assignments: assignmentScores,
      assessments: assessmentScores,
      weightedAverage,
    };
  });
}

const SESSION_TOPICS = [
  "Introduction & Course Overview",
  "Fundamentals Review",
  "Core Concept: Definitions & Properties",
  "Algorithm Design Strategies",
  "Complexity Analysis",
  "Hands-On Lab: Implementation",
  "Midterm Review Session",
  "Advanced Technique: Optimization",
  "Guest Lecture: Industry Applications",
  "Research Frontiers Discussion",
  "Project Work Session",
  "Peer Code Review Workshop",
  "Advanced Analysis Methods",
  "Case Study: Real-World System",
  "Final Review & Q&A",
];

export function generateAttendanceSessions(courseId: string): AttendanceSession[] {
  const sessionCount = faker.number.int({ min: 10, max: 15 });
  const studentCount = 15;
  const studentNames = STUDENT_NAME_POOL.slice(0, studentCount);

  return Array.from({ length: sessionCount }, (_, i) => {
    const sessionDate = new Date(now);
    sessionDate.setDate(sessionDate.getDate() - (sessionCount - i) * 3); // every ~3 days
    const topic = SESSION_TOPICS[i % SESSION_TOPICS.length];

    const records: AttendanceRecord[] = studentNames.map((name) => {
      const roll = faker.number.float({ min: 0, max: 1 });
      let status: AttendanceRecord["status"];
      if (roll < 0.75) status = "present";
      else if (roll < 0.88) status = "absent";
      else status = "late";

      return {
        studentId: id("stu"),
        studentName: name,
        status,
      };
    });

    const presentCount = records.filter((r) => r.status === "present").length;
    const absentCount = records.filter((r) => r.status === "absent").length;
    const lateCount = records.filter((r) => r.status === "late").length;

    return {
      id: id("att"),
      courseId,
      date: isoDate(sessionDate),
      topic,
      records,
      presentCount,
      absentCount,
      lateCount,
    };
  });
}
