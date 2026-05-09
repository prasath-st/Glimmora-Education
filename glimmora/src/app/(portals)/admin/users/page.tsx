"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { UserCog, Plus, Loader2, X, Upload, Download, MoreHorizontal, Eye, Pencil, ShieldBan, ShieldCheck, Mail, Phone, Building, Calendar, Clock, Hash, Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { useAdminUsers, useAdminUserDetail, useCreateUser, useUpdateUser, useBulkImportUsers, usePrograms } from "@/lib/hooks/use-admin";
import { FileUpload } from "@/components/shared/forms/file-upload";
import {
  createUserSchema,
  type CreateUserFormData,
  editUserSchema,
  type EditUserFormData,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton, CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/components/shared/forms/form-field";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { formatDate, formatRelative } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import type { AdminUser } from "@/lib/api/types/admin.types";

// Roles a University Admin can ASSIGN when creating a new user.
// "Admin" is intentionally excluded — additional University Admins are
// onboarded by the Super Admin (Glimmora team), not self-service from here.
const CREATE_ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "placement", label: "Placement" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

// Filter dropdown — keeps "Admin" so the UA can still see existing admins
// in their institution (just can't create new ones from here).
const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "placement", label: "Placement" },
];

function getStatusVariant(
  status: "active" | "inactive" | "suspended"
): "success" | "muted" | "danger" {
  const map = { active: "success" as const, inactive: "muted" as const, suspended: "danger" as const };
  return map[status];
}

