import { apiPayment } from "@/lib/api";

export type ApproveRefundParams = {
  token: string;
  refundID: number;
};

export type ApproveRefundResponse = {
  message: string;
};

export async function approveRefund({
  token,
  refundID,
}: ApproveRefundParams): Promise<ApproveRefundResponse> {
  return apiPayment<ApproveRefundResponse>(
    `/api/v1/i/approve-refund/${refundID}`,
    {
      method: "GET",
      token,
    }
  );
}