import { faker } from "@faker-js/faker";
import type {
  StudentDashboard,
  RiskAlert,
  Deadline,
  ActivityItem,
  Course,
  Assignment,
  TranscriptSemester,
  SkillScore,
  SkillEvolutionPoint,
  SkillGap,
  Credential,
  CareerReadiness,
  JobMatch,
  Application,
  PortfolioItem,
  StudentRecommendation,
  Appeal,
  StudentProfile,
  NotificationPreferences,
  Notification,
  WorkExperience,
  StudentCourseModule,
  StudentCourseMaterial,
  AssignmentDetail,
} from "@/lib/api/types/student.types";
import type {
  AppealStatus,
  PipelineStage,
  CredentialStatus,
} from "@/lib/api/types/common.types";

faker.seed(42);

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

function roundTo(val: number, decimals: number): number {
  const factor = Math.pow(10, decimals);
  return Math.round(val * factor) / factor;
}

// ─── Realistic Constants ──────────────────────────────────────────────────────

const CS_COURSES: { code: string; name: string; credits: number }[] = [
  { code: "CS 101", name: "Introduction to Computer Science", credits: 3 },
  { code: "CS 201", name: "Data Structures & Algorithms", credits: 4 },
  { code: "CS 202", name: "Discrete Mathematics", credits: 3 },
  { code: "CS 301", name: "Operating Systems", credits: 4 },
  { code: "CS 302", name: "Database Systems", credits: 3 },
  { code: "CS 303", name: "Computer Networks", credits: 3 },
  { code: "CS 310", name: "Software Engineering", credits: 3 },
  { code: "CS 320", name: "Computer Architecture", credits: 3 },
  { code: "CS 401", name: "Machine Learning", credits: 3 },
  { code: "CS 402", name: "Artificial Intelligence", credits: 3 },
  { code: "CS 410", name: "Distributed Systems", credits: 3 },
  { code: "CS 415", name: "Computer Security", credits: 3 },
  { code: "CS 420", name: "Compiler Design", credits: 3 },
  { code: "CS 430", name: "Cloud Computing", credits: 3 },
  { code: "CS 440", name: "Natural Language Processing", credits: 3 },
  { code: "CS 450", name: "Computer Vision", credits: 3 },
  { code: "MATH 201", name: "Linear Algebra", credits: 3 },
  { code: "MATH 301", name: "Probability & Statistics", credits: 3 },
  { code: "ENG 101", name: "Technical Writing", credits: 3 },
  { code: "PHYS 201", name: "Physics for Engineers", credits: 4 },
  { code: "CS 305", name: "Web Application Development", credits: 3 },
  { code: "CS 350", name: "Human-Computer Interaction", credits: 3 },
  { code: "CS 405", name: "Deep Learning", credits: 3 },
  { code: "CS 425", name: "Parallel Computing", credits: 3 },
];

const GRADE_SCALE: { letter: string; points: number; minPercent: number }[] = [
  { letter: "A", points: 4.0, minPercent: 93 },
  { letter: "A-", points: 3.7, minPercent: 90 },
  { letter: "B+", points: 3.3, minPercent: 87 },
  { letter: "B", points: 3.0, minPercent: 83 },
  { letter: "B-", points: 2.7, minPercent: 80 },
  { letter: "C+", points: 2.3, minPercent: 77 },
  { letter: "C", points: 2.0, minPercent: 73 },
  { letter: "C-", points: 1.7, minPercent: 70 },
  { letter: "D", points: 1.0, minPercent: 60 },
];

function gradeFromPoints(points: number): string {
  const closest = GRADE_SCALE.reduce((prev, curr) =>
    Math.abs(curr.points - points) < Math.abs(prev.points - points)
      ? curr
      : prev
  );
  return closest.letter;
}

function pointsFromGrade(letter: string): number {
  return GRADE_SCALE.find((g) => g.letter === letter)?.points ?? 3.0;
}

const SKILL_LIST: { name: string; category: string }[] = [
  { name: "Python", category: "Programming Languages" },
  { name: "JavaScript", category: "Programming Languages" },
  { name: "TypeScript", category: "Programming Languages" },
  { name: "Java", category: "Programming Languages" },
  { name: "C++", category: "Programming Languages" },
  { name: "React", category: "Frameworks" },
  { name: "Node.js", category: "Frameworks" },
  { name: "Data Structures", category: "Fundamentals" },
  { name: "Algorithms", category: "Fundamentals" },
  { name: "Machine Learning", category: "AI/ML" },
  { name: "Deep Learning", category: "AI/ML" },
  { name: "SQL", category: "Data" },
  { name: "System Design", category: "Architecture" },
  { name: "Git & Version Control", category: "Tools" },
  { name: "Docker & Containers", category: "DevOps" },
  { name: "Cloud Services (AWS)", category: "DevOps" },
  { name: "REST API Design", category: "Architecture" },
  { name: "Technical Communication", category: "Soft Skills" },
  { name: "Problem Solving", category: "Fundamentals" },
  { name: "Agile Methodologies", category: "Soft Skills" },
];

const TECH_COMPANIES = [
  "Nextera Technologies",
  "Axiom Software",
  "CloudPeak Systems",
  "DataForge AI",
  "Quantum Dynamics Inc.",
  "Veritas Engineering",
  "Cirrus Labs",
  "Arcadia Tech",
  "Meridian Analytics",
  "Helix Innovations",
  "Prism Digital",
  "Atlas Computing",
  "Nova Systems",
  "Stratos Solutions",
  "Ember Technologies",
];

const FACULTY_NAMES = [
  "Dr. Sarah Chen",
  "Prof. Michael Torres",
  "Dr. Emily Johnson",
  "Prof. David Kim",
  "Dr. Lisa Park",
  "Prof. Robert Adams",
  "Dr. Anita Gupta",
  "Prof. James Wilson",
  "Dr. Maria Rodriguez",
  "Prof. Alan Scott",
];

const SEMESTERS_HISTORY = [
  { semester: "Fall", year: (currentYear - 3).toString() },
  { semester: "Spring", year: (currentYear - 2).toString() },
  { semester: "Fall", year: (currentYear - 2).toString() },
  { semester: "Spring", year: (currentYear - 1).toString() },
  { semester: "Fall", year: (currentYear - 1).toString() },
  { semester: "Spring", year: currentYear.toString() },
  { semester: "Fall", year: currentYear.toString() },
];

// ─── Assignment Generator ─────────────────────────────────────────────────────

