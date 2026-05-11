"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Calendar,
  Plus,
  Loader2,
  ChevronRight,
  ChevronDown,
  Pencil,
  CalendarDays,
  MoreHorizontal,
  Trash2,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  useAcademicYears,
  useCreateAcademicYear,
  useUpdateAcademicYear,
  useDeleteAcademicYear,
  useCreateNestedSemester,
  useUpdateNestedSemester,
  useDeleteSemester,
} from "@/lib/hooks/use-admin";
import {
  createAcademicYearSchema,
  type CreateAcademicYearFormData,
  createSemesterSchema,
  type CreateSemesterFormData,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { FormField } from "@/components/shared/forms/form-field";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { formatDate } from "@/lib/utils/format";
import { ApiError } from "@/lib/api/client";
import type { AcademicYear, Semester } from "@/lib/api/types/admin.types";

function getStatusVariant(
  status: "upcoming" | "active" | "completed",
): "info" | "success" | "muted" {
  const map = {
    upcoming: "info" as const,
    active: "success" as const,
    completed: "muted" as const,
  };
  return map[status];
}

// Surface backend field-level messages (e.g. "Cannot delete: 12 courses are
// scheduled in this semester") instead of the generic "Validation failed".
function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.details) {
    const first = Object.values(err.details).find(
      (m) => Array.isArray(m) && m.length > 0,
    );
    if (first && first[0]) return first[0];
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// Pull the YYYY year label out of an arbitrary year name like "AY 2026-2027".
function deriveYearLabel(yearName: string, startDate: string): string {
  const numeric = yearName.replace(/[^0-9]/g, "").slice(0, 4);
  if (numeric.length === 4) return numeric;
  return new Date(startDate).getFullYear().toString();
}

/* ── Create / Edit Academic Year Drawer ────────────────────────────────── */

function AcademicYearDrawer({
  open,
  onClose,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  editing: AcademicYear | null;
}) {
  const createYear = useCreateAcademicYear();
  const updateYear = useUpdateAcademicYear();
  const isEditing = !!editing;
  const formId = "academic-year-form";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateAcademicYearFormData>({
    resolver: zodResolver(createAcademicYearSchema),
    defaultValues: { name: "", startDate: "", endDate: "" },
  });

  // Re-seed when the drawer opens with a different target.
  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            name: editing.name,
            startDate: editing.startDate.split("T")[0],
            endDate: editing.endDate.split("T")[0],
          }
        : { name: "", startDate: "", endDate: "" },
    );
  }, [open, editing, reset]);

  const onSubmit = useCallback(
    async (data: CreateAcademicYearFormData) => {
      try {
        if (isEditing && editing) {
          await updateYear.mutateAsync({ id: editing.id, ...data });
          toast.success(`${data.name} updated`);
        } else {
          await createYear.mutateAsync(data);
          toast.success(
            `${data.name} created with Fall + Spring semesters. Add or edit semesters as needed.`,
          );
        }
        reset();
        onClose();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not save the academic year"));
      }
    },
    [isEditing, editing, createYear, updateYear, reset, onClose],
  );

  const isPending = createYear.isPending || updateYear.isPending;

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="lg"
      title={isEditing ? `Edit ${editing?.name}` : "Create Academic Year"}
      description={
        isEditing
          ? "Update name or overall start / end dates. Semesters inside keep their own dates."
          : "Two semesters (Fall + Spring) will be auto-created. You can add more, rename, or adjust dates afterwards."
      }
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
            type="submit"
            form={formId}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save changes" : "Create year"}
          </button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
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
      </form>
    </SlideDrawer>
  );
}

/* ── Create / Edit Semester Drawer ─────────────────────────────────────── */

function SemesterDrawer({
  open,
  onClose,
  year,
  editing,
}: {
  open: boolean;
  onClose: () => void;
  year: AcademicYear | null;
  editing: Semester | null;
}) {
  const createSemester = useCreateNestedSemester();
  const updateSemester = useUpdateNestedSemester();
  const isEditing = !!editing;
  const formId = "semester-form";

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateSemesterFormData>({
    resolver: zodResolver(createSemesterSchema),
    defaultValues: { name: "", year: "", startDate: "", endDate: "" },
  });

  useEffect(() => {
    if (!open) return;
    if (editing) {
      reset({
        name: editing.name,
        year: editing.year,
        startDate: editing.startDate.split("T")[0],
        endDate: editing.endDate.split("T")[0],
      });
    } else if (year) {
      // Pre-fill year label + sensible default date range from the parent
      // year so admins don't have to retype it for every additional semester.
      const yearLabel = deriveYearLabel(year.name, year.startDate);
      reset({
        name: "",
        year: yearLabel,
        startDate: year.startDate.split("T")[0],
        endDate: year.endDate.split("T")[0],
      });
    }
  }, [open, editing, year, reset]);

  const onSubmit = useCallback(
    async (data: CreateSemesterFormData) => {
      try {
        if (isEditing && editing) {
          await updateSemester.mutateAsync({ id: editing.id, ...data });
          toast.success(`${data.name} updated`);
        } else {
          if (!year) return;
          await createSemester.mutateAsync({
            ...data,
            academicYearId: year.id,
          });
          toast.success(`${data.name} added to ${year.name}`);
        }
        reset();
        onClose();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not save the semester"));
      }
    },
    [isEditing, editing, year, createSemester, updateSemester, reset, onClose],
  );

  const isPending = createSemester.isPending || updateSemester.isPending;

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="lg"
      title={
        isEditing
          ? `Edit ${editing?.name}`
          : `Add Semester${year ? ` to ${year.name}` : ""}`
      }
      description={
        isEditing
          ? "Status is auto-derived from dates after saving."
          : "Create an additional semester (Summer, Supplementary, Trimester, etc.) inside this academic year."
      }
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
            type="submit"
            form={formId}
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save changes" : "Add semester"}
          </button>
        </div>
      }
    >
      <form
        id={formId}
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-5"
      >
        <FormField
          label="Semester Name"
          placeholder="e.g. Summer 2027 / Trimester 3"
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <FormField
          label="Year label"
          placeholder="e.g. 2027"
          hint="The 4-digit year used in reports and transcripts."
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
      </form>
    </SlideDrawer>
  );
}

