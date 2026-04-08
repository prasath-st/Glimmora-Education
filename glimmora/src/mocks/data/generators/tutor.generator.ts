import { faker } from "@faker-js/faker";
import type {
  TutorDashboard,
  WeaknessArea,
  TutorActivityItem,
  RecommendedLesson,
  LearningPath,
  LearningModule,
  LearningResource,
  TutorSession,
  SessionContent,
  ContentSection,
  SessionQuiz,
  QuizQuestion,
  AiTutorFeedback,
} from "@/lib/api/types/tutor.types";

faker.seed(48);

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

// ─── Realistic CS Lesson & Module Data ───────────────────────────────────────

const ML_MODULES = [
  { title: "Introduction to Machine Learning", type: "lesson" as const, duration: 45, desc: "Overview of ML paradigms: supervised, unsupervised, and reinforcement learning" },
  { title: "Linear Regression & Gradient Descent", type: "lesson" as const, duration: 60, desc: "Mathematical foundations of linear regression and optimization with gradient descent" },
  { title: "Classification with Logistic Regression", type: "lesson" as const, duration: 50, desc: "Binary and multi-class classification using logistic regression" },
  { title: "Quiz: Regression & Classification", type: "quiz" as const, duration: 30, desc: "Test your understanding of regression and classification fundamentals" },
  { title: "Decision Trees & Random Forests", type: "lesson" as const, duration: 55, desc: "Tree-based models, ensemble methods, and feature importance" },
  { title: "Neural Networks Fundamentals", type: "lesson" as const, duration: 65, desc: "Perceptrons, backpropagation, and multi-layer architectures" },
  { title: "Convolutional Neural Networks", type: "lesson" as const, duration: 60, desc: "CNN architectures for image recognition and computer vision tasks" },
  { title: "ML Pipeline Project", type: "assignment" as const, duration: 120, desc: "Build an end-to-end ML pipeline: data preprocessing, training, evaluation, and deployment" },
];

const DATA_STRUCTURES_MODULES = [
  { title: "Advanced Tree Structures", type: "lesson" as const, duration: 50, desc: "AVL trees, Red-Black trees, and B-trees for balanced search operations" },
  { title: "Graph Algorithms: BFS & DFS", type: "lesson" as const, duration: 55, desc: "Breadth-first and depth-first search with real-world applications" },
  { title: "Shortest Path Algorithms", type: "lesson" as const, duration: 60, desc: "Dijkstra's, Bellman-Ford, and Floyd-Warshall algorithms" },
  { title: "Quiz: Graph Theory", type: "quiz" as const, duration: 25, desc: "Assessment on graph traversal and shortest path algorithms" },
  { title: "Dynamic Programming Patterns", type: "lesson" as const, duration: 70, desc: "Memoization, tabulation, and common DP problem patterns" },
  { title: "Trie & Suffix Structures", type: "lesson" as const, duration: 45, desc: "String-specialized data structures for efficient text search" },
  { title: "Amortized Analysis", type: "lesson" as const, duration: 40, desc: "Aggregate, accounting, and potential methods for complexity analysis" },
  { title: "Algorithm Design Challenge", type: "assignment" as const, duration: 90, desc: "Solve complex algorithmic problems using advanced data structures" },
  { title: "Final Assessment: Data Structures", type: "quiz" as const, duration: 45, desc: "Comprehensive assessment covering all advanced data structure topics" },
];

const CLOUD_MODULES = [
  { title: "Cloud Computing Fundamentals", type: "lesson" as const, duration: 40, desc: "IaaS, PaaS, SaaS models and major cloud providers comparison" },
  { title: "Containerization with Docker", type: "lesson" as const, duration: 55, desc: "Docker images, containers, volumes, and networking" },
  { title: "Kubernetes Orchestration", type: "lesson" as const, duration: 65, desc: "Pods, services, deployments, and scaling strategies in Kubernetes" },
  { title: "Quiz: Containers & Orchestration", type: "quiz" as const, duration: 25, desc: "Test your knowledge of Docker and Kubernetes concepts" },
  { title: "CI/CD Pipeline Design", type: "lesson" as const, duration: 50, desc: "GitHub Actions, Jenkins, and GitLab CI for automated build and deployment" },
  { title: "Infrastructure as Code with Terraform", type: "lesson" as const, duration: 55, desc: "Declarative infrastructure provisioning and state management" },
  { title: "Cloud Security & IAM", type: "lesson" as const, duration: 45, desc: "Identity management, network security, and compliance in cloud environments" },
  { title: "DevOps Capstone Project", type: "project" as const, duration: 150, desc: "Design and deploy a multi-service application with full CI/CD pipeline" },
];

