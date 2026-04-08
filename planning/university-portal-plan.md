# Glimmora University Portal — Detailed Build Plan

## Platform Summary

Glimmora is a multi-tenant, AI-native education intelligence platform. For the university context, it delivers **6 role-based portals** — each a distinct experience tailored to what that persona needs to do, see, and decide.

This document maps every SOW requirement to the portal it belongs to, defines what each role does in the system, and sequences the build.

---

## Portal 1: Student Portal

**Who:** Undergraduate, postgraduate, PhD students, and research scholars
**Core purpose:** Unified view of academic progress, skill development, AI-powered recommendations, and career readiness

### What the student sees and does:

#### Academic Progress & Performance
- **Unified transcript view** — Grades, credits, GPA pulled from LMS/SIS integration (SOW §7: Canvas, Moodle)
- **Course history & current enrollments** — Synced from SIS
- **Attendance records** — Pulled from institutional systems
- **Assessment results & feedback** — From LMS integration

#### AI-Powered Skill & Career Intelligence
- **Skill Radar** — Visual map of current skills, gaps, and growth trajectory (SOW §3.1: Student Development Agent)
- **Skill Evolution Timeline** — How skills have developed over time (SOW §8: Time-Series DB)
- **Performance Risk Alerts** — Early warning if the student is at risk of falling behind (SOW §3.2: Dropout Prevention Loop)
- **Personalized Recommendations** — Course suggestions, skill-building resources, based on career goals
- **Career Readiness Score** — How employable is this student right now? (SOW §3.1: Placement Intelligence Agent)
- **Employer Match Suggestions** — Companies/roles that align with student's skill profile

#### Credentials & Verification
- **Digital Credential Wallet** — All earned credentials in one place (SOW §6: Global Credential Ledger)
- **Shareable Verification Links** — Blockchain-verified credential links to share with employers (SOW §6.1-6.2)
- **Transcript Verification Status** — Immutable verification status of official transcripts

#### Student Rights & Appeals
- **Score Appeal Workflow** — Formally challenge any AI-generated score or assessment (SOW §10.4)
- **AI Explainability** — Every AI recommendation shows WHY it was made (SOW §3.3, §9.1)
- **Data Access & Portability** — View/export personal data per GDPR/DPDP (SOW §9)

#### Placement & Career Services
- **Job/internship listings** — Matched by AI to student profile (SOW §3.1: Placement Intelligence Agent)
- **Application tracking** — Status of applications through placement office
- **Interview prep suggestions** — Based on target roles and skill gaps
- **Evidence portfolio** — Curated work samples, projects, certifications

---

## Portal 2: Faculty Portal

**Who:** Professors, lecturers, associate professors, adjunct faculty
**Core purpose:** Student oversight, research tools, grant discovery, and teaching efficiency

### What the faculty member sees and does:

#### Student Oversight
- **My Students Dashboard** — All students across courses, sortable by risk level
- **At-Risk Student Alerts** — AI-flagged students who need intervention (SOW §3.2: Dropout Prevention Loop)
- **Student Performance Trends** — Aggregated class performance, individual trajectories
- **Intervention History** — What actions were taken for at-risk students, outcomes tracked
- **Skill Gap Analysis** — Where are students falling behind relative to course objectives?

#### Research & Grant Intelligence
- **Grant Radar** — Funding opportunities aligned with faculty's research profile (SOW §5.4: Funding Body Alignment)
- **Proposal Success Predictor** — "This proposal has X% chance of funding" (SOW §5.5)
- **Collaboration Discovery** — Find potential co-researchers by topic/expertise (SOW §5.3: Collaboration Network, Neo4j)
- **Topic Momentum Tracker** — Which research areas are trending up/down in funding (SOW §5.2)
- **Publication Tracker** — Faculty's publication history, citation metrics (SOW §5: Research Platforms integration)
- **Research Performance Dashboard** — Personal research KPIs (SOW §5.6)

#### Teaching Tools
- **Course Analytics** — Engagement, completion rates, grade distributions from LMS
- **AI-Generated Briefings** — Before-class summaries: who's struggling, what topics need reinforcement
- **Outcome Mapping** — How course outcomes map to institutional learning goals

#### AI Transparency
- **Explainability for Every AI Output** — Why was this student flagged? Why this grant? (SOW §9.1)
- **Override Controls** — Faculty can dismiss or override AI recommendations (SOW §10.5)
- **Feedback Loop** — Mark AI suggestions as helpful/not helpful to improve models

