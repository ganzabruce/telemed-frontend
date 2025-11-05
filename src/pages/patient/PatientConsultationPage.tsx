import React, { useState, useRef, useEffect } from 'react';
import { Video, Phone, Send, Paperclip, MoreVertical, Search, ArrowLeft, Smile, Image, X } from 'lucide-react';

// Mock data for conversations
const mockConversations = [
  {
    id: '1',
    doctorName: 'Dr. Aline UWERA',
    doctorSpecialty: 'Cardiology',
    doctorAvatar: 'AU',
    lastMessage: 'Your test results look good. Continue with...',
    timestamp: '2 min ago',
    unread: 2,
    messages: [
      { id: '1', sender: 'doctor', text: 'Good morning! How are you feeling today?', timestamp: '10:30 AM', date: 'Today' },
      { id: '2', sender: 'patient', text: 'Good morning Doctor. I\'m feeling much better than yesterday.', timestamp: '10:32 AM', date: 'Today' },
      { id: '3', sender: 'doctor', text: 'That\'s great to hear! Have you been taking your medication as prescribed?', timestamp: '10:33 AM', date: 'Today' },
      { id: '4', sender: 'patient', text: 'Yes, I take them twice daily with meals.', timestamp: '10:35 AM', date: 'Today' },
      { id: '5', sender: 'doctor', text: 'Perfect. I\'ve reviewed your recent test results and they\'re showing good improvement.', timestamp: '10:36 AM', date: 'Today' },
      { id: '6', sender: 'patient', text: 'That\'s wonderful news! What do the results show exactly?', timestamp: '10:38 AM', date: 'Today' },
      { id: '7', sender: 'doctor', text: 'Your blood pressure has stabilized and your cholesterol levels are within normal range now.', timestamp: '10:40 AM', date: 'Today' },
      { id: '8', sender: 'doctor', text: 'Your test results look good. Continue with your current medication.', timestamp: '10:41 AM', date: 'Today' },
    ]
  },
  {
    id: '2',
    doctorName: 'Dr. Jean Bosco KABANDA',
    doctorSpecialty: 'Pediatrics',
    doctorAvatar: 'JK',
    lastMessage: 'The vaccination schedule for your child...',
    timestamp: '1 hour ago',
    unread: 0,
    messages: [
      { id: '1', sender: 'patient', text: 'Hello Doctor, I wanted to ask about my child\'s vaccination schedule.', timestamp: '9:15 AM', date: 'Today' },
      { id: '2', sender: 'doctor', text: 'Hello! I\'d be happy to help. How old is your child?', timestamp: '9:20 AM', date: 'Today' },
      { id: '3', sender: 'patient', text: 'She just turned 6 months old last week.', timestamp: '9:22 AM', date: 'Today' },
      { id: '4', sender: 'doctor', text: 'At 6 months, she should receive several important vaccines. Let me send you the complete schedule.', timestamp: '9:25 AM', date: 'Today' },
      { id: '5', sender: 'doctor', text: 'The vaccination schedule for your child includes: DTP, Polio, and Hepatitis B vaccines.', timestamp: '9:26 AM', date: 'Today' },
    ]
  },
  {
    id: '3',
    doctorName: 'Dr. Sarah MUKAMANA',
    doctorSpecialty: 'General Medicine',
    doctorAvatar: 'SM',
    lastMessage: 'Remember to schedule your follow-up...',
    timestamp: 'Yesterday',
    unread: 0,
    messages: [
      { id: '1', sender: 'doctor', text: 'Hi! Just checking in on how you\'re managing with the new diet plan.', timestamp: '3:45 PM', date: 'Yesterday' },
      { id: '2', sender: 'patient', text: 'Hello Doctor! It\'s been going well. I\'ve been following it strictly.', timestamp: '4:10 PM', date: 'Yesterday' },
      { id: '3', sender: 'doctor', text: 'Excellent! Any difficulties or side effects?', timestamp: '4:12 PM', date: 'Yesterday' },
      { id: '4', sender: 'patient', text: 'No major issues, though I did feel a bit tired the first few days.', timestamp: '4:15 PM', date: 'Yesterday' },
      { id: '5', sender: 'doctor', text: 'That\'s normal as your body adjusts. It should improve within a week.', timestamp: '4:18 PM', date: 'Yesterday' },
      { id: '6', sender: 'doctor', text: 'Remember to schedule your follow-up appointment in two weeks.', timestamp: '4:20 PM', date: 'Yesterday' },
    ]
  }
];

