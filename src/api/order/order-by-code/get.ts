import { apiOrder } from "@/lib/api";

export type OrderUser = {
  id: number;
  name: string;
  email: string;
  phone: string;
  avatar_url: string;
  role: string;
};

export type OrderCode = {
  id: number;
  order_id: number;
  code: string;
  expired_at: string;
  created_at: string;
};

export type OrderSpesification = {
  id: number;
  order_id: number;
  spesification_id: number;
  spesification_name_snapshot: string;
  value_snapshot: string;
  additional_price_snapshot: number;
  created_at: string;
};

export type OrderFile = {
  id: number;
  order_id: number;
  file_url: string;
  type: string;
  file_type: string;
  created_at: string;
};

export type OrderByCode = {
  id: number;
  user_id: number;
  service_id: number;
  service_name_snapshot: string;
  base_price_snapshot: number;
  total_price_snapshot: number;
  user_note: string;
  status: string;
  quantity: number;
  user: OrderUser;
  order_code: OrderCode;
  order_spesifications: OrderSpesification[];
  order_file: OrderFile | null;
  created_at: string;
  updated_at: string;
};

export type OrderByCodeResponse = {
  data: OrderByCode;
  message: string;
};

export type GetOrderByCodeParams = {
  code: string;
  token?: string;
};

/**
 * GET /api/v1/order?code=[code] - get order by code
 */
export async function getOrderByCode(
  params: GetOrderByCodeParams
): Promise<OrderByCodeResponse> {
  const { code, token } = params;
  const path = `/api/v1/i/order?code=${encodeURIComponent(code)}`;
  return apiOrder<OrderByCodeResponse>(path, {
    method: "GET",
    token,
  });
}
