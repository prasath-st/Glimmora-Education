"use client";

import { use, useMemo } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  GraduationCap,
  Hash,
  BookText,
  Building2,
  Layers3,
  CalendarRange,
  AlertCircle,
} from "lucide-react";
import { useRouter } from "next/navigation";
import {
  useCatalogDetail,
  useCourseOfferings,
} from "@/lib/hooks/use-admin";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { CardSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import type { CourseType } from "@/lib/api/types/admin.types";

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

function getCourseTypeVariant(type: CourseType): "info" | "warning" | "default" {
  return type === "core" ? "info" : type === "programme_elective" ? "warning" : "default";
}

export default function CatalogDetailPage({
  params,
}: {
  params: Promise<{ catalogId: string }>;
}) {
  const router = useRouter();
  const { catalogId } = use(params);
  const {
    data: catalog,
    isLoading,
    isError,
    refetch,
  } = useCatalogDetail(catalogId);

  // Pull every offering that references this catalog so admins can see
  // exactly where (and when) the course has been scheduled.
  const { data: offeringsData, isLoading: offeringsLoading } = useCourseOfferings({
    catalogId,
    pageSize: 100,
  });
  const offerings = offeringsData?.offerings ?? [];

  const draftOfferings = useMemo(
    () => offerings.filter((o) => o.status === "draft"),
    [offerings],
  );

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

  if (isError || !catalog) {
    return (
      <div className="space-y-6">
        <BackLink />
        <ErrorState
          title="Failed to load catalog course"
          message="Could not retrieve the catalog entry."
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
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-portal-accent">{catalog.code}</span>
            <span className="font-mono text-xs text-muted-foreground">
              {catalog.regulation}
            </span>
            <StatusBadge variant={getCourseTypeVariant(catalog.courseType)}>
              {COURSE_TYPE_LABEL[catalog.courseType]}
            </StatusBadge>
            <StatusBadge variant={catalog.status === "active" ? "success" : "muted"} dot>
              {catalog.status}
            </StatusBadge>
          </div>
          <h1 className="mt-1 text-2xl font-semibold">{catalog.name}</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            {catalog.description}
          </p>
        </div>
      </div>

      {/* Info grid */}
      <div className="grid gap-4 lg:grid-cols-4">
        <InfoCard
          icon={Hash}
          label="Credits"
          value={`${catalog.credits} credit${catalog.credits !== 1 ? "s" : ""}`}
        />
        <InfoCard
          icon={Layers3}
          label="Weekly L:T:P"
          value={`${catalog.lectureHours} : ${catalog.tutorialHours} : ${catalog.practicalHours}`}
          hint="Lecture · Tutorial · Practical hours per week"
        />
        <InfoCard
          icon={Building2}
          label="Owning Department"
          value={catalog.owningDepartmentName ?? "Cross-cutting"}
        />
        <InfoCard
          icon={CalendarRange}
          label="Active Offerings"
          value={`${offerings.length} scheduled`}
        />
      </div>

      {/* Syllabus */}
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <BookText className="h-4 w-4" />
          Syllabus (Master)
        </div>
        <pre className="mt-3 whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground">
          {catalog.syllabus}
        </pre>
        <p className="mt-4 rounded-lg bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          Edits to the syllabus apply to <strong>future offerings only</strong>. Past
          offerings keep the snapshot they were created with — important for transcript
          fidelity.
        </p>
      </div>

      {/* Offerings list */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-base font-semibold">Scheduled Offerings</h2>
            <p className="text-xs text-muted-foreground">
              Where and when this course is being taught.
            </p>
          </div>
          <Link
            href="/admin/courses"
            className="rounded-lg border border-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-muted"
          >
            Schedule Another
          </Link>
        </div>

        {draftOfferings.length > 0 && (
          <div className="border-b border-border bg-warning-light/40 px-5 py-3 text-xs text-warning flex items-center gap-2">
            <AlertCircle className="h-3.5 w-3.5" />
            <span>
              {draftOfferings.length} of these offering
              {draftOfferings.length === 1 ? "" : "s"}
              {draftOfferings.length === 1 ? " is" : " are"} in <strong>Draft</strong>
              {" "}— faculty hasn&apos;t been assigned yet.
            </span>
          </div>
        )}

        {offeringsLoading ? (
          <div className="p-5">
            <CardSkeleton />
          </div>
        ) : offerings.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-6 py-12 text-center">
            <CalendarRange className="h-10 w-10 text-muted-foreground/40" />
            <p className="mt-3 text-sm font-medium">No offerings scheduled yet</p>
            <p className="mt-1 max-w-sm text-xs text-muted-foreground">
              This catalog course hasn&apos;t been scheduled. Use{" "}
              <Link
                href="/admin/courses"
                className="font-medium text-portal-accent underline-offset-4 hover:underline"
              >
                Schedule Offering
              </Link>{" "}
              to add it to a section.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {offerings.map((o) => (
              <button
                key={o.id}
                onClick={() => router.push(`/admin/courses/${o.id}`)}
                className="grid w-full grid-cols-[1fr_1fr_1fr_auto] items-center gap-4 px-5 py-3 text-left transition-colors hover:bg-muted/40"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium">{o.sectionName || "—"}</p>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {o.programmeName} · Year {o.studyYear}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-sm">{o.semesterName}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {o.academicYearName}
                  </p>
                </div>
                <div className="min-w-0">
                  {o.facultyName ? (
                    <p className="truncate text-sm">{o.facultyName}</p>
                  ) : (
                    <p className="flex items-center gap-1 text-xs text-warning">
                      <AlertCircle className="h-3 w-3" /> Faculty unassigned
                    </p>
                  )}
                  <p className="mt-0.5 text-xs text-muted-foreground tabular-nums">
                    {o.enrolledCount}/{o.maxCapacity} enrolled
                  </p>
                </div>
                <StatusBadge
                  variant={
                    o.status === "active"
                      ? "success"
                      : o.status === "draft"
                        ? "warning"
                        : "muted"
                  }
                  dot
                >
                  {o.status}
                </StatusBadge>
              </button>
            ))}
          </div>
        )}
      </div>
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
  icon: typeof GraduationCap;
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
