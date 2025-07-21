"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/table";
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  MagnifyingGlassIcon,
  UsersIcon 
} from "@heroicons/react/20/solid";
import { getStoredUser } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useSearchParams } from 'next/navigation';
import { Dialog } from '@/components/dialog';

interface Client {
  id: number;
  fullName: string;
  phone: string;
  email: string;
  gender: string;
  age: number;
  source: string;
  createdAt: string;
  updatedAt: string;
  subscriptions: Array<{
    id: number;
    paymentStatus: string;
    priceAfterDisc: number;
    installments: Array<{
      id: number;
      amount: number;
      status: string;
      transactionImages: Array<{
        id: number;
        filename: string;
        originalName: string;
        uploadedAt: string;
      }>;
    }>;
  }>;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<{id: number, name: string} | null>(null);
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);

  // Load clients on component mount
  useEffect(() => {
    loadClients();
  }, []);

  // Load clients when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      loadClients();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedToast(true);
      const timer = setTimeout(() => setShowCreatedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  useEffect(() => {
    if (searchParams.get('updated') === '1') {
      setShowUpdatedToast(true);
      const timer = setTimeout(() => setShowUpdatedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const loadClients = async () => {
    try {
      setLoading(true);
      const user = typeof window !== 'undefined' ? getStoredUser() : null;
      if (!user) {
        setMessage("You must be logged in to view clients.");
        setMessageType("error");
        setClients([]);
        setLoading(false);
        return;
      }
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients?trainerId=${user.id}${searchParam}`;
      console.log('Loading clients for trainerId:', user.id, 'URL:', url);
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        setMessage("Failed to load clients.");
        setMessageType("error");
      }
    } catch (error) {
      setMessage("Error loading clients.");
      setMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (clientId: number, clientName: string) => {
    console.log('Delete clicked:', clientId, clientName); // Debug log
    setConfirmDelete({id: clientId, name: clientName});
  };
  const confirmDeleteClient = async () => {
    if (!confirmDelete) return;
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/clients/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setConfirmDelete(null); // Close dialog first
        await loadClients(); // Wait for client list to reload
        setTimeout(() => {
          setShowDeletedToast(true);
          setTimeout(() => setShowDeletedToast(false), 2000);
        }, 100); // Delay to ensure UI is stable before showing toast
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to delete client.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 2000);
      }
    } catch (error) {
      setErrorMessage("Error deleting client.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleAddClient = () => {
    router.push("/clients/create");
  };

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Clients</h1>
          <p className="text-sm text-gray-600 mt-1">
            Manage your client relationships and information
          </p>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search clients by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <Button onClick={handleAddClient} className="px-4">
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Client
          </Button>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Client Name</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-8">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-gray-600">Loading clients...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : clients.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-12">
                    <div className="text-gray-500">
                      <UsersIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No clients found</h3>
                      <p className="text-sm text-gray-600 mb-4">
                        {searchTerm ? "No clients match your search criteria." : "Get started by adding your first client."}
                      </p>
                      {!searchTerm && (
                        <Button onClick={handleAddClient} className="px-4">
                          <PlusIcon className="h-5 w-5 mr-2" />
                          Add Client
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                clients.map((client) => (
                  <TableRow key={client.id}>
                    <TableCell className="font-medium">
                      {client.fullName}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          outline
                          onClick={() => router.push(`/clients/edit/${client.id}`)}
                          className="px-3 py-1"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          outline
                          onClick={() => handleDelete(client.id, client.fullName)}
                          className="px-3 py-1 text-red-600 hover:text-red-700"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
      {confirmDelete && (
        <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
          <div className="p-6 z-[9999]">
            <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
            <p>Are you sure you want to delete <span className="font-bold">{confirmDelete.name}</span>?</p>
            <div className="flex justify-end gap-2 mt-6">
              <Button outline type="button" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button color="red" type="button" onClick={confirmDeleteClient}>Delete</Button>
            </div>
          </div>
        </Dialog>
      )}
      {showCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Client created successfully!
          </div>
        </div>
      )}
      {showDeletedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Client deleted successfully!
          </div>
        </div>
      )}
      {showErrorToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
            {errorMessage}
          </div>
        </div>
      )}
      {showUpdatedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            Client updated successfully!
          </div>
        </div>
      )}
    </div>
  );
} 