function RowActions({ user, onView, onEdit, onToggleStatus }: {
  user: AdminUser; onView: () => void; onEdit: () => void; onToggleStatus: () => void;
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
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-48 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onView} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" /> View profile
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit user
          </DropdownMenu.Item>
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item onSelect={onToggleStatus} className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted ${user.status === "active" ? "text-danger" : "text-success"}`}>
            {user.status === "active" ? <><ShieldBan className="h-4 w-4" /> Suspend</> : <><ShieldCheck className="h-4 w-4" /> Activate</>}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function createUserColumns(callbacks: {
  onView: (user: AdminUser) => void;
  onEdit: (user: AdminUser) => void;
  onToggleStatus: (user: AdminUser) => void;
}): ColumnDef<AdminUser, unknown>[] {
  return [
    { accessorKey: "name", header: "Name" },
    {
      accessorKey: "email",
      header: "Email",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground">{getValue() as string}</span>
      ),
    },
    {
      accessorKey: "role",
      header: "Role",
      cell: ({ getValue }) => (
        <StatusBadge variant="default">{getValue() as string}</StatusBadge>
      ),
    },
    { accessorKey: "department", header: "Department" },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as AdminUser["status"];
        return (
          <StatusBadge variant={getStatusVariant(status)} dot>
            {status}
          </StatusBadge>
        );
      },
    },
    {
      accessorKey: "lastLoginAt",
      header: "Last Login",
      cell: ({ getValue }) => {
        const val = getValue() as string | null;
        return (
          <span className="text-xs text-muted-foreground">
            {val ? formatRelative(val) : "Never"}
          </span>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <RowActions
          user={row.original}
          onView={() => callbacks.onView(row.original)}
          onEdit={() => callbacks.onEdit(row.original)}
          onToggleStatus={() => callbacks.onToggleStatus(row.original)}
        />
      ),
    },
  ];
}

const DESIGNATION_OPTIONS = [
  { value: "professor", label: "Professor" },
  { value: "associate_professor", label: "Associate Professor" },
  { value: "assistant_professor", label: "Assistant Professor" },
  { value: "lecturer", label: "Lecturer" },
];

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();
  const { data: programsData } = usePrograms({ status: "active" });
  const activePrograms = programsData?.data ?? [];

  const programOptions = [
    { value: "", label: "Select a program..." },
    ...activePrograms.map((p) => ({ value: p.name, label: `${p.name} (${p.degreeType})` })),
  ];

  // Distinct departments derived from active programs
  const departmentOptions = (() => {
    const seen = new Set<string>();
    const opts: { value: string; label: string }[] = [{ value: "", label: "Select a department..." }];
    for (const p of activePrograms) {
      if (!seen.has(p.department)) {
        seen.add(p.department);
        opts.push({ value: p.department, label: p.department });
      }
    }
    return opts;
  })();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "student", firstName: "", lastName: "", email: "", department: "" },
  });

  const selectedRole = watch("role");
  const selectedProgram = watch("program");

  // Auto-derive Department from Program for students
  const handleProgramChange = useCallback(
    (e: React.ChangeEvent<HTMLSelectElement>) => {
      const programName = e.target.value;
      setValue("program", programName);
      const matched = activePrograms.find((p) => p.name === programName);
      if (matched) {
        setValue("department", matched.department, { shouldValidate: true });
      }
    },
    [activePrograms, setValue]
  );

  // Cap semester options to selected program's totalSemesters
  const semesterCap = selectedRole === "student" && selectedProgram
    ? activePrograms.find((p) => p.name === selectedProgram)?.totalSemesters ?? 8
    : 8;
  const semesterOptions = Array.from({ length: semesterCap }, (_, i) => ({
    value: String(i + 1),
    label: `Semester ${i + 1}`,
  }));

  const onSubmit = useCallback(
    async (data: CreateUserFormData) => {
      try {
        await createUser.mutateAsync(data);
        reset();
        onOpenChange(false);
      } catch {
        // error shown via mutation state
      }
    },
    [createUser, reset, onOpenChange]
  );

  return (
    <SlideDrawer
      open={open}
      onClose={() => onOpenChange(false)}
      width="xl"
      title="Create User"
      description="Select a role first — the form fields will adjust accordingly."
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="submit"
            form="create-user-form"
            disabled={createUser.isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {createUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Create User
          </button>
        </div>
      }
    >
      <form id="create-user-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Role — FIRST */}
        <FormSelect
          label="Role"
          options={CREATE_ROLE_OPTIONS}
          error={errors.role?.message}
          hint="Additional University Admins are onboarded by Glimmora's Super Admin team."
          required
          {...register("role")}
        />

        {/* Personal Information — common to all roles */}
        <section className="space-y-3">
          <h3 className="text-sm font-semibold">Personal Information</h3>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="First Name" placeholder="First name" error={errors.firstName?.message} required {...register("firstName")} />
            <FormField label="Last Name" placeholder="Last name" error={errors.lastName?.message} required {...register("lastName")} />
          </div>
          <FormField label="Email" type="email" placeholder="user@institution.edu" error={errors.email?.message} required {...register("email")} />
        </section>

        {/* Role-specific fields */}
        {selectedRole === "student" && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Academic Information</h3>
            {activePrograms.length === 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
                No active programs. <a href="/admin/programs" className="font-semibold underline">Create a program first</a> before adding students.
              </div>
            )}
            <FormField label="Student ID" placeholder="e.g. STU-2024-001" error={errors.studentId?.message} required {...register("studentId")} />
            <FormSelect
              label="Program"
              options={programOptions}
              error={errors.program?.message}
              required
              {...register("program", { onChange: handleProgramChange })}
            />
            <FormField
              label="Department"
              error={errors.department?.message}
              hint="Auto-filled from selected program"
              readOnly
              required
              {...register("department")}
            />
            <div className="grid grid-cols-3 gap-3">
              <FormField label="Year Start" placeholder="e.g. 2024" error={errors.academicYearStart?.message} {...register("academicYearStart")} />
              <FormField label="Year End" placeholder="e.g. 2027" error={errors.academicYearEnd?.message} {...register("academicYearEnd")} />
              <FormSelect label="Current Semester" options={semesterOptions} error={errors.currentSemester?.message} {...register("currentSemester")} />
            </div>
          </section>
        )}

        {selectedRole === "faculty" && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Professional Information</h3>
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Employee ID" placeholder="e.g. FAC-2024-001" error={errors.employeeId?.message} required {...register("employeeId")} />
              <FormSelect label="Department" options={departmentOptions} error={errors.department?.message} required {...register("department")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <FormSelect label="Designation" options={DESIGNATION_OPTIONS} error={errors.designation?.message} required {...register("designation")} />
              <FormField label="Specialization" placeholder="e.g. Machine Learning" error={errors.specialization?.message} {...register("specialization")} />
            </div>
          </section>
        )}

        {selectedRole === "placement" && (
          <section className="space-y-3">
            <h3 className="text-sm font-semibold">Department</h3>
            <FormSelect label="Department" options={departmentOptions} error={errors.department?.message} required {...register("department")} />
          </section>
        )}

        {createUser.isError && (
          <p className="text-sm text-danger">Failed to create user. Please try again.</p>
        )}
      </form>
    </SlideDrawer>
  );
}

interface ParsedRow {
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  department: string;
  studentId?: string;
  program?: string;
  employeeId?: string;
  valid: boolean;
  error?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const firstNameIdx = header.indexOf("firstname");
  const lastNameIdx = header.indexOf("lastname");
  const roleIdx = header.indexOf("role");
  const deptIdx = header.indexOf("department");
  const studentIdIdx = header.indexOf("studentid");
  const programIdx = header.indexOf("program");
  const employeeIdIdx = header.indexOf("employeeid");

  if (emailIdx === -1 || firstNameIdx === -1 || lastNameIdx === -1 || roleIdx === -1 || deptIdx === -1) {
    return [];
  }

  // Bulk import mirrors the Create form's role policy — admins are not
  // creatable through this self-service flow.
  const validRoles = ["student", "faculty", "placement"];

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const email = cols[emailIdx] || "";
    const firstName = cols[firstNameIdx] || "";
    const lastName = cols[lastNameIdx] || "";
    const role = (cols[roleIdx] || "").toLowerCase();
    const department = cols[deptIdx] || "";
    const studentId = studentIdIdx >= 0 ? cols[studentIdIdx] || undefined : undefined;
    const program = programIdx >= 0 ? cols[programIdx] || undefined : undefined;
    const employeeId = employeeIdIdx >= 0 ? cols[employeeIdIdx] || undefined : undefined;

    const errors: string[] = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid email");
    if (!firstName) errors.push("missing firstName");
    if (!lastName) errors.push("missing lastName");
    if (!validRoles.includes(role)) errors.push("invalid role");
    if (!department) errors.push("missing department");
    if (role === "student" && !studentId) errors.push("missing studentId for student");
    if (role === "faculty" && !employeeId) errors.push("missing employeeId for faculty");

    return {
      email,
      firstName,
      lastName,
      role,
      department,
      studentId,
      program,
      employeeId,
      valid: errors.length === 0,
      error: errors.length > 0 ? errors.join(", ") : undefined,
    };
  });
}

function ImportUsersDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const bulkImport = useBulkImportUsers();
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const validRows = parsedRows.filter((r) => r.valid);
  const errorRows = parsedRows.filter((r) => !r.valid);

  const handleFilesChange = useCallback((files: File[]) => {
    setParsedRows([]);
    setParseError("");
    setSuccessMsg("");

    if (files.length === 0) return;

    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const rows = parseCSV(text);
      if (rows.length === 0) {
        setParseError(
          "Could not parse the CSV. Ensure columns: email, name, role, department"
        );
      } else {
        setParsedRows(rows);
      }
    };
    reader.onerror = () => setParseError("Failed to read file.");
    reader.readAsText(file);
  }, []);

  const handleImport = useCallback(async () => {
    if (validRows.length === 0) return;
    try {
      await bulkImport.mutateAsync({
        users: validRows.map((r) => ({
          email: r.email,
          firstName: r.firstName,
          lastName: r.lastName,
          role: r.role as "student" | "faculty" | "admin" | "placement",
          department: r.department,
          studentId: r.studentId,
          program: r.program,
          employeeId: r.employeeId,
        })),
      });
      setSuccessMsg(
        `Successfully imported ${validRows.length} user${validRows.length > 1 ? "s" : ""}. Activation emails sent.`
      );
      setParsedRows([]);
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1500);
    } catch {
      // error shown via mutation state
    }
  }, [validRows, bulkImport, onOpenChange]);

  const handleDownloadTemplate = useCallback(() => {
    const csv =
      "email,firstName,lastName,role,department,studentId,program,employeeId\n" +
      "john@university.edu,John,Smith,student,Computer Science,STU-2026-001,BSc Computer Science,\n" +
      "jane@university.edu,Jane,Doe,faculty,Computer Science,,,FAC-2026-001\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleClose = useCallback(() => {
    setParsedRows([]);
    setParseError("");
    setSuccessMsg("");
    bulkImport.reset();
    onOpenChange(false);
  }, [bulkImport, onOpenChange]);

  return (
    <SlideDrawer
      open={open}
      onClose={handleClose}
      width="xl"
      title="Import Users"
      description="Upload a CSV with: email, firstName, lastName, role, department, studentId, program, employeeId"
      footer={
        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
            Cancel
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={bulkImport.isPending || validRows.length === 0}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {bulkImport.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
            <Upload className="h-3.5 w-3.5" />
            Import {validRows.length > 0 ? `${validRows.length} User${validRows.length > 1 ? "s" : ""}` : "Users"}
          </button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Template download */}
        <div className="rounded-lg border border-border bg-muted/50 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Expected CSV format (studentId required for student, employeeId required for faculty, program optional):
          </p>
          <pre className="text-xs font-mono text-muted-foreground bg-background rounded p-2 overflow-x-auto">
{`email,firstName,lastName,role,department,studentId,program,employeeId
john@university.edu,John,Smith,student,Computer Science,STU-2026-001,BSc Computer Science,
jane@university.edu,Jane,Doe,faculty,Computer Science,,,FAC-2026-001`}
          </pre>
          <button
            type="button"
            onClick={handleDownloadTemplate}
            className="mt-2 flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
          >
            <Download className="h-3 w-3" />
            Download template CSV
          </button>
        </div>

        {/* File upload */}
        <FileUpload
          label="Upload CSV file"
          accept=".csv"
          maxSize={5}
          onFilesChange={handleFilesChange}
          error={parseError}
        />

        {/* Parse results */}
        {parsedRows.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <span>
                Found <span className="font-semibold">{parsedRows.length}</span> row{parsedRows.length > 1 ? "s" : ""}.
              </span>
              <span className="text-success font-medium">
                {validRows.length} valid
              </span>
              {errorRows.length > 0 && (
                <span className="text-danger font-medium">
                  {errorRows.length} error{errorRows.length > 1 ? "s" : ""}
                </span>
              )}
            </div>

            {/* Preview table */}
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-border bg-muted/50">
                      <th className="px-2 py-1.5 text-left font-medium">Email</th>
                      <th className="px-2 py-1.5 text-left font-medium">Name</th>
                      <th className="px-2 py-1.5 text-left font-medium">Role</th>
                      <th className="px-2 py-1.5 text-left font-medium">Dept</th>
                      <th className="px-2 py-1.5 text-left font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {parsedRows.slice(0, 5).map((row, i) => (
                      <tr
                        key={i}
                        className={`border-b border-border last:border-0 ${!row.valid ? "bg-danger/5" : ""}`}
                      >
                        <td className="px-2 py-1.5 truncate max-w-30">{row.email}</td>
                        <td className="px-2 py-1.5 truncate max-w-25">{row.firstName} {row.lastName}</td>
                        <td className="px-2 py-1.5">{row.role}</td>
                        <td className="px-2 py-1.5 truncate max-w-25">{row.department}</td>
                        <td className="px-2 py-1.5">
                          {row.valid ? (
                            <span className="text-success">OK</span>
                          ) : (
                            <span className="text-danger" title={row.error}>{row.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {parsedRows.length > 5 && (
                <p className="px-2 py-1.5 text-xs text-muted-foreground border-t border-border bg-muted/30">
                  ...and {parsedRows.length - 5} more row{parsedRows.length - 5 > 1 ? "s" : ""}
                </p>
              )}
            </div>
          </div>
        )}

        {bulkImport.isError && (
          <p className="text-xs text-danger">
            Failed to import users. Please check the file and try again.
          </p>
        )}
        {successMsg && (
          <p className="text-xs text-success">{successMsg}</p>
        )}
      </div>
    </SlideDrawer>
  );
}

export default function AdminUsersPage() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  // Drawer-driven detail/edit. View and edit live in a side drawer rather
  // than a separate route — this is the project-wide pattern for any
  // entity's detail / edit affordance.
  const [drawer, setDrawer] = useState<{
    open: boolean;
    userId: string | null;
    mode: "view" | "edit";
  }>({ open: false, userId: null, mode: "view" });
  const updateUser = useUpdateUser();

  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdminUsers({
    search: search || undefined,
    role: roleFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const users = data?.users ?? [];

  const handleExport = useCallback(() => {
    if (!users.length) return;
    const headers = ["Name", "Email", "Role", "Department", "Status", "Last Login", "Created"];
    const rows = users.map((u: AdminUser) => [
      u.name,
      u.email,
      u.role,
      u.department,
      u.status,
      u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : "Never",
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `users-export-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }, [users]);

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleRowClick = useCallback((user: AdminUser) => {
    setDrawer({ open: true, userId: user.id, mode: "view" });
  }, []);

  const handleEditUser = useCallback((user: AdminUser) => {
    setDrawer({ open: true, userId: user.id, mode: "edit" });
  }, []);

  const closeDrawer = useCallback(() => {
    setDrawer((prev) => ({ ...prev, open: false }));
  }, []);

  const handleToggleStatus = useCallback((user: AdminUser) => {
    setConfirm({ open: true, user });
  }, []);

  const executeToggleStatus = useCallback(async (reason?: string) => {
    if (!confirm.user) return;
    const newStatus = confirm.user.status === "active" ? "suspended" : "active";
    try {
      await updateUser.mutateAsync({ id: confirm.user.id, status: newStatus });
      if (newStatus === "suspended" && reason) {
        toast.success(`${confirm.user.name} suspended. Reason logged in Audit Trail.`);
      } else {
        toast.success(newStatus === "suspended" ? `${confirm.user.name} suspended` : `${confirm.user.name} activated`);
      }
    } catch {
      toast.error("Failed to update user status");
    }
  }, [confirm.user, updateUser]);

  const columns = createUserColumns({
    // Row click and "View profile" both open the drawer in view mode.
    // "Edit user" opens the same drawer pre-set to edit mode. Suspend /
    // Activate stays as a confirm dialog without opening the drawer.
    onView: handleRowClick,
    onEdit: handleEditUser,
    onToggleStatus: handleToggleStatus,
  });

  return (
    <div className="space-y-6">
      <PageHeader
        icon={UserCog}
        title="Users"
        description="Manage users, roles, and access across the institution"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={handleExport}
              disabled={!users.length}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              <Download className="h-4 w-4" />
              Export
            </button>
            <button
              onClick={() => setImportOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <Upload className="h-4 w-4" />
              Import
            </button>
            <button
              onClick={() => setDialogOpen(true)}
              className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              <Plus className="h-4 w-4" />
              Create User
            </button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search users..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={roleFilter}
          onChange={(e) => {
            setRoleFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {ROLE_FILTER_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Content */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load users"
          message="Could not retrieve user data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={users}
            showSearch={false}
            showPagination={false}
            emptyTitle="No users found"
            emptyDescription="Try adjusting your search or filters, or create a new user."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} ({data.meta.total} users)
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(Math.max(1, page - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(Math.min(data.meta.totalPages, page + 1))}
                  disabled={page >= data.meta.totalPages}
                  className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}

      <CreateUserDialog open={dialogOpen} onOpenChange={setDialogOpen} />
      <ImportUsersDialog open={importOpen} onOpenChange={setImportOpen} />
      {confirm.user?.status !== "active" ? (
        <ConfirmDialog
          open={confirm.open}
          onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}
          title="Activate User"
          description={`Activate "${confirm.user?.name}"? They will regain access immediately.`}
          confirmLabel="Activate"
          variant="default"
          onConfirm={executeToggleStatus}
        />
      ) : (
        <SuspendUserDialog
          open={confirm.open}
          onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}
          user={confirm.user}
          onSuspend={executeToggleStatus}
        />
      )}
      <UserDetailDrawer
        userId={drawer.userId}
        open={drawer.open}
        mode={drawer.mode}
        onClose={closeDrawer}
      />
    </div>
  );
}

