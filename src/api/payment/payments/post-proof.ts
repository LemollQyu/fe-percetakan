import { apiPayment } from "@/lib/api";

export type PaymentProofResponse = {
  message: string;
  data?: {
    id: number;
    payment_id: number;
    proof_url: string;
    note: string;
    uploaded_at: string;
    created_at: string;
  };
};

export type UploadPaymentProofParams = {
  code: string;
  file: File;
  note?: string;
  token: string;
};

/**
 * POST /api/v1/i/payment-proof/:code
 * Upload bukti pembayaran
 */
export async function uploadPaymentProof({
  code,
  file,
  note,
  token,
}: UploadPaymentProofParams): Promise<PaymentProofResponse> {
  const formData = new FormData();
  formData.append("bukti", file);
  if (note) formData.append("note", note);

  return apiPayment<PaymentProofResponse>(
    `/api/v1/i/payment-proof/${code}`,
    {
      method: "POST",
      body: formData,
      token,
    }
  );
}