---

## Portal 3: Admin Portal

**Who:** University administrators — Registrar, Provost, Dean, Department Heads, Compliance Officers, Finance Officers
**Core purpose:** Institutional health, compliance, resource management, and governance

### What the admin sees and does:

#### Institutional KPIs & Strategy
- **Institutional Health Dashboard** — Enrollment, retention, graduation rates, faculty ratios (SOW §3.1: Institutional Strategy Agent)
- **KPI Trend Analysis** — Multi-year performance trends with projections
- **Departmental Comparison** — Performance across departments/schools
- **Accreditation Readiness Score** — How prepared is the institution for next accreditation cycle?

#### Compliance & Governance
- **Compliance Pulse Dashboard** — Real-time regulatory compliance status (SOW §3.1: Compliance Agent)
- **Deviation Alerts** — Automatic notifications when compliance metrics fall out of range (SOW §3.2: Compliance Monitoring Loop)
- **Audit Trail** — Complete, tamper-resistant log of all system actions (SOW §9.1: Independent Audit Logging)
- **GDPR/FERPA/DPDP Controls** — Consent management, data access requests, erasure requests (SOW §9)
- **Compliance Reports** — Auto-generated reports for regulatory bodies

#### Budget & Resources
- **Budget Overview** — Current financial status, synced from Finance ERP (SOW §7)
- **Resource Allocation Dashboard** — Faculty, facilities, budget by department (SOW §3.1: Budget & Resource Agent)
- **Financial Alerts** — Spending anomalies, budget overruns

#### User & Access Management
- **RBAC Administration** — Role assignments, permission management
- **SSO Configuration** — SAML/OAuth2 identity provider management (SOW §7.8)
- **Tenant Configuration** — Institution-level settings, visibility controls (SOW §10.1)
- **Encryption Key Management** — Institution-level encryption keys (SOW §10.2)

#### Integration Management
- **Integration Status Dashboard** — Health of all connected systems (SIS, LMS, ERP, etc.)
- **Data Sync Logs** — When was data last synced? Any failures?
- **Webhook Configuration** — Manage outbound event notifications (SOW §7.9-7.10)

#### AI Governance
- **Model Registry View** — What AI models are running, versions, performance (SOW §9.1)
- **Bias Monitoring Reports** — Fairness metrics across demographics (SOW §9.1)
- **Administrative Override Controls** — Override any AI decision with audit trail (SOW §10.5)
- **Model Performance Reports** — Are models performing as expected?

---

## Portal 4: Research Portal

**Who:** Research scholars, PhD supervisors, Research Directors, Research Office staff
**Core purpose:** Maximize research output, funding, and collaboration

### What the researcher sees and does:

#### Grant & Funding Intelligence
- **Grant Discovery Engine** — Find grants aligned with research profile (SOW §5.4)
- **Historical Grant Database** — Past awards, amounts, success rates by topic (SOW §5.1)
- **Funding Body Profiles** — What each funder prioritizes, recent award patterns
- **Proposal Success Probability** — AI-predicted chance of success for draft proposals (SOW §5.5)
- **Grant Application Tracker** — Status of submitted proposals
- **Funding Trend Analytics** — Which topics are gaining/losing funding momentum (SOW §5.2)

#### Collaboration & Network
- **Collaborator Discovery** — Find researchers by expertise, publication overlap, institutional affiliation (SOW §5.3)
- **Collaboration Network Graph** — Visual map of who works with whom (Neo4j-powered) (SOW §8: Neo4j)
- **Co-authorship Opportunities** — AI-suggested collaboration matches
- **Cross-Institution Research Groups** — Find and join research clusters

#### Research Performance
- **Publication Dashboard** — Papers, citations, h-index, trajectory (SOW §5.6)
- **Research Output Analytics** — Productivity metrics, impact scores
- **Benchmark Comparison** — How does output compare to field averages?
- **Research Growth Projection** — AI-predicted publication/citation trajectory

#### Research Optimization Loop (SOW §3.2)
- **AI Recommendations** — "Consider submitting to X conference" / "Y funder aligns with your recent work"
- **Simulation Results** — "If you pivot to topic X, projected impact is..."
- **Approve/Dismiss Actions** — Human-in-the-loop approval for all AI recommendations
- **Outcome Tracking** — Did the recommendation lead to a positive outcome?

