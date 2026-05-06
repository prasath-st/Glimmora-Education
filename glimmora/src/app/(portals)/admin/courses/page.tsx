"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  GraduationCap,
  Plus,
  Loader2,
  MoreHorizontal,
  Pencil,
  Archive,
  ArchiveRestore,
  Eye,
  Library,
  CalendarRange,
  AlertCircle,
  UserCog,
  Layers,
} from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { type ColumnDef } from "@tanstack/react-table";
import {
  useCourseCatalog,
  useCreateCatalog,
  useUpdateCatalog,
  useCourseOfferings,
  useCreateOffering,
  useAssignFaculty,
  useDepartments,
  useSections,
  useAcademicYears,
  useAdminUsers,
  usePrograms,
  useUpdateCourse,
} from "@/lib/hooks/use-admin";
import {
  createCatalogSchema,
  type CreateCatalogFormData,
  type CreateCatalogFormInput,
  createOfferingSchema,
  type CreateOfferingFormData,
  type CreateOfferingFormInput,
} from "@/lib/schemas/admin.schema";
import { PageHeader } from "@/components/shared/misc/page-header";
import { DataTable } from "@/components/shared/data-table";
import { StatusBadge } from "@/components/shared/feedback/status-badge";
import { TableSkeleton } from "@/components/shared/feedback/loading-skeleton";
import { ErrorState } from "@/components/shared/feedback/error-state";
import { SearchInput } from "@/components/shared/forms/search-input";
import { ConfirmDialog } from "@/components/shared/feedback/confirm-dialog";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import { FormField, FormSelect, FormTextarea } from "@/components/shared/forms/form-field";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/client";
import type {
  CourseCatalog,
  CourseOffering,
  CourseType,
} from "@/lib/api/types/admin.types";

// Surface the most specific message from a thrown API error: prefer the first
// field-level detail (e.g. "Course \"CS301\" already exists under R22") over
// the generic "Validation failed" envelope.
function apiErrorMessage(err: unknown, fallback: string): string {
  if (err instanceof ApiError && err.details) {
    const firstFieldErrors = Object.values(err.details).find(
      (msgs) => Array.isArray(msgs) && msgs.length > 0,
    );
    if (firstFieldErrors && firstFieldErrors[0]) return firstFieldErrors[0];
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const COURSE_TYPE_LABEL: Record<CourseType, string> = {
  core: "Core",
  programme_elective: "Programme Elective",
  open_elective: "Open Elective",
};

const COURSE_TYPE_OPTIONS = [
  { value: "core", label: "Core" },
  { value: "programme_elective", label: "Programme Elective" },
  { value: "open_elective", label: "Open Elective" },
];

const COURSE_TYPE_FILTER_OPTIONS = [
  { value: "", label: "All Types" },
  ...COURSE_TYPE_OPTIONS,
];

const CATALOG_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "archived", label: "Archived" },
];

const OFFERING_STATUS_OPTIONS = [
  { value: "", label: "All Status" },
  { value: "active", label: "Active" },
  { value: "draft", label: "Draft" },
  { value: "archived", label: "Archived" },
];

// ─── Variants ────────────────────────────────────────────────────────────────

function getCatalogStatusVariant(status: CourseCatalog["status"]): "success" | "muted" {
  return status === "active" ? "success" : "muted";
}

function getOfferingStatusVariant(
  status: CourseOffering["status"],
): "warning" | "success" | "muted" {
  return status === "draft" ? "warning" : status === "active" ? "success" : "muted";
}

function getCourseTypeVariant(type: CourseType): "info" | "warning" | "default" {
  return type === "core" ? "info" : type === "programme_elective" ? "warning" : "default";
}

// ─── Catalog Drawer ──────────────────────────────────────────────────────────

