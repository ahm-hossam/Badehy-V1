'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/table';
import { Dialog } from '@/components/dialog';
import { Input } from '@/components/input';
import { Select } from '@/components/select';
import { getStoredUser } from '@/lib/auth';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FireIcon,
  CalendarIcon,
  ClockIcon,
  DocumentArrowUpIcon
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSearchParams } from 'next/navigation';

interface Program {
  id: number;
  name: string;
  description?: string;
  template?: string;
  branding?: any;
  pdfUrl?: string;
  isImported?: boolean;
  isDefault?: boolean;
  importedPdfUrl?: string;
  programDuration?: number;
  durationUnit?: string;
  createdAt: string;
  updatedAt: string;
  weeks: ProgramWeek[];
}

interface ProgramWeek {
  id: number;
  weekNumber: number;
  name?: string;
  days: ProgramDay[];
}

interface ProgramDay {
  id: number;
  dayNumber: number;
  name?: string;
  exercises: ProgramExercise[];
}

interface ProgramExercise {
  id: number;
  order: number;
  sets?: number;
  reps?: number;
  weight?: number;
  duration?: number;
  restTime?: number;
  notes?: string;
  exercise: {
    id: number;
    name: string;
  };
}

export default function ProgramsPage() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [total, setTotal] = useState(0);
  const [confirmDelete, setConfirmDelete] = useState<{id: number, name: string} | null>(null);
  const [showDeletedToast, setShowDeletedToast] = useState(false);
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showCreatedToast, setShowCreatedToast] = useState(false);
  
  // Import program state
  const [showImportModal, setShowImportModal] = useState(false);
  const [importLoading, setImportLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importData, setImportData] = useState({
    programName: '',
    programDuration: '',
    durationUnit: 'weeks'
  });

  useEffect(() => {
    const storedUser = getStoredUser();
    if (storedUser) {
      setUser(storedUser);
      fetchPrograms(storedUser.id);
    }
  }, []);

  // Load programs when search term changes
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (user) {
        fetchPrograms(user.id);
      }
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchTerm, user]);

  useEffect(() => {
    if (searchParams.get('created') === '1') {
      setShowCreatedToast(true);
      const timer = setTimeout(() => setShowCreatedToast(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [searchParams]);

  const fetchPrograms = async (trainerId: number) => {
    try {
      setLoading(true);
      const searchParam = searchTerm ? `&search=${encodeURIComponent(searchTerm)}` : "";
      const url = `${process.env.NEXT_PUBLIC_API_URL || ''}/api/programs?trainerId=${trainerId}${searchParam}&page=${page}&pageSize=${pageSize}`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setPrograms(data.programs || data); // support both array and paginated
        setTotal(data.total || (Array.isArray(data) ? data.length : 0));
      } else {
        setErrorMessage("Failed to load programs.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 2000);
      }
    } catch (error) {
      console.error('Error fetching programs:', error);
      setErrorMessage("Error loading programs.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId: number, programName: string) => {
    setConfirmDelete({id: programId, name: programName});
  };

  const handleExportPDF = async (program: Program) => {
    try {
      setLoading(true);
      
      // Call the backend API to generate PDF
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/programs/${program.id}/export-pdf`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        // Get the HTML content
        const htmlContent = await response.text();
        
        // Create a new window with the HTML content
        const newWindow = window.open('', '_blank');
        if (newWindow) {
          newWindow.document.write(htmlContent);
          newWindow.document.close();
          
          // Add print functionality
          newWindow.onload = () => {
            newWindow.print();
          };
        }
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to export PDF.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (error) {
      console.error('Error exporting PDF:', error);
      setErrorMessage("Failed to export PDF. Please try again.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setLoading(false);
    }
  };

  const confirmDeleteProgram = async () => {
    if (!confirmDelete) return;
    
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/programs/${confirmDelete.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setConfirmDelete(null); // Close dialog first
        await fetchPrograms(user.id); // Wait for program list to reload
        setTimeout(() => {
          setShowDeletedToast(true);
          setTimeout(() => setShowDeletedToast(false), 2000);
        }, 100); // Delay to ensure UI is stable before showing toast
      } else {
        const data = await response.json();
        setErrorMessage(data.error || "Failed to delete program.");
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 2000);
      }
    } catch (error) {
      console.error('Error deleting program:', error);
      setErrorMessage("Error deleting program.");
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    } finally {
      setConfirmDelete(null);
    }
  };

  const getTotalExercises = (program: Program) => {
    return program.weeks.reduce((total, week) => {
      return total + week.days.reduce((dayTotal, day) => {
        return dayTotal + day.exercises.length;
      }, 0);
    }, 0);
  };

  const getTotalWeeks = (program: Program) => {
    return program.weeks.length;
  };

  const handleCreateProgram = () => {
    router.push('/workout-programs/create');
  };

  const handleImportProgram = () => {
    setShowImportModal(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
      // Auto-fill program name from filename
      const fileName = file.name.replace('.pdf', '');
      setImportData(prev => ({ ...prev, programName: fileName }));
    } else {
      setErrorMessage('Please select a valid PDF file');
      setShowErrorToast(true);
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    console.log('User object:', user);
    console.log('User ID being sent:', user.id);

    setImportLoading(true);
    try {
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('trainerId', user.id.toString());
      formData.append('programName', importData.programName);
      formData.append('programDuration', importData.programDuration);
      formData.append('durationUnit', importData.durationUnit);

      console.log('FormData contents:');
      for (let [key, value] of formData.entries()) {
        console.log(key, value);
      }

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/programs/import`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setShowImportModal(false);
        setSelectedFile(null);
        setImportData({ programName: '', programDuration: '', durationUnit: 'weeks' });
        setShowCreatedToast(true);
        fetchPrograms(user.id);
      } else {
        const error = await response.json();
        console.error('Import failed:', error);
        setErrorMessage(error.error || 'Failed to import program');
        setShowErrorToast(true);
      }
    } catch (error) {
      console.error('Error importing program:', error);
      setErrorMessage('Failed to import program');
      setShowErrorToast(true);
    } finally {
      setImportLoading(false);
    }
  };

  if (loading && programs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading programs...</div>
      </div>
    );
  }

  return (
    <div className="py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Workout Programs</h1>
          <p className="text-sm text-gray-600 mt-1">
            Create and manage your custom workout programs for clients
          </p>
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              placeholder="Search programs by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <Button outline onClick={handleImportProgram} className="px-4">
              <DocumentArrowUpIcon className="h-5 w-5 mr-2" />
              Import Program
            </Button>
            <Button onClick={handleCreateProgram} className="px-4">
              <PlusIcon className="h-5 w-5 mr-2" />
              Create Program
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>ID</TableHeader>
                <TableHeader>Program Name</TableHeader>
                <TableHeader>Type/Duration</TableHeader>
                <TableHeader>Details</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow><TableCell colSpan={6} className="text-center py-8 text-zinc-400">Loading...</TableCell></TableRow>
              ) : errorMessage ? (
                <TableRow><TableCell colSpan={6} className="text-center text-red-500 py-8">{errorMessage}</TableCell></TableRow>
              ) : programs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12">
                    <div className="text-gray-400 mb-4">
                      <FireIcon className="w-12 h-12 mx-auto" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No programs yet</h3>
                    <p className="text-gray-600 mb-4">
                      Create your first workout program to start helping your clients achieve their goals.
                    </p>
                    <Button onClick={handleCreateProgram}>
                      <PlusIcon className="w-5 h-5 mr-2" />
                      Create Program
                    </Button>
                  </TableCell>
                </TableRow>
              ) : programs.map((program) => (
                <TableRow key={program.id} className={program.isImported ? 'bg-blue-50' : program.isDefault ? 'bg-green-50' : ''}>
                  <TableCell className="font-mono text-xs text-zinc-500">{program.id}</TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium flex items-center">
                        {program.name}
                        {program.isImported && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Imported
                          </span>
                        )}
                        {program.isDefault && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            Default
                          </span>
                        )}
                      </div>
                      {program.isImported && program.programDuration && (
                        <div className="text-sm text-gray-500">
                          Duration: {program.programDuration} {program.durationUnit}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {program.isImported 
                          ? (program.programDuration ? `${program.programDuration} ${program.durationUnit}` : 'PDF Program')
                          : `${getTotalWeeks(program)} weeks`
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {program.isImported 
                          ? 'Imported PDF'
                          : `${getTotalExercises(program)} exercises`
                        }
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end space-x-2">
                      <Button outline onClick={() => handleExportPDF(program)} className="px-3 py-1 text-blue-600 hover:text-blue-700">
                        <DocumentArrowUpIcon className="h-4 w-4 mr-1" />Export PDF
                      </Button>
                      {program.isImported && program.importedPdfUrl && (
                        <Button outline onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000'}${program.importedPdfUrl}`, '_blank')} className="px-3 py-1">
                          <DocumentArrowUpIcon className="h-4 w-4 mr-1" />View PDF
                        </Button>
                      )}
                      {!program.isImported && (
                        <Button outline onClick={() => router.push(`/workout-programs/${program.id}/edit`)} className="px-3 py-1">
                          <PencilIcon className="h-4 w-4 mr-1" />Edit
                        </Button>
                      )}
                      <Button outline onClick={() => handleDelete(program.id, program.name)} className="px-3 py-1 text-red-600 hover:text-red-700">
                        <TrashIcon className="h-4 w-4 mr-1" />Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          {programs.length > 0 && (
            <div className="flex justify-end mt-4 gap-2 p-4 border-t border-gray-200">
              <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="px-2 py-1 text-sm">Page {page}</span>
              <Button outline disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </div>

        {/* Import Program Modal */}
        <Dialog open={showImportModal} onClose={() => setShowImportModal(false)}>
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">Import Program</h2>
              <button
                onClick={() => setShowImportModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleImportSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  required
                />
                {selectedFile && (
                  <p className="mt-1 text-sm text-gray-600">Selected: {selectedFile.name}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Program Name
                </label>
                <Input
                  type="text"
                  value={importData.programName}
                  onChange={(e) => setImportData(prev => ({ ...prev, programName: e.target.value }))}
                  placeholder="Enter program name"
                  required
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration
                  </label>
                  <Input
                    type="number"
                    value={importData.programDuration}
                    onChange={(e) => setImportData(prev => ({ ...prev, programDuration: e.target.value }))}
                    placeholder="Enter duration"
                    min="1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Duration Unit
                  </label>
                  <Select
                    value={importData.durationUnit}
                    onChange={(e) => setImportData(prev => ({ ...prev, durationUnit: e.target.value }))}
                  >
                    <option value="days">Days</option>
                    <option value="weeks">Weeks</option>
                    <option value="months">Months</option>
                  </Select>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 mt-6">
                <Button
                  type="button"
                  outline
                  onClick={() => setShowImportModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={!selectedFile || importLoading}
                >
                  {importLoading ? 'Importing...' : 'Import Program'}
                </Button>
              </div>
            </form>
          </div>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        {confirmDelete && (
          <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
            <div className="p-6 z-[9999]">
              <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
              <p>Are you sure you want to delete <span className="font-bold">{confirmDelete.name}</span>?</p>
              <div className="flex justify-end gap-2 mt-6">
                <Button outline type="button" onClick={() => setConfirmDelete(null)}>Cancel</Button>
                <Button color="red" type="button" onClick={confirmDeleteProgram}>Delete</Button>
              </div>
            </div>
          </Dialog>
        )}

        {/* Success Toast */}
        {showDeletedToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Program deleted successfully!
            </div>
          </div>
        )}

        {/* Error Toast */}
        {showErrorToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              {errorMessage}
            </div>
          </div>
        )}

        {showCreatedToast && (
          <div className="fixed bottom-6 right-6 z-50">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
              <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              Program created successfully!
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 