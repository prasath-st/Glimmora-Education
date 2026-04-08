"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ClipboardList,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import { useApplications } from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { DataTable } from "@/components/shared/data-table/data-table";
import { Timeline } from "@/components/shared/misc/timeline";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { EmptyState } from "@/components/shared/feedback/empty-state";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { PIPELINE_STAGE_LABELS } from "@/lib/utils/constants";
import type { ColumnDef } from "@tanstack/react-table";
import type { Application } from "@/lib/api/types/student.types";
import type { PipelineStage } from "@/lib/api/types/common.types";

function getStageVariant(stage: PipelineStage): "default" | "success" | "warning" | "danger" | "info" {
  const map: Record<PipelineStage, "default" | "success" | "warning" | "danger" | "info"> = {
    matched: "default",
    applied: "info",
    interviewed: "warning",
    offered: "success",
    placed: "success",
    rejected: "danger",
  };
  return map[stage] || "default";
}

const PIPELINE_ORDER: PipelineStage[] = ["matched", "applied", "interviewed", "offered", "placed"];

export default function StudentPlacementApplicationsPage() {
  const [page, setPage] = useState(1);
  const { data, isLoading, isError, refetch } = useApplications({ page, pageSize: 20 });
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/student/placement"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Placement
        </Link>
        <PageHeader icon={ClipboardList} title="My Applications" description="Track your application pipeline" />
        <TableSkeleton rows={6} />
      </div>
    );
  }

  if (isError) return <ErrorState onRetry={() => refetch()} />;

  const applications = data?.applications ?? [];

  // Pipeline summary
  const stageCounts = PIPELINE_ORDER.reduce<Record<string, number>>((acc, stage) => {
    acc[stage] = applications.filter((a) => a.status === stage).length;
    return acc;
  }, {});
  const rejectedCount = applications.filter((a) => a.status === "rejected").length;

  return (
    <div className="space-y-6">
      <Link
        href="/student/placement"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Placement
      </Link>

      <PageHeader
        icon={ClipboardList}
        title="My Applications"
        description="Track your application pipeline"
      />

      {/* Pipeline Summary */}
      <div className="flex flex-wrap gap-3">
        {PIPELINE_ORDER.map((stage) => (
          <div
            key={stage}
            className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3"
          >
            <StatusBadge variant={getStageVariant(stage)} dot>
              {PIPELINE_STAGE_LABELS[stage]}
            </StatusBadge>
            <span className="text-lg font-semibold">{stageCounts[stage] || 0}</span>
          </div>
        ))}
        {rejectedCount > 0 && (
          <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3">
            <StatusBadge variant="danger" dot>
              Rejected
            </StatusBadge>
            <span className="text-lg font-semibold">{rejectedCount}</span>
          </div>
        )}
      </div>

      {/* Applications list */}
      {applications.length === 0 ? (
        <EmptyState
          icon={ClipboardList}
          title="No applications yet"
          description="Apply to jobs to see your application pipeline here."
          action={{
            label: "Browse Jobs",
            onClick: () => window.location.assign("/student/placement/jobs"),
          }}
        />
      ) : (
        <div className="space-y-3">
          {applications.map((app) => {
            const isExpanded = expandedId === app.id;
            return (
              <div
                key={app.id}
                className="rounded-xl border border-border bg-card overflow-hidden"
              >
                <button
                  onClick={() => setExpandedId(isExpanded ? null : app.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-muted/50"
                >
                  <div className="flex-shrink-0">
                    {isExpanded ? (
                      <ChevronDown className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{app.jobTitle}</p>
                    <p className="text-xs text-muted-foreground">{app.company}</p>
                  </div>
                  <StatusBadge variant={getStageVariant(app.status)} dot>
                    {PIPELINE_STAGE_LABELS[app.status]}
                  </StatusBadge>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Applied</p>
                    <p className="text-xs font-medium">{formatDate(app.appliedDate)}</p>
                  </div>
                  <div className="hidden text-right sm:block">
                    <p className="text-xs text-muted-foreground">Last Activity</p>
                    <p className="text-xs font-medium">{formatRelative(app.lastActivityDate)}</p>
                  </div>
                  {app.nextStep && (
                    <div className="hidden text-right lg:block">
                      <p className="text-xs text-muted-foreground">Next Step</p>
                      <p className="text-xs font-medium text-portal-accent">{app.nextStep}</p>
                    </div>
                  )}
                </button>

                {isExpanded && (
                  <div className="border-t border-border px-5 py-4">
                    <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Application Timeline
                    </h4>
                    <Timeline
                      items={app.timeline.map((t, i) => ({
                        id: `${app.id}-${i}`,
                        title: t.event,
                        date: formatDate(t.date),
                        variant: getStageVariant(t.status),
                      }))}
                    />
                    {app.notes && (
                      <div className="mt-4 rounded-lg bg-muted/50 p-3">
                        <p className="text-xs font-medium text-muted-foreground">Notes</p>
                        <p className="mt-1 text-sm">{app.notes}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {data?.meta && data.meta.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {data.meta.page} of {data.meta.totalPages}
          </p>
          <div className="flex gap-2">
            <button
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Previous
            </button>
            <button
              disabled={page >= (data.meta.totalPages || 1)}
              onClick={() => setPage((p) => p + 1)}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
