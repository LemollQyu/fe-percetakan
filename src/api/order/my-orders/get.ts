/**
 * GET /api/v1/i/my-orders - riwayat order milik user yang login (butuh token)
 */
import { apiOrder } from "@/lib/api";

export type OrderStatus =
  | "created"
  | "waiting_payment"
  | "cancelled"
  | "paid"
  | "expired"
  | "on_progress"
  | "finished"
  | "completed";

export type MyOrder = {
  id: number | string;
  status: OrderStatus | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type MyOrdersResponse =
  | MyOrder[]
  | {
      data: MyOrder[];
      page?: number;
      limit?: number;
      total?: number;
    };

export type GetMyOrdersParams = {
  token: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
};

export async function getMyOrders(
  params: GetMyOrdersParams
): Promise<MyOrdersResponse> {
  const { token, status, page = 1, limit = 10 } = params;

  const search = new URLSearchParams();
  if (status) search.set("status", status);
  search.set("page", String(page));
  search.set("limit", String(limit));

  const query = search.toString();
  const path = `/api/v1/i/my-orders${query ? `?${query}` : ""}`;

  return apiOrder<MyOrdersResponse>(path, {
    method: "GET",
    token,
  });
}

