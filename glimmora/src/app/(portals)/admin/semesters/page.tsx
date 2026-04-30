"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  X,
  ChevronRight,
  ChevronDown,
  Pencil,
  CalendarDays,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateNestedSemester,
} from "@/lib/hooks/use-admin";
import {
  createAcademicYearSchema,
  type CreateAcademicYearFormData,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { FormField } from "@/components/shared/forms/form-field";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AcademicYear, Semester } from "@/lib/api/types/admin.types";

function getStatusVariant(
  status: "upcoming" | "active" | "completed"
): "info" | "success" | "muted" {
  const map = {
    upcoming: "info" as const,
    active: "success" as const,
    completed: "muted" as const,
  };
  return map[status];
}

/* ── Create Academic Year Dialog ────────────────────────────────────────── */

function CreateAcademicYearDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createYear = useCreateAcademicYear();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearFormData>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "" },
  });

  const onSubmit = useCallback(
    async (data: CreateAcademicYearFormData) => {
      try {
        await createYear.mutateAsync(data);
        setSuccessMsg(
          `${data.name} created with two semesters (Fall + Spring). Adjust dates as needed.`
        );
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1500);
      } catch {
        // shown via mutation state
      }
    },
    [createYear, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create Academic Year
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Two semesters (Fall + Spring) will be auto-created. You can edit each semester&apos;s dates afterwards.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            <FormField
              label="Academic Year Name"
              placeholder="e.g. AY 2026-2027"
              error={errors.name?.message}
              required
              {...register("name")}
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

            {createYear.isError && (
              <p className="text-xs text-danger">
                Failed to create academic year. Please check the details.
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
                disabled={createYear.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createYear.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Year
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Edit Semester Dialog ──────────────────────────────────────────────── */

function EditSemesterDialog({
  open,
  onOpenChange,
  semester,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semester: Semester | null;
}) {
  const updateSemester = useUpdateNestedSemester();
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (semester && open) {
      setName(semester.name);
      setStartDate(semester.startDate);
      setEndDate(semester.endDate);
      setError("");
    }
  }, [semester, open]);

  const handleSave = useCallback(async () => {
    if (!semester) return;
    setError("");
    if (!name || !startDate || !endDate) {
      setError("All fields are required");
      return;
    }
    if (new Date(endDate) <= new Date(startDate)) {
      setError("End date must be after start date");
      return;
    }
    try {
      await updateSemester.mutateAsync({
        id: semester.id,
        name,
        startDate,
        endDate,
      });
      toast.success(`${name} updated`);
      onOpenChange(false);
    } catch {
      setError("Failed to update semester");
    }
  }, [semester, name, startDate, endDate, updateSemester, onOpenChange]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setName("");
          setStartDate("");
          setEndDate("");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Edit Semester
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Update semester details. Status is auto-derived from dates.
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            <div>
              <label className="text-sm font-medium">Semester Name</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                placeholder="e.g. Fall 2026"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm font-medium">Start Date</label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
              <div>
                <label className="text-sm font-medium">End Date</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="mt-1.5 flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
                />
              </div>
            </div>
            {error && <p className="text-xs text-danger">{error}</p>}
            <div className="flex justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => onOpenChange(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={updateSemester.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {updateSemester.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Save Changes
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Year Row ──────────────────────────────────────────────────────────── */

function YearRow({
  year,
  expanded,
  onToggle,
  onEditSemester,
}: {
  year: AcademicYear;
  expanded: boolean;
  onToggle: () => void;
  onEditSemester: (sem: Semester) => void;
}) {
  const totalCourses = year.semesters.reduce((sum, s) => sum + s.courseCount, 0);
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Year header */}
      <button
        onClick={onToggle}
        className="grid w-full grid-cols-[24px_2fr_1fr_1fr_120px] items-center gap-3 px-5 py-4 text-left transition-colors hover:bg-muted/40"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <div>
          <p className="text-base font-semibold">{year.name}</p>
          <p className="text-xs text-muted-foreground">
            {year.semesters.length} semester{year.semesters.length !== 1 ? "s" : ""} · {totalCourses} course{totalCourses !== 1 ? "s" : ""}
          </p>
        </div>
        <p className="text-sm text-muted-foreground">
          {formatDate(year.startDate)} → {formatDate(year.endDate)}
        </p>
        <div />
        <div className="flex justify-end">
          <StatusBadge variant={getStatusVariant(year.status)} dot>
            {year.status}
          </StatusBadge>
        </div>
      </button>

      {/* Nested semesters */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-5 py-3">
          {year.semesters.length === 0 ? (
            <p className="text-center text-xs text-muted-foreground py-4">
              No semesters under this academic year.
            </p>
          ) : (
            <div className="space-y-2">
              {year.semesters.map((sem) => (
                <div
                  key={sem.id}
                  className="grid grid-cols-[2fr_1fr_1fr_80px_60px] items-center gap-3 rounded-lg bg-background px-4 py-3 ring-1 ring-border/50"
                >
                  <div className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{sem.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium text-portal-accent">{sem.courseCount}</span>
                    <span className="ml-1 text-muted-foreground">courses</span>
                  </p>
                  <StatusBadge variant={getStatusVariant(sem.status)} dot>
                    {sem.status}
                  </StatusBadge>
                  <div className="flex justify-end">
                    <button
                      onClick={() => onEditSemester(sem)}
                      className={cn(
                        "rounded-lg p-1.5 transition-colors hover:bg-muted text-muted-foreground hover:text-foreground",
                        sem.status === "completed" && "opacity-50 pointer-events-none"
                      )}
                      title={sem.status === "completed" ? "Cannot edit completed semester" : "Edit semester"}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function AdminAcademicCalendarPage() {
  const [createOpen, setCreateOpen] = useState(false);
  const [editSemester, setEditSemester] = useState<{ open: boolean; semester: Semester | null }>({
    open: false,
    semester: null,
  });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: years, isLoading, isError, refetch } = useAcademicYears();

  const handleToggle = useCallback((id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  // Default-expand the active year on first load
  useEffect(() => {
    if (years && years.length > 0) {
      setExpanded((prev) => {
        if (Object.keys(prev).length > 0) return prev;
        const active = years.find((y) => y.status === "active");
        return active ? { [active.id]: true } : prev;
      });
    }
  }, [years]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Academic Calendar"
        description="Manage academic years and their semesters"
        actions={
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            New Academic Year
          </button>
        }
      />

      {isLoading ? (
        <TableSkeleton rows={3} />
      ) : isError ? (
        <ErrorState
          title="Failed to load academic calendar"
          message="Could not retrieve academic years. Please try again."
          onRetry={() => refetch()}
        />
      ) : !years || years.length === 0 ? (
        <div className="rounded-xl border border-border bg-card px-6 py-12 text-center">
          <Calendar className="mx-auto h-10 w-10 text-muted-foreground/50" />
          <p className="mt-3 text-sm font-medium">No academic years yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            Create your first academic year to start scheduling semesters.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {years.map((year) => (
            <YearRow
              key={year.id}
              year={year}
              expanded={!!expanded[year.id]}
              onToggle={() => handleToggle(year.id)}
              onEditSemester={(sem) => setEditSemester({ open: true, semester: sem })}
            />
          ))}
        </div>
      )}

      <CreateAcademicYearDialog open={createOpen} onOpenChange={setCreateOpen} />
      <EditSemesterDialog
        open={editSemester.open}
        onOpenChange={(o) => setEditSemester((p) => ({ ...p, open: o }))}
        semester={editSemester.semester}
      />
    </div>
  );
}