const SYSTEM_DESIGN_MODULES = [
  { title: "Scalability Fundamentals", type: "lesson" as const, duration: 50, desc: "Horizontal vs vertical scaling, load balancing, and caching strategies" },
  { title: "Database Design & Sharding", type: "lesson" as const, duration: 60, desc: "SQL vs NoSQL, data partitioning, replication, and consistency models" },
  { title: "Message Queues & Event-Driven Architecture", type: "lesson" as const, duration: 55, desc: "Kafka, RabbitMQ, and designing event-driven microservices" },
  { title: "Quiz: Distributed Systems Concepts", type: "quiz" as const, duration: 30, desc: "Assessment on scalability, databases, and messaging patterns" },
  { title: "API Design & Rate Limiting", type: "lesson" as const, duration: 45, desc: "RESTful API best practices, GraphQL, gRPC, and throttling strategies" },
  { title: "Microservices Architecture Patterns", type: "lesson" as const, duration: 60, desc: "Service decomposition, saga pattern, circuit breakers, and service mesh" },
  { title: "System Design Case Studies", type: "lesson" as const, duration: 70, desc: "Design a URL shortener, chat system, and social media feed" },
  { title: "System Design Interview Prep", type: "assignment" as const, duration: 90, desc: "Practice designing systems under constraints with peer review" },
];

const FULLSTACK_MODULES = [
  { title: "Modern React Patterns", type: "lesson" as const, duration: 50, desc: "Hooks, context, suspense, and server components in React 19" },
  { title: "State Management at Scale", type: "lesson" as const, duration: 55, desc: "Redux Toolkit, Zustand, and server state with TanStack Query" },
  { title: "Quiz: Frontend Architecture", type: "quiz" as const, duration: 25, desc: "Assessment on React patterns and state management strategies" },
  { title: "Node.js & Express API Development", type: "lesson" as const, duration: 60, desc: "RESTful API design, middleware, authentication, and error handling" },
  { title: "Database Integration with Prisma", type: "lesson" as const, duration: 50, desc: "ORM setup, migrations, relations, and query optimization" },
  { title: "Authentication & Authorization", type: "lesson" as const, duration: 55, desc: "JWT, OAuth 2.0, RBAC, and session management implementation" },
  { title: "Testing Strategies: Unit to E2E", type: "lesson" as const, duration: 45, desc: "Jest, React Testing Library, Playwright, and test-driven development" },
  { title: "Performance Optimization", type: "lesson" as const, duration: 50, desc: "Code splitting, lazy loading, caching, and Core Web Vitals optimization" },
  { title: "Full-Stack Capstone Project", type: "project" as const, duration: 180, desc: "Build and deploy a production-ready full-stack application" },
];

type ModuleDef = { title: string; type: LearningModule["type"]; duration: number; desc: string };

const PATH_MODULE_MAP: Record<string, ModuleDef[]> = {
  ml: ML_MODULES,
  ds: DATA_STRUCTURES_MODULES,
  cloud: CLOUD_MODULES,
  sysdesign: SYSTEM_DESIGN_MODULES,
  fullstack: FULLSTACK_MODULES,
};

// ─── Resource Generator ──────────────────────────────────────────────────────

function generateResources(moduleTitle: string, moduleType: string): LearningResource[] {
  const resources: LearningResource[] = [];
  const slug = moduleTitle.toLowerCase().replace(/[^a-z0-9]+/g, "-");

  if (moduleType === "lesson") {
    resources.push(
      { id: id("res"), title: `${moduleTitle} - Video Lecture`, type: "video", url: `https://learn.glimmora.edu/videos/${slug}`, duration: 25 },
      { id: id("res"), title: `${moduleTitle} - Reading Material`, type: "article", url: `https://learn.glimmora.edu/articles/${slug}` },
    );
    if (faker.datatype.boolean()) {
      resources.push(
        { id: id("res"), title: `${moduleTitle} - Interactive Exercise`, type: "interactive", url: `https://learn.glimmora.edu/interactive/${slug}`, duration: 15 },
      );
    }
  } else if (moduleType === "quiz") {
    resources.push(
      { id: id("res"), title: "Study Guide", type: "pdf", url: `https://learn.glimmora.edu/guides/${slug}.pdf` },
    );
  } else {
    resources.push(
      { id: id("res"), title: "Project Requirements", type: "pdf", url: `https://learn.glimmora.edu/projects/${slug}.pdf` },
      { id: id("res"), title: "Starter Repository", type: "external_link", url: `https://github.com/glimmora-edu/${slug}-starter` },
    );
  }

  return resources;
}

