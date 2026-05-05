// api/order/estimasi/get-estimasi.ts

import { apiOrder } from "@/lib/api";

export type TimerStatus = "idle" | "running" | "paused";

export type TimerStateResponse = {
  timer_status: TimerStatus;
  remaining_seconds: number;
  started_at: string | null;
};

export type GetEstimasiParams = {
  code: string;
  token: string;
};

/**
 * GET /api/v1/i/order/:code/timer
 * Ambil state timer order
 */
export async function getEstimasi({
  code,
  token,
}: GetEstimasiParams): Promise<TimerStateResponse> {
  return apiOrder<TimerStateResponse>(`/api/v1/i/order/code/${code}/timer`, {
    method: "GET",
    token,
  });
}
