import { z } from "zod";

export const createUserSchema = z.object({
  role: z.enum(
    ["student", "faculty", "admin", "placement"],
    { error: "Please select a role" }
  ),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z
    .string()
    .min(1, "Email is required")
    .email("Please enter a valid email address"),
  department: z.string().min(1, "Department is required"),
  // Student-specific
  studentId: z.string().optional(),
  program: z.string().optional(),
  academicYearStart: z.string().optional(),
  academicYearEnd: z.string().optional(),
  currentSemester: z.string().optional(),
  // Faculty-specific
  employeeId: z.string().optional(),
  designation: z.string().optional(),
  specialization: z.string().optional(),
});

export type CreateUserFormData = z.infer<typeof createUserSchema>;

export const createProgramSchema = z.object({
  name: z.string().min(1, "Program name is required"),
  department: z.string().min(1, "Department is required"),
  duration: z.coerce.number().min(1, "Duration must be at least 1 year").max(8),
  totalSemesters: z.coerce.number().min(1, "Must have at least 1 semester").max(16),
  degreeType: z.enum(["UG", "PG", "Diploma", "PhD"], { error: "Please select a degree type" }),
});

export type CreateProgramFormData = z.output<typeof createProgramSchema>;
export type CreateProgramFormInput = z.input<typeof createProgramSchema>;

export const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  role: z
    .enum(["student", "faculty", "admin", "placement"])
    .optional(),
  department: z.string().min(1).optional(),
  status: z.enum(["active", "inactive", "suspended"]).optional(),
});

export type UpdateUserFormData = z.infer<typeof updateUserSchema>;

export const issueCredentialSchema = z.object({
  studentId: z.string().min(1, "Please select a student"),
  title: z
    .string()
    .min(1, "Title is required")
    .min(3, "Title must be at least 3 characters"),
  type: z.enum(["degree", "certificate", "badge", "transcript"], {
    error: "Please select a type",
  }),
  description: z
    .string()
    .min(1, "Description is required")
    .min(10, "Description must be at least 10 characters"),
});

export type IssueCredentialFormData = z.infer<typeof issueCredentialSchema>;

export const revokeCredentialSchema = z.object({
  reason: z
    .string()
    .min(1, "Reason is required")
    .min(10, "Please provide a detailed reason (at least 10 characters)"),
});

export type RevokeCredentialFormData = z.infer<typeof revokeCredentialSchema>;

export const institutionSettingsSchema = z.object({
  name: z.string().min(1, "Institution name is required"),
  shortName: z.string().min(1, "Short name is required"),
  timezone: z.string().min(1, "Timezone is required"),
  locale: z.string().min(1, "Locale is required"),
  academicYear: z.string().min(1, "Academic year is required"),
  primaryColor: z.string().min(1, "Primary color is required"),
  visibility: z.object({
    shareWithMinistry: z.boolean(),
    anonymizeData: z.boolean(),
    publicProfile: z.boolean(),
  }),
  dataRetention: z.object({
    studentRecords: z.number().min(1, "Must be at least 1 year"),
    auditLogs: z.number().min(1, "Must be at least 1 year"),
    analyticsData: z.number().min(1, "Must be at least 1 year"),
  }),
});

export type InstitutionSettingsFormData = z.infer<typeof institutionSettingsSchema>;

export const resolveDeviationSchema = z.object({
  resolution: z
    .string()
    .min(1, "Resolution is required")
    .min(10, "Please describe how this deviation was resolved"),
});

export type ResolveDeviationFormData = z.infer<typeof resolveDeviationSchema>;

export const createCourseSchema = z.object({
  code: z.string().min(1, "Course code is required"),
  name: z.string().min(1, "Course name is required"),
  description: z.string().min(1, "Description is required"),
  credits: z.coerce.number().min(1, "Credits must be at least 1").max(12),
  department: z.string().min(1, "Department is required"),
  semesterId: z.string().min(1, "Semester is required"),
  facultyId: z.string().min(1, "Faculty is required"),
  maxCapacity: z.coerce.number().min(1, "Capacity must be at least 1"),
});

export type CreateCourseFormData = z.output<typeof createCourseSchema>;
export type CreateCourseFormInput = z.input<typeof createCourseSchema>;

export const createSemesterSchema = z
  .object({
    name: z.string().min(1, "Semester name is required"),
    year: z.string().min(4, "Year is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type CreateSemesterFormData = z.infer<typeof createSemesterSchema>;

export const createAcademicYearSchema = z
  .object({
    name: z.string().min(1, "Academic year name is required"),
    startDate: z.string().min(1, "Start date is required"),
    endDate: z.string().min(1, "End date is required"),
  })
  .refine(
    (d) => !d.startDate || !d.endDate || new Date(d.endDate) > new Date(d.startDate),
    { message: "End date must be after start date", path: ["endDate"] }
  );

export type CreateAcademicYearFormData = z.infer<typeof createAcademicYearSchema>;

export const bulkImportUserSchema = z.object({
  email: z.string().min(1, "Email is required").email("Invalid email"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  role: z.enum(["student", "faculty", "admin", "placement"]),
  department: z.string().min(1, "Department is required"),
  studentId: z.string().optional(),
  program: z.string().optional(),
  employeeId: z.string().optional(),
});

export type BulkImportUserFormData = z.infer<typeof bulkImportUserSchema>;
