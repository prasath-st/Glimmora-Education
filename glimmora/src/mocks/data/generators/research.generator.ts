import { faker } from "@faker-js/faker";
import type {
  ResearchDashboard,
  ResearchGrant,
  MyGrant,
  Collaborator,
  CollaborationGraph,
  ResearchPublication,
  TrendingTopic,
  TopicAnalytics,
  ResearchPerformance,
  ResearchProfile,
} from "@/lib/api/types/research.types";
import type { GrantStatus } from "@/lib/api/types/common.types";

faker.seed(45);

// ─── Helpers ──────────────────────────────────────────────────────────────────

const now = new Date();
const currentYear = now.getFullYear();

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

const FUNDING_BODIES = [
  { name: "National Science Foundation (NSF)", currency: "USD", minAmount: 150000, maxAmount: 800000 },
  { name: "National Institutes of Health (NIH)", currency: "USD", minAmount: 250000, maxAmount: 2500000 },
  { name: "DARPA", currency: "USD", minAmount: 500000, maxAmount: 5000000 },
  { name: "EU Horizon Europe", currency: "EUR", minAmount: 200000, maxAmount: 3000000 },
  { name: "Wellcome Trust", currency: "GBP", minAmount: 100000, maxAmount: 1500000 },
  { name: "Bill & Melinda Gates Foundation", currency: "USD", minAmount: 300000, maxAmount: 4000000 },
  { name: "Alfred P. Sloan Foundation", currency: "USD", minAmount: 100000, maxAmount: 600000 },
  { name: "Department of Energy (DOE)", currency: "USD", minAmount: 200000, maxAmount: 1500000 },
  { name: "European Research Council (ERC)", currency: "EUR", minAmount: 500000, maxAmount: 2500000 },
  { name: "Canadian Institutes of Health Research", currency: "CAD", minAmount: 100000, maxAmount: 750000 },
  { name: "Deutsche Forschungsgemeinschaft (DFG)", currency: "EUR", minAmount: 150000, maxAmount: 1000000 },
  { name: "Japan Society for Promotion of Science", currency: "JPY", minAmount: 15000000, maxAmount: 100000000 },
];

const INSTITUTIONS = [
  { name: "MIT", department: "Electrical Engineering & Computer Science" },
  { name: "Stanford University", department: "Bioengineering" },
  { name: "University of Oxford", department: "Engineering Science" },
  { name: "ETH Zurich", department: "Biosystems Science & Engineering" },
  { name: "University of Cambridge", department: "Chemical Engineering & Biotechnology" },
  { name: "Caltech", department: "Medical Engineering" },
  { name: "Johns Hopkins University", department: "Biomedical Engineering" },
  { name: "Max Planck Institute", department: "Medical Research" },
  { name: "University of Tokyo", department: "Bioengineering" },
  { name: "Imperial College London", department: "Bioengineering" },
  { name: "Tsinghua University", department: "Biomedical Engineering" },
  { name: "University of Toronto", department: "Institute of Biomedical Engineering" },
  { name: "KAIST", department: "Bio & Brain Engineering" },
  { name: "Technical University of Munich", department: "Biomedical Engineering" },
  { name: "National University of Singapore", department: "Biomedical Engineering" },
];

const EXPERTISE_AREAS = [
  "Neural Interfaces",
  "Tissue Engineering",
  "Biomechanics",
  "Medical Imaging",
  "Drug Delivery Systems",
  "Biosensors",
  "Computational Biology",
  "Regenerative Medicine",
  "Biomedical Signal Processing",
  "Nanomedicine",
  "Biomaterials",
  "Prosthetics & Orthotics",
  "Neuroengineering",
  "Lab-on-a-Chip",
  "Bioinformatics",
  "Clinical AI",
  "Wearable Health Tech",
  "Genomic Engineering",
  "Optogenetics",
  "Bioelectronics",
];

const RESEARCH_TOPICS = [
  "AI-Driven Drug Discovery",
  "Brain-Computer Interfaces",
  "CRISPR Gene Therapy",
  "Federated Learning in Healthcare",
  "Organ-on-a-Chip",
  "Wearable Biosensors",
  "Neural Implants",
  "Synthetic Biology",
  "Precision Medicine AI",
  "3D Bioprinting",
  "Immunotherapy Optimization",
  "Digital Twins in Medicine",
  "Microfluidic Diagnostics",
  "Point-of-Care Devices",
  "Explainable AI for Clinical Use",
];

