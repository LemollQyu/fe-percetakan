import { apiPayment } from "@/lib/api";

export type DeleteMethodPaymentResponse = {
  message: string;
};

export type DeleteMethodPaymentParams = {
  id_method: number;
  token: string;
};

/**
 * DELETE /api/v1/method-payment/:id_method
 * Hapus metode pembayaran berdasarkan ID
 */
export async function deleteMethodPayment({
  id_method,
  token,
}: DeleteMethodPaymentParams): Promise<DeleteMethodPaymentResponse> {
  return apiPayment<DeleteMethodPaymentResponse>(
    `/api/v1/admin/method-payment/${id_method}`,
    {
      method: "DELETE",
      token,
    },
  );
}
