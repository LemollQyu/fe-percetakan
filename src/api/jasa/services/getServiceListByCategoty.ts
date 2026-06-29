/**
 * GET /api/v1/services/category/:categoryID - list service berdasarkan kategori (public)
 */
import { apiJasa } from "@/lib/api";
import type { ServicesListResponse } from "./types";

export type GetServicesByCategoryParams = {
  page?: number;
  limit?: number;
  search?: string;
};

export async function getServicesByCategory(
  categoryId: number | string,
  params?: GetServicesByCategoryParams,
): Promise<ServicesListResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));
  if (params?.search) query.set("search", params.search);

  const endpoint = `/api/v1/services/category/${categoryId}${
    query.toString() ? `?${query}` : ""
  }`;

  const res = await apiJasa<ServicesListResponse>(endpoint, { method: "GET" });

  return res;
}
