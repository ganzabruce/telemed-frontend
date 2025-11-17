import { api } from "./client";

export interface Conversation {
  id: string;
  doctorId: string;
  patientId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
  unreadCount?: number; // Number of unread messages
  doctor?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  };
  patient?: {
    id: string;
    userId: string;
    user?: {
      id: string;
      fullName: string;
      avatarUrl: string | null;
    };
  };
  messages?: Array<{
    id: string;
    content: string;
    createdAt: string;
    senderId: string;
  }>;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  createdAt: string;
  sender: {
    id: string;
    fullName: string;
    avatarUrl: string | null;
  };
}

/**
 * Get or create a conversation with another user
 */
export const getOrCreateConversation = async (
  targetUserId: string
): Promise<Conversation> => {
  const response = await api.post("/chats", { targetUserId });
  return response.data.data;
};

/**
 * List all conversations for the authenticated user
 */
export const listConversations = async (limit?: number, offset?: number): Promise<{ data: Conversation[]; total: number; limit: number; offset: number }> => {
  const params: { limit?: number; offset?: number } = {};
  if (limit !== undefined) params.limit = limit;
  if (offset !== undefined) params.offset = offset;
  
  const response = await api.get("/chats", { params });
  return {
    data: response.data.data || [],
    total: response.data.total || 0,
    limit: response.data.limit || limit || 20,
    offset: response.data.offset || offset || 0,
  };
};

/**
 * Fetch messages for a specific conversation
 */
export const getConversationMessages = async (
  conversationId: string,
  limit: number = 50,
  offset: number = 0
): Promise<Message[]> => {
  const response = await api.get(`/chats/${conversationId}/messages`, {
    params: { limit, offset },
  });
  return response.data.data;
};

/**
 * Mark messages in a conversation as read
 */
export const markMessagesAsRead = async (
  conversationId: string,
  lastReadMessageId: string
): Promise<void> => {
  await api.post(`/chats/${conversationId}/read-receipts`, {
    lastReadMessageId,
  });
};

