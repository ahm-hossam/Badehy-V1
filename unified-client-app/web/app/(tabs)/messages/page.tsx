'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TokenStorage } from '@/lib/storage';
import { initializeSocket, disconnectSocket, joinConversation, leaveConversation, getSocket } from '@/lib/socket';
import type { Socket } from 'socket.io-client';

// Use relative paths to go through Next.js rewrites (works in both browser and WebView)
// In browser/WebView, empty string means relative paths which go through Next.js rewrites
// For SSR or direct backend access, use the full URL
const getApiUrl = () => {
  if (typeof window !== 'undefined') {
    // Check if we're in a WebView - WebView might need absolute URLs
    const isWebView = !!(window as any).ReactNativeWebView;
    if (isWebView) {
      // In WebView, use the same origin as the page (localhost:3002)
      // This will go through Next.js rewrites
      const protocol = window.location.protocol;
      const host = window.location.host;
      return `${protocol}//${host}`;
    }
    return ''; // Use relative paths (goes through Next.js rewrites)
  }
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
};

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
}

interface Client {
  id: number;
  fullName: string;
  email: string;
  trainerId?: number;
}

export default function MessagesPage() {
  const router = useRouter();
  const [client, setClient] = useState<Client | null>(null);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const scrollViewRef = useRef<HTMLDivElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef<Socket | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchClientAndTrainer = useCallback(async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      let res: Response;
      const apiUrl = getApiUrl();
      const meUrl = `${apiUrl}/mobile/me`;
      console.log('[Messages] Fetching client:', meUrl);
      
      try {
        res = await fetch(meUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          }
        });
      } catch (networkError: any) {
        console.error('[Messages] Network error fetching client:', networkError);
        throw new Error('Connection failed. Please check your internet connection and try again.');
      }
      
      console.log('[Messages] Response status:', res.status, 'Content-Type:', res.headers.get('content-type'));
      
      // Check content type BEFORE reading body
      const contentType = res.headers.get('content-type');
      const text = await res.text();
      
      // Check if response is HTML (zrok interstitial or Next.js error page)
      const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');
      if (isHtml) {
        console.error('[Messages] Received HTML instead of JSON:', text.substring(0, 300));
        const isZrok = text.includes('zrok') || text.includes('interstitial');
        if (isZrok) {
          console.warn('[Messages] Zrok interstitial detected - request blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      if (!res.ok) {
        // Check if it's actually JSON before trying to parse
        if (contentType && contentType.includes('application/json')) {
          try {
            const errorJson = text ? JSON.parse(text) : {};
            throw new Error(errorJson?.error || errorJson?.message || `Failed to load client information (${res.status})`);
          } catch (parseError: any) {
            if (parseError.message && parseError.message.includes('Failed to load')) {
              throw parseError;
            }
            throw new Error(`Failed to load client information (${res.status})`);
          }
        } else {
          // HTML error page or non-JSON response
          console.error('[Messages] Non-JSON error response:', text.substring(0, 200));
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }
      
      // Check content type for successful responses
      if (!contentType || !contentType.includes('application/json')) {
        console.error('[Messages] Non-JSON success response:', text.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      let data: any = {};
      try {
        if (text) {
          data = JSON.parse(text);
        }
      } catch (parseError: any) {
        console.error('[Messages] JSON parse error:', parseError, 'Text:', text.substring(0, 200));
        throw new Error(`Failed to parse server response: ${parseError.message || parseError}`);
      }
      
      if (res.ok && data.client) {
        const clientData = {
          id: data.client.id,
          fullName: data.client.fullName,
          email: data.client.email
        };
        setClient(clientData);
        setTrainerId(data.client.trainerId);
      }
    } catch (e: any) {
      console.error('Error fetching client:', e);
      setError(e.message || 'Failed to load profile');
    }
  }, [router]);

  const fetchMessages = useCallback(async () => {
    if (!client?.id || !trainerId) return;

    try {
      setError('');
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      let res: Response;
      const apiUrl = getApiUrl();
      const messagesUrl = `${apiUrl}/api/messages?trainerId=${trainerId}&clientId=${client.id}`;
      console.log('[Messages] Fetching messages:', messagesUrl);
      
      try {
        res = await fetch(messagesUrl, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          }
        });
      } catch (networkError: any) {
        console.error('[Messages] Network error fetching messages:', networkError);
        throw new Error('Connection failed. Please check your internet connection and try again.');
      }

      console.log('[Messages] Messages response status:', res.status, 'Content-Type:', res.headers.get('content-type'));

      // Check content type BEFORE reading body
      const messagesContentType = res.headers.get('content-type');
      const messagesText = await res.text();
      
      // Check if response is HTML (zrok interstitial or Next.js error page)
      const isMessagesHtml = messagesText.trim().startsWith('<!DOCTYPE') || messagesText.trim().startsWith('<html');
      if (isMessagesHtml) {
        console.error('[Messages] Received HTML instead of JSON for messages:', messagesText.substring(0, 300));
        const isZrok = messagesText.includes('zrok') || messagesText.includes('interstitial');
        if (isZrok) {
          console.warn('[Messages] Zrok interstitial detected for messages - request blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }

      if (!res.ok) {
        // Check if it's actually JSON before trying to parse
        if (messagesContentType && messagesContentType.includes('application/json')) {
          try {
            const errorJson = messagesText ? JSON.parse(messagesText) : {};
            throw new Error(errorJson?.error || errorJson?.message || `Failed to fetch messages (${res.status})`);
          } catch (parseError: any) {
            if (parseError.message && parseError.message.includes('Failed to fetch')) {
              throw parseError;
            }
            throw new Error(`Failed to fetch messages (${res.status})`);
          }
        } else {
          // HTML error page or non-JSON response
          console.error('[Messages] Non-JSON error response:', messagesText.substring(0, 200));
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }

      // Check content type for successful responses
      if (!messagesContentType || !messagesContentType.includes('application/json')) {
        console.error('[Messages] Non-JSON success response:', messagesText.substring(0, 200));
        // Empty response means no messages, which is valid
        setMessages([]);
        return;
      }

      let data: any = [];
      try {
        if (!messagesText || messagesText.trim() === '') {
          // Empty response means no messages, which is valid
          data = [];
        } else {
          data = JSON.parse(messagesText);
        }
      } catch (parseError: any) {
        console.error('[Messages] JSON parse error for messages:', parseError, 'Text:', messagesText.substring(0, 200));
        throw new Error(parseError.message || 'Failed to parse messages response');
      }
      console.log('Fetched messages:', data.map((m: Message) => ({ id: m.id, senderType: m.senderType, isRead: m.isRead })));
      setMessages(data);

      // Mark unread trainer messages as read after a delay
      const unreadMessages = data.filter((m: Message) => !m.isRead && m.senderType === 'trainer');
      if (unreadMessages.length > 0 && trainerId && client.id) {
        setTimeout(() => {
          markAllAsRead(trainerId, client.id);
        }, 2000);
      }
    } catch (e: any) {
      console.error('Error fetching messages:', e);
      setError(e.message || 'Failed to load messages');
    } finally {
      setLoading(false);
    }
  }, [client?.id, trainerId, router]);

  const markAllAsRead = async (trainerId: number, clientId: number) => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) return;

      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/messages/mark-all-read`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        },
        body: JSON.stringify({ trainerId, clientId, readBy: 'client' })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !client?.id || !trainerId || sending) return;

    try {
      setSending(true);
      let token = (globalThis as any).ACCESS_TOKEN || await TokenStorage.getAccessToken();
      if (!token) {
        router.push('/login');
        return;
      }

      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('trainerId', trainerId.toString());
        formData.append('clientId', client.id.toString());

        const apiUrl = getApiUrl();
        const uploadRes = await fetch(`${apiUrl}/api/message-uploads`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'skip_zrok_interstitial': 'true'
          },
          body: formData
        });

        console.log('[Messages] Upload response status:', uploadRes.status, 'Content-Type:', uploadRes.headers.get('content-type'));

        // Check content type BEFORE reading body
        const uploadContentType = uploadRes.headers.get('content-type');
        const uploadText = await uploadRes.text();
        
        // Check if response is HTML (zrok interstitial or Next.js error page)
        const isUploadHtml = uploadText.trim().startsWith('<!DOCTYPE') || uploadText.trim().startsWith('<html');
        if (isUploadHtml) {
          console.error('[Messages] Received HTML instead of JSON for upload:', uploadText.substring(0, 300));
          const isZrok = uploadText.includes('zrok') || uploadText.includes('interstitial');
          if (isZrok) {
            console.warn('[Messages] Zrok interstitial detected for upload - request blocked by proxy');
            throw new Error('Network proxy issue. Please wait a moment and try again.');
          }
          throw new Error('Server returned an error page. Please try again.');
        }

        if (uploadRes.ok) {
          // Safe JSON parsing
          if (uploadContentType && uploadContentType.includes('application/json')) {
            try {
              const fileData = JSON.parse(uploadText);
              attachmentUrl = fileData.url;
              attachmentType = fileData.type;
              attachmentName = fileData.name;
            } catch (e: any) {
              console.error('[Messages] Failed to parse upload response:', e, 'Text:', uploadText.substring(0, 200));
              throw new Error('Failed to parse upload response');
            }
          } else {
            console.error('[Messages] Non-JSON upload response:', uploadText.substring(0, 200));
            throw new Error('Server returned non-JSON response');
          }
        } else {
          // Try to parse error message if JSON
          if (uploadContentType && uploadContentType.includes('application/json')) {
            try {
              const errorJson = uploadText ? JSON.parse(uploadText) : {};
              throw new Error(errorJson?.error || errorJson?.message || 'Failed to upload file');
            } catch (parseError: any) {
              if (parseError.message && parseError.message.includes('Failed to upload')) {
                throw parseError;
              }
            }
          }
          throw new Error(`Failed to upload file (${uploadRes.status})`);
        }
      }

      // Send message
      const apiUrl = getApiUrl();
      const sendUrl = `${apiUrl}/api/messages`;
      console.log('[Messages] Sending message:', sendUrl);
      
      const res = await fetch(sendUrl, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
          'skip_zrok_interstitial': 'true'
        },
        body: JSON.stringify({
          trainerId,
          clientId: client.id,
          senderType: 'client',
          content: newMessage.trim() || '',
          attachmentUrl,
          attachmentType,
          attachmentName
        })
      });
      
      console.log('[Messages] Send message response status:', res.status, 'Content-Type:', res.headers.get('content-type'));

      // Check content type BEFORE reading body
      const sendContentType = res.headers.get('content-type');
      const sendText = await res.text();
      
      // Check if response is HTML (zrok interstitial or Next.js error page)
      const isSendHtml = sendText.trim().startsWith('<!DOCTYPE') || sendText.trim().startsWith('<html');
      if (isSendHtml) {
        console.error('[Messages] Received HTML instead of JSON for send:', sendText.substring(0, 300));
        const isZrok = sendText.includes('zrok') || sendText.includes('interstitial');
        if (isZrok) {
          console.warn('[Messages] Zrok interstitial detected for send - request blocked by proxy');
          throw new Error('Network proxy issue. Please wait a moment and try again.');
        }
        throw new Error('Server returned an error page. Please try again.');
      }
      
      if (!res.ok) {
        // Check if it's actually JSON before trying to parse
        if (sendContentType && sendContentType.includes('application/json')) {
          try {
            const errorJson = sendText ? JSON.parse(sendText) : {};
            throw new Error(errorJson?.error || errorJson?.message || 'Failed to send message');
          } catch (parseError: any) {
            if (parseError.message && parseError.message.includes('Failed to send')) {
              throw parseError;
            }
            throw new Error(`Failed to send message (${res.status})`);
          }
        } else {
          // HTML error page or non-JSON response
          console.error('[Messages] Non-JSON error response for send:', sendText.substring(0, 200));
          throw new Error(`Server error: ${res.status} ${res.statusText}`);
        }
      }
      
      // Get the sent message data from response - safe JSON parsing
      if (!sendContentType || !sendContentType.includes('application/json')) {
        console.error('[Messages] Non-JSON success response for send:', sendText.substring(0, 200));
        throw new Error('Server returned non-JSON response');
      }
      
      let sentMessage: any;
      try {
        sentMessage = JSON.parse(sendText);
      } catch (parseError: any) {
        console.error('[Messages] JSON parse error for send:', parseError, 'Text:', sendText.substring(0, 200));
        throw new Error('Failed to parse server response');
      }

      // Add message immediately to UI
      setMessages(prev => {
        if (prev.find(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
      
      // Clear input and scroll
      setNewMessage('');
      setSelectedFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (e: any) {
      console.error('Error sending message:', e);
      setError(e.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    fetchClientAndTrainer();
  }, [fetchClientAndTrainer]);

  useEffect(() => {
    if (client && trainerId) {
      fetchMessages();

      // Initialize WebSocket
      const initSocket = async () => {
        const socket = await initializeSocket();
        socketRef.current = socket;

        if (socket) {
          const handleNewMessage = (message: Message) => {
            console.log('Received new message via socket:', message);
            if (message.trainerId === trainerId && message.clientId === client.id) {
              setMessages(prev => {
                // Avoid duplicates
                if (prev.find(m => m.id === message.id)) return prev;
                return [...prev, message];
              });
              // Scroll to bottom when new message arrives
              setTimeout(() => {
                messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
              }, 100);
            }
          };

          const handleMessagesRead = () => {
            console.log('Messages read event received');
            setMessages(prev => prev.map(m => 
              m.senderType === 'trainer' && !m.isRead ? { ...m, isRead: true } : m
            ));
          };

          socket.on('new_message', handleNewMessage);
          socket.on('messages_read', handleMessagesRead);

          // Join conversation room
          joinConversation(trainerId, client.id);

          return () => {
            socket.off('new_message', handleNewMessage);
            socket.off('messages_read', handleMessagesRead);
            leaveConversation(trainerId, client.id);
          };
        }
      };

      initSocket();

      return () => {
        disconnectSocket();
      };
    }
  }, [client, trainerId, fetchMessages]);

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  if (!client || !trainerId) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center pb-20">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white flex flex-col pb-20">
      {/* Header */}
      <div className="px-5 py-4 border-b border-slate-200 bg-white">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Messages</h1>
        <p className="text-sm text-slate-600">Chat with your trainer</p>
      </div>

      {/* Messages */}
      <div
        ref={scrollViewRef}
        className="flex-1 overflow-y-auto px-4 py-4"
      >
        {loading && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 mb-4"></div>
            <p className="text-sm text-slate-600">Loading messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            <p className="text-lg font-semibold text-slate-600 mb-1">No messages yet</p>
            <p className="text-sm text-slate-400">Start the conversation!</p>
          </div>
        ) : (
          <div className="space-y-3">
            {messages.map((message) => {
              const isUnread = message.senderType === 'trainer' && !message.isRead;
              if (isUnread) {
                console.log('Unread message found:', message.id, message.content?.substring(0, 20));
              }
              return (
                <div
                  key={message.id}
                  className={`flex ${
                    message.senderType === 'client' ? 'justify-end' : 'justify-start'
                  }`}
                >
                  <div
                    className={`max-w-[75%] px-4 py-2.5 rounded-2xl ${
                      message.senderType === 'client'
                        ? 'bg-slate-900 text-white rounded-br-sm'
                        : isUnread
                        ? 'bg-blue-100 border-2 border-blue-500 border-l-4 text-slate-900'
                        : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                    }`}
                  >
                    {message.attachmentUrl && (
                      <div className="mb-2">
                        {message.attachmentType === 'image' ? (
                          <img
                            src={message.attachmentUrl?.startsWith('http') ? message.attachmentUrl : (message.attachmentUrl?.startsWith('/') ? message.attachmentUrl : `/${message.attachmentUrl || ''}`)}
                            alt="Attachment"
                            className="w-48 h-48 rounded-lg object-cover mb-2 bg-slate-100"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              const apiUrl = getApiUrl() || 'http://localhost:4000';
                              if (!target.src.includes(apiUrl)) {
                                const imagePath = message.attachmentUrl?.startsWith('/') 
                                  ? message.attachmentUrl 
                                  : `/${message.attachmentUrl || ''}`;
                                target.src = `${apiUrl}${imagePath}`;
                              }
                            }}
                          />
                        ) : (
                          <a
                            href={(() => {
                              const apiUrl = getApiUrl() || 'http://localhost:4000';
                              return message.attachmentUrl?.startsWith('http') ? message.attachmentUrl : `${apiUrl}${message.attachmentUrl?.startsWith('/') ? message.attachmentUrl : `/${message.attachmentUrl || ''}`}`;
                            })()}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={`flex items-center gap-2 p-2 rounded-lg mb-2 ${
                              message.senderType === 'client'
                                ? 'bg-white bg-opacity-20'
                                : 'bg-slate-200'
                            }`}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="flex-1 text-sm font-medium truncate">
                              {message.attachmentName || 'Attachment'}
                            </span>
                          </a>
                        )}
                      </div>
                    )}
                    {message.content && (
                      <p className={`text-sm leading-5 ${message.senderType === 'client' ? 'text-white' : 'text-slate-900'}`}>
                        {message.content}
                      </p>
                    )}
                    <p className={`text-xs mt-1.5 ${message.senderType === 'client' ? 'text-slate-300' : 'text-slate-500'}`}>
                      {formatTime(message.createdAt)}
                    </p>
                    {isUnread && (
                      <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500"></div>
                    )}
                  </div>
                </div>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-slate-200 bg-white">
        {selectedFile && (
          <div className="flex items-center gap-2 p-2 mb-2 bg-slate-100 rounded-lg">
            <svg className="w-4 h-4 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="flex-1 text-sm text-slate-600 truncate">{selectedFile.name}</span>
            <button
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }}
              className="p-1 hover:bg-slate-200 rounded-full transition-colors"
            >
              <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            onChange={handleFileSelect}
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={sending}
            className="p-2.5 hover:bg-slate-100 rounded-full transition-colors disabled:opacity-50"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
            </svg>
          </button>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 min-h-[40px] max-h-24 px-4 py-2.5 bg-slate-100 rounded-2xl text-sm text-slate-900 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            disabled={sending}
          />
          <button
            onClick={sendMessage}
            disabled={(!newMessage.trim() && !selectedFile) || sending}
            className={`p-2.5 rounded-full transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
              (!newMessage.trim() && !selectedFile) || sending
                ? 'bg-slate-300'
                : 'bg-slate-900 hover:bg-slate-800'
            }`}
          >
            {sending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