function generateAssignments(
  courseStatus: "active" | "completed",
  courseId: string
): Assignment[] {
  const count = faker.number.int({ min: 4, max: 8 });
  const assignments: Assignment[] = [];

  // Quizzes/exams now live as Assessments (see assessment.generator.ts).
  // Course assignments are file-submission work only.
  const types: Assignment["type"][] = [
    "assignment",
    "assignment",
    "assignment",
    "project",
    "project",
  ];
  const totalWeight = 100;
  const weights: number[] = [];
  let remaining = totalWeight;
  for (let i = 0; i < count; i++) {
    if (i === count - 1) {
      weights.push(remaining);
    } else {
      const w = faker.number.int({
        min: 5,
        max: Math.min(35, remaining - (count - i - 1) * 5),
      });
      weights.push(w);
      remaining -= w;
    }
  }

  for (let i = 0; i < count; i++) {
    const type = pick(types);
    const maxScore = faker.number.int({ min: 50, max: 100 });
    const isGraded = courseStatus === "completed" || faker.datatype.boolean(0.7);

    let status: Assignment["status"];
    let score: number | undefined;
    let submittedAt: string | undefined;
    let dueDate: string;
    let feedback: string | undefined;

    if (courseStatus === "completed") {
      dueDate = pastDate(faker.number.int({ min: 30, max: 180 }));
      const missed = faker.datatype.boolean(0.05);
      if (missed) {
        status = "missed";
        score = 0;
      } else {
        status = "graded";
        score = faker.number.int({ min: Math.floor(maxScore * 0.55), max: maxScore });
        submittedAt = pastDate(faker.number.int({ min: 31, max: 181 }));
        feedback = faker.datatype.boolean(0.6)
          ? faker.lorem.sentence()
          : undefined;
      }
    } else {
      // active course
      if (i < count - 2 && isGraded) {
        dueDate = pastDate(faker.number.int({ min: 7, max: 90 }));
        const wasLate = faker.datatype.boolean(0.1);
        status = wasLate ? "late" : "graded";
        score = faker.number.int({
          min: Math.floor(maxScore * 0.5),
          max: maxScore,
        });
        submittedAt = pastDate(faker.number.int({ min: 8, max: 91 }));
        feedback = faker.datatype.boolean(0.5) ? faker.lorem.sentence() : undefined;
      } else if (i === count - 2) {
        dueDate = pastDate(3);
        status = "submitted";
        submittedAt = pastDate(4);
      } else {
        dueDate = futureDate(faker.number.int({ min: 5, max: 45 }));
        status = "upcoming";
      }
    }

    assignments.push({
      id: id("asgn"),
      title:
        type === "project"
          ? `Project: ${faker.hacker.noun()} ${faker.hacker.ingverb()}`
          : `Assignment ${i + 1}: ${faker.hacker.phrase().slice(0, 40)}`,
      type,
      dueDate,
      score,
      maxScore,
      weight: weights[i],
      status,
      submittedAt,
      feedback,
    });
  }

  return assignments;
}

// ─── Course Generator ─────────────────────────────────────────────────────────

function generateSingleCourse(
  courseInfo: (typeof CS_COURSES)[number],
  semester: string,
  status: "active" | "completed" | "withdrawn"
): Course {
  const instructor = pick(FACULTY_NAMES);
  const assignments = generateAssignments(
    status === "withdrawn" ? "completed" : status,
    courseInfo.code
  );

  let grade: string | undefined;
  let gradePoints: number | undefined;
  let attendance: number;

  if (status === "completed") {
    gradePoints = roundTo(
      faker.number.float({ min: 2.0, max: 4.0, multipleOf: 0.1 }),
      1
    );
    grade = gradeFromPoints(gradePoints);
    attendance = faker.number.int({ min: 75, max: 100 });
  } else if (status === "withdrawn") {
    grade = "W";
    gradePoints = undefined;
    attendance = faker.number.int({ min: 40, max: 70 });
  } else {
    attendance = faker.number.int({ min: 70, max: 100 });
  }

  const rooms = ["ENG 201", "SCI 305", "COMP 110", "MATH 402", "LIB 100", "TECH 215"];
  const days = ["MWF", "TTh", "MW", "MWF"];
  const times = ["9:00 AM", "10:30 AM", "1:00 PM", "2:30 PM", "4:00 PM"];

  const nowStr = isoDate(now);

  return {
    id: id("crs"),
    code: courseInfo.code,
    name: courseInfo.name,
    instructor,
    instructorEmail: `${instructor.split(" ").pop()?.toLowerCase()}@university.edu`,
    instructorId: id("fac"),
    credits: courseInfo.credits,
    semester,
    grade,
    gradePoints,
    attendance,
    status,
    schedule: status === "active" ? `${pick(days)} ${pick(times)}` : undefined,
    room: status === "active" ? pick(rooms) : undefined,
    assignments,
    createdAt: pastDate(200),
    updatedAt: nowStr,
  };
}

// ─── Exported Generators ──────────────────────────────────────────────────────

export function generateCourses(count: number = 12): Course[] {
  const shuffled = faker.helpers.shuffle([...CS_COURSES]);
  const courses: Course[] = [];

  // First 4 are active (current semester)
  const activeCount = Math.min(4, count);
  for (let i = 0; i < activeCount; i++) {
    courses.push(
      generateSingleCourse(shuffled[i], currentSemesterLabel, "active")
    );
  }

  // Rest are completed from past semesters
  for (let i = activeCount; i < Math.min(count, shuffled.length); i++) {
    const semIdx = faker.number.int({
      min: 0,
      max: SEMESTERS_HISTORY.length - 2,
    });
    const sem = SEMESTERS_HISTORY[semIdx];
    const withdrawn = faker.datatype.boolean(0.08);
    courses.push(
      generateSingleCourse(
        shuffled[i],
        `${sem.semester} ${sem.year}`,
        withdrawn ? "withdrawn" : "completed"
      )
    );
  }

  return courses;
}

export function generateTranscript(): TranscriptSemester[] {
  const semesters: TranscriptSemester[] = [];
  let totalCreditsEarned = 0;
  let totalGradePoints = 0;
  let totalCreditsAttempted = 0;

  // Use past semesters (not current if we're mid-semester)
  const pastSemesters = SEMESTERS_HISTORY.slice(0, 7);
  const shuffled = faker.helpers.shuffle([...CS_COURSES]);
  let courseIndex = 0;

  for (let s = 0; s < pastSemesters.length; s++) {
    const sem = pastSemesters[s];
    const isCurrentSem =
      sem.semester === currentSemester && sem.year === currentYear.toString();
    const coursesPerSem = faker.number.int({ min: 4, max: 5 });
    const semCourses: Course[] = [];

    for (
      let c = 0;
      c < coursesPerSem && courseIndex < shuffled.length;
      c++, courseIndex++
    ) {
      const status = isCurrentSem ? "active" : "completed";
      semCourses.push(
        generateSingleCourse(
          shuffled[courseIndex],
          `${sem.semester} ${sem.year}`,
          status
        )
      );
    }

    const creditsAttempted = semCourses.reduce((sum, c) => sum + c.credits, 0);
    const completedCourses = semCourses.filter(
      (c) => c.status === "completed" && c.gradePoints !== undefined
    );
    const semGradePointsSum = completedCourses.reduce(
      (sum, c) => sum + (c.gradePoints ?? 0) * c.credits,
      0
    );
    const semCreditsEarned = completedCourses.reduce(
      (sum, c) => sum + c.credits,
      0
    );
    const semesterGpa =
      semCreditsEarned > 0
        ? roundTo(semGradePointsSum / semCreditsEarned, 2)
        : 0;

    totalGradePoints += semGradePointsSum;
    totalCreditsEarned += semCreditsEarned;
    totalCreditsAttempted += creditsAttempted;

    const cumulativeGpa =
      totalCreditsEarned > 0
        ? roundTo(totalGradePoints / totalCreditsEarned, 2)
        : 0;

    semesters.push({
      semester: sem.semester,
      year: sem.year,
      courses: semCourses,
      semesterGpa: isCurrentSem ? 0 : semesterGpa,
      cumulativeGpa,
      creditsAttempted,
      creditsEarned: isCurrentSem ? 0 : semCreditsEarned,
    });
  }

  return semesters;
}

export function generateSkills(count: number = 10): SkillScore[] {
  const selected = faker.helpers.shuffle([...SKILL_LIST]).slice(0, count);
  return selected.map((skill) => {
    const score = faker.number.int({ min: 45, max: 95 });
    const benchmark = faker.number.int({ min: 50, max: 85 });
    return {
      skillId: id("skill"),
      skillName: skill.name,
      category: skill.category,
      score,
      benchmark,
      trend: pick(["up", "down", "stable"] as const),
    };
  });
}

