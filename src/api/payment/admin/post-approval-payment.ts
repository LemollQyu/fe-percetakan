import { apiPayment } from "@/lib/api";

export type ApprovePaymentResponse = {
  message: string;
  data?: any;
};

export type ApprovePaymentParams = {
  code_payment: string;
  token: string;
};

export async function approvePayment({
  code_payment,
  token,
}: ApprovePaymentParams): Promise<ApprovePaymentResponse> {
  return apiPayment<ApprovePaymentResponse>(
    `/api/v1/admin/payment/${code_payment}/approve`,
    {
      method: "POST",
      token,
    }
  );
}