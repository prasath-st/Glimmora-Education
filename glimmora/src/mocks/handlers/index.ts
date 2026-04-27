import { authHandlers } from "./auth.handlers";
import { studentHandlers } from "./student.handlers";
import { facultyHandlers } from "./faculty.handlers";
import { adminHandlers } from "./admin.handlers";
import { placementHandlers } from "./placement.handlers";
import { admissionsHandlers } from "./admissions.handlers";
import { tutorHandlers } from "./tutor.handlers";
import { superAdminHandlers } from "./super-admin.handlers";

export const handlers = [...authHandlers, ...studentHandlers, ...facultyHandlers, ...adminHandlers, ...placementHandlers, ...admissionsHandlers, ...tutorHandlers, ...superAdminHandlers];
