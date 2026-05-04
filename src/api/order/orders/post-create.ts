import { apiOrder } from "@/lib/api";

export type CreateOrderSpecification = {
  specification_id: number;
  value: string | number | boolean;
};

export type CreateOrderPayload = {
  user_id: number;
  service_id: number;
  quantity: number;
  user_note?: string;
  specifications: CreateOrderSpecification[];
};

export type CreatedOrderCode = {
  id: number;
  order_id: number;
  code: string;
  expired_at: string;
  created_at: string;
};

export type CreatedOrderSpesification = {
  id: number;
  order_id: number;
  spesification_id: number;
  spesification_name_snapshot: string;
  value_snapshot: string;
  additional_price_snapshot: number;
  created_at: string;
};

export type CreatedOrder = {
  id: number;
  user_id: number;
  service_id: number;
  service_name_snapshot: string;
  base_price_snapshot: number;
  total_price_snapshot: number;
  user_note: string;
  status: string;
  quantity: number;
  order_code: CreatedOrderCode;
  order_spesifications: CreatedOrderSpesification[];
  created_at: string;
  updated_at: string;
};

export type CreateOrderResponse = {
  data_order: CreatedOrder; // ✅ sesuai response BE
};

/**
 * POST /api/v1/i/order - buat order baru (butuh token user)
 */
export async function createOrder(
  payload: CreateOrderPayload,
  token: string
): Promise<CreateOrderResponse> {
  const idempotencyKey = `order_${Math.random().toString(36).substring(2, 10).toUpperCase()}_${Date.now()}`;

  return apiOrder<CreateOrderResponse>("/api/v1/i/order", {
    method: "POST",
    body: JSON.stringify(payload),
    token,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });
}