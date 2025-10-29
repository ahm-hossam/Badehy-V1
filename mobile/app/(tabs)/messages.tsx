import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  SafeAreaView, 
  Text, 
  StyleSheet, 
  View, 
  ScrollView, 
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  Linking
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
// Image picker and document picker require native code - wrapping imports to handle gracefully
let ImagePicker: any = null;
let DocumentPicker: any = null;
let imagePickerAvailable = false;
let documentPickerAvailable = false;

try {
  ImagePicker = require('expo-image-picker');
  // Check if module is actually functional (has required methods)
  if (ImagePicker && ImagePicker.launchImageLibraryAsync && ImagePicker.requestMediaLibraryPermissionsAsync) {
    imagePickerAvailable = true;
  }
} catch (e) {
  console.log('ImagePicker native module not available');
}

try {
  DocumentPicker = require('expo-document-picker');
  // Check if module is actually functional (has required methods)
  if (DocumentPicker && DocumentPicker.getDocumentAsync) {
    documentPickerAvailable = true;
  }
} catch (e) {
  console.log('DocumentPicker native module not available');
}
import { TokenStorage } from '../../lib/storage';
import { useFocusEffect } from 'expo-router';
import { initializeSocket, disconnectSocket, joinConversation, leaveConversation, getSocket } from '../../lib/socket';
import type { Socket } from 'socket.io-client';

const API = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

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