// ─── Module Generator ────────────────────────────────────────────────────────

function generateModulesForPath(
  pathKey: string,
  pathStatus: LearningPath["status"],
  progressPercent: number,
): LearningModule[] {
  const moduleDefs = PATH_MODULE_MAP[pathKey];
  const totalModules = moduleDefs.length;
  const completedCount = Math.round((progressPercent / 100) * totalModules);

  return moduleDefs.map((def, index) => {
    let status: LearningModule["status"];
    if (pathStatus === "completed" || index < completedCount) {
      status = "completed";
    } else if (index === completedCount) {
      status = pathStatus === "not_started" ? "locked" : "available";
    } else {
      status = "locked";
    }

    // If in_progress and this is the current module, mark it
    if (pathStatus === "in_progress" && index === completedCount) {
      status = "available";
    }

    const moduleId = id("mod");

    const mod: LearningModule = {
      id: moduleId,
      title: def.title,
      description: def.desc,
      order: index + 1,
      type: def.type,
      duration: def.duration,
      status,
      resources: generateResources(def.title, def.type),
    };

    if (status === "completed") {
      mod.completedAt = pastDate(Math.max(1, (totalModules - index) * 3));
      if (def.type === "quiz") {
        mod.score = faker.number.int({ min: 72, max: 100 });
        mod.maxScore = 100;
      } else if (def.type === "assignment" || def.type === "project") {
        mod.score = faker.number.int({ min: 80, max: 98 });
        mod.maxScore = 100;
      }
    }

    return mod;
  });
}

// ─── Learning Paths Generator ────────────────────────────────────────────────

export function generateLearningPaths(): LearningPath[] {
  const pathDefs: {
    key: string;
    title: string;
    skill: string;
    difficulty: LearningPath["difficulty"];
    status: LearningPath["status"];
    progress: number;
    hours: number;
    prerequisites: string[];
    outcomes: string[];
    desc: string;
  }[] = [
    {
      key: "ml",
      title: "Machine Learning Fundamentals",
      skill: "Machine Learning",
      difficulty: "intermediate",
      status: "in_progress",
      progress: 60,
      hours: 42,
      prerequisites: ["Linear Algebra", "Python Programming", "Probability & Statistics"],
      outcomes: ["Build and evaluate ML models", "Implement neural networks from scratch", "Design end-to-end ML pipelines"],
      desc: "Master the foundations of machine learning from linear models to deep neural networks, with hands-on projects using real-world datasets.",
    },
    {
      key: "ds",
      title: "Advanced Data Structures",
      skill: "Data Structures & Algorithms",
      difficulty: "advanced",
      status: "completed",
      progress: 100,
      hours: 38,
      prerequisites: ["Introduction to Computer Science", "Basic Data Structures"],
      outcomes: ["Implement advanced tree and graph structures", "Apply dynamic programming to complex problems", "Analyze algorithmic complexity using amortized analysis"],
      desc: "Deep dive into advanced data structures and algorithmic techniques used in competitive programming and technical interviews.",
    },
    {
      key: "cloud",
      title: "Cloud Architecture & DevOps",
      skill: "Cloud Computing",
      difficulty: "intermediate",
      status: "in_progress",
      progress: 25,
      hours: 48,
      prerequisites: ["Operating Systems", "Computer Networks", "Linux Fundamentals"],
      outcomes: ["Deploy containerized applications with Kubernetes", "Design CI/CD pipelines", "Implement infrastructure as code"],
      desc: "Learn to design, deploy, and manage cloud-native applications using modern DevOps practices and tools.",
    },
    {
      key: "sysdesign",
      title: "System Design Patterns",
      skill: "System Design",
      difficulty: "advanced",
      status: "not_started",
      progress: 0,
      hours: 45,
      prerequisites: ["Database Systems", "Computer Networks", "Distributed Systems"],
      outcomes: ["Design scalable distributed systems", "Apply microservices architecture patterns", "Ace system design interviews"],
      desc: "Master the art of designing large-scale systems, from database sharding to microservices, with real-world case studies.",
    },
    {
      key: "fullstack",
      title: "Full-Stack Web Development",
      skill: "Full-Stack Development",
      difficulty: "intermediate",
      status: "in_progress",
      progress: 80,
      hours: 52,
      prerequisites: ["JavaScript", "HTML/CSS", "Basic React"],
      outcomes: ["Build production-ready React applications", "Design and implement RESTful APIs", "Deploy full-stack apps with CI/CD"],
      desc: "Build complete web applications from frontend to backend, covering React, Node.js, databases, testing, and deployment.",
    },
  ];

  return pathDefs.map((def) => {
    const modules = generateModulesForPath(def.key, def.status, def.progress);
    const completedModules = modules.filter((m) => m.status === "completed").length;
    const now = new Date().toISOString();

    return {
      id: id("path"),
      title: def.title,
      description: def.desc,
      skill: def.skill,
      difficulty: def.difficulty,
      totalModules: modules.length,
      completedModules,
      estimatedHours: def.hours,
      status: def.status,
      modules,
      prerequisites: def.prerequisites,
      outcomes: def.outcomes,
      progress: def.progress,
      createdAt: pastDate(Math.max(1, 90)),
      updatedAt: def.status === "not_started" ? pastDate(Math.max(1, 90)) : pastDate(Math.max(1, 3)),
    };
  });
}

