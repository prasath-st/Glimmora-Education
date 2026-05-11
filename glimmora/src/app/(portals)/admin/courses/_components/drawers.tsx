"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { Loader2, AlertCircle } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  useCreateCatalog,
  useUpdateCatalog,
  useCourseCatalog,
  useCreateOffering,
  useAssignFaculty,
  useAcademicYears,
  useAdminUsers,
  usePrograms,
  useSections,
} from "@/lib/hooks/use-admin";
import {
  createCatalogSchema,
  type CreateCatalogFormData,
  type CreateCatalogFormInput,
  createOfferingSchema,
  type CreateOfferingFormData,
  type CreateOfferingFormInput,
} from "@/lib/schemas/admin.schema";
import { SlideDrawer } from "@/components/shared/feedback/slide-drawer";
import {
  FormField,
  FormSelect,
  FormTextarea,
} from "@/components/shared/forms/form-field";
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

// ─── Catalog Drawer ──────────────────────────────────────────────────────────

export function CatalogDrawer({
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
              ? (departmentOptions.find((d) => d.value === data.owningDepartmentId)
                  ?.label ?? null)
              : null,
          });
          toast.success(
            `${data.code} updated. Future offerings will use the new syllabus.`,
          );
        } else {
          await createCatalog.mutateAsync(data);
          toast.success(`${data.code} added to catalog.`);
        }
        onClose();
      } catch (err) {
        toast.error(apiErrorMessage(err, "Could not save the catalog course."));
      }
    },
    [
      isEditing,
      editing,
      createCatalog,
      updateCatalog,
      departmentOptions,
      onClose,
    ],
  );

  const isPending = createCatalog.isPending || updateCatalog.isPending;

  const departmentSelectOptions = useMemo(
    () => [
      { value: "", label: "No owning specialization (cross-cutting)" },
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
      <form
        id="catalog-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
          <h3 className="text-sm font-semibold text-foreground">
            Classification
          </h3>
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
              label="Owning Specialization"
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
          <h3 className="text-sm font-semibold text-foreground">
            Weekly hours (L:T:P)
          </h3>
          <p className="-mt-2 text-xs text-muted-foreground">
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

// ─── Offering Drawer (Schedule Offering) ─────────────────────────────────────

export function OfferingDrawer({
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
      maxCapacity: 9999,
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
      maxCapacity: 9999,
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
    const present = catalogData?.catalog.some(
      (c) => c.id === preselectedCatalogId,
    );
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
      {
        value: "",
        label: "Leave unassigned for now (offering will be Draft)",
      },
      ...list.map((f) => ({
        value: f.id,
        label: `${f.name} · ${f.department}`,
      })),
    ];
  }, [facultyData]);

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
      <form
        id="offering-form"
        onSubmit={handleSubmit(onSubmit)}
        className="space-y-6"
      >
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
                <Datum
                  label="Type"
                  value={COURSE_TYPE_LABEL[selectedCatalog.courseType]}
                />
                <Datum label="Regulation" value={selectedCatalog.regulation} />
                <Datum
                  label="Credits"
                  value={`${selectedCatalog.credits} credits`}
                />
                <Datum
                  label="L:T:P"
                  value={`${selectedCatalog.lectureHours}:${selectedCatalog.tutorialHours}:${selectedCatalog.practicalHours}`}
                />
                <Datum
                  label="Owning Specialization"
                  value={
                    selectedCatalog.owningDepartmentName ?? "Cross-cutting"
                  }
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
              hint={
                !watchedAcademicYearId ? "Pick an academic year first" : undefined
              }
              required
              {...register("semesterId")}
            />
          </div>
        </section>

        <section className="space-y-4">
          <h3 className="text-sm font-semibold text-foreground">
            3. Where (Section)
          </h3>
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
                <Datum
                  label="Programme"
                  value={selectedSection.programmeName}
                />
                <Datum label="Specialization" value={selectedSection.department} />
                <Datum
                  label="Study Year"
                  value={`Year ${selectedSection.studyYear}`}
                />
                <Datum
                  label="Roster Size"
                  value={`${selectedSection.studentCount} students`}
                />
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

        {enrollmentHint && (
          <div className="rounded-lg border border-portal-accent/30 bg-portal-accent-light/40 p-3 text-xs text-portal-accent">
            <div className="flex items-start gap-2">
              <AlertCircle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span>{enrollmentHint}</span>
            </div>
          </div>
        )}
      </form>
    </SlideDrawer>
  );
}

function Datum({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-w-0 justify-between gap-2">
      <span className="shrink-0 text-muted-foreground">{label}</span>
      <span className="truncate text-right font-medium text-foreground">
        {value}
      </span>
    </div>
  );
}

// ─── Assign Faculty Drawer ──────────────────────────────────────────────────

export function AssignFacultyDialog({
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
      await assignFaculty.mutateAsync({
        offeringId: offering.id,
        facultyId,
      });
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
            {assignFaculty.isPending && (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            )}
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
