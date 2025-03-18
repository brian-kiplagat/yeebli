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