const GRANT_TOPICS = [
  "AI-assisted diagnostic imaging",
  "Neural signal decoding",
  "Tissue scaffold fabrication",
  "Wearable health monitoring",
  "Personalized medicine algorithms",
  "Drug delivery nanoparticles",
  "Brain-computer interface design",
  "Regenerative cardiac tissue",
  "CRISPR therapeutic delivery",
  "Microfluidic biosensor platforms",
  "Federated clinical data analysis",
  "3D bioprinted organ models",
  "Real-time physiological monitoring",
  "Explainable medical AI systems",
  "Synthetic biology for therapeutics",
];

const PAPER_TITLES = [
  "Deep Learning for Real-Time Intracranial Pressure Prediction from Non-Invasive Sensors",
  "A Microfluidic Platform for High-Throughput Drug Screening in Patient-Derived Organoids",
  "Federated Learning for Multi-Institutional Clinical Data: Privacy-Preserving Diagnostic Models",
  "Electrospun Nanofiber Scaffolds with Gradient Bioactive Signals for Spinal Cord Regeneration",
  "Graph Neural Networks for Protein-Drug Interaction Prediction at Scale",
  "Wearable Biosensor Array for Continuous Multi-Analyte Sweat Monitoring",
  "Explainable AI for Radiological Diagnosis: A Systematic Benchmark Study",
  "CRISPR-Cas13 Delivery via Lipid Nanoparticles for In Vivo RNA Editing",
  "Biomimetic Hydrogels for Cartilage Repair: Mechanical and Biological Characterization",
  "Transfer Learning in Medical Image Segmentation: When Does It Help?",
  "Closed-Loop Neural Stimulation Using Reinforcement Learning Controllers",
  "3D Bioprinted Vascularized Tissue Constructs for Organ Replacement Studies",
  "Point-of-Care Diagnostics Using Paper-Based Electrochemical Biosensors",
  "Multi-Modal Fusion for Early Alzheimer's Detection from MRI and PET Scans",
  "Self-Healing Polymer Coatings for Long-Term Implantable Device Biocompatibility",
  "Temporal Convolutional Networks for ICU Patient Deterioration Prediction",
  "Optogenetic Control of Engineered Cardiac Tissue for Arrhythmia Modeling",
  "Adversarial Robustness of Deep Learning in Clinical Decision Support Systems",
  "Programmable DNA Nanostructures as Targeted Drug Delivery Vehicles",
  "Digital Twin Framework for Personalized Cardiovascular Risk Assessment",
  "Attention Mechanisms in Electroencephalography Signal Classification",
  "Biodegradable Piezoelectric Scaffolds for Bone Tissue Engineering",
  "Zero-Shot Clinical Text Classification Using Large Language Models",
  "Injectable Conductive Hydrogels for Myocardial Infarction Repair",
  "Continual Learning in Pathology: Adapting Models Without Catastrophic Forgetting",
];

const VENUES = [
  { name: "Nature Biomedical Engineering", type: "journal" as const },
  { name: "Nature Machine Intelligence", type: "journal" as const },
  { name: "Science Translational Medicine", type: "journal" as const },
  { name: "Advanced Materials", type: "journal" as const },
  { name: "Biomaterials", type: "journal" as const },
  { name: "IEEE Transactions on Biomedical Engineering", type: "journal" as const },
  { name: "Annals of Biomedical Engineering", type: "journal" as const },
  { name: "Lab on a Chip", type: "journal" as const },
  { name: "NeurIPS", type: "conference" as const },
  { name: "ICML", type: "conference" as const },
  { name: "MICCAI", type: "conference" as const },
  { name: "EMBC", type: "conference" as const },
  { name: "AAAI", type: "conference" as const },
  { name: "ACL", type: "conference" as const },
  { name: "Springer Handbook of Biomedical Engineering", type: "book_chapter" as const },
  { name: "arXiv", type: "preprint" as const },
  { name: "bioRxiv", type: "preprint" as const },
  { name: "medRxiv", type: "preprint" as const },
];

