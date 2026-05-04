import { apiPayment } from "@/lib/api";
import type { RefundData } from "../admin/refund/get-refunds";

export type GetMyRefundResponse = {
  data: RefundData[];
  message: string;
};

export type GetMyRefundParams = {
  token: string;
  status?: string;
  page?: number;
  limit?: number;
};

/**
 * GET /api/v1/i/my-refund
 * Get semua refund milik user yang sedang login (butuh token user)
 */
export async function getMyRefund({
  token,
  status,
  page = 1,
  limit = 10,
}: GetMyRefundParams): Promise<GetMyRefundResponse> {
  const params = new URLSearchParams({
    ...(status && { status }),
    page: String(page),
    limit: String(limit),
  });

  return apiPayment<GetMyRefundResponse>(`/api/v1/i/my-refund?${params}`, {
    method: "GET",
    token,
  });
}