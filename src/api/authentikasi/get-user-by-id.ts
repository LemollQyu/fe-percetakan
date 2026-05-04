import { apiUser } from "@/lib/api";

export type User = {
  id: number;
  name: string;
  email: string;
  phone?: string;
  avatar_url?: string;
};

export type GetUserResponse = {
  data: User;
  message: string;
};

export type GetUserParams = {
  userID: number;

};

export async function getUserByID({
  userID,

}: GetUserParams): Promise<GetUserResponse> {
  return apiUser<GetUserResponse>(`/api/v1/user/${userID}`, {
    method: "GET",
  });
}