import { apiPayment } from "@/lib/api";

export type SendRekeningParams = {
  reject_id: number;
  bank_name: string;
  account_number: string;
  account_name: string;
  token: string;
};

export type SendRekeningResponse = {
  data: unknown;
  message: string;
};

/**
 * POST /api/v1/i/send-number-rakening/:rejectID
 * User kirim nomor rekening untuk proses refund (butuh token user)
 */
export async function sendRekening({
  reject_id,
  bank_name,
  account_number,
  account_name,
  token,
}: SendRekeningParams): Promise<SendRekeningResponse> {
  return apiPayment<SendRekeningResponse>(
    `/api/v1/i/send-number-rakening/${reject_id}`,
    {
      method: "POST",
      body: JSON.stringify({ bank_name, account_number, account_name }),
      token,
    },
  );
}