export function generateSkillEvolution(
  count: number = 12
): SkillEvolutionPoint[] {
  const skillNames = ["Python", "JavaScript", "Data Structures", "Algorithms", "Machine Learning", "System Design"];
  const points: SkillEvolutionPoint[] = [];

  // Start values
  const startValues: Record<string, number> = {};
  skillNames.forEach((name) => {
    startValues[name] = faker.number.int({ min: 30, max: 55 });
  });

  const eventMarkers = [
    { month: 3, skill: "Python", label: "Completed CS 201", type: "course" as const },
    { month: 5, skill: "Machine Learning", label: "Earned ML Badge", type: "credential" as const },
    { month: 8, skill: "Data Structures", label: "Completed DS Learning Path", type: "tutor" as const },
    { month: 10, skill: "JavaScript", label: "Completed CS 305", type: "course" as const },
  ];

  for (let i = 0; i < count; i++) {
    const date = new Date(now);
    date.setMonth(date.getMonth() - (count - 1 - i));

    const skills: Record<string, number> = {};
    skillNames.forEach((name) => {
      const growth = faker.number.int({ min: -2, max: 5 });
      startValues[name] = Math.min(
        98,
        Math.max(20, startValues[name] + growth)
      );
      skills[name] = startValues[name];
    });

    const events = eventMarkers
      .filter((e) => e.month === i)
      .map((e) => ({ skill: e.skill, label: e.label, type: e.type }));

    points.push({
      date: isoDate(date),
      skills,
      events: events.length > 0 ? events : undefined,
    });
  }

  return points;
}

export function generateSkillGaps(count: number = 4): SkillGap[] {
  const gapSkills = [
    {
      name: "System Design",
      resources: [
        {
          title: "System Design Primer",
          type: "course",
          url: "https://learn.glimmora.dev/system-design",
        },
        {
          title: "Designing Data-Intensive Applications",
          type: "book",
          url: "https://library.glimmora.dev/ddia",
        },
      ],
    },
    {
      name: "Docker & Containers",
      resources: [
        {
          title: "Docker Mastery",
          type: "course",
          url: "https://learn.glimmora.dev/docker",
        },
        {
          title: "Container Security Fundamentals",
          type: "workshop",
          url: "https://workshops.glimmora.dev/container-security",
        },
      ],
    },
    {
      name: "Cloud Services (AWS)",
      resources: [
        {
          title: "AWS Solutions Architect",
          type: "certification",
          url: "https://learn.glimmora.dev/aws-sa",
        },
        {
          title: "Cloud Architecture Patterns",
          type: "article",
          url: "https://docs.glimmora.dev/cloud-patterns",
        },
      ],
    },
    {
      name: "Machine Learning",
      resources: [
        {
          title: "ML Foundations",
          type: "course",
          url: "https://learn.glimmora.dev/ml-foundations",
        },
        {
          title: "Kaggle Competitions Starter",
          type: "practice",
          url: "https://practice.glimmora.dev/kaggle",
        },
      ],
    },
    {
      name: "Technical Communication",
      resources: [
        {
          title: "Writing for Engineers",
          type: "course",
          url: "https://learn.glimmora.dev/tech-writing",
        },
        {
          title: "Presentation Skills Workshop",
          type: "workshop",
          url: "https://workshops.glimmora.dev/presentations",
        },
      ],
    },
  ];

  const pathTitles: Record<string, { pathId: string; pathTitle: string }> = {
    "System Design": { pathId: "lp_sysdesign", pathTitle: "System Design Fundamentals" },
    "Docker & Containers": { pathId: "lp_docker", pathTitle: "Docker & Containerization Mastery" },
    "Cloud Services (AWS)": { pathId: "lp_cloud", pathTitle: "Cloud Computing with AWS" },
    "Machine Learning": { pathId: "lp_ml", pathTitle: "Machine Learning Fundamentals" },
    "Technical Communication": { pathId: "lp_techcomm", pathTitle: "Technical Communication Skills" },
  };

  return gapSkills.slice(0, count).map((gs) => {
    const current = faker.number.int({ min: 30, max: 55 });
    const required = faker.number.int({ min: 70, max: 90 });
    const pathInfo = pathTitles[gs.name];
    return {
      skillName: gs.name,
      skillId: id("skill"),
      currentScore: current,
      requiredScore: required,
      gap: required - current,
      requiredBy: `Software Engineer roles (based on ${faker.number.int({ min: 20, max: 60 })} matching job postings)`,
      learningPathId: pathInfo?.pathId,
      learningPathTitle: pathInfo?.pathTitle,
      recommendedResources: gs.resources,
    };
  });
}

export function generateCredentials(count: number = 6): Credential[] {
  const credentials: Credential[] = [];
  const types: Credential["type"][] = [
    "degree",
    "certificate",
    "badge",
    "certificate",
    "badge",
    "badge",
    "certificate",
    "transcript",
  ];
  const statuses: CredentialStatus[] = [
    "active",
    "active",
    "active",
    "pending_verification",
  ];

  const credentialDefs = [
    {
      type: "degree" as const,
      title: "Bachelor of Science in Computer Science",
      issuer: "State Technical University",
      skills: ["Computer Science", "Software Engineering", "Mathematics"],
      desc: "Undergraduate degree program in Computer Science with focus on software engineering and systems.",
    },
    {
      type: "certificate" as const,
      title: "AWS Certified Cloud Practitioner",
      issuer: "Amazon Web Services",
      skills: ["Cloud Computing", "AWS", "Infrastructure"],
      desc: "Foundation-level certification covering AWS Cloud concepts, security, and pricing.",
    },
    {
      type: "badge" as const,
      title: "Python Proficiency - Advanced",
      issuer: "Glimmora Skills Lab",
      skills: ["Python", "Data Analysis", "Scripting"],
      desc: "Demonstrated advanced proficiency in Python programming through assessed projects.",
    },
    {
      type: "certificate" as const,
      title: "Google Data Analytics Professional Certificate",
      issuer: "Google",
      skills: ["Data Analytics", "SQL", "Tableau", "R"],
      desc: "Professional certificate covering data analytics tools and practices.",
    },
    {
      type: "badge" as const,
      title: "React Developer Badge",
      issuer: "Glimmora Skills Lab",
      skills: ["React", "JavaScript", "Frontend Development"],
      desc: "Verified skills in React component development and state management.",
    },
    {
      type: "certificate" as const,
      title: "Machine Learning Specialization",
      issuer: "Stanford Online",
      skills: ["Machine Learning", "Deep Learning", "Neural Networks"],
      desc: "Three-course specialization covering supervised learning, neural networks, and ML strategy.",
    },
    {
      type: "badge" as const,
      title: "Agile Scrum Fundamentals",
      issuer: "Scrum Alliance",
      skills: ["Agile", "Scrum", "Project Management"],
      desc: "Understanding of Agile principles and Scrum framework for team-based development.",
    },
    {
      type: "transcript" as const,
      title: "Official Academic Transcript",
      issuer: "State Technical University",
      skills: [],
      desc: "Verified academic transcript with blockchain-secured credential hash.",
    },
  ];

  for (let i = 0; i < Math.min(count, credentialDefs.length); i++) {
    const def = credentialDefs[i];
    const issuedDate = pastDate(faker.number.int({ min: 30, max: 730 }));
    const status = pick(statuses);

    credentials.push({
      id: id("cred"),
      title: def.title,
      type: def.type,
      issuer: def.issuer,
      issuedDate,
      expiryDate:
        def.type === "certificate"
          ? isoDate(
              new Date(
                new Date(issuedDate).getTime() + 365 * 3 * 24 * 60 * 60 * 1000
              )
            )
          : undefined,
      status,
      verificationHash:
        status === "active" ? faker.string.hexadecimal({ length: 64 }) : undefined,
      verificationUrl:
        status === "active"
          ? `https://verify.glimmora.dev/credentials/${faker.string.alphanumeric(16)}`
          : undefined,
      description: def.desc,
      skills: def.skills,
      metadata:
        def.type === "degree"
          ? { gpa: "3.52", honors: "Cum Laude", major: "Computer Science" }
          : def.type === "certificate"
            ? { completionDate: issuedDate, provider: def.issuer }
            : {},
      createdAt: issuedDate,
      updatedAt: isoDate(now),
    });
  }

  return credentials;
}

