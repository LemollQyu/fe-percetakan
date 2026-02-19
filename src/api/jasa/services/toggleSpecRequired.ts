/**
 * PATCH /api/v1/admin/service/:serviceID/spesification/:specID/required - toggle required spesifikasi (admin only)
 */
import { apiJasa } from "@/lib/api";

export type ToggleSpecRequiredResponse = {
  message: string;
  data: boolean;
};

export async function toggleServiceSpecificationRequired(
  serviceID: number,
  specID: number,
  token: string
): Promise<ToggleSpecRequiredResponse> {
  return apiJasa<ToggleSpecRequiredResponse>(
    `/api/v1/admin/service/${serviceID}/spesification/${specID}/required`,
    { method: "PATCH", token }
  );
}