---

## Portal 5: Placement Portal

**Who:** Career counselors, placement officers, employer relations managers
**Core purpose:** Match students to opportunities, track employability, manage employer relationships

### What the placement officer sees and does:

#### Student Employability Intelligence
- **Employability Heatmap** — AI-ranked view of all students by career readiness (SOW §3.1: Placement Intelligence Agent)
- **Skill-Gap Analysis** — Where students fall short of employer expectations
- **At-Risk of Unemployment** — Students graduating without adequate placement prospects
- **Cohort Analytics** — Placement rates by department, program, demographic

#### AI-Powered Matching
- **Student-Employer Matching Engine** — AI matches student profiles to employer requirements (SOW §3.1)
- **Match Confidence Scores** — How strong is each match, with explainability
- **Batch Matching** — Run matching across entire graduating cohorts
- **Equity-Aware Matching** — Bias monitoring to ensure fair distribution of opportunities (SOW §9.1: Bias Monitoring)

#### Employer Management
- **Employer Directory** — Companies, roles, requirements, hiring history
- **Employer Verification Portal** — Employers verify student credentials via API (SOW §6.3)
- **Employer Engagement Tracking** — Which employers are active, responsive, hiring?
- **Job Posting Management** — Manage listings from employer partners

#### Placement Operations
- **Pipeline Dashboard** — Students in various stages: matched → applied → interviewed → placed
- **Interview Scheduling** — Coordinate between students and employers
- **Placement Reports** — Metrics for university leadership and accreditation
- **Alumni Tracking** — Post-graduation employment outcomes

---

## Portal 6: Ministry Portal

**Who:** Education ministry officials, policy makers, national education administrators
**Core purpose:** Cross-institution oversight, policy simulation, national education intelligence

### What the ministry official sees and does:

#### National Education Dashboard
- **Cross-Institution Aggregation** — Enrollment, graduation, retention across ALL universities (SOW §3.1: Ministry Intelligence Agent)
- **National KPI Tracking** — Education targets vs. actuals at national level
- **Regional Breakdown** — Performance by region/state/province
- **Institution Comparison** — Benchmark institutions against each other
- **Parliament/Cabinet-Ready Reports** — Presentation-quality exports (SOW: "every screen is defensible")

#### Policy Intelligence
- **Policy Impact Simulation** — "If we change funding formula X, what happens to Y institutions?" (SOW §4: Digital Twin)
- **Strategic Forecast** — Multi-year national education projections (SOW §3.2: Strategic Forecast Loop)
- **Scenario Comparison** — Side-by-side "what if" analysis (SOW §4.6)
- **International Benchmarking** — How does the nation compare to peer countries?

#### Compliance & Quality Oversight
- **Compliance Status Across Institutions** — Which institutions are compliant/at-risk (SOW §3.1: Compliance Agent)
- **Accreditation Overview** — Status of all institutional accreditations
- **Quality Indicators** — Faculty ratios, research output, placement rates by institution
- **Deviation Alerts** — Institutions falling below standards

#### Resource & Budget Intelligence
- **National Education Budget Overview** — Funding allocation across institutions
- **Budget Simulation** — 3-10 year budget projections for national education spending (SOW §4.1)
- **Endowment Overview** — Health of institutional endowments (SOW §4.4)
- **Faculty Supply/Demand** — National faculty workforce projections (SOW §4.2)

#### Data Governance
- **Configurable Visibility** — Institutions control what data flows up to ministry (SOW §10.1)
- **Data Residency Controls** — Ensure data stays within jurisdiction (SOW §9: GCC)
- **Anonymized Aggregation** — Ministry sees trends, not individual student data

---

## Shared Platform Infrastructure (All Portals)

These components serve all 6 portals and must be built as shared services:

### Authentication & Authorization
- SSO via SAML / OAuth2 (SOW §7.8)
- Role-Based Access Control (RBAC) — 6 roles minimum
- Multi-tenant session management
- Institution-level access boundaries

### AI/AGI Orchestration Layer
- 7 domain agents (SOW §3.1) — shared backend, different portals consume different agents
- 4 autonomous control loops (SOW §3.2) — outputs surfaced in relevant portals
- Explainability engine — every AI output in every portal must show "why" (SOW §3.3, §9.1)

