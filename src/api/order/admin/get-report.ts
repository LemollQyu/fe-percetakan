/**
 * GET /api/v1/admin/reports - laporan order admin
 * Query params: type (day | week | month), date (YYYY-MM-DD), page, limit
 */
import { apiOrder } from "@/lib/api";

export type ReportType = "day" | "week" | "month";

export type ReportMeta = {
  type: ReportType;
  start_date: string;
  end_date: string;
};

export type ReportSummary = {
  total_orders: number;
  total_revenue: number;
  average_per_day: number;
};

export type ReportBreakdown = {
  date: string;
  total_orders: number;
  total_revenue: number;
};

export type ReportOrder = {
  id: number;
  user_id: number;
  service_id: number;
  service_name_snapshot: string;
  base_price_snapshot: number;
  total_price_snapshot: number;
  user_note: string;
  status: string;
  quantity: number;
  order_code: ReportOrderCode;
  order_spesifications: ReportOrderSpesification[];
  created_at: string;
  updated_at: string;
};

export type ReportOrderCode = {
  id: number;
  order_id: number;
  code: string;
  expired_at: string;
  created_at: string;
};

export type ReportOrderSpesification = {
  id: number;
  order_id: number;
  spesification_id: number;
  spesification_name_snapshot: string;
  value_snapshot: string;
  additional_price_snapshot: number;
  created_at: string;
};

export type ReportPagination = {
  page: number;
  limit: number;
  total_data: number;
  total_pages: number;
};

export type ReportData = {
  meta: ReportMeta;
  summary: ReportSummary;
  breakdown: ReportBreakdown[];
  orders: ReportOrder[];
  pagination: ReportPagination;
};

export type GetReportResponse = {
  data: ReportData;
  message: string;
};

export type GetReportParams = {
  token: string;
  type: ReportType;
  date: string; // format: YYYY-MM-DD
  page?: number;
  limit?: number;
};

export async function getReport(
  params: GetReportParams,
): Promise<GetReportResponse> {
  const { token, type, date, page = 1, limit = 10 } = params;

  const search = new URLSearchParams();
  search.set("type", type);
  search.set("date", date);
  search.set("page", String(page));
  search.set("limit", String(limit));

  const path = `/api/v1/admin/reports?${search.toString()}`;

  return apiOrder<GetReportResponse>(path, {
    method: "GET",
    token,
  });
}
