import { authHandlers } from "./auth.handlers";
import { studentHandlers } from "./student.handlers";
import { facultyHandlers } from "./faculty.handlers";
import { adminHandlers } from "./admin.handlers";
import { placementHandlers } from "./placement.handlers";
import { researchHandlers } from "./research.handlers";
import { ministryHandlers } from "./ministry.handlers";

export const handlers = [...authHandlers, ...studentHandlers, ...facultyHandlers, ...adminHandlers, ...placementHandlers, ...researchHandlers, ...ministryHandlers];