### MLOps Infrastructure
- Model registry + version tracking (SOW §3.3)
- Automated retraining pipeline (SOW §3.3)
- Data drift detection (SOW §3.3)
- Bias & fairness evaluation (SOW §3.3)
- Model rollback (SOW §3.3)

### Data Layer
- PostgreSQL — Transactional (SOW §8)
- Neo4j — Talent & collaboration graph (SOW §8)
- Vector DB — RAG & semantic search (SOW §8)
- Time-Series DB — Skill evolution (SOW §8)
- Object Storage — Reports & evidence (SOW §8)
- Tenant isolation across all stores (SOW §8)
- Encryption at rest + in transit (SOW §8)

### Integration Connectors
- Canvas LMS connector (SOW §7)
- Moodle LMS connector (SOW §7)
- SAP Higher Education adapter (SOW §7)
- Oracle/PeopleSoft connector (SOW §7)
- Elsevier/Pure/Scopus connector (SOW §7)
- HRMS & Payroll connector (SOW §7)
- Finance ERP connector (SOW §7)
- Webhook & Event-Driven APIs (SOW §7)

### Global Credential Ledger
- Blockchain credential hashing (SOW §6)
- Transcript verification service (SOW §6)
- Employer verification API (SOW §6)
- Revocation workflow (SOW §6)
- Cross-border validation (SOW §6)

### Compliance Engine
- GDPR mechanisms (SOW §9)
- FERPA access controls (SOW §9)
- DPDP consent architecture (SOW §9)
- GCC data residency (SOW §9)
- ISO 27001 / SOC2 audit framework (SOW §9)
- Independent audit logging (SOW §9.1)

---

## Build Sequence — Phased by SOW §11

### Phase 1: Integration & Reporting Overlay

**Goal:** Connect to existing systems, establish data foundation, deliver basic dashboards

**Infrastructure:**
- [ ] PostgreSQL setup with multi-tenant schema
- [ ] Authentication service (Keycloak — SAML/OAuth2/OIDC)
- [ ] RBAC engine — 6 roles
- [ ] API Gateway (routing, rate limiting, auth)
- [ ] Object Storage setup

**Integrations:**
- [ ] Canvas LMS connector (grades, enrollments, assignments)
- [ ] Moodle LMS connector
- [ ] SIS data ingestion pipeline
- [ ] SSO configuration for institutions

**Portal Deliverables — Phase 1:**

| Portal | What Gets Delivered |
|--------|-------------------|
| Student | Academic transcript view, course enrollments, grades, attendance |
| Faculty | My students list, course rosters, grade overview |
| Admin | Enrollment dashboard, basic KPIs, user management, RBAC config |
| Research | Publication list (from Scopus/Elsevier import) |
| Placement | Student directory with basic profiles |
| Ministry | Cross-institution enrollment & graduation numbers |

**Compliance — Phase 1:**
- [ ] Audit logging framework
- [ ] Consent management (GDPR/DPDP basics)
- [ ] Tenant isolation enforcement
- [ ] Encryption at rest + in transit

---

### Phase 2: AI Augmentation Modules

**Goal:** Deploy AI agents, enable intelligent features across portals

**Infrastructure:**
- [ ] AI/AGI Orchestration Layer setup
- [ ] Vector DB deployment (embeddings, RAG)
- [ ] Time-Series DB deployment (skill tracking)
- [ ] Neo4j deployment (talent graph)
- [ ] Model registry + basic MLOps pipeline

**AI Agents Deployed:**
- [ ] Student Development Agent
- [ ] Compliance Agent
- [ ] Placement Intelligence Agent
- [ ] Research Optimization Agent

**Control Loops Activated:**
- [ ] Dropout Prevention Loop (Risk Detection → Intervention Proposal → Monitoring → Feedback)

**Portal Deliverables — Phase 2:**

| Portal | What Gets Added |
|--------|----------------|
| Student | Skill Radar, performance risk alerts, career readiness score, job matching, score appeal workflow |
| Faculty | At-risk student alerts, intervention tools, grant radar, collaboration discovery, AI briefings |
| Admin | Compliance pulse dashboard, deviation alerts, bias monitoring reports, AI model registry view |
| Research | Grant discovery, proposal success predictor, topic momentum, collaboration network graph |
| Placement | AI-powered student-employer matching, employability heatmap, equity-aware matching |
| Ministry | Basic cross-institution compliance overview |

