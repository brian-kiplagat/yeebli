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
  stripe_account_id: string | null;
  subscription_status: string | null;
}

export interface Tag {
  id: number;
  lead_id: number;
  host_id: number;
  tag: string;
  created_at: string;
  updated_at: string;
}

export interface TagOption {
  id: number;
  host_id: number;
  tag: string;
  created_at: string;
  updated_at: string;
}

export interface SelectedTag {
  id: number;
  tag_id: number;
  lead_id: number;
  created_at: string;
  updated_at: string;
  tag: TagOption;
}

export interface TagEventDetail {
  options: TagOption[];
  selected: SelectedTag[];
}
