import { apiPayment } from "@/lib/api";

export type RefundProof = {
  id: number;
  refund_id: number;
  file_url: string;
  note: string;
  created_at: string;
  refund: {
    id: number;
    rejected_id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    status: string;
    created_at: string;
  };
};

export type RefundItem = {
  id: number;
  rejected_id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  transferred_at?: string;
  created_at: string;
  proofs?: RefundProof[];
};

export type RefundData = {
  id: number;
  payment_id: number;
  user_id: number;
  amount: number;
  order_code: string;
  payment_code: string;
  order_name: string;
  admin_note: string;
  created_at: string;
  refunds: RefundItem[];
};

export type GetRefundsMeta = {
  page: number;
  limit: number;
};

export type GetRefundsResponse = {
  data: RefundData[];
  message: string;
  meta: GetRefundsMeta;
};

export type GetRefundsParams = {
  token: string;
  status?: string;
  page?: number;
  limit?: number;
};

/**
 * GET /api/v1/admin/refunds
 * Get semua refund (butuh token admin)
 */
export async function getRefunds({
  token,
  status,
  page = 1,
  limit = 10,
}: GetRefundsParams): Promise<GetRefundsResponse> {
  const params = new URLSearchParams({
    ...(status && { status }),
    page: String(page),
    limit: String(limit),
  });

  return apiPayment<GetRefundsResponse>(`/api/v1/admin/refunds?${params}`, {
    method: "GET",
    token,
  });
}