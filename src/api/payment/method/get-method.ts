import { apiPayment } from "@/lib/api";

export type PaymentMethod = {
  id: number;
  payment_method: string;
  number_payment: string;
  url_code: string;
  url_icon: string;
  created_at: string;
  updated_at: string;
};

export type PaymentMethodsResponse = {
  data: PaymentMethod[];
  message: string;
};

/**
 * GET /api/v1/method-payment
 * Ambil daftar metode pembayaran
 */
export async function getPaymentMethods(): Promise<PaymentMethodsResponse> {
  return apiPayment<PaymentMethodsResponse>("/api/v1/method-payment", {
    method: "GET",
  });
}