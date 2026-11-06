import "server-only";
import { assertAuthenticated, assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";

/** Fresh server-side identity lookup; JWT alone is never the final authorization decision. */
export async function requireLearningUser() {
  return assertAuthenticated();
}
/** Manage courses, curriculum, assessments, games, assignments and certificates. */
export async function requireLearningManager() {
  return assertPermission(PERMISSIONS.LEARNING_MANAGE);
}
/** Read-only instructor/admin access follows the Identity RBAC policy. */
export async function requireLearningViewer() {
  return assertPermission(PERMISSIONS.LEARNING_VIEW);
}