function CatalogDrawer({
  open,
  onClose,
  editing,
  departmentOptions,
}: {
  open: boolean;
  onClose: () => void;
  editing: CourseCatalog | null;
  departmentOptions: { value: string; label: string }[];
}) {
  const createCatalog = useCreateCatalog();
  const updateCatalog = useUpdateCatalog();
  const isEditing = !!editing;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreateCatalogFormInput, unknown, CreateCatalogFormData>({
    resolver: zodResolver(createCatalogSchema),
    defaultValues: editing
      ? {
          code: editing.code,
          name: editing.name,
          description: editing.description,
          syllabus: editing.syllabus,
          regulation: editing.regulation,
          credits: editing.credits,
          courseType: editing.courseType,
          owningDepartmentId: editing.owningDepartmentId,
          lectureHours: editing.lectureHours,
          tutorialHours: editing.tutorialHours,
          practicalHours: editing.practicalHours,
        }
      : {
          code: "",
          name: "",
          description: "",
          syllabus: "",
          regulation: "R22",
          credits: 3,
          courseType: "core",
          owningDepartmentId: null,
          lectureHours: 3,
          tutorialHours: 0,
          practicalHours: 0,
        },
  });

  // Reset the form when the drawer opens with a different editing target
  // so stale values from a previous Edit click don't leak over.
  useEffect(() => {
    if (!open) return;
    reset(
      editing
        ? {
            code: editing.code,
            name: editing.name,
            description: editing.description,
            syllabus: editing.syllabus,
            regulation: editing.regulation,
            credits: editing.credits,
            courseType: editing.courseType,
            owningDepartmentId: editing.owningDepartmentId,
            lectureHours: editing.lectureHours,
            tutorialHours: editing.tutorialHours,
            practicalHours: editing.practicalHours,
          }
        : {
            code: "",
            name: "",
            description: "",
            syllabus: "",
            regulation: "R22",
            credits: 3,
            courseType: "core",
            owningDepartmentId: null,
            lectureHours: 3,
            tutorialHours: 0,
            practicalHours: 0,
          },
    );
  }, [open, editing, reset]);

  const onSubmit = useCallback(
    async (data: CreateCatalogFormData) => {
      try {
        if (isEditing && editing) {
          await updateCatalog.mutateAsync({
            id: editing.id,
            ...data,
            owningDepartmentName: data.owningDepartmentId
              ? departmentOptions.find((d) => d.value === data.owningDepartmentId)?.label ?? null
              : null,
          });
          toast.success(`${data.code} updated. Future offerings will use the new syllabus.`);
        } else {
          await createCatalog.mutateAsync(data);
          toast.success(`${data.code} added to catalog.`);
        }
        onClose();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not save the catalog course."));
      }
    },
    [isEditing, editing, createCatalog, updateCatalog, departmentOptions, onClose],
  );

  const isPending = createCatalog.isPending || updateCatalog.isPending;

  const departmentSelectOptions = useMemo(
    () => [
      { value: "", label: "No owning department (cross-cutting)" },
      ...departmentOptions,
    ],
    [departmentOptions],
  );

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title={isEditing ? `Edit ${editing?.code}` : "Add Catalog Course"}
      description={
        isEditing
          ? "Edits don't affect past offerings — they keep their snapshot."
          : "Define the course design once. Schedule it later via Section Offerings."
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
            form="catalog-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isEditing ? "Save Changes" : "Add to Catalog"}
          </button>
        </div>
      }
    >
      <form id="catalog-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Identity</h3>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Course Code"
              placeholder="e.g. CS301"
              hint="Uppercase letters, digits, hyphens"
              error={errors.code?.message}
              required
              {...register("code")}
            />
            <FormField
              label="Regulation"
              placeholder="e.g. R22"
              hint="Curriculum version this course belongs to"
              error={errors.regulation?.message}
              required
              {...register("regulation")}
            />
            <FormField
              label="Credits"
              type="number"
              min={1}
              max={12}
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
            label="Short Description"
            placeholder="One or two sentences describing what students learn."
            error={errors.description?.message}
            required
            {...register("description")}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Classification</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Course Type"
              options={COURSE_TYPE_OPTIONS}
              error={errors.courseType?.message}
              hint="Core auto-rosters whole sections; electives need student opt-in"
              required
              {...register("courseType")}
            />
            <FormSelect
              label="Owning Department"
              options={departmentSelectOptions}
              error={errors.owningDepartmentId?.message}
              hint="Optional — leave blank for cross-cutting courses"
              {...register("owningDepartmentId", {
                setValueAs: (v) => (v === "" ? null : v),
              })}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Weekly hours (L:T:P)</h3>
          <p className="text-xs text-muted-foreground -mt-2">
            How many hours per week of lecture, tutorial, and practical/lab.
          </p>
          <div className="grid grid-cols-3 gap-4">
            <FormField
              label="Lecture (L)"
              type="number"
              min={0}
              max={10}
              error={errors.lectureHours?.message}
              {...register("lectureHours")}
            />
            <FormField
              label="Tutorial (T)"
              type="number"
              min={0}
              max={10}
              error={errors.tutorialHours?.message}
              {...register("tutorialHours")}
            />
            <FormField
              label="Practical (P)"
              type="number"
              min={0}
              max={10}
              error={errors.practicalHours?.message}
              {...register("practicalHours")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">Syllabus</h3>
          <FormTextarea
            label="Syllabus / Module Breakdown"
            placeholder={`Module 1: ...\nModule 2: ...\nModule 3: ...`}
            rows={8}
            error={errors.syllabus?.message}
            hint="At least 20 characters. List the modules and topics covered."
            required
            {...register("syllabus")}
          />
        </section>
      </form>
    </SlideDrawer>
  );
}

// ─── Offering Drawer (Add Section Offering) ──────────────────────────────────

