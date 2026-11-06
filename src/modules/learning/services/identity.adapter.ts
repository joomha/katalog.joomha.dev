import "server-only";
import { assertAuthenticated, assertPermission } from "@/modules/identity/guards";
import { PERMISSIONS } from "@/modules/identity/permissions";

/**
 * Temporary, isolated bridge: Identity's public index.ts is still empty in the
 * merged baseline. Replace these imports with barrel exports when Agent 02
 * publishes its contract; authorization remains server-side either way.
 */
export async function requireLearningUser() {
  return assertAuthenticated();
}
export async function requireLearningManager() {
  return assertPermission(PERMISSIONS.LEARNING_MANAGE);
}
