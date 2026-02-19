/**
 * PATCH /api/v1/admin/service/:serviceID/specification/:specID/value/:valueID - update value spesifikasi (admin only)
 * Route pakai "specification" (bukan spesification).
 * Body: JSON - value?, additional_price?
 */
import { apiJasa } from "@/lib/api";
import type { UpdateServiceSpecValuePayload } from "./types";

export type UpdateSpecValueResponse = { message: string };

export async function updateServiceSpecificationValue(
  serviceID: number,
  specID: number,
  valueID: number,
  payload: UpdateServiceSpecValuePayload,
  token: string
): Promise<UpdateSpecValueResponse> {
  return apiJasa<UpdateSpecValueResponse>(
    `/api/v1/admin/service/${serviceID}/specification/${specID}/value/${valueID}`,
    {
      method: "PATCH",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        value: payload.value,
        additional_price: payload.additional_price ?? 0,
      }),
    }
  );
}
