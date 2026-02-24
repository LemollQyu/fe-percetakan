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

export type Order = {
  id: number | string;
  status: OrderStatus | string;
  created_at?: string;
  updated_at?: string;
  [key: string]: unknown;
};

export type OrdersResponse =
  | Order[]
  | {
      data: Order[];
      page?: number;
      limit?: number;
      total?: number;
    };

export type GetOrdersParams = {
  token: string;
  status?: OrderStatus;
  page?: number;
  limit?: number;
};

/**
 * Transform lowercase TS enum → Go enum format
 * "on_progress" → "On_progress" | "waiting_payment" → "Waiting_payment"
 */
function toGoStatus(status: OrderStatus): string {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

/**
 * GET /api/v1/admin/orders - daftar semua order (butuh token admin)
 */
export async function getOrders(
  params: GetOrdersParams
): Promise<OrdersResponse> {
  const { token, status, page = 1, limit = 10 } = params;

  const search = new URLSearchParams();
  if (status) search.set("status", toGoStatus(status));
  search.set("page", String(page));
  search.set("limit", String(limit));

  const query = search.toString();
  const path = `/api/v1/admin/orders${query ? `?${query}` : ""}`;

  return apiOrder<OrdersResponse>(path, {
    method: "GET",
    token,
  });
}