function SuspendUserDialog({
  open,
  onOpenChange,
  user,
  onSuspend,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: AdminUser | null;
  onSuspend: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const handleSuspend = async () => {
    if (!reason.trim() || reason.trim().length < 10) {
      setError("Please provide a reason (at least 10 characters)");
      return;
    }
    setPending(true);
    try {
      await onSuspend(reason.trim());
      setReason("");
      setError("");
      onOpenChange(false);
    } finally {
      setPending(false);
    }
  };

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(o) => {
        if (!o) {
          setReason("");
          setError("");
        }
        onOpenChange(o);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg">
          <Dialog.Title className="text-lg font-semibold text-danger">
            Suspend User
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm text-muted-foreground">
            Suspend <span className="font-medium text-foreground">{user?.name}</span>? They will lose access until reactivated. This action will be logged with the reason in the Audit Trail.
          </Dialog.Description>
          <div className="mt-4 space-y-2">
            <label className="text-sm font-medium">Reason for suspension</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Policy violation – pending investigation. Reference ticket #..."
              rows={4}
              className="flex w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
            />
            {error && <p className="text-xs text-danger">{error}</p>}
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              disabled={pending}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSuspend}
              disabled={pending}
              className="flex items-center gap-2 rounded-lg bg-danger px-4 py-2 text-sm font-medium text-danger-foreground transition-colors hover:bg-danger/90 disabled:opacity-50"
            >
              {pending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Suspend User
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

// ─── User Detail Drawer ───────────────────────────────────────────────────────
// Single drawer that handles both VIEW and EDIT modes. Project convention:
// any entity's detail/edit affordance lives in a side drawer, not a separate
// route. The 3-dot row menu drives mode (View profile vs Edit user).

const ASSIGNABLE_ROLES = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "placement", label: "Placement" },
] as const;

const SEMESTER_OPTIONS = [
  { value: "", label: "Select semester..." },
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

function UserDetailDrawer({
  userId,
  open,
  mode,
  onClose,
}: {
  userId: string | null;
  open: boolean;
  mode: "view" | "edit";
  onClose: () => void;
}) {
  const { data: user, isLoading, isError } = useAdminUserDetail(userId ?? "");
  const updateUser = useUpdateUser();
  const { data: programsData } = usePrograms({ status: "active" });

  // Distinct departments for the edit form's dropdown. Always include the
  // user's current department so a seeded value still selects correctly.
  const distinctDepartments = useMemo(() => {
    const seen = new Set<string>();
    for (const p of programsData?.data ?? []) seen.add(p.department);
    if (user?.department) seen.add(user.department);
    return Array.from(seen);
  }, [programsData, user?.department]);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<EditUserFormData>({
    resolver: zodResolver(editUserSchema),
  });

  // Re-seed the form when the loaded user changes or when the drawer opens.
  useEffect(() => {
    if (!user || !open) return;
    reset({
      name: user.name,
      email: user.email,
      phone: user.phone ?? "",
      department: user.department,
      role: (user.role === "super_admin" ? "admin" : user.role) as
        | "student"
        | "faculty"
        | "admin"
        | "placement",
      program: user.program ?? "",
      academicYearStart: user.academicYearStart ?? "",
      academicYearEnd: user.academicYearEnd ?? "",
      currentSemester: user.currentSemester ?? "",
      designation: user.designation ?? "",
      specialization: user.specialization ?? "",
    });
  }, [user, open, mode, reset]);

  const watchedRole = watch("role");

  const onSubmitEdit = useCallback(
    async (data: EditUserFormData) => {
      if (!user) return;
      try {
        await updateUser.mutateAsync({ id: user.id, ...data });
        toast.success(`${data.name} updated. Changes logged in the Audit Trail.`);
        onClose();
      } catch {
        toast.error("Failed to save changes.");
      }
    },
    [user, updateUser, onClose],
  );

  if (isLoading || !user) {
    return (
      <SlideDrawer
        open={open}
        onClose={onClose}
        width="xl"
        title={mode === "edit" ? "Edit user" : "User profile"}
      >
        <CardSkeleton />
      </SlideDrawer>
    );
  }

  if (isError) {
    return (
      <SlideDrawer
        open={open}
        onClose={onClose}
        width="xl"
        title="User profile"
      >
        <ErrorState
          title="Failed to load user"
          message="Could not retrieve user details. Close the drawer and try again."
        />
      </SlideDrawer>
    );
  }

  const statusVariant: "success" | "muted" | "danger" =
    user.status === "active"
      ? "success"
      : user.status === "suspended"
        ? "danger"
        : "muted";

  // ─── EDIT MODE ─────────────────────────────────────────────────────────
  if (mode === "edit") {
    return (
      <SlideDrawer
        open={open}
        onClose={onClose}
        width="xl"
        title="Edit user"
        description={user.name}
        footer={
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
            >
              <X className="h-3.5 w-3.5" />
              Cancel
            </button>
            <button
              type="submit"
              form="user-edit-form"
              disabled={isSubmitting || updateUser.isPending || !isDirty}
              className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
            >
              {isSubmitting || updateUser.isPending ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5" />
              )}
              Save changes
            </button>
          </div>
        }
      >
        <form
          id="user-edit-form"
          onSubmit={handleSubmit(onSubmitEdit)}
          className="space-y-6"
        >
          {/* Identity */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">Identity</h3>
            <FormField
              label="Full Name"
              placeholder="First Last"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <FormField
                label="Email"
                type="email"
                placeholder="user@institution.edu"
                error={errors.email?.message}
                required
                {...register("email")}
              />
              <FormField
                label="Phone"
                placeholder="+91 ..."
                error={errors.phone?.message}
                {...register("phone")}
              />
            </div>
          </section>

          {/* Role + Department */}
          <section className="space-y-4">
            <h3 className="text-sm font-semibold text-foreground">
              Role &amp; Department
            </h3>
            {user.role === "admin" ? (
              <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-xs text-muted-foreground">
                <p className="font-medium text-foreground">Administrator</p>
                <p className="mt-1 leading-relaxed">
                  Administrator role assignments are managed by Glimmora&apos;s
                  Super Admin team. To revoke or transfer admin access for{" "}
                  {user.name}, contact your account manager.
                </p>
                <input type="hidden" {...register("role")} />
              </div>
            ) : (
              <FormSelect
                label="Role"
                options={ASSIGNABLE_ROLES.map((r) => ({
                  value: r.value,
                  label: r.label,
                }))}
                error={errors.role?.message}
                required
                {...register("role")}
              />
            )}
            <FormSelect
              label="Department"
              options={[
                { value: "", label: "Select department..." },
                ...distinctDepartments.map((d) => ({ value: d, label: d })),
              ]}
              error={errors.department?.message}
              required
              {...register("department")}
            />
          </section>

          {/* Role-specific */}
          {watchedRole === "student" && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Academic information
              </h3>
              {user.studentId && (
                <p className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1 text-xs">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono">{user.studentId}</span>
                  <span className="text-muted-foreground">
                    Student ID is immutable
                  </span>
                </p>
              )}
              <FormField
                label="Programme"
                placeholder="e.g. BTech Computer Science"
                error={errors.program?.message}
                {...register("program")}
              />
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <FormField
                  label="Year Start"
                  placeholder="e.g. 2024"
                  error={errors.academicYearStart?.message}
                  {...register("academicYearStart")}
                />
                <FormField
                  label="Year End"
                  placeholder="e.g. 2027"
                  error={errors.academicYearEnd?.message}
                  {...register("academicYearEnd")}
                />
                <FormSelect
                  label="Current Semester"
                  options={SEMESTER_OPTIONS}
                  error={errors.currentSemester?.message}
                  {...register("currentSemester")}
                />
              </div>
            </section>
          )}

          {watchedRole === "faculty" && (
            <section className="space-y-4">
              <h3 className="text-sm font-semibold text-foreground">
                Professional information
              </h3>
              {user.employeeId && (
                <p className="inline-flex items-center gap-2 rounded-md border border-border bg-muted/40 px-3 py-1 text-xs">
                  <Hash className="h-3 w-3 text-muted-foreground" />
                  <span className="font-mono">{user.employeeId}</span>
                  <span className="text-muted-foreground">
                    Employee ID is immutable
                  </span>
                </p>
              )}
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <FormSelect
                  label="Designation"
                  options={DESIGNATION_OPTIONS}
                  error={errors.designation?.message}
                  {...register("designation")}
                />
                <FormField
                  label="Specialization"
                  placeholder="e.g. Machine Learning"
                  error={errors.specialization?.message}
                  {...register("specialization")}
                />
              </div>
            </section>
          )}
        </form>
      </SlideDrawer>
    );
  }

  // ─── VIEW MODE ─────────────────────────────────────────────────────────
  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={user.name}
      description={user.email}
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge variant={statusVariant} dot size="md">
            {user.status}
          </StatusBadge>
          <StatusBadge variant="default" size="md">
            {user.role}
          </StatusBadge>
        </div>

        <section className="rounded-xl border border-border bg-muted/20 p-5">
          <h3 className="text-sm font-semibold">Profile</h3>
          <div className="mt-4 space-y-4">
            <DrawerDetailRow icon={Mail} label="Email" value={user.email} />
            {user.phone && (
              <DrawerDetailRow icon={Phone} label="Phone" value={user.phone} />
            )}
            <DrawerDetailRow
              icon={Building}
              label="Department"
              value={user.department}
            />
            {user.role === "student" && (
              <>
                {user.program && (
                  <DrawerDetailRow icon={Hash} label="Programme" value={user.program} />
                )}
                {user.studentId && (
                  <DrawerDetailRow icon={Hash} label="Student ID" value={user.studentId} mono />
                )}
                {user.currentSemester && (
                  <DrawerDetailRow icon={Hash} label="Current Semester" value={`Semester ${user.currentSemester}`} />
                )}
                {(user.academicYearStart || user.academicYearEnd) && (
                  <DrawerDetailRow
                    icon={Calendar}
                    label="Academic Years"
                    value={`${user.academicYearStart ?? "?"} – ${user.academicYearEnd ?? "?"}`}
                  />
                )}
              </>
            )}
            {user.role === "faculty" && (
              <>
                {user.employeeId && (
                  <DrawerDetailRow icon={Hash} label="Employee ID" value={user.employeeId} mono />
                )}
                {user.designation && (
                  <DrawerDetailRow
                    icon={Hash}
                    label="Designation"
                    value={user.designation.replace(/_/g, " ")}
                    capitalize
                  />
                )}
                {user.specialization && (
                  <DrawerDetailRow icon={Hash} label="Specialization" value={user.specialization} />
                )}
              </>
            )}
          </div>
        </section>

        <section className="rounded-xl border border-border bg-muted/20 p-5">
          <h3 className="text-sm font-semibold">Activity</h3>
          <div className="mt-4 space-y-4">
            <DrawerDetailRow icon={Calendar} label="Created" value={formatDate(user.createdAt)} />
            <DrawerDetailRow
              icon={Clock}
              label="Last Login"
              value={user.lastLoginAt ? formatRelative(user.lastLoginAt) : "Never"}
            />
            {user.tenantId && (
              <DrawerDetailRow icon={Hash} label="Tenant ID" value={user.tenantId} mono muted />
            )}
          </div>
        </section>

        {user.role === "admin" && (
          <p className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
            Administrator role is managed by Glimmora&apos;s Super Admin team.
            To revoke or transfer admin access for {user.name}, contact your
            account manager.
          </p>
        )}
      </div>
    </SlideDrawer>
  );
}

function DrawerDetailRow({
  icon: Icon,
  label,
  value,
  mono,
  muted,
  capitalize,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
  muted?: boolean;
  capitalize?: boolean;
}) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p
          className={cn(
            "truncate text-sm font-medium",
            mono && "font-mono text-xs",
            muted && "text-muted-foreground",
            capitalize && "capitalize",
          )}
        >
          {value}
        </p>
      </div>
    </div>
  );
}
