# Glimmora Education Intelligence Platform
# Functional Specification Document (FSD)

**Version:** 1.0
**Date:** April 9, 2026
**Classification:** Confidential
**Prepared for:** Glimmora Platform Stakeholders

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [System Overview](#2-system-overview)
3. [User Roles & Access Control](#3-user-roles--access-control)
4. [Portal 1: Student Portal](#4-student-portal)
5. [Portal 2: Faculty Portal](#5-faculty-portal)
6. [Portal 3: Admin Portal](#6-admin-portal)
7. [Portal 4: Research Portal](#7-research-portal)
8. [Portal 5: Placement Portal](#8-placement-portal)
9. [Portal 6: Ministry Portal](#9-ministry-portal)
10. [Shared Platform Infrastructure](#10-shared-platform-infrastructure)
11. [Data Flow & Integration Architecture](#11-data-flow--integration-architecture)
12. [AI/ML System Specifications](#12-aiml-system-specifications)
13. [Security & Compliance](#13-security--compliance)
14. [Appendices](#14-appendices)

---

## 1. Introduction

### 1.1 Purpose
This Functional Specification Document (FSD) defines the complete functional behavior of the Glimmora Education Intelligence Platform — an AI-native, multi-tenant university management system delivering 6 role-based portals across 81 routes.

### 1.2 Scope
This document covers all user-facing functionality, data flows, business rules, AI-powered features, and cross-portal interactions for the following user roles:
- Student
- Faculty
- Admin (University Administration)
- Research
- Placement (Career Services)
- Ministry (Government Education Authority)

### 1.3 Intended Audience
- Product Owners & Stakeholders
- Frontend & Backend Development Teams
- QA & Testing Teams
- UI/UX Designers
- Integration Partners
- Client Stakeholders for Acceptance Review

### 1.4 Platform Vision
Glimmora unifies student development, research intelligence, placement matching, compliance monitoring, and institutional strategy into a single platform. Every decision is data-driven, every AI output is explainable, and every action is auditable.

### 1.5 Technical Stack
| Layer | Technology |
|-------|-----------|
| Frontend | Next.js (App Router), React, TypeScript, TailwindCSS |
| State Management | TanStack React Query (server state), Zustand (client state) |
| Component Library | Custom shared components (charts, forms, feedback, data tables) |
| Charts | Recharts (radar, area, bar, donut, gauge) |
| Forms | React Hook Form + Zod validation |
| API Layer | RESTful APIs with MSW mock service workers (development) |
| Authentication | SSO via SAML/OAuth2 (Keycloak) |
| Data Sources | PostgreSQL, Neo4j, Vector DB, Time-Series DB, Object Storage |

---

## 2. System Overview

### 2.1 Platform Architecture
```
┌─────────────────────────────────────────────────────────┐
│                    GLIMMORA PLATFORM                     │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│ Student  │ Faculty  │  Admin   │ Research │  Placement  │ Ministry
│ Portal   │ Portal   │  Portal  │ Portal   │  Portal     │ Portal
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│              Shared Component Library                    │
│    (Charts, Forms, Tables, Feedback, Navigation)        │
├──────────────────────────────────────────────────────────┤
│              API Gateway & Authentication                │
├──────────────────────────────────────────────────────────┤
│     AI/AGI Orchestration Layer (7 Domain Agents)        │
├──────────────────────────────────────────────────────────┤
│  PostgreSQL │ Neo4j │ Vector DB │ Time-Series │ Object  │
│  (OLTP)     │(Graph)│ (RAG)     │ (Skills)    │ Storage │
├──────────────────────────────────────────────────────────┤
│    Integration Connectors (Canvas, Moodle, SAP, etc.)   │
└─────────────────────────────────────────────────────────┘
```

### 2.2 Route Summary
| Portal | Routes | Primary Purpose |
|--------|--------|----------------|
| Student | 20 pages | Academic progress, skill development, career readiness |
| Faculty | 16 pages | Student oversight, research management, teaching |
| Admin | 18 pages | Institutional governance, compliance, user management |
| Research | 9 pages | Grant discovery, collaboration, publication tracking |
| Placement | 9 pages | Student-employer matching, pipeline management |
| Ministry | 11 pages | National oversight, policy simulation, compliance |
| **Total** | **81 pages** | |

### 2.3 Shared UI Components
All portals share a consistent component library:

| Component | Purpose |
|-----------|---------|
| `PageHeader` | Page title, icon, description, optional action buttons |
| `DataTable` | Sortable, searchable, paginated tables with row click |
| `KpiCard` / `StatCard` | Key metric display with trend indicators |
| `StatusBadge` | Color-coded status indicators with dot |
| `RiskIndicator` | Risk level visual display |
| `RadarChartDisplay` | Spider/radar chart for multi-dimensional data |
| `GaugeChart` | Circular gauge for percentage values |
| `DonutBreakdown` | Donut chart with centered value |
| `AreaTrend` | Time-series area/line chart |
| `BarComparison` | Side-by-side bar comparison |
| `Timeline` | Chronological event timeline with clickable links |
| `FormField` / `FormTextarea` / `FormSelect` | Form inputs with validation |
| `ConfirmDialog` | Modal confirmation for destructive actions |
| `ErrorState` / `EmptyState` | Error and empty data handling |
| `DashboardSkeleton` | Loading state skeletons |
| `SearchInput` | Debounced search input |
| `AiConfidenceIndicator` | AI confidence level display |
| `AiRecommendationCard` | AI recommendation with approve/dismiss |

---

## 3. User Roles & Access Control

### 3.1 Role Definitions

| Role | Who | Portal Access | Primary Actions |
|------|-----|--------------|-----------------|
| Student | Undergraduate, postgraduate, PhD, research scholars | Student Portal only | View grades, track skills, apply for jobs, submit appeals, learn |
| Faculty | Professors, lecturers, adjunct faculty | Faculty Portal only | Monitor students, create interventions, manage research, view briefings |
| Admin | Registrar, Provost, Dean, Department Heads, Compliance Officers | Admin Portal only | Manage users, compliance, credentials, integrations, settings |
| Research | Research scholars, PhD supervisors, Research Directors | Research Portal only | Discover grants, track publications, find collaborators, manage proposals |
| Placement | Career counselors, placement officers, employer relations | Placement Portal only | Match students to jobs, manage pipeline, track employers, run reports |
| Ministry | Education ministry officials, policy makers | Ministry Portal only | Cross-institution oversight, policy simulation, national compliance |

### 3.2 Authentication Flow
1. User navigates to `/login`
2. Enters institutional email and password (or clicks role-specific quick login in dev mode)
3. System authenticates via SSO (SAML/OAuth2)
4. RBAC engine determines portal access based on assigned role
5. User is redirected to their portal's dashboard (`/{role}/dashboard`)
6. Session managed with JWT tokens; auto-logout on expiry

### 3.3 Permission Matrix
Permissions are managed at the role level via the Admin Portal's Roles & Permissions page. Each role has a permission matrix defining access to modules and actions (Create, Read, Update, Delete) per module.

---

## 4. Student Portal

**URL Base:** `/student`
**Target User:** Students (undergraduate, postgraduate, PhD, research scholars)
**Core Purpose:** Unified view of academic progress, skill development, AI-powered recommendations, and career readiness

### 4.1 Navigation Structure

```
OVERVIEW
├── Dashboard (/student/dashboard)
└── Academics (/student/academics)
    └── Course Detail (/student/academics/[courseId])

GROWTH
├── Skills & Development (/student/skills)
│   └── Skill Evolution (/student/skills/evolution)
├── Guided Learning (/student/tutor)
│   ├── Learning Paths (/student/tutor/learning-path)
│   └── Session (/student/tutor/session)
└── Credentials (/student/credentials)
    └── Credential Detail (/student/credentials/[credentialId])

CAREER
├── Placement & Jobs (/student/placement)
│   ├── Jobs (/student/placement/jobs)
│   ├── Applications (/student/placement/applications)
│   └── Portfolio (/student/placement/portfolio)
└── AI Recommendations (/student/recommendations)

ACCOUNT
├── Appeals (/student/appeals)
│   ├── New Appeal (/student/appeals/new)
│   └── Appeal Detail (/student/appeals/[appealId])
└── Settings (/student/settings)
```

### 4.2 Dashboard (`/student/dashboard`)

**Purpose:** Central hub providing a personalized academic overview at a glance.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-DASH-01 | Display personalized welcome message | "Welcome back, {studentName}" in page header |
| STU-DASH-02 | Show current GPA with trend indicator | KPI card showing GPA value, sparkline chart, and "vs last semester" comparison |
| STU-DASH-03 | Show credit progress | KPI card with "{completed}/{required}" and percentage |
| STU-DASH-04 | Show current course count | KPI card with active courses |
| STU-DASH-05 | Show risk level indicator | Color-coded risk indicator (high/medium/low/none) |
| STU-DASH-06 | Show last data sync time | Muted text: "Last synced: {relative time}" |
| STU-DASH-07 | Provide quick action shortcuts | 4 action cards: Continue Learning, Browse Jobs, New Appeal, View Recommendations |
| STU-DASH-08 | Display upcoming deadlines | List of assignments/exams/projects with course name, type badge, and due date |
| STU-DASH-09 | Show skill radar preview | Radar chart comparing student scores vs program average; links to /student/skills |
| STU-DASH-10 | Display risk alerts with actions | Color-coded alert cards showing description, advisor notification status, and action button (View Attendance/View Course Performance) |
| STU-DASH-11 | Persist risk alert dismissals | Dismiss calls POST API; alerts don't return after refresh |
| STU-DASH-12 | Show recent activity timeline | Clickable timeline items linking to grades, credentials, recommendations, appeals, applications |
| STU-DASH-13 | Notification center | Bell icon in header showing unread count; dropdown with notifications, mark-as-read, click-to-navigate |

**Data Source:** `GET /api/students/me/dashboard` → `StudentDashboard`
- GPA (current, trend, previous semester)
- Credits (completed, required)
- Risk level, risk alerts, upcoming deadlines
- Skill radar preview, recent activity
- Last synced timestamp, student name

**Business Rules:**
- Risk alerts are generated by the Dropout Prevention Loop (AI Agent)
- Dismissing an alert persists via API; the student won't see it again
- Activity timeline items link to relevant detail pages
- Notification bell shows real-time count from `GET /api/students/me/notifications`

---

### 4.3 Academics (`/student/academics`)

**Purpose:** View current courses, grades, attendance, and full academic transcript.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-ACAD-01 | Show academic summary | 4 summary cards: Cumulative GPA, Credits Earned, Credits Attempted, Current Semester GPA |
| STU-ACAD-02 | Show data source | Label: "Source: Canvas LMS — Synced from your institution's records" |
| STU-ACAD-03 | Download unofficial transcript | "Download Unofficial Transcript" button (PDF via print) |
| STU-ACAD-04 | Current semester view | Grid of course cards showing code, name, instructor, credits, grade, attendance bar |
| STU-ACAD-05 | Full transcript view | Expandable semester cards with detailed course tables |
| STU-ACAD-06 | Search courses | Search by name, code, or instructor |
| STU-ACAD-07 | Navigate to course detail | Click course card → `/student/academics/{courseId}` |

**Data Sources:**
- `GET /api/students/me/courses?status=active` → Active courses
- `GET /api/students/me/transcript` → Historical transcript

---

### 4.4 Course Detail (`/student/academics/[courseId]`)

**Purpose:** Detailed view of a single course with grades, assignments, and attendance.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-CRS-01 | Show course header | Code badge, status badge, course name, instructor, schedule, room, credits |
| STU-CRS-02 | Open in LMS | External link to Canvas/Moodle course page |
| STU-CRS-03 | Overview tab | Assignment weight donut chart, attendance gauge, grade disclaimer footnote |
| STU-CRS-04 | Assignments tab | Sortable table with title, type, due date, score, weight, status, and Appeal action |
| STU-CRS-05 | Appeal shortcut | "Appeal" button on graded assignments pre-fills the appeal form with courseId and assessmentId |
| STU-CRS-06 | Attendance tab | Gauge chart, session summary (present/absent/total), help text for disputes |
| STU-CRS-07 | Grade disclaimer | "Final grade is determined by your instructor and may include adjustments not reflected here." |

**Data Source:** `GET /api/students/me/courses/{courseId}` → `Course` with assignments array

---

### 4.5 Skills & Development (`/student/skills`)

**Purpose:** Visual map of current skills, gaps, and growth trajectory.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-SKL-01 | Skill radar chart | Radar visualization comparing student scores vs "Program Average" (renamed from Benchmark) |
| STU-SKL-02 | Skills table | Sortable table with skill name, category, score bar, program avg, trend, self-assessed badge |
| STU-SKL-03 | Add self-assessed skill | "Add Skill" button opens form: name, category dropdown, score slider (1-100) |
| STU-SKL-04 | Skill gaps section | Gap cards showing current vs required score, progress bar, requiredBy context |
| STU-SKL-05 | Gap → Learning Path link | Each gap card links to `/student/tutor/learning-path?skill={skillName}` |
| STU-SKL-06 | Skill evolution page | Time-series area chart showing skill progression with event markers (course completions, credentials, tutor completions) |

**Data Sources:**
- `GET /api/students/me/skills` → `SkillScore[]`
- `GET /api/students/me/skills/gaps` → `SkillGap[]`
- `GET /api/students/me/skills/evolution` → `SkillEvolutionPoint[]`
- `POST /api/students/me/skills` → Add self-assessed skill

**Business Rules:**
- Skill scores are computed by the Student Development Agent
- Scores aggregate: course grades (40%), credentials (30%), tutor completions (30%)
- "Program Average" = cohort average for same program and year
- Gap "requiredBy" comes from job market analysis by the Placement Intelligence Agent
- Self-assessed skills show a distinct "Self-assessed" badge

---

### 4.6 Guided Learning (`/student/tutor`)

**Purpose:** AI-curated structured learning system for skill development.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-LRN-01 | Dashboard overview | Stat cards: Active Paths, Completed Lessons, Level/XP, Streak, Weekly Goal (editable) |
| STU-LRN-02 | Weakness areas | Cards showing skill gaps with "Start Learning" link to filtered learning paths |
| STU-LRN-03 | Learning paths | Filterable list (All/In Progress/Completed/Not Started) with expandable path details |
| STU-LRN-04 | Skill filter | `?skill=` query param auto-expands matching path and shows filter banner |
| STU-LRN-05 | Max 3 active paths | Cannot start 4th path; shows alert: "Pause or complete one before starting" |
| STU-LRN-06 | Module progression | Sequential unlock: completing module N unlocks module N+1 |
| STU-LRN-07 | Learning session | Content sections (text/code/video), mark-complete per section, quiz at end |
| STU-LRN-08 | Quiz with retake | Attempt tracking (e.g., "Attempt 1 of 3"), pass/fail threshold, retake option |
| STU-LRN-09 | Continue next module | After quiz pass: "Continue to Next Module" CTA |
| STU-LRN-10 | Bookmark sections | Bookmark icon on content sections for later review |
| STU-LRN-11 | AI feedback | After quiz: overall score, strengths, areas to improve, next steps, encouragement |
| STU-LRN-12 | Editable weekly goal | Inline edit with preset options (3, 5, 7) or custom number |

**Data Sources:**
- `GET /api/students/me/tutor/dashboard` → `TutorDashboard`
- `GET /api/students/me/tutor/learning-paths` → `LearningPath[]`
- `POST /api/students/me/tutor/sessions/start` → Start module session
- `POST /api/students/me/tutor/sessions/{id}/submit-quiz` → Grade quiz

**Business Rules:**
- XP system: Lesson completion = 50 XP, Quiz pass = 100 XP, Perfect score = 150 XP
- Level derived from total XP
- Streak = consecutive days with at least one completed activity
- Completing a learning path triggers skill score recalculation
- Paths authored by faculty, enriched by AI

---

### 4.7 Credentials (`/student/credentials`)

**Purpose:** Digital credential wallet with verification and sharing capabilities.

**Functional Requirements:**

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-CRD-01 | Credential list | Filterable grid: All, Degrees, Certificates, Badges, Transcripts |
| STU-CRD-02 | Credential detail | Title, issuer, dates, status, verification hash, associated skills, metadata |
| STU-CRD-03 | Share to LinkedIn | Deep-link to LinkedIn's "Add Certification" form with pre-filled data |
| STU-CRD-04 | Copy share link | Copy verification URL to clipboard with "Copied!" feedback |
| STU-CRD-05 | Download certificate | PDF generation via print |
| STU-CRD-06 | Expired renewal | Banner with "Request Renewal" mailto link for expired credentials |
| STU-CRD-07 | Blockchain verification | Explanation text: "Secured using blockchain verification" |
| STU-CRD-08 | Missing credential help | "Contact the Registrar's Office" with email link |

**Data Sources:**
- `GET /api/students/me/credentials` → `Credential[]`
- `GET /api/students/me/credentials/{id}` → `Credential`

**Business Rules:**
- Credentials are issued by the Admin Portal's credential management system
- Verification hash is blockchain-based (Global Credential Ledger)
- Statuses: active, pending_verification, expired, revoked
- Revocation is admin-only; student sees revoked status

---

### 4.8 Placement & Jobs (`/student/placement`)

**Purpose:** Career readiness assessment, job matching, and application tracking.

#### 4.8.1 Placement Hub
- Career Readiness Score (gauge, 0-100)
- Readiness breakdown by category (skills, experience, credentials, etc.)
- Top skills and gap skills
- Navigation to: Jobs, Applications, Portfolio

#### 4.8.2 Job Opportunities (`/student/placement/jobs`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-JOB-01 | Job listing | Cards with title, company, location, type, salary, match score |
| STU-JOB-02 | Filters | Type (full-time/internship/part-time/contract), min match score |
| STU-JOB-03 | Pre-apply modal | Confirmation showing matched/gap skills, optional note textarea |
| STU-JOB-04 | Save/bookmark jobs | Bookmark icon toggle on each job card |
| STU-JOB-05 | Gap skill → Tutor | Gap skill badges link to `/student/tutor/learning-path?skill={skill}` |
| STU-JOB-06 | Employer info | Expandable company description, industry, size |
| STU-JOB-07 | Source label | "Posted via Career Services" on each card |

#### 4.8.3 My Applications (`/student/placement/applications`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-APP-01 | Pipeline summary | Counts per stage: Matched, Applied, Interviewed, Offered, Placed, Rejected |
| STU-APP-02 | Stage guidance | Contextual text per stage explaining what to do next |
| STU-APP-03 | Accept/Decline offer | Action buttons on "offered" applications with confirmation |
| STU-APP-04 | Withdraw application | Available for "applied" and "interviewed" stages with confirmation |
| STU-APP-05 | Browse similar jobs | Link on rejected applications |
| STU-APP-06 | Application timeline | Expandable timeline showing status change history |

#### 4.8.4 Portfolio (`/student/placement/portfolio`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-PRT-01 | Full CRUD | Add, view, edit, delete portfolio items |
| STU-PRT-02 | Item types | Project, Paper, Certification, Award, Other |
| STU-PRT-03 | Edit capability | Pencil icon → modal pre-filled with existing data |
| STU-PRT-04 | Public/private toggle | Items can be marked public (visible to employers) or private |
| STU-PRT-05 | Skills tagging | Comma-separated skills per item |

---

### 4.9 AI Recommendations (`/student/recommendations`)

**Purpose:** Personalized AI-powered recommendations for courses, skills, jobs, and resources.

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-REC-01 | Type-specific badges | Color-coded: course (blue), skill (purple), job (green), resource (orange), intervention (red) |
| STU-REC-02 | Approve → follow-up CTA | After approving: type-specific action button (Start Learning Path, View Job, View Course, etc.) |
| STU-REC-03 | Structured dismiss | Dropdown with 5 reasons: not relevant, already completed, too advanced, too basic, not interested |
| STU-REC-04 | Dismiss feedback | "Got it. Your future recommendations will be adjusted." toast |
| STU-REC-05 | AI explainability | Each recommendation shows confidence score, explanation factors, data sources, model version |
| STU-REC-06 | Filter by status | Tabs: All, Pending, Approved, Dismissed with counts |

**Data Source:** `GET /api/students/me/recommendations` → `StudentRecommendation[]`

**Business Rules:**
- Recommendations generated by the Student Development Agent
- Generated on: semester start, grade posting, credential earned, path completed, weekly batch
- Approved recommendations persist and show follow-up actions
- Dismiss reasons feed back into the AI to improve future recommendations

---

### 4.10 Appeals (`/student/appeals`)

**Purpose:** Formal grade appeal workflow with multi-step resolution process.

| ID | Requirement | Implementation |
|----|------------|----------------|
| STU-APL-01 | Appeal list | Table with course, assessment, score, status, submitted date |
| STU-APL-02 | New appeal form | Course dropdown, assessment dropdown, reason textarea (min 50 chars), file upload |
| STU-APL-03 | Appeal guidelines | Collapsible section listing 4 valid grounds for appeal + timeline expectations |
| STU-APL-04 | Pre-fill from course | `?courseId=X&assessmentId=Y` query params pre-select fields |
| STU-APL-05 | Appeal detail | Full view with reason, reviewer response, timeline, documents |
| STU-APL-06 | Info requested flow | Reviewer asks for more info → student sees textarea to respond |
| STU-APL-07 | Escalation on rejection | "Escalate to Department Head" button + "Contact Ombudsman" link |
| STU-APL-08 | Resolution confirmation | Success banner: "Your grade has been updated from X to Y. Reflected in transcript." |

**Statuses:** pending → under_review → info_requested → resolved / rejected → escalated

---

### 4.11 Settings (`/student/settings`)

**Purpose:** Profile management, notification preferences, security, and privacy.

**Tabs:**

| Tab | Contents |
|-----|---------|
| Profile | Name, institutional email (locked), personal email, phone, bio, academic info (locked with help text), interests, social links (with employer visibility note), work experience section |
| Notifications | Toggles: email, push, risk alerts, grade updates, deadline reminders, job matches, recommendations, appeal updates, credential issued, application updates |
| Security | SSO password info (no dead link), Privacy & Data section with GDPR text, "Download My Data" button with state-based confirmation |

---

## 5. Faculty Portal

**URL Base:** `/faculty`
**Target User:** Professors, lecturers, associate professors, adjunct faculty
**Core Purpose:** Student oversight, teaching efficiency, research management, and AI-powered pre-class preparation

### 5.1 Navigation Structure

```
OVERVIEW
├── Dashboard (/faculty/dashboard)
└── AI Briefings (/faculty/briefings)

STUDENTS
├── My Students (/faculty/students)
│   └── Student Detail (/faculty/students/[studentId])
└── Interventions (/faculty/interventions)
    ├── New Intervention (/faculty/interventions/new)
    └── Intervention Detail (/faculty/interventions/[interventionId])

TEACHING
└── Courses (/faculty/courses)
    └── Course Detail (/faculty/courses/[courseId])

RESEARCH
├── Overview (/faculty/research)
├── Grant Radar (/faculty/research/grants)
├── Collaborations (/faculty/research/collaborations)
└── Publications (/faculty/research/publications)

ACCOUNT
└── Settings (/faculty/settings)
```

### 5.2 Dashboard (`/faculty/dashboard`)

**Purpose:** Teaching overview with live metrics, upcoming classes, and research alerts.

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-DASH-01 | Live KPI cards | At-Risk Students (computed live), Active Interventions (computed live), Total Students, Matched Grants |
| FAC-DASH-02 | Upcoming classes | Course cards with name, time, room, at-risk count, "View Briefing" link per class |
| FAC-DASH-03 | Grant alerts | Funding opportunities with deadlines, amounts, alignment scores |
| FAC-DASH-04 | Weekly trend chart | At-risk student count over weeks |
| FAC-DASH-05 | Research metrics | Publications, citations, h-index, active grants |

**Business Rules:**
- KPIs are computed from live data (not hardcoded)
- Creating/completing interventions immediately updates the dashboard count
- "View Briefing" links to the AI Briefings page for class preparation

---

### 5.3 My Students (`/faculty/students`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-STU-01 | Student list | Searchable, filterable table with risk level dropdown |
| FAC-STU-02 | Attendance trend icons | Visual trend indicator (up/down/stable) next to percentage |
| FAC-STU-03 | Student detail | 4 tabs: Overview (GPA history, skills radar, risk alerts), Performance, Attendance, Interventions |
| FAC-STU-04 | Course enrollment display | "Student in: CS 201, CS 401" visible on student detail |
| FAC-STU-05 | Risk alert → intervention | "Create Intervention" link on each risk alert card |
| FAC-STU-06 | Fixed empty state | Interventions tab empty state button navigates to `/faculty/interventions/new?studentId=X` |

---

### 5.4 Interventions

**Purpose:** Create, track, and manage student support interventions.

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-INT-01 | Intervention list | Filterable by status (All/Planned/Active/Completed/Abandoned) |
| FAC-INT-02 | Create intervention | Form: student dropdown (pre-filled from query), type, description, goals, start date |
| FAC-INT-03 | Full lifecycle | Planned → Active (via "Activate" button) → Completed/Abandoned |
| FAC-INT-04 | Reopen completed | "Reopen" button on completed interventions → reverts to Active |
| FAC-INT-05 | Note management | Add, edit, and delete notes with inline forms |
| FAC-INT-06 | View student profile | "View {name}'s Profile →" link in intervention header |
| FAC-INT-07 | Outcomes tracking | Editable outcomes section on completed interventions |
| FAC-INT-08 | Confirmation dialogs | Required for Mark Completed, Abandon, Reopen, Delete Note |

**Intervention Types:** Academic Support, Counseling, Mentoring, Schedule Adjustment, Financial Aid

**Statuses:** planned → active → completed / abandoned (reopen allowed)

---

### 5.5 Courses (`/faculty/courses`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-CRS-01 | Course list | Card grid with metrics (students, avg grade, attendance, credits) |
| FAC-CRS-02 | Course detail tabs | Overview, Students, Assignments, Engagement |
| FAC-CRS-03 | Open in LMS | External link to Canvas/Moodle |
| FAC-CRS-04 | Benchmark explanation | "Benchmark: Department average across all sections of this course" |
| FAC-CRS-05 | Grade context | "Based on {N} students, current semester grades" |
| FAC-CRS-06 | Student click-through | Student rows link to `/faculty/students/{studentId}` |

---

### 5.6 AI Briefings (`/faculty/briefings`)

**Purpose:** AI-generated pre-class briefings with actionable insights.

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-BRF-01 | Briefing cards | Expandable cards per course showing key insights preview |
| FAC-BRF-02 | Clickable student names | "Students to Watch" names link to student detail pages |
| FAC-BRF-03 | View Course link | Each briefing card links to the course detail page |
| FAC-BRF-04 | Topic explainability | "Suggested based on recent quiz results and assignment gaps" |
| FAC-BRF-05 | Action item checkboxes | Toggle completion with loading state |
| FAC-BRF-06 | Follow-up guidance | "To follow up, create an intervention from the student's profile" |

---

### 5.7 Grant Radar (`/faculty/research/grants`)

**Purpose:** Discover funding opportunities with AI-powered alignment matching and full workflow.

| ID | Requirement | Implementation |
|----|------------|----------------|
| FAC-GRT-01 | Status workflow | Buttons to move: Discovered → Interested → Drafting → Submitted → Funded/Rejected |
| FAC-GRT-02 | Match explanation | "Based on your research interests and publication history" |
| FAC-GRT-03 | Success probability | Tooltip: "Computed from historical acceptance rates and proposal alignment" |
| FAC-GRT-04 | Expandable details | Requirements list, eligibility, match explanation |
| FAC-GRT-05 | Deadline urgency | Red highlight for deadlines within 14 days |
| FAC-GRT-06 | Funded badge | Green checkmark badge on funded grants (no further actions) |
| FAC-GRT-07 | Rejected muted | Reduced opacity on rejected grants |

---

### 5.8 Settings (`/faculty/settings`)

| Tab | Contents |
|-----|---------|
| Profile | Name, email (locked), phone, bio, office, office hours, research interests, expertise, social links |
| Preferences | 8 notification toggles with real API persistence: email, push, student risk alerts, intervention updates, grant deadlines, briefing ready, collaboration requests, citation alerts |

---

## 6. Admin Portal

**URL Base:** `/admin`
**Target User:** University administrators (Registrar, Provost, Dean, Department Heads, Compliance Officers)
**Core Purpose:** Institutional health, governance, compliance, resource management, and user administration

### 6.1 Navigation Structure

```
OVERVIEW
├── Dashboard (/admin/dashboard)
└── Analytics (/admin/analytics)

GOVERNANCE
├── Compliance (/admin/compliance)
└── Audit Trail (/admin/compliance/audit-trail)

MANAGEMENT
├── Admissions (/admin/admissions)
│   ├── Applications (/admin/admissions/applications)
│   └── Predictions (/admin/admissions/predictions)
├── Users & Roles (/admin/users)
│   ├── User Detail (/admin/users/[userId])
│   └── Roles (/admin/users/roles)
├── Integrations (/admin/integrations)
└── Budget & Resources (/admin/budget)

INTELLIGENCE
├── AI Governance (/admin/ai-governance)
│   ├── Models (/admin/ai-governance/models)
│   └── Bias Reports (/admin/ai-governance/bias-reports)
├── Credentials (/admin/credentials)
└── Reports (/admin/reports)

SYSTEM
└── Settings (/admin/settings)
```

### 6.2 Dashboard (`/admin/dashboard`)

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-DASH-01 | Enrollment KPIs | Total enrollment, retention rate, graduation rate, compliance score |
| ADM-DASH-02 | Data sync indicator | "Data synced from institutional systems. Last updated: {time}" |
| ADM-DASH-03 | Compliance context | Score-based text: "Meets standards" (≥90), "Needs attention" (75-89), "Critical" (<75) |
| ADM-DASH-04 | Clickable deviations | Recent compliance deviations link to compliance page |
| ADM-DASH-05 | Enrollment charts | 12-month trend area chart, by-department donut |
| ADM-DASH-06 | Research metrics | Faculty-student ratio, integration health |

---

### 6.3 Admissions (`/admin/admissions`)

#### 6.3.1 Admissions Dashboard

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-ADM-01 | Pipeline visualization | Horizontal bar with colored stage segments; each segment is a clickable Link to filtered applications |
| ADM-ADM-02 | Application metrics | Total, Pending Review, Accepted, Acceptance Rate |
| ADM-ADM-03 | Department breakdown | Bar chart of applications by department |
| ADM-ADM-04 | Demographics | Donut chart of applicant demographics |

#### 6.3.2 Applications Review

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-APP-01 | Application cards | Expandable with AI assessment, documents, review notes, decision controls |
| ADM-APP-02 | AI assessment | Score bars for Academic, Extracurricular, Essay, Recommendation, Overall Fit |
| ADM-APP-03 | AI explainability | "Scores generated by Glimmora Admissions AI v2.1. Based on academic records, essays, and extracurricular profile." |
| ADM-APP-04 | Accept with feedback | Confirmation dialog; success: "Acceptance notification will be sent. Next step: Enrollment confirmation." |
| ADM-APP-05 | Reject with reason | Custom modal requiring rejection reason; feedback: "Applicant will be notified with the provided reason." |
| ADM-APP-06 | Schedule interview | Form with date, time, interviewer; feedback: "Calendar invite sent to {interviewer} and applicant." |
| ADM-APP-07 | Review notes | Add notes with type (general/academic/interview/decision); displayed in timeline |

#### 6.3.3 AI Predictions

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-PRD-01 | Yield prediction | Predicted vs historical yield rates with confidence indicator |
| ADM-PRD-02 | Confidence explanation | "Based on historical enrollment data from the past 5 years" |
| ADM-PRD-03 | Enrollment forecast | Department capacity table with fill rate bars |
| ADM-PRD-04 | Implement recommendation | Button with feedback: "Assigned to the relevant department for action." |
| ADM-PRD-05 | Risk factors | Informational cards showing threats to enrollment targets |

---

### 6.4 Users & Roles

#### 6.4.1 User Management

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-USR-01 | User list | Searchable, filterable by role and status |
| ADM-USR-02 | Create user | Dialog with email, name, role, department; feedback includes activation email notice |
| ADM-USR-03 | Role change confirmation | "You are about to change {name}'s role from {old} to {new}. This will change their system access." |
| ADM-USR-04 | Suspension warning | "Suspending this user will immediately revoke their access." |
| ADM-USR-05 | Audit trail link | "Changes saved. This action has been logged in the Audit Trail." |

#### 6.4.2 Roles & Permissions

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-ROL-01 | Permission matrix | Grid of modules × actions (Create/Read/Update/Delete) per role |
| ADM-ROL-02 | Toggle confirmation | "This change affects all {N} users with the {role} role. Proceed?" |

---

### 6.5 Compliance & Audit

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-CMP-01 | Compliance score | Gauge chart with context text explaining frameworks |
| ADM-CMP-02 | Deviation resolution | Inline form with resolution textarea; success links to Audit Trail |
| ADM-CMP-03 | Audit trail | Filterable log with timestamp, user, action, resource, IP, outcome |
| ADM-CMP-04 | Detail tooltips | Full detail text accessible via hover tooltip on truncated entries |

---

### 6.6 Credentials Management

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-CRD-01 | Issue credential | Form: student ID, title, type, description |
| ADM-CRD-02 | Issue feedback | "Student will be notified and credential appears in their digital wallet." |
| ADM-CRD-03 | Revoke credential | Confirmation with reason; feedback: "Student notified, verification status updated." |
| ADM-CRD-04 | Status tracking | active, pending_verification, expired, revoked |

---

### 6.7 AI Governance

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-AI-01 | Model registry | List of AI models with accuracy, bias score, training date, status |
| ADM-AI-02 | Bias context | "Bias score measures demographic parity. Lower values = better fairness. Target: < 0.10." |
| ADM-AI-03 | Override log | "All AI overrides are permanently logged for compliance and audit purposes." |
| ADM-AI-04 | Bias thresholds | "Values below threshold pass. Values above require review and corrective action." |
| ADM-AI-05 | Model retraining | "Models automatically retrained based on data drift detection." |
| ADM-AI-06 | Recommendation attribution | "Generated by the Bias Monitoring System based on statistical analysis." |

---

### 6.8 Integrations

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-INT-01 | Integration cards | Name, type, provider, health status, sync history |
| ADM-INT-02 | Health explanation | degraded: "Some sync operations failing"; down: "Integration offline" |
| ADM-INT-03 | Sync direction | LMS: "Inbound: Grades, enrollments"; SIS: "Bidirectional: Student records" |
| ADM-INT-04 | Next sync display | Shows scheduled next sync time |

---

### 6.9 Budget & Resources

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-BDG-01 | Budget overview | Total, spent, remaining, utilization rate |
| ADM-BDG-02 | Department allocation | Bar chart comparing allocated vs spent per department |
| ADM-BDG-03 | Budget alerts | Auto-generated when departments approach/exceed limits |
| ADM-BDG-04 | Utilization target | "Current fiscal year utilization. Target: 85-95% by year end." |

---

### 6.10 Reports

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-RPT-01 | Template selection | Grid of report templates with description, category, last generated |
| ADM-RPT-02 | Dynamic parameters | Form fields generated from template parameter definitions |
| ADM-RPT-03 | Generation feedback | "Report generation started. Typically takes 1-2 minutes." |
| ADM-RPT-04 | Status tracking | Generating (yellow), Completed (green), Failed (red) badges |
| ADM-RPT-05 | Download | Direct download link for completed reports |

---

### 6.11 Settings

| ID | Requirement | Implementation |
|----|------------|----------------|
| ADM-SET-01 | Institution config | Name, short name, timezone, locale, academic year, primary color |
| ADM-SET-02 | Color preview | Sample swatch showing selected color applied to text and button |
| ADM-SET-03 | Data sharing toggles | Share with Ministry, Anonymize Data, Public Profile |
| ADM-SET-04 | Data retention warning | "Changing retention will affect historical data. Records older than specified period will be permanently archived." |
| ADM-SET-05 | Dirty state tracking | "You have unsaved changes" message with Save button |

---

## 7. Research Portal

**URL Base:** `/research`
**Target User:** Research scholars, PhD supervisors, Research Directors, Research Office staff
**Core Purpose:** Maximize research output, funding discovery, and collaboration

### 7.1 Navigation Structure

```
OVERVIEW
├── Dashboard (/research/dashboard)
└── Performance (/research/performance)

FUNDING
├── Grant Discovery (/research/grants)
└── My Grants (/research/grants/my-grants)

NETWORK
├── Collaborations (/research/collaborations)
├── Publications (/research/publications)
└── Topic Trends (/research/topics)

ACCOUNT
└── Settings (/research/settings)
```

### 7.2 Key Features

| ID | Feature | Description |
|----|---------|-------------|
| RES-01 | Research Dashboard | KPIs (publications, citations, h-index, grants), trending topics, recent publications, quick navigation |
| RES-02 | Performance Analytics | Output by year, impact by type, growth projection with confidence bands, peer comparison (You vs Field Avg vs Top 10%) |
| RES-03 | Grant Discovery | AI-powered alignment scoring, success probability, expandable details with eligibility and requirements |
| RES-04 | My Grants | Personal proposal tracker with status lifecycle (Drafting → Submitted → Under Review → Funded/Rejected) |
| RES-05 | Collaboration Network | Dual view: card grid + SVG graph visualization with institution clustering |
| RES-06 | Publications | Searchable table with DOI links, citation counts, co-author lists, type filters |
| RES-07 | Topic Trends | Momentum tracking with area charts, related topics, funding growth indicators |
| RES-08 | Settings | Profile, ORCID, Google Scholar handles, research interests, expertise |

---

## 8. Placement Portal

**URL Base:** `/placement`
**Target User:** Career counselors, placement officers, employer relations managers
**Core Purpose:** Match students to opportunities, manage employer relationships, track placement pipeline

### 8.1 Navigation Structure

```
OVERVIEW
└── Dashboard (/placement/dashboard)

OPERATIONS
├── Students (/placement/students)
├── Employers (/placement/employers)
│   └── Employer Detail (/placement/employers/[employerId])
├── Matching Engine (/placement/matching)
└── Pipeline (/placement/pipeline)

INSIGHTS
└── Reports (/placement/reports)

SYSTEM
└── Settings (/placement/settings)
```

### 8.2 Key Features

| ID | Feature | Description |
|----|---------|-------------|
| PLC-01 | Dashboard | Placement rate, pipeline breakdown, monthly targets, top employers, upcoming drives |
| PLC-02 | Student Employability | Searchable directory with employability scores, risk levels, skills analysis |
| PLC-03 | Employer Management | Directory with engagement scores, job postings, hiring history; add new employers |
| PLC-04 | AI Matching Engine | Run matching algorithm with parameters (department, GPA, employability, max results); approve/reject matches |
| PLC-05 | Pipeline Management | Track candidates through: matched → applied → interviewed → offered → placed (or rejected); stage progression buttons; notes per item |
| PLC-06 | Reports | Placement rate by department, equity metrics, time-to-placement, skill demand vs supply, cohort analysis |
| PLC-07 | Settings | Matching preferences (weights, thresholds), equity parameters (diversity targets), notification toggles |

### 8.3 Matching Engine Configuration

| Parameter | Description | Range |
|-----------|-------------|-------|
| Minimum Match Score | Threshold for including matches | 0-100% |
| Max Results Per Run | Limit on match results | 1-500 |
| Include Internships | Include internship positions | Toggle |
| Include Part-Time | Include part-time positions | Toggle |
| GPA Weight | Relative importance of GPA | 0-100% |
| Skills Weight | Relative importance of skills | 0-100% |
| Experience Weight | Relative importance of experience | 0-100% |
| Enable Equity Check | Apply demographic parity checks | Toggle |
| Target Diversity Rate | Target diversity percentage | 0-100% |

---

## 9. Ministry Portal

**URL Base:** `/ministry`
**Target User:** Education ministry officials, policy makers, national education administrators
**Core Purpose:** Cross-institution oversight, policy simulation, national education intelligence

### 9.1 Navigation Structure

```
OVERVIEW
├── Dashboard (/ministry/dashboard)
└── Institutions (/ministry/institutions)
    └── Institution Detail (/ministry/institutions/[institutionId])

OVERSIGHT
├── Compliance (/ministry/compliance)
└── Quality Indicators (/ministry/quality)

STRATEGIC
├── Policy Simulation (/ministry/simulation)
├── Scenario Comparison (/ministry/scenarios)
└── Budget Intelligence (/ministry/budget)

REPORTING
└── Reports (/ministry/reports)

SYSTEM
└── Settings (/ministry/settings)
```

### 9.2 Key Features

| ID | Feature | Description |
|----|---------|-------------|
| MIN-01 | National Dashboard | Institution count, national enrollment, graduation rate, compliance score, enrollment by region, budget utilization |
| MIN-02 | Institution Directory | Searchable/filterable table with rankings, compliance scores, performance metrics |
| MIN-03 | Institution Detail | Historical enrollment, performance trends, compliance history, department breakdown, deviations |
| MIN-04 | National Compliance | National score gauge, framework-level scores, compliance trends, per-institution breakdown |
| MIN-05 | Quality Indicators | Faculty ratios, research output, placement rates, student satisfaction, accreditation status |
| MIN-06 | Budget Intelligence | National allocation, utilization tracking, category breakdown, yearly trends, projections with confidence bands |
| MIN-07 | Policy Simulation | Run scenario simulations (budget, hiring, enrollment, policy) with parameters; view projections and AI insights |
| MIN-08 | Scenario Comparison | Select 2+ completed simulations for side-by-side metric comparison |
| MIN-09 | Reports | Generate national/regional/institutional/compliance/budget reports with custom parameters |
| MIN-10 | Settings | Dashboard preferences, data access policies, notification toggles |

### 9.3 Policy Simulation Parameters

| Simulation Type | Available Parameters |
|----------------|---------------------|
| Budget | Funding increase %, allocation changes, new programs |
| Hiring | Faculty additions, department targets, salary adjustments |
| Enrollment | Capacity changes, admission criteria, outreach investment |
| Policy | Regulatory changes, compliance requirements, reporting mandates |

---

## 10. Shared Platform Infrastructure

### 10.1 Authentication & Authorization
- SSO via SAML / OAuth2 (Keycloak)
- RBAC with 6 roles, module-level permissions
- Multi-tenant session management
- JWT token-based authentication

### 10.2 Notification System
- In-app notification center (Student Portal: full dropdown, Faculty Portal: placeholder)
- Notification types: grade updates, risk alerts, appeal updates, credential issued, job matches, recommendations, deadline reminders, application updates
- Per-user notification preferences (email, push, per-type toggles)
- Mark as read (individual and bulk)

### 10.3 Global Credential Ledger
- Blockchain-based credential hashing
- Verification URL generation
- Employer verification API
- Credential lifecycle: issue → active → expired/revoked
- Cross-institution validation

### 10.4 Compliance Engine
- GDPR, FERPA, DPDP compliance mechanisms
- Automated deviation detection
- Resolution workflow with audit trail integration
- Framework-level scoring (GDPR, FERPA, institutional)

---

## 11. Data Flow & Integration Architecture

### 11.1 External Integrations

| System | Direction | Data Exchanged |
|--------|-----------|---------------|
| Canvas LMS | Inbound | Grades, enrollments, assignments, attendance |
| Moodle LMS | Inbound | Grades, enrollments, assignments, attendance |
| SIS (Student Info System) | Bidirectional | Student records, enrollment, demographics |
| SAP Higher Education | Inbound | Financial data, HR records |
| Finance ERP | Inbound | Budget, expenditure, allocations |
| HRMS/Payroll | Inbound | Faculty records, compensation |
| Scopus/Elsevier | Inbound | Publications, citations, h-index |

### 11.2 Internal Data Flows

```
LMS → Student Grades → GPA Calculation → Skill Scoring → Career Readiness
                                            ↓
                                      Risk Assessment → Faculty Alerts → Interventions
                                            ↓
                                      AI Recommendations → Student Dashboard
                                            ↓
                                      Placement Matching → Job Applications → Pipeline
```

---

## 12. AI/ML System Specifications

### 12.1 AI Agents

| Agent | Domain | Portals Served |
|-------|--------|---------------|
| Student Development Agent | Skill assessment, risk prediction, recommendations | Student, Faculty |
| Placement Intelligence Agent | Job matching, career readiness, employer alignment | Student, Placement |
| Compliance Agent | Regulatory monitoring, deviation detection | Admin, Ministry |
| Research Optimization Agent | Grant discovery, collaboration matching | Faculty, Research |
| Institutional Strategy Agent | Enrollment forecasting, resource optimization | Admin, Ministry |
| Budget & Resource Agent | Financial planning, allocation optimization | Admin, Ministry |
| Ministry Intelligence Agent | Cross-institution analytics, policy simulation | Ministry |

### 12.2 Autonomous Control Loops

| Loop | Function | Portals |
|------|----------|---------|
| Dropout Prevention | Risk detection → Intervention proposal → Monitoring → Feedback | Student, Faculty, Admin |
| Research Optimization | Detect → Simulate → Recommend → Approve → Track | Research, Faculty |
| Compliance Monitoring | Detect deviation → Notify → Recommend → Track | Admin, Ministry |
| Strategic Forecast | Scenario modeling → Comparative output → Decision support | Ministry, Admin |

### 12.3 Explainability Requirements
Every AI output across all portals must include:
- Confidence score
- Contributing factors with weights and directions
- Data sources used
- Model version and generation timestamp
- Human-readable explanation summary

---

## 13. Security & Compliance

### 13.1 Data Protection
| Standard | Implementation |
|----------|---------------|
| GDPR | Consent management, data access/export/deletion, right to be forgotten |
| FERPA | Student record access controls, directory information opt-out |
| DPDP | Indian data protection compliance, consent architecture |
| ISO 27001 | Information security management alignment |
| SOC2 | Service organization control framework |

### 13.2 Audit & Logging
- Independent audit logging of all system actions
- Tamper-resistant log storage
- Searchable by user, action, role, timestamp
- Exportable for regulatory review

### 13.3 Encryption
- Data at rest: AES-256 encryption
- Data in transit: TLS 1.3
- Institution-level encryption key management
- Tenant isolation across all data stores

---

## 14. Appendices

### 14.1 API Endpoint Summary

| Portal | Endpoints | Base Path |
|--------|-----------|-----------|
| Student | 35+ | `/api/students/me/` |
| Faculty | 20+ | `/api/faculty/me/` |
| Admin | 30+ | `/api/admin/` |
| Research | 15+ | `/api/research/me/` |
| Placement | 15+ | `/api/placement/` |
| Ministry | 15+ | `/api/ministry/` |

### 14.2 Status Enums

| Entity | Statuses |
|--------|----------|
| Appeal | pending, under_review, info_requested, resolved, rejected, escalated |
| Application (Pipeline) | matched, applied, interviewed, offered, placed, rejected |
| Credential | active, pending_verification, expired, revoked |
| Intervention | planned, active, completed, abandoned |
| Grant | discovered, interested, drafting, submitted, funded, rejected |
| Integration | healthy, degraded, down |
| AI Model | active, inactive, training, deprecated |
| Compliance | compliant, at_risk, non_compliant |
| Risk Level | high, medium, low, none |
| Report | generating, completed, failed |

### 14.3 Glossary

| Term | Definition |
|------|-----------|
| Glimmora | The platform name — Education Intelligence Infrastructure |
| Portal | A role-specific web application within the platform |
| Tenant | A university or institution using the platform |
| Dropout Prevention Loop | AI control loop that detects at-risk students and proposes interventions |
| Global Credential Ledger | Blockchain-based credential verification system |
| Skill Radar | Visual representation of a student's competency scores |
| Career Readiness Score | AI-computed employability metric (0-100) |
| Program Average | Cohort-level benchmark (average score of students in same program/year) |
| Match Score | AI-computed alignment between a student and a job/grant/collaborator |

---

*End of Document*

**Document Control:**
- Version 1.0 — Initial comprehensive FSD
- Generated from codebase analysis of 81 routes across 6 portals
- All features verified via browser-based end-to-end testing
