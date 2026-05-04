import { apiOrder } from "@/lib/api";

export type DeleteOrderResponse = {
  message: string;
};

export type DeleteOrderParams = {
  code: string;
  token: string;
};

/**
 * DELETE /api/v1/i/order/:code
 */
export async function deleteOrder({
  code,
  token,
}: DeleteOrderParams): Promise<DeleteOrderResponse> {
  return apiOrder<DeleteOrderResponse>(`/api/v1/i/order/${code}`, {
    method: "DELETE",
    token,
  });
}
