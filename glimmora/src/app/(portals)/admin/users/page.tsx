"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { UserCog, Plus, Loader2, X, Upload, Download, MoreHorizontal, Eye, Pencil, ShieldBan, ShieldCheck } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import { useAdminUsers, useCreateUser, useUpdateUser, useBulkImportUsers } from "@/lib/hooks/use-admin";
import { FileUpload } from "@/components/shared/forms/file-upload";
import {
  createUserSchema,
  type CreateUserFormData,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { FormField, FormSelect } from "@/components/shared/forms/form-field";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { formatDate, formatRelative } from "@/lib/utils/format";
import type { AdminUser } from "@/lib/api/types/admin.types";

const ROLE_OPTIONS = [
  { value: "student", label: "Student" },
  { value: "faculty", label: "Faculty" },
  { value: "admin", label: "Admin" },
  { value: "placement", label: "Placement" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "suspended", label: "Suspended" },
];

const ROLE_FILTER_OPTIONS = [
  { value: "", label: "All Roles" },
  ...ROLE_OPTIONS,
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
        <button onClick={(e) => e.stopPropagation()} className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100">
          <MoreHorizontal className="h-4 w-4" />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content align="end" sideOffset={4} onClick={(e) => e.stopPropagation()} className="z-50 w-48 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30">
          <DropdownMenu.Item onSelect={onView} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Eye className="h-4 w-4 text-muted-foreground" /> View Details
          </DropdownMenu.Item>
          <DropdownMenu.Item onSelect={onEdit} className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted">
            <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
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

const SEMESTER_OPTIONS = [
  { value: "1", label: "Semester 1" },
  { value: "2", label: "Semester 2" },
  { value: "3", label: "Semester 3" },
  { value: "4", label: "Semester 4" },
  { value: "5", label: "Semester 5" },
  { value: "6", label: "Semester 6" },
  { value: "7", label: "Semester 7" },
  { value: "8", label: "Semester 8" },
];

function CreateUserDialog({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const createUser = useCreateUser();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: { role: "student", firstName: "", lastName: "", email: "", department: "" },
  });

  const selectedRole = watch("role");

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
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">Create User</Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Select a role first — the form fields will adjust accordingly.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-5 space-y-5">
            {/* Role — FIRST */}
            <FormSelect
              label="Role"
              options={ROLE_OPTIONS}
              error={errors.role?.message}
              required
              {...register("role")}
            />

            <div className="h-px bg-border" />

            {/* Personal Information — common to all roles */}
            <div>
              <h3 className="mb-3 text-sm font-semibold">Personal Information</h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <FormField label="First Name" placeholder="First name" error={errors.firstName?.message} required {...register("firstName")} />
                  <FormField label="Last Name" placeholder="Last name" error={errors.lastName?.message} required {...register("lastName")} />
                </div>
                <FormField label="Email" type="email" placeholder="user@institution.edu" error={errors.email?.message} required {...register("email")} />
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Role-specific fields */}
            {selectedRole === "student" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Academic Information</h3>
                <div className="space-y-3">
                  <FormField label="Student ID" placeholder="e.g. STU-2024-001" error={errors.studentId?.message} required {...register("studentId")} />
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Department" placeholder="e.g. Computer Science" error={errors.department?.message} required {...register("department")} />
                    <FormField label="Program" placeholder="e.g. BSc Computer Science" error={errors.program?.message} {...register("program")} />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <FormField label="Academic Year Start" placeholder="e.g. 2024" error={errors.academicYearStart?.message} {...register("academicYearStart")} />
                    <FormField label="Academic Year End" placeholder="e.g. 2027" error={errors.academicYearEnd?.message} {...register("academicYearEnd")} />
                    <FormSelect label="Current Semester" options={SEMESTER_OPTIONS} error={errors.currentSemester?.message} {...register("currentSemester")} />
                  </div>
                </div>
              </div>
            )}

            {selectedRole === "faculty" && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Professional Information</h3>
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <FormField label="Employee ID" placeholder="e.g. FAC-2024-001" error={errors.employeeId?.message} required {...register("employeeId")} />
                    <FormField label="Department" placeholder="e.g. Computer Science" error={errors.department?.message} required {...register("department")} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <FormSelect label="Designation" options={DESIGNATION_OPTIONS} error={errors.designation?.message} required {...register("designation")} />
                    <FormField label="Specialization" placeholder="e.g. Machine Learning" error={errors.specialization?.message} {...register("specialization")} />
                  </div>
                </div>
              </div>
            )}

            {(selectedRole === "admin" || selectedRole === "placement") && (
              <div>
                <h3 className="mb-3 text-sm font-semibold">Department</h3>
                <FormField label="Department" placeholder="e.g. Administration" error={errors.department?.message} required {...register("department")} />
              </div>
            )}

            {createUser.isError && (
              <p className="text-sm text-danger">Failed to create user. Please try again.</p>
            )}

            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => onOpenChange(false)} className="rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">
                Cancel
              </button>
              <button type="submit" disabled={createUser.isPending} className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50">
                {createUser.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Create User
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

interface ParsedRow {
  email: string;
  name: string;
  role: string;
  department: string;
  valid: boolean;
  error?: string;
}

function parseCSV(text: string): ParsedRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  const header = lines[0].toLowerCase().split(",").map((h) => h.trim());
  const emailIdx = header.indexOf("email");
  const nameIdx = header.indexOf("name");
  const roleIdx = header.indexOf("role");
  const deptIdx = header.indexOf("department");

  if (emailIdx === -1 || nameIdx === -1 || roleIdx === -1 || deptIdx === -1) {
    return [];
  }

  const validRoles = ["student", "faculty", "admin", "placement"];

  return lines.slice(1).map((line) => {
    const cols = line.split(",").map((c) => c.trim());
    const email = cols[emailIdx] || "";
    const name = cols[nameIdx] || "";
    const role = cols[roleIdx] || "";
    const department = cols[deptIdx] || "";

    const errors: string[] = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("invalid email");
    if (!name) errors.push("missing name");
    if (!validRoles.includes(role.toLowerCase())) errors.push("invalid role");
    if (!department) errors.push("missing department");

    return {
      email,
      name,
      role: role.toLowerCase(),
      department,
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
          name: r.name,
          role: r.role,
          department: r.department,
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
      "email,name,role,department\njohn@university.edu,John Smith,student,Computer Science\njane@university.edu,Jane Doe,faculty,Mathematics\n";
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setParsedRows([]);
          setParseError("");
          setSuccessMsg("");
          bulkImport.reset();
        }
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Import Users
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Upload a CSV file with columns: email, name, role, department
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {/* Template download */}
            <div className="rounded-lg border border-border bg-muted/50 p-3">
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Expected CSV format:
              </p>
              <pre className="text-xs font-mono text-muted-foreground bg-background rounded p-2 overflow-x-auto">
{`email,name,role,department
john@university.edu,John Smith,student,Computer Science
jane@university.edu,Jane Doe,faculty,Mathematics`}
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
                            <td className="px-2 py-1.5 truncate max-w-[120px]">{row.email}</td>
                            <td className="px-2 py-1.5 truncate max-w-[100px]">{row.name}</td>
                            <td className="px-2 py-1.5">{row.role}</td>
                            <td className="px-2 py-1.5 truncate max-w-[100px]">{row.department}</td>
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
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

export default function AdminUsersPage() {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [confirm, setConfirm] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
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

  const handleRowClick = useCallback(
    (user: AdminUser) => {
      router.push(`/admin/users/${user.id}`);
    },
    [router]
  );

  const handleToggleStatus = useCallback((user: AdminUser) => {
    setConfirm({ open: true, user });
  }, []);

  const executeToggleStatus = useCallback(async () => {
    if (!confirm.user) return;
    const newStatus = confirm.user.status === "active" ? "suspended" : "active";
    try {
      await updateUser.mutateAsync({ id: confirm.user.id, status: newStatus });
      toast.success(newStatus === "suspended" ? `${confirm.user.name} suspended` : `${confirm.user.name} activated`);
    } catch {
      toast.error("Failed to update user status");
    }
  }, [confirm.user, updateUser]);

  const columns = createUserColumns({
    onView: handleRowClick,
    onEdit: (user) => router.push(`/admin/users/${user.id}`),
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
            onRowClick={handleRowClick}
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
      <ConfirmDialog
        open={confirm.open}
        onOpenChange={(o) => setConfirm((p) => ({ ...p, open: o }))}
        title={confirm.user?.status === "active" ? "Suspend User" : "Activate User"}
        description={confirm.user?.status === "active"
          ? `Suspend "${confirm.user?.name}"? They will lose access until reactivated.`
          : `Activate "${confirm.user?.name}"? They will regain access immediately.`}
        confirmLabel={confirm.user?.status === "active" ? "Suspend" : "Activate"}
        variant={confirm.user?.status === "active" ? "danger" : "default"}
        onConfirm={executeToggleStatus}
      />
    </div>
  );
}
