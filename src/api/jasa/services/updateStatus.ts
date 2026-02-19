/**
 * PATCH /api/v1/admin/service/:serviceID/status - toggle status service (admin only)
 */
import { apiJasa } from "@/lib/api";

export type ServiceStatusResponse = {
  message: string;
  data: boolean;
};

export async function updateServiceStatus(
  serviceID: number,
  token: string
): Promise<ServiceStatusResponse> {
  return apiJasa<ServiceStatusResponse>(
    `/api/v1/admin/service/${serviceID}/status`,
    { method: "PATCH", token }
  );
}
