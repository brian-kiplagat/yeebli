export interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: Date;
}

export interface EventChat {
  id: string;
  title: string;
  hostId: string;
  messages: ChatMessage[];
}

export interface ChatMessageInput {
  senderId: string;
  text: string;
}

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  is_verified: boolean;
  role: string;
  phone: string;
  profile_picture: string | null;
  bio: string | null;
  is_banned: boolean;
  is_deleted: boolean;
}

export interface Lead {
  isAllowed: boolean;
  message: string;
  name: string;
  email: string;
  phone: string;
  membership_level: string;
  membership_active: boolean;
  id: number;
  createdAt: string;
  updatedAt: string;
}
