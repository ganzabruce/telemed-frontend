import axios from "axios";

// Create an Axios instance
const api = axios.create({
  baseURL: "http://localhost:5003",
});

// Function to get the auth token
const getAuthToken = () => {
  const stored = localStorage.getItem("user");
  if (stored) {
    const user = JSON.parse(stored);
    return user?.token;
  }
  return null;
};

// Add an interceptor to include the auth token in all requests
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export interface Conversation {
  id: string;
  doctorId: string;
  patientId: string;
  lastMessageAt: string | null;
  createdAt: string;
  updatedAt: string;
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
export const listConversations = async (): Promise<Conversation[]> => {
  const response = await api.get("/chats");
  return response.data.data;
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