const ConsultationPage = () => {
  const [selectedConversation, setSelectedConversation] = useState(mockConversations[0]);
  const [messageInput, setMessageInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showMobileChat, setShowMobileChat] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [selectedConversation]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (messageInput.trim()) {
      setMessageInput('');
      setIsTyping(true);
      
      setTimeout(() => {
        setIsTyping(false);
      }, 2000);
    }
  };

  const filteredConversations = mockConversations.filter(conv =>
    conv.doctorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.doctorSpecialty.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startVideoCall = () => {
    alert('Starting video call with ' + selectedConversation.doctorName);
  };

  const startVoiceCall = () => {
    alert('Starting voice call with ' + selectedConversation.doctorName);
  };

  return (
    <div className="h-150 lg:h-180 md:h-180 bg-gray-50 flex flex-col">
      <div className="flex-1 flex overflow-hidden">
        <div className={`${showMobileChat ? 'hidden md:flex' : 'flex'} flex-col w-full md:w-80 bg-white border-r border-gray-200`}>
          <div className="p-4 border-b border-gray-200">
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
            {filteredConversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => {
                  setSelectedConversation(conv);
                  setShowMobileChat(true);
                }}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  selectedConversation.id === conv.id
                    ? 'bg-blue-50 border-l-4 border-l-blue-600'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white font-semibold text-sm">{conv.doctorAvatar}</span>
                    </div>
                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full"></div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm truncate">{conv.doctorName}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">{conv.timestamp}</span>
                    </div>
                    <p className="text-xs text-blue-600 mb-1">{conv.doctorSpecialty}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-gray-600 truncate">{conv.lastMessage}</p>
                      {conv.unread > 0 && (
                        <span className="ml-2 bg-blue-600 text-white text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0">
                          {conv.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className={`${showMobileChat ? 'flex' : 'hidden md:flex'} flex-1 flex-col bg-gray-50`}>
          <div className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowMobileChat(false)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                <span className="text-white font-semibold text-sm">{selectedConversation.doctorAvatar}</span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">{selectedConversation.doctorName}</h2>
                <p className="text-xs text-gray-500">{selectedConversation.doctorSpecialty}</p>
              </div>
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
            {selectedConversation.messages.map((message, index) => {
              const showDate = index === 0 || selectedConversation.messages[index - 1].date !== message.date;
              
              return (
                <div key={message.id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-gray-200 text-gray-600 text-xs font-medium px-3 py-1 rounded-full">
                        {message.date}
                      </div>
                    </div>
                  )}
                  <div className={`flex ${message.sender === 'patient' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[70%] ${message.sender === 'patient' ? 'flex-row-reverse' : 'flex-row'}`}>
                      {message.sender === 'doctor' && (
                        <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                          <span className="text-white font-semibold text-xs">{selectedConversation.doctorAvatar}</span>
                        </div>
                      )}
                      <div>
                        <div className={`rounded-2xl px-4 py-2 ${
                          message.sender === 'patient'
                            ? 'bg-blue-600 text-white rounded-br-none'
                            : 'bg-white text-gray-900 rounded-bl-none shadow-sm'
                        }`}>
                          <p className="text-sm leading-relaxed">{message.text}</p>
                        </div>
                        <p className={`text-xs text-gray-500 mt-1 ${message.sender === 'patient' ? 'text-right' : 'text-left'}`}>
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
            
            {isTyping && (
              <div className="flex justify-start">
                <div className="flex items-end gap-2 max-w-[70%]">
                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <span className="text-white font-semibold text-xs">{selectedConversation.doctorAvatar}</span>
                  </div>
                  <div className="bg-white rounded-2xl rounded-bl-none shadow-sm px-4 py-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-white border-t border-gray-200 p-4">
            <div className="flex items-end gap-2">
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
                type="button"
                onClick={handleSendMessage}
                disabled={!messageInput.trim()}
                className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConsultationPage;