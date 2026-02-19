/**
 * GET /api/v1/services - list semua service/jasa (public)
 */
import { apiJasa } from "@/lib/api";
import type { ServicesListResponse } from "./types";

export async function getServicesList(): Promise<ServicesListResponse> {
  return apiJasa<ServicesListResponse>("/api/v1/services", { method: "GET" });
}
