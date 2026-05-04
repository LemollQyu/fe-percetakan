import { apiPayment } from "@/lib/api";

export type WaitingPaymentCode = {
  id: number;
  code: string;
  payment_id: number;
  expired_at: string;
  created_at: string;
};

export type WaitingPaymentInner = {
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
  payment_code: WaitingPaymentCode;
};

export type WaitingPaymentData = {
  id: number;
  payment_id: number;
  order_id: number;
  user_id: number;
  amount: number;
  order_code: string;
  icon_method_payment: string;
  number_payment: string;
  code_qris: string;
  checkout_at: string;
  expired_at: string;
  created_at: string;
  payment: WaitingPaymentInner;
};

export type WaitingPaymentResponse = {
  data: WaitingPaymentData;
  message: string;
};

export type GetWaitingPaymentParams = {
  code: string;
  token: string;
};

/**
 * GET /api/v1/i/waiting-payment/:code
 * Ambil detail pembayaran yang sedang menunggu
 */
export async function getWaitingPayment({
  code,
  token,
}: GetWaitingPaymentParams): Promise<WaitingPaymentResponse> {
  return apiPayment<WaitingPaymentResponse>(
    `/api/v1/i/waiting-payment/${code}`,
    {
      method: "GET",
      token,
    }
  );
}