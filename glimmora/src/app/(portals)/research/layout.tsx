"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/config/navigation";

export default function ResearchLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Research Portal" sections={PORTAL_NAVIGATION.research}>
      {children}
    </PortalShell>
  );
}