// ─── Weakness Areas ──────────────────────────────────────────────────────────

function generateWeaknesses(): WeaknessArea[] {
  return [
    { skill: "Machine Learning", score: 58, benchmark: 75, gap: 17, suggestedLessons: 6, priority: "high" },
    { skill: "System Design", score: 42, benchmark: 70, gap: 28, suggestedLessons: 8, priority: "high" },
    { skill: "Cloud Architecture", score: 51, benchmark: 72, gap: 21, suggestedLessons: 7, priority: "high" },
    { skill: "Database Optimization", score: 63, benchmark: 75, gap: 12, suggestedLessons: 4, priority: "medium" },
    { skill: "DevOps & CI/CD", score: 55, benchmark: 68, gap: 13, suggestedLessons: 5, priority: "medium" },
  ];
}

// ─── Recent Activity ─────────────────────────────────────────────────────────

function generateRecentActivity(): TutorActivityItem[] {
  const activities: TutorActivityItem[] = [
    {
      id: id("act"),
      type: "lesson_completed",
      title: "Completed: Containerization with Docker",
      description: "Finished the Docker fundamentals lesson in Cloud Architecture & DevOps",
      timestamp: pastDate(1),
      xpEarned: 150,
    },
    {
      id: id("act"),
      type: "quiz_passed",
      title: "Quiz Passed: Frontend Architecture",
      description: "Scored 88% on the React patterns and state management quiz",
      timestamp: pastDate(1),
      xpEarned: 200,
    },
    {
      id: id("act"),
      type: "lesson_completed",
      title: "Completed: State Management at Scale",
      description: "Mastered Redux Toolkit, Zustand, and TanStack Query patterns",
      timestamp: pastDate(2),
      xpEarned: 150,
    },
    {
      id: id("act"),
      type: "milestone_reached",
      title: "Milestone: 80% Full-Stack Web Development",
      description: "Reached 80% completion on the Full-Stack Web Development path",
      timestamp: pastDate(2),
      xpEarned: 500,
    },
    {
      id: id("act"),
      type: "streak_achieved",
      title: "5-Day Learning Streak!",
      description: "You've been learning consistently for 5 days in a row",
      timestamp: pastDate(1),
      xpEarned: 100,
    },
    {
      id: id("act"),
      type: "lesson_completed",
      title: "Completed: Convolutional Neural Networks",
      description: "Finished CNN architectures lesson in Machine Learning Fundamentals",
      timestamp: pastDate(3),
      xpEarned: 175,
    },
    {
      id: id("act"),
      type: "quiz_passed",
      title: "Quiz Passed: Graph Theory",
      description: "Scored 92% on the graph traversal and shortest path assessment",
      timestamp: pastDate(5),
      xpEarned: 225,
    },
  ];

  return activities;
}

// ─── Skill Progress ──────────────────────────────────────────────────────────

