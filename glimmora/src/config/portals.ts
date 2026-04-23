import {
  GraduationCap,
  BookOpen,
  Shield,
  FlaskConical,
  Briefcase,
  Crown,
  type LucideIcon,
} from "lucide-react";

export type PortalRole =
  | "super_admin"
  | "student"
  | "faculty"
  | "admin"
  | "research"
  | "placement";

export interface PortalConfig {
  name: string;
  basePath: string;
  icon: LucideIcon;
  accent: string;
  description: string;
}

export const PORTALS: Record<PortalRole, PortalConfig> = {
  super_admin: {
    name: "Super Admin",
    basePath: "/super-admin",
    icon: Crown,
    accent: "rose",
    description:
      "Platform administration and university onboarding",
  },
  student: {
    name: "Student Portal",
    basePath: "/student",
    icon: GraduationCap,
    accent: "blue",
    description: "Academic progress, skills, credentials, and career readiness",
  },
  faculty: {
    name: "Faculty Portal",
    basePath: "/faculty",
    icon: BookOpen,
    accent: "green",
    description: "Student oversight, research tools, and grant discovery",
  },
  admin: {
    name: "Administration",
    basePath: "/admin",
    icon: Shield,
    accent: "red",
    description:
      "Institutional health, compliance, user management, and governance",
  },
  research: {
    name: "Research Portal",
    basePath: "/research",
    icon: FlaskConical,
    accent: "purple",
    description:
      "Grant discovery, collaboration networks, and research performance",
  },
  placement: {
    name: "Placement Portal",
    basePath: "/placement",
    icon: Briefcase,
    accent: "amber",
    description:
      "Student-employer matching, pipeline management, and placement analytics",
  },
} as const;

export const PORTAL_ROLES = Object.keys(PORTALS) as PortalRole[];

export function getPortalForRole(role: PortalRole): PortalConfig {
  return PORTALS[role];
}

export function getPortalFromPath(pathname: string): PortalRole | null {
  for (const role of PORTAL_ROLES) {
    if (pathname.startsWith(PORTALS[role].basePath)) {
      return role;
    }
  }
  return null;
}