const COLLABORATOR_NAMES = [
  "Dr. James Chen", "Dr. Aisha Rahman", "Prof. Marcus Lindberg", "Dr. Yuki Tanaka",
  "Prof. Elena Vasquez", "Dr. Thomas Okafor", "Dr. Mei-Ling Wu", "Prof. Henrik Johansson",
  "Dr. Fatima Al-Rashidi", "Prof. David Schneider", "Dr. Ravi Krishnamurthy", "Dr. Sophie Laurent",
  "Prof. Wei Zhang", "Dr. Olga Petrov", "Dr. Carlos Mendoza", "Prof. Sarah Mitchell",
  "Dr. Kenji Nakamura", "Dr. Annika Bauer", "Prof. Liam O'Brien", "Dr. Priya Sharma",
];

const RECENT_WORK_TITLES = [
  "Developed novel neural probe array with 1024 channels",
  "Published framework for federated learning in ICU settings",
  "Designed microfluidic chip for single-cell RNA sequencing",
  "Created machine learning pipeline for drug-target interaction screening",
  "Built wearable EEG system for seizure prediction",
  "Synthesized biocompatible hydrogel for pancreatic islet encapsulation",
  "Developed transformer model for protein structure prediction",
  "Engineered self-assembling peptide scaffolds for wound healing",
  "Published benchmark dataset for medical image segmentation",
  "Designed point-of-care diagnostic platform for infectious diseases",
];

// ─── Grant Description Templates ─────────────────────────────────────────────

const GRANT_DESCRIPTIONS = [
  "This program supports innovative research in biomedical engineering that addresses critical challenges in human health. Proposals should demonstrate novel approaches with translational potential.",
  "Funding for interdisciplinary teams working at the intersection of artificial intelligence and clinical medicine. Priority given to projects with clear pathways to FDA-clearable devices.",
  "Research grants for early-career investigators pursuing breakthrough technologies in neural engineering and brain-computer interfaces. Collaborative proposals encouraged.",
  "Support for transformative research in regenerative medicine, with emphasis on 3D bioprinting, stem cell engineering, and tissue vascularization strategies.",
  "Program seeking proposals for development of next-generation wearable and implantable biosensors for continuous health monitoring in clinical and home settings.",
  "Grants for computational approaches to drug discovery, including machine learning, molecular simulation, and high-throughput virtual screening methodologies.",
  "Funding for innovative diagnostic technologies that can be deployed in resource-limited settings. Point-of-care platforms and paper-based assays of particular interest.",
  "Research support for teams developing explainable AI systems for clinical decision support. Must include validation with clinical data and stakeholder engagement.",
];

const GRANT_REQUIREMENTS = [
  ["PhD in relevant field", "Minimum 2 years post-doctoral experience", "Institutional affiliation required"],
  ["Principal Investigator must hold faculty position", "Multi-institutional collaboration encouraged", "Data sharing plan required"],
  ["Open to early-career researchers (within 7 years of PhD)", "Budget justification", "Letters of collaboration from clinical partners"],
  ["US-based institution", "IRB approval or exemption documentation", "Preliminary data recommended"],
  ["Open to international applicants", "Co-PI from clinical department required", "Technology readiness level 3 or above"],
  ["Must include diversity and inclusion plan", "Public engagement strategy", "Open access publication commitment"],
];

const ELIGIBILITY_STATEMENTS = [
  "Open to tenure-track and tenured faculty at accredited research institutions.",
  "Available to researchers at any career stage with demonstrated expertise in the field.",
  "Restricted to early-career investigators within 10 years of terminal degree.",
  "International applicants welcome. Must have institutional affiliation.",
  "Available to US institutions of higher education and non-profit research organizations.",
  "Open to researchers at accredited institutions worldwide. Industry partnerships permitted.",
];

// ─── Generators ───────────────────────────────────────────────────────────────

