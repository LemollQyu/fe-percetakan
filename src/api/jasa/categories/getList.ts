/**
 * GET /api/v1/categories - list kategori jasa (public, bisa dipakai admin juga)
 */
import { apiJasa } from "@/lib/api";
import type { CategoriesListResponse } from "./types";

export async function getCategoriesList(): Promise<CategoriesListResponse> {
  return apiJasa<CategoriesListResponse>("/api/v1/categories", { method: "GET" });
}
