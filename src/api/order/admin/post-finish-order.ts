import { apiOrder } from "@/lib/api";

export type FinishOrderResponse = {
  message: string;
  data?: {
    code_order: string;
    status: string;
    finished_at: string;
  };
};

export type FinishOrderParams = {
  code_order: string;
  token: string;
};

/**
 * POST /api/v1/order/:code_order/finished
 * Menyelesaikan order
 */
export async function finishOrder({
  code_order,
  token,
}: FinishOrderParams): Promise<FinishOrderResponse> {
  return apiOrder<FinishOrderResponse>(
    `/api/v1/admin/order/${code_order}/finished`,
    {
      method: "POST",
      token,
    }
  );
}