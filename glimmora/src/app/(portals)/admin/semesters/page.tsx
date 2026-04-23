"use client";

import { useState, useCallback } from "react";
import { Calendar, Plus, Loader2, X } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { useSemesters, useCreateSemester } from "@/lib/hooks/use-admin";
import {
  createSemesterSchema,
  type CreateSemesterFormData,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { FormField } from "@/components/shared/forms/form-field";
import { formatDate } from "@/lib/utils/format";
import type { Semester } from "@/lib/api/types/admin.types";

function getSemesterStatusVariant(
  status: "upcoming" | "active" | "completed"
): "info" | "success" | "muted" {
  const map = {
    upcoming: "info" as const,
    active: "success" as const,
    completed: "muted" as const,
  };
  return map[status];
}

function CreateSemesterDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createSemester = useCreateSemester();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSemesterFormData>({
    resolver: zodResolver(createSemesterSchema),
    defaultValues: { name: "", year: "", startDate: "", endDate: "" },
  });

  const onSubmit = useCallback(
    async (data: CreateSemesterFormData) => {
      try {
        await createSemester.mutateAsync(data);
        setSuccessMsg(`Semester "${data.name}" created successfully.`);
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1500);
      } catch {
        // error shown via mutation state
      }
    },
    [createSemester, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create Semester
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Add a new academic semester.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              label="Semester Name"
              placeholder="e.g. Fall 2026"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <FormField
              label="Year"
              placeholder="e.g. 2026"
              error={errors.year?.message}
              required
              {...register("year")}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Start Date"
                type="date"
                error={errors.startDate?.message}
                required
                {...register("startDate")}
              />
              <FormField
                label="End Date"
                type="date"
                error={errors.endDate?.message}
                required
                {...register("endDate")}
              />
            </div>

            {createSemester.isError && (
              <p className="text-xs text-danger">
                Failed to create semester. Please check the details and try
                again.
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
                type="submit"
                disabled={createSemester.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createSemester.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Semester
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function AdminSemestersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: semesters, isLoading, isError, refetch } = useSemesters();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Semesters"
        description="Manage academic semesters"
        actions={
          <button
            onClick={() => setDialogOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Create Semester
          </button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={5} />
      ) : isError ? (
        <ErrorState
          title="Failed to load semesters"
          message="Could not retrieve semester data. Please try again."
          onRetry={() => refetch()}
        />
      ) : !semesters || semesters.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No semesters found</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first semester to get started.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {semesters.map((semester) => (
            <SemesterCard key={semester.id} semester={semester} />
          ))}
        </div>
      )}

      <CreateSemesterDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}

function SemesterCard({ semester }: { semester: Semester }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-base font-semibold">{semester.name}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {semester.year}
          </p>
        </div>
        <StatusBadge variant={getSemesterStatusVariant(semester.status)} dot>
          {semester.status}
        </StatusBadge>
      </div>

      <div className="mt-4 space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">Start</span>
          <span className="font-medium">{formatDate(semester.startDate)}</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">End</span>
          <span className="font-medium">{formatDate(semester.endDate)}</span>
        </div>
        <div className="border-t border-border pt-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Courses</span>
            <span className="font-semibold text-portal-accent">
              {semester.courseCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
