import { apiOrder } from "@/lib/api";

export type CompletedOrderResponse = {
  message: string;
  data?: {
    code_order: string;
    status: string;
    completed_at: string;
  };
};

export type CompletedOrderParams = {
  code: string;
  token: string;
};

/**
 * POST /api/v1/i/order/:code/completed
 * User menandai order selesai
 */
export async function completedOrder({
  code,
  token,
}: CompletedOrderParams): Promise<CompletedOrderResponse> {
  return apiOrder<CompletedOrderResponse>(
    `/api/v1/i/order/${code}/completed`,
    {
      method: "POST",
      token,
    }
  );
}