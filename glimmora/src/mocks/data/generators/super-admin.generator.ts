import { faker } from "@faker-js/faker";
import type {
  SuperAdminDashboard,
  University,
  RecentOnboarding,
  PlatformMonitoring,
  ServiceStatus,
  PlatformAuditEntry,
  PlatformSettings,
} from "@/lib/api/types/super-admin.types";

faker.seed(500);

const UNIVERSITY_DATA: { name: string; shortName: string; city: string; domain: string }[] = [
  { name: "University of Delhi", shortName: "DU", city: "New Delhi", domain: "du.ac.in" },
  { name: "IIT Bombay", shortName: "IITB", city: "Mumbai", domain: "iitb.ac.in" },
  { name: "BITS Pilani", shortName: "BITS", city: "Pilani", domain: "bits-pilani.ac.in" },
  { name: "Anna University", shortName: "AU", city: "Chennai", domain: "annauniv.edu" },
  { name: "Jadavpur University", shortName: "JU", city: "Kolkata", domain: "jaduniv.edu.in" },
  { name: "IIT Madras", shortName: "IITM", city: "Chennai", domain: "iitm.ac.in" },
  { name: "Osmania University", shortName: "OU", city: "Hyderabad", domain: "osmania.ac.in" },
  { name: "Manipal Academy", shortName: "MAHE", city: "Manipal", domain: "manipal.edu" },
  { name: "VIT University", shortName: "VIT", city: "Vellore", domain: "vit.ac.in" },
  { name: "Amrita University", shortName: "AMRITA", city: "Coimbatore", domain: "amrita.edu" },
  { name: "SRM University", shortName: "SRM", city: "Chennai", domain: "srmist.edu.in" },
  { name: "NIT Trichy", shortName: "NITT", city: "Tiruchirappalli", domain: "nitt.edu" },
];

function generateUniversityList(): University[] {
  return UNIVERSITY_DATA.map((u, i) => {
    const studentCount = faker.number.int({ min: 3000, max: 15000 });
    const facultyCount = faker.number.int({ min: 200, max: 800 });
    return {
      id: `univ_${String(i + 1).padStart(2, "0")}`,
      name: u.name,
      shortName: u.shortName,
      domain: u.domain,
      city: u.city,
      country: "India",
      status: i < 10 ? "active" as const : "suspended" as const,
      adminEmail: `admin@${u.domain}`,
      adminName: faker.person.fullName(),
      userCount: studentCount + facultyCount + faker.number.int({ min: 20, max: 80 }),
      studentCount,
      facultyCount,
      createdAt: faker.date.between({ from: "2025-01-01", to: "2026-03-01" }).toISOString(),
      updatedAt: faker.date.recent({ days: 30 }).toISOString(),
    };
  });
}

function generateRecentOnboardings(universities: University[]): RecentOnboarding[] {
  return universities
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 5)
    .map((u) => ({
      id: u.id,
      universityName: u.name,
      adminName: u.adminName,
      adminEmail: u.adminEmail,
      createdAt: u.createdAt,
      userCount: u.userCount,
    }));
}

const universities = generateUniversityList();

export function generateSuperAdminDashboard(): SuperAdminDashboard {
  const totalStudents = universities.reduce((sum, u) => sum + u.studentCount, 0);
  const totalFaculty = universities.reduce((sum, u) => sum + u.facultyCount, 0);
  const totalUsers = universities.reduce((sum, u) => sum + u.userCount, 0);

  return {
    totalUniversities: universities.length,
    activeUniversities: universities.filter((u) => u.status === "active").length,
    suspendedUniversities: universities.filter((u) => u.status === "suspended").length,
    totalUsers,
    totalStudents,
    totalFaculty,
    universityGrowth: [
      { month: "Jul", count: 2 },
      { month: "Aug", count: 3 },
      { month: "Sep", count: 4 },
      { month: "Oct", count: 5 },
      { month: "Nov", count: 7 },
      { month: "Dec", count: 8 },
      { month: "Jan", count: 9 },
      { month: "Feb", count: 10 },
      { month: "Mar", count: 11 },
      { month: "Apr", count: 12 },
    ],
    recentOnboardings: generateRecentOnboardings(universities),
  };
}

export function generateUniversities(): University[] {
  return universities;
}

// ── Platform Monitoring ──────────────────────────────────────────────────

