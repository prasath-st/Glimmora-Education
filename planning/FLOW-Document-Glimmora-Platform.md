# Glimmora Education Intelligence Platform
# System Flow Document

**Version:** 1.0
**Date:** April 9, 2026
**Classification:** Confidential

---

## Table of Contents

1. [Cross-Portal Data Flow](#1-cross-portal-data-flow)
2. [Student Portal — Internal Flows](#2-student-portal--internal-flows)
3. [Faculty Portal — Internal Flows](#3-faculty-portal--internal-flows)
4. [Admin Portal — Internal Flows](#4-admin-portal--internal-flows)
5. [Research Portal — Internal Flows](#5-research-portal--internal-flows)
6. [Placement Portal — Internal Flows](#6-placement-portal--internal-flows)
7. [Ministry Portal — Internal Flows](#7-ministry-portal--internal-flows)
8. [Cross-Portal Interaction Flows](#8-cross-portal-interaction-flows)
9. [AI Agent Orchestration Flows](#9-ai-agent-orchestration-flows)
10. [Data Lifecycle Flows](#10-data-lifecycle-flows)

---

## 1. Cross-Portal Data Flow

### 1.1 Master System Flow

This diagram shows how all 6 portals connect through shared data and AI systems.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        EXTERNAL SYSTEMS                                     │
│  Canvas LMS ──┐  Moodle ──┐  SIS ──┐  ERP ──┐  Scopus ──┐  HRMS ──┐      │
└───────────────┼───────────┼────────┼────────┼───────────┼─────────┼──────┘
                │           │        │        │           │         │
                ▼           ▼        ▼        ▼           ▼         ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     INTEGRATION CONNECTORS                                  │
│  Grades, Attendance, Enrollments, Finances, Publications, Faculty Records   │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
                               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                        DATA LAYER                                           │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌────────────┐ ┌──────────────┐   │
│  │PostgreSQL│ │  Neo4j   │ │Vector DB │ │Time-Series │ │Object Storage│   │
│  │  (OLTP)  │ │ (Graph)  │ │  (RAG)   │ │  (Skills)  │ │  (Reports)   │   │
│  └────┬─────┘ └────┬─────┘ └────┬─────┘ └─────┬──────┘ └──────┬───────┘   │
│       │            │            │              │               │           │
└───────┼────────────┼────────────┼──────────────┼───────────────┼───────────┘
        │            │            │              │               │
        ▼            ▼            ▼              ▼               ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                   AI / AGI ORCHESTRATION LAYER                              │
│                                                                             │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐ ┌─────────────┐          │
│  │  Student    │ │ Placement   │ │ Compliance  │ │  Research   │          │
│  │Development  │ │Intelligence │ │   Agent     │ │Optimization │          │
│  │  Agent      │ │   Agent     │ │             │ │   Agent     │          │
│  └──────┬──────┘ └──────┬──────┘ └──────┬──────┘ └──────┬──────┘          │
│         │               │               │               │                  │
│  ┌──────┴──────┐ ┌──────┴──────┐ ┌──────┴──────┐                          │
│  │Institutional│ │   Budget    │ │  Ministry   │                          │
│  │  Strategy   │ │ & Resource  │ │Intelligence │                          │
│  │   Agent     │ │   Agent     │ │   Agent     │                          │
│  └─────────────┘ └─────────────┘ └─────────────┘                          │
└──────────────────────────────┬──────────────────────────────────────────────┘
                               │
            ┌──────────────────┼──────────────────────┐
            │                  │                      │
            ▼                  ▼                      ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐
│               │  │               │  │                               │
│   STUDENT     │  │   FACULTY     │  │         ADMIN                 │
│   PORTAL      │  │   PORTAL      │  │         PORTAL                │
│               │  │               │  │                               │
│  - Dashboard  │  │  - Dashboard  │  │  - Dashboard                  │
│  - Academics  │  │  - Students   │  │  - Admissions                 │
│  - Skills     │◄─┤  - Briefings  │  │  - Users & Roles              │
│  - Learning   │  │  - Courses    │  │  - Compliance                 │
│  - Credentials│◄─┤  - Research   │  │  - Credentials ──────────────►│
│  - Placement  │  │  - Grants     │  │  - AI Governance              │
│  - Appeals    │  │  - Settings   │  │  - Integrations               │
│  - Settings   │  │               │  │  - Budget                     │
│               │  │               │  │  - Reports                    │
│               │  │               │  │  - Settings                   │
└───────┬───────┘  └───────┬───────┘  └───────────────┬───────────────┘
        │                  │                          │
        │                  │                          │
        ▼                  ▼                          ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────────────────────┐
│               │  │               │  │                               │
│   RESEARCH    │  │  PLACEMENT    │  │         MINISTRY              │
│   PORTAL      │  │  PORTAL       │  │         PORTAL                │
│               │  │               │  │                               │
│  - Dashboard  │  │  - Dashboard  │  │  - Dashboard                  │
│  - Performance│  │  - Students   │  │  - Institutions               │
│  - Grants     │  │  - Employers  │  │  - Compliance                 │
│  - My Grants  │  │  - Matching   │  │  - Quality                    │
│  - Collabs    │  │  - Pipeline   │  │  - Budget                     │
│  - Pubs       │  │  - Reports    │  │  - Simulation                 │
│  - Topics     │  │  - Settings   │  │  - Scenarios                  │
│  - Settings   │  │               │  │  - Reports                    │
│               │  │               │  │  - Settings                   │
└───────────────┘  └───────────────┘  └───────────────────────────────┘
```

### 1.2 Portal Interconnection Matrix

This table shows which portals share data and how they connect.

| From Portal | To Portal | Data Shared | How It Flows |
|-------------|-----------|-------------|--------------|
| **Student** → **Faculty** | Risk alerts, grades, attendance | Faculty sees student performance synced from same LMS source |
| **Student** → **Placement** | Skills, credentials, portfolio, career goals | Placement uses student profile for AI matching |
| **Student** → **Admin** | Appeals, enrollment status | Admin processes appeals, manages enrollment |
| **Faculty** → **Student** | Interventions (indirectly), grades | Faculty creates interventions; grades flow through LMS |
| **Faculty** → **Admin** | Course data, research output | Admin sees aggregated faculty/course metrics |
| **Admin** → **Student** | Credentials, risk alerts, compliance status | Admin issues credentials visible in student wallet |
| **Admin** → **Faculty** | User access, role permissions | Admin controls faculty system access |
| **Admin** → **Ministry** | Institutional KPIs, compliance data | Ministry aggregates data across institutions |
| **Placement** → **Student** | Job matches, application status updates | Student sees matched jobs and application pipeline |
| **Placement** → **Admin** | Placement rates, employer data | Admin sees placement metrics in reports |
| **Research** → **Faculty** | Publications, grants, h-index | Faculty research overview pulls same data |
| **Ministry** → **Admin** | Compliance mandates, policy changes | Admin implements policies set by ministry |

---

## 2. Student Portal — Internal Flows

### 2.1 Student Portal Menu Interconnection Map

```
                              ┌──────────────┐
                              │  DASHBOARD   │
                              │              │
                              │ GPA, Credits │
                              │ Risk Alerts  │
                              │ Deadlines    │
                              │ Quick Actions│
                              └──────┬───────┘
                                     │
           ┌─────────────┬───────────┼────────────┬──────────────┐
           │             │           │            │              │
           ▼             ▼           ▼            ▼              ▼
    ┌──────────┐  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
    │ACADEMICS │  │  SKILLS  │ │ GUIDED   │ │PLACEMENT │ │  RECOM-  │
    │          │  │          │ │LEARNING  │ │ & JOBS   │ │MENDATIONS│
    │ Courses  │  │ Radar    │ │          │ │          │ │          │
    │Transcript│  │ Gaps     │ │ Paths    │ │ Jobs     │ │ Approve  │
    │ Grades   │  │ Evolution│ │ Sessions │ │ Apps     │ │ Dismiss  │
    │          │  │ Add Skill│ │ Quizzes  │ │Portfolio │ │ Follow-up│
    └────┬─────┘  └────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
         │             │            │             │             │
         │             │     ┌──────┘             │             │
         │             │     │                    │             │
         │             ▼     ▼                    │             │
         │      ┌─────────────────┐               │             │
         │      │  SKILL GAPS     │               │             │
         │      │  bridge these   │               │             │
         │      │  two systems    │               │             │
         │      └─────────────────┘               │             │
         │                                        │             │
         ▼                                        ▼             │
    ┌──────────┐                           ┌──────────┐         │
    │ APPEALS  │                           │CREDENTIAL│         │
    │          │                           │  WALLET  │         │
    │ New      │                           │          │         │
    │ Track    │                           │ Share    │         │
    │ Respond  │                           │ Verify   │         │
    │ Escalate │                           │ Download │         │
    └──────────┘                           └──────────┘         │
         │                                      │               │
         └──────────────┬───────────────────────┘               │
                        │                                       │
                        ▼                                       ▼
                 ┌──────────────┐                        ┌──────────┐
                 │   SETTINGS   │                        │NOTIF.    │
                 │              │                        │CENTER    │
                 │ Profile      │                        │          │
                 │ Notifications│◄───────────────────────│ Bell icon│
                 │ Security     │                        │ Dropdown │
                 └──────────────┘                        └──────────┘
```

### 2.2 Student Flow: Academic Journey

This flow shows how a student moves through the academic system.

```
Step 1: Student logs in
    │
    ▼
Step 2: DASHBOARD loads
    │  Shows: GPA, credits, risk level, deadlines, activity
    │  Quick Actions: Continue Learning, Browse Jobs, New Appeal, Recommendations
    │
    ├──► "View Academics" ──────────────────────────────────────────────┐
    │                                                                    │
    │    ACADEMICS page loads                                            │
    │    │  Shows: Summary (GPA, credits), Current Courses, Transcript   │
    │    │                                                               │
    │    ├──► Click Course Card                                          │
    │    │    │                                                          │
    │    │    ▼                                                          │
    │    │    COURSE DETAIL loads                                        │
    │    │    │  Shows: Overview (grade %, attendance), Assignments tab   │
    │    │    │                                                          │
    │    │    ├──► "Open in LMS" ──► External Canvas/Moodle page         │
    │    │    │                                                          │
    │    │    ├──► "Appeal" on graded assignment                         │
    │    │    │    │                                                     │
    │    │    │    ▼                                                     │
    │    │    │    NEW APPEAL form (pre-filled with courseId+assessmentId)│
    │    │    │    │  Student writes reason, uploads docs                │
    │    │    │    │  Submits → Redirected to Appeals list               │
    │    │    │    │                                                     │
    │    │    │    ▼                                                     │
    │    │    │    APPEAL DETAIL                                         │
    │    │    │    │  Status: pending → under_review → resolved/rejected │
    │    │    │    │  If info_requested → Student responds               │
    │    │    │    │  If rejected → Escalate to Dept Head or Ombudsman   │
    │    │    │    │  If resolved → Grade updated, transcript reflects   │
    │    │    │    │                                                     │
    │    │    │    └──► BACK TO ACADEMICS (updated grade visible)        │
    │    │    │                                                          │
    │    │    └──► "Download Unofficial Transcript" ──► PDF via print    │
    │    │                                                               │
    │    └──► Attendance tab shows: Gauge + session history              │
    │         Help text: "Contact instructor if incorrect"               │
    │                                                                    │
    └────────────────────────────────────────────────────────────────────┘
```

### 2.3 Student Flow: Skill Development → Career

This flow shows the critical path from identifying skill gaps to getting placed.

```
SKILLS PAGE
    │  Shows: Radar chart, All Skills table, Skill Gaps
    │
    ├──► Skill Gap identified: "System Design — 35% (need 80%)"
    │    │  Shows: "Required for: Software Engineer roles (47 job postings)"
    │    │
    │    ▼
    │    Click "Start Learning Path: System Design Fundamentals"
    │    │
    │    ▼
    │    LEARNING PATH page loads (filtered: ?skill=System Design)
    │    │  Shows filter banner: "Showing paths for: System Design"
    │    │  System Design path auto-expanded
    │    │
    │    ├──► Click "Start Path" (max 3 active enforced)
    │    │    │
    │    │    ▼
    │    │    Modules unlock sequentially
    │    │    │
    │    │    ├──► Start Module → SESSION page loads
    │    │    │    │  Read content sections → Mark complete
    │    │    │    │  Take quiz → Pass/Fail
    │    │    │    │  If Pass → "Continue to Next Module"
    │    │    │    │  If Fail → "Retake Quiz (Attempt 2 of 3)"
    │    │    │    │
    │    │    │    ▼
    │    │    │    Complete all modules → Path status: "completed"
    │    │    │    │
    │    │    │    ▼
    │    │    │    SKILL SCORE UPDATES
    │    │    │    System Design: 35% → 62%
    │    │    │    Skill Evolution chart shows event marker
    │    │    │
    │    │    └──► Back to SKILLS page → Updated scores visible
    │    │
    │    ▼
    │    CAREER READINESS improves
    │    │  Placement hub: Career Readiness Score goes up
    │    │  Job match scores increase (more skills matched)
    │    │
    │    ▼
    │    JOBS page
    │    │  Higher match scores on System Design jobs
    │    │  Gap skills reduced
    │    │
    │    ├──► Click "Apply" → Pre-apply modal
    │    │    │  Shows: Matched skills, gap skills, optional note
    │    │    │  "Confirm Apply" → Application created
    │    │    │
    │    │    ▼
    │    │    MY APPLICATIONS
    │    │    │  Status: Applied → Interviewed → Offered → Placed
    │    │    │
    │    │    ├──► If Offered → "Accept Offer" / "Decline Offer"
    │    │    ├──► If Applied → "Withdraw Application" available
    │    │    └──► If Rejected → "Browse similar jobs" link
    │    │
    │    ▼
    │    CREDENTIAL earned after placement
    │    │  Appears in Credentials wallet
    │    │  Can share to LinkedIn, copy verification link
    │    │
    │    ▼
    │    AI RECOMMENDATIONS updated
    │    │  New recommendations based on achieved career goal
    │    │  Student approves → Follow-up CTA shown
    │    └──► Cycle continues
```

### 2.4 Student Flow: Risk Alert Lifecycle

```
AI SYSTEM detects risk
    │  Dropout Prevention Loop evaluates:
    │  - GPA trend (below 2.0 or dropping >0.5)
    │  - Attendance (below 75%)
    │  - Assignment submission rate
    │
    ▼
RISK ALERT created in backend
    │
    ├──► STUDENT DASHBOARD shows alert
    │    │  Description: "Your attendance in CS 301 dropped to 68%"
    │    │  "Your academic advisor has been notified."
    │    │
    │    ├──► "View Attendance Details" → Course Detail attendance tab
    │    ├──► "Dismiss" → POST /dismiss → Alert removed permanently
    │    └──► Student takes no action → Alert persists
    │
    ├──► FACULTY DASHBOARD shows same student as at-risk
    │    │  Faculty student list: risk level = high
    │    │  AI Briefing: "Students to Watch: [Student Name]"
    │    │
    │    ├──► Faculty clicks student name → Student Detail
    │    │    │  Risk alert visible with "Create Intervention" link
    │    │    │
    │    │    ▼
    │    │    Faculty creates intervention
    │    │    │  Type: Academic Support
    │    │    │  Goals: "Improve attendance to 80%"
    │    │    │
    │    │    ▼
    │    │    INTERVENTION lifecycle begins
    │    │    planned → active → (notes added) → completed
    │    │
    │    └──► Dashboard "Active Interventions" count updates live
    │
    └──► NOTIFICATION appears in student's bell icon
         "Attendance alert: Your attendance in CS 301 dropped below 80%"
```

### 2.5 Student Menu → Menu Navigation Map

Every connection between student menus:

| From | To | Trigger | What Carries Over |
|------|----|---------|-------------------|
| Dashboard → Academics | Click activity "Grade posted" | Links to academics page |
| Dashboard → Skills | Click radar chart or "View all skills" | Direct navigation |
| Dashboard → Guided Learning | Click "Continue Learning" quick action | Direct navigation |
| Dashboard → Jobs | Click "Browse Jobs" quick action | Direct navigation |
| Dashboard → Appeals New | Click "New Appeal" quick action | Direct navigation |
| Dashboard → Recommendations | Click "View Recommendations" quick action | Direct navigation |
| Dashboard → Credentials | Click activity "Credential issued" | Direct navigation |
| Dashboard → Applications | Click activity "Application status" | Direct navigation |
| Academics → Course Detail | Click course card | courseId passed in URL |
| Course Detail → Appeals New | Click "Appeal" on assignment | courseId + assessmentId as query params |
| Course Detail → LMS | Click "Open in LMS" | External link to Canvas/Moodle |
| Skills → Guided Learning | Click "Start Learning Path" on gap | ?skill={skillName} query param |
| Skills → Skill Evolution | Click "View Evolution" button | Direct navigation |
| Guided Learning → Learning Path | Click "View All Paths" | Direct navigation |
| Learning Path → Session | Click "Start Module" | sessionId in query param |
| Session → Learning Path | Quiz pass: "Continue to Next Module" | Returns to path list |
| Placement Hub → Jobs | Click "Browse Jobs" card | Direct navigation |
| Placement Hub → Applications | Click "My Applications" card | Direct navigation |
| Placement Hub → Portfolio | Click "Portfolio" card | Direct navigation |
| Jobs → Guided Learning | Click gap skill badge | ?skill={skill} query param |
| Applications → Jobs | Rejected: "Browse similar jobs" link | Direct navigation |
| Recommendations → Guided Learning | Approve skill rec: "Start Learning Path" | followUpUrl navigation |
| Recommendations → Jobs | Approve job rec: "View Job Listing" | followUpUrl navigation |
| Recommendations → Academics | Approve course rec: "View Course Details" | followUpUrl navigation |
| Appeals → Appeal Detail | Click table row | appealId in URL |
| Appeal Detail → Appeals | "Back to Appeals" | Direct navigation |
| Credentials → Credential Detail | Click card | credentialId in URL |
| Credential Detail → LinkedIn | "Add to LinkedIn" | External URL with pre-filled data |
| Settings → Dashboard | Notification "View all on dashboard" | Direct navigation |

---

## 3. Faculty Portal — Internal Flows

### 3.1 Faculty Portal Menu Interconnection Map

```
                              ┌──────────────┐
                              │  DASHBOARD   │
                              │              │
                              │ KPIs (live)  │
                              │ Classes      │
                              │ Grant Alerts │
                              │ Trend Chart  │
                              └──────┬───────┘
                                     │
              ┌──────────────────────┼──────────────────────┐
              │                      │                      │
              ▼                      ▼                      ▼
       ┌──────────┐          ┌──────────────┐       ┌──────────────┐
       │   MY     │          │     AI       │       │   COURSES    │
       │STUDENTS  │          │  BRIEFINGS   │       │              │
       │          │          │              │       │  Course List  │
       │ List     │          │ Per-course   │       │  Course Detail│
       │ Detail   │◄────────►│ Students     │◄─────►│  Students tab│
       │ Risk     │          │ Topics       │       │  Assignments │
       │          │          │ Actions      │       │  Engagement  │
       └────┬─────┘          └──────────────┘       └──────────────┘
            │                                              │
            │           ┌──────────────────────────────────┘
            │           │
            ▼           ▼
     ┌──────────────────────┐
     │    INTERVENTIONS     │
     │                      │
     │  List (filterable)   │
     │  Create (from student│
     │    or standalone)    │
     │  Detail:             │
     │   - Activate         │
     │   - Add notes        │
     │   - Edit/delete notes│
     │   - Complete/Abandon │
     │   - Reopen           │
     │   - View Student     │
     └──────────────────────┘

       ┌──────────────────────────────────────┐
       │           RESEARCH                    │
       │                                       │
       │  Overview ─── KPIs, Recent Pubs       │
       │     │                                 │
       │     ├──► Grant Radar ── Status Flow   │
       │     │    Discovered → Interested →    │
       │     │    Drafting → Submitted →       │
       │     │    Funded / Rejected            │
       │     │                                 │
       │     ├──► Collaborations ── Email      │
       │     │                                 │
       │     └──► Publications ── DOI links    │
       └──────────────────────────────────────┘
```

### 3.2 Faculty Flow: Student Risk → Intervention → Resolution

```
STEP 1: AI BRIEFING (before class)
    │  Faculty opens briefing for CS 301
    │  Sees: "Students to Watch: Brenden Stokes — Missed 2 classes, GPA trending down"
    │
    ├──► Clicks student name "Brenden Stokes"
    │
    ▼
STEP 2: STUDENT DETAIL page
    │  Header: "Brenden Stokes — High Risk — GPA 1.59"
    │  "Student in: CS 201, CS 401"
    │  Risk Alerts: "Low attendance in multiple courses"
    │
    ├──► Clicks "Create Intervention" on risk alert
    │
    ▼
STEP 3: NEW INTERVENTION form (pre-filled with studentId)
    │  Type: Academic Support
    │  Description: "Weekly check-ins to improve attendance and quiz scores"
    │  Goals: ["Attend all classes for 2 weeks", "Score 70%+ on next quiz"]
    │  Start Date: Today
    │  Submits → Redirected to Interventions list
    │
    ▼
STEP 4: INTERVENTION DETAIL
    │  Status: Planned
    │
    ├──► Faculty clicks "Activate" → Status: Active
    │
    ├──► Faculty adds note: "Met with student. They committed to attending."
    │    (Can edit/delete this note later if needed)
    │
    ├──► 2 weeks later: Faculty adds note: "Attendance improved to 85%"
    │
    ├──► Faculty clicks "Mark Completed"
    │    Confirmation: "Are you sure? You can edit outcomes afterwards."
    │    Writes outcomes: "Student attendance improved from 62% to 85%"
    │
    ├──► Dashboard KPI "Active Interventions" count decreases by 1
    │
    └──► If student regresses later:
         Faculty clicks "Reopen" → Status back to Active
         Adds new notes, continues tracking
```

### 3.3 Faculty Flow: Grant Discovery → Funded

```
GRANT RADAR page
    │  Faculty sees 10 grants sorted by alignment score
    │  Grant: "NSF-2027: AI in Education — $850K — 92% match"
    │  Status: Discovered
    │
    ├──► Clicks "Mark Interested"
    │    Status changes to: Interested
    │
    ├──► Faculty researches requirements, starts drafting
    │    Clicks "Start Drafting"
    │    Status changes to: Drafting
    │
    ├──► Faculty submits proposal through external system
    │    Clicks "Mark Submitted"
    │    Status changes to: Submitted
    │
    ├──► Months later: Receives funding notification
    │    Clicks "Mark Funded"
    │    Status changes to: Funded (green badge, no more actions)
    │    Dashboard "Active Grants" count increases
    │
    └──► If rejected:
         Clicks "Mark Rejected"
         Card becomes muted/dimmed, no further actions
```

---

## 4. Admin Portal — Internal Flows

### 4.1 Admin Portal Menu Interconnection Map

```
                              ┌──────────────┐
                              │  DASHBOARD   │
                              │              │
                              │ Enrollment   │
                              │ Retention    │
                              │ Graduation   │
                              │ Compliance   │
                              │ Deviations──►├──────► COMPLIANCE
                              └──────┬───────┘
                                     │
     ┌───────────┬───────────┬───────┼───────┬────────────┬──────────┐
     │           │           │       │       │            │          │
     ▼           ▼           ▼       │       ▼            ▼          ▼
┌─────────┐┌─────────┐┌─────────┐   │  ┌─────────┐ ┌─────────┐┌────────┐
│ANALYTICS││ADMIS-   ││ USERS & │   │  │   AI    │ │CREDEN-  ││REPORTS │
│         ││SIONS    ││ ROLES   │   │  │GOVERN-  │ │TIALS    ││        │
│Dept     ││         ││         │   │  │ANCE     │ │         ││Template│
│Metrics  ││Dashboard││User List│   │  │         │ │Issue    ││Generate│
│KPIs     ││Apps ────┤│User Edit│   │  │Overview │ │Revoke   ││Download│
│Trends   ││Predict  ││Roles   │   │  │Models   │ │Track    ││        │
└─────────┘└─────────┘└────┬────┘   │  │Bias     │ └─────────┘└────────┘
                           │        │  └─────────┘
                           │        │
                           ▼        ▼
                    ┌──────────┐┌──────────┐
                    │INTEGRA-  ││ BUDGET   │
                    │TIONS     ││          │
                    │          ││Allocation│
                    │Health    ││Alerts    │
                    │Sync      ││Trends    │
                    │Direction ││          │
                    └──────────┘└──────────┘
                                     │
                                     ▼
                              ┌──────────────┐
                              │  SETTINGS    │
                              │              │
                              │ Institution  │
                              │ Visibility   │
                              │ Retention    │
                              │ Branding     │
                              └──────────────┘
```

### 4.2 Admin Flow: Admissions → Enrollment

```
ADMISSIONS DASHBOARD
    │  Pipeline: Submitted(240) → Under Review(156) → Interview(89) →
    │            Accepted(312) → Enrolled(287) → Rejected(143)
    │
    ├──► Click pipeline "Interview" segment
    │    │
    │    ▼
    │    APPLICATIONS page (filtered: ?status=interview)
    │    │  Shows 89 applicants currently in interview stage
    │    │
    │    ├──► Expand applicant card
    │    │    │  AI Assessment: Overall Fit 87%
    │    │    │  "Scores generated by Glimmora Admissions AI v2.1"
    │    │    │  Strengths: Strong academics, leadership experience
    │    │    │  Concerns: Limited technical background
    │    │    │
    │    │    ├──► "Accept" → Confirmation dialog
    │    │    │    "Application accepted. Acceptance notification will
    │    │    │     be sent to the applicant. Next step: Enrollment
    │    │    │     confirmation."
    │    │    │
    │    │    ├──► "Reject" → Reason required modal
    │    │    │    "Application rejected. The applicant will be
    │    │    │     notified with the provided reason."
    │    │    │
    │    │    ├──► "Schedule Interview" → Date/Time/Interviewer form
    │    │    │    "Interview scheduled. Calendar invite will be sent
    │    │    │     to {interviewer} and the applicant."
    │    │    │
    │    │    └──► "Add Review Note" → Type + Content
    │    │         Appears in timeline, attributed to reviewer
    │    │
    │    └──► Pagination through all 89 applicants
    │
    ├──► PREDICTIONS page
    │    │  Yield Rate: 78% (Historical: 74%)
    │    │  "Based on historical enrollment data from the past 5 years"
    │    │  Enrollment Forecast by Department
    │    │  Risk Factors: "Declining trend in STEM applications"
    │    │
    │    └──► AI Recommendations
    │         "Increase scholarship budget for underrepresented groups"
    │         Click "Implement" → "Assigned to relevant department for action."
    │
    └──► Dashboard KPIs update after decisions
```

### 4.3 Admin Flow: Compliance Deviation Resolution

```
DASHBOARD: "Recent Deviations" section
    │  Shows 3 recent unresolved deviations
    │  Each is a clickable link
    │
    ├──► Click deviation → COMPLIANCE page
    │
    ▼
COMPLIANCE page
    │  Overall Score: 92/100 — "(Meets standards)"
    │  Explanation: "Score reflects compliance across GDPR, FERPA,
    │                and institutional policies. Updated automatically."
    │
    ├──► Deviation: "Student data access log incomplete"
    │    Assigned to: John Smith
    │    Severity: Medium
    │
    │    ├──► Click "Resolve"
    │    │    Textarea: "Describe the corrective action taken..."
    │    │    Submits resolution
    │    │    Success: "Deviation resolved successfully."
    │    │    Link: "View in Audit Trail →" → /admin/compliance/audit-trail
    │    │
    │    ▼
    │    AUDIT TRAIL
    │    Entry: "Admin resolved compliance deviation — success"
    │    Details visible via hover tooltip
    │    Filterable by action, role, search term
    │
    └──► Compliance Score recalculates (92 → 94)
```

### 4.4 Admin Flow: User Lifecycle

```
USERS page
    │
    ├──► "Create User" button
    │    │  Dialog: Email, Name, Role, Department
    │    │  Submit → "User created. Activation email sent to {email}."
    │    │  User appears in list with status: Active
    │    │
    │    ▼
    │    USER DETAIL page
    │    │
    │    ├──► Change Role: Student → Faculty
    │    │    Confirmation: "You are about to change Alice's role from
    │    │    Student to Faculty. This will change their system access."
    │    │    Confirm → "Changes saved. Logged in Audit Trail."
    │    │
    │    ├──► Suspend User
    │    │    Warning: "Suspending will immediately revoke access."
    │    │    Status changes to: Suspended
    │    │
    │    └──► ROLES page
    │         Permission matrix: Module × Action grid
    │         Toggle "Delete" off for Faculty role
    │         Confirmation: "This affects all 47 users with Faculty role."
    │         Confirm → Permission immediately updated
    │
    └──► All changes logged in AUDIT TRAIL
```

---

## 5. Research Portal — Internal Flows

### 5.1 Research Portal Menu Interconnection Map

```
                         ┌──────────────┐
                         │  DASHBOARD   │
                         │              │
                         │ Pubs, h-index│
                         │ Grants, Cites│
                         │ Trending     │
                         │ Recent Pubs  │
                         └──────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
   │ PERFORMANCE  │     │    GRANTS    │      │   NETWORK    │
   │              │     │              │      │              │
   │ Output/Year  │     │ Discovery    │      │ Collabs      │
   │ Impact/Type  │     │ My Grants    │      │  (Grid+Graph)│
   │ Projection   │     │              │      │ Publications │
   │ Peer Compare │     │ Discovery:   │      │ Topic Trends │
   └──────────────┘     │  Browse      │      └──────────────┘
                        │  Expand      │
                        │              │
                        │ My Grants:   │
                        │  Draft       │
                        │  Submit      │
                        │  Track       │
                        └──────────────┘
```

### 5.2 Research Flow: Grant Discovery → Proposal → Funding

```
GRANT DISCOVERY
    │  Researcher browses grants filtered by status
    │  Sees: "EU Horizon — AI Ethics — $2.1M — 89% alignment"
    │  Expands: Requirements, eligibility, match explanation
    │
    ├──► Researcher decides this is relevant
    │
    ▼
MY GRANTS
    │  Researcher creates proposal draft (linked to discovered grant)
    │  Status: Drafting
    │
    ├──► Writes proposal, iterates
    │    Click "Submit Proposal" → Confirmation dialog
    │    Status: Submitted
    │
    ├──► Funding body reviews (external process)
    │    Status: Under Review
    │
    ├──► Decision received
    │    If funded: Status → Funded, amount highlighted
    │    If rejected: Status → Rejected, feedback displayed
    │
    └──► DASHBOARD & PERFORMANCE update
         Active Grants count, Total Funding, Publication projections
```

---

## 6. Placement Portal — Internal Flows

### 6.1 Placement Portal Menu Interconnection Map

```
                         ┌──────────────┐
                         │  DASHBOARD   │
                         │              │
                         │ Placement %  │
                         │ Pipeline     │
                         │ Top Employers│
                         │ Drives       │
                         └──────┬───────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌──────────────┐     ┌──────────────┐      ┌──────────────┐
   │   STUDENTS   │     │  EMPLOYERS   │      │   MATCHING   │
   │              │     │              │      │   ENGINE     │
   │ Employability│     │ Directory    │      │              │
   │ Skills/Gaps  │     │ Add New      │      │ Run Algorithm│
   │ Risk Level   │     │ Job Postings │      │ Approve Match│
   └──────┬───────┘     │ Engagement   │      │ Reject Match │
          │             │ Hire History │      └──────┬───────┘
          │             └──────────────┘             │
          │                                          │
          └──────────────┬───────────────────────────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   PIPELINE   │
                  │              │
                  │ matched →    │
                  │ applied →    │
                  │ interviewed→ │
                  │ offered →    │
                  │ placed       │
                  │ (or rejected)│
                  └──────┬───────┘
                         │
                         ▼
                  ┌──────────────┐
                  │   REPORTS    │
                  │              │
                  │ Rates        │
                  │ Equity       │
                  │ Time-to-Place│
                  │ Skills D/S   │
                  │ Cohort       │
                  └──────────────┘
```

### 6.2 Placement Flow: Matching → Pipeline → Placement

```
STEP 1: MATCHING ENGINE
    │  Placement officer configures:
    │  - Department: Computer Science
    │  - Min GPA: 3.0
    │  - Min Employability: 60
    │  - Max Results: 50
    │
    │  Clicks "Run Matching"
    │  AI produces 50 student-job matches with scores
    │
    ├──► Officer reviews each match
    │    │  Student: Alice (87% match) → Software Intern at Google
    │    │  Matched Skills: Python, React, SQL
    │    │  Gap Skills: Docker
    │    │
    │    ├──► "Approve" → Match moves to Pipeline as "matched"
    │    └──► "Reject" → Match discarded
    │
    ▼
STEP 2: PIPELINE
    │  Alice's pipeline item: Status = matched
    │
    │  ├──► Officer: "Move to Applied" (student submits application)
    │  │    Status: applied
    │  │
    │  ├──► Employer interviews student
    │  │    Officer: "Move to Interviewed"
    │  │    Status: interviewed
    │  │
    │  ├──► Employer extends offer
    │  │    Officer: "Move to Offered"
    │  │    Status: offered
    │  │    
    │  │    STUDENT PORTAL: Alice sees "Offered" with Accept/Decline buttons
    │  │    Alice clicks "Accept Offer"
    │  │
    │  ├──► Officer: "Move to Placed"
    │  │    Status: placed
    │  │    Placement confirmed!
    │  │
    │  └──► At any stage: "Reject" available
    │       Status: rejected
    │       Student sees: "Browse similar jobs" link
    │
    ▼
STEP 3: REPORTS
    │  Placement Rate by Department updates
    │  Equity Metrics recalculated
    │  Time-to-Placement averages updated
    │  Cohort Analysis reflects new placement
```

---

## 7. Ministry Portal — Internal Flows

### 7.1 Ministry Portal Menu Interconnection Map

```
                         ┌──────────────┐
                         │  DASHBOARD   │
                         │              │
                         │ Institutions │
                         │ Enrollment   │
                         │ Graduation   │
                         │ Compliance   │
                         │ Budget       │
                         └──────┬───────┘
                                │
     ┌──────────────┬───────────┼───────────┬──────────────┐
     │              │           │           │              │
     ▼              ▼           ▼           ▼              ▼
┌─────────┐  ┌──────────┐┌──────────┐┌──────────┐  ┌──────────┐
│INSTITU- │  │COMPLIANCE││ QUALITY  ││ BUDGET   │  │SIMULATION│
│TIONS    │  │          ││INDICATORS││INTELLI-  │  │          │
│         │  │National  ││          ││GENCE     │  │Run Sim   │
│Directory│  │Framework ││Faculty   ││          │  │View Proj │
│Detail pg│  │By-Instit ││Research  ││Allocation│  │AI Insight│
│Ranking  │  │Deviations││Placement ││Category  │  │          │
│         │  │Trends    ││Satisfact.││Projections│ │SCENARIOS │
│         │  │          ││Accredit. ││Yearly    │  │Compare   │
└─────────┘  └──────────┘└──────────┘└──────────┘  └──────────┘
                                                        │
                                                        ▼
                                                  ┌──────────┐
                                                  │ REPORTS  │
                                                  │          │
                                                  │National  │
                                                  │Regional  │
                                                  │Institut. │
                                                  │Compliance│
                                                  │Budget    │
                                                  └──────────┘
```

### 7.2 Ministry Flow: Policy Simulation → Decision

```
POLICY SIMULATION page
    │  Ministry official wants to test: "What if we increase STEM funding by 20%?"
    │
    ├──► "Run Simulation"
    │    │  Scenario Name: "STEM Funding Increase 2027"
    │    │  Type: Budget
    │    │  Time Horizon: 5 years
    │    │  Parameters: { "STEM Budget Increase": "20%", "Timeline": "2027-2032" }
    │    │
    │    │  Submits → Status: Running
    │    │
    │    ▼
    │    Simulation completes → Status: Completed
    │    │  Projections chart: Enrollment growth curve with confidence bands
    │    │  AI Insights:
    │    │    - "Expected 15% increase in STEM enrollment by 2029"
    │    │    - "Faculty hiring gap: need 45 additional STEM faculty"
    │    │    - "ROI positive by year 3 of implementation"
    │
    ├──► Official runs a second simulation:
    │    "What if we increase scholarships instead?"
    │    Same process → Second completed simulation
    │
    ▼
SCENARIO COMPARISON page
    │  Official selects both simulations (checkboxes)
    │  Minimum 2 required
    │
    │  Side-by-side comparison:
    │  ┌────────────────────┬──────────────────────┐
    │  │ STEM Funding +20%  │ Scholarship Increase  │
    │  ├────────────────────┼──────────────────────┤
    │  │ Enrollment: +15%   │ Enrollment: +8%       │
    │  │ Faculty Gap: 45    │ Faculty Gap: 12       │
    │  │ ROI: Year 3        │ ROI: Year 2           │
    │  │ Confidence: 82%    │ Confidence: 91%       │
    │  └────────────────────┴──────────────────────┘
    │
    ├──► Decision: Scholarship approach has higher confidence, faster ROI
    │
    ▼
REPORTS page
    │  Generate: "STEM Strategy Assessment 2027"
    │  Type: National
    │  Parameters: { "Focus": "STEM", "Year": "2027" }
    │  Report generated → Download PDF for cabinet presentation
```

---

## 8. Cross-Portal Interaction Flows

### 8.1 Credential Lifecycle (Admin → Student → Employer)

```
ADMIN PORTAL                    STUDENT PORTAL              EXTERNAL
─────────────                   ──────────────              ────────
                                                           
Admin issues credential ──────► Credential appears ────────► Employer
  │  "Python Proficiency"        in digital wallet           verifies via
  │  Type: Badge                 │                           verification
  │  Student: Alex Rivera        ├──► Share to LinkedIn      URL/API
  │                              │    (pre-filled form)      │
  │  Feedback: "Student          │                           │
  │  notified. Appears in        ├──► Copy verification      │
  │  their digital wallet."      │    link                   │
  │                              │                           ▼
  ├──► Audit Trail logged        └──► Download PDF        Employer sees:
  │                                   certificate          "Verified ✓
  │                                                        Issued by:
  │  Later: Admin revokes                                  State Tech Univ"
  │  Reason: "Academic misconduct"
  │  Student notified
  │  Employer API updated
  │  Verification returns: "Revoked"
```

### 8.2 Grade Appeal Lifecycle (Student → Faculty/Admin → Student)

```
STUDENT PORTAL                  ADMIN/FACULTY SIDE         STUDENT PORTAL
──────────────                  ──────────────────         ──────────────

Student views course detail
  │  Assignment: Midterm (62/100)
  │
  ├──► Clicks "Appeal" button
  │    (pre-fills courseId + assessmentId)
  │
  ├──► NEW APPEAL form
  │    Reason: "Questions 8 & 12 graded incorrectly"
  │    Uploads: evidence.pdf
  │    Submits
  │                              
  │    Status: PENDING ──────────► Faculty/Admin reviews
  │                                │
  │    Status: UNDER_REVIEW ◄──── "Assigned to reviewer"
  │                                │
  │    ┌── Option A ───────────────┤
  │    │   Status: INFO_REQUESTED  │  Reviewer needs more info
  │    │                           │
  │    │   Student sees question ◄─┘
  │    │   Student responds
  │    │   Status back to UNDER_REVIEW
  │    │                              
  │    ├── Option B ───────────────── Reviewer approves
  │    │   Status: RESOLVED           Score: 62 → 77
  │    │   Green banner:              Transcript updated
  │    │   "Grade updated from        GPA recalculated
  │    │    62 to 77"
  │    │
  │    └── Option C ───────────────── Reviewer rejects
  │        Status: REJECTED           Reason provided
  │        │
  │        ├──► "Escalate to Dept Head"
  │        │    Status: ESCALATED
  │        │    Second-level review begins
  │        │
  │        └──► "Contact Ombudsman"
  │             External: ombudsman@university.edu
```

### 8.3 Placement Matching (Placement → Student → Employer)

```
PLACEMENT PORTAL           STUDENT PORTAL           EMPLOYER SIDE
────────────────           ──────────────           ─────────────

Matching Engine runs
  │  Student: Alex Rivera
  │  Job: SWE Intern at Google
  │  Match: 87%
  │
  ├──► Officer approves match
  │    Pipeline item created ───► Student sees job in
  │    Stage: Matched              "/student/placement/jobs"
  │                                Match score: 87%
  │                                │
  │                                ├──► Student clicks "Apply"
  │                                │    Pre-apply modal:
  │                                │    Matched skills, gap skills
  │                                │    Optional note
  │                                │    "Confirm Apply"
  │                                │
  │    Officer sees application ◄──┘
  │    Stage: Applied
  │    │
  │    ├──► Schedules interview ───► Calendar invite sent
  │    │    Stage: Interviewed        to student & employer
  │    │
  │    ├──► Employer extends offer ──► Student sees "Offered"
  │    │    Stage: Offered             │
  │    │                               ├──► "Accept Offer"
  │    │                               │    Stage: Placed
  │    │    Officer confirms ◄─────────┘    Placement confirmed!
  │    │    │
  │    │    └──► Reports page:
  │    │         Placement rate updates
  │    │         Equity metrics recalculated
  │    │
  │    └──► If rejected at any stage:
  │         Student sees: "Browse similar jobs"
  │         Pipeline item: Status = Rejected
```

---

## 9. AI Agent Orchestration Flows

### 9.1 Student Development Agent

```
INPUTS                          AGENT PROCESSING              OUTPUTS
──────                          ─────────────────             ───────

Course Grades ─────┐
                   │
Attendance Data ───┤
                   ├───► Student Development    ┌──► Skill Scores
Credential         │     Agent                  │    (Skills page)
Achievements ──────┤                            │
                   │     Evaluates:             ├──► Risk Alerts
Tutor Session      │     - GPA trends           │    (Dashboard)
Completions ───────┤     - Skill gaps           │
                   │     - Career alignment      ├──► Recommendations
Career Goals ──────┘     - Learning progress     │    (Recommendations page)
                                                │
                                                ├──► Career Readiness Score
                                                │    (Placement hub)
                                                │
                                                └──► Weekly Goal Suggestions
                                                     (Guided Learning)
```

### 9.2 Dropout Prevention Loop

```
┌──────────────────────────────────────────────────────────────────┐
│                    DROPOUT PREVENTION LOOP                        │
│                                                                  │
│  ┌─────────┐    ┌─────────────┐    ┌──────────────┐             │
│  │  DETECT  │───►│  INTERVENE  │───►│   MONITOR    │             │
│  │          │    │             │    │              │             │
│  │ GPA drop │    │ Generate    │    │ Track student│             │
│  │ Attend↓  │    │ risk alert  │    │ progress     │             │
│  │ Missed   │    │ Notify      │    │ Check if     │──┐          │
│  │ work     │    │ faculty     │    │ improving    │  │          │
│  └─────────┘    │ Suggest     │    └──────────────┘  │          │
│       ▲         │ intervention│           │          │          │
│       │         └─────────────┘           │          │          │
│       │                                   ▼          │          │
│       │              ┌──────────────────────┐        │          │
│       │              │      FEEDBACK        │        │          │
│       └──────────────│                      │◄───────┘          │
│                      │ Did intervention     │                   │
│                      │ work? Update model.  │                   │
│                      │ Adjust thresholds.   │                   │
│                      └──────────────────────┘                   │
│                                                                  │
│  PORTAL TOUCHPOINTS:                                             │
│  Student Dashboard ← Risk Alerts, Notifications                  │
│  Faculty Dashboard ← At-Risk Count, Briefing "Students to Watch" │
│  Faculty Interventions ← Suggested intervention actions          │
│  Admin Dashboard ← Aggregated at-risk trends                     │
│  Ministry Dashboard ← National retention metrics                 │
└──────────────────────────────────────────────────────────────────┘
```

### 9.3 Placement Intelligence Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                PLACEMENT INTELLIGENCE FLOW                        │
│                                                                  │
│  Student Skills ──┐                                              │
│  Student GPA ─────┤                                              │
│  Portfolio ───────┼───► Placement Intelligence    ┌──► Job Match │
│  Credentials ─────┤     Agent                     │    Scores    │
│  Work Experience──┘                               │              │
│                         Matches student profile   ├──► Career    │
│  Job Requirements ──┐   against job requirements  │    Readiness │
│  Employer Prefs ────┤                             │    Score     │
│  Salary Data ───────┘                             │              │
│                                                   ├──► Gap Skill │
│                                                   │    Analysis  │
│                                                   │              │
│  PORTAL TOUCHPOINTS:                              └──► Recommend │
│  Student Jobs ← Match scores + explanations            Jobs     │
│  Student Placement ← Career Readiness Score                      │
│  Student Skills ← Gap "requiredBy" context                       │
│  Placement Matching ← Batch matching results                     │
│  Placement Reports ← Aggregate placement metrics                 │
└──────────────────────────────────────────────────────────────────┘
```

---

## 10. Data Lifecycle Flows

### 10.1 Student Data Lifecycle

```
ENROLLMENT                    ACADEMIC LIFE                  GRADUATION
──────────                    ─────────────                  ──────────

Admitted ──► Enrolled         Courses ──► Grades             Credential
  │           │                 │           │                 Issued
  │           │                 │           ├──► GPA          │
  │           ├──► Profile      │           │    Calculation  ├──► Verify
  │           │    Created      │           │                 │    Hash
  │           │                 ├──► Attend │                 │
  │           ├──► Skills       │    ance   ├──► Skill       ├──► Share
  │           │    Baseline     │    Track  │    Scoring      │    LinkedIn
  │           │                 │           │                 │
  │           ├──► Risk         │           ├──► Risk        └──► Alumni
  │           │    Assessment   │           │    Updates          Tracking
  │           │    Begins       │           │
  │           │                 ├──► Inter  ├──► Career
  │           └──► Placement    │    vent   │    Readiness
  │                Matching     │    ions   │
  │                Begins       │           ├──► Job
  │                             │           │    Matching
  │                             └──► Learn  │
  │                                  ing    └──► Appeals
  │                                  Paths      (if needed)
  │
  └──► All actions logged in Audit Trail
       All AI decisions have explainability
       All data subject to retention policies
```

### 10.2 Complete Portal Data Dependencies

```
DATA SOURCE              CONSUMED BY                    DISPLAY LOCATION
───────────              ───────────                    ────────────────

LMS Grades ────────────► Student Academics              Course cards, transcript
                    ├──► Student Dashboard              GPA KPI
                    ├──► Faculty Course Detail           Grade distribution
                    ├──► Faculty Student Detail          Performance tab
                    ├──► Skill Score Calculation         Skills page
                    └──► Admin Analytics                 Department metrics

LMS Attendance ────────► Student Course Detail           Attendance gauge
                    ├──► Faculty Student Detail          Attendance history
                    ├──► Faculty Briefing               Students to Watch
                    ├──► Risk Assessment                Risk alerts
                    └──► Admin Analytics                Retention metrics

Skill Scores ──────────► Student Skills Page             Radar, table, gaps
                    ├──► Student Dashboard              Radar preview
                    ├──► Career Readiness               Readiness score
                    ├──► Job Matching                   Match scores
                    ├──► AI Recommendations             Skill suggestions
                    └──► Placement Student View         Employability score

Interventions ─────────► Faculty Intervention List       Full CRUD
                    ├──► Faculty Student Detail          Interventions tab
                    ├──► Faculty Dashboard              Active count (live)
                    └──► Faculty Briefing               Action items context

Credentials ───────────► Student Credential Wallet       List, detail, share
                    ├──► Admin Credential Mgmt          Issue, revoke
                    ├──► Career Readiness               Score component
                    └──► Employer Verification API      External validation

Job Postings ──────────► Student Jobs Page               Match scores, apply
                    ├──► Placement Employer Detail       Job list
                    ├──► Placement Matching              Algorithm input
                    └──► Student Recommendations        Job suggestions

Applications ──────────► Student Applications            Pipeline tracking
                    ├──► Placement Pipeline              Stage management
                    ├──► Placement Dashboard             Pipeline summary
                    └──► Placement Reports               Rate calculations

Research Data ─────────► Faculty Research Overview       KPIs, recent pubs
                    ├──► Faculty Grant Radar             Grant workflow
                    ├──► Research Dashboard              Full metrics
                    ├──► Research Performance            Projections
                    └──► Admin Reports                  Aggregated output

Compliance Data ───────► Admin Compliance                Scores, deviations
                    ├──► Admin Dashboard                Score + context
                    ├──► Admin Audit Trail              Resolution logs
                    ├──► Ministry Compliance            National view
                    └──► Ministry Dashboard             Compliance badge

Budget Data ───────────► Admin Budget                    Allocations, alerts
                    ├──► Admin Dashboard                Utilization
                    ├──► Ministry Budget                National view
                    └──► Ministry Simulation            Projection input
```

---

*End of Flow Document*

**This document maps every user journey, data flow, and portal interconnection across the entire Glimmora Education Intelligence Platform.**
