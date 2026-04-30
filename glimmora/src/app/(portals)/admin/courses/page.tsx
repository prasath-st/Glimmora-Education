"use client";

import { useState, useCallback, useMemo } from "react";
import { GraduationCap, Plus, Loader2, X, Upload, MoreHorizontal, Pencil, Archive, ArchiveRestore, AlertTriangle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useAdminCourses,
  useAdminUsers,
  useCreateCourse,
  useUpdateCourse,
  useEnrollStudents,
  useSemesters,
  usePrograms,
} from "@/lib/hooks/use-admin";
import {
  createCourseSchema,
  type CreateCourseFormData,
  type CreateCourseFormInput,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { FileUpload } from "@/components/shared/forms/file-upload";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { FormField, FormSelect, FormTextarea } from "@/components/shared/forms/form-field";
import { cn } from "@/lib/utils/cn";
import type { AdminCourse } from "@/lib/api/types/admin.types";

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

function getCourseStatusVariant(
  status: "draft" | "active" | "archived"
): "warning" | "success" | "muted" {
  const map = {
    draft: "warning" as const,
    active: "success" as const,
    archived: "muted" as const,
  };
  return map[status];
}

function CourseDialog({
  open,
  onOpenChange,
  semesterOptions,
  departmentOptions,
  facultyOptions,
  editingCourse,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterOptions: { value: string; label: string }[];
  departmentOptions: { value: string; label: string }[];
  facultyOptions: { value: string; label: string }[];
  editingCourse: AdminCourse | null;
}) {
  const createCourse = useCreateCourse();
  const updateCourse = useUpdateCourse();
  const [successMsg, setSuccessMsg] = useState("");
  const isEditing = !!editingCourse;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseFormInput, unknown, CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: editingCourse
      ? {
          code: editingCourse.code,
          name: editingCourse.name,
          description: editingCourse.description,
          credits: editingCourse.credits,
          department: editingCourse.department,
          semesterId: editingCourse.semesterId,
          facultyId: editingCourse.facultyId,
          maxCapacity: editingCourse.maxCapacity,
        }
      : {
          code: "",
          name: "",
          description: "",
          credits: 3,
          department: "",
          semesterId: "",
          facultyId: "",
          maxCapacity: 120,
        },
  });

  const onSubmit = useCallback(
    async (data: CreateCourseFormData) => {
      try {
        if (isEditing && editingCourse) {
          await updateCourse.mutateAsync({ id: editingCourse.id, ...data });
          setSuccessMsg(`Course "${data.code} — ${data.name}" updated.`);
        } else {
          await createCourse.mutateAsync(data);
          setSuccessMsg(`Course "${data.code} — ${data.name}" created as draft.`);
        }
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1200);
      } catch {
        // error shown via mutation state
      }
    },
    [isEditing, editingCourse, createCourse, updateCourse, reset, onOpenChange]
  );

  const isPending = createCourse.isPending || updateCourse.isPending;
  const isError = createCourse.isError || updateCourse.isError;

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              {isEditing ? "Edit Course" : "Create Course"}
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {isEditing ? `Update details for ${editingCourse?.code}` : "Add a new course to the catalog."}
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
            {departmentOptions.length <= 1 && (
              <div className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
                No active programs available. <a href="/admin/programs" className="font-semibold underline">Create a program</a> to populate departments.
              </div>
            )}
            {facultyOptions.length === 0 && (
              <div className="rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
                No faculty users yet. <a href="/admin/users" className="font-semibold underline">Add a faculty user</a> first.
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                label="Course Code"
                placeholder="e.g. CS301"
                error={errors.code?.message}
                required
                {...register("code")}
              />
              <FormField
                label="Credits"
                type="number"
                placeholder="3"
                error={errors.credits?.message}
                required
                {...register("credits")}
              />
            </div>
            <FormField
              label="Course Name"
              placeholder="e.g. Data Structures & Algorithms"
              error={errors.name?.message}
              required
              {...register("name")}
            />
            <FormTextarea
              label="Description"
              placeholder="Course description..."
              error={errors.description?.message}
              required
              {...register("description")}
            />
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Department"
                options={departmentOptions}
                error={errors.department?.message}
                required
                {...register("department")}
              />
              <FormSelect
                label="Semester"
                options={semesterOptions}
                error={errors.semesterId?.message}
                required
                {...register("semesterId")}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <FormSelect
                label="Faculty"
                options={facultyOptions}
                error={errors.facultyId?.message}
                required
                {...register("facultyId")}
              />
              <FormField
                label="Max Capacity"
                type="number"
                placeholder="120"
                error={errors.maxCapacity?.message}
                required
                {...register("maxCapacity")}
              />
            </div>

            {isError && (
              <p className="text-xs text-danger">
                Operation failed. Please check the details and try again.
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
                disabled={isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                {isEditing ? "Save Changes" : "Create Course"}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function EnrollStudentsDialog({
  open,
  onOpenChange,
  course,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  course: AdminCourse | null;
}) {
  const enrollStudents = useEnrollStudents();
  const [enrollMode, setEnrollMode] = useState<"search" | "csv">("search");
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [studentIdsText, setStudentIdsText] = useState("");
  const [, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");
  const [showAllDepts, setShowAllDepts] = useState(false);

  // Restrict to course's department for safety; admin can opt in to "show all"
  const { data: studentsData, isLoading: studentsLoading } = useAdminUsers({
    role: "student",
    search: studentSearch || undefined,
    pageSize: 50,
  });
  const allStudents = studentsData?.users ?? [];
  const students = useMemo(() => {
    if (!course || showAllDepts) return allStudents;
    return allStudents.filter((s) => s.department === course.department);
  }, [allStudents, course, showAllDepts]);
  const filteredOutCount = allStudents.length - students.length;

  const toggleStudent = useCallback((id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }, []);

  const csvParsedCount = studentIdsText
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean).length;

  const enrollCount = enrollMode === "search" ? selectedIds.length : csvParsedCount;

  const handleEnroll = useCallback(async () => {
    if (!course) return;

    let ids: string[];
    if (enrollMode === "search") {
      ids = selectedIds;
    } else {
      ids = studentIdsText
        .split(/[\n,]+/)
        .map((s) => s.trim())
        .filter(Boolean);
    }

    if (ids.length === 0) return;

    try {
      await enrollStudents.mutateAsync({
        courseId: course.id,
        studentIds: ids,
      });
      setSuccessMsg(
        `Successfully enrolled ${ids.length} student${ids.length > 1 ? "s" : ""} in ${course.code}.`
      );
      setSelectedIds([]);
      setStudentIdsText("");
      setStudentSearch("");
      setTimeout(() => {
        setSuccessMsg("");
        onOpenChange(false);
      }, 1500);
    } catch {
      // error shown via mutation state
    }
  }, [course, enrollMode, selectedIds, studentIdsText, enrollStudents, onOpenChange]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(v) => {
        if (!v) {
          setSelectedIds([]);
          setStudentIdsText("");
          setStudentSearch("");
          setCsvFile(null);
          setCsvPreview([]);
          setSuccessMsg("");
          setEnrollMode("search");
          enrollStudents.reset();
        }
        onOpenChange(v);
      }}
    >
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Enroll Students
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            {course
              ? `Add students to ${course.code} — ${course.name} (${course.enrolledCount}/${course.maxCapacity} enrolled)`
              : "Select a course first"}
          </Dialog.Description>

          <div className="mt-4 space-y-4">
            {/* Mode toggle */}
            <div className="flex rounded-lg border border-border p-0.5 bg-muted/50">
              <button
                type="button"
                onClick={() => setEnrollMode("search")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  enrollMode === "search"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                Search & Select
              </button>
              <button
                type="button"
                onClick={() => setEnrollMode("csv")}
                className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  enrollMode === "csv"
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                File Upload
              </button>
            </div>

            {enrollMode === "search" ? (
              <div className="space-y-3">
                <input
                  type="text"
                  placeholder="Search students by name or email..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="flex w-full h-9 rounded-lg border border-input bg-background px-3 text-sm transition-colors placeholder:text-muted-foreground hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
                />
                {course && (
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      Showing students from <span className="font-medium text-foreground">{course.department}</span>
                      {!showAllDepts && filteredOutCount > 0 && (
                        <> · {filteredOutCount} hidden from other depts</>
                      )}
                    </span>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showAllDepts}
                        onChange={(e) => setShowAllDepts(e.target.checked)}
                        className="h-3 w-3 rounded border-border text-portal-accent focus:ring-portal-accent"
                      />
                      <span className="text-muted-foreground">Show all departments</span>
                    </label>
                  </div>
                )}
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border">
                  {studentsLoading ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      <span className="ml-2 text-xs text-muted-foreground">Loading students...</span>
                    </div>
                  ) : students.length === 0 ? (
                    <p className="px-3 py-4 text-center text-xs text-muted-foreground">
                      {studentSearch ? "No students match your search." : "No students found."}
                    </p>
                  ) : (
                    <div className="space-y-0">
                      {students.map((student) => (
                        <label
                          key={student.id}
                          className="flex items-center gap-2 px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(student.id)}
                            onChange={() => toggleStudent(student.id)}
                            className="h-3.5 w-3.5 rounded border-border text-portal-accent focus:ring-portal-accent"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm font-medium">{student.name}</span>
                            <span className="ml-2 text-xs text-muted-foreground">{student.email}</span>
                          </div>
                          <span className="text-xs text-muted-foreground shrink-0">{student.department}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {selectedIds.length} student{selectedIds.length !== 1 ? "s" : ""} selected
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <FileUpload
                  label="Upload CSV File"
                  accept=".csv"
                  maxSize={5}
                  onFilesChange={(files) => {
                    const file = files[0];
                    if (!file) { setCsvFile(null); setCsvPreview([]); setStudentIdsText(""); return; }
                    setCsvFile(file);
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const text = e.target?.result as string;
                      const ids = text.split(/[\n,]+/).map((s) => s.trim()).filter(Boolean);
                      setStudentIdsText(ids.join("\n"));
                      setCsvPreview(ids.slice(0, 8));
                    };
                    reader.readAsText(file);
                  }}
                />
                {csvPreview.length > 0 && (
                  <div>
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Preview ({csvParsedCount} IDs found)</p>
                    <div className="max-h-36 overflow-y-auto rounded-lg border border-border">
                      {csvPreview.map((id, i) => (
                        <div key={i} className="flex items-center gap-2 border-b border-border px-3 py-1.5 last:border-0 text-sm font-mono">
                          <span className="text-xs text-muted-foreground">{i + 1}.</span>
                          <span>{id}</span>
                        </div>
                      ))}
                      {csvParsedCount > 8 && (
                        <div className="px-3 py-1.5 text-xs text-muted-foreground">
                          ...and {csvParsedCount - 8} more
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {enrollStudents.isError && (
              <p className="text-xs text-danger">
                Failed to enroll students. Enrollment may exceed capacity.
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
                onClick={handleEnroll}
                disabled={enrollStudents.isPending || enrollCount === 0}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {enrollStudents.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                <Upload className="h-3.5 w-3.5" />
                Enroll {enrollCount > 0 ? `${enrollCount} Student${enrollCount > 1 ? "s" : ""}` : "Students"}
              </button>
            </div>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

function CourseRowActions({
  course,
  onEdit,
  onEnroll,
  onToggleArchive,
}: {
  course: AdminCourse;
  onEdit: () => void;
  onEnroll: () => void;
  onToggleArchive: () => void;
}) {
  const isArchived = course.status === "archived";
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          onClick={(e) => e.stopPropagation()}
          className="rounded-lg p-1.5 text-muted-foreground opacity-0 transition-all hover:bg-muted hover:text-foreground group-hover:opacity-100 data-[state=open]:opacity-100"
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
          {!isArchived && (
            <>
              <DropdownMenu.Item
                onSelect={onEnroll}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <Upload className="h-4 w-4 text-muted-foreground" /> Enroll Students
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onEdit}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" /> Edit
              </DropdownMenu.Item>
              <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
            </>
          )}
          <DropdownMenu.Item
            onSelect={onToggleArchive}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isArchived ? "text-success" : "text-danger"
            )}
          >
            {isArchived ? (
              <>
                <ArchiveRestore className="h-4 w-4" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-4 w-4" /> Archive
              </>
            )}
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

export default function AdminCoursesPage() {
  const [courseDialog, setCourseDialog] = useState<{ open: boolean; editing: AdminCourse | null }>({
    open: false,
    editing: null,
  });
  const [enrollDialog, setEnrollDialog] = useState<{
    open: boolean;
    course: AdminCourse | null;
  }>({ open: false, course: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{ open: boolean; course: AdminCourse | null }>({
    open: false,
    course: null,
  });
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError, refetch } = useAdminCourses({
    search: search || undefined,
    department: deptFilter || undefined,
    semester: semesterFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });

  const { data: semesters } = useSemesters();
  const { data: programsData } = usePrograms({ status: "active" });
  const { data: facultyData } = useAdminUsers({ role: "faculty", status: "active", pageSize: 100 });
  const updateCourse = useUpdateCourse();

  // Distinct departments from active programs
  const distinctDepartments = useMemo(() => {
    const seen = new Set<string>();
    for (const p of programsData?.data ?? []) seen.add(p.department);
    return Array.from(seen);
  }, [programsData]);

  const departmentFilterOptions = useMemo(() => [
    { value: "", label: "All Departments" },
    ...distinctDepartments.map((d) => ({ value: d, label: d })),
  ], [distinctDepartments]);

  const departmentCreateOptions = useMemo(() => [
    { value: "", label: "Select a department..." },
    ...distinctDepartments.map((d) => ({ value: d, label: d })),
  ], [distinctDepartments]);

  const facultyOptions = useMemo(() => {
    const list = facultyData?.users ?? [];
    return [
      { value: "", label: "Select a faculty member..." },
      ...list.map((f) => ({ value: f.id, label: f.name })),
    ];
  }, [facultyData]);

  const semesterFilterOptions = [
    { value: "", label: "All Semesters" },
    ...(semesters?.map((s) => ({ value: s.id, label: s.name })) ?? []),
  ];

  const semesterCreateOptions =
    semesters
      ?.filter((s) => s.status !== "completed")
      .map((s) => ({ value: s.id, label: s.name })) ?? [];

  const handleSearch = useCallback((value: string) => {
    setSearch(value);
    setPage(1);
  }, []);

  const handleEdit = useCallback((course: AdminCourse) => {
    setCourseDialog({ open: true, editing: course });
  }, []);

  const handleArchive = useCallback((course: AdminCourse) => {
    setArchiveConfirm({ open: true, course });
  }, []);

  const executeArchive = useCallback(async () => {
    if (!archiveConfirm.course) return;
    const next = archiveConfirm.course.status === "archived" ? "active" : "archived";
    try {
      await updateCourse.mutateAsync({ id: archiveConfirm.course.id, status: next });
      toast.success(next === "archived" ? `${archiveConfirm.course.code} archived` : `${archiveConfirm.course.code} restored`);
    } catch {
      toast.error("Failed to update course status");
    }
  }, [archiveConfirm.course, updateCourse]);

  const courseColumns: ColumnDef<AdminCourse, unknown>[] = [
    {
      id: "course",
      header: "Course",
      cell: ({ row }) => {
        const c = row.original;
        return (
          <div>
            <p className="font-medium">
              <span className="font-mono text-xs text-portal-accent">{c.code}</span>{" "}
              {c.name}
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {c.credits} credit{c.credits > 1 ? "s" : ""}
            </p>
          </div>
        );
      },
    },
    { accessorKey: "department", header: "Department" },
    { accessorKey: "semesterName", header: "Semester" },
    { accessorKey: "facultyName", header: "Faculty" },
    {
      id: "enrollment",
      header: "Enrollment",
      cell: ({ row }) => {
        const c = row.original;
        const pct = Math.round((c.enrolledCount / c.maxCapacity) * 100);
        const barColor =
          pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-yellow-500" : "bg-success";
        return (
          <div className="min-w-[100px]">
            <p className="text-sm">
              {c.enrolledCount}/{c.maxCapacity}
            </p>
            <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
              <div
                className={`h-1.5 rounded-full ${barColor}`}
                style={{ width: `${Math.min(100, pct)}%` }}
              />
            </div>
          </div>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ getValue }) => {
        const status = getValue() as AdminCourse["status"];
        return (
          <StatusBadge variant={getCourseStatusVariant(status)} dot>
            {status}
          </StatusBadge>
        );
      },
    },
    {
      id: "actions",
      header: "",
      cell: ({ row }) => (
        <CourseRowActions
          course={row.original}
          onEdit={() => handleEdit(row.original)}
          onEnroll={() => setEnrollDialog({ open: true, course: row.original })}
          onToggleArchive={() => handleArchive(row.original)}
        />
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Course Catalog"
        description="Manage courses, assign faculty, and enroll students"
        actions={
          <button
            onClick={() => setCourseDialog({ open: true, editing: null })}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Create Course
          </button>
        }
      />

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          onSearch={handleSearch}
          placeholder="Search courses..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {departmentFilterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={semesterFilter}
          onChange={(e) => {
            setSemesterFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {semesterFilterOptions.map((opt) => (
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
          title="Failed to load courses"
          message="Could not retrieve course data. Please try again."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={courseColumns}
            data={data?.courses ?? []}
            showSearch={false}
            showPagination={false}
            emptyTitle="No courses found"
            emptyDescription="Try adjusting your search or filters, or create a new course."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {data.meta.page} of {data.meta.totalPages} (
                {data.meta.total} courses)
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
                  onClick={() =>
                    setPage(Math.min(data.meta.totalPages, page + 1))
                  }
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

      <CourseDialog
        open={courseDialog.open}
        onOpenChange={(open) => setCourseDialog({ open, editing: open ? courseDialog.editing : null })}
        semesterOptions={semesterCreateOptions}
        departmentOptions={departmentCreateOptions}
        facultyOptions={facultyOptions}
        editingCourse={courseDialog.editing}
      />
      <EnrollStudentsDialog
        open={enrollDialog.open}
        onOpenChange={(open) => setEnrollDialog((prev) => ({ ...prev, open }))}
        course={enrollDialog.course}
      />
      <ConfirmDialog
        open={archiveConfirm.open}
        onOpenChange={(open) => setArchiveConfirm((prev) => ({ ...prev, open }))}
        title={archiveConfirm.course?.status === "archived" ? "Restore Course" : "Archive Course"}
        description={
          archiveConfirm.course?.status === "archived"
            ? `Restore "${archiveConfirm.course?.code}"? It will become available for enrollment again.`
            : `Archive "${archiveConfirm.course?.code} — ${archiveConfirm.course?.name}"? Currently enrolled: ${archiveConfirm.course?.enrolledCount ?? 0}. Existing students keep their grades; new enrollments will be blocked.`
        }
        confirmLabel={archiveConfirm.course?.status === "archived" ? "Restore" : "Archive"}
        variant={archiveConfirm.course?.status === "archived" ? "default" : "danger"}
        onConfirm={executeArchive}
      />
    </div>
  );
}
