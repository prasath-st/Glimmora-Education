"use client";

import type { ReactNode } from "react";
import { PortalShell } from "@/components/layout/portal-shell";
import { PORTAL_NAVIGATION } from "@/config/navigation";

export default function MinistryLayout({ children }: { children: ReactNode }) {
  return (
    <PortalShell portalName="Ministry Portal" sections={PORTAL_NAVIGATION.ministry}>
      {children}
    </PortalShell>
  );
}
