'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../../../lib/auth';
import { 
  PlusIcon, 
  BellIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  UserGroupIcon,
  MagnifyingGlassIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  TrashIcon
} from '@heroicons/react/24/outline';
import { Button } from '../../../components/button';
import { Heading } from '../../../components/heading';
import { Text } from '../../../components/text';
import { Input } from '../../../components/input';
import { Textarea } from '../../../components/textarea';
import { Select } from '../../../components/select';
import { Badge } from '../../../components/badge';
import { 
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableHeader
} from '../../../components/table';
import { 
  Dialog,
  DialogTitle,
  DialogDescription,
  DialogBody,
  DialogActions
} from '../../../components/dialog';
import { Checkbox } from '../../../components/checkbox';

interface User {
  id: number;
  fullName: string;
  email: string;
}

interface Client {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  pushToken?: {
    token: string;
    platform: string;
    isActive: boolean;
  };
}

interface NotificationRecipient {
  id: number;
  status: string;
  deliveredAt?: string;
  readAt?: string;
  client: {
    id: number;
    fullName: string;
    email: string;
  };
}

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  sentAt: string;
  recipients: NotificationRecipient[];
  stats: {
    totalRecipients: number;
    delivered: number;
    failed: number;
    sent: number;
    deliveryRate: number;
  };
}

