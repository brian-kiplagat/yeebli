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
