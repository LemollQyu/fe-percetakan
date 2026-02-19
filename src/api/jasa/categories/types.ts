/**
 * Types untuk kategori jasa - sesuai response jasamc-percetakan
 */

import type { ServiceJasa } from "@/api/jasa/services";

/** Meta kategori dari backend: icon URL setelah upload */
export type CategoryMeta = {
  icon?: string;
  [key: string]: unknown;
};

export type CategoryJasa = {
  id: number;
  name: string;
  description: string;
  slug: string;
  is_active: boolean;
  meta: CategoryMeta | null;
  created_at: string;
  updated_at: string;
};

export type CreateCategoryPayload = {
  name: string;
  description: string;
  slug?: string;
  meta?: Record<string, unknown>;
};

export type CategoriesListResponse = {
  message: string;
  data: CategoryJasa[];
};

/**
 * Detail kategori bisa menyertakan relasi service (lihat `jasamc/models/category.go`).
 * Backend mengirim `service: []`.
 */
export type CategoryJasaDetail = CategoryJasa & {
  service?: ServiceJasa[];
};

export type CategoryDetailResponse = {
  message: string;
  data: CategoryJasaDetail;
};

export type CategoryMessageResponse = {
  message: string;
};

export type CategoryStatusResponse = {
  message: string;
  data: { id: number; is_active: boolean };
};
