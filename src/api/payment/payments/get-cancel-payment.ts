import { apiPayment } from "@/lib/api";

export type CancelPaymentResponse = {
  message: string;
};

export type CancelPaymentParams = {
  payment_code: string;
  token: string;
};

/**
 * GET /api/v1/i/cancelled/payment/:payment_code
 */
export async function cancelPayment({
  payment_code,
  token,
}: CancelPaymentParams): Promise<CancelPaymentResponse> {
  return apiPayment<CancelPaymentResponse>(
    `/api/v1/i/cancelled/payment/${payment_code}`,
    {
      method: "GET",
      token,
    }
  );
}