export function generateCareerReadiness(): CareerReadiness {
  return {
    overallScore: faker.number.int({ min: 62, max: 88 }),
    breakdown: [
      {
        category: "Technical Skills",
        score: faker.number.int({ min: 70, max: 95 }),
        maxScore: 100,
      },
      {
        category: "Soft Skills",
        score: faker.number.int({ min: 55, max: 85 }),
        maxScore: 100,
      },
      {
        category: "Academic Performance",
        score: faker.number.int({ min: 65, max: 92 }),
        maxScore: 100,
      },
      {
        category: "Industry Experience",
        score: faker.number.int({ min: 30, max: 65 }),
        maxScore: 100,
      },
      {
        category: "Portfolio & Projects",
        score: faker.number.int({ min: 50, max: 80 }),
        maxScore: 100,
      },
      {
        category: "Professional Network",
        score: faker.number.int({ min: 25, max: 60 }),
        maxScore: 100,
      },
    ],
    topSkills: ["Python", "React", "Data Structures", "Machine Learning", "SQL"],
    gapSkills: ["System Design", "Docker & Containers", "Cloud Services (AWS)"],
    matchedJobs: faker.number.int({ min: 8, max: 24 }),
    applicationsActive: faker.number.int({ min: 2, max: 6 }),
  };
}

export function generateJobMatches(count: number = 10): JobMatch[] {
  const jobDefs = [
    {
      title: "Software Engineer Intern",
      type: "internship" as const,
      salaryMin: 4000,
      salaryMax: 6500,
      required: ["Python", "Git & Version Control", "Data Structures"],
    },
    {
      title: "Junior Frontend Developer",
      type: "full_time" as const,
      salaryMin: 65000,
      salaryMax: 85000,
      required: ["React", "JavaScript", "TypeScript", "REST API Design"],
    },
    {
      title: "Data Science Intern",
      type: "internship" as const,
      salaryMin: 4500,
      salaryMax: 7000,
      required: ["Python", "Machine Learning", "SQL", "Data Structures"],
    },
    {
      title: "Backend Developer",
      type: "full_time" as const,
      salaryMin: 70000,
      salaryMax: 95000,
      required: ["Python", "Node.js", "SQL", "Docker & Containers", "REST API Design"],
    },
    {
      title: "Machine Learning Engineer",
      type: "full_time" as const,
      salaryMin: 80000,
      salaryMax: 120000,
      required: [
        "Python",
        "Machine Learning",
        "Deep Learning",
        "Docker & Containers",
      ],
    },
    {
      title: "Full Stack Developer (Part-time)",
      type: "part_time" as const,
      salaryMin: 35,
      salaryMax: 55,
      required: ["React", "Node.js", "JavaScript", "SQL"],
    },
    {
      title: "DevOps Engineer Intern",
      type: "internship" as const,
      salaryMin: 4000,
      salaryMax: 6000,
      required: [
        "Docker & Containers",
        "Cloud Services (AWS)",
        "Git & Version Control",
      ],
    },
    {
      title: "Cloud Solutions Associate",
      type: "full_time" as const,
      salaryMin: 72000,
      salaryMax: 98000,
      required: [
        "Cloud Services (AWS)",
        "System Design",
        "Docker & Containers",
        "Python",
      ],
    },
    {
      title: "Software Quality Analyst",
      type: "contract" as const,
      salaryMin: 55000,
      salaryMax: 75000,
      required: ["Python", "JavaScript", "Agile Methodologies"],
    },
    {
      title: "AI Research Assistant",
      type: "part_time" as const,
      salaryMin: 25,
      salaryMax: 40,
      required: ["Machine Learning", "Python", "Deep Learning", "Algorithms"],
    },
    {
      title: "Junior Systems Engineer",
      type: "full_time" as const,
      salaryMin: 68000,
      salaryMax: 90000,
      required: ["System Design", "C++", "Cloud Services (AWS)"],
    },
    {
      title: "Web Development Intern",
      type: "internship" as const,
      salaryMin: 3500,
      salaryMax: 5500,
      required: ["React", "JavaScript", "Git & Version Control"],
    },
  ];

  const studentSkills = [
    "Python",
    "JavaScript",
    "React",
    "Data Structures",
    "Algorithms",
    "SQL",
    "Machine Learning",
    "Git & Version Control",
    "Node.js",
  ];

  return jobDefs.slice(0, count).map((jd) => {
    const matched = jd.required.filter((s) => studentSkills.includes(s));
    const gap = jd.required.filter((s) => !studentSkills.includes(s));
    const matchScore = Math.round((matched.length / jd.required.length) * 100);
    const locations = [
      "San Francisco, CA",
      "New York, NY",
      "Austin, TX",
      "Seattle, WA",
      "Boston, MA",
      "Remote",
      "Chicago, IL",
      "Denver, CO",
    ];

    const currency = "USD";

    const company = pick(TECH_COMPANIES);
    return {
      id: id("job"),
      title: jd.title,
      company,
      companyLogo: undefined,
      companyDescription: `${company} is a leading technology company specializing in enterprise software solutions and cloud infrastructure.`,
      companySize: pick(["50-200", "200-500", "500-1000", "1000-5000", "5000+"]),
      companyIndustry: pick(["Software", "Cloud Computing", "AI/ML", "FinTech", "Enterprise Software"]),
      location: pick(locations),
      type: jd.type,
      salary: { min: jd.salaryMin, max: jd.salaryMax, currency },
      matchScore,
      matchExplanation: `You match ${matched.length} of ${jd.required.length} required skills. ${gap.length > 0 ? `Gap: ${gap.join(", ")}.` : "Strong match across all requirements."}`,
      requiredSkills: jd.required,
      matchedSkills: matched,
      gapSkills: gap,
      postedDate: pastDate(faker.number.int({ min: 1, max: 30 })),
      deadline: futureDate(faker.number.int({ min: 14, max: 60 })),
      description: faker.lorem.paragraphs(2),
      applied: faker.datatype.boolean(0.2),
      saved: false,
      source: "Career Services",
    };
  });
}

export function generateApplications(count: number = 5): Application[] {
  const stages: PipelineStage[] = [
    "applied",
    "interviewed",
    "offered",
    "matched",
    "rejected",
    "placed",
  ];
  const jobTitles = [
    "Software Engineer Intern",
    "Junior Frontend Developer",
    "Data Science Intern",
    "Backend Developer",
    "ML Engineer",
  ];

  return Array.from({ length: count }, (_, i) => {
    const stage = stages[i % stages.length];
    const appliedDate = pastDate(faker.number.int({ min: 5, max: 60 }));
    const company = pick(TECH_COMPANIES);
    const jobTitle = jobTitles[i % jobTitles.length];

    const timeline: Application["timeline"] = [
      { date: appliedDate, event: "Application submitted", status: "applied" },
    ];

    if (
      ["interviewed", "offered", "placed", "rejected"].includes(stage)
    ) {
      timeline.push({
        date: pastDate(faker.number.int({ min: 3, max: 30 })),
        event: "Phone screening completed",
        status: "interviewed",
      });
    }
    if (["offered", "placed"].includes(stage)) {
      timeline.push({
        date: pastDate(faker.number.int({ min: 1, max: 15 })),
        event: "Offer extended",
        status: "offered",
      });
    }
    if (stage === "placed") {
      timeline.push({
        date: pastDate(1),
        event: "Offer accepted - placement confirmed",
        status: "placed",
      });
    }
    if (stage === "rejected") {
      timeline.push({
        date: pastDate(faker.number.int({ min: 1, max: 10 })),
        event: "Application not selected",
        status: "rejected",
      });
    }

    const nextSteps: Record<string, string> = {
      applied: "Awaiting initial screening",
      matched: "Employer reviewing your profile",
      interviewed: "Final interview scheduled for next week",
      offered: "Review and respond to offer by deadline",
      placed: "Start date confirmed",
      rejected: "",
    };

    return {
      id: id("app"),
      jobId: id("job"),
      jobTitle,
      company,
      status: stage,
      appliedDate,
      lastActivityDate: pastDate(faker.number.int({ min: 1, max: 10 })),
      nextStep: nextSteps[stage] || undefined,
      notes:
        faker.datatype.boolean(0.4) ? faker.lorem.sentence() : undefined,
      timeline,
      createdAt: appliedDate,
      updatedAt: isoDate(now),
    };
  });
}

