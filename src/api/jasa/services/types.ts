/**
 * Types untuk service/jasa - sesuai response jasamc-percetakan
 */

export type ServiceMedia = {
  id: number;
  service_id: number;
  url: string;
  type: string; // icon | thumbnail | gallery
  created_at: string;
  updated_at: string;
};

export type ServiceSpesificationValue = {
  id: number;
  service_id: number;
  spesification_id: number;
  value: string;
  additional_price: number;
  created_at: string;
  updated_at: string;
};

export type ServiceSpesification = {
  id: number;
  service_id: number;
  name: string;
  input_type: string; // select | boolean | text | number
  options: unknown; // JSON, untuk select
  is_required: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  spesification_value?: ServiceSpesificationValue[];
};

export type ServiceJasa = {
  id: number;
  category_id: number;
  name: string;
  slug: string;
  description: string;
  base_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  media?: ServiceMedia[];
  spesification?: ServiceSpesification[];
};

export type ServicesListResponse = {
  message: string;
  data: ServiceJasa[];
};

export type ServiceDetailResponse = {
  message: string;
  data: ServiceJasa;
};

export type CreateServicePayload = {
  category_id: number;
  name: string;
  description: string;
  base_price?: number;
};

export type CreateServiceSpecificationPayload = {
  service_id: number;
  name: string;
  input_type: "select" | "boolean" | "text" | "number";
  options?: string[] | { value: string; label: string }[]; // untuk select
  is_required: boolean;
};

export type CreateServiceSpecValuePayload = {
  service_id: number;
  spesification_id: number;
  value: string;
  additional_price?: number;
};

export type UpdateServiceSpecValuePayload = {
  value?: string;
  additional_price?: number;
};
