/**
 * GET /api/v1/category/:id - detail kategori jasa
 */
import { apiJasa } from "@/lib/api";
import type { CategoryDetailResponse } from "./types";

export async function getCategoryById(
  id: number,
): Promise<CategoryDetailResponse> {
  return apiJasa<CategoryDetailResponse>(`/api/v1/category/${id}`, {
    method: "GET",
    cache: "no-store",
  });
}
