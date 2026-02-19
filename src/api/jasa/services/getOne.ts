/**
 * GET /api/v1/service/:serviceID - detail satu service
 */
import { apiJasa } from "@/lib/api";
import type { ServiceDetailResponse } from "./types";

export async function getServiceById(
  serviceID: number
): Promise<ServiceDetailResponse> {
  return apiJasa<ServiceDetailResponse>(`/api/v1/service/${serviceID}`, {
    method: "GET",
  });
}
