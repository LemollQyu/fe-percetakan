import { apiPayment } from "@/lib/api";

export type PaymentCode = {
  id: number;
  code: string;
  payment_id: number;
  expired_at: string;
  created_at: string;
};

export type PaymentInner = {
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
  payment_codes: PaymentCode[]; // <-- plural, array
};

export type PaymentDetailData = {
  id: number;
  code: string;
  payment_id: number;
  payment: PaymentInner;
  expired_at: string;
  created_at: string;
};

export type PaymentDetailResponse = {
  Message: string;
  data: PaymentDetailData;
};

export type GetPaymentDetailParams = {
  payment_code: string;
  token: string;
};

/**
 * GET /api/v1/i/code-payment/:payment_code
 */
export async function getPaymentDetail({
  payment_code,
  token,
}: GetPaymentDetailParams): Promise<PaymentDetailResponse> {
  return apiPayment<PaymentDetailResponse>(
    `/api/v1/i/code-payment/${payment_code}`,
    {
      method: "GET",
      token,
    }
  );
}