"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/config/navigation";

export default function FacultyLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Faculty Portal" sections={PORTAL_NAVIGATION.faculty}>
      {children}
    </PortalShell>
  );
}
