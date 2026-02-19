/**
 * DELETE /api/v1/admin/service/:serviceID/media/:mediaID - hapus media di service (admin only)
 */
import { apiJasa } from "@/lib/api";

export type DeleteMediaResponse = { message: string };

export async function deleteServiceMedia(
  serviceID: number,
  mediaID: number,
  token: string
): Promise<DeleteMediaResponse> {
  return apiJasa<DeleteMediaResponse>(
    `/api/v1/admin/service/${serviceID}/media/${mediaID}`,
    { method: "DELETE", token }
  );
}
