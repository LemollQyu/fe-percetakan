/**
 * POST /api/v1/admin/service-spesification - buat spesifikasi service (admin only)
 * Body: JSON - service_id, name, input_type, options? (wajib jika select), is_required
 */
import { apiJasa } from "@/lib/api";
import type { CreateServiceSpecificationPayload } from "./types";

export type CreateSpecificationResponse = { message: string };

export async function createServiceSpecification(
  payload: CreateServiceSpecificationPayload,
  token: string
): Promise<CreateSpecificationResponse> {
  const body = {
    service_id: payload.service_id,
    name: payload.name,
    input_type: payload.input_type,
    options: payload.options ?? undefined,
    is_required: payload.is_required,
  };
  return apiJasa<CreateSpecificationResponse>(
    "/api/v1/admin/service-spesification",
    {
      method: "POST",
      token,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    }
  );
}
