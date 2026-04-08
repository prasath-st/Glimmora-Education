"use client";

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Award, FileText, Shield } from "lucide-react";
import { useCredentials } from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { SearchInput } from "@/components/shared/forms/search-input";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import type { Credential } from "@/lib/api/types/student.types";
import type { CredentialStatus } from "@/lib/api/types/common.types";

type CredentialType = Credential["type"];

const typeFilters: { value: CredentialType | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "degree", label: "Degrees" },
  { value: "certificate", label: "Certificates" },
  { value: "badge", label: "Badges" },
  { value: "transcript", label: "Transcripts" },
];

function getCredentialStatusVariant(status: CredentialStatus) {
  const map: Record<CredentialStatus, "success" | "danger" | "warning" | "info" | "muted"> = {
    active: "success",
    revoked: "danger",
    expired: "warning",
    pending_verification: "info",
  };
  return map[status] || "muted";
}

function getTypeIcon(type: CredentialType) {
  switch (type) {
    case "degree":
      return BadgeCheck;
    case "certificate":
      return Award;
    case "badge":
      return Shield;
    case "transcript":
      return FileText;
    default:
      return BadgeCheck;
  }
}

export default function StudentCredentialsPage() {
  const { data: credentials, isLoading, isError, refetch } = useCredentials();
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<CredentialType | "all">("all");
  const router = useRouter();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageHeader icon={BadgeCheck} title="Credentials" description="Your digital credential wallet" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const filtered = (credentials ?? []).filter((c) => {
    if (typeFilter !== "all" && c.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        c.title.toLowerCase().includes(q) ||
        c.issuer.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={BadgeCheck}
        title="Credentials"
        description="Your digital credential wallet"
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
          {typeFilters.map((f) => (
            <button
              key={f.value}
              onClick={() => setTypeFilter(f.value)}
              className={cn(
                "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                typeFilter === f.value
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
        <SearchInput
          value={search}
          onSearch={setSearch}
          placeholder="Search credentials..."
          className="w-full sm:max-w-xs"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={BadgeCheck}
          title="No credentials yet"
          description={
            search || typeFilter !== "all"
              ? "Try adjusting your filters."
              : "Your credentials will appear here once they are issued."
          }
        />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((cred) => {
            const Icon = getTypeIcon(cred.type);
            return (
              <button
                key={cred.id}
                onClick={() => router.push(`/student/credentials/${cred.id}`)}
                className="group rounded-xl border border-border bg-card p-5 text-left transition-all hover:border-portal-accent/50 hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-portal-accent-light">
                    <Icon className="h-5 w-5 text-portal-accent" />
                  </div>
                  <StatusBadge variant={getCredentialStatusVariant(cred.status)} dot>
                    {cred.status.replace("_", " ")}
                  </StatusBadge>
                </div>
                <h3 className="mt-3 text-sm font-semibold group-hover:text-portal-accent">
                  {cred.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">{cred.issuer}</p>
                <div className="mt-3 flex items-center justify-between">
                  <StatusBadge variant="muted">{cred.type}</StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {formatDate(cred.issuedDate)}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
