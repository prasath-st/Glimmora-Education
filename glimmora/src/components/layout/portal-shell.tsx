"use client";

import type { ReactNode } from "react";
import { Sidebar } from "./sidebar";
import { Header } from "./header";
import { useUiStore } from "@/lib/stores/ui-store";
import { cn } from "@/lib/utils/cn";
import type { NavSection } from "@/config/navigation";

interface PortalShellProps {
  portalName: string;
  sections: NavSection[];
  children: ReactNode;
}

export function PortalShell({
  portalName,
  sections,
  children,
}: PortalShellProps) {
  const { sidebarCollapsed } = useUiStore();

  return (
    <div className="min-h-screen bg-background">
      {/* Sidebar — hidden on mobile */}
      <div className="hidden lg:block">
        <Sidebar portalName={portalName} sections={sections} />
      </div>

      {/* Main content area */}
      <div
        className={cn(
          "transition-all duration-200",
          sidebarCollapsed ? "lg:pl-[68px]" : "lg:pl-[260px]"
        )}
      >
        <Header />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
