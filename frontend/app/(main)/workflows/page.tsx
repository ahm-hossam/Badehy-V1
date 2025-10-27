'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '../../../lib/auth';
import { Button } from '../../../components/button';
import { Heading } from '../../../components/heading';
import { Text } from '../../../components/text';
import { Table, TableHead, TableBody, TableRow, TableHeader, TableCell } from '../../../components/table';
import { Badge } from '../../../components/badge';
import { Input } from '../../../components/input';
import { Textarea } from '../../../components/textarea';
import { Select } from '../../../components/select';
import { 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  PlayIcon,
  PauseIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  XMarkIcon,
  ChevronDownIcon,
  ChevronUpIcon
} from '@heroicons/react/24/outline';
import { Switch } from '../../../components/switch';
import { ConfirmDialog } from '../../../components/confirm-dialog';

interface Workflow {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  package: {
    id: number;
    name: string;
  };
  steps: WorkflowStep[];
  _count: {
    executions: number;
  };
}

interface WorkflowStep {
  id: number;
  stepType: string;
  stepOrder: number;
  config: string;
}

interface WorkflowExecution {
  id: number;
  status: string;
  startedAt: string;
  completedAt?: string;
  workflow: {
    id: number;
    name: string;
    package: {
      id: number;
      name: string;
    };
  };
  client: {
    id: number;
    fullName: string;
    email: string;
  };
  currentStep?: {
    id: number;
    stepType: string;
    stepOrder: number;
  };
}

interface Package {
  id: number;
  name: string;
}

interface CheckInForm {
  id: number;
  name: string;
}

