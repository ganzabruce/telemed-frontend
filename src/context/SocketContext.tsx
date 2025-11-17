import React, { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_BASE_URL } from '../utils/apiConfig';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
  joinConversation: (conversationId: string) => void;
  leaveConversation: (conversationId: string) => void;
  sendMessage: (conversationId: string, content: string) => void;
  joinCallRoom: (roomId: string) => void;
  leaveCallRoom: (roomId: string) => void;
  sendWebRTCOffer: (toSocketId: string, description: RTCSessionDescriptionInit) => void;
  sendWebRTCAnswer: (toSocketId: string, description: RTCSessionDescriptionInit) => void;
  sendICECandidate: (toSocketId: string, candidate: RTCIceCandidateInit) => void;
}

const SocketContext = createContext<SocketContextType | undefined>(undefined);

export const SocketProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { state } = useAuth();
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    if (!state.user?.token) {
      return;
    }

   
    const newSocket = io(API_BASE_URL, {
      auth: {
        token: state.user.token,
      },
      transports: ['websocket', 'polling'],
    });

    newSocket.on('connect', () => {
      console.log('Socket connected:', newSocket.id);
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Socket disconnected');
      setIsConnected(false);
    });

    newSocket.on('connected', (data) => {
      console.log('Socket authenticated:', data);
    });

    newSocket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    newSocket.on('chatError', (error) => {
      console.error('Chat error:', error);
    });

    newSocket.on('callError', (error) => {
      console.error('Call error:', error);
    });

    socketRef.current = newSocket;
    setSocket(newSocket);

    return () => {
      newSocket.close();
      setSocket(null);
      setIsConnected(false);
    };
  }, [state.user?.token]);

  const joinConversation = (conversationId: string) => {
    if (socket) {
      socket.emit('joinConversation', conversationId);
    }
  };

  const leaveConversation = (_conversationId: string) => {
    // Socket.IO automatically handles leaving rooms on disconnect
    // This is a no-op for client-side cleanup if needed
    // The server will handle room cleanup when socket disconnects
  };

  const leaveCallRoom = (roomId: string) => {
    if (socket) {
      socket.emit('leaveCallRoom', roomId);
    }
  };

  const sendMessage = (conversationId: string, content: string) => {
    if (socket) {
      socket.emit('sendChatMessage', { conversationId, content });
    }
  };

  const joinCallRoom = (roomId: string) => {
    if (socket) {
      socket.emit('joinCallRoom', roomId);
    }
  };

  const sendWebRTCOffer = (toSocketId: string, description: RTCSessionDescriptionInit) => {
    if (socket) {
      socket.emit('webrtcOffer', { toSocketId, description });
    }
  };

  const sendWebRTCAnswer = (toSocketId: string, description: RTCSessionDescriptionInit) => {
    if (socket) {
      socket.emit('webrtcAnswer', { toSocketId, description });
    }
  };

  const sendICECandidate = (toSocketId: string, candidate: RTCIceCandidateInit) => {
    if (socket) {
      socket.emit('iceCandidate', { toSocketId, candidate });
    }
  };

  return (
    <SocketContext.Provider
      value={{
        socket,
        isConnected,
        joinConversation,
        leaveConversation,
        sendMessage,
        joinCallRoom,
        leaveCallRoom,
        sendWebRTCOffer,
        sendWebRTCAnswer,
        sendICECandidate,
      }}
    >
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (context === undefined) {
    throw new Error('useSocket must be used within a SocketProvider');
  }
  return context;
};

