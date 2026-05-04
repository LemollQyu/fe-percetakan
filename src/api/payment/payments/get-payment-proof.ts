import { apiPayment } from "@/lib/api";

export type PaymentProof = {
  id: number;
  payment_id: number;
  proof_url: string;
  note: string | null;
  uploaded_at: string;
  verified_at: string | null;
  created_at: string;
};

export type GetPaymentProofResponse = {
  message: string;
  data: PaymentProof;
};

export type GetPaymentProofParams = {
  paymentID: number;
  token: string;
};

export async function getPaymentProof({
  paymentID,
  token,
}: GetPaymentProofParams): Promise<GetPaymentProofResponse> {
  return apiPayment<GetPaymentProofResponse>(
    `/api/v1/i/payment/payment-proof/${paymentID}`,
    {
      method: "GET",
      token,
    }
  );
}