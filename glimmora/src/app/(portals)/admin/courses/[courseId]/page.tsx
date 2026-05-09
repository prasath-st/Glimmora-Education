"use client";

import { use, useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  GraduationCap,
  Hash,
  Layers3,
  Building2,
  User,
  Users,
  Calendar,
  BookText,
  AlertCircle,
  Mail,
  X,
  Archive,
  ArchiveRestore,
  UserCog,
  ClipboardList,
  Search,
} from "lucide-react";
import { toast } from "sonner";
import {
  useOfferingDetail,
  useUpdateCourse,
  useUnenrollStudent,
  useAdminUsers,
} from "@/lib/hooks/use-admin";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { AssignFacultyDialog } from "../_components/drawers";
import { cn } from "@/lib/utils/cn";
import type { AdminUser, CourseType } from "@/lib/api/types/admin.types";

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

function getCourseTypeVariant(
  type: CourseType,
): "info" | "warning" | "default" {
  return type === "core"
    ? "info"
    : type === "programme_elective"
      ? "warning"
      : "default";
}

function getStatusVariant(
  status: "draft" | "active" | "archived",
): "warning" | "success" | "muted" {
  return status === "draft"
    ? "warning"
    : status === "active"
      ? "success"
      : "muted";
}

type Tab = "overview" | "roster";

export default function OfferingDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { courseId } = use(params);

  const tab = (searchParams.get("tab") as Tab) ?? "overview";
  const setTab = useCallback(
    (next: Tab) => {
      const sp = new URLSearchParams(searchParams.toString());
      sp.set("tab", next);
      router.replace(`?${sp.toString()}`);
    },
    [router, searchParams],
  );

  const {
    data: course,
    isLoading,
    isError,
    refetch,
  } = useOfferingDetail(courseId);
  const updateCourse = useUpdateCourse();

  const [archiveOpen, setArchiveOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);

  const isArchived = course?.status === "archived";
  const needsFaculty = course && !course.facultyId;

  const handleArchive = useCallback(async () => {
    if (!course) return;
    const next = isArchived ? "active" : "archived";
    try {
      await updateCourse.mutateAsync({ id: course.id, status: next });
      toast.success(
        next === "archived"
          ? `${course.catalogCode} archived. Existing students keep access to past materials.`
          : `${course.catalogCode} restored.`,
      );
    } catch {
      toast.error("Could not change offering status.");
    }
  }, [course, isArchived, updateCourse]);

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
          title="Failed to load offering"
          message="Could not retrieve the offering."
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <BackLink />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-sm text-portal-accent">
              {course.catalogCode}
            </span>
            <span className="rounded-md border border-border bg-muted/40 px-2 py-0.5 font-mono text-xs text-muted-foreground">
              {course.regulationSnapshot}
            </span>
            <StatusBadge variant={getCourseTypeVariant(course.courseType)}>
              {COURSE_TYPE_LABEL[course.courseType]}
            </StatusBadge>
            <StatusBadge variant={getStatusVariant(course.status)} dot>
              {course.status}
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{course.catalogName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {course.sectionName} · {course.semesterName} ·{" "}
            {course.academicYearName}
          </p>
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
        <div className="flex flex-wrap items-center gap-2">
          {!isArchived && needsFaculty && (
            <button
              type="button"
              onClick={() => setAssignOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-portal-accent/40 bg-portal-accent-light px-3 py-2 text-sm font-medium text-portal-accent transition-colors hover:bg-portal-accent-light/80"
            >
              <UserCog className="h-3.5 w-3.5" />
              Assign faculty
            </button>
          )}
          <button
            type="button"
            onClick={() => setArchiveOpen(true)}
            className={cn(
              "flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors",
              isArchived
                ? "border-success/30 text-success hover:bg-success-light"
                : "border-danger/30 text-danger hover:bg-danger-light",
            )}
          >
            {isArchived ? (
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

      {/* Draft warning */}
      {course.status === "draft" && !course.facultyId && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            This offering is in <strong>Draft</strong> — assign faculty to make
            it visible in the faculty and student portals.
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex w-fit items-center gap-1 rounded-lg border border-border bg-muted/40 p-1">
        <TabButton
          active={tab === "overview"}
          onClick={() => setTab("overview")}
          icon={ClipboardList}
          label="Overview"
        />
        <TabButton
          active={tab === "roster"}
          onClick={() => setTab("roster")}
          icon={Users}
          label="Roster"
          count={course.enrolledCount}
        />
      </div>

      {tab === "overview" ? (
        <OverviewTab course={course} />
      ) : (
        <RosterTab
          courseId={course.id}
          enrolledIds={course.enrolledStudentIds ?? []}
          isArchived={isArchived ?? false}
          courseCode={course.catalogCode}
        />
      )}

      <AssignFacultyDialog
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        offering={course}
      />
      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title={isArchived ? "Restore offering" : "Archive offering"}
        description={
          isArchived
            ? `Restore "${course.catalogCode}" for ${course.sectionName}? Faculty and students will see it again.`
            : `Archive "${course.catalogCode}" for ${course.sectionName}? Existing enrollments are preserved; new ones are blocked.`
        }
        confirmLabel={isArchived ? "Restore" : "Archive"}
        variant={isArchived ? "default" : "danger"}
        onConfirm={handleArchive}
      />
    </div>
  );
}

/* ── Tabs ──────────────────────────────────────────────────────────────── */

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Users;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
          : "text-muted-foreground hover:bg-background/50 hover:text-foreground",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "rounded-full px-1.5 text-[10px] tabular-nums",
            active
              ? "bg-portal-accent-light text-portal-accent"
              : "bg-muted text-muted-foreground",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}

/* ── Overview Tab ──────────────────────────────────────────────────────── */

function OverviewTab({
  course,
}: {
  course: NonNullable<ReturnType<typeof useOfferingDetail>["data"]>;
}) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <InfoCard
          icon={Hash}
          label="Credits"
          value={`${course.creditsSnapshot} credit${course.creditsSnapshot !== 1 ? "s" : ""}`}
        />
        <InfoCard
          icon={Layers3}
          label="Weekly L:T:P"
          value={`${course.lectureHours} : ${course.tutorialHours} : ${course.practicalHours}`}
        />
        <InfoCard
          icon={GraduationCap}
          label="Department"
          value={course.department}
        />
        <InfoCard
          icon={User}
          label="Faculty"
          value={course.facultyName ?? "Unassigned"}
        />
        <InfoCard
          icon={Building2}
          label="Programme"
          value={course.programmeName}
          hint={`Year ${course.studyYear}`}
        />
        <InfoCard
          icon={Calendar}
          label="Term"
          value={course.semesterName}
          hint={course.academicYearName}
        />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Users className="h-4 w-4" /> Enrollment
        </div>
        <p className="mt-3 text-sm">
          <span className="text-3xl font-semibold text-foreground">
            {course.enrolledCount}
          </span>
          <span className="ml-2 text-muted-foreground">
            student{course.enrolledCount === 1 ? "" : "s"} enrolled
          </span>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Open enrolment — anyone can join.
        </p>
      </div>
    </div>
  );
}

