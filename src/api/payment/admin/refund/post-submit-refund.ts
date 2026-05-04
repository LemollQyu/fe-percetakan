import { apiPayment } from "@/lib/api";

export type SubmitRefundParams = {
  code_payment: string;
  order_code: string;
  order_name: string;
  admin_note: string;
  token: string;
};

export type SubmitRefundResponse = {
  data: unknown;
};

/**
 * POST /api/v1/admin/submit-refund/:codePayment
 * Submit refund order (butuh token admin)
 */
export async function submitRefund({
  code_payment,
  order_code,
  order_name,
  admin_note,
  token,
}: SubmitRefundParams): Promise<SubmitRefundResponse> {
  return apiPayment<SubmitRefundResponse>(
    `/api/v1/admin/submit-refund/${code_payment}`,
    {
      method: "POST",
      body: JSON.stringify({ order_code, order_name, admin_note }),
      token,
    },
  );
}