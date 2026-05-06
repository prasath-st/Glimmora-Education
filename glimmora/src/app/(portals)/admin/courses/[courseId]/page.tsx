"use client";

import { use, useState, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  GraduationCap,
  ArrowLeft,
  Users,
  Calendar,
  User,
  Hash,
  Archive,
  ArchiveRestore,
  Upload,
  X,
  Mail,
  Building2,
  Layers3,
  BookText,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import {
  useAdminCourseDetail,
  useAdminUsers,
  useUpdateCourse,
  useUnenrollStudent,
} from "@/lib/hooks/use-admin";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { cn } from "@/lib/utils/cn";
import type { AdminUser, CourseType } from "@/lib/api/types/admin.types";

function getStatusVariant(
  status: "draft" | "active" | "archived"
): "warning" | "success" | "muted" {
  const map = {
    draft: "warning" as const,
    active: "success" as const,
    archived: "muted" as const,
  };
  return map[status];
}

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

function getCourseTypeVariant(type: CourseType): "info" | "warning" | "default" {
  return type === "core" ? "info" : type === "programme_elective" ? "warning" : "default";
}

export default function AdminCourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = use(params);
  const { data: course, isLoading, isError, refetch } = useAdminCourseDetail(courseId);
  const updateCourse = useUpdateCourse();
  const unenrollStudent = useUnenrollStudent();

  // Fetch all students (paged big) so we can resolve enrolled IDs to user objects.
  // For very large institutions this would be a dedicated /enrolled endpoint; mock is fine.
  const { data: studentsData } = useAdminUsers({ role: "student", pageSize: 100 });
  const allStudents = studentsData?.users ?? [];

  const enrolledIds = course?.enrolledStudentIds ?? [];
  const enrolled: AdminUser[] = useMemo(
    () => allStudents.filter((s) => enrolledIds.includes(s.id)),
    [allStudents, enrolledIds]
  );

  const [search, setSearch] = useState("");
  const filteredEnrolled = useMemo(() => {
    if (!search) return enrolled;
    const q = search.toLowerCase();
    return enrolled.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId ?? "").toLowerCase().includes(q)
    );
  }, [enrolled, search]);

  const [archiveConfirm, setArchiveConfirm] = useState(false);
  const [unenrollConfirm, setUnenrollConfirm] = useState<{ open: boolean; student: AdminUser | null }>({
    open: false,
    student: null,
  });

  const handleArchive = useCallback(async () => {
    if (!course) return;
    const next = course.status === "archived" ? "active" : "archived";
    try {
      await updateCourse.mutateAsync({ id: course.id, status: next });
      toast.success(next === "archived" ? `${course.code} archived` : `${course.code} restored`);
    } catch {
      toast.error("Failed to update course status");
    }
  }, [course, updateCourse]);

  const handleUnenroll = useCallback(async () => {
    if (!course || !unenrollConfirm.student) return;
    try {
      await unenrollStudent.mutateAsync({
        courseId: course.id,
        studentId: unenrollConfirm.student.id,
      });
      toast.success(`${unenrollConfirm.student.name} unenrolled from ${course.code}`);
    } catch {
      toast.error("Failed to unenroll student");
    }
  }, [course, unenrollConfirm.student, unenrollStudent]);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <BackLink />
        <div className="grid gap-4 lg:grid-cols-3">
          <CardSkeleton />
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  if (isError || !course) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Failed to load course"
          message="Could not retrieve course details."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  const capacityPct = Math.round((course.enrolledCount / course.maxCapacity) * 100);
  const capacityColor =
    capacityPct >= 90 ? "bg-danger" : capacityPct >= 70 ? "bg-yellow-500" : "bg-success";

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-portal-accent">{course.code}</span>
            {course.regulationSnapshot && (
              <span className="font-mono text-xs text-muted-foreground">
                {course.regulationSnapshot}
              </span>
            )}
            {course.courseType && (
              <StatusBadge variant={getCourseTypeVariant(course.courseType)}>
                {COURSE_TYPE_LABEL[course.courseType]}
              </StatusBadge>
            )}
            <StatusBadge variant={getStatusVariant(course.status)} dot>
              {course.status}
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{course.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">{course.description}</p>
          {course.catalogId && (
            <Link
              href={`/admin/courses/catalog/${course.catalogId}`}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-portal-accent hover:underline"
            >
              <BookText className="h-3 w-3" />
              View catalog entry
            </Link>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setArchiveConfirm(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              course.status === "archived"
                ? "border-success/30 text-success hover:bg-success-light"
                : "border-danger/30 text-danger hover:bg-danger-light"
            )}
          >
            {course.status === "archived" ? (
              <>
                <ArchiveRestore className="h-3.5 w-3.5" /> Restore
              </>
            ) : (
              <>
                <Archive className="h-3.5 w-3.5" /> Archive
              </>
            )}
          </button>
        </div>
      </div>

      {/* Draft warning when faculty is unassigned */}
      {course.status === "draft" && !course.facultyId && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            This offering is in <strong>Draft</strong> — assign faculty to make it visible
            in the faculty and student portals.
          </span>
        </div>
      )}

      {/* Info grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InfoCard
          icon={Hash}
          label="Credits"
          value={`${course.creditsSnapshot ?? course.credits} credit${(course.creditsSnapshot ?? course.credits) !== 1 ? "s" : ""}`}
        />
        <InfoCard
          icon={Layers3}
          label="Weekly L:T:P"
          value={
            course.lectureHours !== undefined
              ? `${course.lectureHours} : ${course.tutorialHours} : ${course.practicalHours}`
              : "—"
          }
        />
        <InfoCard icon={GraduationCap} label="Department" value={course.department} />
        <InfoCard
          icon={User}
          label="Faculty"
          value={course.facultyName || "Unassigned"}
        />

        <InfoCard
          icon={Building2}
          label="Programme"
          value={course.programmeName ?? "—"}
          hint={course.studyYear ? `Study Year ${course.studyYear}` : undefined}
        />
        <InfoCard
          icon={Users}
          label="Section"
          value={course.sectionName ?? "—"}
        />
        <InfoCard
          icon={Calendar}
          label="Term"
          value={course.semesterName}
          hint={course.academicYearName}
        />

        {/* Capacity card spans 1 in the 4-col grid; widen on smaller layouts */}
        <div className="rounded-xl border border-border bg-card p-5 sm:col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <Users className="h-4 w-4" />
              Enrollment
            </div>
            <p className="text-sm">
              <span className="font-semibold text-foreground">{course.enrolledCount}</span>
              <span className="text-muted-foreground"> / {course.maxCapacity}</span>
              <span className="ml-2 text-xs text-muted-foreground">({capacityPct}%)</span>
            </p>
          </div>
          <div className="mt-3 h-2 w-full rounded-full bg-muted">
            <div
              className={cn("h-2 rounded-full transition-all", capacityColor)}
              style={{ width: `${Math.min(100, capacityPct)}%` }}
            />
          </div>
          {capacityPct >= 90 && (
            <p className="mt-2 text-xs text-danger">Near capacity — consider increasing the limit before next term.</p>
          )}
        </div>
      </div>

      {/* Enrolled students */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-3 border-b border-border p-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold">Enrolled Students</h2>
            <p className="text-xs text-muted-foreground">
              {enrolled.length} of {course.maxCapacity} seats filled
            </p>
          </div>
          {course.status !== "archived" && (
            <Link
              href={`/admin/courses?enroll=${course.id}`}
              className="flex items-center gap-2 self-start rounded-lg bg-portal-accent px-3 py-1.5 text-xs font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
            >
              <Upload className="h-3 w-3" /> Enroll More
            </Link>
          )}
        </div>

        <div className="border-b border-border p-3">
          <input
            type="text"
            placeholder="Search enrolled students by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>

        {enrolled.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No students enrolled yet</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Use the Enroll More button to add students from {course.department}.
            </p>
          </div>
        ) : filteredEnrolled.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No students match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="divide-y divide-border">
            {filteredEnrolled.map((s) => (
              <div
                key={s.id}
                className="grid grid-cols-[2fr_2fr_1fr_120px] items-center gap-3 px-5 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="grid h-8 w-8 place-items-center rounded-full bg-portal-accent-light text-xs font-semibold text-portal-accent shrink-0">
                    {s.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{s.name}</p>
                    {s.studentId && (
                      <p className="truncate text-xs font-mono text-muted-foreground">{s.studentId}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground min-w-0">
                  <Mail className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{s.email}</span>
                </div>
                <p className="text-sm text-muted-foreground">{s.department}</p>
                <div className="flex justify-end">
                  {course.status !== "archived" && (
                    <button
                      onClick={() => setUnenrollConfirm({ open: true, student: s })}
                      className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                    >
                      <X className="inline h-3 w-3 mr-1" />
                      Unenroll
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmDialog
        open={archiveConfirm}
        onOpenChange={setArchiveConfirm}
        title={course.status === "archived" ? "Restore Course" : "Archive Course"}
        description={
          course.status === "archived"
            ? `Restore "${course.code}"? It will become available for enrollment again.`
            : `Archive "${course.code}"? ${course.enrolledCount} student${course.enrolledCount !== 1 ? "s" : ""} currently enrolled. Existing enrollments stay; new enrollments will be blocked.`
        }
        confirmLabel={course.status === "archived" ? "Restore" : "Archive"}
        variant={course.status === "archived" ? "default" : "danger"}
        onConfirm={handleArchive}
      />

      <ConfirmDialog
        open={unenrollConfirm.open}
        onOpenChange={(o) => setUnenrollConfirm((p) => ({ ...p, open: o }))}
        title="Unenroll Student"
        description={
          unenrollConfirm.student
            ? `Remove ${unenrollConfirm.student.name} from ${course.code}? Their grade history (if any) is preserved.`
            : ""
        }
        confirmLabel="Unenroll"
        variant="danger"
        onConfirm={handleUnenroll}
      />
    </div>
  );
}

function BackLink() {
  return (
    <Link
      href="/admin/courses"
      className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
    >
      <ArrowLeft className="h-3.5 w-3.5" />
      Back to Courses
    </Link>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: typeof Hash;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <p className="mt-2 text-sm font-medium">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
