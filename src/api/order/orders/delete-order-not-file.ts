import { apiOrder } from "@/lib/api";

export type DeleteOrderNotFileResponse = {
  message: string;
};

export type DeleteOrderNotFileParams = {
  code: string;
  token: string;
};

/**
 * DELETE /api/v1/i/order-not-file/:code
 */
export async function deleteOrderNotFile({
  code,
  token,
}: DeleteOrderNotFileParams): Promise<DeleteOrderNotFileResponse> {
  return apiOrder<DeleteOrderNotFileResponse>(
    `/api/v1/i/order-not-file/${code}`,
    {
      method: "DELETE",
      token,
    }
  );
}