export function generatePortfolioItems(count: number = 6): PortfolioItem[] {
  const portfolioDefs = [
    {
      title: "Personal Budget Tracker",
      type: "project" as const,
      desc: "Full-stack web application for tracking personal finances with React and Node.js. Features real-time charts, recurring transactions, and CSV export.",
      skills: ["React", "Node.js", "SQL", "TypeScript"],
    },
    {
      title: "Sentiment Analysis of Product Reviews",
      type: "paper" as const,
      desc: "Research paper exploring NLP techniques for classifying product review sentiment using BERT and traditional ML approaches.",
      skills: ["Machine Learning", "Python", "NLP"],
    },
    {
      title: "AWS Cloud Practitioner",
      type: "certification" as const,
      desc: "Demonstrated foundational knowledge of AWS Cloud services, architecture, pricing, and support.",
      skills: ["Cloud Services (AWS)"],
    },
    {
      title: "Dean's List - Fall 2025",
      type: "award" as const,
      desc: "Recognized for academic excellence with a semester GPA of 3.8 or higher.",
      skills: [],
    },
    {
      title: "Real-time Chat Application",
      type: "project" as const,
      desc: "WebSocket-based chat application with rooms, file sharing, and end-to-end encryption. Built with React, Socket.io, and Express.",
      skills: ["JavaScript", "React", "Node.js", "System Design"],
    },
    {
      title: "Image Classification with CNNs",
      type: "project" as const,
      desc: "Convolutional neural network for classifying medical images, achieving 94% accuracy on the test set. Implemented with PyTorch.",
      skills: ["Deep Learning", "Python", "Computer Vision"],
    },
    {
      title: "Contributing to Open Source CLI Tool",
      type: "other" as const,
      desc: "Contributed pagination and filtering features to an open-source developer productivity CLI tool on GitHub.",
      skills: ["Python", "Git & Version Control", "Problem Solving"],
    },
    {
      title: "Comparative Analysis of Sorting Algorithms",
      type: "paper" as const,
      desc: "Empirical study comparing sorting algorithm performance across different data distributions and sizes.",
      skills: ["Algorithms", "Data Structures", "Python"],
    },
  ];

  return portfolioDefs.slice(0, count).map((pd) => ({
    id: id("port"),
    title: pd.title,
    description: pd.desc,
    type: pd.type,
    url:
      pd.type === "project"
        ? `https://github.com/alexrivera/${pd.title.toLowerCase().replace(/\s+/g, "-")}`
        : pd.type === "paper"
          ? `https://papers.glimmora.dev/${faker.string.alphanumeric(8)}`
          : undefined,
    fileUrl: undefined,
    skills: pd.skills,
    isPublic: faker.datatype.boolean(0.7),
    createdAt: pastDate(faker.number.int({ min: 30, max: 365 })),
    updatedAt: pastDate(faker.number.int({ min: 1, max: 30 })),
  }));
}

export function generateRecommendations(
  count: number = 6
): StudentRecommendation[] {
  const recDefs: {
    type: StudentRecommendation["type"];
    title: string;
    desc: string;
    actionLabel: string;
    priority: StudentRecommendation["priority"];
    factors: StudentRecommendation["explanation"]["factors"];
    sources: string[];
  }[] = [
    {
      type: "course",
      title: "Enroll in CS 430: Cloud Computing",
      desc: "Based on your career interests and current skill gaps, Cloud Computing would significantly strengthen your placement profile for DevOps and backend roles.",
      actionLabel: "View Course",
      priority: "high",
      factors: [
        {
          name: "Skill gap in Cloud Services",
          value: 35,
          weight: 0.4,
          direction: "negative",
        },
        {
          name: "Job market demand",
          value: "Very High",
          weight: 0.3,
          direction: "positive",
        },
        {
          name: "GPA trend",
          value: "Stable",
          weight: 0.15,
          direction: "neutral",
        },
        {
          name: "Available next semester",
          value: "Yes",
          weight: 0.15,
          direction: "positive",
        },
      ],
      sources: [
        "Academic records",
        "Skill assessments",
        "Job market analytics",
        "Course catalog",
      ],
    },
    {
      type: "skill",
      title: "Build Docker & Container Skills",
      desc: "75% of your matched job listings require containerization skills. Completing the Docker Mastery track would unlock more placement opportunities.",
      actionLabel: "Start Learning",
      priority: "high",
      factors: [
        {
          name: "Job match improvement",
          value: "+18%",
          weight: 0.45,
          direction: "positive",
        },
        {
          name: "Current skill level",
          value: 28,
          weight: 0.35,
          direction: "negative",
        },
        {
          name: "Learning time estimate",
          value: "4 weeks",
          weight: 0.2,
          direction: "neutral",
        },
      ],
      sources: [
        "Skill assessments",
        "Job listings analysis",
        "Learning platform data",
      ],
    },
    {
      type: "job",
      title: "Apply to Software Engineer Intern at Nextera Technologies",
      desc: "This position matches 85% of your skill profile and aligns with your stated career interests. Application deadline is in 2 weeks.",
      actionLabel: "View & Apply",
      priority: "medium",
      factors: [
        {
          name: "Skill match",
          value: "85%",
          weight: 0.5,
          direction: "positive",
        },
        {
          name: "Company rating",
          value: "4.2/5",
          weight: 0.2,
          direction: "positive",
        },
        {
          name: "Deadline proximity",
          value: "14 days",
          weight: 0.3,
          direction: "neutral",
        },
      ],
      sources: [
        "Job market data",
        "Student profile",
        "Company reviews",
      ],
    },
    {
      type: "resource",
      title: "Complete System Design Primer",
      desc: "System design is the most common interview topic for your target roles. This resource has helped 78% of similar students improve their interview performance.",
      actionLabel: "Open Resource",
      priority: "medium",
      factors: [
        {
          name: "Interview relevance",
          value: "Very High",
          weight: 0.5,
          direction: "positive",
        },
        {
          name: "Completion rate by peers",
          value: "78%",
          weight: 0.25,
          direction: "positive",
        },
        {
          name: "Current skill gap",
          value: 40,
          weight: 0.25,
          direction: "negative",
        },
      ],
      sources: [
        "Interview analytics",
        "Peer performance data",
        "Skill assessments",
      ],
    },
    {
      type: "intervention",
      title: "Attend Office Hours for CS 301: Operating Systems",
      desc: "Your recent quiz scores in Operating Systems suggest a knowledge gap in process scheduling. Attending office hours this week could help before the midterm.",
      actionLabel: "Schedule Visit",
      priority: "high",
      factors: [
        {
          name: "Recent quiz average",
          value: "62%",
          weight: 0.5,
          direction: "negative",
        },
        {
          name: "Midterm proximity",
          value: "10 days",
          weight: 0.3,
          direction: "negative",
        },
        {
          name: "Historical improvement from office hours",
          value: "+15%",
          weight: 0.2,
          direction: "positive",
        },
      ],
      sources: [
        "Grade records",
        "Course schedule",
        "Historical intervention outcomes",
      ],
    },
    {
      type: "course",
      title: "Consider CS 405: Deep Learning next semester",
      desc: "Deep Learning builds on your strong Machine Learning foundation and is increasingly sought after by employers in your target job category.",
      actionLabel: "View Course",
      priority: "low",
      factors: [
        {
          name: "ML proficiency",
          value: 72,
          weight: 0.3,
          direction: "positive",
        },
        {
          name: "Career alignment",
          value: "High",
          weight: 0.4,
          direction: "positive",
        },
        {
          name: "Schedule fit",
          value: "Compatible",
          weight: 0.3,
          direction: "positive",
        },
      ],
      sources: [
        "Academic records",
        "Career preferences",
        "Course catalog",
        "Job market trends",
      ],
    },
  ];

  const followUpMap: Record<string, { url: string; label: string }> = {
    course: { url: "/student/academics", label: "View Course Details" },
    skill: { url: "/student/tutor/learning-path", label: "Start Learning Path" },
    job: { url: "/student/placement/jobs", label: "View Job Listing" },
    resource: { url: "/student/tutor", label: "Open in Guided Learning" },
    intervention: { url: "/student/dashboard", label: "View Action Plan" },
  };

  return recDefs.slice(0, count).map((rd, i) => ({
    id: id("rec"),
    type: rd.type,
    title: rd.title,
    description: rd.desc,
    confidence: faker.number.float({ min: 0.7, max: 0.96, multipleOf: 0.01 }),
    priority: rd.priority,
    actionLabel: rd.actionLabel,
    actionUrl: `/student/${rd.type === "job" ? "placement/jobs" : rd.type === "course" ? "academics" : "skills"}`,
    followUpUrl: followUpMap[rd.type]?.url,
    followUpLabel: followUpMap[rd.type]?.label,
    status: i === 0 ? "approved" : i === count - 1 ? "dismissed" : "pending",
    dismissReason: i === count - 1 ? "not_interested" as const : undefined,
    explanation: {
      summary: rd.desc,
      factors: rd.factors,
      dataSources: rd.sources,
      modelVersion: "glimmora-rec-v2.1",
      generatedAt: pastDate(faker.number.int({ min: 1, max: 7 })),
    },
    createdAt: pastDate(faker.number.int({ min: 1, max: 14 })),
    updatedAt: pastDate(faker.number.int({ min: 0, max: 3 })),
  }));
}

