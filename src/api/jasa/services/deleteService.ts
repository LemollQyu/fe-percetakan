/**
 * DELETE /api/v1/admin/service/:serviceID - hapus service (admin only)
 */
import { apiJasa } from "@/lib/api";

export type DeleteServiceResponse = { message: string };

export async function deleteService(
  serviceID: number,
  token: string
): Promise<DeleteServiceResponse> {
  return apiJasa<DeleteServiceResponse>(
    `/api/v1/admin/service/${serviceID}`,
    { method: "DELETE", token }
  );
}
