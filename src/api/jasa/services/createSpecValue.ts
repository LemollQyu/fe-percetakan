/**
 * POST /api/v1/admin/service-spesification-value - buat value untuk spesifikasi (admin only)
 * Body: JSON - service_id, spesification_id, value, additional_price?
 */
import { apiJasa } from "@/lib/api";
import type { CreateServiceSpecValuePayload } from "./types";

export type CreateSpecValueResponse = { message: string };

export async function createServiceSpecificationValue(
  payload: CreateServiceSpecValuePayload,
  token: string
): Promise<CreateSpecValueResponse> {
  return apiJasa<CreateSpecValueResponse>(
    "/api/v1/admin/service-spesification-value",
    {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        service_id: payload.service_id,
        spesification_id: payload.spesification_id,
        value: payload.value,
        additional_price: payload.additional_price ?? 0,
      }),
    }
  );
}
