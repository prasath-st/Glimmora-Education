"use client";

import { useState, useCallback, useMemo } from "react";
import {
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  ShieldBan,
  ShieldCheck,
  Eye,
  GraduationCap,
  Building2,
  CalendarRange,
  Users as UsersIcon,
  Layers,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import {
  usePrograms,
  useCreateProgram,
  useUpdateProgram,
  useDepartments,
} from "@/lib/hooks/use-admin";
import {
  createProgramSchema,
  type CreateProgramFormData,
  type CreateProgramFormInput,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/components/shared/forms/form-field";
import { SpecializationSelect } from "@/components/shared/forms/specialization-select";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { formatDate } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { Program } from "@/lib/api/types/admin.types";

const DEGREE_TYPE_OPTIONS = [
  { value: "UG", label: "Undergraduate" },
  { value: "PG", label: "Postgraduate" },
  { value: "PhD", label: "PhD" },
  { value: "Diploma", label: "Diploma" },
];

const DEGREE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  ...DEGREE_TYPE_OPTIONS,
];

const STATUS_FILTER_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const DEGREE_LABELS: Record<string, string> = {
  UG: "Undergraduate",
  PG: "Postgraduate",
  PhD: "PhD",
  Diploma: "Diploma",
};

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({
  program,
  onView,
  onEdit,
  onToggle,
}: {
  program: Program;
  onView: () => void;
  onEdit: () => void;
  onToggle: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          aria-label="Row actions"
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
            onSelect={onView}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Eye className="h-4 w-4 text-muted-foreground" /> View details
          </DropdownMenu.Item>
          <DropdownMenu.Item
            onSelect={onEdit}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit program
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onToggle}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              program.status === "active" ? "text-danger" : "text-success"
            )}
          >
            {program.status === "active" ? (
              <>
                <ShieldBan className="h-4 w-4" /> Deactivate
              </>
            ) : (
              <>
                <ShieldCheck className="h-4 w-4" /> Activate
              </>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Program Drawer (view + edit + create) ───────────────────────────────── */

type DrawerMode = "view" | "edit" | "create";

function ProgramDrawer({
  open,
  mode,
  program,
  onClose,
  onSwitchToEdit,
}: {
  open: boolean;
  mode: DrawerMode;
  program: Program | null;
  onClose: () => void;
  onSwitchToEdit: () => void;
}) {
  if (!open) return null;
  if (mode === "view" && program) {
    return (
      <ProgramViewDrawer
        key={`view-${program.id}`}
        open={open}
        program={program}
        onClose={onClose}
        onEdit={onSwitchToEdit}
      />
    );
  }
  return (
    <ProgramFormDrawer
      key={mode === "edit" && program ? `edit-${program.id}` : "create"}
      open={open}
      mode={mode === "edit" ? "edit" : "create"}
      program={program}
      onClose={onClose}
    />
  );
}

function ProgramViewDrawer({
  open,
  program,
  onClose,
  onEdit,
}: {
  open: boolean;
  program: Program;
  onClose: () => void;
  onEdit: () => void;
}) {
  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      title={program.name}
      description={`${DEGREE_LABELS[program.degreeType] ?? program.degreeType} • ${program.department}`}
      width="xl"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onEdit}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Pencil className="h-4 w-4" /> Edit program
          </button>
        </div>
      }
    >
      <ProgramViewBody program={program} />
    </SlideDrawer>
  );
}

