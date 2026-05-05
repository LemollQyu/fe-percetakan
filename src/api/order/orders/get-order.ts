import { apiOrder } from "@/lib/api";

export type OrderStatus =
  | "Created"
  | "Waiting_payment"
  | "Cancelled"
  | "Paid"
  | "Expired"
  | "Code_expired"
  | "On_progress"
  | "Finished"
  | "Completed";

export type Order = {
  id: number;
  user_id: number;
  service_id: number;
  service_name_snapshot: string;
  base_price_snapshot: number;
  total_price_snapshot: number;
  user_note: string;
  status: OrderStatus | string;
  quantity: number;
  estimated_duration: number;
  user: {
    id: number;
    name: string;
    email: string;
    phone: string;
    avatar_url: string;
    role: string;
  };
  order_code: {
    id: number;
    order_id: number;
    code: string;
    expired_at: string;
    created_at: string;
  };
  order_spesifications: Array<{
    id: number;
    order_id: number;
    spesification_id: number;
    spesification_name_snapshot: string;
    value_snapshot: string;
    additional_price_snapshot: number;
    created_at: string;
  }>;
  order_file: {
    id: number;
    order_id: number;
    file_url: string;
    type: string;
    file_type: string;
    created_at: string;
  } | null;
  created_at: string;
  updated_at: string;
};

export type OrdersResponse = {
  data: Order[];
  message: string;
  meta: {
    page: number;
    limit: number;
    total?: number; // Tambahkan jika backend nanti mengirim total
  };
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
function toGoStatus(status: string): string {
  if (!status) return "";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export async function getOrders(
  params: GetOrdersParams,
): Promise<OrdersResponse> {
  const { token, status, page = 1, limit = 10 } = params;

  const search = new URLSearchParams();

  // Gunakan toGoStatus jika kamu ingin memastikan input aman
  // (misal status datang dari input text/url yang mungkin lowercase)
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