function generateSkillProgress(): TutorDashboard["skillProgress"] {
  return [
    { skill: "Data Structures & Algorithms", before: 65, after: 92, lessonsCompleted: 9 },
    { skill: "Full-Stack Development", before: 48, after: 82, lessonsCompleted: 7 },
    { skill: "Machine Learning", before: 30, after: 58, lessonsCompleted: 5 },
    { skill: "Cloud Computing", before: 20, after: 51, lessonsCompleted: 2 },
    { skill: "System Design", before: 35, after: 42, lessonsCompleted: 0 },
    { skill: "DevOps & CI/CD", before: 25, after: 55, lessonsCompleted: 2 },
  ];
}

// ─── Recommended Lessons ─────────────────────────────────────────────────────

const RECOMMENDED_LESSON_POOL: Omit<RecommendedLesson, "id">[] = [
  {
    title: "Introduction to Transformer Architecture",
    skill: "Machine Learning",
    difficulty: "advanced",
    duration: 55,
    type: "reading",
    matchReason: "Builds on your CNN knowledge and addresses your ML skill gap",
    completionRate: 78,
  },
  {
    title: "Designing a Distributed Cache",
    skill: "System Design",
    difficulty: "advanced",
    duration: 60,
    type: "exercise",
    matchReason: "Core system design concept - your lowest scoring area",
    completionRate: 65,
  },
  {
    title: "AWS Lambda & Serverless Patterns",
    skill: "Cloud Architecture",
    difficulty: "intermediate",
    duration: 45,
    type: "video",
    matchReason: "Complements your Docker/K8s progress in the Cloud path",
    completionRate: 82,
  },
  {
    title: "SQL Query Optimization Techniques",
    skill: "Database Optimization",
    difficulty: "intermediate",
    duration: 40,
    type: "exercise",
    matchReason: "Addresses your database optimization weakness",
    completionRate: 74,
  },
  {
    title: "CAP Theorem Deep Dive",
    skill: "System Design",
    difficulty: "intermediate",
    duration: 35,
    type: "reading",
    matchReason: "Essential foundation before starting System Design Patterns path",
    completionRate: 88,
  },
  {
    title: "Building ML Models with PyTorch",
    skill: "Machine Learning",
    difficulty: "intermediate",
    duration: 70,
    type: "project",
    matchReason: "Hands-on practice to reinforce your ML fundamentals progress",
    completionRate: 61,
  },
  {
    title: "GitHub Actions CI/CD Workshop",
    skill: "DevOps & CI/CD",
    difficulty: "beginner",
    duration: 50,
    type: "exercise",
    matchReason: "Practical DevOps skills that complement your cloud learning",
    completionRate: 91,
  },
  {
    title: "Load Balancing Strategies Explained",
    skill: "System Design",
    difficulty: "intermediate",
    duration: 30,
    type: "video",
    matchReason: "Key scalability concept for your upcoming System Design path",
    completionRate: 85,
  },
];

export function generateRecommendedLessons(count: number = 8): RecommendedLesson[] {
  return RECOMMENDED_LESSON_POOL.slice(0, count).map((lesson) => ({
    ...lesson,
    id: id("rec"),
  }));
}

// ─── Tutor Dashboard ─────────────────────────────────────────────────────────

export function generateTutorDashboard(): TutorDashboard {
  return {
    activeLearningPaths: 3,
    completedLessons: 47,
    totalLessons: 120,
    currentStreak: 5,
    weeklyGoal: { target: 5, completed: 3 },
    weaknesses: generateWeaknesses(),
    recentActivity: generateRecentActivity(),
    recommendedLessons: generateRecommendedLessons(6),
    skillProgress: generateSkillProgress(),
  };
}

// ─── Tutor Session Generator ─────────────────────────────────────────────────