function ProgramFormDrawer({
  open,
  mode,
  program,
  onClose,
}: {
  open: boolean;
  mode: "edit" | "create";
  program: Program | null;
  onClose: () => void;
}) {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const { data: departments } = useDepartments();

  const departmentOptions = useMemo(() => {
    const fromMaster = (departments ?? []).map((d) => d.name);
    if (program?.department && !fromMaster.includes(program.department)) {
      fromMaster.push(program.department);
    }
    fromMaster.sort();
    return fromMaster.map((name) => ({ value: name, label: name }));
  }, [departments, program?.department]);

  const isEditing = mode === "edit";
  const formId = "program-form";

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<
    CreateProgramFormInput,
    unknown,
    CreateProgramFormData
  >({
    resolver: zodResolver(createProgramSchema),
    defaultValues:
      program && isEditing
        ? {
            name: program.name,
            department: program.department,
            duration: program.duration,
            totalSemesters: program.totalSemesters,
            degreeType: program.degreeType,
          }
        : {
            name: "",
            department: "",
            duration: 3,
            totalSemesters: 6,
            degreeType: "UG",
          },
  });

  const watchedDepartment = watch("department") ?? "";

  const onSubmit = useCallback(
    async (data: CreateProgramFormData) => {
      try {
        if (isEditing && program) {
          await updateProgram.mutateAsync({ id: program.id, ...data });
          toast.success(`${data.name} updated`);
        } else {
          await createProgram.mutateAsync(data);
          toast.success(`${data.name} created`);
        }
        reset();
        onClose();
      } catch {
        toast.error(
          isEditing ? "Failed to update program" : "Failed to create program"
        );
      }
    },
    [isEditing, program, createProgram, updateProgram, reset, onClose]
  );

  const isPending = createProgram.isPending || updateProgram.isPending;

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={isEditing ? `Edit ${program?.name ?? "Program"}` : "New Program"}
      description={
        isEditing
          ? `Update details for ${program?.name ?? "this program"}`
          : "Define a new degree program offered by your institution"
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
            {isEditing ? "Save changes" : "Create Program"}
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
          label="Program Name"
          placeholder="e.g. BSc Computer Science"
          error={errors.name?.message}
          required
          {...register("name")}
        />
        <SpecializationSelect
          label="Specialization"
          placeholder="Select a specialization"
          options={departmentOptions}
          value={watchedDepartment}
          onChange={(v) =>
            setValue("department", v, { shouldValidate: true, shouldDirty: true })
          }
          error={errors.department?.message}
          required
        />
        <div className="grid grid-cols-3 gap-3">
          <FormField
            label="Duration (years)"
            type="number"
            placeholder="3"
            error={errors.duration?.message}
            required
            {...register("duration")}
          />
          <FormField
            label="Total Semesters"
            type="number"
            placeholder="6"
            error={errors.totalSemesters?.message}
            required
            {...register("totalSemesters")}
          />
          <FormSelect
            label="Degree Type"
            options={DEGREE_TYPE_OPTIONS}
            error={errors.degreeType?.message}
            required
            {...register("degreeType")}
          />
        </div>

        {(createProgram.isError || updateProgram.isError) && (
          <p className="text-sm text-danger">
            Operation failed. Please try again.
          </p>
        )}
      </form>
    </SlideDrawer>
  );
}

/* ── View body ────────────────────────────────────────────────────────────── */

function ProgramViewBody({ program }: { program: Program }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <StatusBadge
          variant={program.status === "active" ? "success" : "muted"}
          dot
        >
          {program.status}
        </StatusBadge>
        <StatusBadge variant="default">
          {DEGREE_LABELS[program.degreeType] ?? program.degreeType}
        </StatusBadge>
      </div>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Overview
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-card p-5">
          <FactCell
            icon={<GraduationCap className="h-4 w-4" />}
            label="Program"
            value={program.name}
          />
          <FactCell
            icon={<Building2 className="h-4 w-4" />}
            label="Specialization"
            value={program.department}
          />
          <FactCell
            icon={<CalendarRange className="h-4 w-4" />}
            label="Duration"
            value={`${program.duration} year${program.duration === 1 ? "" : "s"}`}
          />
          <FactCell
            icon={<Layers className="h-4 w-4" />}
            label="Total Semesters"
            value={`${program.totalSemesters} semester${program.totalSemesters === 1 ? "" : "s"}`}
          />
        </dl>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Enrollment
        </h3>
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-baseline gap-3">
            <span className="text-3xl font-semibold">
              {program.studentCount.toLocaleString()}
            </span>
            <span className="text-sm text-muted-foreground">
              currently enrolled
            </span>
          </div>
          <p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
            <UsersIcon className="h-3.5 w-3.5" />
            Live count from Users matching this program or specialization.
          </p>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Lifecycle
        </h3>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 rounded-xl border border-border bg-card p-5">
          <FactCell label="Created" value={formatDate(program.createdAt)} />
          <FactCell label="Last updated" value={formatDate(program.updatedAt)} />
        </dl>
      </section>
    </div>
  );
}

