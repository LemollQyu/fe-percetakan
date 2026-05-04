import { apiOrder } from "@/lib/api";

export type UploadOrderFileResponse = {
  message: string;
  data?: {
    id: number;
    order_id: number;
    file_url: string;
    file_type: string;
    created_at: string;
  };
};

export type UploadOrderFileParams = {
  order_id: number;
  file: File;
  token: string;
};

/**
 * POST /api/v1/i/upload-file/order/:id_order
 * Upload file untuk order (butuh token user)
 */
export async function uploadOrderFile({
  order_id,
  file,
  token,
}: UploadOrderFileParams): Promise<UploadOrderFileResponse> {
  const formData = new FormData();
  formData.append("file_order", file);

  // Debug — cek FormData benar-benar ada isinya
 
 console.log("FormData entries:");
formData.forEach((val, key) => {
  console.log(key, val);
});

  return apiOrder<UploadOrderFileResponse>(
    `/api/v1/i/upload-file/order/${order_id}`,
    {
      method: "POST",
      body: formData,
      token,
    }
  );
}