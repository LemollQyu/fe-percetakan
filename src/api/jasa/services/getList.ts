/**
 * GET /api/v1/services - list semua service/jasa (public)
 */
import { apiJasa } from "@/lib/api";
import type { ServicesListResponse } from "./types";

export type GetServicesParams = {
  page?: number;
  limit?: number;
};

export async function getServicesList(
  params?: GetServicesParams,
): Promise<ServicesListResponse> {
  const query = new URLSearchParams();

  if (params?.page) query.set("page", String(params.page));
  if (params?.limit) query.set("limit", String(params.limit));

  const endpoint = `/api/v1/services${query.toString() ? `?${query}` : ""}`;

  const res = await apiJasa<ServicesListResponse>(endpoint, { method: "GET" });

  return res;
}
