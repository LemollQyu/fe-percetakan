/**
 * PATCH /api/v1/admin/service/:serviceID/estimate - edit estimasi service (admin only)
 * Body: JSON
 * Fields: duration_per_unit
 */
import { apiJasa } from "@/lib/api";

export type UpdateEstimateForm = {
  duration_per_unit: number;
};

export type UpdateEstimateResponse = {
  message: string;
};

export async function updateServiceEstimate(
  serviceID: number,
  form: UpdateEstimateForm,
  token: string,
): Promise<UpdateEstimateResponse> {
  return apiJasa<UpdateEstimateResponse>(
    `/api/v1/admin/service/${serviceID}/estimate`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(form),
    },
  );
}