function FactCell({
  icon,
  label,
  value,
}: {
  icon?: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="min-w-0">
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
        {label}
      </dt>
      <dd className="mt-1 truncate text-sm font-medium" title={value}>
        {value}
      </dd>
    </div>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ProgramsPage() {
  const [drawer, setDrawer] = useState<{
    open: boolean;
    mode: DrawerMode;
    program: Program | null;
  }>({ open: false, mode: "view", program: null });

  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{
    open: boolean;
    program: Program | null;
  }>({ open: false, program: null });

  const updateProgram = useUpdateProgram();
  const { data, isLoading, isError, refetch } = usePrograms({
    search: search || undefined,
    degreeType: degreeFilter || undefined,
    status: statusFilter || undefined,
  });

  const programs = data?.data ?? [];

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
  }, []);

  const openView = useCallback((program: Program) => {
    setDrawer({ open: true, mode: "view", program });
  }, []);

  const openEdit = useCallback((program: Program) => {
    setDrawer({ open: true, mode: "edit", program });
  }, []);

  const openCreate = useCallback(() => {
    setDrawer({ open: true, mode: "create", program: null });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  const switchToEdit = useCallback(() => {
    setDrawer((prev) => ({ ...prev, mode: "edit" }));
  }, []);

  const handleToggle = useCallback((program: Program) => {
    setConfirm({ open: true, program });
  }, []);

  const executeToggle = useCallback(async () => {
    if (!confirm.program) return;
    const newStatus =
      confirm.program.status === "active" ? "inactive" : "active";
    try {
      await updateProgram.mutateAsync({
        id: confirm.program.id,
        status: newStatus,
      });
      toast.success(
        newStatus === "active"
          ? `${confirm.program.name} activated`
          : `${confirm.program.name} deactivated`
      );
    } catch {
      toast.error("Failed to update status");
    }
  }, [confirm.program, updateProgram]);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Programs & Degrees"
        description="Manage degree programs offered by your institution"
        actions={
          <button
            onClick={openCreate}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" /> New Program
          </button>
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search programs..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={degreeFilter}
          onChange={(e) => setDegreeFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {DEGREE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load programs"
          message="Could not retrieve program data."
          onRetry={() => refetch()}
        />
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">No programs found</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Create your first program or adjust filters.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          <div className="grid grid-cols-[2.5fr_1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Program</span>
            <span>Specialization</span>
            <span>Type</span>
            <span>Duration</span>
            <span>Students</span>
            <span>Status</span>
            <span />
          </div>
          {programs.map((p) => (
            <div
              key={p.id}
              className="grid w-full grid-cols-[2.5fr_1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border px-5 py-3.5 text-left last:border-0"
            >
              <p className="truncate text-sm font-medium">{p.name}</p>
              <p className="truncate text-sm text-muted-foreground">
                {p.department}
              </p>
              <span>
                <StatusBadge variant="default">{p.degreeType}</StatusBadge>
              </span>
              <p className="text-sm">
                {p.duration} yr / {p.totalSemesters} sem
              </p>
              <p className="text-sm font-medium">{p.studentCount}</p>
              <span>
                <StatusBadge
                  variant={p.status === "active" ? "success" : "muted"}
                  dot
                >
                  {p.status}
                </StatusBadge>
              </span>
              <span className="flex justify-end">
                <RowActions
                  program={p}
                  onView={() => openView(p)}
                  onEdit={() => openEdit(p)}
                  onToggle={() => handleToggle(p)}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      <ProgramDrawer
        open={drawer.open}
        mode={drawer.mode}
        program={drawer.program}
        onClose={closeDrawer}
        onSwitchToEdit={switchToEdit}
      />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((prev) => ({ ...prev, open: o }))}
        title={
          confirm.program?.status === "active"
            ? "Deactivate Program"
            : "Activate Program"
        }
        description={
          confirm.program?.status === "active"
            ? confirm.program.studentCount > 0
              ? `Deactivate "${confirm.program?.name}"? ${confirm.program.studentCount} student${confirm.program.studentCount === 1 ? " is" : "s are"} currently enrolled. Existing students keep access; new admissions will be blocked.`
              : `Deactivate "${confirm.program?.name}"? No students are enrolled. New admissions will be blocked.`
            : `Activate "${confirm.program?.name}"? Students can enroll in this program again.`
        }
        confirmLabel={
          confirm.program?.status === "active" ? "Deactivate" : "Activate"
        }
        variant={confirm.program?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggle}
      />
    </div>
  );
}
