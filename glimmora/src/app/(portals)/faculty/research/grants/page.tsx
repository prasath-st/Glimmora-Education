"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Search,
  Calendar,
  Target,
  TrendingUp,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useFacultyGrants } from "@/lib/hooks/use-faculty";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { GaugeChart } from "@/components/shared/charts/gauge-chart";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatCurrency, formatDate, formatPercentage } from "@/lib/utils/format";
import type { FacultyGrant } from "@/lib/api/types/faculty.types";

type StatusFilter = "all" | "discovered" | "interested" | "drafting" | "submitted" | "funded";

const statusFilters: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "discovered", label: "Discovered" },
  { value: "interested", label: "Interested" },
  { value: "drafting", label: "Drafting" },
  { value: "submitted", label: "Submitted" },
  { value: "funded", label: "Funded" },
];

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  discovered: "info",
  interested: "default",
  drafting: "warning",
  submitted: "muted",
  funded: "success",
  rejected: "danger",
};

export default function FacultyResearchGrantsPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data, isLoading, isError, refetch } = useFacultyGrants({
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  if (isLoading) return <DashboardSkeleton />;
  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const grants = data?.grants ?? [];

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <Link
        href="/faculty/research"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Research
      </Link>

      <PageHeader
        icon={Search}
        title="Grant Radar"
        description="Discover and track funding opportunities"
      />

      {/* Status Filter Tabs */}
      <div className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {statusFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors",
              statusFilter === filter.value
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Grant Cards */}
      {grants.length === 0 ? (
        <EmptyState
          icon={Search}
          title="No grants found"
          description={
            statusFilter === "all"
              ? "No grant opportunities available at this time."
              : `No ${statusFilter} grants found.`
          }
        />
      ) : (
        <div className="space-y-4">
          {grants.map((grant) => (
            <GrantCard
              key={grant.id}
              grant={grant}
              isExpanded={expandedId === grant.id}
              onToggle={() =>
                setExpandedId(expandedId === grant.id ? null : grant.id)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

function GrantCard({
  grant,
  isExpanded,
  onToggle,
}: {
  grant: FacultyGrant;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const deadlineDate = new Date(grant.deadline);
  const isUrgent = deadlineDate.getTime() - Date.now() < 14 * 24 * 60 * 60 * 1000;

  return (
    <div className="rounded-xl border border-border bg-card transition-shadow hover:shadow-sm">
      <div className="p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{grant.title}</h3>
              <StatusBadge variant={statusVariant[grant.status] || "muted"} dot>
                {grant.status}
              </StatusBadge>
            </div>
            <p className="mt-1 text-sm text-muted-foreground">{grant.fundingBody}</p>

            <div className="mt-3 flex flex-wrap gap-4 text-sm">
              <span className="font-semibold">
                {formatCurrency(grant.amount, grant.currency)}
              </span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  isUrgent ? "text-danger font-medium" : "text-muted-foreground"
                )}
              >
                <Calendar className="h-3.5 w-3.5" />
                {formatDate(grant.deadline)}
              </span>
              <span className="flex items-center gap-1 text-portal-accent font-medium">
                <Target className="h-3.5 w-3.5" />
                {grant.alignmentScore}% match
              </span>
              <span className="flex items-center gap-1 text-muted-foreground">
                <TrendingUp className="h-3.5 w-3.5" />
                {formatPercentage(grant.successProbability, 0)} success probability
              </span>
            </div>

            {/* Topics */}
            <div className="mt-3 flex flex-wrap gap-1.5">
              {grant.topics.map((topic, i) => (
                <span
                  key={i}
                  className="rounded-md bg-muted px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Expand/Collapse */}
        <button
          onClick={onToggle}
          className="mt-4 flex items-center gap-1.5 text-sm font-medium text-portal-accent hover:underline"
        >
          {isExpanded ? (
            <>
              <ChevronUp className="h-4 w-4" />
              Hide details
            </>
          ) : (
            <>
              <ChevronDown className="h-4 w-4" />
              Show details
            </>
          )}
        </button>
      </div>

      {/* Expanded Details */}
      {isExpanded && (
        <div className="border-t border-border px-6 py-4 space-y-4">
          {/* Requirements */}
          {grant.requirements.length > 0 && (
            <div>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Requirements
              </h4>
              <ul className="mt-2 space-y-1">
                {grant.requirements.map((req, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                    <span className="mt-1.5 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-muted-foreground" />
                    {req}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Match Explanation */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Why this matches
            </h4>
            <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
              {grant.matchExplanation}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
