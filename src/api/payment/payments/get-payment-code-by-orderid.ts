import { apiPayment } from "@/lib/api";
import type { PaymentInner } from "./get-payment-code";

export type GetPaymentByOrderIdResponse = {
  message: string;
  data: PaymentInner;
};

export type GetPaymentByOrderIdParams = {
  order_id: number;
  token: string;
};

/**
 * GET /api/v1/i/payment/:order_id
 */
export async function getPaymentByOrderId({
  order_id,
  token,
}: GetPaymentByOrderIdParams): Promise<GetPaymentByOrderIdResponse> {
  return apiPayment<GetPaymentByOrderIdResponse>(
    `/api/v1/i/payment/${order_id}`,
    {
      method: "GET",
      token,
    }
  );
}