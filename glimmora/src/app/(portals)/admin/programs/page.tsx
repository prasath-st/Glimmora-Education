"use client";

import { useState, useCallback } from "react";
import { Plus, Loader2, X, MoreHorizontal, Pencil, ShieldBan, ShieldCheck, Search, ChevronDown } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { usePrograms, useCreateProgram, useUpdateProgram } from "@/lib/hooks/use-admin";
import { createProgramSchema, type CreateProgramFormData } from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/components/shared/forms/form-field";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
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

/* ── Row Actions ─────────────────────────────────────────────────────────── */

function RowActions({ program, onEdit, onToggle }: {
  program: Program; onEdit: () => void; onToggle: () => void;
}) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button onClick={(e) => e.stopPropagation()} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-44 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onToggle} className={cn("flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted", program.status === "active" ? "text-danger" : "text-success")}>
            {program.status === "active" ? <><ShieldBan className="h-4 w-4" /> Deactivate</> : <><ShieldCheck className="h-4 w-4" /> Activate</>}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

/* ── Create / Edit Dialog ────────────────────────────────────────────────── */

function ProgramDialog({
  open,
  onOpenChange,
  editingProgram,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingProgram: Program | null;
}) {
  const createProgram = useCreateProgram();
  const updateProgram = useUpdateProgram();
  const isEditing = !!editingProgram;

  const { register, handleSubmit, reset, formState: { errors } } = useForm<CreateProgramFormData>({
    resolver: zodResolver(createProgramSchema),
    defaultValues: editingProgram
      ? { name: editingProgram.name, department: editingProgram.department, duration: editingProgram.duration, totalSemesters: editingProgram.totalSemesters, degreeType: editingProgram.degreeType }
      : { name: "", department: "", duration: 3, totalSemesters: 6, degreeType: "UG" },
  });

  const onSubmit = useCallback(
    async (data: CreateProgramFormData) => {
      try {
        if (isEditing && editingProgram) {
          await updateProgram.mutateAsync({ id: editingProgram.id, ...data });
          toast.success(`${data.name} updated`);
        } else {
          await createProgram.mutateAsync(data);
          toast.success(`${data.name} created`);
        }
        reset();
        onOpenChange(false);
      } catch {
        toast.error(isEditing ? "Failed to update program" : "Failed to create program");
      }
    },
    [isEditing, editingProgram, createProgram, updateProgram, reset, onOpenChange],
  );

  const isPending = createProgram.isPending || updateProgram.isPending;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Edit Program" : "New Program"}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {isEditing ? `Update details for ${editingProgram?.name}` : "Define a new degree program offered by your institution"}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-4">
            <FormField label="Program Name" placeholder="e.g. BSc Computer Science" error={errors.name?.message} required {...register("name")} />
            <FormField label="Department" placeholder="e.g. Computer Science" error={errors.department?.message} required {...register("department")} />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Duration (years)" type="number" placeholder="3" error={errors.duration?.message} required {...register("duration")} />
              <FormField label="Total Semesters" type="number" placeholder="6" error={errors.totalSemesters?.message} required {...register("totalSemesters")} />
              <FormSelect label="Degree Type" options={DEGREE_TYPE_OPTIONS} error={errors.degreeType?.message} required {...register("degreeType")} />
            </div>

            {(createProgram.isError || updateProgram.isError) && (
              <p className="text-sm text-danger">Operation failed. Please try again.</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={isPending} className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50">
                {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                {isEditing ? "Save Changes" : "Create Program"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

/* ── Page ─────────────────────────────────────────────────────────────────── */

export default function ProgramsPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProgram, setEditingProgram] = useState<Program | null>(null);
  const [search, setSearch] = useState("");
  const [degreeFilter, setDegreeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [confirm, setConfirm] = useState<{ open: boolean; program: Program | null }>({ open: false, program: null });

  const updateProgram = useUpdateProgram();
  const { data, isLoading, isError, refetch } = usePrograms({
    search: search || undefined,
    degreeType: degreeFilter || undefined,
    status: statusFilter || undefined,
  });

  const programs = data?.data ?? [];

  const handleSearch = useCallback((value: string) => { setSearch(value); }, []);

  const handleEdit = useCallback((program: Program) => {
    setEditingProgram(program);
    setDialogOpen(true);
  }, []);

  const handleToggle = useCallback((program: Program) => {
    setConfirm({ open: true, program });
  }, []);

  const executeToggle = useCallback(async () => {
    if (!confirm.program) return;
    const newStatus = confirm.program.status === "active" ? "inactive" : "active";
    try {
      await updateProgram.mutateAsync({ id: confirm.program.id, status: newStatus });
      toast.success(newStatus === "active" ? `${confirm.program.name} activated` : `${confirm.program.name} deactivated`);
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
            onClick={() => { setEditingProgram(null); setDialogOpen(true); }}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" /> New Program
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput onSearch={handleSearch} placeholder="Search programs..." className="w-full sm:max-w-xs" />
        <select
          value={degreeFilter}
          onChange={(e) => setDegreeFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {DEGREE_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary-400"
        >
          {STATUS_FILTER_OPTIONS.map((opt) => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState title="Failed to load programs" message="Could not retrieve program data." onRetry={() => refetch()} />
      ) : programs.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border py-16 text-center">
          <p className="text-sm font-medium">No programs found</p>
          <p className="mt-1 text-sm text-muted-foreground">Create your first program or adjust filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border bg-card">
          {/* Table header */}
          <div className="grid grid-cols-[2.5fr_1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border bg-muted/50 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            <span>Program</span><span>Department</span><span>Type</span><span>Duration</span><span>Students</span><span>Status</span><span />
          </div>
          {/* Rows */}
          {programs.map((p) => (
            <div key={p.id} className="group grid grid-cols-[2.5fr_1.2fr_0.8fr_0.8fr_0.7fr_0.8fr_36px] items-center gap-3 border-b border-border px-5 py-3.5 transition-colors last:border-0 hover:bg-muted/30">
              <p className="text-sm font-medium">{p.name}</p>
              <p className="text-sm text-muted-foreground">{p.department}</p>
              <StatusBadge variant="default">{p.degreeType}</StatusBadge>
              <p className="text-sm">{p.duration} yr / {p.totalSemesters} sem</p>
              <p className="text-sm font-medium">{p.studentCount}</p>
              <StatusBadge variant={p.status === "active" ? "success" : "muted"} dot>{p.status}</StatusBadge>
              <RowActions program={p} onEdit={() => handleEdit(p)} onToggle={() => handleToggle(p)} />
            </div>
          ))}
        </div>
      )}

      <ProgramDialog open={dialogOpen} onOpenChange={(o) => { setDialogOpen(o); if (!o) setEditingProgram(null); }} editingProgram={editingProgram} />
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((prev) => ({ ...prev, open: o }))}
        title={confirm.program?.status === "active" ? "Deactivate Program" : "Activate Program"}
        description={confirm.program?.status === "active"
          ? `Deactivate "${confirm.program?.name}"? New students cannot enroll in this program.`
          : `Activate "${confirm.program?.name}"? Students can enroll in this program again.`}
        confirmLabel={confirm.program?.status === "active" ? "Deactivate" : "Activate"}
        variant={confirm.program?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggle}
      />
    </div>
  );
}
