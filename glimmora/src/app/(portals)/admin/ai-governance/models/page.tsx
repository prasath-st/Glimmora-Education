"use client";

import { useState, useCallback, useEffect } from "react";
import Link from "next/link";
import {
  Cpu,
  ArrowLeft,
  ChevronDown,
  ChevronRight,
  Calendar,
  Database,
  User,
  RefreshCw,
  Pencil,
  Ban,
  ArchiveRestore,
  Loader2,
  MoreHorizontal,
} from "lucide-react";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { toast } from "sonner";
import {
  useAiModels,
  useUpdateAiModel,
  useTriggerRetrain,
} from "@/lib/hooks/use-admin";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { FormField } from "@/components/shared/forms/form-field";
import {
  formatPercentage,
  formatNumber,
  formatRelative,
} from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AiModel } from "@/lib/api/types/admin.types";

function getModelStatusVariant(
  status: AiModel["status"],
): "success" | "muted" | "warning" | "danger" {
  const map = {
    active: "success" as const,
    inactive: "muted" as const,
    training: "warning" as const,
    deprecated: "danger" as const,
  };
  return map[status];
}

function ModelRowActions({
  model,
  onRetrain,
  onEditOwner,
  onToggleDeprecate,
}: {
  model: AiModel;
  onRetrain: () => void;
  onEditOwner: () => void;
  onToggleDeprecate: () => void;
}) {
  const isDeprecated = model.status === "deprecated";
  const retrainDisabled =
    model.status === "training" || model.status === "deprecated";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Model actions"
          className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        >
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={4}
          onClick={(e) => e.stopPropagation()}
          className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          <DropdownMenu.Item
            onSelect={onRetrain}
            disabled={retrainDisabled}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
          >
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            {model.status === "training" ? "Retraining…" : "Trigger Retrain"}
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onEditOwner}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Edit owner
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onToggleDeprecate}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isDeprecated ? "text-success" : "text-danger",
            )}
          >
            {isDeprecated ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Reactivate
              </>
            ) : (
              <>
                <Ban className="h-4 w-4" /> Deprecate
              </>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function ModelCard({ model }: { model: AiModel }) {
  const [expanded, setExpanded] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deprecateOpen, setDeprecateOpen] = useState(false);
  const [retrainOpen, setRetrainOpen] = useState(false);
  const updateModel = useUpdateAiModel();
  const triggerRetrain = useTriggerRetrain();

  const handleDeprecate = useCallback(async () => {
    const next: AiModel["status"] =
      model.status === "deprecated" ? "active" : "deprecated";
    try {
      await updateModel.mutateAsync({ id: model.id, status: next });
      toast.success(
        next === "deprecated"
          ? `${model.name} deprecated`
          : `${model.name} reactivated`,
      );
    } catch {
      toast.error("Failed to update model status");
    }
  }, [model, updateModel]);

  const handleRetrain = useCallback(async () => {
    try {
      await triggerRetrain.mutateAsync(model.id);
      toast.success(
        `Retraining started for ${model.name}. Status will update when complete.`,
      );
    } catch {
      toast.error("Failed to trigger retrain");
    }
  }, [model, triggerRetrain]);

  return (
    <div className="rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 p-6">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex flex-1 items-start gap-3 text-left"
        >
          {expanded ? (
            <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <ChevronRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
          )}
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-sm font-semibold">{model.name}</h3>
              <StatusBadge variant="muted">v{model.version}</StatusBadge>
              <StatusBadge variant={getModelStatusVariant(model.status)} dot>
                {model.status}
              </StatusBadge>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {model.domain}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
              <span>Accuracy: {formatPercentage(model.accuracy * 100)}</span>
              <span>Bias: {model.biasScore.toFixed(2)}</span>
              <span className="flex items-center gap-1">
                <Database className="h-3 w-3" />
                {formatNumber(model.dataPoints)} data points
              </span>
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Trained {formatRelative(model.lastTrainedAt)}
              </span>
            </div>
          </div>
        </button>
        <ModelRowActions
          model={model}
          onRetrain={() => setRetrainOpen(true)}
          onEditOwner={() => setEditOpen(true)}
          onToggleDeprecate={() => setDeprecateOpen(true)}
        />
      </div>
      {expanded && (
        <div className="space-y-4 border-t border-border p-6">
          <div>
            <p className="text-xs font-medium text-muted-foreground">
              Description
            </p>
            <p className="mt-1 text-sm">{model.description}</p>
          </div>
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-muted-foreground" />
            <p className="text-sm">
              <span className="text-muted-foreground">Owner:</span>{" "}
              {model.owner}
            </p>
          </div>
          {model.fairnessMetrics.length > 0 && (
            <div>
              <p className="mb-2 text-xs font-medium text-muted-foreground">
                Fairness Metrics by Demographic
              </p>
              <div className="space-y-2">
                {model.fairnessMetrics.map((fm) => (
                  <div
                    key={fm.demographic}
                    className="flex items-center gap-3"
                  >
                    <span className="w-28 text-xs text-muted-foreground">
                      {fm.demographic}
                    </span>
                    <div className="h-2 flex-1 rounded-full bg-muted">
                      <div
                        className="h-2 rounded-full bg-portal-accent transition-all"
                        style={{ width: `${Math.min(fm.score * 100, 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right text-xs font-medium">
                      {(fm.score * 100).toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <EditOwnerDrawer
        open={editOpen}
        onClose={() => setEditOpen(false)}
        model={model}
      />
      <ConfirmDialog
        open={retrainOpen}
        onOpenChange={setRetrainOpen}
        title="Trigger Retraining"
        description={`Retrain ${model.name} on the latest dataset? Status will switch to "training" and update on completion. Existing predictions remain available during retraining.`}
        confirmLabel="Trigger Retrain"
        onConfirm={handleRetrain}
      />
      <ConfirmDialog
        open={deprecateOpen}
        onOpenChange={setDeprecateOpen}
        title={
          model.status === "deprecated" ? "Reactivate Model" : "Deprecate Model"
        }
        description={
          model.status === "deprecated"
            ? `Reactivate ${model.name}? It will resume serving predictions.`
            : `Deprecate ${model.name}? It will stop serving new predictions; downstream consumers should migrate. Existing predictions remain in the audit log.`
        }
        confirmLabel={model.status === "deprecated" ? "Reactivate" : "Deprecate"}
        variant={model.status === "deprecated" ? "default" : "danger"}
        onConfirm={handleDeprecate}
      />
    </div>
  );
}

function EditOwnerDrawer({
  open,
  onClose,
  model,
}: {
  open: boolean;
  onClose: () => void;
  model: AiModel;
}) {
  const [owner, setOwner] = useState(model.owner);
  const [error, setError] = useState("");
  const updateModel = useUpdateAiModel();

  // Re-seed local state whenever the drawer opens so a previous unsaved edit
  // doesn't leak across opens (or across models if the user switches).
  useEffect(() => {
    if (open) {
      setOwner(model.owner);
      setError("");
    }
  }, [open, model.owner]);

  const handleSave = useCallback(async () => {
    setError("");
    if (!owner.trim()) {
      setError("Owner name is required");
      return;
    }
    try {
      await updateModel.mutateAsync({ id: model.id, owner: owner.trim() });
      toast.success(`Owner updated to ${owner.trim()}`);
      onClose();
    } catch {
      setError("Failed to update owner");
    }
  }, [owner, model.id, updateModel, onClose]);

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="md"
      title="Edit Model Owner"
      description={`Update the responsible owner for ${model.name}. Used for escalations and audits.`}
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={updateModel.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {updateModel.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            Save changes
          </button>
        </div>
      }
    >
      <FormField
        label="Owner"
        placeholder="e.g. Dr. Aarav Sharma — AI Governance Lead"
        value={owner}
        onChange={(e) => setOwner(e.target.value)}
        error={error}
        hint="Person accountable for this model — receives escalations and audit notices."
        required
      />
    </SlideDrawer>
  );
}

export default function AdminAiModelsPage() {
  const { data: models, isLoading, isError, refetch } = useAiModels();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="All registered AI models"
        />
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !models) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/ai-governance"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="All registered AI models"
        />
        <ErrorState
          title="Failed to load models"
          message="Could not retrieve AI model data. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/ai-governance"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to AI Governance
        </Link>
        <PageHeader
          icon={Cpu}
          title="Model Registry"
          description="View and manage all registered AI models, their performance metrics, and fairness scores"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        Models are automatically retrained based on data drift detection. Last
        system-wide retraining check: 7 days ago.
      </p>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {models.map((model) => (
          <ModelCard key={model.id} model={model} />
        ))}
      </div>
    </div>
  );
}
