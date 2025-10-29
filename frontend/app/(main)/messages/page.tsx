'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/button';
import { Input } from '@/components/input';
import { PaperClipIcon, PaperAirplaneIcon, XMarkIcon, MagnifyingGlassIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Avatar } from '@/components/avatar';
import { initializeSocket, disconnectSocket, joinConversation, leaveConversation, getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

interface Message {
  id: number;
  trainerId: number;
  clientId: number;
  senderType: 'trainer' | 'client';
  content: string;
  attachmentUrl?: string | null;
  attachmentType?: string | null;
  attachmentName?: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  trainer?: {
    id: number;
    fullName: string;
    email: string;
  };
  client?: {
    id: number;
    fullName: string;
    email: string;
  };
}

interface Conversation {
  client: {
    id: number;
    fullName: string;
    email: string;
  };
  lastMessage: {
    id: number;
    content: string;
    senderType: 'trainer' | 'client';
    createdAt: string;
  } | null;
  unreadCount: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [filter, setFilter] = useState('');
  const [selectedClient, setSelectedClient] = useState<{ id: number; fullName: string } | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);

  useEffect(() => {
    const currentUser = getStoredUser();
    if (!currentUser) {
      router.push('/login');
      return;
    }
    setUser(currentUser);
    fetchConversations(currentUser.id);

    // Initialize WebSocket connection
    const socket = initializeSocket();
    socketRef.current = socket;

    if (socket) {
      const handleNewMessage = (message: Message) => {
        // Only add if it's for the current conversation
        if (selectedClient && message.trainerId === currentUser.id && message.clientId === selectedClient.id) {
          setMessages(prev => {
            // Avoid duplicates
            if (prev.find(m => m.id === message.id)) return prev;
            return [...prev, message];
          });
        }
        // Refresh conversations list to update last message
        fetchConversations(currentUser.id);
      };

      const handleMessagesRead = (data: { trainerId: number; clientId: number }) => {
        // Update read status for messages in current conversation
        if (selectedClient && data.trainerId === currentUser.id && data.clientId === selectedClient.id) {
          setMessages(prev => prev.map(m => 
            m.senderType === 'client' && !m.isRead ? { ...m, isRead: true } : m
          ));
        }
      };

      const handleMessageUpdate = () => {
        // Update conversations list when last message changes
        fetchConversations(currentUser.id);
      };

      socket.on('new_message', handleNewMessage);
      socket.on('messages_read', handleMessagesRead);
      socket.on('message_update', handleMessageUpdate);

      return () => {
        socket?.off('new_message', handleNewMessage);
        socket?.off('messages_read', handleMessagesRead);
        socket?.off('message_update', handleMessageUpdate);
      };
    }

    return () => {
      // Don't disconnect socket here - keep it alive while component is mounted
      // Only cleanup event listeners which are handled above
    };
  }, [router, selectedClient]);

  useEffect(() => {
    if (selectedClient && user) {
      fetchMessages(user.id, selectedClient.id);
      
      // Join conversation room via WebSocket
      const socket = getSocket();
      if (socket) {
        joinConversation(user.id, selectedClient.id);
      }

      return () => {
        // Leave conversation room when component unmounts or client changes
        const socket = getSocket();
        if (socket) {
          leaveConversation(user.id, selectedClient.id);
        }
      };
    }
  }, [selectedClient, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchConversations = async (trainerId: number) => {
    try {
      setLoading(true);
      const res = await fetch(`/api/messages/conversations?trainerId=${trainerId}`);
      
      if (!res.ok) {
        const text = await res.text();
        console.error('Error response:', text);
        // Try to parse as JSON, otherwise show the text
        try {
          const errorData = JSON.parse(text);
          console.error('Error data:', errorData);
        } catch (e) {
          console.error('Non-JSON error response:', text);
        }
        return;
      }
      
      const data = await res.json();
      setConversations(data);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (trainerId: number, clientId: number, silent = false) => {
    try {
      if (!silent) setLoading(true);
      const res = await fetch(`/api/messages?trainerId=${trainerId}&clientId=${clientId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
        
        // Mark unread messages as read
        const unreadMessages = data.filter((m: Message) => !m.isRead && m.senderType === 'client');
        if (unreadMessages.length > 0 && user) {
          markAllAsRead(user.id, clientId);
          fetchConversations(user.id); // Refresh unread counts
        }
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  const markAllAsRead = async (trainerId: number, clientId: number) => {
    try {
      await fetch('/api/messages/mark-all-read', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ trainerId, clientId, readBy: 'trainer' })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if ((!newMessage.trim() && !selectedFile) || !user || !selectedClient || sending || uploadingFile) return;

    try {
      setSending(true);
      
      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        setUploadingFile(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('trainerId', user.id.toString());
        formData.append('clientId', selectedClient.id.toString());

        const uploadRes = await fetch('/api/message-uploads', {
          method: 'POST',
          body: formData
        });

        if (uploadRes.ok) {
          const fileData = await uploadRes.json();
          attachmentUrl = fileData.url;
          attachmentType = fileData.type;
          attachmentName = fileData.name;
        } else {
          throw new Error('Failed to upload file');
        }
        setUploadingFile(false);
      }

      // Send message with or without attachment
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          trainerId: user.id,
          clientId: selectedClient.id,
          senderType: 'trainer',
          content: newMessage.trim() || (attachmentUrl ? '' : ''),
          attachmentUrl,
          attachmentType,
          attachmentName
        })
      });

      if (res.ok) {
        const newMsg = await res.json();
        // Don't manually add to messages - WebSocket will handle it
        setNewMessage('');
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        fetchConversations(user.id); // Refresh conversations list
      }
    } catch (error) {
      console.error('Error sending message:', error);
      setUploadingFile(false);
    } finally {
      setSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h`;
    if (diffMins < 2880) return 'Yesterday';
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'U';
  };

  return (
    <div className="space-y-6">
      <div className="flex gap-6 h-[calc(100vh-12rem)]">
        {/* Conversations List */}
        <div className="w-96 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
          <div className="relative">
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none z-10" />
            <Input
              value={filter}
              onChange={e => setFilter(e.target.value)}
              placeholder="Search clients..."
              className="w-full pl-10 bg-white border-gray-200 focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loading && conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
              <p className="text-sm">Loading conversations...</p>
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium mb-1">No conversations yet</p>
              <p className="text-sm text-gray-500">Start chatting with clients from their profile page</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {conversations
                .filter((c) => c.client.fullName?.toLowerCase().includes(filter.toLowerCase()))
                .map((conv) => (
                <button
                  key={conv.client.id}
                  onClick={() => setSelectedClient(conv.client)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-all duration-200 ${
                    selectedClient?.id === conv.client.id ? 'bg-blue-50 border-l-4 border-blue-600' : 'border-l-4 border-transparent'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <Avatar 
                      initials={getInitials(conv.client.fullName)} 
                      className="w-12 h-12 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900 truncate">{conv.client.fullName}</p>
                        {conv.lastMessage && (
                          <span className="text-xs text-gray-400 ml-2 shrink-0">
                            {formatTime(conv.lastMessage.createdAt)}
                          </span>
                        )}
                      </div>
                      {conv.lastMessage && (
                        <p className={`text-sm truncate ${
                          conv.unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'
                        }`}>
                          {conv.lastMessage.senderType === 'trainer' && 'You: '}
                          {conv.lastMessage.content}
                        </p>
                      )}
                      {!conv.lastMessage && (
                        <p className="text-sm text-gray-400 italic">No messages yet</p>
                      )}
                    </div>
                    {conv.unreadCount > 0 && (
                      <span className="bg-blue-600 text-white text-xs font-bold px-2 py-1 rounded-full h-5 flex items-center shrink-0">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 bg-white rounded-xl shadow-lg border border-gray-200 flex flex-col overflow-hidden">
        {selectedClient ? (
          <>
            {/* Chat Header */}
            <div className="p-5 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-indigo-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar 
                  initials={getInitials(selectedClient.fullName)} 
                  className="w-12 h-12"
                />
                <div>
                  <h3 className="text-lg font-bold text-gray-900">{selectedClient.fullName}</h3>
                  <p className="text-sm text-gray-600">{selectedClient.email}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedClient(null)}
                className="p-2 hover:bg-white rounded-lg transition-colors"
              >
                <XMarkIcon className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Messages */}
            <div
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50"
            >
              {loading && messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-500 text-sm">Loading messages...</p>
                  </div>
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <ChatBubbleLeftRightIcon className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-gray-700 font-medium mb-1">No messages yet</p>
                    <p className="text-sm text-gray-500">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-end gap-2 ${message.senderType === 'trainer' ? 'justify-end' : 'justify-start'}`}
                  >
                    {message.senderType === 'client' && (
                      <Avatar 
                        initials={getInitials(message.client?.fullName || selectedClient.fullName)} 
                        className="w-8 h-8 shrink-0"
                      />
                    )}
                    <div className={`max-w-xs lg:max-w-lg px-4 py-3 rounded-2xl shadow-sm ${
                      message.senderType === 'trainer'
                        ? 'bg-blue-600 text-white rounded-br-md'
                        : 'bg-white text-gray-900 border border-gray-200 rounded-bl-md'
                    }`}>
                      {message.attachmentUrl && (
                        <div className="mb-2">
                          {message.attachmentType === 'image' ? (
                            <img 
                              src={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${message.attachmentUrl}`}
                              alt={message.attachmentName || 'Attachment'}
                              className="max-w-full rounded-xl mb-2 shadow-md"
                              style={{ maxHeight: '250px' }}
                            />
                          ) : (
                            <a
                              href={`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${message.attachmentUrl}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                message.senderType === 'trainer'
                                  ? 'bg-blue-700 text-white hover:bg-blue-800'
                                  : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                              }`}
                            >
                              <PaperClipIcon className="w-4 h-4" />
                              <span>{message.attachmentName || 'Attachment'}</span>
                            </a>
                          )}
                        </div>
                      )}
                      {message.content && (
                        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{message.content}</p>
                      )}
                      <p className={`text-xs mt-2 ${message.senderType === 'trainer' ? 'text-blue-100' : 'text-gray-500'}`}>
                        {formatTime(message.createdAt)}
                      </p>
                    </div>
                    {message.senderType === 'trainer' && (
                      <Avatar 
                        initials={getInitials(user?.fullName || 'T')} 
                        className="w-8 h-8 shrink-0"
                      />
                    )}
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <form onSubmit={sendMessage} className="p-5 border-t border-gray-200 bg-white">
              {selectedFile && (
                <div className="mb-3 flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <PaperClipIcon className="w-5 h-5 text-blue-600" />
                  <span className="text-sm text-gray-800 flex-1 truncate font-medium">{selectedFile.name}</span>
                  <button
                    type="button"
                    onClick={() => setSelectedFile(null)}
                    className="p-1 hover:bg-blue-100 rounded-lg transition-colors"
                  >
                    <XMarkIcon className="w-4 h-4 text-gray-600" />
                  </button>
                </div>
              )}
              <div className="relative">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setSelectedFile(file);
                    }
                  }}
                  className="hidden"
                  accept="image/*,application/pdf,video/*,.doc,.docx"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={sending || uploadingFile}
                  className="absolute left-3 top-1/2 transform -translate-y-1/2 p-0 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                  <PaperClipIcon className="w-5 h-5" />
                </button>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type a message..."
                  className="w-full pl-12 pr-20 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 text-gray-900 placeholder-gray-400"
                  disabled={sending || uploadingFile}
                />
                <button
                  type="submit"
                  disabled={(!newMessage.trim() && !selectedFile) || sending || uploadingFile}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {sending || uploadingFile ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <PaperAirplaneIcon className="w-5 h-5" />
                  )}
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center bg-gray-50">
            <div className="text-center">
              <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <ChatBubbleLeftRightIcon className="w-10 h-10 text-gray-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 mb-2">Select a conversation</p>
              <p className="text-sm text-gray-500">Choose a client from the list to start messaging</p>
            </div>
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

