import { apiJasa } from "@/lib/api";
import type { CategoriesListResponse } from "./types";

// perubahan terjadi 60 detik
export async function getCategoriesList(): Promise<CategoriesListResponse> {
  return apiJasa<CategoriesListResponse>("/api/v1/categories", {
    method: "GET",
    cache: "no-store",
  });
}
