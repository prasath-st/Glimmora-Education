"use client";

import { useState, useCallback } from "react";
import { GraduationCap, Plus, Loader2, X, Upload } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as Dialog from "@radix-ui/react-dialog";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useAdminCourses,
  useAdminUsers,
  useCreateCourse,
  useEnrollStudents,
  useSemesters,
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
import { FormField, FormSelect, FormTextarea } from "@/components/shared/forms/form-field";
import type { AdminCourse } from "@/lib/api/types/admin.types";

const DEPARTMENTS = [
  "Computer Science",
  "Electrical Engineering",
  "Mechanical Engineering",
  "Mathematics",
  "Physics",
  "Business Administration",
  "Biotechnology",
  "Civil Engineering",
];

const DEPARTMENT_OPTIONS = [
  { value: "", label: "All Departments" },
  ...DEPARTMENTS.map((d) => ({ value: d, label: d })),
];

const STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

const DEPT_SELECT_OPTIONS = DEPARTMENTS.map((d) => ({ value: d, label: d }));

// Fake faculty list for the create form
const FACULTY_OPTIONS = [
  { value: "fac_001", label: "Dr. Aarav Sharma" },
  { value: "fac_002", label: "Dr. Priya Patel" },
  { value: "fac_003", label: "Dr. Rahul Gupta" },
  { value: "fac_004", label: "Dr. Sneha Singh" },
  { value: "fac_005", label: "Dr. Vikram Kumar" },
  { value: "fac_006", label: "Dr. Ananya Reddy" },
  { value: "fac_007", label: "Dr. Rohan Nair" },
  { value: "fac_008", label: "Dr. Kavya Joshi" },
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

function CreateCourseDialog({
  open,
  onOpenChange,
  semesterOptions,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  semesterOptions: { value: string; label: string }[];
}) {
  const createCourse = useCreateCourse();
  const [successMsg, setSuccessMsg] = useState("");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCourseFormInput, unknown, CreateCourseFormData>({
    resolver: zodResolver(createCourseSchema),
    defaultValues: {
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
        await createCourse.mutateAsync(data);
        setSuccessMsg(
          `Course "${data.code} — ${data.name}" created successfully as draft.`
        );
        reset();
        setTimeout(() => {
          setSuccessMsg("");
          onOpenChange(false);
        }, 1500);
      } catch {
        // error shown via mutation state
      }
    },
    [createCourse, reset, onOpenChange]
  );

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
        <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-xl border border-border bg-card p-6 shadow-lg max-h-[90vh] overflow-y-auto data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95">
          <div className="flex items-center justify-between">
            <Dialog.Title className="text-lg font-semibold">
              Create Course
            </Dialog.Title>
            <Dialog.Close className="rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground">
              <X className="h-4 w-4" />
            </Dialog.Close>
          </div>
          <Dialog.Description className="mt-1 text-sm text-muted-foreground">
            Add a new course to the catalog.
          </Dialog.Description>

          <form onSubmit={handleSubmit(onSubmit)} className="mt-4 space-y-4">
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
                options={DEPT_SELECT_OPTIONS}
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
                options={FACULTY_OPTIONS}
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

            {createCourse.isError && (
              <p className="text-xs text-danger">
                Failed to create course. Please check the details and try again.
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
                disabled={createCourse.isPending}
                className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
              >
                {createCourse.isPending && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                )}
                Create Course
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
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<string[]>([]);
  const [successMsg, setSuccessMsg] = useState("");

  const { data: studentsData, isLoading: studentsLoading } = useAdminUsers({
    role: "student",
    search: studentSearch || undefined,
    pageSize: 50,
  });
  const students = studentsData?.users ?? [];

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

export default function AdminCoursesPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [enrollDialog, setEnrollDialog] = useState<{
    open: boolean;
    course: AdminCourse | null;
  }>({ open: false, course: null });
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
      cell: ({ row }) => {
        const course = row.original;
        if (course.status === "archived") return null;
        return (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setEnrollDialog({ open: true, course });
            }}
            className="flex items-center gap-1.5 rounded-lg border border-portal-accent/30 px-3 py-1.5 text-xs font-medium text-portal-accent transition-colors hover:bg-portal-accent-light whitespace-nowrap"
          >
            <Upload className="h-3 w-3" />
            Enroll
          </button>
        );
      },
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
            onClick={() => setCreateDialogOpen(true)}
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
          {DEPARTMENT_OPTIONS.map((opt) => (
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

      <CreateCourseDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        semesterOptions={semesterCreateOptions}
      />
      <EnrollStudentsDialog
        open={enrollDialog.open}
        onOpenChange={(open) => setEnrollDialog((prev) => ({ ...prev, open }))}
        course={enrollDialog.course}
      />
    </div>
  );
}
