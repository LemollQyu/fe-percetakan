/**
 * PATCH /api/v1/admin/service/:serviceID/spesification/:specID/status - toggle status spesifikasi (admin only)
 */
import { apiJasa } from "@/lib/api";

export type ToggleSpecStatusResponse = {
  message: string;
  data: boolean;
};

export async function toggleServiceSpecificationStatus(
  serviceID: number,
  specID: number,
  token: string
): Promise<ToggleSpecStatusResponse> {
  return apiJasa<ToggleSpecStatusResponse>(
    `/api/v1/admin/service/${serviceID}/spesification/${specID}/status`,
    { method: "PATCH", token }
  );
}