const SESSION_CONTENT_MAP: Record<string, { title: string; sections: Omit<ContentSection, "id" | "completed">[] }> = {
  "Containerization with Docker": {
    title: "Containerization with Docker",
    sections: [
      {
        title: "What are Containers?",
        type: "text",
        content: "Containers are lightweight, standalone packages that include everything needed to run a piece of software: code, runtime, system tools, libraries, and settings. Unlike virtual machines, containers share the host OS kernel, making them significantly more efficient.\n\nKey benefits:\n- **Consistency**: Same environment from development to production\n- **Isolation**: Each container runs independently\n- **Efficiency**: Minimal overhead compared to VMs\n- **Portability**: Run anywhere Docker is installed",
      },
      {
        title: "Docker Images & Dockerfiles",
        type: "code",
        content: "# Example Dockerfile for a Node.js application\nFROM node:20-alpine AS base\nWORKDIR /app\n\n# Install dependencies\nCOPY package*.json ./\nRUN npm ci --only=production\n\n# Copy application code\nCOPY . .\n\n# Build the application\nRUN npm run build\n\n# Production stage\nFROM node:20-alpine AS production\nWORKDIR /app\nCOPY --from=base /app/dist ./dist\nCOPY --from=base /app/node_modules ./node_modules\n\nEXPOSE 3000\nCMD [\"node\", \"dist/index.js\"]",
      },
      {
        title: "Docker Compose for Multi-Container Apps",
        type: "code",
        content: "# docker-compose.yml\nversion: '3.8'\nservices:\n  app:\n    build: .\n    ports:\n      - '3000:3000'\n    environment:\n      - DATABASE_URL=postgres://user:pass@db:5432/myapp\n    depends_on:\n      - db\n      - redis\n\n  db:\n    image: postgres:16-alpine\n    volumes:\n      - pgdata:/var/lib/postgresql/data\n    environment:\n      POSTGRES_USER: user\n      POSTGRES_PASSWORD: pass\n      POSTGRES_DB: myapp\n\n  redis:\n    image: redis:7-alpine\n    ports:\n      - '6379:6379'\n\nvolumes:\n  pgdata:",
      },
      {
        title: "Networking & Volumes",
        type: "text",
        content: "Docker provides several networking modes:\n\n1. **Bridge** (default): Containers on the same bridge network can communicate\n2. **Host**: Container shares the host's network stack\n3. **None**: No networking\n4. **Overlay**: Multi-host networking for Docker Swarm\n\nVolumes persist data beyond the container lifecycle:\n- **Named volumes**: Managed by Docker, best for production\n- **Bind mounts**: Map host directories into containers, useful for development\n- **tmpfs mounts**: Stored in memory only, great for sensitive data",
      },
      {
        title: "Best Practices & Security",
        type: "text",
        content: "Follow these Docker best practices:\n\n1. **Use multi-stage builds** to minimize image size\n2. **Don't run as root** - use USER directive\n3. **Use .dockerignore** to exclude unnecessary files\n4. **Pin base image versions** for reproducibility\n5. **Scan images for vulnerabilities** using docker scout or trivy\n6. **Keep images small** - prefer alpine-based images\n7. **Use health checks** for better orchestration integration",
      },
    ],
  },
  default: {
    title: "Lesson Content",
    sections: [
      {
        title: "Introduction & Objectives",
        type: "text",
        content: "In this lesson, you will learn the core concepts and practical applications of this topic. By the end, you should be able to apply these concepts to real-world scenarios.\n\n**Learning Objectives:**\n- Understand the fundamental principles\n- Apply concepts through hands-on exercises\n- Evaluate trade-offs in different approaches",
      },
      {
        title: "Core Concepts",
        type: "text",
        content: "This section covers the theoretical foundations. We'll explore the key ideas, their historical context, and why they matter in modern software engineering.\n\nThe main principles are:\n1. **Abstraction**: Hiding complexity behind well-defined interfaces\n2. **Composition**: Building complex systems from simpler components\n3. **Separation of Concerns**: Each module handles one responsibility",
      },
      {
        title: "Code Example",
        type: "code",
        content: "// Example implementation\nclass EventEmitter {\n  private listeners: Map<string, Function[]> = new Map();\n\n  on(event: string, callback: Function): void {\n    const existing = this.listeners.get(event) || [];\n    this.listeners.set(event, [...existing, callback]);\n  }\n\n  emit(event: string, ...args: unknown[]): void {\n    const callbacks = this.listeners.get(event) || [];\n    callbacks.forEach(cb => cb(...args));\n  }\n\n  off(event: string, callback: Function): void {\n    const existing = this.listeners.get(event) || [];\n    this.listeners.set(event, existing.filter(cb => cb !== callback));\n  }\n}",
      },
      {
        title: "Practical Application",
        type: "text",
        content: "Now let's apply what we've learned to a real-world scenario. Consider a microservice that needs to handle asynchronous communication between components.\n\nThe event-driven pattern allows:\n- **Decoupling**: Services don't need to know about each other\n- **Scalability**: Events can be processed in parallel\n- **Resilience**: Failed handlers don't affect the emitter",
      },
    ],
  },
};

