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

interface NutritionProgram {
  id: number;
  name: string;
  description?: string;
  template?: string;
  branding?: any;
  pdfUrl?: string;
  isImported?: boolean;
  importedPdfUrl?: string;
  programDuration?: number;
  durationUnit?: string;
  createdAt: string;
  updatedAt: string;
}

export default function NutritionProgramsPage() {
  const [nutritionPrograms, setNutritionPrograms] = useState<NutritionProgram[]>([]);
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
      fetchNutritionPrograms(storedUser.id);
    }
  }, []);

  const fetchNutritionPrograms = async (trainerId: number) => {
    try {
      setLoading(true);
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nutrition-programs?trainerId=${trainerId}`);
      if (response.ok) {
        const data = await response.json();
        setNutritionPrograms(data);
        setTotal(data.length);
      } else {
        console.error('Failed to fetch nutrition programs');
      }
    } catch (error) {
      console.error('Error fetching nutrition programs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (programId: number, programName: string) => {
    setConfirmDelete({ id: programId, name: programName });
  };

  const confirmDeleteProgram = async () => {
    if (!confirmDelete || !user) return;

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nutrition-programs/${confirmDelete.id}?trainerId=${user.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        setNutritionPrograms(prev => prev.filter(program => program.id !== confirmDelete.id));
        setShowDeletedToast(true);
        setTimeout(() => setShowDeletedToast(false), 3000);
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to delete nutrition program');
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (error) {
      console.error('Error deleting nutrition program:', error);
      setErrorMessage('Failed to delete nutrition program');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setConfirmDelete(null);
    }
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
      alert('Please select a valid PDF file');
    }
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile || !user) return;

    try {
      setImportLoading(true);
      const formData = new FormData();
      formData.append('pdf', selectedFile);
      formData.append('trainerId', user.id.toString());
      formData.append('programName', importData.programName);
      formData.append('programDuration', importData.programDuration);
      formData.append('durationUnit', importData.durationUnit);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/nutrition-programs/import`, {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const newProgram = await response.json();
        setNutritionPrograms(prev => [newProgram, ...prev]);
        setShowCreatedToast(true);
        setTimeout(() => setShowCreatedToast(false), 3000);
        setShowImportModal(false);
        setSelectedFile(null);
        setImportData({
          programName: '',
          programDuration: '',
          durationUnit: 'weeks'
        });
      } else {
        const errorData = await response.json();
        setErrorMessage(errorData.error || 'Failed to import nutrition program');
        setShowErrorToast(true);
        setTimeout(() => setShowErrorToast(false), 3000);
      }
    } catch (error) {
      console.error('Error importing nutrition program:', error);
      setErrorMessage('Failed to import nutrition program');
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 3000);
    } finally {
      setImportLoading(false);
    }
  };

  const filteredPrograms = nutritionPrograms.filter(program =>
    program.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nutrition Programs</h1>
          <p className="text-gray-600 mt-1">Create and manage your custom nutrition programs for clients</p>
        </div>
      </div>

      {/* Search and Import Section */}
      <div className="flex justify-between items-center mb-6">
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
        <div className="flex gap-3">
          <Button
            onClick={handleImportProgram}
            outline
            className="flex items-center gap-2"
          >
            <DocumentArrowUpIcon className="h-4 w-4" />
            Import Program
          </Button>
        </div>
      </div>

      {/* Programs Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="text-zinc-500 dark:text-zinc-400">
              <tr>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium dark:border-b-white/10">ID</th>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium dark:border-b-white/10">Program Name</th>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium dark:border-b-white/10">Type/Duration</th>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium dark:border-b-white/10">Details</th>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium dark:border-b-white/10">Created</th>
                <th className="border-b border-b-zinc-950/10 px-4 py-2 font-medium text-right dark:border-b-white/10">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPrograms.map((program) => (
                <tr 
                  key={program.id}
                  className={program.isImported ? 'bg-blue-50' : ''}
                >
                  <td className="px-4 py-2 font-mono text-xs text-zinc-500">{program.id}</td>
                  <td className="px-4 py-2">
                    <div>
                      <div className="font-medium flex items-center">
                        {program.name}
                        {program.isImported && (
                          <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            Imported
                          </span>
                        )}
                      </div>
                      {program.isImported && program.programDuration && (
                        <div className="text-sm text-gray-500">
                          Duration: {program.programDuration} {program.durationUnit}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <CalendarIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {program.isImported 
                          ? (program.programDuration ? `${program.programDuration} ${program.durationUnit}` : 'PDF Program')
                          : 'Nutrition Program'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2">
                    <div className="flex items-center">
                      <ClockIcon className="w-4 h-4 mr-1 text-gray-400" />
                      <span className="text-sm">
                        {program.isImported 
                          ? 'Imported PDF'
                          : 'Nutrition Program'
                        }
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-500">
                    {new Date(program.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-right">
                    <div className="flex items-center justify-end space-x-2">
                      {program.isImported && program.importedPdfUrl && (
                        <Button outline onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL}${program.importedPdfUrl}`, '_blank')} className="px-3 py-1">
                          <DocumentArrowUpIcon className="h-4 w-4 mr-1" />View PDF
                        </Button>
                      )}
                      <Button outline onClick={() => handleDelete(program.id, program.name)} className="px-3 py-1 text-red-600 hover:text-red-700">
                        <TrashIcon className="h-4 w-4 mr-1" />Delete
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {nutritionPrograms.length > 0 && (
          <div className="flex justify-end mt-4 gap-2 p-4 border-t border-gray-200">
            <Button outline disabled={page === 1} onClick={() => setPage(page - 1)}>Previous</Button>
            <span className="px-2 py-1 text-sm">Page {page}</span>
            <Button outline disabled={page * pageSize >= total} onClick={() => setPage(page + 1)}>Next</Button>
          </div>
        )}
      </div>

      {/* Import Modal */}
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
              <input
                type="text"
                value={importData.programName}
                onChange={(e) => setImportData(prev => ({ ...prev, programName: e.target.value }))}
                placeholder="Enter program name"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration
                </label>
                <input
                  type="number"
                  value={importData.programDuration}
                  onChange={(e) => setImportData(prev => ({ ...prev, programDuration: e.target.value }))}
                  placeholder="Enter duration"
                  min="1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duration Unit
                </label>
                <select
                  value={importData.durationUnit}
                  onChange={(e) => setImportData(prev => ({ ...prev, durationUnit: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                </select>
              </div>
            </div>
            
            <div className="flex justify-end gap-3 mt-6">
              <Button
                type="button"
                plain
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

      {/* Delete Confirmation Modal */}
      <Dialog open={!!confirmDelete} onClose={() => setConfirmDelete(null)}>
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Delete Nutrition Program</h2>
            <button
              onClick={() => setConfirmDelete(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">
            Are you sure you want to delete "{confirmDelete?.name}"? This action cannot be undone.
          </p>
          
          <div className="flex justify-end gap-3">
            <Button
              outline
              onClick={() => setConfirmDelete(null)}
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDeleteProgram}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Toast Notifications */}
      {showCreatedToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Nutrition program imported successfully!
        </div>
      )}
      {showDeletedToast && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg">
          Nutrition program deleted successfully!
        </div>
      )}
      {showErrorToast && (
        <div className="fixed bottom-4 right-4 bg-red-500 text-white px-6 py-3 rounded-lg shadow-lg">
          {errorMessage}
        </div>
      )}
    </div>
  );
} 