function OfferingDrawer({
  open,
  onClose,
  preselectedCatalogId,
}: {
  open: boolean;
  onClose: () => void;
  preselectedCatalogId?: string;
}) {
  const createOffering = useCreateOffering();
  const { data: catalogData } = useCourseCatalog({
    status: "active",
    pageSize: 200,
  });
  const { data: academicYears } = useAcademicYears();
  const { data: programsData } = usePrograms({ status: "active" });
  const { data: facultyData } = useAdminUsers({
    role: "faculty",
    status: "active",
    pageSize: 200,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CreateOfferingFormInput, unknown, CreateOfferingFormData>({
    resolver: zodResolver(createOfferingSchema),
    defaultValues: {
      catalogId: preselectedCatalogId ?? "",
      academicYearId: "",
      semesterId: "",
      studyYear: 1 as 1,
      sectionId: "",
      facultyId: null,
      maxCapacity: 60,
    },
  });

  // Re-seed the form when the drawer opens — keeps the preselect honoured.
  useEffect(() => {
    if (!open) return;
    reset({
      catalogId: preselectedCatalogId ?? "",
      academicYearId: "",
      semesterId: "",
      studyYear: 1 as 1,
      sectionId: "",
      facultyId: null,
      maxCapacity: 60,
    });
  }, [open, preselectedCatalogId, reset]);

  // Native <select> can't display a value that has no matching <option> yet.
  // When the drawer is opened with a preselected catalog, the catalog list
  // may still be loading — so the form value gets set but the DOM select
  // falls back to the placeholder. Re-sync the value once the option exists.
  const watchedCatalogId = watch("catalogId");
  const watchedAcademicYearId = watch("academicYearId");
  const watchedFacultyId = watch("facultyId");

  useEffect(() => {
    if (!open || !preselectedCatalogId) return;
    const present = catalogData?.catalog.some((c) => c.id === preselectedCatalogId);
    if (present && watchedCatalogId !== preselectedCatalogId) {
      setValue("catalogId", preselectedCatalogId);
    }
  }, [open, preselectedCatalogId, catalogData, watchedCatalogId, setValue]);

  // The semester options collapse to whatever is nested under the chosen
  // academic year, so admins can't mix terms across years.
  const selectedAcademicYear = useMemo(
    () => academicYears?.find((y) => y.id === watchedAcademicYearId),
    [academicYears, watchedAcademicYearId],
  );

  const selectedCatalog = useMemo(
    () => catalogData?.catalog.find((c) => c.id === watchedCatalogId),
    [catalogData, watchedCatalogId],
  );

  // Build the section options. Programme is implicit — the section row
  // already carries it, so admins pick a section directly.
  const allSections = useSections();
  const sectionOptions = useMemo(() => {
    const list = allSections.data ?? [];
    return [
      { value: "", label: "Select a section..." },
      ...list.map((s) => ({
        value: s.id,
        label: `${s.name} · ${s.programmeName} · Year ${s.studyYear}`,
      })),
    ];
  }, [allSections.data]);

  const catalogOptions = useMemo(() => {
    const list = catalogData?.catalog ?? [];
    return [
      { value: "", label: "Pick a course from the catalog..." },
      ...list.map((c) => ({
        value: c.id,
        label: `${c.code} — ${c.name} · ${COURSE_TYPE_LABEL[c.courseType]} · ${c.credits}cr`,
      })),
    ];
  }, [catalogData]);

  const academicYearOptions = useMemo(() => {
    const list = academicYears ?? [];
    return [
      { value: "", label: "Select an academic year..." },
      ...list.map((y) => ({ value: y.id, label: y.name })),
    ];
  }, [academicYears]);

  const semesterOptions = useMemo(() => {
    const sems = selectedAcademicYear?.semesters ?? [];
    return [
      { value: "", label: "Select a semester..." },
      ...sems.map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [selectedAcademicYear]);

  const facultyOptions = useMemo(() => {
    const list = facultyData?.users ?? [];
    return [
      { value: "", label: "Leave unassigned for now (offering will be Draft)" },
      ...list.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.department}`,
      })),
    ];
  }, [facultyData]);

  // Section's studyYear should drive the offering's studyYear automatically.
  const watchedSectionId = watch("sectionId");
  const selectedSection = useMemo(
    () => allSections.data?.find((s) => s.id === watchedSectionId),
    [allSections.data, watchedSectionId],
  );
  useEffect(() => {
    if (selectedSection) {
      setValue("studyYear", selectedSection.studyYear);
    }
  }, [selectedSection, setValue]);

  const onSubmit = useCallback(
    async (data: CreateOfferingFormData) => {
      try {
        const payload = {
          ...data,
          facultyId: data.facultyId || null,
        };
        const result = await createOffering.mutateAsync(payload);
        toast.success(
          payload.facultyId
            ? `Offering created and ${selectedCatalog?.code} is now scheduled.`
            : `Draft offering saved. Assign faculty to activate it.`,
        );
        if (programsData) {
          // Programs hook is invalidated indirectly; nothing to do here.
        }
        onClose();
        return result;
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not create the offering."));
      }
    },
    [createOffering, selectedCatalog, onClose, programsData],
  );

  const isPending = createOffering.isPending;

  // Show a hint about elective behaviour so admins know what'll happen on save.
  const enrollmentHint = useMemo(() => {
    if (!selectedCatalog) return null;
    if (selectedCatalog.courseType === "core") {
      return "Core course — every student in this section will be auto-enrolled.";
    }
    return "Elective — students must opt in from their portal. You'll allocate seats from the offering's detail page.";
  }, [selectedCatalog]);

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="xl"
      title="Schedule a Course Offering"
      description="Pick a catalog course, target a section, and assign faculty."
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
            form="offering-form"
            disabled={isPending}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {watchedFacultyId ? "Create & Activate" : "Save as Draft"}
          </button>
        </div>
      }
    >
      <form id="offering-form" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">1. Course</h3>
          <FormSelect
            label="Catalog Course"
            options={catalogOptions}
            error={errors.catalogId?.message}
            required
            {...register("catalogId")}
          />
          {selectedCatalog && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <Datum label="Type" value={COURSE_TYPE_LABEL[selectedCatalog.courseType]} />
                <Datum label="Regulation" value={selectedCatalog.regulation} />
                <Datum label="Credits" value={`${selectedCatalog.credits} credits`} />
                <Datum
                  label="L:T:P"
                  value={`${selectedCatalog.lectureHours}:${selectedCatalog.tutorialHours}:${selectedCatalog.practicalHours}`}
                />
                <Datum
                  label="Owning Dept"
                  value={selectedCatalog.owningDepartmentName ?? "Cross-cutting"}
                />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">2. When</h3>
          <div className="grid grid-cols-2 gap-4">
            <FormSelect
              label="Academic Year"
              options={academicYearOptions}
              error={errors.academicYearId?.message}
              required
              {...register("academicYearId")}
            />
            <FormSelect
              label="Semester"
              options={semesterOptions}
              disabled={!watchedAcademicYearId}
              error={errors.semesterId?.message}
              hint={!watchedAcademicYearId ? "Pick an academic year first" : undefined}
              required
              {...register("semesterId")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">3. Where (Section)</h3>
          <FormSelect
            label="Section"
            options={sectionOptions}
            error={errors.sectionId?.message}
            hint="Programme and study year are inferred from the section."
            required
            {...register("sectionId")}
          />
          {selectedSection && (
            <div className="rounded-lg border border-border bg-muted/40 p-3 text-xs">
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5">
                <Datum label="Programme" value={selectedSection.programmeName} />
                <Datum label="Department" value={selectedSection.department} />
                <Datum label="Study Year" value={`Year ${selectedSection.studyYear}`} />
                <Datum label="Roster Size" value={`${selectedSection.studentCount} students`} />
              </div>
            </div>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">4. Faculty</h3>
          <FormSelect
            label="Assigned Faculty"
            options={facultyOptions}
            error={errors.facultyId?.message}
            hint="Without a faculty, the offering is saved as Draft and won't appear in faculty/student portals."
            {...register("facultyId", {
              setValueAs: (v) => (v === "" ? null : v),
            })}
          />
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">5. Capacity</h3>
          <FormField
            label="Max Capacity"
            type="number"
            min={1}
            max={500}
            placeholder="60"
            error={errors.maxCapacity?.message}
            required
            {...register("maxCapacity")}
          />
          {enrollmentHint && (
            <div className="rounded-lg border border-portal-accent/30 bg-portal-accent-light/40 p-3 text-xs text-portal-accent">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
                <span>{enrollmentHint}</span>
              </div>
            </div>
          )}
        </section>
      </form>
    </SlideDrawer>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-2 min-w-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      <span className="font-medium text-foreground truncate text-right">{value}</span>
    </div>
  );
}

// ─── Assign Faculty Dialog ──────────────────────────────────────────────────

function AssignFacultyDialog({
  open,
  onClose,
  offering,
}: {
  open: boolean;
  onClose: () => void;
  offering: CourseOffering | null;
}) {
  const assignFaculty = useAssignFaculty();
  const { data: facultyData } = useAdminUsers({
    role: "faculty",
    status: "active",
    pageSize: 200,
  });
  const [facultyId, setFacultyId] = useState("");

  useEffect(() => {
    if (open) setFacultyId("");
  }, [open]);

  const facultyOptions = useMemo(() => {
    const list = facultyData?.users ?? [];
    return [
      { value: "", label: "Select a faculty member..." },
      ...list.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.department}`,
      })),
    ];
  }, [facultyData]);

  const handleAssign = useCallback(async () => {
    if (!offering || !facultyId) return;
    try {
      await assignFaculty.mutateAsync({ offeringId: offering.id, facultyId });
      toast.success(
        `Faculty assigned. ${offering.catalogCode} is now active for ${offering.sectionName}.`,
      );
      onClose();
    } catch (err) {
      toast.error(apiErrorMessage(err, "Could not assign faculty."));
    }
  }, [offering, facultyId, assignFaculty, onClose]);

  return (
    <SlideDrawer
      open={open}
      onClose={onClose}
      width="md"
      title="Assign Faculty"
      description={
        offering
          ? `${offering.catalogCode} · ${offering.sectionName} · ${offering.semesterName}`
          : ""
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
            type="button"
            onClick={handleAssign}
            disabled={assignFaculty.isPending || !facultyId}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover disabled:opacity-50"
          >
            {assignFaculty.isPending && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            Assign Faculty
          </button>
        </div>
      }
    >
      <FormSelect
        label="Faculty"
        options={facultyOptions}
        value={facultyId}
        onChange={(e) => setFacultyId(e.target.value)}
        required
      />
    </SlideDrawer>
  );
}

// ─── Row Actions ─────────────────────────────────────────────────────────────

function CatalogRowActions({
  row,
  onEdit,
  onAddOffering,
  onArchive,
}: {
  row: CourseCatalog;
  onEdit: () => void;
  onAddOffering: () => void;
  onArchive: () => void;
}) {
  const isArchived = row.status === "archived";
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
          className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          {!isArchived && (
            <>
              <DropdownMenu.Item
                onSelect={onAddOffering}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <CalendarRange className="h-4 w-4 text-muted-foreground" />
                Schedule offering
              </DropdownMenu.Item>
              <DropdownMenu.Item
                onSelect={onEdit}
                className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
                Edit catalog
              </DropdownMenu.Item>
            </>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onArchive}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isArchived ? "text-success" : "text-danger",
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

function OfferingRowActions({
  row,
  onView,
  onAssignFaculty,
  onArchive,
}: {
  row: CourseOffering;
  onView: () => void;
  onAssignFaculty: () => void;
  onArchive: () => void;
}) {
  const isArchived = row.status === "archived";
  const needsFaculty = !row.facultyId;
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
          className="z-50 w-52 rounded-lg bg-card py-2 shadow-2xl ring-1 ring-border/30"
        >
          <DropdownMenu.Item
            onSelect={onView}
            className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted"
          >
            <Eye className="h-4 w-4 text-muted-foreground" /> View details
          </DropdownMenu.Item>
          {!isArchived && needsFaculty && (
            <DropdownMenu.Item
              onSelect={onAssignFaculty}
              className="flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted text-portal-accent"
            >
              <UserCog className="h-4 w-4" /> Assign faculty
            </DropdownMenu.Item>
          )}
          <DropdownMenu.Separator className="my-1 h-px bg-border/50" />
          <DropdownMenu.Item
            onSelect={onArchive}
            className={cn(
              "flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm outline-none transition-colors hover:bg-muted focus:bg-muted",
              isArchived ? "text-success" : "text-danger",
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

// ─── Catalog Tab ─────────────────────────────────────────────────────────────

function CatalogTab({
  onAddOfferingFor,
}: {
  onAddOfferingFor: (catalogId: string) => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [drawer, setDrawer] = useState<{ open: boolean; editing: CourseCatalog | null }>({
    open: false,
    editing: null,
  });
  const [archiveConfirm, setArchiveConfirm] = useState<{
    open: boolean;
    row: CourseCatalog | null;
  }>({ open: false, row: null });

  const { data, isLoading, isError, refetch } = useCourseCatalog({
    search: search || undefined,
    departmentId: deptFilter || undefined,
    courseType: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });
  const { data: departments } = useDepartments();
  const updateCatalog = useUpdateCatalog();

  const departmentOptions = useMemo(
    () => (departments ?? []).map((d) => ({ value: d.id, label: d.name })),
    [departments],
  );
  const departmentFilterOptions = useMemo(
    () => [{ value: "", label: "All Departments" }, ...departmentOptions],
    [departmentOptions],
  );

  const handleArchive = useCallback(async () => {
    if (!archiveConfirm.row) return;
    const row = archiveConfirm.row;
    const next = row.status === "archived" ? "active" : "archived";
    try {
      await updateCatalog.mutateAsync({ id: row.id, status: next });
      toast.success(
        next === "archived"
          ? `${row.code} archived. Existing offerings remain.`
          : `${row.code} restored.`,
      );
    } catch {
      toast.error("Could not change catalog status.");
    }
  }, [archiveConfirm.row, updateCatalog]);

  const columns: ColumnDef<CourseCatalog>[] = useMemo(
    () => [
      {
        id: "course",
        header: "Course",
        cell: ({ row }) => {
          const c = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium">
                <span className="font-mono text-xs text-portal-accent">{c.code}</span>{" "}
                <span className="text-foreground">{c.name}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-md">
                {c.description}
              </p>
            </div>
          );
        },
      },
      {
        id: "type",
        header: "Type",
        cell: ({ row }) => (
          <StatusBadge variant={getCourseTypeVariant(row.original.courseType)}>
            {COURSE_TYPE_LABEL[row.original.courseType]}
          </StatusBadge>
        ),
      },
      {
        id: "department",
        header: "Owning Dept",
        cell: ({ row }) => (
          <span className="text-sm">
            {row.original.owningDepartmentName ?? (
              <span className="italic text-muted-foreground">—</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "regulation",
        header: "Regulation",
        cell: ({ getValue }) => (
          <span className="font-mono text-xs">{String(getValue())}</span>
        ),
      },
      {
        id: "ltp",
        header: "L:T:P",
        cell: ({ row }) => (
          <span className="font-mono text-xs text-muted-foreground">
            {row.original.lectureHours}:{row.original.tutorialHours}:
            {row.original.practicalHours}
          </span>
        ),
      },
      { accessorKey: "credits", header: "Credits" },
      {
        id: "offeringCount",
        header: "Offerings",
        cell: ({ row }) => (
          <span className="text-sm tabular-nums">{row.original.offeringCount}</span>
        ),
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ getValue }) => {
          const status = getValue() as CourseCatalog["status"];
          return (
            <StatusBadge variant={getCatalogStatusVariant(status)} dot>
              {status}
            </StatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <CatalogRowActions
            row={row.original}
            onEdit={() => setDrawer({ open: true, editing: row.original })}
            onAddOffering={() => onAddOfferingFor(row.original.id)}
            onArchive={() => setArchiveConfirm({ open: true, row: row.original })}
          />
        ),
      },
    ],
    [onAddOfferingFor],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by code, name, description..."
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
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {COURSE_TYPE_FILTER_OPTIONS.map((opt) => (
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
          {CATALOG_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setDrawer({ open: true, editing: null })}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Add Catalog Course
          </button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load catalog"
          message="Could not retrieve the course catalog."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.catalog ?? []}
            showSearch={false}
            showPagination={false}
            onRowClick={(c) => router.push(`/admin/courses/catalog/${c.id}`)}
            emptyTitle="No catalog courses yet"
            emptyDescription="Add your first course to start building the catalog."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} page={page} onPageChange={setPage} />
          )}
        </>
      )}

      <CatalogDrawer
        open={drawer.open}
        onClose={() => setDrawer({ open: false, editing: null })}
        editing={drawer.editing}
        departmentOptions={departmentOptions}
      />
      <ConfirmDialog
        open={archiveConfirm.open}
        onOpenChange={(o) => setArchiveConfirm((p) => ({ ...p, open: o }))}
        title={archiveConfirm.row?.status === "archived" ? "Restore catalog course" : "Archive catalog course"}
        description={
          archiveConfirm.row?.status === "archived"
            ? `Restore "${archiveConfirm.row?.code}"? It will become available for new offerings again.`
            : `Archive "${archiveConfirm.row?.code} — ${archiveConfirm.row?.name}"? Existing offerings remain — only future scheduling is blocked. (${archiveConfirm.row?.offeringCount ?? 0} active offering${archiveConfirm.row?.offeringCount === 1 ? "" : "s"})`
        }
        confirmLabel={archiveConfirm.row?.status === "archived" ? "Restore" : "Archive"}
        variant={archiveConfirm.row?.status === "archived" ? "default" : "danger"}
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─── Offerings Tab ───────────────────────────────────────────────────────────

function OfferingsTab({
  preselectedCatalogId,
  clearPreselect,
}: {
  preselectedCatalogId?: string;
  clearPreselect: () => void;
}) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [academicYearFilter, setAcademicYearFilter] = useState("");
  const [semesterFilter, setSemesterFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [assignFaculty, setAssignFaculty] = useState<{
    open: boolean;
    offering: CourseOffering | null;
  }>({ open: false, offering: null });
  const [archiveConfirm, setArchiveConfirm] = useState<{
    open: boolean;
    row: CourseOffering | null;
  }>({ open: false, row: null });

  // Open the drawer automatically if a catalog row triggered the navigation.
  useEffect(() => {
    if (preselectedCatalogId) setDrawerOpen(true);
  }, [preselectedCatalogId]);

  const { data, isLoading, isError, refetch } = useCourseOfferings({
    search: search || undefined,
    academicYearId: academicYearFilter || undefined,
    semesterId: semesterFilter || undefined,
    courseType: typeFilter || undefined,
    status: statusFilter || undefined,
    page,
    pageSize: 20,
  });
  const { data: academicYears } = useAcademicYears();
  const updateCourse = useUpdateCourse();

  const academicYearOptions = useMemo(() => {
    const list = academicYears ?? [];
    return [
      { value: "", label: "All Academic Years" },
      ...list.map((y) => ({ value: y.id, label: y.name })),
    ];
  }, [academicYears]);

  const semesterOptions = useMemo(() => {
    const ay = academicYears?.find((y) => y.id === academicYearFilter);
    return [
      { value: "", label: ay ? "All Semesters" : "All Semesters (pick year)" },
      ...(ay?.semesters ?? []).map((s) => ({ value: s.id, label: s.name })),
    ];
  }, [academicYears, academicYearFilter]);

  const handleArchive = useCallback(async () => {
    if (!archiveConfirm.row) return;
    const row = archiveConfirm.row;
    const next = row.status === "archived" ? "active" : "archived";
    try {
      await updateCourse.mutateAsync({ id: row.id, status: next });
      toast.success(
        next === "archived"
          ? `Offering archived. Existing students keep access to past materials.`
          : `Offering restored.`,
      );
    } catch {
      toast.error("Could not change offering status.");
    }
  }, [archiveConfirm.row, updateCourse]);

  // Surface the count of draft offerings so the page header can warn admins
  // that some offerings need faculty before they're actually being taught.
  const draftCount = useMemo(
    () => (data?.offerings ?? []).filter((o) => o.status === "draft").length,
    [data?.offerings],
  );

  const columns: ColumnDef<CourseOffering>[] = useMemo(
    () => [
      {
        id: "course",
        header: "Course",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="font-medium">
                <span className="font-mono text-xs text-portal-accent">{o.catalogCode}</span>{" "}
                <span>{o.catalogName}</span>
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                <span className="font-mono">{o.regulationSnapshot}</span> ·{" "}
                {COURSE_TYPE_LABEL[o.courseType]} · {o.creditsSnapshot}cr
              </p>
            </div>
          );
        },
      },
      {
        id: "section",
        header: "Section",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="text-sm font-medium">{o.sectionName || <span className="text-muted-foreground italic">—</span>}</p>
              <p className="mt-0.5 text-xs text-muted-foreground truncate max-w-45">
                {o.programmeName} · Year {o.studyYear}
              </p>
            </div>
          );
        },
      },
      {
        id: "term",
        header: "Term",
        cell: ({ row }) => {
          const o = row.original;
          return (
            <div className="min-w-0">
              <p className="text-sm">{o.semesterName}</p>
              <p className="mt-0.5 text-xs text-muted-foreground">{o.academicYearName}</p>
            </div>
          );
        },
      },
      {
        id: "faculty",
        header: "Faculty",
        cell: ({ row }) => {
          const o = row.original;
          if (!o.facultyId) {
            return (
              <div className="flex items-center gap-1.5 text-xs">
                <AlertCircle className="h-3.5 w-3.5 text-warning" />
                <span className="text-warning font-medium">Unassigned</span>
              </div>
            );
          }
          return <span className="text-sm">{o.facultyName}</span>;
        },
      },
      {
        id: "enrollment",
        header: "Enrollment",
        cell: ({ row }) => {
          const o = row.original;
          const pct = Math.round((o.enrolledCount / o.maxCapacity) * 100);
          const barColor =
            pct >= 90 ? "bg-danger" : pct >= 70 ? "bg-yellow-500" : "bg-success";
          return (
            <div className="min-w-27.5">
              <p className="text-sm tabular-nums">
                {o.enrolledCount}/{o.maxCapacity}
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
          const status = getValue() as CourseOffering["status"];
          return (
            <StatusBadge variant={getOfferingStatusVariant(status)} dot>
              {status}
            </StatusBadge>
          );
        },
      },
      {
        id: "actions",
        header: "",
        cell: ({ row }) => (
          <OfferingRowActions
            row={row.original}
            onView={() => router.push(`/admin/courses/${row.original.id}`)}
            onAssignFaculty={() => setAssignFaculty({ open: true, offering: row.original })}
            onArchive={() => setArchiveConfirm({ open: true, row: row.original })}
          />
        ),
      },
    ],
    [router],
  );

  return (
    <div className="space-y-5">
      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:flex-wrap">
        <SearchInput
          onSearch={(v) => {
            setSearch(v);
            setPage(1);
          }}
          placeholder="Search by course, section, faculty..."
          className="w-full sm:max-w-xs"
        />
        <select
          value={academicYearFilter}
          onChange={(e) => {
            setAcademicYearFilter(e.target.value);
            setSemesterFilter("");
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {academicYearOptions.map((opt) => (
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
          disabled={!academicYearFilter}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1 disabled:opacity-50"
        >
          {semesterOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <select
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setPage(1);
          }}
          className="flex h-10 rounded-lg border border-input bg-background px-3 text-sm transition-colors hover:border-muted-foreground focus:outline-none focus:ring-2 focus:ring-portal-accent focus:ring-offset-1"
        >
          {COURSE_TYPE_FILTER_OPTIONS.map((opt) => (
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
          {OFFERING_STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="ml-auto">
          <button
            onClick={() => setDrawerOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-portal-accent px-4 py-2 text-sm font-medium text-portal-accent-foreground transition-colors hover:bg-portal-accent-hover"
          >
            <Plus className="h-4 w-4" />
            Schedule Offering
          </button>
        </div>
      </div>

      {/* Draft warning chip */}
      {draftCount > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-warning/30 bg-warning-light px-3 py-2 text-xs text-warning">
          <AlertCircle className="h-3.5 w-3.5" />
          <span>
            {draftCount} offering{draftCount === 1 ? "" : "s"} {draftCount === 1 ? "is" : "are"} in
            <strong className="mx-1">Draft</strong>— assign faculty to activate them so the
            faculty and student portals can render the schedule.
          </span>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <TableSkeleton rows={8} />
      ) : isError ? (
        <ErrorState
          title="Failed to load offerings"
          message="Could not retrieve the offerings list."
          onRetry={() => refetch()}
        />
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.offerings ?? []}
            showSearch={false}
            showPagination={false}
            onRowClick={(o) => router.push(`/admin/courses/${o.id}`)}
            emptyTitle="No offerings scheduled"
            emptyDescription="Schedule a course offering to start a new term."
          />
          {data?.meta && data.meta.totalPages > 1 && (
            <Pagination meta={data.meta} page={page} onPageChange={setPage} />
          )}
        </>
      )}

      <OfferingDrawer
        open={drawerOpen}
        onClose={() => {
          setDrawerOpen(false);
          clearPreselect();
        }}
        preselectedCatalogId={preselectedCatalogId}
      />
      <AssignFacultyDialog
        open={assignFaculty.open}
        onClose={() => setAssignFaculty({ open: false, offering: null })}
        offering={assignFaculty.offering}
      />
      <ConfirmDialog
        open={archiveConfirm.open}
        onOpenChange={(o) => setArchiveConfirm((p) => ({ ...p, open: o }))}
        title={archiveConfirm.row?.status === "archived" ? "Restore offering" : "Archive offering"}
        description={
          archiveConfirm.row?.status === "archived"
            ? `Restore "${archiveConfirm.row?.catalogCode}" for ${archiveConfirm.row?.sectionName}? Faculty and students will see it again.`
            : `Archive "${archiveConfirm.row?.catalogCode}" for ${archiveConfirm.row?.sectionName}? Existing enrollments are preserved; new ones are blocked.`
        }
        confirmLabel={archiveConfirm.row?.status === "archived" ? "Restore" : "Archive"}
        variant={archiveConfirm.row?.status === "archived" ? "default" : "danger"}
        onConfirm={handleArchive}
      />
    </div>
  );
}

// ─── Pagination Footer ──────────────────────────────────────────────────────

function Pagination({
  meta,
  page,
  onPageChange,
}: {
  meta: { page: number; totalPages: number; total: number };
  page: number;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <p className="text-sm text-muted-foreground">
        Page {meta.page} of {meta.totalPages} ({meta.total} rows)
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Previous
        </button>
        <button
          onClick={() => onPageChange(Math.min(meta.totalPages, page + 1))}
          disabled={page >= meta.totalPages}
          className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium transition-colors hover:bg-muted disabled:opacity-50"
        >
          Next
        </button>
      </div>
    </div>
  );
}

// ─── Page Shell ──────────────────────────────────────────────────────────────

type Tab = "catalog" | "offerings";

export default function AdminCoursesPage() {
  const [tab, setTab] = useState<Tab>("catalog");
  const [preselectedCatalogId, setPreselectedCatalogId] = useState<string | undefined>(undefined);

  const handleAddOfferingFor = useCallback((catalogId: string) => {
    setPreselectedCatalogId(catalogId);
    setTab("offerings");
  }, []);

  const clearPreselect = useCallback(() => {
    setPreselectedCatalogId(undefined);
  }, []);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={GraduationCap}
        title="Courses"
        description="Define courses once in the catalog. Schedule them across sections and terms as offerings."
      />

      {/* Tab bar */}
      <div className="flex items-center gap-1 rounded-lg border border-border bg-muted/40 p-1 w-fit">
        <TabButton
          active={tab === "catalog"}
          onClick={() => setTab("catalog")}
          icon={Library}
          label="Course Catalog"
          hint="Master list"
        />
        <TabButton
          active={tab === "offerings"}
          onClick={() => setTab("offerings")}
          icon={Layers}
          label="Section Offerings"
          hint="Scheduled instances"
        />
      </div>

      {tab === "catalog" ? (
        <CatalogTab onAddOfferingFor={handleAddOfferingFor} />
      ) : (
        <OfferingsTab
          preselectedCatalogId={preselectedCatalogId}
          clearPreselect={clearPreselect}
        />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon: Icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: typeof Library;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all",
        active
          ? "bg-background text-foreground shadow-sm ring-1 ring-border/50"
          : "text-muted-foreground hover:text-foreground hover:bg-background/50",
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      <span>{label}</span>
      <span
        className={cn(
          "text-[10px] font-normal",
          active ? "text-muted-foreground" : "text-muted-foreground/70",
        )}
      >
        {hint}
      </span>
    </button>
  );
}
