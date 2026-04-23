"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Landmark,
  ArrowLeft,
  Mail,
  User,
  MapPin,
  Calendar,
  Building2,
  Plus,
  X,
  Loader2,
  Unlink,
} from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useSuperAdminMinistryDetail,
  useSuperAdminUniversities,
  useLinkUniversity,
} from "@/lib/hooks/use-super-admin";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { University } from "@/lib/api/types/super-admin.types";

function getStatusVariant(
  status: "active" | "suspended"
): "success" | "danger" {
  return status === "active" ? "success" : "danger";
}

function LinkUniversityDialog({
  open,
  onOpenChange,
  ministryId,
  linkedIds,
  allUniversities,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ministryId: string;
  linkedIds: string[];
  allUniversities: University[];
}) {
  const linkUniversity = useLinkUniversity();
  const [selectedId, setSelectedId] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const available = useMemo(
    () => allUniversities.filter((u) => !linkedIds.includes(u.id)),
    [allUniversities, linkedIds]
  );

  const handleLink = useCallback(async () => {
    if (!selectedId) return;
    try {
      await linkUniversity.mutateAsync({
        ministryId,
        universityId: selectedId,
        action: "link",
      });
      const uniName =
        available.find((u) => u.id === selectedId)?.name ?? "University";
      setSuccessMsg(`${uniName} has been linked successfully.`);
      setSelectedId("");
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1500);
    } catch {
      // error shown via mutation state
    }
  }, [selectedId, ministryId, linkUniversity, available, onOpenChange]);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Link University
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Select a university to link to this ministry for oversight.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {available.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                All universities are already linked to this ministry.
              </p>
            ) : (
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">
                  University
                  <span className="ml-0.5 text-danger">*</span>
                </label>
                <select
                  value={selectedId}
                  onChange={(e) => setSelectedId(e.target.value)}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm transition-colors appearance-none hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                >
                  <option value="" disabled>
                    Select a university...
                  </option>
                  {available.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.name} ({u.city}, {u.country})
                    </option>
                  ))}
                </select>
              </div>
            )}

            {linkUniversity.isError && (
              <p className="text-xs text-danger">
                Failed to link university. Please try again.
              </p>
            )}
            {successMsg && (
              <p className="text-xs text-success">{successMsg}</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                onClick={handleLink}
                disabled={
                  !selectedId ||
                  linkUniversity.isPending ||
                  available.length === 0
                }
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {linkUniversity.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Link University
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function SuperAdminMinistryDetailPage({
  params,
}: {
  params: Promise<{ ministryId: string }>;
}) {
  const { ministryId } = use(params);
  const {
    data: ministry,
    isLoading,
    isError,
    refetch,
  } = useSuperAdminMinistryDetail(ministryId);

  const { data: universitiesData } = useSuperAdminUniversities({
    pageSize: 100,
  });

  const linkUniversity = useLinkUniversity();

  const [linkDialogOpen, setLinkDialogOpen] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    variant: "default" | "danger";
    confirmLabel: string;
    action: () => Promise<void>;
  }>({
    open: false,
    title: "",
    description: "",
    variant: "default",
    confirmLabel: "Confirm",
    action: async () => {},
  });

  const [feedback, setFeedback] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);

  const showFeedback = useCallback(
    (type: "success" | "error", message: string) => {
      setFeedback({ type, message });
      setTimeout(() => setFeedback(null), 5000);
    },
    []
  );

  const handleUnlink = useCallback(
    (university: University) => {
      if (!ministry) return;
      setConfirmDialog({
        open: true,
        title: "Unlink University",
        description: `Are you sure you want to unlink "${university.name}" from "${ministry.name}"? This will remove the oversight relationship.`,
        variant: "danger",
        confirmLabel: "Unlink",
        action: async () => {
          try {
            await linkUniversity.mutateAsync({
              ministryId: ministry.id,
              universityId: university.id,
              action: "unlink",
            });
            showFeedback(
              "success",
              `"${university.name}" has been unlinked from this ministry.`
            );
          } catch {
            showFeedback("error", "Failed to unlink university.");
          }
        },
      });
    },
    [ministry, linkUniversity, showFeedback]
  );

  const allUniversities = universitiesData?.data ?? [];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Link
          href="/super-admin/ministries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Ministries
        </Link>
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !ministry) {
    return (
      <div className="space-y-6">
        <Link
          href="/super-admin/ministries"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Ministries
        </Link>
        <ErrorState
          title="Failed to load ministry"
          message="Could not retrieve ministry details. Please try again."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const linkedUniversities = ministry.linkedUniversities ?? [];

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/super-admin/ministries"
          className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Ministries
        </Link>
        <PageHeader
          icon={Landmark}
          title={ministry.name}
          actions={
            <StatusBadge
              variant={getStatusVariant(ministry.status)}
              dot
              size="md"
            >
              {ministry.status}
            </StatusBadge>
          }
        />
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={cn(
            "rounded-lg px-4 py-3 text-sm font-medium",
            feedback.type === "success"
              ? "bg-success-light text-success"
              : "bg-danger-light text-danger"
          )}
        >
          {feedback.message}
        </div>
      )}

      {/* Profile Card */}
      <div className="rounded-xl border border-border bg-card p-6">
        <h3 className="text-sm font-semibold">Ministry Information</h3>
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2">
          <div className="flex items-center gap-3">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Country</p>
              <p className="text-sm font-medium">{ministry.country}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Mail className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contact Email</p>
              <p className="text-sm font-medium">{ministry.contactEmail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <User className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Contact Name</p>
              <p className="text-sm font-medium">{ministry.contactName}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <div>
              <p className="text-xs text-muted-foreground">Created</p>
              <p className="text-sm font-medium">
                {formatDate(ministry.createdAt)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Linked Universities */}
      <div className="rounded-xl border border-border bg-card p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold">Linked Universities</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {linkedUniversities.length} universit
              {linkedUniversities.length === 1 ? "y" : "ies"} under oversight
            </p>
          </div>
          <button
            onClick={() => setLinkDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-3 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-3.5 w-3.5" />
            Link University
          </button>
        </div>

        {linkedUniversities.length === 0 ? (
          <div className="mt-6 flex flex-col items-center justify-center py-8 text-center">
            <Building2 className="h-8 w-8 text-muted-foreground/50" />
            <p className="mt-3 text-sm font-medium text-muted-foreground">
              No universities linked
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Link universities to establish oversight relationships.
            </p>
          </div>
        ) : (
          <div className="mt-4 space-y-3">
            {linkedUniversities.map((uni) => (
              <div
                key={uni.id}
                className="flex items-center justify-between rounded-lg border border-border px-4 py-3 transition-colors hover:bg-muted/50"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-portal-accent-light">
                    <Building2 className="h-4 w-4 text-portal-accent" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{uni.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {uni.city}, {uni.country} &middot; {uni.domain}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge variant={getStatusVariant(uni.status)} dot>
                    {uni.status}
                  </StatusBadge>
                  <button
                    onClick={() => handleUnlink(uni)}
                    disabled={linkUniversity.isPending}
                    className="rounded-lg border border-border p-2 text-muted-foreground transition-colors hover:border-danger hover:bg-danger-light hover:text-danger disabled:opacity-50"
                    title="Unlink university"
                  >
                    <Unlink className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <LinkUniversityDialog
        open={linkDialogOpen}
        onOpenChange={setLinkDialogOpen}
        ministryId={ministryId}
        linkedIds={ministry.linkedUniversityIds}
        allUniversities={allUniversities}
      />

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) =>
          setConfirmDialog((prev) => ({ ...prev, open }))
        }
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
        confirmLabel={confirmDialog.confirmLabel}
        onConfirm={confirmDialog.action}
      />
    </div>
  );
}
