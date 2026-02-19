/**
 * POST /api/v1/admin/category - buat kategori jasa (admin only)
 */
import { apiJasa } from "@/lib/api";
import type { CreateCategoryPayload } from "./types";
import type { CategoryMessageResponse } from "./types";

export async function createCategory(
  payload: CreateCategoryPayload,
  token: string
): Promise<CategoryMessageResponse> {
  return apiJasa<CategoryMessageResponse>("/api/v1/admin/category", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
  });
}
