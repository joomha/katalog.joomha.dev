import { catalogService } from "./services/catalog.service";
import {
  CatalogFilterInput,
  CatalogItemDTO,
  CatalogCategoryDTO,
  PaginatedResult,
  PurchasabilityResult,
} from "./types";

export * from "./types";
export { catalogService } from "./services/catalog.service";

/**
 * Public Module Contract Functions for Agent 04 (Commerce), Agent 05 (LMS),
 * Agent 07 (Business Services), Agent 08 (AI Consultant), and Storefront UI.
 */

export async function listCatalogItems(
  filters?: CatalogFilterInput
): Promise<PaginatedResult<CatalogItemDTO>> {
  return catalogService.listCatalogItems(filters);
}

export async function getCatalogItemBySlug(
  slug: string
): Promise<CatalogItemDTO | null> {
  return catalogService.getCatalogItemBySlug(slug);
}

export async function listCategories(): Promise<CatalogCategoryDTO[]> {
  return catalogService.listCategories();
}

export async function checkCatalogItemPurchasability(
  itemIdOrSlug: string
): Promise<PurchasabilityResult> {
  return catalogService.checkCatalogItemPurchasability(itemIdOrSlug);
}