**Credential Ledger — Phase 2:**
- [ ] Blockchain hashing service
- [ ] Digital credential wallet (Student Portal)
- [ ] Transcript verification
- [ ] Employer verification API

**MLOps — Phase 2:**
- [ ] Explainability layer (every AI output shows "why")
- [ ] Bias & fairness evaluation
- [ ] Data drift detection (basic)

---

### Phase 3: Strategic Intelligence Activation

**Goal:** Enable strategic decision-making, cross-institution intelligence, advanced research tools

**AI Agents Deployed:**
- [ ] Institutional Strategy Agent
- [ ] Budget & Resource Agent
- [ ] Ministry Intelligence Agent

**Control Loops Activated:**
- [ ] Research Optimization Loop (Detect → Simulate → Recommend → Approve → Track)
- [ ] Compliance Monitoring Loop (Detect Deviation → Notify → Recommend)

**Integrations — Phase 3:**
- [ ] SAP Higher Education adapter
- [ ] Oracle/PeopleSoft connector
- [ ] HRMS & Payroll connector
- [ ] Finance ERP connector
- [ ] Elsevier/Pure/Scopus deep integration

**Portal Deliverables — Phase 3:**

| Portal | What Gets Added |
|--------|----------------|
| Student | Evidence portfolio builder, credential sharing links, career trajectory projection |
| Faculty | Research performance dashboard, outcome mapping, publication trajectory |
| Admin | Institutional strategy dashboard, budget & resource overview, accreditation readiness, integration management |
| Research | Full research optimization loop, funding trend analytics, cross-institution research groups, research growth projection |
| Placement | Cohort analytics, alumni tracking, employer engagement tracking, placement reports |
| Ministry | Full national dashboard, institution comparison, regional breakdown, compliance across institutions, cabinet-ready reports |

**Compliance — Phase 3:**
- [ ] Full GDPR compliance (erasure, portability)
- [ ] FERPA access controls
- [ ] DPDP full consent architecture
- [ ] GCC data residency controls
- [ ] ISO 27001 alignment
- [ ] SOC2 audit framework

---

### Phase 4: Institutional Digital Twin & Autonomous Loops

**Goal:** Simulation engines, scenario modeling, fully autonomous control loops

**Digital Twin Engines:**
- [ ] Budget Simulation Engine (3-10 year projections)
- [ ] Faculty Hiring Impact Model
- [ ] Research Growth Projection Engine
- [ ] Endowment Allocation & Risk Simulation
- [ ] International Student Flow Modeling
- [ ] Strategic Scenario Comparison Dashboard

**Control Loops Activated:**
- [ ] Strategic Forecast Loop (Multi-year Scenario Modeling → Comparative Output)

**MLOps — Full Pipeline:**
- [ ] Automated model retraining (scheduled + event-triggered)
- [ ] Full data drift detection + alerting
- [ ] Model rollback mechanism
- [ ] Version-controlled model deployment

**Portal Deliverables — Phase 4:**

| Portal | What Gets Added |
|--------|----------------|
| Student | Long-term career simulation ("If I develop skill X, my employability in 5 years...") |
| Faculty | Faculty hiring impact view (how new hires affect departmental research output) |
| Admin | Full Digital Twin dashboard — budget simulation, hiring models, scenario comparison, endowment risk |
| Research | Research growth projections, "what if I pivot to topic X" simulation |
| Placement | Workforce demand forecasting, future-skill prediction |
| Ministry | Policy impact simulation, national budget projections, international student flow modeling, scenario comparison, strategic forecasting |

**Institutional Autonomy — Phase 4:**
- [ ] Configurable visibility layers (fully operational)
- [ ] Institution-level encryption key management
- [ ] On-premise deployment packaging
- [ ] Full administrative override controls

---

## SOW Requirement Traceability

Every SOW requirement mapped to where it lives:

