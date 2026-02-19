/**
 * DELETE /api/v1/admin/category/:id - hapus kategori jasa (admin only)
 */
import { apiJasa } from "@/lib/api";
import type { CategoryMessageResponse } from "./types";

export async function deleteCategory(
  id: number,
  token: string
): Promise<CategoryMessageResponse> {
  return apiJasa<CategoryMessageResponse>(`/api/v1/admin/category/${id}`, {
    method: "DELETE",
    token,
  });
}