// Step Configuration Component with Repeat functionality
function StepConfiguration({ step, onUpdate, checkInForms, packages, clients }: { step?: any, onUpdate: (config: any) => void, checkInForms: CheckInForm[], packages?: Package[], clients?: any[] }) {
  const [config, setConfig] = useState(step?.config || {});

  // Update config when step changes
  useEffect(() => {
    setConfig(step?.config || {});
  }, [step?.id]);

  if (!step) return null;

  const handleConfigChange = (key: string, value: any) => {
    const newConfig = { ...config, [key]: value };
    setConfig(newConfig);
    onUpdate(newConfig);
  };

  // Common Repeat Field Component
  const renderRepeatField = () => (
    <div>
      <Text className="text-sm font-medium text-gray-700 mb-2">Repeat</Text>
      <Select
        value={config.repeat || 'once'}
        onChange={(e) => handleConfigChange('repeat', e.target.value)}
      >
        <option value="once">Once</option>
        <option value="until_subscription_ends">Until subscription ends</option>
        <option value="custom">Custom</option>
      </Select>
      {config.repeat === 'custom' && (
        <div className="mt-2">
          <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
          <Input
            type="number"
            value={config.repeatCount || ''}
            onChange={(e) => handleConfigChange('repeatCount', Number(e.target.value))}
            placeholder="Enter number"
            min="1"
          />
        </div>
      )}
    </div>
  );

  if (step.type === 'form') {
    return (
      <div className="space-y-4">
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Select Form</Text>
          <Select
            value={config.formId || ''}
            onChange={(e) => handleConfigChange('formId', e.target.value ? Number(e.target.value) : null)}
          >
            <option value="">Select a form</option>
            {checkInForms.map((form) => (
              <option key={form.id} value={form.id}>
                {form.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Message to Client</Text>
          <Textarea
            value={config.message || ''}
            onChange={(e) => handleConfigChange('message', e.target.value)}
            placeholder="Please complete this form..."
            rows={3}
          />
        </div>
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Send Timing</Text>
          <Select
            value={config.sendTiming || 'immediate'}
            onChange={(e) => handleConfigChange('sendTiming', e.target.value)}
          >
            <option value="immediate">Immediate (after previous step)</option>
            <option value="delay_days">After X days</option>
            <option value="after_form_submission">After form submission</option>
            <option value="before_subscription_end">Before subscription ends</option>
            <option value="specific_day">On specific day of week</option>
            <option value="specific_time">At specific time</option>
          </Select>
        </div>
        {(config.sendTiming === 'delay_days' || config.sendTiming === 'after_form_submission' || config.sendTiming === 'before_subscription_end' || config.sendTiming === 'specific_day' || config.sendTiming === 'specific_time') && (
          <div>
            {config.sendTiming === 'delay_days' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Days to wait</Text>
                <Input
                  type="number"
                  value={config.delayDays || ''}
                  onChange={(e) => handleConfigChange('delayDays', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3"
                />
              </>
            )}
            {config.sendTiming === 'after_form_submission' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Wait for form</Text>
                <Select
                  value={config.triggerFormId || ''}
                  onChange={(e) => handleConfigChange('triggerFormId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select a form</option>
                  {checkInForms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </Select>
                <div className="mt-3">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Days to wait after submission</Text>
                  <Input
                    type="number"
                    value={config.submissionDelayDays || ''}
                    onChange={(e) => handleConfigChange('submissionDelayDays', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 3"
                  />
                </div>
              </>
            )}
            {config.sendTiming === 'before_subscription_end' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Days before subscription ends</Text>
                <Input
                  type="number"
                  value={config.daysBeforeEnd || ''}
                  onChange={(e) => handleConfigChange('daysBeforeEnd', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 7"
                />
              </>
            )}
            {config.sendTiming === 'specific_day' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Day of week</Text>
                <Select
                  value={config.dayOfWeek || 'monday'}
                  onChange={(e) => handleConfigChange('dayOfWeek', e.target.value)}
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </Select>
              </>
            )}
            {config.sendTiming === 'specific_time' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Time</Text>
                <Input
                  type="time"
                  value={config.specificTime || '09:00'}
                  onChange={(e) => handleConfigChange('specificTime', e.target.value)}
                />
              </>
            )}
          </div>
        )}
        {/* Repeat options for specific day/time and after form submission */}
        {(config.sendTiming === 'specific_day' || config.sendTiming === 'specific_time' || config.sendTiming === 'after_form_submission') && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Repeat</Text>
            <Select
              value={config.repeat || 'until_subscription_ends'}
              onChange={(e) => handleConfigChange('repeat', e.target.value)}
            >
              <option value="until_subscription_ends">Until subscription ends</option>
              <option value="custom">Custom number of times</option>
            </Select>
          </div>
        )}
        {config.sendTiming === 'specific_day' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 10 (will send 10 Mondays in a row)"
            />
          </div>
        )}
        {config.sendTiming === 'specific_time' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 10 (will send 10 times at this time)"
            />
          </div>
        )}
        {config.sendTiming === 'after_form_submission' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 5 (will send 5 times after each form submission)"
            />
          </div>
        )}
      </div>
    );
  }

  if (step.type === 'wait') {
    return (
      <div className="space-y-4">
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Wait Duration (days)</Text>
          <Input
            type="number"
            value={config.days || ''}
            onChange={(e) => handleConfigChange('days', Number(e.target.value))}
            placeholder="30"
          />
        </div>
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Message</Text>
          <Textarea
            value={config.message || ''}
            onChange={(e) => handleConfigChange('message', e.target.value)}
            placeholder="Waiting period message..."
            rows={2}
          />
        </div>
        {renderRepeatField()}
      </div>
    );
  }

  if (step.type === 'notification') {
    return (
      <div className="space-y-4">
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Title</Text>
          <Input
            value={config.title || ''}
            onChange={(e) => handleConfigChange('title', e.target.value)}
            placeholder="Notification title"
          />
        </div>
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Message</Text>
          <Textarea
            value={config.message || ''}
            onChange={(e) => handleConfigChange('message', e.target.value)}
            placeholder="Notification message"
            rows={4}
          />
        </div>
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Send Timing</Text>
          <Select
            value={config.sendTiming || 'immediate'}
            onChange={(e) => handleConfigChange('sendTiming', e.target.value)}
          >
            <option value="immediate">Immediate (after previous step)</option>
            <option value="delay_days">After X days</option>
            <option value="after_form_submission">After form submission</option>
            <option value="before_subscription_end">Before subscription ends</option>
            <option value="specific_day">On specific day of week</option>
            <option value="specific_time">At specific time</option>
          </Select>
        </div>
        {(config.sendTiming === 'delay_days' || config.sendTiming === 'after_form_submission' || config.sendTiming === 'before_subscription_end' || config.sendTiming === 'specific_day' || config.sendTiming === 'specific_time') && (
          <div>
            {config.sendTiming === 'delay_days' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Days to wait</Text>
                <Input
                  type="number"
                  value={config.delayDays || ''}
                  onChange={(e) => handleConfigChange('delayDays', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 3"
                />
              </>
            )}
            {config.sendTiming === 'after_form_submission' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Wait for form</Text>
                <Select
                  value={config.triggerFormId || ''}
                  onChange={(e) => handleConfigChange('triggerFormId', e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">Select a form</option>
                  {checkInForms.map((form) => (
                    <option key={form.id} value={form.id}>
                      {form.name}
                    </option>
                  ))}
                </Select>
                <div className="mt-3">
                  <Text className="text-sm font-medium text-gray-700 mb-2">Days to wait after submission</Text>
                  <Input
                    type="number"
                    value={config.submissionDelayDays || ''}
                    onChange={(e) => handleConfigChange('submissionDelayDays', parseInt(e.target.value) || 0)}
                    placeholder="e.g., 3"
                  />
                </div>
              </>
            )}
            {config.sendTiming === 'before_subscription_end' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Days before subscription ends</Text>
                <Input
                  type="number"
                  value={config.daysBeforeEnd || ''}
                  onChange={(e) => handleConfigChange('daysBeforeEnd', parseInt(e.target.value) || 0)}
                  placeholder="e.g., 7"
                />
              </>
            )}
            {config.sendTiming === 'specific_day' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Day of week</Text>
                <Select
                  value={config.dayOfWeek || 'monday'}
                  onChange={(e) => handleConfigChange('dayOfWeek', e.target.value)}
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                  <option value="saturday">Saturday</option>
                  <option value="sunday">Sunday</option>
                </Select>
              </>
            )}
            {config.sendTiming === 'specific_time' && (
              <>
                <Text className="text-sm font-medium text-gray-700 mb-2">Time</Text>
                <Input
                  type="time"
                  value={config.specificTime || '09:00'}
                  onChange={(e) => handleConfigChange('specificTime', e.target.value)}
                />
              </>
            )}
          </div>
        )}
        {/* Repeat options for specific day/time and after form submission */}
        {(config.sendTiming === 'specific_day' || config.sendTiming === 'specific_time' || config.sendTiming === 'after_form_submission') && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Repeat</Text>
            <Select
              value={config.repeat || 'until_subscription_ends'}
              onChange={(e) => handleConfigChange('repeat', e.target.value)}
            >
              <option value="until_subscription_ends">Until subscription ends</option>
              <option value="custom">Custom number of times</option>
            </Select>
          </div>
        )}
        {config.sendTiming === 'specific_day' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 10 (will send 10 Mondays in a row)"
            />
          </div>
        )}
        {config.sendTiming === 'specific_time' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 10 (will send 10 times at this time)"
            />
          </div>
        )}
        {config.sendTiming === 'after_form_submission' && config.repeat === 'custom' && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Number of times</Text>
            <Input
              type="number"
              value={config.repeatCount || ''}
              onChange={(e) => handleConfigChange('repeatCount', parseInt(e.target.value) || 0)}
              placeholder="e.g., 5 (will send 5 times after each form submission)"
            />
          </div>
        )}
      </div>
    );
  }


  if (step.type === 'audience') {
    const selectedPackageIds = config.selectedPackageIds || [];
    const selectedClientIds = config.selectedClientIds || [];

    return (
      <div className="space-y-4">
        <div>
          <Text className="text-sm font-medium text-gray-700 mb-2">Audience Type</Text>
          <Select
            value={config.audienceType || 'all'}
            onChange={(e) => handleConfigChange('audienceType', e.target.value)}
          >
            <option value="all">All Clients</option>
            <option value="packages">Selected Packages</option>
            <option value="clients">Selected Clients</option>
          </Select>
        </div>

        {config.audienceType === 'packages' && packages && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Select Packages</Text>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {packages.map((pkg) => (
                <label key={pkg.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedPackageIds.includes(pkg.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...selectedPackageIds, pkg.id]
                        : selectedPackageIds.filter(id => id !== pkg.id);
                      handleConfigChange('selectedPackageIds', newIds);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Text className="text-sm">{pkg.name}</Text>
                </label>
              ))}
            </div>
          </div>
        )}

        {config.audienceType === 'clients' && clients && (
          <div>
            <Text className="text-sm font-medium text-gray-700 mb-2">Select Clients</Text>
            <div className="space-y-2 max-h-40 overflow-y-auto border border-gray-200 rounded-lg p-2">
              {clients.map((client) => (
                <label key={client.id} className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedClientIds.includes(client.id)}
                    onChange={(e) => {
                      const newIds = e.target.checked
                        ? [...selectedClientIds, client.id]
                        : selectedClientIds.filter(id => id !== client.id);
                      handleConfigChange('selectedClientIds', newIds);
                    }}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Text className="text-sm">{client.fullName} ({client.email})</Text>
                </label>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div>
      <Text>No configuration available for this step type</Text>
    </div>
  );
}

export default function WorkflowsPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [executions, setExecutions] = useState<WorkflowExecution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'workflows' | 'executions'>('workflows');
  
  // Create workflow modal state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [checkInForms, setCheckInForms] = useState<CheckInForm[]>([]);
  const [createLoading, setCreateLoading] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  
  // Form state
  const [workflowName, setWorkflowName] = useState('');
  const [workflowDescription, setWorkflowDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [followUpDays, setFollowUpDays] = useState<number>(30);
  const [selectedFormId, setSelectedFormId] = useState<number | null>(null);
  
  // Clients state for audience selection
  const [clients, setClients] = useState<any[]>([]);
  
  // Workflow steps state
  const [workflowSteps, setWorkflowSteps] = useState<any[]>([]);
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(new Set());

  // Delete confirmation state
  const [deleteDialog, setDeleteDialog] = useState<{ open: boolean; workflow: { id: number; name: string } | null }>({
    open: false,
    workflow: null
  });

  // Execution cancel confirmation state
  const [cancelDialog, setCancelDialog] = useState<{ open: boolean; executionId: number | null }>({
    open: false,
    executionId: null
  });

  // Success/Error message dialogs
  const [messageDialog, setMessageDialog] = useState<{ open: boolean; type: 'success' | 'error'; title: string; message: string }>({
    open: false,
    type: 'success',
    title: '',
    message: ''
  });

  // Toast notifications
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const storedUser = getStoredUser();
    if (!storedUser) {
      router.push('/auth/register');
      return;
    }
    setUser(storedUser);
  }, [router]);

  const fetchWorkflows = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/workflows?trainerId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setWorkflows(data.workflows);
      } else {
        setError('Failed to fetch workflows');
      }
    } catch (error) {
      console.error('Error fetching workflows:', error);
      setError('Failed to fetch workflows');
    }
  };

  const fetchExecutions = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/workflows/executions/list?trainerId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setExecutions(data.executions);
      } else {
        setError('Failed to fetch executions');
      }
    } catch (error) {
      console.error('Error fetching executions:', error);
      setError('Failed to fetch executions');
    }
  };

  const fetchPackages = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/packages?trainerId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not wrapped in packages property
        setPackages(Array.isArray(data) ? data : data.packages || []);
        console.log('Fetched packages:', Array.isArray(data) ? data : data.packages || []);
      }
    } catch (error) {
      console.error('Error fetching packages:', error);
    }
  };

  const fetchCheckInForms = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/checkins?trainerId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        // API returns array directly, not wrapped in forms property
        setCheckInForms(Array.isArray(data) ? data : data.forms || []);
        console.log('Fetched check-in forms:', Array.isArray(data) ? data : data.forms || []);
      }
    } catch (error) {
      console.error('Error fetching check-in forms:', error);
    }
  };

  const fetchClients = async () => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/clients?trainerId=${user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        setClients(Array.isArray(data) ? data : data.clients || []);
      }
    } catch (error) {
      console.error('Error fetching clients:', error);
    }
  };

  const createWorkflow = async () => {
    if (!user || !workflowName) return;

    // Validate that at least one step is added
    if (workflowSteps.length === 0) {
      setCreateError('Please add at least one step to your workflow');
      return;
    }

    setCreateLoading(true);
    setCreateError(null);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      
      // Use the visual workflow steps
      const steps = workflowSteps.map((step) => ({
        stepType: step.type,
        config: step.config || {}
      }));

      const response = await fetch(`${apiUrl}/api/workflows`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          name: workflowName,
          description: workflowDescription,
          steps: steps,
          isActive: isActive
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Workflow created:', data.workflow);
        
        // Close modal and reset form
        setIsCreateModalOpen(false);
        setWorkflowName('');
        setWorkflowDescription('');
        setIsActive(true);
        setSelectedPackageId(null);
        setFollowUpDays(30);
        setSelectedFormId(null);
        setWorkflowSteps([]);
        setExpandedSteps(new Set());
        
        // Refresh workflows list
        fetchWorkflows();
      } else {
        const errorData = await response.json();
        setCreateError(errorData.error || 'Failed to create workflow');
      }
    } catch (error) {
      console.error('Error creating workflow:', error);
      setCreateError('Failed to create workflow');
    } finally {
      setCreateLoading(false);
    }
  };

  const openCreateModal = () => {
    setIsCreateModalOpen(true);
    setCreateError(null);
    // Fetch packages, forms, and clients when opening modal
    fetchPackages();
    fetchCheckInForms();
    fetchClients();
  };

  const closeCreateModal = () => {
    setIsCreateModalOpen(false);
    setCreateError(null);
    setWorkflowName('');
    setWorkflowDescription('');
    setIsActive(true);
    setSelectedPackageId(null);
    setFollowUpDays(30);
    setSelectedFormId(null);
    setWorkflowSteps([]);
    setExpandedSteps(new Set());
  };

  const handleStartWorkflow = async (workflowId: number) => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/workflows/${workflowId}/start-for-audience`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Workflow started:', data);
        
        // Refresh executions to see the new ones
        await fetchExecutions();
        
        showToast('success', `Workflow started for ${data.started || data.results?.length || 0} clients!`);
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to start workflow');
      }
    } catch (error) {
      console.error('Error starting workflow:', error);
      showToast('error', 'Failed to start workflow');
    }
  };

  const handleDeleteWorkflow = (workflowId: number, workflowName: string) => {
    setDeleteDialog({ open: true, workflow: { id: workflowId, name: workflowName } });
  };

  const confirmDeleteWorkflow = async () => {
    if (!user || !deleteDialog.workflow) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/workflows/${deleteDialog.workflow.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
        }),
      });

      if (response.ok) {
        // Refresh workflows list
        await fetchWorkflows();
        setDeleteDialog({ open: false, workflow: null });
        // Show toast notification
        showToast('success', 'Workflow deleted successfully');
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to delete workflow');
      }
    } catch (error) {
      console.error('Error deleting workflow:', error);
      showToast('error', 'Failed to delete workflow');
    }
  };

  const handleEditWorkflow = (workflow: Workflow) => {
    // Set form fields with existing workflow data
    setWorkflowName(workflow.name);
    setWorkflowDescription(workflow.description || '');
    setIsActive(workflow.isActive);
    
    // Convert workflow steps to editor format
    const formattedSteps = workflow.steps.map((step, index) => ({
      id: `step-${step.id}-${index}`,
      type: step.stepType,
      order: step.stepOrder,
      config: typeof step.config === 'string' ? JSON.parse(step.config) : step.config
    }));
    
    setWorkflowSteps(formattedSteps);
    setExpandedSteps(new Set());
    
    // Open the create modal (which will be used for editing)
    setIsCreateModalOpen(true);
    
    // TODO: Add separate edit mode or use the modal for editing
    console.log('Edit workflow:', workflow);
  };

  const handleExecutionStatusChange = async (executionId: number, newStatus: string) => {
    if (!user) return;

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
      const response = await fetch(`${apiUrl}/api/workflows/executions/${executionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId: user.id,
          status: newStatus,
        }),
      });

      if (response.ok) {
        // Refresh executions list
        await fetchExecutions();
        const statusText = newStatus === 'active' ? 'resumed' : newStatus === 'paused' ? 'paused' : newStatus;
        showToast('success', `Execution ${statusText} successfully`);
      } else {
        const errorData = await response.json();
        showToast('error', errorData.error || 'Failed to update execution status');
      }
    } catch (error) {
      console.error('Error updating execution status:', error);
      showToast('error', 'Failed to update execution status');
    }
  };

  const confirmCancelExecution = async () => {
    if (!cancelDialog.executionId) return;
    
    await handleExecutionStatusChange(cancelDialog.executionId, 'cancelled');
    setCancelDialog({ open: false, executionId: null });
  };

  // Helper function to show toast notifications
  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') {
      setSuccessMessage(message);
      setShowSuccessToast(true);
      setTimeout(() => setShowSuccessToast(false), 2000);
    } else {
      setErrorMessage(message);
      setShowErrorToast(true);
      setTimeout(() => setShowErrorToast(false), 2000);
    }
  };

  const addStep = (stepType: string) => {
    console.log('Adding step:', stepType, 'Current steps:', workflowSteps);
    
    // Set default config based on step type
    let defaultConfig = {};
    if (stepType === 'audience') {
      defaultConfig = { audienceType: 'all' };
    } else if (stepType === 'notification') {
      defaultConfig = { 
        sendTiming: 'immediate',
        message: '',
        title: ''
      };
    } else if (stepType === 'form') {
      defaultConfig = { 
        sendTiming: 'immediate',
        formId: null,
        message: ''
      };
    } else if (stepType === 'wait') {
      defaultConfig = { days: 1 };
    }
    
    const newStep = {
      id: `step-${Date.now()}`,
      type: stepType,
      order: workflowSteps.length + 1,
      config: defaultConfig
    };
    const updatedSteps = [...workflowSteps, newStep];
    console.log('Updated steps:', updatedSteps);
    setWorkflowSteps(updatedSteps);
  };

  useEffect(() => {
    if (user) {
      Promise.all([fetchWorkflows(), fetchExecutions()]).finally(() => {
        setLoading(false);
      });
    }
  }, [user]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <PlayIcon className="w-4 h-4" />;
      case 'paused':
        return <PauseIcon className="w-4 h-4" />;
      case 'completed':
        return <CheckCircleIcon className="w-4 h-4" />;
      case 'cancelled':
        return <XCircleIcon className="w-4 h-4" />;
      default:
        return <ClockIcon className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getAudienceDisplay = (workflow: Workflow) => {
    const audienceStep = workflow.steps.find(step => step.stepType === 'audience');
    if (!audienceStep) return 'No Audience';
    
    try {
      const config = typeof audienceStep.config === 'string' ? JSON.parse(audienceStep.config) : audienceStep.config;
      
      if (config.audienceType === 'all') {
        return 'All Clients';
      } else if (config.audienceType === 'packages') {
        const packageIds = config.selectedPackageIds || [];
        if (packageIds.length === 0) return 'No Packages Selected';
        const packageNames = packageIds.map((id: number) => {
          const pkg = packages.find(p => p.id === id);
          return pkg?.name || `Package ${id}`;
        });
        return packageNames.join(', ');
      } else if (config.audienceType === 'clients') {
        const clientIds = config.selectedClientIds || [];
        if (clientIds.length === 0) return 'No Clients Selected';
        
        // Get client names from the clients array
        const clientNames = clientIds.map((id: number) => {
          const client = clients.find(c => c.id === id);
          return client?.fullName || client?.email || `Client ${id}`;
        });
        
        // If more than 3 clients, show first 3 and count
        if (clientNames.length > 3) {
          return `${clientNames.slice(0, 3).join(', ')} +${clientNames.length - 3} more`;
        }
        return clientNames.join(', ');
      }
      
      return 'Unknown';
    } catch (error) {
      return 'Error';
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <Text>Loading workflows...</Text>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Heading level={1}>Client Workflows</Heading>
            <Text className="text-gray-600 mt-2">
              Create and manage automated client journeys
            </Text>
          </div>
          <Button onClick={openCreateModal}>
            <PlusIcon className="w-5 h-5 mr-2" />
            Create Workflow
          </Button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <Text className="text-red-800">{error}</Text>
        </div>
      )}

      {/* Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            <button
              onClick={() => setActiveTab('workflows')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'workflows'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Workflows ({workflows.length})
            </button>
            <button
              onClick={() => setActiveTab('executions')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'executions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Executions ({executions.length})
            </button>
          </nav>
        </div>
      </div>

      {/* Workflows Tab */}
      {activeTab === 'workflows' && (
        <div className="bg-white shadow-sm ring-1 ring-gray-950/5 rounded-lg">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Name</TableHeader>
                <TableHeader>Audience</TableHeader>
                <TableHeader>Steps</TableHeader>
                <TableHeader>Executions</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Created</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {workflows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <PlusIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <Heading level={3} className="text-gray-900 mb-2">
                        No workflows yet
                      </Heading>
                      <Text className="text-gray-600 mb-4">
                        Create your first workflow to automate client journeys
                      </Text>
                      <Button onClick={openCreateModal}>
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Create Workflow
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                workflows.map((workflow) => (
                  <TableRow key={workflow.id}>
                    <TableCell>
                      <div>
                        <Text className="font-medium text-gray-900">
                          {workflow.name}
                        </Text>
                        {workflow.description && (
                          <Text className="text-gray-500 text-sm">
                            {workflow.description}
                          </Text>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {getAudienceDisplay(workflow)}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {workflow.steps.length} steps
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {workflow._count.executions}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge className={workflow.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}>
                        {workflow.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {formatDate(workflow.createdAt)}
                      </Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleStartWorkflow(workflow.id)}
                          className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded p-1 transition-colors"
                          title="Start Workflow"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleEditWorkflow(workflow)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded p-1 transition-colors"
                          title="Edit Workflow"
                        >
                          <PencilIcon className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteWorkflow(workflow.id, workflow.name)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                          title="Delete Workflow"
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
      )}

      {/* Executions Tab */}
      {activeTab === 'executions' && (
        <div className="bg-white shadow-sm ring-1 ring-gray-950/5 rounded-lg">
          <Table>
            <TableHead>
              <TableRow>
                <TableHeader>Client</TableHeader>
                <TableHeader>Workflow</TableHeader>
                <TableHeader>Package</TableHeader>
                <TableHeader>Status</TableHeader>
                <TableHeader>Current Step</TableHeader>
                <TableHeader>Started</TableHeader>
                <TableHeader className="text-right">Actions</TableHeader>
              </TableRow>
            </TableHead>
            <TableBody>
              {executions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12">
                    <div className="flex flex-col items-center">
                      <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                        <ClockIcon className="w-6 h-6 text-gray-400" />
                      </div>
                      <Heading level={3} className="text-gray-900 mb-2">
                        No executions yet
                      </Heading>
                      <Text className="text-gray-600">
                        Workflow executions will appear here when clients start workflows
                      </Text>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                executions.map((execution) => (
                  <TableRow key={execution.id}>
                    <TableCell>
                      <div>
                        <Text className="font-medium text-gray-900">
                          {execution.client.fullName}
                        </Text>
                        <Text className="text-gray-500 text-sm">
                          {execution.client.email}
                        </Text>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {execution.workflow.name}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {execution.workflow.package?.name || 'No Package'}
                      </Text>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(execution.status)}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(execution.status)}
                          <span className="capitalize">{execution.status}</span>
                        </div>
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {execution.currentStep ? (
                        <Text className="text-gray-900">
                          Step {execution.currentStep.stepOrder}: {execution.currentStep.stepType}
                        </Text>
                      ) : (
                        <Text className="text-gray-500">-</Text>
                      )}
                    </TableCell>
                    <TableCell>
                      <Text className="text-gray-900">
                        {formatDate(execution.startedAt)}
                      </Text>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        {execution.status === 'active' && (
                          <button
                            onClick={() => handleExecutionStatusChange(execution.id, 'paused')}
                            className="text-yellow-600 hover:text-yellow-800 hover:bg-yellow-50 rounded p-1 transition-colors"
                            title="Pause Execution"
                          >
                            <PauseIcon className="w-4 h-4" />
                          </button>
                        )}
                        {execution.status === 'paused' && (
                          <button
                            onClick={() => handleExecutionStatusChange(execution.id, 'active')}
                            className="text-green-600 hover:text-green-800 hover:bg-green-50 rounded p-1 transition-colors"
                            title="Resume Execution"
                          >
                            <PlayIcon className="w-4 h-4" />
                          </button>
                        )}
                        {(execution.status === 'active' || execution.status === 'paused') && (
                          <button
                            onClick={() => setCancelDialog({ open: true, executionId: execution.id })}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded p-1 transition-colors"
                            title="Cancel Execution"
                          >
                            <XCircleIcon className="w-4 h-4" />
                          </button>
                        )}
                        {(execution.status === 'completed' || execution.status === 'cancelled') && (
                          <span className="text-gray-400 text-sm">-</span>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* Workflow Flow Builder */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-gray-50 z-50 flex flex-col">
          {/* Header */}
          <div className="bg-white border-b border-gray-200 px-6 py-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-4">
                <button
                  onClick={closeCreateModal}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <div>
                  <Heading level={2}>Create Workflow</Heading>
                  <Text className="text-gray-600">Design your client journey with visual steps</Text>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Button
                  outline
                  onClick={closeCreateModal}
                  disabled={createLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={createWorkflow}
                  disabled={
                    createLoading || 
                    !workflowName || 
                    workflowSteps.length === 0
                  }
                >
                  {createLoading ? 'Creating...' : 'Save Workflow'}
                </Button>
              </div>
            </div>
          </div>

          {/* Flow Builder Content */}
          <div className="flex-1 flex min-h-0 overflow-hidden">
            {/* Step Library Sidebar */}
            <div className="w-80 bg-white border-r border-gray-200 p-6 overflow-y-auto">
              <Heading level={3} className="mb-4">Step Library</Heading>
              <div className="space-y-3">
                {/* Set Audience Step - First in list */}
                <div 
                  onClick={() => addStep('audience')}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 hover:bg-indigo-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-indigo-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <div>
                      <Text className="font-medium">Set Audience</Text>
                      <Text className="text-sm text-gray-600">Define who receives subsequent steps</Text>
                    </div>
                  </div>
                </div>

                {/* Form Step */}
                <div 
                  onClick={() => addStep('form')}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-blue-300 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div>
                      <Text className="font-medium">Send Form</Text>
                      <Text className="text-sm text-gray-600">Send check-in form to client</Text>
                    </div>
                  </div>
                </div>

                {/* Wait Step */}
                <div 
                  onClick={() => addStep('wait')}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-yellow-300 hover:bg-yellow-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div>
                      <Text className="font-medium">Wait</Text>
                      <Text className="text-sm text-gray-600">Pause workflow for specified time</Text>
                    </div>
                  </div>
                </div>

                {/* Notification Step */}
                <div 
                  onClick={() => addStep('notification')}
                  className="p-4 border border-gray-200 rounded-lg cursor-pointer hover:border-green-300 hover:bg-green-50 transition-colors"
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                      <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586-2.586a2 2 0 012.828 0L12.828 7H4.828zM4.828 17h8l-2.586 2.586a2 2 0 01-2.828 0L4.828 17z" />
                      </svg>
                    </div>
                    <div>
                      <Text className="font-medium">Send Notification</Text>
                      <Text className="text-sm text-gray-600">Send push notification to client</Text>
                    </div>
                  </div>
                </div>


              </div>
            </div>

            {/* Flow Canvas */}
            <div className="flex-1 min-h-0 bg-gray-50 p-6 overflow-y-auto">
              <div className="bg-white rounded-lg border-2 border-dashed border-gray-300">
                {workflowSteps.length === 0 ? (
                  <div className="flex items-center justify-center" style={{ minHeight: '400px' }}>
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <Heading level={3} className="text-gray-500 mb-2">Start Building Your Workflow</Heading>
                      <Text className="text-gray-400 mb-4">Drag steps from the library to create your client journey</Text>
                      <Button 
                        variant="secondary"
                        onClick={() => addStep('audience')}
                      >
                        Add First Step
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-6 space-y-4">
                    {workflowSteps.map((step) => {
                      const isExpanded = expandedSteps.has(step.id);
                      return (
                        <div 
                          key={step.id}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden"
                        >
                          {/* Step Header - Click to Expand/Collapse */}
                          <div 
                            onClick={() => {
                              const newExpanded = new Set(expandedSteps);
                              if (isExpanded) {
                                newExpanded.delete(step.id);
                              } else {
                                newExpanded.add(step.id);
                              }
                              setExpandedSteps(newExpanded);
                            }}
                            className="p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-center space-x-3"
                          >
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              step.type === 'form' ? 'bg-blue-100' :
                              step.type === 'wait' ? 'bg-yellow-100' :
                              step.type === 'notification' ? 'bg-green-100' :
                              'bg-indigo-100'
                            }`}>
                              {step.type === 'form' && (
                                <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              )}
                              {step.type === 'wait' && (
                                <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              )}
                              {step.type === 'notification' && (
                                <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4.828 7l2.586-2.586a2 2 0 012.828 0L12.828 7H4.828zM4.828 17h8l-2.586 2.586a2 2 0 01-2.828 0L4.828 17z" />
                                </svg>
                              )}
                              {step.type === 'audience' && (
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                              )}
                            </div>
                            <div className="flex-1">
                              <Text className="font-medium">
                                {step.type === 'form' ? 'Send Form' :
                                 step.type === 'wait' ? 'Wait' :
                                 step.type === 'notification' ? 'Send Notification' :
                                 'Set Audience'}
                              </Text>
                              <Text className="text-sm text-gray-600">Step {step.order}</Text>
                            </div>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setWorkflowSteps(workflowSteps.filter(s => s.id !== step.id));
                              }}
                              className="text-red-600 hover:text-red-800 p-1 rounded"
                              title="Delete Step"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                            {isExpanded ? (
                              <ChevronUpIcon className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDownIcon className="w-5 h-5 text-gray-400" />
                            )}
                          </div>

                          {/* Step Configuration - Visible when Expanded */}
                          {isExpanded && (
                            <div className="px-4 py-4 border-t border-gray-200">
                              <StepConfiguration
                                step={step}
                                onUpdate={(config) => {
                                  setWorkflowSteps(workflowSteps.map(s => 
                                    s.id === step.id ? { ...s, config } : s
                                  ));
                                }}
                                checkInForms={checkInForms}
                                packages={packages}
                                clients={clients}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Properties Panel - Only workflow-level settings */}
            <div className="w-80 bg-white border-l border-gray-200 p-6 overflow-y-auto">
              <Heading level={3} className="mb-4">Workflow Settings</Heading>
              
              <div className="space-y-6">
                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Workflow Name</Text>
                  <Input
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                </div>

                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Status</Text>
                  <div className="flex items-center space-x-3">
                    <Switch
                      checked={isActive}
                      onChange={setIsActive}
                      color="green"
                    />
                    <Text className="text-sm text-gray-600">
                      {isActive ? 'Active' : 'Inactive'}
                    </Text>
                  </div>
                </div>

                <div>
                  <Text className="text-sm font-medium text-gray-700 mb-2">Description</Text>
                  <Textarea
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe this workflow"
                    rows={3}
                  />
                </div>

                {createError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <Text className="text-red-800 text-sm">{createError}</Text>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <ConfirmDialog
        open={deleteDialog.open}
        title="Delete Workflow"
        message="Are you sure you want to delete this workflow? This action cannot be undone."
        itemName={deleteDialog.workflow?.name}
        onCancel={() => setDeleteDialog({ open: false, workflow: null })}
        onConfirm={confirmDeleteWorkflow}
      />

      {/* Cancel Execution Confirmation Dialog */}
      <ConfirmDialog
        open={cancelDialog.open}
        title="Cancel Execution"
        message="Are you sure you want to cancel this workflow execution?"
        onCancel={() => setCancelDialog({ open: false, executionId: null })}
        onConfirm={confirmCancelExecution}
      />

      {/* Success Toast Notification */}
      {showSuccessToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        </div>
      )}

      {/* Error Toast Notification */}
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
    </div>
  );
}
