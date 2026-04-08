"use client";

import { use } from "react";
import Link from "next/link";
import {
  Scale,
  ArrowLeft,
  FileText,
  Download,
  CheckCircle2,
} from "lucide-react";
import { useAppealDetail } from "@/lib/hooks/use-student";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { Timeline } from "@/components/shared/misc/timeline";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/format";
import { APPEAL_STATUS_LABELS } from "@/lib/utils/constants";
import type { AppealStatus } from "@/lib/api/types/common.types";

function getAppealStatusVariant(status: AppealStatus) {
  const map: Record<AppealStatus, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
    pending: "warning",
    under_review: "info",
    resolved: "success",
    rejected: "danger",
  };
  return map[status] || "muted";
}

function getTimelineVariant(event: string): "default" | "success" | "warning" | "danger" | "info" {
  if (event.toLowerCase().includes("submit")) return "info";
  if (event.toLowerCase().includes("review")) return "warning";
  if (event.toLowerCase().includes("resolv")) return "success";
  if (event.toLowerCase().includes("reject")) return "danger";
  return "default";
}

export default function StudentAppealDetailPage({
  params,
}: {
  params: Promise<{ appealId: string }>;
}) {
  const { appealId } = use(params);
  const { data: appeal, isLoading, isError, refetch } = useAppealDetail(appealId);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !appeal) return <ErrorState onRetry={() => refetch()} />;

  const scoreChanged = appeal.resolvedScore !== undefined && appeal.resolvedScore !== appeal.currentScore;

  return (
    <div className="space-y-6">
      <Link
        href="/student/appeals"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Appeals
      </Link>

      {/* Appeal Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <StatusBadge variant="default">{appeal.courseCode}</StatusBadge>
              <StatusBadge variant={getAppealStatusVariant(appeal.status)} dot>
                {APPEAL_STATUS_LABELS[appeal.status]}
              </StatusBadge>
            </div>
            <h1 className="mt-2 text-xl font-semibold">{appeal.courseName}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {appeal.assessmentName} ({appeal.assessmentType})
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Current Score</p>
              <p className="text-2xl font-bold">{appeal.currentScore}<span className="text-sm font-normal text-muted-foreground">/{appeal.maxScore}</span></p>
            </div>
            {appeal.resolvedScore !== undefined && (
              <>
                <div className="text-muted-foreground">→</div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Resolved Score</p>
                  <p className={cn(
                    "text-2xl font-bold",
                    scoreChanged ? "text-success" : "text-foreground"
                  )}>
                    {appeal.resolvedScore}<span className="text-sm font-normal text-muted-foreground">/{appeal.maxScore}</span>
                  </p>
                </div>
              </>
            )}
          </div>
        </div>

        <div className="mt-4 text-xs text-muted-foreground">
          Submitted on {formatDate(appeal.createdAt)}
          {appeal.resolvedAt && ` | Resolved on ${formatDate(appeal.resolvedAt)}`}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Left column: Reason + Reviewer Note */}
        <div className="space-y-6 lg:col-span-2">
          {/* Appeal Reason */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-3 text-sm font-semibold">Appeal Reason</h2>
            <p className="text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
              {appeal.appealReason}
            </p>
          </div>

          {/* Reviewer Note */}
          {appeal.reviewerNote && (
            <div className={cn(
              "rounded-xl border p-6",
              appeal.status === "resolved"
                ? "border-success/30 bg-success-light/20"
                : appeal.status === "rejected"
                  ? "border-danger/30 bg-danger-light/20"
                  : "border-border bg-card"
            )}>
              <div className="flex items-center gap-2">
                {appeal.status === "resolved" && <CheckCircle2 className="h-4 w-4 text-success" />}
                <h2 className="text-sm font-semibold">
                  Reviewer Response
                  {appeal.reviewerName && (
                    <span className="ml-1 font-normal text-muted-foreground">
                      from {appeal.reviewerName}
                    </span>
                  )}
                </h2>
              </div>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground whitespace-pre-wrap">
                {appeal.reviewerNote}
              </p>
            </div>
          )}

          {/* Supporting Documents */}
          {appeal.supportingDocuments.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-3 text-sm font-semibold">Supporting Documents</h2>
              <div className="space-y-2">
                {appeal.supportingDocuments.map((doc) => (
                  <a
                    key={doc.url}
                    href={doc.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
                  >
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{doc.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(doc.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    <Download className="h-4 w-4 text-muted-foreground" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right column: Timeline */}
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="mb-4 text-sm font-semibold">Timeline</h2>
          <Timeline
            items={appeal.timeline.map((t, i) => ({
              id: `${appealId}-${i}`,
              title: t.event,
              description: t.actor,
              date: formatDate(t.date),
              variant: getTimelineVariant(t.event),
            }))}
          />
        </div>
      </div>
    </div>
  );
}
