import { faker } from "@faker-js/faker";
import type {
  Assessment,
  AssessmentQuestion,
  AssessmentType,
} from "@/lib/api/types/assessment.types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function id(prefix: string): string {
  return `${prefix}_${faker.string.alphanumeric(12)}`;
}

function isoOffsetDays(offsetDays: number): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString();
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Question banks (course-code agnostic) ───────────────────────────────────
// Realistic CS-ish questions that work across courses without forcing course-
// specific content. The shared bank means seeded data feels real but doesn't
// require per-course curation.

interface QuestionTemplate {
  prompt: string;
  type: AssessmentQuestion["type"];
  options?: string[];
  correctAnswer: string;
  points: number;
  explanation: string;
}

const FUNDAMENTALS_QUESTIONS: QuestionTemplate[] = [
  {
    prompt: "What is the time complexity of binary search on a sorted array of n elements?",
    type: "multiple_choice",
    options: ["O(1)", "O(log n)", "O(n)", "O(n log n)"],
    correctAnswer: "O(log n)",
    points: 10,
    explanation: "Binary search halves the search space each step, yielding logarithmic complexity.",
  },
  {
    prompt: "A stack follows LIFO (Last-In-First-Out) ordering.",
    type: "true_false",
    correctAnswer: "True",
    points: 5,
    explanation: "By definition, a stack pushes and pops from the same end, producing LIFO order.",
  },
  {
    prompt: "Which data structure offers O(1) average-case lookup by key?",
    type: "multiple_choice",
    options: ["Sorted array", "Linked list", "Hash table", "Balanced BST"],
    correctAnswer: "Hash table",
    points: 10,
    explanation: "A hash table provides amortised O(1) lookups assuming a good hash function and low load factor.",
  },
  {
    prompt: "What does the acronym SQL stand for?",
    type: "short_answer",
    correctAnswer: "Structured Query Language",
    points: 5,
    explanation: "Standard initialism for the language used to query relational databases.",
  },
  {
    prompt: "A graph traversal that visits all neighbours before going deeper is called…",
    type: "multiple_choice",
    options: ["Depth-First Search", "Breadth-First Search", "Dijkstra's Algorithm", "Topological Sort"],
    correctAnswer: "Breadth-First Search",
    points: 10,
    explanation: "BFS explores level-by-level using a queue.",
  },
  {
    prompt: "Big-O notation describes the upper bound on an algorithm's growth rate.",
    type: "true_false",
    correctAnswer: "True",
    points: 5,
    explanation: "Big-O is an asymptotic upper bound; Theta gives a tight bound and Omega the lower bound.",
  },
  {
    prompt: "The HTTP status code for 'Not Found' is…",
    type: "short_answer",
    correctAnswer: "404",
    points: 5,
    explanation: "404 indicates the requested resource could not be located on the server.",
  },
  {
    prompt: "Which protocol is connection-oriented?",
    type: "multiple_choice",
    options: ["UDP", "TCP", "ICMP", "ARP"],
    correctAnswer: "TCP",
    points: 10,
    explanation: "TCP establishes a connection via a three-way handshake; UDP is connectionless.",
  },
];

const APPLIED_QUESTIONS: QuestionTemplate[] = [
  {
    prompt: "In supervised learning, a model is trained on…",
    type: "multiple_choice",
    options: [
      "Unlabelled data only",
      "Labelled input/output pairs",
      "A reward signal from the environment",
      "Clusters of similar items",
    ],
    correctAnswer: "Labelled input/output pairs",
    points: 10,
    explanation: "Supervised learning learns the mapping from inputs to known outputs.",
  },
  {
    prompt: "ACID stands for Atomicity, Consistency, Isolation, and Durability.",
    type: "true_false",
    correctAnswer: "True",
    points: 5,
    explanation: "ACID is the canonical set of database transaction properties.",
  },
  {
    prompt: "Which design principle states 'a class should have one and only one reason to change'?",
    type: "short_answer",
    correctAnswer: "Single Responsibility Principle",
    points: 10,
    explanation: "The first of the SOLID principles, due to Robert C. Martin.",
  },
  {
    prompt: "Which of the following is NOT a primary normal form in database design?",
    type: "multiple_choice",
    options: ["1NF", "2NF", "3NF", "5NF (Project-Join)", "6NF"],
    correctAnswer: "6NF",
    points: 10,
    explanation: "1NF–5NF are the commonly taught normal forms; 6NF exists but is rarely covered.",
  },
  {
    prompt: "Idempotent HTTP methods produce the same result regardless of how many times they're called.",
    type: "true_false",
    correctAnswer: "True",
    points: 5,
    explanation: "GET, PUT, DELETE are idempotent. POST is not.",
  },
  {
    prompt: "A divide-and-conquer algorithm that splits the input, solves each half, and merges is called…",
    type: "short_answer",
    correctAnswer: "Merge Sort",
    points: 10,
    explanation: "Merge sort recursively divides the array, sorts each half, then merges them in O(n log n).",
  },
];