export function generatePublications(count = 20): ResearchPublication[] {
  const pubs: ResearchPublication[] = [];
  const usedTitles = new Set<string>();

  for (let i = 0; i < count; i++) {
    let title: string;
    do {
      title = pick(PAPER_TITLES);
    } while (usedTitles.has(title) && usedTitles.size < PAPER_TITLES.length);
    usedTitles.add(title);

    const venue = pick(VENUES);
    const year = faker.number.int({ min: currentYear - 6, max: currentYear });
    const isRecent = year >= currentYear - 1;
    const statusOptions: ResearchPublication["status"][] = isRecent
      ? ["published", "in_review", "accepted", "preprint"]
      : ["published"];
    const status = pick(statusOptions);

    const citationBase = currentYear - year;
    const citations =
      status === "preprint" || status === "in_review"
        ? faker.number.int({ min: 0, max: 5 })
        : faker.number.int({ min: citationBase * 3, max: citationBase * 40 + 20 });

    const coAuthorCount = faker.number.int({ min: 2, max: 6 });
    const coAuthors = pickN(COLLABORATOR_NAMES, coAuthorCount).map((n) => n.replace(/^(Dr\.|Prof\.)\s*/, ""));

    pubs.push({
      id: id("pub"),
      title,
      journal: venue.name,
      year,
      citations,
      coAuthors,
      doi: `10.${faker.number.int({ min: 1000, max: 9999 })}/${faker.string.alphanumeric(8)}`,
      type: venue.type,
      status,
      abstract: `We present ${title.toLowerCase().replace(/^(a |an |the )/, "")}. ${faker.lorem.sentences(3)}`,
    });
  }

  // Sort by year desc, then citations desc
  pubs.sort((a, b) => b.year - a.year || b.citations - a.citations);
  return pubs;
}

export function generateResearchDashboard(): ResearchDashboard {
  const recentPubs = generatePublications(5).map((p) => ({ ...p, year: currentYear }));
  const totalCitations = faker.number.int({ min: 1800, max: 2400 });

  return {
    publications: {
      total: 47,
      thisYear: 12,
      trend: roundTo(faker.number.float({ min: 8, max: 18 }), 1),
    },
    grants: {
      active: faker.number.int({ min: 3, max: 5 }),
      totalFunding: faker.number.int({ min: 1200000, max: 2800000 }),
      pendingProposals: faker.number.int({ min: 2, max: 4 }),
    },
    collaborations: {
      active: faker.number.int({ min: 8, max: 14 }),
      pending: faker.number.int({ min: 2, max: 5 }),
    },
    trendingTopics: generateTrendingTopics(5),
    hIndex: 22,
    citations: totalCitations,
    recentPublications: recentPubs,
  };
}

function generateTrendingTopics(count: number): TrendingTopic[] {
  const selected = pickN(RESEARCH_TOPICS, count);
  return selected.map((topic) => ({
    topic,
    momentum: roundTo(faker.number.float({ min: 0.3, max: 0.98 }), 2),
    fundingGrowth: roundTo(faker.number.float({ min: -5, max: 45 }), 1),
    publicationCount: faker.number.int({ min: 120, max: 4500 }),
    relatedGrants: faker.number.int({ min: 3, max: 25 }),
    relatedTopics: pickN(
      RESEARCH_TOPICS.filter((t) => t !== topic),
      faker.number.int({ min: 2, max: 4 })
    ),
  }));
}