export default function MessagesTab() {
  const insets = useSafeAreaInsets();
  const [client, setClient] = useState<Client | null>(null);
  const [trainerId, setTrainerId] = useState<number | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [selectedFile, setSelectedFile] = useState<{ uri: string; name: string; type: string } | null>(null);
  const [fileAttachmentsAvailable, setFileAttachmentsAvailable] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const messagesEndRef = useRef<View>(null);
  const socketRef = useRef<Socket | null>(null);

  // Check if file attachment modules are available on mount
  useEffect(() => {
    const checkModules = () => {
      let available = false;
      
      // Check ImagePicker
      if (imagePickerAvailable && ImagePicker) {
        try {
          if (typeof ImagePicker.launchImageLibraryAsync === 'function' && 
              typeof ImagePicker.requestMediaLibraryPermissionsAsync === 'function') {
            available = true;
          }
        } catch (e) {
          console.log('ImagePicker check failed:', e);
        }
      }
      
      // Check DocumentPicker
      if (documentPickerAvailable && DocumentPicker) {
        try {
          if (typeof DocumentPicker.getDocumentAsync === 'function') {
            available = true;
          }
        } catch (e) {
          console.log('DocumentPicker check failed:', e);
        }
      }
      
      setFileAttachmentsAvailable(available);
    };
    
    checkModules();
  }, []);

  const fetchClientAndTrainer = useCallback(async () => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        token = (await TokenStorage.getAccessToken()) || undefined;
      }
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API}/mobile/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
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
  }, []);

  const fetchMessages = useCallback(async () => {
    if (!client?.id || !trainerId) return;

    try {
      setError('');
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        token = (await TokenStorage.getAccessToken()) || undefined;
      }
      if (!token) throw new Error('Not authenticated');

      const res = await fetch(`${API}/api/messages?trainerId=${trainerId}&clientId=${client.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to fetch messages');
      }

      const data = await res.json();
      console.log('Fetched messages:', data.map((m: Message) => ({ id: m.id, senderType: m.senderType, isRead: m.isRead })));
      setMessages(data);

      // Mark unread trainer messages as read after a delay (to allow highlighting)
      const unreadMessages = data.filter((m: Message) => !m.isRead && m.senderType === 'trainer');
      if (unreadMessages.length > 0 && trainerId && client.id) {
        // Delay marking as read to allow user to see highlighted messages
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
  }, [client?.id, trainerId]);

  const markAllAsRead = async (trainerId: number, clientId: number) => {
    try {
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        token = (await TokenStorage.getAccessToken()) || undefined;
      }
      if (!token) return;

      await fetch(`${API}/api/messages/mark-all-read`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ trainerId, clientId, readBy: 'client' })
      });
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const pickFile = async () => {
    try {
      // Runtime check - try to dynamically check if modules are actually available
      let canUseImagePicker = false;
      let canUseDocumentPicker = false;

      // Try to use ImagePicker if we think it's available
      if (imagePickerAvailable && ImagePicker) {
        try {
          // Quick test to see if module actually works
          if (typeof ImagePicker.launchImageLibraryAsync === 'function' && 
              typeof ImagePicker.requestMediaLibraryPermissionsAsync === 'function') {
            canUseImagePicker = true;
          }
        } catch (e) {
          console.log('ImagePicker not functional:', e);
        }
      }

      // Try to use DocumentPicker if we think it's available
      if (documentPickerAvailable && DocumentPicker) {
        try {
          // Quick test to see if module actually works
          if (typeof DocumentPicker.getDocumentAsync === 'function') {
            canUseDocumentPicker = true;
          }
        } catch (e) {
          console.log('DocumentPicker not functional:', e);
        }
      }

      const options: any[] = [];

      // Add image option if ImagePicker is available and functional
      if (canUseImagePicker && ImagePicker) {
        options.push({
          text: 'Image',
          onPress: async () => {
            try {
              // Request permissions first
              const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (status !== 'granted') {
                Alert.alert('Permission Denied', 'Please grant photo library access to select images.');
                return;
              }

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 0.8,
              });
              if (!result.canceled && result.assets[0]) {
                setSelectedFile({
                  uri: result.assets[0].uri,
                  name: result.assets[0].fileName || `image-${Date.now()}.jpg`,
                  type: 'image'
                });
              }
            } catch (error: any) {
              console.error('Error picking image:', error);
              Alert.alert('Error', 'Failed to pick image. This feature requires a development build. Please rebuild the app with: npx expo run:ios or npx expo run:android');
            }
          }
        });
      }

      // Add document option if DocumentPicker is available and functional
      if (canUseDocumentPicker && DocumentPicker) {
        options.push({
          text: 'Document',
          onPress: async () => {
            try {
              const result = await DocumentPicker.getDocumentAsync({
                type: '*/*',
                copyToCacheDirectory: true,
              });
              if (!result.canceled && result.assets && result.assets[0]) {
                setSelectedFile({
                  uri: result.assets[0].uri,
                  name: result.assets[0].name || 'document',
                  type: 'document'
                });
              }
            } catch (error: any) {
              console.error('Error picking document:', error);
              Alert.alert('Error', 'Failed to pick document. This feature requires a development build. Please rebuild the app with: npx expo run:ios or npx expo run:android');
            }
          }
        });
      }

      // If neither picker is available, show helpful message
      if (options.length === 0) {
        const isDevClient = Constants.executionEnvironment === 'standalone' || Constants.executionEnvironment === 'storeClient';
        const message = isDevClient
          ? 'File attachments require the app to be rebuilt with native modules.\n\nRun one of:\n• npx expo run:ios\n• npx expo run:android\n\nThen restart the app.'
          : 'File attachments are not available in Expo Go.\n\nPlease rebuild the app:\n• npx expo run:ios\n• npx expo run:android';
        
        Alert.alert('File Attachments Unavailable', message, [{ text: 'OK' }]);
        return;
      }

      options.push({ text: 'Cancel', style: 'cancel' });

      Alert.alert(
        'Select File',
        'Choose file type',
        options
      );
    } catch (error) {
      console.error('Error in pickFile:', error);
      Alert.alert('Error', 'Failed to open file picker');
    }
  };

  const sendMessage = async () => {
    if ((!newMessage.trim() && !selectedFile) || !client?.id || !trainerId || sending) return;

    try {
      setSending(true);
      let token = (globalThis as any).ACCESS_TOKEN as string | undefined;
      if (!token) {
        token = (await TokenStorage.getAccessToken()) || undefined;
      }
      if (!token) throw new Error('Not authenticated');

      let attachmentUrl: string | null = null;
      let attachmentType: string | null = null;
      let attachmentName: string | null = null;

      // Upload file if selected
      if (selectedFile) {
        const formData = new FormData();
        
        // Determine MIME type based on file extension
        let mimeType = 'application/octet-stream';
        const fileExt = selectedFile.name.split('.').pop()?.toLowerCase();
        if (selectedFile.type === 'image') {
          mimeType = 'image/jpeg';
        } else if (fileExt === 'pdf') {
          mimeType = 'application/pdf';
        } else if (['doc', 'docx'].includes(fileExt || '')) {
          mimeType = `application/msword${fileExt === 'docx' ? 'x' : ''}`;
        } else if (fileExt === 'txt') {
          mimeType = 'text/plain';
        }
        
        formData.append('file', {
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: mimeType
        } as any);
        formData.append('trainerId', trainerId.toString());
        formData.append('clientId', client.id.toString());

        const uploadRes = await fetch(`${API}/api/message-uploads`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`
          },
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
      }

      // Send message
      const res = await fetch(`${API}/api/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
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
      
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Failed to send message');
      }
      
      // Get the sent message data from response
      const sentMessage = await res.json();

      // Add message immediately to UI
      setMessages(prev => {
        if (prev.find(m => m.id === sentMessage.id)) return prev;
        return [...prev, sentMessage];
      });
      
      // Clear input and scroll
      setNewMessage('');
      setSelectedFile(null);
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
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
  }, []);

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
                scrollViewRef.current?.scrollToEnd({ animated: true });
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
    }
  }, [client, trainerId, fetchMessages]);

  useFocusEffect(
    useCallback(() => {
      if (client && trainerId) {
        fetchMessages();
      }
    }, [client, trainerId, fetchMessages])
  );

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
      <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#111827" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAvoidingView 
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Messages</Text>
          <Text style={styles.headerSubtitle}>Chat with your trainer</Text>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }}
        >
          {loading && messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="large" color="#111827" />
              <Text style={styles.loadingText}>Loading messages...</Text>
            </View>
          ) : messages.length === 0 ? (
            <View style={styles.centerContainer}>
              <Ionicons name="chatbubbles-outline" size={64} color="#D1D5DB" />
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start the conversation!</Text>
            </View>
          ) : (
            <>
              {messages.map((message) => {
                const isUnread = message.senderType === 'trainer' && !message.isRead;
                if (isUnread) {
                  console.log('Unread message found:', message.id, message.content?.substring(0, 20));
                }
                return (
                  <View
                    key={message.id}
                    style={[
                      styles.messageBubble,
                      message.senderType === 'client' ? styles.sentMessage : styles.receivedMessage,
                      isUnread && styles.unreadMessage
                    ]}
                  >
                  {message.attachmentUrl && (
                    <View style={styles.attachmentContainer}>
                      {message.attachmentType === 'image' ? (
                        <Image
                          source={{ uri: `${API}${message.attachmentUrl}` }}
                          style={styles.attachmentImage}
                          resizeMode="cover"
                        />
                      ) : (
                        <Pressable
                          onPress={() => Linking.openURL(`${API}${message.attachmentUrl}`)}
                          style={[
                            styles.attachmentLink,
                            message.senderType === 'client' ? styles.sentAttachment : styles.receivedAttachment
                          ]}
                        >
                          <Ionicons name="document" size={20} color={message.senderType === 'client' ? '#FFFFFF' : '#111827'} />
                          <Text
                            style={[
                              styles.attachmentName,
                              message.senderType === 'client' ? styles.sentText : styles.receivedText
                            ]}
                            numberOfLines={1}
                          >
                            {message.attachmentName || 'Attachment'}
                          </Text>
                        </Pressable>
                      )}
                    </View>
                  )}
                  {message.content ? (
                    <Text
                      style={[
                        styles.messageText,
                        message.senderType === 'client' ? styles.sentText : styles.receivedText
                      ]}
                    >
                      {message.content}
                    </Text>
                  ) : null}
                  <Text
                    style={[
                      styles.messageTime,
                      message.senderType === 'client' ? styles.sentTime : styles.receivedTime
                    ]}
                  >
                    {formatTime(message.createdAt)}
                  </Text>
                  {isUnread && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                );
              })}
              <View ref={messagesEndRef} />
            </>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          {selectedFile && (
            <View style={styles.selectedFileContainer}>
              <Ionicons 
                name={selectedFile.type === 'image' ? 'image' : 'document'} 
                size={16} 
                color="#6B7280" 
              />
              <Text style={styles.selectedFileName} numberOfLines={1}>{selectedFile.name}</Text>
              <Pressable onPress={() => setSelectedFile(null)}>
                <Ionicons name="close-circle" size={20} color="#6B7280" />
              </Pressable>
            </View>
          )}
          <View style={styles.inputRow}>
            {fileAttachmentsAvailable && (
              <Pressable
                onPress={pickFile}
                disabled={sending}
                style={styles.attachButton}
              >
                <Ionicons name="attach" size={20} color="#6B7280" />
              </Pressable>
            )}
            <TextInput
              style={styles.input}
              value={newMessage}
              onChangeText={setNewMessage}
              placeholder="Type a message..."
              placeholderTextColor="#9CA3AF"
              multiline
              editable={!sending}
              onSubmitEditing={sendMessage}
            />
            <Pressable
              onPress={sendMessage}
              disabled={(!newMessage.trim() && !selectedFile) || sending}
              style={[styles.sendButton, ((!newMessage.trim() && !selectedFile) || sending) && styles.sendButtonDisabled]}
            >
              {sending ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Ionicons name="send" size={20} color="#FFFFFF" />
              )}
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B7280',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#6B7280',
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    padding: 16,
    paddingBottom: 8,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 18,
    fontWeight: '600',
    color: '#6B7280',
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#9CA3AF',
  },
  messageBubble: {
    maxWidth: '75%',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 16,
    marginBottom: 12,
  },
  sentMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#111827',
    borderBottomRightRadius: 4,
  },
  receivedMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#F3F4F6',
    borderBottomLeftRadius: 4,
  },
  unreadMessage: {
    backgroundColor: '#DBEAFE',
    borderWidth: 2,
    borderColor: '#3B82F6',
    borderLeftWidth: 5,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  sentText: {
    color: '#FFFFFF',
  },
  receivedText: {
    color: '#111827',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  sentTime: {
    color: '#9CA3AF',
  },
  receivedTime: {
    color: '#6B7280',
  },
  unreadDot: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  attachmentContainer: {
    marginBottom: 8,
  },
  attachmentImage: {
    width: 200,
    height: 200,
    borderRadius: 8,
    marginBottom: 4,
  },
  attachmentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  sentAttachment: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  receivedAttachment: {
    backgroundColor: '#E5E7EB',
  },
  attachmentName: {
    flex: 1,
    fontSize: 14,
  },
  selectedFileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 8,
    marginBottom: 8,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
  },
  selectedFileName: {
    flex: 1,
    fontSize: 14,
    color: '#6B7280',
  },
  inputContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    backgroundColor: '#FFFFFF',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  attachButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    fontSize: 15,
    color: '#111827',
    marginRight: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
});

