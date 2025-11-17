import React, { useState, useRef, useEffect } from 'react';
import { Video, Phone, Send, Paperclip, MoreVertical, Search, ArrowLeft, Smile, Image, Plus } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { listConversations, getConversationMessages, markMessagesAsRead, type Conversation, type Message } from '../../api/chatApi';
import axios from 'axios';
import VideoCall from '../../components/shared/VideoCall';
import StartConversationModal from '../../components/shared/StartConversationModal';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import toast from 'react-hot-toast';

const DoctorConsultationsPage = () => {
  const { state } = useAuth();
  const { socket, joinConversation, leaveConversation, sendMessage } = useSocket();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [isLoadingMoreMessages, setIsLoadingMoreMessages] = useState(false);
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [appointmentIdForCall, setAppointmentIdForCall] = useState<string | null>(null);
  const [showStartConversationModal, setShowStartConversationModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  
  // Pagination states
  const [conversationsPage, setConversationsPage] = useState(1);
  const [conversationsTotal, setConversationsTotal] = useState(0);
  const [conversationsLimit] = useState(20);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);
  const [messagesOffset, setMessagesOffset] = useState(0);
  const messagesLimit = 50;

  const fetchConversations = async (showLoading: boolean = true, page: number = 1, append: boolean = false) => {
    try {
      if (showLoading) {
        setIsLoading(true);
      }
      const offset = (page - 1) * conversationsLimit;
      const result = await listConversations(conversationsLimit, offset);
      
      if (append) {
        setConversations(prev => [...prev, ...result.data]);
      } else {
        setConversations(result.data);
        if (result.data.length > 0 && !selectedConversation) {
          setSelectedConversation(result.data[0]);
        }
      }
      setConversationsTotal(result.total);
      setConversationsPage(page);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      if (showLoading) {
        setIsLoading(false);
      }
    }
  };

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations(true, 1, false); // Show loading on initial load
  }, []);

  // Handle socket events
  useEffect(() => {
    if (!socket) return;

    const handleReceiveMessage = (newMessage: Message) => {
      if (selectedConversation && newMessage.conversationId === selectedConversation.id) {
        setMessages((prev) => {
          // Check if this is a message from the current user (optimistic update)
          const isFromCurrentUser = newMessage.senderId === state.user?.id;
          
          if (isFromCurrentUser) {
            // Replace temp message with real message if it exists
            const hasTempMessage = prev.some(msg => msg.id.startsWith('temp-') && msg.content === newMessage.content);
            if (hasTempMessage) {
              return prev.map(msg => 
                msg.id.startsWith('temp-') && msg.content === newMessage.content 
                  ? newMessage 
                  : msg
              );
            }
          }
          
          // Check if message already exists (prevent duplicates)
          const messageExists = prev.some(msg => msg.id === newMessage.id);
          if (messageExists) {
            return prev;
          }
          
          return [...prev, newMessage];
        });
        scrollToBottom();
      }
      // Update conversation list with new last message and increment unread count
      setConversations((prev) =>
        prev.map((conv) => {
          if (conv.id === newMessage.conversationId) {
            // If message is from other user and conversation is not currently selected, increment unread count
            const isFromOtherUser = newMessage.senderId !== state.user?.id;
            const isNotSelected = selectedConversation?.id !== conv.id;
            
            return {
              ...conv,
              lastMessageAt: newMessage.createdAt,
              unreadCount: isFromOtherUser && isNotSelected 
                ? (conv.unreadCount || 0) + 1 
                : conv.unreadCount || 0,
            };
          }
          return conv;
        })
      );
    };

    const handleMessageRead = (data: { conversationId: string; readerId: string; lastReadMessageId: string }) => {
      // Handle read receipts if needed
      console.log('Message read:', data);
    };

    const handleCallStatusUpdate = (data: { appointmentId: string; status: string; message: string; patientName: string }) => {
      console.log('Call status update:', data);
      
      // Show notification to doctor and close call if declined or timed out
      if (data.status === 'DECLINED') {
        // Close the call on doctor's side
        if (showVideoCall && appointmentIdForCall === data.appointmentId) {
          setShowVideoCall(false);
          setAppointmentIdForCall(null);
        }
        toast.error(`${data.patientName} declined your call.`, {
          duration: 5000,
          icon: '📞',
        });
      } else if (data.status === 'TIMEOUT') {
        // Close the call on doctor's side
        if (showVideoCall && appointmentIdForCall === data.appointmentId) {
          setShowVideoCall(false);
          setAppointmentIdForCall(null);
        }
        toast.error(`${data.patientName} didn't answer your call. The call timed out after 1 minute.`, {
          duration: 5000,
          icon: '⏱️',
        });
      } else if (data.status === 'ACCEPTED') {
        // Patient joined - this is handled by the VideoCall component
        toast.success(`${data.patientName} joined the call.`, {
          duration: 3000,
          icon: '✅',
        });
      }
    };

    socket.on('receiveChatMessage', handleReceiveMessage);
    socket.on('messageRead', handleMessageRead);
    socket.on('callStatusUpdate', handleCallStatusUpdate);

    return () => {
      socket.off('receiveChatMessage', handleReceiveMessage);
      socket.off('messageRead', handleMessageRead);
      socket.off('callStatusUpdate', handleCallStatusUpdate);
    };
  }, [socket, selectedConversation, state.user?.id, showVideoCall, appointmentIdForCall]);

  // Join conversation room when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation.id);
      fetchMessages(selectedConversation.id, false);
    }

    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id]);

  // Refresh conversations periodically to update unread counts
  useEffect(() => {
    const interval = setInterval(() => {
      fetchConversations(false, conversationsPage, false); // Don't show loading on refresh
    }, 30000); // Refresh every 30 seconds

    // Also refresh when window gains focus
    const handleFocus = () => {
      fetchConversations(false, conversationsPage, false); // Don't show loading on focus
    };
    window.addEventListener('focus', handleFocus);

    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handleFocus);
    };
  }, [conversationsPage]);

  const fetchMessages = async (conversationId: string, loadMore: boolean = false) => {
    try {
      if (loadMore) {
        setIsLoadingMoreMessages(true);
      } else {
        setIsLoadingMessages(true);
        setMessagesOffset(0);
        setHasMoreMessages(false);
      }
      
      // Messages are ordered by createdAt ASC (oldest first)
      // When loading more, we need to load older messages (increase offset)
      const offset = loadMore ? messagesOffset + messagesLimit : 0;
      const data = await getConversationMessages(conversationId, messagesLimit, offset);
      
      if (loadMore) {
        // Prepend older messages to the beginning (maintain scroll position)
        const previousScrollHeight = messagesContainerRef.current?.scrollHeight || 0;
        // Don't reverse - data is already in ascending order (oldest first)
        setMessages(prev => [...data, ...prev]);
        setMessagesOffset(offset);
        setHasMoreMessages(data.length === messagesLimit);
        
        // Restore scroll position after prepending
        setTimeout(() => {
          if (messagesContainerRef.current) {
            const newScrollHeight = messagesContainerRef.current.scrollHeight;
            messagesContainerRef.current.scrollTop = newScrollHeight - previousScrollHeight;
          }
        }, 0);
      } else {
        setMessages(data);
        setMessagesOffset(0);
        setHasMoreMessages(data.length === messagesLimit);
        scrollToBottom();
      }
      
      // Mark messages as read (only if there are unread messages from the other party)
      if (data.length > 0 && !loadMore) {
        const lastMessage = data[data.length - 1];
        const hasUnreadMessages = data.some(msg => msg.senderId !== state.user?.id);
        
        if (hasUnreadMessages && lastMessage.senderId !== state.user?.id) {
          try {
            await markMessagesAsRead(conversationId, lastMessage.id);
          } catch (error) {
            console.error('Error marking messages as read:', error);
          }
        }
        
        // Reset unread count for this conversation when messages are loaded
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      } else if (!loadMore) {
        // No messages, ensure unread count is 0
        setConversations((prev) =>
          prev.map((conv) =>
            conv.id === conversationId
              ? { ...conv, unreadCount: 0 }
              : conv
          )
        );
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
      setIsLoadingMoreMessages(false);
    }
  };
  
  const loadMoreMessages = () => {
    if (selectedConversation && hasMoreMessages && !isLoadingMoreMessages) {
      fetchMessages(selectedConversation.id, true);
    }
  };
  
  const handleConversationsScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const isNearBottom = target.scrollHeight - target.scrollTop - target.clientHeight < 100;
    const hasMoreConversations = conversations.length < conversationsTotal;
    
    if (isNearBottom && hasMoreConversations && !isLoading) {
      const nextPage = conversationsPage + 1;
      fetchConversations(false, nextPage, true);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageInput.trim() || !selectedConversation) return;

    const content = messageInput.trim();
    setMessageInput('');

    try {
      sendMessage(selectedConversation.id, content);
      // Optimistically add message to UI
      const tempMessage: Message = {
        id: `temp-${Date.now()}`,
        conversationId: selectedConversation.id,
        senderId: state.user!.id,
        content,
        createdAt: new Date().toISOString(),
        sender: {
          id: state.user!.id,
          fullName: state.user!.fullName,
          avatarUrl: (state.user as any)?.avatarUrl || null,
        },
      };
      setMessages((prev) => [...prev, tempMessage]);
      scrollToBottom();
    } catch (error) {
      console.error('Error sending message:', error);
      setMessageInput(content); // Restore message on error
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    if (isToday(date)) {
      return format(date, 'h:mm a');
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const formatConversationTime = (dateString: string | null) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isToday(date)) {
      return formatDistanceToNow(date, { addSuffix: true });
    } else if (isYesterday(date)) {
      return 'Yesterday';
    } else {
      return format(date, 'MMM d');
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const filteredConversations = conversations.filter((conv) => {
    const patientName = conv.patient?.user?.fullName || '';
    const searchLower = searchQuery.toLowerCase();
    return patientName.toLowerCase().includes(searchLower);
  });

  const getAuthToken = () => {
    const stored = localStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      return user?.token;
    }
    return null;
  };

  const startVideoCall = async () => {
    if (!selectedConversation) return;
    
    try {
      // Fetch appointments and find the most recent confirmed appointment for this patient
      const token = getAuthToken();
      const response = await axios.get('https://telemedicine-backend-dtna.onrender.com/appointments?status=CONFIRMED', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const appointments = response.data.data;
      const patientId = selectedConversation.patientId;
      
      // Find appointment with this patient
      const appointment = appointments.find(
        (apt: any) => apt.patientId === patientId && apt.status === 'CONFIRMED'
      );
      
      if (appointment) {
        setAppointmentIdForCall(appointment.id);
        setShowVideoCall(true);
      } else {
        alert('No confirmed appointment found with this patient.');
      }
    } catch (error) {
      console.error('Error finding appointment:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const startVoiceCall = async () => {
    if (!selectedConversation) return;
    
    try {
      // Fetch appointments and find the most recent confirmed appointment for this patient
      const token = getAuthToken();
      const response = await axios.get('https://telemedicine-backend-dtna.onrender.com/appointments?status=CONFIRMED', {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const appointments = response.data.data;
      const patientId = selectedConversation.patientId;
      
      // Find appointment with this patient
      const appointment = appointments.find(
        (apt: any) => apt.patientId === patientId && apt.status === 'CONFIRMED'
      );
      
      if (appointment) {
        setAppointmentIdForCall(appointment.id);
        setShowVideoCall(true);
      } else {
        alert('No confirmed appointment found with this patient.');
      }
    } catch (error) {
      console.error('Error finding appointment:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const getPatientInfo = (conversation: Conversation) => {
    return {
      name: conversation.patient?.user?.fullName || 'Unknown Patient',
      avatar: conversation.patient?.user?.avatarUrl || null,
      initials: getInitials(conversation.patient?.user?.fullName || 'Unknown'),
    };
  };

  const getLastMessage = (conversation: Conversation) => {
    if (conversation.messages && conversation.messages.length > 0) {
      return conversation.messages[0].content;
    }
    return 'No messages yet';
  };

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <StartConversationModal
        isOpen={showStartConversationModal}
        onClose={() => {
          setShowStartConversationModal(false);
          fetchConversations(false, 1, false); // Refresh conversations after starting a new one
        }}
        userRole="DOCTOR"
      />
      {showVideoCall && appointmentIdForCall && (
        <VideoCall
          appointmentId={appointmentIdForCall}
          onClose={() => {
            setShowVideoCall(false);
            setAppointmentIdForCall(null);
          }}
          isVideoEnabled={true}
        />
      )}
      <div className="h-190 lg:h-180 md:h-190 bg-gray-50 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 bg-white border-r border-gray-200`}
          >
            <div className="p-4 border-b border-gray-200 space-y-3">
              <h1 className="text-xl font-bold text-gray-900">Patient Consultations</h1>
              <button
                onClick={() => setShowStartConversationModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="font-medium">New Conversation</span>
              </button>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search patients..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div 
              className="flex-1 overflow-y-auto"
              onScroll={handleConversationsScroll}
            >
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const patientInfo = getPatientInfo(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowMobileChat(true);
                      }}
                      className={`group relative p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          {patientInfo.avatar ? (
                            <img
                              src={patientInfo.avatar}
                              alt={patientInfo.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-500  rounded-full flex items-center justify-center shrink-0">
                              <span className="text-white font-semibold text-sm">{patientInfo.initials}</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{patientInfo.name}</h3>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              {(conv.unreadCount ?? 0) > 0 && (
                                <span className="px-2 py-0.5 bg-blue-600 text-white text-xs font-bold rounded-full min-w-5 text-center">
                                  {conv.unreadCount! > 99 ? '99+' : conv.unreadCount}
                                </span>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatConversationTime(conv.lastMessageAt)}
                              </span>
                            </div>
                          </div>
                          <p className={`text-sm truncate ${(conv.unreadCount ?? 0) > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
                            {getLastMessage(conv)}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No patients found</h3>
                  <p className="text-sm text-gray-500">Try adjusting your search</p>
                </div>
              )}
              {isLoading && conversations.length > 0 && (
                <div className="flex justify-center py-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                </div>
              )}
            </div>
          </div>

          <div className={`${showMobileChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col bg-gray-50`}>
            {selectedConversation ? (
              <>
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="lg:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    {(() => {
                      const patientInfo = getPatientInfo(selectedConversation);
                      return (
                        <>
                          {patientInfo.avatar ? (
                            <img
                              src={patientInfo.avatar}
                              alt={patientInfo.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-500  rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{patientInfo.initials}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="font-semibold text-gray-900">{patientInfo.name}</h2>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={startVoiceCall}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="Voice call"
                    >
                      <Phone className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <button
                      onClick={startVideoCall}
                      className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                      title="Video call"
                    >
                      <Video className="w-5 h-5 text-gray-600 group-hover:text-blue-600" />
                    </button>
                    <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                      <MoreVertical className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                </div>

                <div 
                  className="flex-1 overflow-y-auto p-4 space-y-4"
                  ref={messagesContainerRef}
                >
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
                      {hasMoreMessages && (
                        <div className="flex justify-center py-2">
                          <button
                            onClick={loadMoreMessages}
                            disabled={isLoadingMoreMessages}
                            className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {isLoadingMoreMessages ? (
                              <span className="flex items-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                                Loading...
                              </span>
                            ) : (
                              'Load older messages'
                            )}
                          </button>
                        </div>
                      )}
                      {messages.map((message, index) => {
                        const isOwnMessage = message.senderId === state.user?.id;
                        const showDate =
                          index === 0 ||
                          new Date(message.createdAt).toDateString() !==
                            new Date(messages[index - 1].createdAt).toDateString();
                        const messageDate = new Date(message.createdAt);

                        return (
                          <div key={message.id}>
                            {showDate && (
                              <div className="flex items-center justify-center my-4">
                                <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                                  {isToday(messageDate)
                                    ? 'Today'
                                    : isYesterday(messageDate)
                                    ? 'Yesterday'
                                    : format(messageDate, 'MMM d, yyyy')}
                                </div>
                              </div>
                            )}
                            <div className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}>
                              <div
                                className={`flex items-end gap-2 max-w-[70%] ${
                                  isOwnMessage ? 'flex-row-reverse' : 'flex-row'
                                }`}
                              >
                                {!isOwnMessage && (
                                  <div className="w-8 h-8 bg-blue-500  rounded-full flex items-center justify-center shrink-0">
                                    <span className="text-white font-semibold text-xs">
                                      {getInitials(message.sender.fullName)}
                                    </span>
                                  </div>
                                )}
                                <div>
                                  <div
                                    className={`rounded-2xl px-4 py-2 ${
                                      isOwnMessage
                                        ? 'bg-blue-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                                    }`}
                                  >
                                    <p className="text-sm leading-relaxed">{message.content}</p>
                                  </div>
                                  <p
                                    className={`text-xs text-gray-500 mt-1 ${
                                      isOwnMessage ? 'text-right' : 'text-left'
                                    }`}
                                  >
                                    {formatMessageTime(message.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </>
                  )}
                </div>

                <div className="bg-white border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Attach file"
                      >
                        <Paperclip className="w-5 h-5 text-gray-600" />
                      </button>
                      <button
                        type="button"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Add image"
                      >
                        <Image className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <div className="flex-1 relative">
                      <textarea
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(e);
                          }
                        }}
                        placeholder="Type your message to patient..."
                        className="w-full px-4 py-3 pr-10 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        rows={1}
                        style={{ minHeight: '44px', maxHeight: '120px' }}
                      />
                      <button
                        type="button"
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 hover:bg-gray-100 rounded transition-colors"
                      >
                        <Smile className="w-5 h-5 text-gray-600" />
                      </button>
                    </div>
                    <button
                      type="submit"
                      disabled={!messageInput.trim()}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-gray-500">Select a conversation to start chatting</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default DoctorConsultationsPage;
