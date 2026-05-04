import { apiPayment } from "@/lib/api";

export type RefundProof = {
  id: number;
  refund_id: number;
  file_url: string;
  note: string;
  created_at: string;
  refund: {
    id: number;
    rejected_id: number;
    bank_name: string;
    account_number: string;
    account_name: string;
    status: string;
    created_at: string;
  };
};

export type RefundItem = {
  id: number;
  rejected_id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  status: string;
  transferred_at?: string;
  created_at: string;
  proofs: RefundProof[]; // selalu array (meskipun kosong)
};

export type RefundData = {
  id: number;
  payment_id: number;
  user_id: number;
  amount: number;
  order_code: string;
  payment_code: string;
  order_name: string;
  admin_note: string;
  created_at: string;
  refunds: RefundItem[]; // bisa kosong []
};

export type GetDetailRefundResponse = {
  data: RefundData;
  message: string;
};

export type GetDetailRefundParams = {
  token: string;
  rejectID: number;
};

export async function getDetailRefunds({
  token,
  rejectID,
}: GetDetailRefundParams): Promise<GetDetailRefundResponse> {
  return apiPayment<GetDetailRefundResponse>(
    `/api/v1/i/refund/${rejectID}`,
    {
      method: "GET",
      token,
    }
  );
}