export function generateGrants(count = 12): ResearchGrant[] {
  const grants: ResearchGrant[] = [];
  const statuses: GrantStatus[] = ["discovered", "interested", "drafting", "submitted", "funded", "rejected"];

  for (let i = 0; i < count; i++) {
    const funder = pick(FUNDING_BODIES);
    const amount = faker.number.int({ min: funder.minAmount, max: funder.maxAmount });
    const status = pick(statuses);
    const topics = pickN(GRANT_TOPICS, faker.number.int({ min: 2, max: 4 }));

    grants.push({
      id: id("grt"),
      title: `${pick(["Research Grant", "Innovation Award", "Collaborative Grant", "Pioneer Grant", "Exploratory Award", "Development Grant"])}: ${pick(GRANT_TOPICS)}`,
      fundingBody: funder.name,
      amount,
      currency: funder.currency,
      alignmentScore: roundTo(faker.number.float({ min: 0.45, max: 0.98 }), 2),
      successProbability: roundTo(faker.number.float({ min: 0.15, max: 0.75 }), 2),
      deadline: futureDate(faker.number.int({ min: 14, max: 180 })),
      topics,
      status,
      matchExplanation: `Strong alignment with your research in ${topics[0].toLowerCase()} and ${topics.length > 1 ? topics[1].toLowerCase() : "related areas"}. ${pick(["Your publication record in this domain is competitive.", "Your prior funded work provides strong preliminary data.", "The funder has historically supported similar research profiles.", "Multi-disciplinary angle matches the call priorities."])}`,
      requirements: pick(GRANT_REQUIREMENTS),
      description: pick(GRANT_DESCRIPTIONS),
      eligibility: pick(ELIGIBILITY_STATEMENTS),
      url: `https://${funder.name.toLowerCase().replace(/[^a-z]/g, "")}.org/grants/${faker.string.alphanumeric(8)}`,
      createdAt: pastDate(faker.number.int({ min: 7, max: 90 })),
      updatedAt: pastDate(faker.number.int({ min: 1, max: 7 })),
    });
  }

  // Sort by alignment score descending
  grants.sort((a, b) => b.alignmentScore - a.alignmentScore);
  return grants;
}

export function generateMyGrants(count = 6): MyGrant[] {
  const myGrants: MyGrant[] = [];
  const statusDistribution: MyGrant["status"][] = [
    "drafting",
    "drafting",
    "submitted",
    "submitted",
    "funded",
    "rejected",
  ];

  for (let i = 0; i < count; i++) {
    const funder = pick(FUNDING_BODIES);
    const status = statusDistribution[i % statusDistribution.length];
    const amount = faker.number.int({ min: funder.minAmount, max: funder.maxAmount });
    const topics = pickN(GRANT_TOPICS, faker.number.int({ min: 2, max: 3 }));
    const createdDate = pastDate(faker.number.int({ min: 14, max: 120 }));

    const myGrant: MyGrant = {
      id: id("mgrt"),
      title: `${topics[0]} - ${pick(["Phase I", "Phase II", "Pilot Study", "Multi-Year Initiative", "Seed Grant"])}`,
      fundingBody: funder.name,
      amount,
      currency: funder.currency,
      status,
      topics,
      createdAt: createdDate,
      updatedAt: pastDate(faker.number.int({ min: 1, max: 14 })),
    };

    if (status === "submitted" || status === "under_review") {
      myGrant.submittedDate = pastDate(faker.number.int({ min: 7, max: 60 }));
    }

    if (status === "funded") {
      myGrant.submittedDate = pastDate(faker.number.int({ min: 60, max: 180 }));
      myGrant.responseDate = pastDate(faker.number.int({ min: 7, max: 30 }));
    }

    if (status === "rejected") {
      myGrant.submittedDate = pastDate(faker.number.int({ min: 60, max: 150 }));
      myGrant.responseDate = pastDate(faker.number.int({ min: 14, max: 45 }));
      myGrant.feedback = pick([
        "The proposal demonstrates strong scientific merit but the budget was not sufficiently justified for the scope described. Consider resubmitting with revised budget and expanded preliminary data.",
        "Reviewers noted the innovative approach but felt the clinical translation pathway needed more detail. Strengthen the regulatory and commercialization sections for resubmission.",
        "While the research questions are compelling, the panel felt the team composition lacked sufficient clinical expertise. Consider adding a clinical co-investigator.",
      ]);
    }

    myGrants.push(myGrant);
  }

  return myGrants;
}