export default function NotificationsPage() {
  const [user, setUser] = useState<User | null>(null);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Notification | null>(null);
  
  // Form state
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState('general');
  const [selectedClients, setSelectedClients] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);

  const router = useRouter();

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth/register');
      return;
    }
    setUser(storedUser);
    fetchNotifications(storedUser.id);
    fetchClients(storedUser.id);
  }, [router]);

  const fetchNotifications = async (trainerId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/notifications?trainerId=${trainerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications);
      } else {
        setError('Failed to fetch notifications');
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  };

  const fetchClients = async (trainerId: number) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/notifications/clients?trainerId=${trainerId}`);
      
      if (response.ok) {
        const data = await response.json();
        setClients(data.clients);
      } else {
        console.error('Failed to fetch clients');
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const handleSendNotification = async () => {
    if (!user || !title.trim() || !message.trim() || selectedClients.length === 0) {
      setError('Please fill in all fields and select at least one client');
      return;
    }

    setSending(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          title: title.trim(),
          message: message.trim(),
          type,
          clientIds: selectedClients
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Notification sent:', data);
        
        // Reset form
        setTitle('');
        setMessage('');
        setType('general');
        setSelectedClients([]);
        setSelectAll(false);
        setIsCreateModalOpen(false);
        
        // Refresh notifications
        fetchNotifications(user.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to send notification');
      }
    } catch (error) {
      console.error('Error sending notification:', error);
      setError('Failed to send notification');
    } finally {
      setSending(false);
    }
  };

  const handleResendNotification = async (notification: Notification) => {
    if (!user) return;

    setResending(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          title: notification.title,
          message: notification.message,
          type: notification.type,
          clientIds: notification.recipients.map(r => r.clientId)
        }),
      });

      if (response.ok) {
        console.log('Notification resent successfully');
        // Refresh notifications
        fetchNotifications(user.id);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to resend notification');
      }
    } catch (error) {
      console.error('Error resending notification:', error);
      setError('Failed to resend notification');
    } finally {
      setResending(false);
    }
  };

  const handleDeleteNotification = async (notification: Notification) => {
    if (!user) return;

    setDeleting(true);
    setError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/notifications/${notification.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id
        }),
      });

      if (response.ok) {
        console.log('Notification deleted successfully');
        // Refresh notifications
        fetchNotifications(user.id);
        setDeleteConfirm(null);
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to delete notification');
      }
    } catch (error) {
      console.error('Error deleting notification:', error);
      setError('Failed to delete notification');
    } finally {
      setDeleting(false);
    }
  };

  const handleSelectAllClients = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedClients(clients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const handleClientSelection = (clientId: number, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
      setSelectAll(false);
    }
  };

  const filteredNotifications = notifications.filter(notification =>
    notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    notification.message.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'delivered':
        return <Badge color="green">Delivered</Badge>;
      case 'failed':
        return <Badge color="red">Failed</Badge>;
      case 'sent':
        return <Badge color="yellow">Sent</Badge>;
      default:
        return <Badge color="gray">Unknown</Badge>;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'workout':
        return <Badge color="blue">Workout</Badge>;
      case 'nutrition':
        return <Badge color="green">Nutrition</Badge>;
      case 'program_update':
        return <Badge color="purple">Program Update</Badge>;
      default:
        return <Badge color="gray">General</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <Text className="mt-2">Loading notifications...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Heading>Notifications</Heading>
        <Text>Send notifications to your clients and view delivery history</Text>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="relative flex-1 max-w-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        <div className="flex gap-2">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Send Notification
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Notifications Table */}
      <div className="bg-white shadow-sm ring-1 ring-gray-950/5 rounded-lg">
        <Table>
          <TableHead>
            <TableRow>
              <TableHeader>Notification</TableHeader>
              <TableHeader>Type</TableHeader>
              <TableHeader>Recipients</TableHeader>
              <TableHeader>Delivery Rate</TableHeader>
              <TableHeader>Opened Rate</TableHeader>
              <TableHeader>Sent At</TableHeader>
              <TableHeader className="text-right">Actions</TableHeader>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredNotifications.length === 0 ? (
              <TableRow>
                      <TableCell colSpan={7} className="text-center py-12">
                  <BellIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <Text className="text-gray-500">
                    {searchTerm ? 'No notifications found matching your search.' : 'No notifications sent yet.'}
                  </Text>
                  {!searchTerm && (
                    <Button 
                      onClick={() => setIsCreateModalOpen(true)}
                      className="mt-4"
                    >
                      Send Your First Notification
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              filteredNotifications.map((notification) => (
                <TableRow key={notification.id}>
                  <TableCell className="max-w-md">
                    <div className="space-y-1">
                      <Text className="font-medium text-gray-900">{notification.title}</Text>
                      <Text className="text-sm text-gray-600 break-words whitespace-pre-wrap leading-relaxed">
                        {notification.message}
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    {getTypeBadge(notification.type)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <UserGroupIcon className="w-4 h-4 text-gray-400" />
                      <Text>{notification.stats.totalRecipients}</Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full" 
                            style={{ width: `${notification.stats.deliveryRate}%` }}
                          ></div>
                        </div>
                        <Text className="text-sm">{notification.stats.deliveryRate}%</Text>
                      </div>
                      <Text className="text-xs text-gray-500">
                        {notification.stats.delivered} delivered, {notification.stats.failed} failed
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full" 
                            style={{ width: `${notification.stats.openedRate || 0}%` }}
                          ></div>
                        </div>
                        <Text className="text-sm">{notification.stats.openedRate || 0}%</Text>
                      </div>
                      <Text className="text-xs text-gray-500">
                        {notification.stats.opened || 0} opened, {notification.stats.delivered - (notification.stats.opened || 0)} unopened
                      </Text>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Text className="text-sm">
                      {new Date(notification.sentAt).toLocaleDateString()} at{' '}
                      {new Date(notification.sentAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </Text>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <button
                        onClick={() => handleResendNotification(notification)}
                        disabled={resending}
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-1 transition-colors"
                        title="Resend Notification"
                      >
                        <ArrowPathIcon className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(notification)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                        title="Delete Notification"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create Notification Modal */}
      <Dialog open={isCreateModalOpen} onClose={() => setIsCreateModalOpen(false)}>
        <DialogTitle>Send Notification</DialogTitle>
        <DialogDescription>
          Send a notification to your selected clients. They will receive it as a push notification on their mobile devices.
        </DialogDescription>
        <DialogBody className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter notification title"
              maxLength={100}
            />
            <Text className="text-xs text-gray-500 mt-1">
              {title.length}/100 characters
            </Text>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Message *
            </label>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Enter your message"
              rows={4}
              maxLength={500}
            />
            <Text className="text-xs text-gray-500 mt-1">
              {message.length}/500 characters
            </Text>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              <option value="general">General</option>
              <option value="workout">Workout</option>
              <option value="nutrition">Nutrition</option>
              <option value="program_update">Program Update</option>
            </Select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Recipients * ({selectedClients.length} selected)
            </label>
            <div className="border border-gray-300 rounded-lg max-h-60 overflow-y-auto">
              <div className="p-3 border-b border-gray-200 bg-gray-50">
                <Checkbox
                  checked={selectAll}
                  onChange={(checked) => handleSelectAllClients(checked)}
                />
                <span className="ml-2 text-sm font-medium">Select All Clients</span>
              </div>
              {clients.map((client) => (
                <div key={client.id} className="p-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center">
                    <Checkbox
                      checked={selectedClients.includes(client.id)}
                      onChange={(checked) => handleClientSelection(client.id, checked)}
                    />
                    <div className="ml-3 flex-1">
                      <Text className="font-medium">{client.fullName}</Text>
                      <Text className="text-sm text-gray-500">{client.email}</Text>
                    </div>
                    <div className="flex items-center gap-2">
                      {client.pushToken?.isActive && (
                        <Badge color="green" className="text-xs">Push Enabled</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </DialogBody>
        <DialogActions>
          <Button 
            outline
            onClick={() => setIsCreateModalOpen(false)}
            disabled={sending}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSendNotification}
            disabled={sending || !title.trim() || !message.trim() || selectedClients.length === 0}
            className="flex items-center gap-2"
          >
            {sending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                Sending...
              </>
            ) : (
              <>
                <PaperAirplaneIcon className="w-4 h-4" />
                Send Notification
              </>
            )}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      {deleteConfirm && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed top-0 left-0 right-0 bg-black/50 z-40 animate-in fade-in duration-200"
            style={{ height: '100vh' }}
          />
          
          {/* Dialog */}
          <div 
            className="fixed top-0 left-0 right-0 flex items-center justify-center z-50 animate-in fade-in duration-200"
            style={{ height: '100vh' }}
          >
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl animate-in zoom-in-95 duration-200">
              <Heading level={3} className="text-gray-900 mb-4">
                Delete Notification
              </Heading>
              <Text className="text-gray-600 mb-6">
                Are you sure you want to delete "{deleteConfirm.title}"? This action cannot be undone.
              </Text>
              <div className="flex justify-end space-x-3">
                <Button
                  outline
                  onClick={() => setDeleteConfirm(null)}
                >
                  Cancel
                </Button>
                <Button
                  color="red"
                  onClick={() => handleDeleteNotification(deleteConfirm)}
                  disabled={deleting}
                >
                  {deleting ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
