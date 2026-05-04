import { apiPayment } from "@/lib/api";

export type RejectedPaymentResponse = {
  message: string;
  data?: any;
};

export type RejectedPaymentParams = {
  code_payment: string;
  token: string;
};

export async function rejectedPayment({
  code_payment,
  token,
}: RejectedPaymentParams): Promise<RejectedPaymentResponse> {
  return apiPayment<RejectedPaymentResponse>(
    `/api/v1/admin/payment/${code_payment}/reject`,
    {
      method: "POST",
      token,
    }
  );
}