/**
 * DELETE /api/v1/admin/service/:serviceID/spesification/:specID - hapus spesifikasi (admin only)
 */
import { apiJasa } from "@/lib/api";

export type DeleteSpecificationResponse = { message: string };

export async function deleteServiceSpecification(
  serviceID: number,
  specID: number,
  token: string
): Promise<DeleteSpecificationResponse> {
  return apiJasa<DeleteSpecificationResponse>(
    `/api/v1/admin/service/${serviceID}/spesification/${specID}`,
    { method: "DELETE", token }
  );
}