export function generateCollaborators(count = 15): Collaborator[] {
  const collaborators: Collaborator[] = [];
  const usedNames = new Set<string>();

  for (let i = 0; i < count; i++) {
    let nameEntry: string;
    do {
      nameEntry = pick(COLLABORATOR_NAMES);
    } while (usedNames.has(nameEntry) && usedNames.size < COLLABORATOR_NAMES.length);
    usedNames.add(nameEntry);

    const inst = pick(INSTITUTIONS);
    const expertise = pickN(EXPERTISE_AREAS, faker.number.int({ min: 3, max: 5 }));
    const sharedPubs = faker.number.int({ min: 0, max: 8 });

    collaborators.push({
      id: id("collab"),
      name: nameEntry,
      institution: inst.name,
      department: inst.department,
      expertise,
      publicationCount: faker.number.int({ min: 15, max: 120 }),
      sharedPublications: sharedPubs,
      matchScore: roundTo(faker.number.float({ min: 0.55, max: 0.99 }), 2),
      email: `${nameEntry.replace(/^(Dr\.|Prof\.)\s*/, "").toLowerCase().replace(/\s+/g, ".")}@${inst.name.toLowerCase().replace(/[^a-z]/g, "")}.edu`,
      avatarUrl: null,
      bio: `${nameEntry} is a researcher at ${inst.name} specializing in ${expertise.slice(0, 2).join(" and ").toLowerCase()}. ${faker.lorem.sentence()}`,
      recentWork: pickN(RECENT_WORK_TITLES, faker.number.int({ min: 2, max: 4 })),
    });
  }

  // Sort by match score descending
  collaborators.sort((a, b) => b.matchScore - a.matchScore);
  return collaborators;
}

export function generateCollaborationGraph(): CollaborationGraph {
  const collaborators = generateCollaborators(12);
  const meNode = {
    id: "me",
    name: "Dr. Priya Patel",
    institution: "Georgia Institute of Technology",
    group: 0,
  };

  const nodes = [
    meNode,
    ...collaborators.map((c, i) => ({
      id: c.id,
      name: c.name,
      institution: c.institution,
      group: Math.floor(i / 3) + 1,
    })),
  ];

  const edges: CollaborationGraph["edges"] = [];

  // Connect each collaborator to "me"
  for (const c of collaborators) {
    edges.push({
      source: "me",
      target: c.id,
      strength: roundTo(faker.number.float({ min: 0.3, max: 1.0 }), 2),
      sharedPubs: c.sharedPublications,
    });
  }

  // Add some inter-collaborator connections (representing shared work)
  for (let i = 0; i < collaborators.length; i++) {
    const connectionCount = faker.number.int({ min: 0, max: 3 });
    for (let j = 0; j < connectionCount; j++) {
      const targetIdx = faker.number.int({ min: 0, max: collaborators.length - 1 });
      if (targetIdx !== i) {
        const edgeExists = edges.some(
          (e) =>
            (e.source === collaborators[i].id && e.target === collaborators[targetIdx].id) ||
            (e.source === collaborators[targetIdx].id && e.target === collaborators[i].id)
        );
        if (!edgeExists) {
          edges.push({
            source: collaborators[i].id,
            target: collaborators[targetIdx].id,
            strength: roundTo(faker.number.float({ min: 0.1, max: 0.7 }), 2),
            sharedPubs: faker.number.int({ min: 0, max: 3 }),
          });
        }
      }
    }
  }

  return { nodes, edges };
}

