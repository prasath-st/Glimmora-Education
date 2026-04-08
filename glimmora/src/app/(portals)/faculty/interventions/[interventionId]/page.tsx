"use client";

import { use, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  UserCheck,
  Loader2,
  CheckCircle2,
  XCircle,
  MessageSquarePlus,
} from "lucide-react";
import {
  useInterventionDetail,
  useUpdateIntervention,
} from "@/lib/hooks/use-faculty";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { Timeline } from "@/components/shared/misc/timeline";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { DashboardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatRelative } from "@/lib/utils/format";

const statusVariant: Record<string, "default" | "success" | "warning" | "danger" | "info" | "muted"> = {
  planned: "info",
  active: "default",
  completed: "success",
  abandoned: "muted",
};

const typeLabels: Record<string, string> = {
  academic_support: "Academic Support",
  counseling: "Counseling",
  mentoring: "Mentoring",
  schedule_adjustment: "Schedule Adjustment",
  financial_aid: "Financial Aid",
};

export default function FacultyInterventionDetailPage({
  params,
}: {
  params: Promise<{ interventionId: string }>;
}) {
  const { interventionId } = use(params);
  const { data: intervention, isLoading, isError, refetch } = useInterventionDetail(interventionId);
  const updateIntervention = useUpdateIntervention();

  const [note, setNote] = useState("");
  const [addingNote, setAddingNote] = useState(false);
  const [outcomes, setOutcomes] = useState("");
  const [editingOutcomes, setEditingOutcomes] = useState(false);
  const [confirmComplete, setConfirmComplete] = useState(false);
  const [confirmAbandon, setConfirmAbandon] = useState(false);

  if (isLoading) return <DashboardSkeleton />;
  if (isError || !intervention) return <ErrorState onRetry={() => refetch()} />;

  const canEdit = intervention.status === "active" || intervention.status === "planned";

  const handleAddNote = async () => {
    if (!note.trim()) return;
    setAddingNote(true);
    try {
      await updateIntervention.mutateAsync({
        id: intervention.id,
        note: note.trim(),
      });
      setNote("");
    } finally {
      setAddingNote(false);
    }
  };

  const handleMarkCompleted = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      status: "completed",
    });
  };

  const handleMarkAbandoned = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      status: "abandoned",
    });
  };

  const handleSaveOutcomes = async () => {
    await updateIntervention.mutateAsync({
      id: intervention.id,
      outcomes: outcomes.trim(),
    });
    setEditingOutcomes(false);
  };

  const timelineItems = [...intervention.notes]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((n, i) => ({
      id: `note-${i}`,
      title: n.author,
      description: n.content,
      date: formatRelative(n.date),
      variant: "default" as const,
    }));

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/faculty/interventions"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Interventions
      </Link>

      {/* Header */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-semibold">{intervention.studentName}</h1>
              <StatusBadge variant={statusVariant[intervention.status]} dot>
                {intervention.status}
              </StatusBadge>
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <StatusBadge variant="muted">
                {typeLabels[intervention.type] || intervention.type}
              </StatusBadge>
              <span className="text-sm text-muted-foreground">
                Started {formatDate(intervention.startDate)}
              </span>
              {intervention.endDate && (
                <span className="text-sm text-muted-foreground">
                  Ended {formatDate(intervention.endDate)}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          {canEdit && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setConfirmComplete(true)}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-success px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-success/90 disabled:opacity-50"
              >
                <CheckCircle2 className="h-4 w-4" />
                Mark Completed
              </button>
              <button
                onClick={() => setConfirmAbandon(true)}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
              >
                <XCircle className="h-4 w-4" />
                Abandon
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Description & Goals */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Description</h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            {intervention.description}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-card p-6">
          <h2 className="text-sm font-semibold">Goals</h2>
          <ul className="mt-2 space-y-2">
            {intervention.goals.map((goal, i) => (
              <li key={i} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-portal-accent-light text-xs font-medium text-portal-accent">
                  {i + 1}
                </span>
                <span className="text-muted-foreground">{goal}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Outcomes Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Outcomes</h2>
          {intervention.status === "completed" && !editingOutcomes && (
            <button
              onClick={() => {
                setOutcomes(intervention.outcomes || "");
                setEditingOutcomes(true);
              }}
              className="text-sm font-medium text-portal-accent hover:underline"
            >
              Edit
            </button>
          )}
        </div>
        {editingOutcomes ? (
          <div className="mt-3 space-y-3">
            <textarea
              value={outcomes}
              onChange={(e) => setOutcomes(e.target.value)}
              className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
              placeholder="Describe the outcomes of this intervention..."
            />
            <div className="flex items-center gap-2">
              <button
                onClick={handleSaveOutcomes}
                disabled={updateIntervention.isPending}
                className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {updateIntervention.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                Save Outcomes
              </button>
              <button
                onClick={() => setEditingOutcomes(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted-foreground">
            {intervention.outcomes || "No outcomes recorded yet."}
          </p>
        )}
      </div>

      {/* Add Note Section */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center gap-2">
          <MessageSquarePlus className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-semibold">Add Note</h2>
        </div>
        <div className="mt-3 space-y-3">
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
            placeholder="Add a note about this intervention..."
          />
          <button
            onClick={handleAddNote}
            disabled={addingNote || !note.trim()}
            className="inline-flex items-center gap-1.5 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {addingNote && <Loader2 className="h-4 w-4 animate-spin" />}
            Add Note
          </button>
        </div>
      </div>

      {/* Notes Timeline */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h2 className="mb-4 text-sm font-semibold">Notes History</h2>
        {timelineItems.length === 0 ? (
          <p className="py-4 text-center text-sm text-muted-foreground">
            No notes yet. Add the first note above.
          </p>
        ) : (
          <Timeline items={timelineItems} />
        )}
      </div>

      {/* Confirm Dialogs */}
      <ConfirmDialog
        open={confirmComplete}
        onOpenChange={setConfirmComplete}
        title="Mark as Completed"
        description="Are you sure you want to mark this intervention as completed? You can still add outcomes afterwards."
        confirmLabel="Mark Completed"
        onConfirm={handleMarkCompleted}
      />
      <ConfirmDialog
        open={confirmAbandon}
        onOpenChange={setConfirmAbandon}
        title="Abandon Intervention"
        description="Are you sure you want to abandon this intervention? This action indicates the intervention was stopped without completion."
        confirmLabel="Abandon"
        variant="danger"
        onConfirm={handleMarkAbandoned}
      />
    </div>
  );
}