/* ── Roster Tab ────────────────────────────────────────────────────────── */

function RosterTab({
  courseId,
  enrolledIds,
  isArchived,
  courseCode,
}: {
  courseId: string;
  enrolledIds: string[];
  isArchived: boolean;
  courseCode: string;
}) {
  const unenrollStudent = useUnenrollStudent();
  const { data: studentsData, isLoading } = useAdminUsers({
    role: "student",
    pageSize: 500,
  });
  const allStudents = studentsData?.users ?? [];

  const enrolled: AdminUser[] = useMemo(
    () => allStudents.filter((s) => enrolledIds.includes(s.id)),
    [allStudents, enrolledIds],
  );

  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    if (!search) return enrolled;
    const q = search.toLowerCase();
    return enrolled.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.email.toLowerCase().includes(q) ||
        (s.studentId ?? "").toLowerCase().includes(q),
    );
  }, [enrolled, search]);

  const [unenrollConfirm, setUnenrollConfirm] = useState<{
    open: boolean;
    student: AdminUser | null;
  }>({ open: false, student: null });

  const handleUnenroll = useCallback(async () => {
    if (!unenrollConfirm.student) return;
    try {
      await unenrollStudent.mutateAsync({
        courseId,
        studentId: unenrollConfirm.student.id,
      });
      toast.success(
        `${unenrollConfirm.student.name} unenrolled from ${courseCode}`,
      );
    } catch {
      toast.error("Failed to unenroll student");
    }
  }, [courseId, courseCode, unenrollConfirm.student, unenrollStudent]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full sm:max-w-sm">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name, email, or student ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary-400"
          />
        </div>
        <p className="text-xs text-muted-foreground">
          {enrolled.length} enrolled{search ? ` · ${filtered.length} match` : ""}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-card">
        {isLoading ? (
          <div className="p-5">
            <CardSkeleton />
          </div>
        ) : enrolled.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <Users className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No students enrolled</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              {isArchived
                ? "This offering is archived; no student records were retained on it."
                : "Students will appear here once enrolled."}
            </p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-muted-foreground">
            No students match &ldquo;{search}&rdquo;.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr className="border-b border-border">
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Student
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Email
                  </th>
                  <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Department
                  </th>
                  <th className="px-5 py-3 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-border last:border-0 hover:bg-muted/30"
                  >
                    <td className="px-5 py-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-portal-accent-light text-xs font-semibold text-portal-accent">
                          {s.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .slice(0, 2)
                            .toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium">
                            {s.name}
                          </p>
                          {s.studentId && (
                            <p className="truncate font-mono text-xs text-muted-foreground">
                              {s.studentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3">
                      <span className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">{s.email}</span>
                      </span>
                    </td>
                    <td className="px-5 py-3 text-sm text-muted-foreground">
                      {s.department}
                    </td>
                    <td className="px-5 py-3 text-right">
                      {!isArchived && (
                        <button
                          type="button"
                          onClick={() =>
                            setUnenrollConfirm({ open: true, student: s })
                          }
                          className="rounded-lg border border-danger/20 px-3 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-light"
                        >
                          <X className="mr-1 inline h-3 w-3" />
                          Unenroll
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={unenrollConfirm.open}
        onOpenChange={(o) => setUnenrollConfirm((p) => ({ ...p, open: o }))}
        title="Unenroll Student"
        description={
          unenrollConfirm.student
            ? `Remove ${unenrollConfirm.student.name} from ${courseCode}? Their grade history (if any) is preserved.`
            : ""
        }
        confirmLabel="Unenroll"
        variant="danger"
        onConfirm={handleUnenroll}
      />
    </div>
  );
}

/* ── Helpers ───────────────────────────────────────────────────────────── */

function BackLink() {
  return (
    <Link
      href="/admin/courses?tab=offerings"
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