export function generateAppeals(count: number = 3): Appeal[] {
  const statuses: AppealStatus[] = [
    "pending",
    "under_review",
    "resolved",
    "rejected",
  ];

  const appealDefs = [
    {
      courseName: "Operating Systems",
      courseCode: "CS 301",
      assessment: "Midterm Exam",
      assessmentType: "exam",
      currentScore: 62,
      maxScore: 100,
      reason:
        "I believe questions 8 and 12 were graded incorrectly. My approach to the process scheduling problem uses a valid alternative algorithm that produces the correct output, and my memory management diagram clearly labels all page table entries as required.",
    },
    {
      courseName: "Data Structures & Algorithms",
      courseCode: "CS 201",
      assessment: "Assignment 3: Binary Search Trees",
      assessmentType: "assignment",
      currentScore: 35,
      maxScore: 50,
      reason:
        "Points were deducted for time complexity analysis, but my analysis is correct for the amortized case as specified in the problem statement. I have attached reference material from the textbook supporting my approach.",
    },
    {
      courseName: "Database Systems",
      courseCode: "CS 302",
      assessment: "Project: SQL Query Optimizer",
      assessmentType: "project",
      currentScore: 78,
      maxScore: 100,
      reason:
        "The automated tests failed due to a database connection timeout issue on the grading server, not a code error. I have logs showing the same code passes all tests on my local environment and the CI pipeline.",
    },
    {
      courseName: "Software Engineering",
      courseCode: "CS 310",
      assessment: "Quiz 4: Design Patterns",
      assessmentType: "quiz",
      currentScore: 6,
      maxScore: 10,
      reason:
        "The question about the Observer pattern accepted only one correct answer, but the Strategy pattern answer I selected is also valid for the described scenario.",
    },
  ];

  return appealDefs.slice(0, count).map((ad, i) => {
    const status = statuses[i % statuses.length];
    const createdDate = pastDate(faker.number.int({ min: 3, max: 30 }));

    const timeline: Appeal["timeline"] = [
      {
        date: createdDate,
        event: "Appeal submitted",
        actor: "Alex Rivera",
      },
    ];

    if (status !== "pending") {
      timeline.push({
        date: pastDate(faker.number.int({ min: 2, max: 15 })),
        event: "Appeal assigned to reviewer",
        actor: "Department Office",
      });
    }

    if (status === "under_review") {
      timeline.push({
        date: pastDate(faker.number.int({ min: 1, max: 5 })),
        event: "Review in progress - additional information requested",
        actor: pick(FACULTY_NAMES),
      });
    }

    if (status === "resolved") {
      timeline.push({
        date: pastDate(1),
        event: "Appeal resolved - score adjusted",
        actor: pick(FACULTY_NAMES),
      });
    }

    if (status === "rejected") {
      timeline.push({
        date: pastDate(1),
        event: "Appeal reviewed and denied",
        actor: pick(FACULTY_NAMES),
      });
    }

    return {
      id: id("apl"),
      courseId: id("crs"),
      courseName: ad.courseName,
      courseCode: ad.courseCode,
      assessmentName: ad.assessment,
      assessmentType: ad.assessmentType,
      // Infer target from seeded assessmentType. Pre-existing rows are mostly
      // file-based work; the "quiz" row is an Assessment.
      target: ad.assessmentType === "quiz" || ad.assessmentType === "exam" || ad.assessmentType === "midterm" || ad.assessmentType === "final"
        ? "assessment"
        : "assignment",
      currentScore: ad.currentScore,
      maxScore: ad.maxScore,
      appealReason: ad.reason,
      supportingDocuments:
        faker.datatype.boolean(0.6)
          ? [
              {
                name: "evidence.pdf",
                url: `https://files.glimmora.dev/${faker.string.alphanumeric(12)}.pdf`,
                size: faker.number.int({ min: 50000, max: 2000000 }),
              },
            ]
          : [],
      status,
      reviewerName:
        status !== "pending" ? pick(FACULTY_NAMES) : undefined,
      reviewerNote:
        status === "resolved"
          ? "After careful review, the grading has been adjusted. Your alternative approach is valid."
          : status === "rejected"
            ? "The original grading follows the rubric criteria. The deducted points are for missing required steps as outlined in the assignment instructions."
            : undefined,
      resolvedScore: status === "resolved" ? ad.currentScore + faker.number.int({ min: 5, max: 15 }) : undefined,
      resolvedAt: status === "resolved" ? pastDate(1) : undefined,
      timeline,
      createdAt: createdDate,
      updatedAt: pastDate(faker.number.int({ min: 0, max: 5 })),
    };
  });
}

