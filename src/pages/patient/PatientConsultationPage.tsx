import React, { useState, useRef, useEffect } from 'react';
import { Video, Phone, Send, Paperclip, MoreVertical, Search, ArrowLeft, Smile, Image, Plus, PhoneOff } from 'lucide-react';
import { useSocket } from '../../context/SocketContext';
import { useAuth } from '../../context/AuthContext';
import { listConversations, getConversationMessages, markMessagesAsRead, type Conversation, type Message } from '../../api/chatApi';
import { getAppointments } from '../../api/patientsApi';
import VideoCall from '../../components/shared/VideoCall';
import StartConversationModal from '../../components/shared/StartConversationModal';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';

const ConsultationPage = () => {
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
  const [showVideoCall, setShowVideoCall] = useState(false);
  const [appointmentIdForCall, setAppointmentIdForCall] = useState<string | null>(null);
  const [showStartConversationModal, setShowStartConversationModal] = useState(false);
  const [incomingCall, setIncomingCall] = useState<{ appointmentId: string; roomId: string; callerName: string; callerId: string } | null>(null);
  const [callTimer, setCallTimer] = useState<number>(60); // 60 seconds = 1 minute
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations on mount
  useEffect(() => {
    fetchConversations();
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
      // Update conversation list with new last message
      setConversations((prev) =>
        prev.map((conv) =>
          conv.id === newMessage.conversationId
            ? { ...conv, lastMessageAt: newMessage.createdAt }
            : conv
        )
      );
    };

    const handleMessageRead = (data: { conversationId: string; readerId: string; lastReadMessageId: string }) => {
      // Handle read receipts if needed
      console.log('Message read:', data);
    };

    const handleIncomingCall = (callData: { appointmentId: string; roomId: string; callerId: string; callerName: string; appointmentDate: string }) => {
      console.log('Incoming call:', callData);
      setIncomingCall({
        appointmentId: callData.appointmentId,
        roomId: callData.roomId,
        callerName: callData.callerName,
        callerId: callData.callerId,
      });
      setCallTimer(60); // Reset timer to 60 seconds
    };

    socket.on('receiveChatMessage', handleReceiveMessage);
    socket.on('messageRead', handleMessageRead);
    socket.on('incomingCall', handleIncomingCall);

    return () => {
      socket.off('receiveChatMessage', handleReceiveMessage);
      socket.off('messageRead', handleMessageRead);
      socket.off('incomingCall', handleIncomingCall);
    };
  }, [socket, selectedConversation, state.user?.id]);

  // Join conversation room when conversation is selected
  useEffect(() => {
    if (selectedConversation) {
      joinConversation(selectedConversation.id);
      fetchMessages(selectedConversation.id);
    }

    return () => {
      if (selectedConversation) {
        leaveConversation(selectedConversation.id);
      }
    };
  }, [selectedConversation?.id]);

  const fetchConversations = async () => {
    try {
      setIsLoading(true);
      const data = await listConversations();
      setConversations(data);
      if (data.length > 0 && !selectedConversation) {
        setSelectedConversation(data[0]);
      }
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (conversationId: string) => {
    try {
      setIsLoadingMessages(true);
      const data = await getConversationMessages(conversationId);
      setMessages(data);
      scrollToBottom();
      
      // Mark messages as read
      if (data.length > 0) {
        const lastMessage = data[data.length - 1];
        if (lastMessage.senderId !== state.user?.id) {
          await markMessagesAsRead(conversationId, lastMessage.id);
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoadingMessages(false);
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
    const doctorName = conv.doctor?.user?.fullName || '';
    const searchLower = searchQuery.toLowerCase();
    return doctorName.toLowerCase().includes(searchLower);
  });

  // Timer effect for incoming call
  useEffect(() => {
    if (!incomingCall) {
      setCallTimer(60);
      return;
    }

    const timer = setInterval(() => {
      setCallTimer((prev) => {
        if (prev <= 1) {
          // Call timed out - notify doctor
          if (socket && incomingCall) {
            socket.emit('callStatusUpdate', {
              appointmentId: incomingCall.appointmentId,
              status: 'TIMEOUT',
              patientId: state.user?.id,
            });
          }
          setIncomingCall(null);
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [incomingCall, socket, state.user?.id]);

  const handleJoinCall = () => {
    if (incomingCall) {
      // Notify doctor that patient joined
      if (socket) {
        socket.emit('callStatusUpdate', {
          appointmentId: incomingCall.appointmentId,
          status: 'ACCEPTED',
          patientId: state.user?.id,
        });
      }
      setAppointmentIdForCall(incomingCall.appointmentId);
      setShowVideoCall(true);
      setIncomingCall(null);
      setCallTimer(60);
    }
  };

  const handleDeclineCall = () => {
    if (incomingCall && socket) {
      // Notify doctor that patient declined
      socket.emit('callStatusUpdate', {
        appointmentId: incomingCall.appointmentId,
        status: 'DECLINED',
        patientId: state.user?.id,
      });
    }
    setIncomingCall(null);
    setCallTimer(60);
  };

  const startVideoCall = async () => {
    if (!selectedConversation) return;
    
    try {
      // Fetch appointments and find the most recent confirmed appointment for this doctor
      const appointments = await getAppointments('CONFIRMED');
      const doctorId = selectedConversation.doctorId;
      
      // Find appointment with this doctor
      const appointment = appointments.find(
        (apt) => apt.doctor?.id === doctorId && apt.status === 'CONFIRMED'
      );
      
      if (appointment) {
        setAppointmentIdForCall(appointment.id);
        setShowVideoCall(true);
      } else {
        alert('No confirmed appointment found with this doctor. Please book an appointment first.');
      }
    } catch (error) {
      console.error('Error finding appointment:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const startVoiceCall = async () => {
    if (!selectedConversation) return;
    
    try {
      // Fetch appointments and find the most recent confirmed appointment for this doctor
      const appointments = await getAppointments('CONFIRMED');
      const doctorId = selectedConversation.doctorId;
      
      // Find appointment with this doctor
      const appointment = appointments.find(
        (apt) => apt.doctor?.id === doctorId && apt.status === 'CONFIRMED'
      );
      
      if (appointment) {
        setAppointmentIdForCall(appointment.id);
        setShowVideoCall(true);
      } else {
        alert('No confirmed appointment found with this doctor. Please book an appointment first.');
      }
    } catch (error) {
      console.error('Error finding appointment:', error);
      alert('Failed to start call. Please try again.');
    }
  };

  const getDoctorInfo = (conversation: Conversation) => {
    return {
      name: conversation.doctor?.user?.fullName || 'Unknown Doctor',
      avatar: conversation.doctor?.user?.avatarUrl || null,
      initials: getInitials(conversation.doctor?.user?.fullName || 'Unknown'),
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
          fetchConversations(); // Refresh conversations after starting a new one
        }}
        userRole="PATIENT"
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
      {/* Incoming Call Modal */}
      {incomingCall && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-sm bg-black/30">
          <div className="bg-white/95 backdrop-blur-md rounded-3xl p-8 max-w-md w-full mx-4 shadow-2xl border border-white/20">
            <div className="text-center">
              <div className="relative w-24 h-24 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
                <div className="absolute inset-0 rounded-full bg-blue-400 animate-ping opacity-75"></div>
                <div className="absolute inset-0 rounded-full bg-blue-500 animate-pulse"></div>
                <Video className="w-12 h-12 text-white relative z-10" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Incoming Video Call</h2>
              <p className="text-xl font-semibold text-gray-800 mb-1">{incomingCall.callerName}</p>
              <p className="text-sm text-gray-500 mb-2">wants to start a video consultation</p>
              {/* Timer display */}
              <div className="mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-full">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                  <span className="text-sm font-medium text-gray-700">
                    {Math.floor(callTimer / 60)}:{(callTimer % 60).toString().padStart(2, '0')}
                  </span>
                </div>
              </div>
              <div className="flex gap-4 justify-center">
                <button
                  onClick={handleDeclineCall}
                  className="px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <PhoneOff className="w-5 h-5" />
                  Decline
                </button>
                <button
                  onClick={handleJoinCall}
                  className="px-8 py-3 bg-green-500 hover:bg-green-600 text-white rounded-xl transition-all duration-200 font-semibold flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
                >
                  <Video className="w-5 h-5" />
                  Join Call
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="h-190 lg:h-180 md:h-190 bg-gray-50 flex flex-col">
        <div className="flex-1 flex overflow-hidden">
          <div
            className={`${showMobileChat ? 'hidden lg:flex' : 'flex'} flex-col w-full lg:w-80 bg-white border-r border-gray-200`}
          >
            <div className="p-4 border-b border-gray-200 space-y-3">
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
                  placeholder="Search conversations..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length > 0 ? (
                filteredConversations.map((conv) => {
                  const doctorInfo = getDoctorInfo(conv);
                  const isSelected = selectedConversation?.id === conv.id;
                  return (
                    <div
                      key={conv.id}
                      onClick={() => {
                        setSelectedConversation(conv);
                        setShowMobileChat(true);
                      }}
                      className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                        isSelected ? 'bg-blue-50 border-l-4 border-l-blue-600' : 'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="relative">
                          {doctorInfo.avatar ? (
                            <img
                              src={doctorInfo.avatar}
                              alt={doctorInfo.name}
                              className="w-12 h-12 rounded-full"
                            />
                          ) : (
                            <div className="w-12 h-12 bg-blue-500  rounded-full flex items-center justify-center flex-shrink-0">
                              <span className="text-white font-semibold text-sm">{doctorInfo.initials}</span>
                            </div>
                          )}
                          <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <h3 className="font-semibold text-gray-900 text-sm truncate">{doctorInfo.name}</h3>
                            <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                              {formatConversationTime(conv.lastMessageAt)}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 truncate">{getLastMessage(conv)}</p>
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No conversations found</h3>
                  <p className="text-sm text-gray-500">Start a conversation with your doctor</p>
                </div>
              )}
            </div>
          </div>

          <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
            {selectedConversation ? (
              <>
                <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setShowMobileChat(false)}
                      className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
                    >
                      <ArrowLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    {(() => {
                      const doctorInfo = getDoctorInfo(selectedConversation);
                      return (
                        <>
                          {doctorInfo.avatar ? (
                            <img
                              src={doctorInfo.avatar}
                              alt={doctorInfo.name}
                              className="w-10 h-10 rounded-full"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-blue-500  rounded-full flex items-center justify-center">
                              <span className="text-white font-semibold text-sm">{doctorInfo.initials}</span>
                            </div>
                          )}
                          <div>
                            <h2 className="font-semibold text-gray-900">{doctorInfo.name}</h2>
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

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isLoadingMessages ? (
                    <div className="flex items-center justify-center h-full">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    </div>
                  ) : (
                    <>
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
                                  <div className="w-8 h-8 bg-blue-500  rounded-full flex items-center justify-center flex-shrink-0">
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
                        placeholder="Type your message..."
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

export default ConsultationPage;
