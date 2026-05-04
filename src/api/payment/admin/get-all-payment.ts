import { apiPayment } from "@/lib/api";
export type AdminPaymentCode = {
  id: number;
  code: string;
  payment_id: number;
  expired_at: string;
  created_at: string;
};

export type AdminPaymentItem = {
  id: number;
  order_id: number;
  user_id: number;
  amount: number;
  payment_method: string;
  status: string;
  paid_at: string | null;
  approved_at: string | null;
  created_at: string;
  updated_at: string;
  payment_codes: AdminPaymentCode[];
};

export type AdminPaymentsMeta = {
  limit: number;
  page: number;
};

export type AdminPaymentsResponse = {
  message: string;
  data: AdminPaymentItem[];
  meta: AdminPaymentsMeta;
};

export type GetAdminPaymentsParams = {
  status?: string;
  page?: number;
  limit?: number;
  token: string;
};

/**
 * GET /api/v1/admin/payments
 */
export async function getAdminPayments({
  status = "",
  page = 1,
  limit = 10,
  token,
}: GetAdminPaymentsParams): Promise<AdminPaymentsResponse> {
  const query = new URLSearchParams({
    status,
    page: String(page),
    limit: String(limit),
  });

  return apiPayment<AdminPaymentsResponse>(
    `/api/v1/admin/payments?${query.toString()}`,
    {
      method: "GET",
      token,
    }
  );
}