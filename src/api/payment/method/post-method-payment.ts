import { apiPayment } from "@/lib/api";

export type CreateMethodPaymentResponse = {
  message: string;
  data?: {
    id: number;
    payment_method: string;
    number_payment: string;
    icon_url: string;
    qris_url?: string;
    created_at: string;
    updated_at: string;
  };
};

export type CreateMethodPaymentParams = {
  payment_method: string;
  number_payment: string;
  icon: File;
  qris?: File;
  token: string;
};

/**
 * POST /api/v1/method-payment
 * Tambah metode pembayaran baru
 * Note: field `qris` hanya wajib jika payment_method === "qris" (divalidasi di backend)
 */
export async function createMethodPayment({
  payment_method,
  number_payment,
  icon,
  qris,
  token,
}: CreateMethodPaymentParams): Promise<CreateMethodPaymentResponse> {
  const formData = new FormData();
  formData.append("payment_method", payment_method);
  formData.append("number_payment", number_payment);
  formData.append("icon", icon);
  if (qris) formData.append("qris", qris);

  return apiPayment<CreateMethodPaymentResponse>(
    "/api/v1/admin/method-payment",
    {
      method: "POST",
      body: formData,
      token,
    },
  );
}