function generateSessionContent(moduleTitle: string): SessionContent {
  const contentDef = SESSION_CONTENT_MAP[moduleTitle] || SESSION_CONTENT_MAP.default;

  return {
    type: "lesson",
    title: contentDef.title,
    sections: contentDef.sections.map((section, index) => ({
      ...section,
      id: id("sec"),
      completed: index === 0, // First section auto-completed
    })),
  };
}

function generateSessionQuiz(moduleTitle: string): SessionQuiz {
  const questions: QuizQuestion[] = [
    {
      id: id("q"),
      question: "Which of the following is NOT a benefit of containerization?",
      type: "multiple_choice",
      options: [
        "Environment consistency across development and production",
        "Complete hardware virtualization with dedicated kernel",
        "Lightweight resource usage compared to virtual machines",
        "Application isolation and dependency management",
      ],
      correctAnswer: "Complete hardware virtualization with dedicated kernel",
      explanation: "Containers share the host OS kernel rather than virtualizing hardware. That's what makes them lightweight compared to VMs.",
    },
    {
      id: id("q"),
      question: "Docker containers share the host operating system's kernel.",
      type: "true_false",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Unlike VMs, Docker containers share the host kernel, which is why they start faster and use fewer resources.",
    },
    {
      id: id("q"),
      question: "What is the purpose of a multi-stage Docker build?",
      type: "multiple_choice",
      options: [
        "To run multiple containers simultaneously",
        "To reduce the final image size by separating build and runtime dependencies",
        "To enable parallel execution of Docker commands",
        "To create multiple versions of the same image",
      ],
      correctAnswer: "To reduce the final image size by separating build and runtime dependencies",
      explanation: "Multi-stage builds let you use one stage for building (with all dev dependencies) and copy only the necessary artifacts to a minimal production image.",
    },
    {
      id: id("q"),
      question: "Docker volumes persist data even after a container is removed.",
      type: "true_false",
      options: ["True", "False"],
      correctAnswer: "True",
      explanation: "Named volumes and bind mounts persist data beyond the container lifecycle, which is essential for databases and stateful applications.",
    },
    {
      id: id("q"),
      question: "Which Docker networking mode allows containers on the same network to communicate by service name?",
      type: "multiple_choice",
      options: [
        "Host mode",
        "Bridge mode (user-defined)",
        "None mode",
        "Macvlan mode",
      ],
      correctAnswer: "Bridge mode (user-defined)",
      explanation: "User-defined bridge networks provide automatic DNS resolution between containers, allowing them to communicate using service names.",
    },
  ];

  return {
    questions,
    passingScore: 70,
    attempts: 0,
    maxAttempts: 3,
  };
}

function generateFeedback(): AiTutorFeedback {
  return {
    overallScore: 85,
    strengths: [
      "Strong understanding of container lifecycle and image layers",
      "Excellent grasp of Docker Compose for multi-service orchestration",
      "Good security awareness with multi-stage build practices",
    ],
    areasToImprove: [
      "Review Docker networking modes - overlay networks for multi-host setups need more practice",
      "Explore volume backup strategies for production environments",
    ],
    nextSteps: [
      "Move on to Kubernetes Orchestration to learn container management at scale",
      "Try the optional exercise: containerize a full-stack app with separate frontend, backend, and database services",
      "Review the Docker security scanning documentation for vulnerability assessment",
    ],
    encouragement: "Great progress! You've built a solid foundation in containerization. Your understanding of Dockerfiles and multi-stage builds is particularly impressive. Keep this momentum as you move into Kubernetes!",
  };
}

export function generateTutorSession(moduleId?: string): TutorSession {
  const paths = generateLearningPaths();
  const cloudPath = paths.find((p) => p.title === "Cloud Architecture & DevOps")!;
  const targetModule = moduleId
    ? cloudPath.modules.find((m) => m.id === moduleId) || cloudPath.modules[1]
    : cloudPath.modules[1]; // Containerization with Docker

  return {
    id: id("session"),
    moduleId: targetModule.id,
    moduleName: targetModule.title,
    pathId: cloudPath.id,
    pathName: cloudPath.title,
    skill: "Cloud Computing",
    content: generateSessionContent(targetModule.title),
    quiz: generateSessionQuiz(targetModule.title),
    status: "in_progress",
    startedAt: pastDate(1),
    feedback: generateFeedback(),
    createdAt: pastDate(1),
    updatedAt: pastDate(1),
  };
}
