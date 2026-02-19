/**
 * PATCH /api/v1/admin/category/:id/status - toggle status kategori (admin only)
 */
import { apiJasa } from "@/lib/api";
import type { CategoryStatusResponse } from "./types";

export async function updateCategoryStatus(
  id: number,
  token: string
): Promise<CategoryStatusResponse> {
  return apiJasa<CategoryStatusResponse>(`/api/v1/admin/category/${id}/status`, {
    method: "PATCH",
    token,
  });
}