export function generateTopicAnalytics(): TopicAnalytics {
  const topics = generateTrendingTopics(8);

  // Generate 12-month trend data
  const trendOverTime: TopicAnalytics["trendOverTime"] = [];
  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  for (let i = 11; i >= 0; i--) {
    const date = new Date(currentYear, now.getMonth() - i, 1);
    const month = `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    const entry: TopicAnalytics["trendOverTime"][number] = { month };

    for (const t of topics) {
      // Each topic gets a realistic publication count per month with slight trend
      const base = faker.number.int({ min: 15, max: 80 });
      const growth = Math.round(t.momentum * (11 - i) * 2);
      entry[t.topic] = base + growth;
    }

    trendOverTime.push(entry);
  }

  return { topics, trendOverTime };
}

export function generatePerformance(): ResearchPerformance {
  const totalPubs = 47;
  const thisYearPubs = 12;
  const hIndex = 22;

  // Output by year (7 years)
  const outputByYear: ResearchPerformance["outputByYear"] = [];
  for (let y = currentYear - 6; y <= currentYear; y++) {
    const pubs = y === currentYear
      ? thisYearPubs
      : faker.number.int({ min: 3, max: 9 });
    const cites = y === currentYear
      ? faker.number.int({ min: 30, max: 80 })
      : faker.number.int({ min: 50 + (y - (currentYear - 6)) * 20, max: 150 + (y - (currentYear - 6)) * 40 });
    outputByYear.push({ year: y, publications: pubs, citations: cites });
  }

  // Impact by type
  const impactByType: ResearchPerformance["impactByType"] = [
    { type: "Journal Article", count: 28, avgCitations: roundTo(faker.number.float({ min: 25, max: 55 }), 1) },
    { type: "Conference Paper", count: 12, avgCitations: roundTo(faker.number.float({ min: 10, max: 30 }), 1) },
    { type: "Book Chapter", count: 3, avgCitations: roundTo(faker.number.float({ min: 8, max: 20 }), 1) },
    { type: "Preprint", count: 4, avgCitations: roundTo(faker.number.float({ min: 2, max: 12 }), 1) },
  ];

  // Growth projections (next 3 years)
  const growthProjection: ResearchPerformance["growthProjection"] = [];
  let baseProjected = thisYearPubs;
  for (let y = currentYear + 1; y <= currentYear + 3; y++) {
    baseProjected = Math.round(baseProjected * 1.12);
    growthProjection.push({
      year: y,
      projected: baseProjected,
      lower: Math.round(baseProjected * 0.75),
      upper: Math.round(baseProjected * 1.3),
    });
  }

  // Peer comparison
  const peerComparison: ResearchPerformance["peerComparison"] = [
    { metric: "h-Index", you: hIndex, fieldAvg: 15, top10: 35 },
    { metric: "Citations/Year", you: roundTo(1850 / 7, 0), fieldAvg: 120, top10: 450 },
    { metric: "Publications/Year", you: roundTo(totalPubs / 7, 1), fieldAvg: 4.2, top10: 12 },
    { metric: "Grant Success Rate", you: 42, fieldAvg: 22, top10: 55 },
    { metric: "Collaboration Score", you: 78, fieldAvg: 45, top10: 90 },
  ];

  const totalCites = outputByYear.reduce((sum, y) => sum + y.citations, 0);

  return {
    publicationMetrics: {
      total: totalPubs,
      thisYear: thisYearPubs,
      avgCitationsPerPaper: roundTo(totalCites / totalPubs, 1),
      hIndex,
      i10Index: faker.number.int({ min: 18, max: 28 }),
    },
    outputByYear,
    impactByType,
    growthProjection,
    peerComparison,
  };
}

export function generateResearchProfile(): ResearchProfile {
  return {
    name: "Dr. Priya Patel",
    email: "priya.patel@gatech.edu",
    researcherId: "RES-2024-00147",
    department: "Biomedical Engineering",
    title: "Associate Professor",
    institution: "Georgia Institute of Technology",
    phone: "+1 (404) 385-7291",
    bio: "Dr. Priya Patel is an Associate Professor of Biomedical Engineering at Georgia Tech, specializing in neural interfaces, AI-driven diagnostics, and wearable biosensor systems. Her lab has published over 45 peer-reviewed papers and holds 6 patents. She leads the Intelligent Biomedical Systems Lab, which combines machine learning with biomedical device design to create next-generation healthcare technologies.",
    avatarUrl: null,
    researchInterests: [
      "Brain-Computer Interfaces",
      "AI-Driven Diagnostics",
      "Wearable Biosensors",
      "Neural Signal Processing",
      "Precision Medicine",
      "Tissue Engineering",
    ],
    expertise: [
      "Neural Interfaces",
      "Medical Imaging",
      "Machine Learning for Healthcare",
      "Biosensor Design",
      "Signal Processing",
      "Clinical AI Systems",
    ],
    orcid: "0000-0002-8341-5672",
    googleScholar: "abc123XYZ",
    socialLinks: [
      { platform: "Google Scholar", url: "https://scholar.google.com/citations?user=abc123XYZ" },
      { platform: "ORCID", url: "https://orcid.org/0000-0002-8341-5672" },
      { platform: "ResearchGate", url: "https://www.researchgate.net/profile/Priya-Patel-42" },
      { platform: "Twitter", url: "https://twitter.com/PriyaPatelBME" },
      { platform: "LinkedIn", url: "https://linkedin.com/in/priya-patel-bme" },
    ],
  };
}
