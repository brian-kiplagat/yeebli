export interface User {
  bio: string | null;
  createdAt: string;
  email: string;
  id: number;
  is_banned: boolean;
  is_deleted: boolean;
  is_verified: boolean;
  name: string;
  phone: string;
  profile_picture: string | null;
  role: string;
}
