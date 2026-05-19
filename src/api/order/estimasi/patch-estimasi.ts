import { apiOrder } from "@/lib/api";

export type PatchEstimasiParams = {
  code: string;
  token: string;
  estimated_duration: number;
};

export type PatchEstimasiResponse = {
  message: string;
};

/**
 * PATCH /api/v1/admin/estimate-order/:code
 * Edit estimasi durasi order (admin only)
 */
export async function patchEstimasi({
  code,
  token,
  estimated_duration,
}: PatchEstimasiParams): Promise<PatchEstimasiResponse> {
  return apiOrder<PatchEstimasiResponse>(
    `/api/v1/admin/estimate-order/${code}`,
    {
      method: "PATCH",
      token,
      body: JSON.stringify({ estimated_duration }),
    },
  );
}
