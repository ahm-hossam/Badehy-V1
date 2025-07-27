'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Dialog } from '@/components/dialog';
import { Button } from '@/components/button';
import { Heading } from '@/components/heading';
import { Text } from '@/components/text';
import { getStoredUser } from '@/lib/auth';
import { 
  DocumentArrowUpIcon, 
  DocumentArrowDownIcon, 
  PlusIcon, 
  TrashIcon, 
  EyeIcon,
  InformationCircleIcon,
  DocumentTextIcon,
  Squares2X2Icon
} from '@heroicons/react/24/outline';

interface PDFTemplatePage {
  id: string;
  pageName: string;
  pageOrder: number;
  fileUrl: string;
  createdAt: string;
}

interface PDFTemplate {
  id: string;
  name: string;
  description?: string;
  category: string;
  fileUrl?: string;
  uploadType: 'complete' | 'page-by-page';
  createdAt: string;
  pages?: PDFTemplatePage[];
}

export default function BrandingPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<PDFTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showAddPageDialog, setShowAddPageDialog] = useState(false);
  const [templateToDelete, setTemplateToDelete] = useState<PDFTemplate | null>(null);
  const [templateToAddPage, setTemplateToAddPage] = useState<PDFTemplate | null>(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // Template creation states
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [uploadType, setUploadType] = useState<'complete' | 'page-by-page'>('complete');
  const [templateFile, setTemplateFile] = useState<File | null>(null);
  
  // Page-by-page states
  const [pageName, setPageName] = useState('');
  const [pageFile, setPageFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchTemplates();
  }, []);

  // Reset form fields when upload type changes
  useEffect(() => {
    setTemplateFile(null);
    setPageName('');
    setPageFile(null);
  }, [uploadType]);

  const fetchTemplates = async () => {
    try {
      const user = getStoredUser();
      if (!user || !user.id) {
        console.error('No user ID found for templates');
        return;
      }

      const response = await fetch(`/api/templates?trainerId=${user.id}`);
      if (response.ok) {
        const data = await response.json();
        setTemplates(data);
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!templateName.trim()) {
      alert('Please enter a template name');
      return;
    }

    if (uploadType === 'complete' && !templateFile) {
      alert('Please select a PDF file for complete template');
      return;
    }

    if (uploadType === 'page-by-page' && (!pageName.trim() || !pageFile)) {
      alert('Please enter a page name and select a PDF file');
      return;
    }

    const user = getStoredUser();
    if (!user || !user.id) {
      alert('No user ID found. Please log in again.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('trainerId', user.id.toString());
      formData.append('name', templateName);
      formData.append('description', templateDescription);
      formData.append('uploadType', uploadType);

      if (uploadType === 'complete') {
        formData.append('file', templateFile!);
      } else {
        formData.append('file', pageFile!);
        formData.append('pageName', pageName);
        formData.append('pageOrder', '1');
      }

      const response = await fetch('/api/templates', {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSuccessMessage(uploadType === 'complete' ? 'Template created successfully!' : 'First page added successfully!');
        setShowSuccessToast(true);
        resetForm();
        fetchTemplates();
        
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Error creating template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    } finally {
      setUploading(false);
    }
  };

  const handleAddPage = async () => {
    if (!templateToAddPage) return;
    
    if (!pageName.trim() || !pageFile) {
      alert('Please enter a page name and select a PDF file');
      return;
    }

    const user = getStoredUser();
    if (!user || !user.id) {
      alert('No user ID found. Please log in again.');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('pageName', pageName);
      formData.append('pageOrder', (templateToAddPage.pages?.length || 0 + 1).toString());
      formData.append('file', pageFile);

      const response = await fetch(`/api/templates/${templateToAddPage.id}/pages`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        setSuccessMessage('Page added successfully!');
        setShowSuccessToast(true);
        setPageName('');
        setPageFile(null);
        setShowAddPageDialog(false);
        setTemplateToAddPage(null);
        fetchTemplates();
        
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Error adding page: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error adding page:', error);
      alert('Error adding page');
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteTemplate = async () => {
    if (!templateToDelete) return;

    const user = getStoredUser();
    if (!user || !user.id) {
      alert('No user ID found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateToDelete.id}?trainerId=${user.id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Template deleted successfully!');
        setShowSuccessToast(true);
        fetchTemplates();
        
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Error deleting template: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Error deleting template');
    } finally {
      setShowDeleteDialog(false);
      setTemplateToDelete(null);
    }
  };

  const handleDeletePage = async (templateId: string, pageId: string) => {
    const user = getStoredUser();
    if (!user || !user.id) {
      alert('No user ID found. Please log in again.');
      return;
    }

    try {
      const response = await fetch(`/api/templates/${templateId}/pages/${pageId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        setSuccessMessage('Page deleted successfully!');
        setShowSuccessToast(true);
        fetchTemplates();
        
        setTimeout(() => {
          setShowSuccessToast(false);
        }, 3000);
      } else {
        const errorData = await response.json();
        alert(`Error deleting page: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Error deleting page');
    }
  };

  const resetForm = () => {
    setTemplateName('');
    setTemplateDescription('');
    setUploadType('complete');
    setTemplateFile(null);
    setPageName('');
    setPageFile(null);
    setShowCreateDialog(false);
  };

  const openDeleteDialog = (template: PDFTemplate) => {
    setTemplateToDelete(template);
    setShowDeleteDialog(true);
  };

  const openAddPageDialog = (template: PDFTemplate) => {
    setTemplateToAddPage(template);
    setPageName('');
    setPageFile(null);
    setShowAddPageDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <Heading level={1} className="text-3xl font-bold text-gray-900">
              PDF Design Templates
            </Heading>
            <Text className="mt-2 text-gray-600">
              Create and manage your PDF templates for workout programs, nutrition plans, and more
            </Text>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Template
          </Button>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  {template.uploadType === 'complete' ? (
                    <DocumentTextIcon className="h-8 w-8 text-blue-500" />
                  ) : (
                    <Squares2X2Icon className="h-8 w-8 text-green-500" />
                  )}
                  <div>
                    <Heading level={3} className="text-lg font-semibold text-gray-900">
                      {template.name || 'Untitled Template'}
                    </Heading>
                    <Text className="text-sm text-gray-500">
                      {template.uploadType === 'complete' ? 'Complete Template' : 'Page-by-Page'}
                    </Text>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {template.uploadType === 'complete' && template.fileUrl && (
                    <Button
                      outline
                      onClick={() => window.open(`http://localhost:4000${template.fileUrl}`, '_blank')}
                    >
                      <EyeIcon className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    outline
                    onClick={() => openDeleteDialog(template)}
                    className="text-gray-500 hover:text-red-600 hover:border-red-300"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {template.description && template.description.trim() && (
                <Text className="text-sm text-gray-600 mb-4">
                  {template.description}
                </Text>
              )}

              {template.uploadType === 'page-by-page' && template.pages && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Text className="text-sm font-medium text-gray-700">
                      Pages ({template.pages.length})
                    </Text>
                    <Button
                      outline
                      onClick={() => openAddPageDialog(template)}
                    >
                      <PlusIcon className="h-4 w-4 mr-1" />
                      Add Page
                    </Button>
                  </div>
                  
                  <div className="space-y-2">
                    {template.pages.map((page) => (
                      <div key={page.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <div className="flex items-center space-x-2">
                          <DocumentTextIcon className="h-4 w-4 text-gray-400" />
                          <Text className="text-sm text-gray-700">{page.pageName || 'Unnamed Page'}</Text>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Button
                            outline
                            onClick={() => window.open(`http://localhost:4000${page.fileUrl}`, '_blank')}
                          >
                            <EyeIcon className="h-3 w-3" />
                          </Button>
                          <Button
                            outline
                            onClick={() => handleDeletePage(template.id, page.id)}
                            className="text-gray-500 hover:text-red-600 hover:border-red-300"
                          >
                            <TrashIcon className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-4 pt-4 border-t border-gray-200">
                <Text className="text-xs text-gray-500">
                  Created {template.createdAt ? new Date(template.createdAt).toLocaleDateString() : 'Unknown date'}
                </Text>
              </div>
            </div>
          ))}
        </div>

        {templates.length === 0 && (
          <div className="text-center py-16">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-50 mb-6">
              <DocumentArrowUpIcon className="h-10 w-10 text-blue-600" />
            </div>
            <Heading level={3} className="text-xl font-semibold text-gray-900 mb-3">
              No templates yet
            </Heading>
            <Text className="text-gray-600 mb-8 max-w-md mx-auto">
              Create your first PDF template to get started with custom branding for your workout programs and nutrition plans
            </Text>
            <Button onClick={() => setShowCreateDialog(true)} className="px-6 py-3">
              <PlusIcon className="w-5 h-5 mr-2" />
              Create Template
            </Button>
          </div>
        )}
      </div>

      {/* Create Template Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <div className="p-6 max-w-md mx-auto">
          <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
            Create New Template
          </Heading>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Template Name
              </label>
                              <input
                  type="text"
                  value={templateName || ''}
                  onChange={(e) => setTemplateName(e.target.value)}
                  placeholder="e.g., Workout Program Template"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description (Optional)
              </label>
              <textarea
                value={templateDescription || ''}
                onChange={(e) => setTemplateDescription(e.target.value)}
                placeholder="Describe your template..."
                rows={3}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Upload Type
              </label>
              <div className="space-y-2">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="complete"
                    checked={uploadType === 'complete'}
                    onChange={(e) => {
                      setUploadType(e.target.value as 'complete' | 'page-by-page');
                      setTemplateFile(null);
                      setPageName('');
                      setPageFile(null);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Complete Template (Single PDF)</span>
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="page-by-page"
                    checked={uploadType === 'page-by-page'}
                    onChange={(e) => {
                      setUploadType(e.target.value as 'complete' | 'page-by-page');
                      setTemplateFile(null);
                      setPageName('');
                      setPageFile(null);
                    }}
                    className="mr-2"
                  />
                  <span className="text-sm text-gray-700">Page-by-Page (Multiple PDFs)</span>
                </label>
              </div>
            </div>

            {uploadType === 'complete' ? (
              <div key="complete-upload">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Complete PDF Template
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setTemplateFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Text className="text-xs text-gray-600 mt-1">
                  Upload your complete PDF design with all pages
                </Text>
              </div>
            ) : (
              <div key="page-by-page-upload">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  First Page Name
                </label>
                <input
                  type="text"
                  value={pageName || ''}
                  onChange={(e) => setPageName(e.target.value)}
                  placeholder="e.g., Intro, Program, Nutrition"
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <label className="block text-sm font-medium text-gray-700 mb-2 mt-3">
                  First Page PDF
                </label>
                <input
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setPageFile(e.target.files?.[0] || null)}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <Text className="text-xs text-gray-600 mt-1">
                  Upload the first page. You can add more pages after creation.
                </Text>
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <Button outline onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleCreateTemplate}
                disabled={uploading || !templateName.trim() || 
                  (uploadType === 'complete' && !templateFile) ||
                  (uploadType === 'page-by-page' && (!pageName.trim() || !pageFile))}
              >
                {uploading ? 'Creating...' : 'Create Template'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Delete Template Dialog */}
      <Dialog open={showDeleteDialog} onClose={() => setShowDeleteDialog(false)}>
        <div className="p-6">
          <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
            Delete Template
          </Heading>
          <Text className="text-gray-600 mb-6">
            Are you sure you want to delete "{templateToDelete?.name || 'Untitled Template'}"? This action cannot be undone.
          </Text>
          <div className="flex justify-end space-x-3">
            <Button outline onClick={() => setShowDeleteDialog(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteTemplate}>
              Delete Template
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog open={showAddPageDialog} onClose={() => setShowAddPageDialog(false)}>
        <div className="p-6 max-w-md mx-auto">
          <Heading level={3} className="text-lg font-semibold text-gray-900 mb-4">
            Add Page to "{templateToAddPage?.name || 'Template'}"
          </Heading>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page Name
              </label>
              <input
                type="text"
                value={pageName || ''}
                onChange={(e) => setPageName(e.target.value)}
                placeholder="e.g., Program, Nutrition, Outro"
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Page PDF
              </label>
              <input
                type="file"
                accept=".pdf"
                onChange={(e) => setPageFile(e.target.files?.[0] || null)}
                className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
              <Text className="text-xs text-gray-600 mt-1">
                Upload the PDF for this page
              </Text>
            </div>

            <div className="flex justify-end space-x-3 pt-4">
              <Button outline onClick={() => setShowAddPageDialog(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAddPage}
                disabled={uploading || !pageName.trim() || !pageFile}
              >
                {uploading ? 'Adding...' : 'Add Page'}
              </Button>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Success Toast */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2">
            <div className="w-2 h-2 bg-white rounded-full"></div>
            <span>{successMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
} 