function pickQuestions(count: number, pool: QuestionTemplate[]): AssessmentQuestion[] {
  const shuffled = [...pool].sort(() => faker.number.float() - 0.5);
  return shuffled.slice(0, Math.min(count, pool.length)).map((q) => ({
    id: id("qst"),
    prompt: q.prompt,
    type: q.type,
    options: q.options,
    correctAnswer: q.correctAnswer,
    points: q.points,
    explanation: q.explanation,
  }));
}

function sumPoints(questions: AssessmentQuestion[]): number {
  return questions.reduce((s, q) => s + q.points, 0);
}

// ─── Per-course assessment seed ──────────────────────────────────────────────
// Each course gets:
//  • one published Quiz (open NOW, closes in 7 days, attempts=2)
//  • one published Midterm (already closed yesterday — student can review past attempts but cannot start a new one)
//  • one draft Final (faculty can publish later)
//
// The same shape is seeded for any course ID, so both faculty and student see
// equivalent assessment surfaces in their respective course detail pages.

export function generateCourseAssessments(courseId: string): Assessment[] {
  const now = new Date();
  const nowIso = now.toISOString();

  const quizQuestions = pickQuestions(5, FUNDAMENTALS_QUESTIONS);
  const midtermQuestions = [
    ...pickQuestions(4, FUNDAMENTALS_QUESTIONS),
    ...pickQuestions(4, APPLIED_QUESTIONS),
  ];
  const finalQuestions = [
    ...pickQuestions(6, FUNDAMENTALS_QUESTIONS),
    ...pickQuestions(6, APPLIED_QUESTIONS),
  ];

  const seedNow = now.getTime();

  const quiz: Assessment = {
    id: id("ass"),
    courseId,
    title: "Quiz 1: Foundations",
    instructions:
      "A short quiz covering the foundational concepts from Weeks 1–3. You have one chance per attempt to read each question — read carefully before answering. Multiple choice questions have exactly one correct answer.",
    type: "quiz",
    questions: quizQuestions,
    maxScore: sumPoints(quizQuestions),
    weight: 10,
    timeLimitMinutes: 20,
    attemptsAllowed: 2,
    opensAt: new Date(seedNow - 1000 * 60 * 60 * 24).toISOString(), // opened yesterday
    closesAt: new Date(seedNow + 1000 * 60 * 60 * 24 * 7).toISOString(), // closes in 7 days
    status: "published",
    createdAt: new Date(seedNow - 1000 * 60 * 60 * 24 * 14).toISOString(),
    updatedAt: nowIso,
  };

  const midterm: Assessment = {
    id: id("ass"),
    courseId,
    title: "Midterm Assessment",
    instructions:
      "Comprehensive assessment of all material covered in the first half of the course. This is closed-book; please complete it independently within the allowed time.",
    type: "midterm",
    questions: midtermQuestions,
    maxScore: sumPoints(midtermQuestions),
    weight: 25,
    timeLimitMinutes: 90,
    attemptsAllowed: 1,
    opensAt: new Date(seedNow - 1000 * 60 * 60 * 24 * 10).toISOString(),
    closesAt: new Date(seedNow - 1000 * 60 * 60 * 24).toISOString(), // closed yesterday
    status: "closed",
    createdAt: new Date(seedNow - 1000 * 60 * 60 * 24 * 30).toISOString(),
    updatedAt: new Date(seedNow - 1000 * 60 * 60 * 24).toISOString(),
  };

  const final: Assessment = {
    id: id("ass"),
    courseId,
    title: "Final Assessment",
    instructions:
      "Cumulative final covering all topics from the semester. The faculty has not yet finalised this assessment; details may change before it is published.",
    type: "final",
    questions: finalQuestions,
    maxScore: sumPoints(finalQuestions),
    weight: 30,
    timeLimitMinutes: 120,
    attemptsAllowed: 1,
    opensAt: new Date(seedNow + 1000 * 60 * 60 * 24 * 30).toISOString(),
    closesAt: new Date(seedNow + 1000 * 60 * 60 * 24 * 30 + 1000 * 60 * 60 * 4).toISOString(),
    status: "draft",
    createdAt: nowIso,
    updatedAt: nowIso,
  };

  return [quiz, midterm, final];
}

// ─── New assessment factory used by the POST handler ─────────────────────────

export function buildAssessmentFromRequest(req: {
  courseId: string;
  title: string;
  instructions: string;
  type: AssessmentType;
  questions: Omit<AssessmentQuestion, "id">[];
  weight: number;
  timeLimitMinutes?: number;
  attemptsAllowed: number;
  opensAt: string;
  closesAt: string;
}): Assessment {
  const now = new Date().toISOString();
  const questions: AssessmentQuestion[] = req.questions.map((q) => ({
    id: id("qst"),
    prompt: q.prompt,
    type: q.type,
    options: q.options,
    correctAnswer: q.correctAnswer,
    points: q.points,
    explanation: q.explanation,
  }));
  return {
    id: id("ass"),
    courseId: req.courseId,
    title: req.title,
    instructions: req.instructions,
    type: req.type,
    questions,
    maxScore: sumPoints(questions),
    weight: req.weight,
    timeLimitMinutes: req.timeLimitMinutes,
    attemptsAllowed: req.attemptsAllowed,
    opensAt: req.opensAt,
    closesAt: req.closesAt,
    status: "draft",
    createdAt: now,
    updatedAt: now,
  };
}
