import { apiPayment } from "@/lib/api";

export type ProofRefundParams = {
  refund_id: number;
  file: File;
  note?: string;
  token: string;
};

export type ProofRefundResponse = {
  data: unknown;
  message: string;
};

/**
 * POST /api/v1/admin/proof-refund/:refundID
 * Admin kirim bukti transfer refund (butuh token admin)
 */
export async function postProofRefund({
  refund_id,
  file,
  note,
  token,
}: ProofRefundParams): Promise<ProofRefundResponse> {
  const formData = new FormData();
  formData.append("bukti", file);
  if (note) formData.append("note", note);

  return apiPayment<ProofRefundResponse>(
    `/api/v1/admin/proof-refund/${refund_id}`,
    {
      method: "POST",
      body: formData,
      token,
    },
  );
}