/* ── Row action menus ──────────────────────────────────────────────────── */

function YearRowActions({
  year,
  onAddSemester,
  onEdit,
  onDelete,
}: {
  year: AcademicYear;
  onAddSemester: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCompleted = year.status === "completed";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${year.name}`}
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
          {!isCompleted && (
            <DropdownMenu.Item
              onSelect={onAddSemester}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
            >
              <Plus className="h-4 w-4 text-muted-foreground" />
              Add semester
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            Edit year
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Trash2 className="h-4 w-4" />
            Delete year
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function SemesterRowActions({
  semester,
  onEdit,
  onDelete,
}: {
  semester: Semester;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const isCompleted = semester.status === "completed";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label={`Actions for ${semester.name}`}
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
          className="z-50 w-44 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          <DropdownMenu.Item
            onSelect={onEdit}
            disabled={isCompleted}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" />
            {isCompleted ? "Edit (locked)" : "Edit semester"}
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onDelete}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm text-danger outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Trash2 className="h-4 w-4" />
            Delete
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Year Card ─────────────────────────────────────────────────────────── */

function YearCard({
  year,
  expanded,
  onToggle,
  onEditYear,
  onDeleteYear,
  onAddSemester,
  onEditSemester,
  onDeleteSemester,
}: {
  year: AcademicYear;
  expanded: boolean;
  onToggle: () => void;
  onEditYear: () => void;
  onDeleteYear: () => void;
  onAddSemester: () => void;
  onEditSemester: (sem: Semester) => void;
  onDeleteSemester: (sem: Semester) => void;
}) {
  const totalCourses = year.semesters.reduce(
    (sum, s) => sum + s.courseCount,
    0,
  );
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card">
      {/* Year header */}
      <div className="grid grid-cols-[24px_2fr_1fr_120px_36px] items-center gap-3 px-5 py-4">
        <button
          onClick={onToggle}
          aria-label={expanded ? "Collapse" : "Expand"}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          {expanded ? (
            <ChevronDown className="h-5 w-5" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </button>
        <button onClick={onToggle} className="text-left">
          <p className="text-base font-semibold">{year.name}</p>
          <p className="text-xs text-muted-foreground">
            {year.semesters.length} semester
            {year.semesters.length !== 1 ? "s" : ""} · {totalCourses} course
            {totalCourses !== 1 ? "s" : ""}
          </p>
        </button>
        <p className="text-sm text-muted-foreground">
          {formatDate(year.startDate)} → {formatDate(year.endDate)}
        </p>
        <div className="flex justify-end">
          <StatusBadge variant={getStatusVariant(year.status)} dot>
            {year.status}
          </StatusBadge>
        </div>
        <div className="flex justify-end">
          <YearRowActions
            year={year}
            onAddSemester={onAddSemester}
            onEdit={onEditYear}
            onDelete={onDeleteYear}
          />
        </div>
      </div>

      {/* Nested semesters */}
      {expanded && (
        <div className="border-t border-border bg-muted/20 px-5 py-3">
          {year.semesters.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-6 text-center">
              <p className="text-xs text-muted-foreground">
                No semesters under this academic year yet.
              </p>
              <button
                type="button"
                onClick={onAddSemester}
                className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
              >
                <Plus className="h-3 w-3" /> Add the first semester
              </button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                {year.semesters.map((sem) => (
                  <div
                    key={sem.id}
                    className="grid grid-cols-[2fr_1fr_1fr_80px_36px] items-center gap-3 rounded-lg bg-background px-4 py-3 ring-1 ring-border/50"
                  >
                    <div className="flex items-center gap-2">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <p className="text-sm font-medium">{sem.name}</p>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {formatDate(sem.startDate)} → {formatDate(sem.endDate)}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium text-portal-accent">
                        {sem.courseCount}
                      </span>
                      <span className="ml-1 text-muted-foreground">
                        course{sem.courseCount !== 1 ? "s" : ""}
                      </span>
                    </p>
                    <StatusBadge variant={getStatusVariant(sem.status)} dot>
                      {sem.status}
                    </StatusBadge>
                    <div className="flex justify-end">
                      <SemesterRowActions
                        semester={sem}
                        onEdit={() => onEditSemester(sem)}
                        onDelete={() => onDeleteSemester(sem)}
                      />
                    </div>
                  </div>
                ))}
              </div>
              {year.status !== "completed" && (
                <button
                  type="button"
                  onClick={onAddSemester}
                  className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-border px-3 py-2 text-xs font-medium text-muted-foreground transition-colors hover:bg-background hover:text-foreground"
                >
                  <Plus className="h-3 w-3" /> Add another semester to{" "}
                  {year.name}
                </button>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ── Page ──────────────────────────────────────────────────────────────── */

export default function AdminAcademicCalendarPage() {
  const [yearDrawer, setYearDrawer] = useState<{
    open: boolean;
    editing: AcademicYear | null;
  }>({ open: false, editing: null });
  const [semesterDrawer, setSemesterDrawer] = useState<{
    open: boolean;
    year: AcademicYear | null;
    editing: Semester | null;
  }>({ open: false, year: null, editing: null });
  const [yearDelete, setYearDelete] = useState<{
    open: boolean;
    year: AcademicYear | null;
  }>({ open: false, year: null });
  const [semesterDelete, setSemesterDelete] = useState<{
    open: boolean;
    semester: Semester | null;
  }>({ open: false, semester: null });
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const { data: years, isLoading, isError, refetch } = useAcademicYears();
  const deleteYear = useDeleteAcademicYear();
  const deleteSemester = useDeleteSemester();

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

  const handleConfirmDeleteYear = useCallback(async () => {
    if (!yearDelete.year) return;
    const { id, name } = yearDelete.year;
    try {
      await deleteYear.mutateAsync(id);
      toast.success(`${name} deleted`);
    } catch (err) {
      toast.error(apiErrorMessage(err, `Could not delete ${name}`));
    }
  }, [yearDelete.year, deleteYear]);

  const handleConfirmDeleteSemester = useCallback(async () => {
    if (!semesterDelete.semester) return;
    const { id, name } = semesterDelete.semester;
    try {
      await deleteSemester.mutateAsync(id);
      toast.success(`${name} deleted`);
    } catch (err) {
      toast.error(apiErrorMessage(err, `Could not delete ${name}`));
    }
  }, [semesterDelete.semester, deleteSemester]);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={Calendar}
        title="Academic Calendar"
        description="Manage academic years and their semesters."
        actions={
          <button
            onClick={() => setYearDrawer({ open: true, editing: null })}
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
            <YearCard
              key={year.id}
              year={year}
              expanded={!!expanded[year.id]}
              onToggle={() => handleToggle(year.id)}
              onEditYear={() => setYearDrawer({ open: true, editing: year })}
              onDeleteYear={() => setYearDelete({ open: true, year })}
              onAddSemester={() => {
                setExpanded((prev) => ({ ...prev, [year.id]: true }));
                setSemesterDrawer({ open: true, year, editing: null });
              }}
              onEditSemester={(sem) =>
                setSemesterDrawer({ open: true, year, editing: sem })
              }
              onDeleteSemester={(sem) =>
                setSemesterDelete({ open: true, semester: sem })
              }
            />
          ))}
        </div>
      )}

      <AcademicYearDrawer
        open={yearDrawer.open}
        onClose={() => setYearDrawer({ open: false, editing: null })}
        editing={yearDrawer.editing}
      />
      <SemesterDrawer
        open={semesterDrawer.open}
        onClose={() =>
          setSemesterDrawer({ open: false, year: null, editing: null })
        }
        year={semesterDrawer.year}
        editing={semesterDrawer.editing}
      />
      <ConfirmDialog
        open={yearDelete.open}
        onOpenChange={(o) => setYearDelete((p) => ({ ...p, open: o }))}
        title="Delete academic year"
        description={
          yearDelete.year
            ? `Delete "${yearDelete.year.name}" and its ${yearDelete.year.semesters.length} semester${yearDelete.year.semesters.length === 1 ? "" : "s"}? This cannot be undone. Deletion is blocked if any semester has scheduled courses — archive or move those first.`
            : ""
        }
        confirmLabel="Delete year"
        variant="danger"
        onConfirm={handleConfirmDeleteYear}
      />
      <ConfirmDialog
        open={semesterDelete.open}
        onOpenChange={(o) => setSemesterDelete((p) => ({ ...p, open: o }))}
        title="Delete semester"
        description={
          semesterDelete.semester
            ? `Delete "${semesterDelete.semester.name}"? This cannot be undone. Deletion is blocked when ${semesterDelete.semester.courseCount > 0 ? `${semesterDelete.semester.courseCount} course${semesterDelete.semester.courseCount === 1 ? " is" : "s are"} scheduled — archive or move them first` : "courses are scheduled"}.`
            : ""
        }
        confirmLabel="Delete semester"
        variant="danger"
        onConfirm={handleConfirmDeleteSemester}
      />
    </div>
  );
}