export function generateStudentProfile(): StudentProfile {
  return {
    name: "Alex Rivera",
    email: "student@glimmora.dev",
    personalEmail: "alex.rivera@gmail.com",
    studentId: "STU-2023-04172",
    department: "Computer Science",
    program: "Bachelor of Science in Computer Science",
    enrollmentYear: currentYear - 3,
    expectedGraduation: `May ${currentYear + 1}`,
    phone: "+1 (555) 234-5678",
    bio: "Senior CS student passionate about full-stack development and machine learning. Looking for software engineering opportunities where I can apply my skills in building scalable applications.",
    avatarUrl: undefined,
    interests: [
      "Full-Stack Development",
      "Machine Learning",
      "Open Source",
      "Cloud Computing",
      "System Design",
    ],
    socialLinks: [
      { platform: "GitHub", url: "https://github.com/alexrivera" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/alexrivera" },
      { platform: "Portfolio", url: "https://alexrivera.dev" },
    ],
    workExperience: [
      {
        id: id("exp"),
        title: "Software Engineering Intern",
        company: "CloudPeak Systems",
        startDate: `${currentYear - 1}-06-01`,
        endDate: `${currentYear - 1}-08-31`,
        description: "Developed REST APIs using Node.js and PostgreSQL. Built internal dashboards with React.",
        current: false,
      },
    ],
    onboardingCompleted: true,
    lastLoginAt: pastDate(0),
  };
}

export function generateNotificationPreferences(): NotificationPreferences {
  return {
    email: true,
    push: true,
    riskAlerts: true,
    gradeUpdates: true,
    deadlineReminders: true,
    jobMatches: true,
    recommendations: false,
    appealUpdates: true,
    credentialIssued: true,
    applicationUpdates: true,
  };
}

export function generateStudentDashboard(): StudentDashboard {
  const transcript = generateTranscript();
  const lastCompleted = transcript.filter((s) => s.semesterGpa > 0);
  const cumulativeGpa =
    lastCompleted.length > 0
      ? lastCompleted[lastCompleted.length - 1].cumulativeGpa
      : 3.52;
  const prevGpa =
    lastCompleted.length > 1
      ? lastCompleted[lastCompleted.length - 2].cumulativeGpa
      : cumulativeGpa - 0.05;

  const trend: "up" | "down" | "stable" =
    cumulativeGpa > prevGpa + 0.05
      ? "up"
      : cumulativeGpa < prevGpa - 0.05
        ? "down"
        : "stable";

  const totalCredits = transcript.reduce(
    (sum, s) => sum + s.creditsEarned,
    0
  );

  const skills = generateSkills(6);

  const riskAlerts: RiskAlert[] = [
    {
      id: id("risk"),
      type: "attendance",
      severity: "medium",
      message: "Attendance in CS 301: Operating Systems has dropped below 80%.",
      description: "Your attendance in CS 301 dropped to 68% this month. Falling below 75% may result in grade penalties. Your academic advisor has been notified.",
      courseId: id("crs"),
      courseName: "Operating Systems",
      triggeredAt: pastDate(3),
      actionLabel: "View Attendance Details",
      actionUrl: "/student/academics",
    },
    {
      id: id("risk"),
      type: "academic",
      severity: "low",
      message: "Quiz average in CS 302: Database Systems is trending downward.",
      description: "Your quiz average dropped from 82% to 71% over the last 3 quizzes. Consider reviewing recent material or visiting office hours.",
      courseId: id("crs"),
      courseName: "Database Systems",
      triggeredAt: pastDate(7),
      actionLabel: "View Course Performance",
      actionUrl: "/student/academics",
    },
  ];

  const upcomingDeadlines: Deadline[] = [
    {
      id: id("dl"),
      title: "Assignment 5: Process Scheduling Simulation",
      courseId: id("crs"),
      courseName: "Operating Systems",
      dueDate: futureDate(3),
      type: "assignment",
    },
    {
      id: id("dl"),
      title: "Midterm Assessment",
      courseId: id("crs"),
      courseName: "Database Systems",
      dueDate: futureDate(7),
      type: "assessment",
    },
    {
      id: id("dl"),
      title: "Group Project: Chat Application",
      courseId: id("crs"),
      courseName: "Software Engineering",
      dueDate: futureDate(14),
      type: "project",
    },
    {
      id: id("dl"),
      title: "Quiz 6: Network Protocols",
      courseId: id("crs"),
      courseName: "Computer Networks",
      dueDate: futureDate(5),
      type: "assignment",
    },
  ];

  const recentActivity: ActivityItem[] = [
    {
      id: id("act"),
      title: "Grade posted",
      description: "Assignment 4 in Data Structures & Algorithms graded: 47/50",
      timestamp: pastDate(1),
      type: "grade",
      linkUrl: "/student/academics",
      resourceId: id("crs"),
    },
    {
      id: id("act"),
      title: "New recommendation",
      description: "AI recommends enrolling in CS 430: Cloud Computing next semester",
      timestamp: pastDate(2),
      type: "recommendation",
      linkUrl: "/student/recommendations",
    },
    {
      id: id("act"),
      title: "Credential issued",
      description: "Python Proficiency - Advanced badge earned",
      timestamp: pastDate(5),
      type: "credential",
      linkUrl: "/student/credentials",
      resourceId: id("cred"),
    },
    {
      id: id("act"),
      title: "Appeal update",
      description: "Your appeal for CS 301 Midterm Exam is now under review",
      timestamp: pastDate(4),
      type: "appeal",
      linkUrl: "/student/appeals",
      resourceId: id("apl"),
    },
    {
      id: id("act"),
      title: "Application status changed",
      description: "Your application to Nextera Technologies moved to Interview stage",
      timestamp: pastDate(6),
      type: "application",
      linkUrl: "/student/placement/applications",
    },
  ];

  return {
    gpa: {
      current: cumulativeGpa,
      trend,
      previousSemester: prevGpa,
    },
    creditsCompleted: totalCredits,
    creditsRequired: 128,
    currentCourses: 4,
    riskLevel: "medium",
    riskAlerts,
    upcomingDeadlines,
    skillRadarPreview: skills,
    recentActivity,
    lastSyncedAt: pastDate(0),
    studentName: "Alex",
  };
}

export function generateNotifications(count: number = 8): Notification[] {
  const notifDefs: Omit<Notification, "id" | "createdAt">[] = [
    { type: "grade_update", title: "Grade posted", message: "Assignment 4 in Data Structures graded: 47/50", linkUrl: "/student/academics", read: false },
    { type: "risk_alert", title: "Attendance alert", message: "Your attendance in CS 301 dropped below 80%", linkUrl: "/student/dashboard", read: false },
    { type: "credential_issued", title: "Credential earned", message: "Python Proficiency - Advanced badge has been issued", linkUrl: "/student/credentials", read: false },
    { type: "job_match", title: "New job match", message: "Software Engineer Intern at Nextera Technologies (85% match)", linkUrl: "/student/placement/jobs", read: true },
    { type: "application_update", title: "Application update", message: "Your application to Axiom Software moved to Interview stage", linkUrl: "/student/placement/applications", read: true },
    { type: "recommendation", title: "New recommendation", message: "AI recommends building Docker & Container skills", linkUrl: "/student/recommendations", read: true },
    { type: "deadline_reminder", title: "Deadline tomorrow", message: "Assignment 5: Process Scheduling due tomorrow", linkUrl: "/student/academics", read: false },
    { type: "appeal_update", title: "Appeal update", message: "Your appeal for CS 301 Midterm is now under review", linkUrl: "/student/appeals", read: true },
  ];

  return notifDefs.slice(0, count).map((nd, i) => ({
    ...nd,
    id: id("notif"),
    createdAt: pastDate(i + 1),
  }));
}

// ─── Course Modules Generator (LMS Content) ─────────────────────────────────

const MODULE_TEMPLATES: {
  title: string;
  description: string;
  materials: { title: string; type: StudentCourseMaterial["type"]; fileSize?: number; duration?: number }[];
}[] = [
  {
    title: "Module 1: Foundations & Introduction",
    description: "Core concepts, terminology, and the historical context of the subject. Sets up the foundational knowledge needed for the rest of the course.",
    materials: [
      { title: "Lecture 1: Course Overview & Introduction", type: "video", duration: 3420 },
      { title: "Course Syllabus & Schedule", type: "pdf", fileSize: 245000 },
      { title: "Lecture 1 Slides: Foundations", type: "slides", fileSize: 1800000 },
      { title: "Supplementary Reading - Historical Context", type: "link" },
    ],
  },
  {
    title: "Module 2: Core Concepts & Theory",
    description: "Deep dive into the theoretical framework. Covers formal definitions, proofs of key theorems, and the mathematical underpinnings.",
    materials: [
      { title: "Lecture 2: Formal Definitions & Notation", type: "video", duration: 4080 },
      { title: "Lecture 3: Theoretical Analysis", type: "video", duration: 3780 },
      { title: "Lecture 2-3 Slides: Core Theory", type: "slides", fileSize: 2400000 },
      { title: "Practice Problems Set A.pdf", type: "pdf", fileSize: 180000 },
    ],
  },
  {
    title: "Module 3: Algorithms & Implementation",
    description: "Translating theory into practice. Covers major algorithms, their time and space complexity, and implementation strategies.",
    materials: [
      { title: "Lecture 4: Algorithm Design Techniques", type: "video", duration: 3960 },
      { title: "Week 3 Lab Exercise.pdf", type: "pdf", fileSize: 320000 },
      { title: "Lecture 4 Slides: Algorithms", type: "slides", fileSize: 2100000 },
    ],
  },
  {
    title: "Module 4: Advanced Topics & Applications",
    description: "Explores advanced use cases, optimization techniques, and real-world applications of the material covered in previous modules.",
    materials: [
      { title: "Lecture 5: Optimization & Trade-offs", type: "video", duration: 4200 },
      { title: "Lecture 6: Real-World Case Studies", type: "video", duration: 3600 },
      { title: "Case Study: Industry Application.pdf", type: "pdf", fileSize: 540000 },
      { title: "External Resource - Research Paper", type: "link" },
    ],
  },
  {
    title: "Module 5: Review & Exam Preparation",
    description: "Comprehensive review of all course material. Includes practice exams, study guides, and commonly tested concepts.",
    materials: [
      { title: "Review Session Recording", type: "video", duration: 5400 },
      { title: "Study Guide & Key Concepts.pdf", type: "pdf", fileSize: 420000 },
      { title: "Practice Exam with Solutions.pdf", type: "pdf", fileSize: 380000 },
    ],
  },
];

export function generateStudentCourseModules(courseId: string): StudentCourseModule[] {
  const moduleCount = faker.number.int({ min: 3, max: 5 });
  const selected = MODULE_TEMPLATES.slice(0, moduleCount);

  return selected.map((template, index) => ({
    id: id("mod"),
    title: template.title,
    description: template.description,
    order: index + 1,
    materials: template.materials.map((mat) => ({
      id: id("mat"),
      title: mat.title,
      type: mat.type,
      url: mat.type === "link"
        ? `https://resources.glimmora.dev/${faker.string.alphanumeric(8)}`
        : mat.type === "video"
          ? `https://video.glimmora.dev/courses/${courseId}/${faker.string.alphanumeric(10)}`
          : `https://files.glimmora.dev/courses/${courseId}/${faker.string.alphanumeric(10)}.${mat.type === "pdf" ? "pdf" : "pptx"}`,
      fileSize: mat.fileSize,
      duration: mat.duration,
    })),
  }));
}

// ─── Assignment Detail Generator (LMS) ───────────────────────────────────────

const RUBRIC_TEMPLATES: { criterion: string; description: string; maxPoints: number }[][] = [
  [
    { criterion: "Correctness", description: "Solution produces correct output for all test cases and edge cases.", maxPoints: 40 },
    { criterion: "Code Quality", description: "Clean, readable code with proper naming conventions, comments, and modular structure.", maxPoints: 30 },
    { criterion: "Analysis", description: "Thorough time and space complexity analysis with proper Big-O notation.", maxPoints: 30 },
  ],
  [
    { criterion: "Understanding", description: "Demonstrates clear understanding of core concepts and their applications.", maxPoints: 50 },
    { criterion: "Presentation", description: "Well-organized work with clear explanations and proper formatting.", maxPoints: 25 },
    { criterion: "Completeness", description: "All required sections are addressed with sufficient depth.", maxPoints: 25 },
  ],
  [
    { criterion: "Implementation", description: "Fully functional implementation meeting all specified requirements.", maxPoints: 45 },
    { criterion: "Testing", description: "Comprehensive test coverage including unit tests and integration tests.", maxPoints: 25 },
    { criterion: "Documentation", description: "Clear documentation including setup instructions, API docs, and design decisions.", maxPoints: 30 },
  ],
];

export function generateAssignmentDetail(assignment: Assignment): AssignmentDetail {
  const rubricTemplate = RUBRIC_TEMPLATES[faker.number.int({ min: 0, max: RUBRIC_TEMPLATES.length - 1 })];

  // Scale rubric maxPoints to match assignment maxScore
  const templateTotal = rubricTemplate.reduce((sum, r) => sum + r.maxPoints, 0);
  const rubric = rubricTemplate.map((r) => ({
    ...r,
    maxPoints: Math.round((r.maxPoints / templateTotal) * assignment.maxScore),
  }));

  // Determine if there should be a submission
  const hasSubmission = ["submitted", "graded", "late"].includes(assignment.status);
  let submission: AssignmentDetail["submission"] | undefined;

  if (hasSubmission) {
    const isGraded = assignment.status === "graded";
    const isLate = assignment.status === "late";

    submission = {
      id: id("sub"),
      fileName: `${assignment.title.replace(/[^a-zA-Z0-9\s]/g, "").replace(/\s+/g, "_")}_submission.pdf`,
      fileUrl: `https://files.glimmora.dev/submissions/${faker.string.alphanumeric(12)}.pdf`,
      submittedAt: assignment.submittedAt ?? pastDate(faker.number.int({ min: 1, max: 14 })),
      score: isGraded ? assignment.score : undefined,
      feedback: isGraded && assignment.feedback ? assignment.feedback : isGraded ? faker.lorem.sentences(2) : undefined,
      status: isGraded ? "graded" : isLate ? "late" : "submitted",
    };
  }

  const descriptionTemplates = [
    `In this ${assignment.type}, you will apply the concepts covered in recent lectures to solve a series of problems. Focus on demonstrating both theoretical understanding and practical application.`,
    `This ${assignment.type} assesses your ability to analyze, design, and implement solutions for the topics we have covered. Pay attention to edge cases and efficiency.`,
    `Complete the following ${assignment.type} to demonstrate your mastery of the material. Be sure to show your work and explain your reasoning clearly.`,
  ];

  const instructionTemplates = [
    "Submit your work as a single PDF file. Include all source code, analysis, and any diagrams or visualizations. Late submissions will receive a 10% penalty per day.",
    "All code must compile and run without errors. Include a README with setup instructions. Submit via the course portal before the deadline.",
    "Answer all questions completely. Partial credit will be awarded for demonstrating correct methodology even if the final answer is incorrect.",
  ];

  return {
    ...assignment,
    description: descriptionTemplates[faker.number.int({ min: 0, max: descriptionTemplates.length - 1 })],
    instructions: faker.datatype.boolean(0.8) ? instructionTemplates[faker.number.int({ min: 0, max: instructionTemplates.length - 1 })] : undefined,
    rubric,
    submission,
  };
}
