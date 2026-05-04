import { apiPayment } from "@/lib/api";

export type CheckoutData = {
  order_id: number;
  user_id: number;
  amount: number;
  order_code: string;
  number_payment: string;
  code_qris: string;
  expired_at: string;
  service: string;
};

export type CheckoutResponse = {
  data: CheckoutData;
};

export type CheckoutParams = {
  code: string;
  token: string;
  payment_method: string;
};

/**
 * POST /api/v1/i/checkout?code=:order_code
 * Checkout order (butuh token user)
 */
export async function postCheckout({
  code,
  token,
  payment_method,
}: CheckoutParams): Promise<CheckoutResponse> {
  return apiPayment<CheckoutResponse>(`/api/v1/i/checkout?code=${code}`, {
    method: "POST",
    body: JSON.stringify({ payment_method }),
    token,
  });
}