export function generatePlatformMonitoring(): PlatformMonitoring {
  const now = new Date();
  const services: ServiceStatus[] = [
    {
      name: "Database",
      status: "healthy",
      responseTime: 12,
      uptime: 99.99,
      lastChecked: new Date(now.getTime() - 15_000).toISOString(),
    },
    {
      name: "API Gateway",
      status: "healthy",
      responseTime: 45,
      uptime: 99.98,
      lastChecked: new Date(now.getTime() - 10_000).toISOString(),
    },
    {
      name: "Auth Service",
      status: "healthy",
      responseTime: 38,
      uptime: 99.97,
      lastChecked: new Date(now.getTime() - 20_000).toISOString(),
    },
    {
      name: "File Storage",
      status: "degraded",
      responseTime: 320,
      uptime: 99.82,
      lastChecked: new Date(now.getTime() - 5_000).toISOString(),
    },
    {
      name: "Email Service",
      status: "healthy",
      responseTime: 95,
      uptime: 99.95,
      lastChecked: new Date(now.getTime() - 30_000).toISOString(),
    },
    {
      name: "Background Jobs",
      status: "healthy",
      responseTime: 22,
      uptime: 99.99,
      lastChecked: new Date(now.getTime() - 12_000).toISOString(),
    },
  ];

  const responseTimeTrend = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(now.getTime() - (23 - i) * 3_600_000).toISOString(),
    ms: faker.number.int({ min: 100, max: 200 }),
  }));

  const errorTrend = Array.from({ length: 24 }, (_, i) => ({
    time: new Date(now.getTime() - (23 - i) * 3_600_000).toISOString(),
    count: faker.number.int({ min: 0, max: 5 }),
  }));

  return {
    systemStatus: "healthy",
    uptime: 99.97,
    apiResponseTime: 142,
    errorRate: 0.03,
    activeUsers24h: 4827,
    storageUsed: 284,
    storageTotal: 500,
    services,
    responseTimeTrend,
    errorTrend,
  };
}

// ── Platform Audit Log ───────────────────────────────────────────────────

export function generatePlatformAuditLog(): PlatformAuditEntry[] {
  const now = new Date();
  const actions: PlatformAuditEntry["action"][] = [
    "create_university",
    "suspend_university",
    "login",
    "update_settings",
  ];

  const universityNames = UNIVERSITY_DATA.map((u) => u.name);

  const ipAddresses = [
    "203.122.45.67",
    "103.48.192.12",
    "182.73.110.54",
    "14.139.56.89",
    "117.211.83.22",
    "49.37.142.98",
    "106.51.23.176",
    "223.186.5.41",
  ];

  const entryCount = faker.number.int({ min: 30, max: 40 });

  const entries: PlatformAuditEntry[] = Array.from({ length: entryCount }, (_, i) => {
    const action = actions[faker.number.int({ min: 0, max: actions.length - 1 })];
    const timestamp = new Date(
      now.getTime() - faker.number.int({ min: 0, max: 30 * 24 * 3_600_000 })
    ).toISOString();
    const ip = ipAddresses[faker.number.int({ min: 0, max: ipAddresses.length - 1 })];

    let target: string;
    let targetId: string;
    let details: string;

    switch (action) {
      case "create_university": {
        const uName = universityNames[faker.number.int({ min: 0, max: universityNames.length - 1 })];
        target = uName;
        targetId = `univ_${String(faker.number.int({ min: 1, max: 12 })).padStart(2, "0")}`;
        details = `Created university "${uName}" and provisioned admin account`;
        break;
      }
      case "suspend_university": {
        const uName = universityNames[faker.number.int({ min: 0, max: universityNames.length - 1 })];
        target = uName;
        targetId = `univ_${String(faker.number.int({ min: 1, max: 12 })).padStart(2, "0")}`;
        details = `Suspended university "${uName}" due to compliance review`;
        break;
      }
      case "login": {
        target = "Platform Admin Portal";
        targetId = "session";
        details = `Successful login from ${ip}`;
        break;
      }
      case "update_settings": {
        target = "Platform Settings";
        targetId = "settings";
        details = "Updated platform configuration: maintenance window, notification preferences";
        break;
      }
      default: {
        target = "Platform";
        targetId = "unknown";
        details = "System action performed";
      }
    }

    return {
      id: `audit_${String(i + 1).padStart(3, "0")}`,
      timestamp,
      actorName: "Platform Admin",
      actorEmail: "admin@glimmora.ai",
      actorRole: "super_admin",
      action,
      target,
      targetId,
      details,
      ipAddress: ip,
    };
  });

  // Sort newest first
  entries.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return entries;
}

// ── Platform Settings ────────────────────────────────────────────────────

export function generatePlatformSettings(): PlatformSettings {
  return {
    platformName: "Glimmora",
    supportEmail: "support@glimmora.ai",
    maxUniversities: 100,
    maxUsersPerUniversity: 50000,
    maintenanceMode: false,
    allowNewRegistrations: true,
    defaultTimezone: "Asia/Kolkata",
    dataRetentionYears: 7,
    emailNotifications: true,
    slackWebhookUrl: "",
  };
}