| SOW Section | Requirement | Portal(s) | Phase |
|-------------|------------|-----------|-------|
| §2.1 | 6 Persona Dashboards | All | 1-4 |
| §2.1 | API Gateway | Shared | 1 |
| §2.1 | Microservices Layer | Shared | 1 |
| §3.1 | Student Development Agent | Student, Faculty | 2 |
| §3.1 | Research Optimization Agent | Research, Faculty | 2 |
| §3.1 | Institutional Strategy Agent | Admin, Ministry | 3 |
| §3.1 | Budget & Resource Agent | Admin, Ministry | 3 |
| §3.1 | Compliance Agent | Admin, Ministry | 2 |
| §3.1 | Placement Intelligence Agent | Placement, Student | 2 |
| §3.1 | Ministry Intelligence Agent | Ministry | 3 |
| §3.2 | Research Optimization Loop | Research | 3 |
| §3.2 | Dropout Prevention Loop | Faculty, Student, Admin | 2 |
| §3.2 | Strategic Forecast Loop | Ministry, Admin | 4 |
| §3.2 | Compliance Monitoring Loop | Admin, Ministry | 3 |
| §3.3 | Automated Retraining | Shared (MLOps) | 4 |
| §3.3 | Data Drift Detection | Shared (MLOps) | 2-4 |
| §3.3 | Model Registry | Admin | 2 |
| §3.3 | Explainability Layer | All (via AI outputs) | 2 |
| §3.3 | Bias & Fairness | Admin, Placement | 2 |
| §3.3 | Model Rollback | Shared (MLOps) | 4 |
| §4.1 | Budget Simulation Engine | Admin, Ministry | 4 |
| §4.2 | Faculty Hiring Impact Model | Admin, Faculty | 4 |
| §4.3 | Research Growth Projection | Research, Admin | 4 |
| §4.4 | Endowment Allocation Simulation | Admin, Ministry | 4 |
| §4.5 | International Student Flow Model | Admin, Ministry | 4 |
| §4.6 | Scenario Comparison Dashboard | Admin, Ministry | 4 |
| §5.1 | Grant Data Ingestion | Research | 2 |
| §5.2 | Topic Momentum Analytics | Research, Faculty | 2 |
| §5.3 | Collaboration Network | Research, Faculty | 2 |
| §5.4 | Funding Body Alignment | Research, Faculty | 2 |
| §5.5 | Proposal Success Modeling | Research | 2 |
| §5.6 | Research Performance Dashboards | Research, Faculty | 3 |
| §6.1 | Blockchain Credential Hashing | Shared | 2 |
| §6.2 | Immutable Transcript Verification | Student | 2 |
| §6.3 | Employer Verification API | Placement (external) | 2 |
| §6.4 | Credential Revocation | Admin | 2 |
| §6.5 | Cross-Border Validation | Student, Placement | 2 |
| §7.1 | SAP Adapter | Shared | 3 |
| §7.2 | Oracle/PeopleSoft Connector | Shared | 3 |
| §7.3 | Canvas LMS | Shared | 1 |
| §7.4 | Moodle LMS | Shared | 1 |
| §7.5 | Elsevier/Pure/Scopus | Research | 3 |
| §7.6 | HRMS & Payroll | Admin | 3 |
| §7.7 | Finance ERP | Admin | 3 |
| §7.8 | SSO (SAML/OAuth2) | Shared | 1 |
| §7.9 | Webhook APIs | Shared | 1 |
| §7.10 | Event-Driven APIs | Shared | 1 |
| §8.1 | PostgreSQL | Shared | 1 |
| §8.2 | Neo4j | Shared | 2 |
| §8.3 | Vector DB | Shared | 2 |
| §8.4 | Time-Series DB | Shared | 2 |
| §8.5 | Object Storage | Shared | 1 |
| §8.6 | Tenant Isolation | Shared | 1 |
| §8.7 | Encryption | Shared | 1 |
| §9.1 | GDPR | Shared | 1-3 |
| §9.2 | FERPA | Shared | 3 |
| §9.3 | DPDP | Shared | 3 |
| §9.4 | GCC Data Residency | Shared | 3 |
| §9.5 | ISO 27001 / SOC2 | Shared | 3 |
| §9.1.1 | Model Registry & Docs | Admin | 2 |
| §9.1.2 | Explainability Interface | All | 2 |
| §9.1.3 | Bias Monitoring Reports | Admin | 2 |
| §9.1.4 | Independent Audit Logging | Admin | 1 |
| §9.1.5 | Version-Controlled Deployment | Shared (MLOps) | 4 |
| §10.1 | Configurable Visibility | Admin, Ministry | 4 |
| §10.2 | Institution Encryption Keys | Admin | 4 |
| §10.3 | On-Premise Deployment | Shared (Infra) | 4 |
| §10.4 | Score Appeal Workflow | Student | 2 |
| §10.5 | Administrative Overrides | Admin | 2 |

**Total: 77 requirements — all mapped. Zero gaps.**
