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

interface Client {
  id: number;
  name: string;
  createdAt: string;
  updatedAt: string;
}

export default function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState<"success" | "error">("error");
  const router = useRouter();

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
      const url = `/api/clients?trainerId=${user.id}${searchParam}`;
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
    if (!confirm(`Are you sure you want to delete "${clientName}"?`)) {
      return;
    }

    try {
      const response = await fetch(`/api/clients/${clientId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setMessage(`Client "${clientName}" deleted successfully.`);
        setMessageType("success");
        loadClients(); // Reload the list
      } else {
        const data = await response.json();
        setMessage(data.error || "Failed to delete client.");
        setMessageType("error");
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      setMessage("Error deleting client.");
      setMessageType("error");
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

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg border ${
            messageType === "success" 
              ? "bg-green-50 border-green-200 text-green-800" 
              : "bg-red-50 border-red-200 text-red-800"
          }`}>
            <div className="flex">
              <div className="flex-shrink-0">
                {messageType === "success" ? (
                  <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium">
                  {messageType === "success" ? "Success" : "Error"}
                </p>
                <p className="text-sm mt-1">{message}</p>
              </div>
            </div>
          </div>
        )}

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
                      {client.name}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button
                          outline
                          onClick={() => {
                            setMessage(`Edit functionality for "${client.name}" will be implemented next.`);
                            setMessageType("success");
                          }}
                          className="px-3 py-1"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button
                          outline
                          onClick={() => handleDelete(client.id, client.name)}
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
    </div>
  );
} 