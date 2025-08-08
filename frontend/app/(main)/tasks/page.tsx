'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/button'
import { Heading } from '../../../components/heading'
import { Input, InputGroup } from '../../../components/input'
import { Select } from '../../../components/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/table'
import { Badge } from '../../../components/badge'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../../../components/dropdown'
import { EllipsisVerticalIcon, MagnifyingGlassIcon, PlusIcon, ChatBubbleLeftRightIcon, XMarkIcon } from '@heroicons/react/16/solid'
import { getStoredUser } from '../../../lib/auth'
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '../../../components/dialog'

interface Task {
  id: number
  title: string
  description?: string
  taskType: 'manual' | 'automatic'
  category: string
  status: 'open' | 'done' | 'delayed'
  assignedTo?: number
  dueDate?: string
  createdAt: string
  assignedTeamMember?: {
    id: number
    fullName: string
    email: string
    role: string
  }
  client?: {
    id: number
    fullName: string
    email: string
  }
  comments: Array<{
    id: number
    comment: string
    createdAt: string
    teamMember: {
      id: number
      fullName: string
      email: string
    }
  }>
}

interface TeamMember {
  id: number
  fullName: string
  email: string
  role: string
}

interface Client {
  id: number
  fullName: string
  email: string
}

interface TaskComment {
  id: number;
  comment: string;
  createdAt: string;
  teamMember: {
    id: number;
    fullName: string;
    email: string;
  };
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [taskTypeFilter, setTaskTypeFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [assignedToFilter, setAssignedToFilter] = useState('all')
  const [clientFilter, setClientFilter] = useState('all')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showCommentsModal, setShowCommentsModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [newComment, setNewComment] = useState('')
  const [taskCount, setTaskCount] = useState(0)
  const [showFilters, setShowFilters] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null)

  const user = getStoredUser()

  useEffect(() => {
    if (user?.id) {
      fetchTasks()
      fetchTeamMembers()
      fetchClients()
      fetchTaskCount()
      // Enable automatic task generation on page load
      generateAutomaticTasks()
    }
  }, [user?.id])

  // Reset the flag when user changes
  useEffect(() => {
    if (user?.id) {
      // Clear the localStorage flag when user changes
      localStorage.removeItem(`tasks_generated_${user.id}`)
    }
  }, [user?.id])

  // Add a separate effect to handle task count updates
  useEffect(() => {
    if (user?.id) {
      fetchTaskCount()
    }
  }, [tasks.length, user?.id]) // Update count when tasks change

  useEffect(() => {
    if (user?.id) {
      fetchTasks()
    }
  }, [statusFilter, taskTypeFilter, categoryFilter, assignedToFilter, clientFilter])

  const fetchTasks = async () => {
    try {
      const params = new URLSearchParams({
        trainerId: user?.id.toString() || '',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(taskTypeFilter !== 'all' && { taskType: taskTypeFilter }),
        ...(categoryFilter !== 'all' && { category: categoryFilter }),
        ...(assignedToFilter !== 'all' && { assignedTo: assignedToFilter }),
        ...(clientFilter !== 'all' && { clientId: clientFilter }),
        _t: Date.now().toString(), // Cache busting parameter
      })

      const response = await fetch(`/api/tasks?${params}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched tasks:', data) // Debug log
        setTasks(data)
      } else {
        console.error('Failed to fetch tasks:', response.statusText)
      }
    } catch (error) {
      console.error('Error fetching tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchTeamMembers = async () => {
    try {
      const response = await fetch(`/api/team-members?trainerId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        console.log('Fetched team members:', data) // Debug log
        setTeamMembers(data)
      }
    } catch (error) {
      console.error('Error fetching team members:', error)
    }
  }

  const fetchClients = async () => {
    try {
      const response = await fetch(`/api/clients?trainerId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setClients(data)
      }
    } catch (error) {
      console.error('Error fetching clients:', error)
    }
  }

  const fetchTaskCount = async () => {
    try {
      const response = await fetch(`/api/tasks/count?trainerId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setTaskCount(data.count)
      }
    } catch (error) {
      console.error('Error fetching task count:', error)
    }
  }

  const handleStatusChange = async (taskId: number, newStatus: 'open' | 'done' | 'delayed') => {
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      })
      if (response.ok) {
        fetchTasks()
        fetchTaskCount()
      }
    } catch (error) {
      console.error('Error updating task status:', error)
    }
  }

  const handleDeleteTask = async () => {
    if (!taskToDelete) return
    
    try {
      console.log('Deleting task:', taskToDelete.id)
      const response = await fetch(`/api/tasks/${taskToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        console.log('Task deleted successfully')
        fetchTasks()
        fetchTaskCount()
        setShowDeleteConfirm(false)
        setTaskToDelete(null)
      } else {
        const errorText = await response.text()
        console.error('Failed to delete task:', response.statusText, errorText)
        alert('Failed to delete task. Please try again.')
      }
    } catch (error) {
      console.error('Error deleting task:', error)
      alert('Error deleting task. Please try again.')
    }
  }

  const confirmDelete = (task: Task) => {
    setTaskToDelete(task)
    setShowDeleteConfirm(true)
  }

  const handleAddComment = async () => {
    if (!selectedTask || !newComment.trim()) return

    try {
      const response = await fetch(`/api/tasks/${selectedTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamMemberId: user?.id,
          comment: newComment,
        }),
      })

      if (response.ok) {
        setNewComment('')
        fetchTasks() // Refresh to get updated comments
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    }
  }

  const generateAutomaticTasks = async () => {
    try {
      console.log('Manual regeneration requested')
      const response = await fetch('/api/tasks/generate-automated', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ trainerId: user?.id }),
      })

      if (response.ok) {
        console.log('Automatic tasks generated successfully')
        // Refresh tasks and count after generating
        fetchTasks()
        fetchTaskCount()
      } else {
        console.error('Failed to generate automatic tasks')
      }
    } catch (error) {
      console.error('Error generating automatic tasks:', error)
    }
  }

  const filteredTasks = tasks.filter(task => {
    // Search filter
    const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         task.description?.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Status filter
    const matchesStatus = statusFilter === 'all' || task.status === statusFilter
    
    // Task type filter
    const matchesTaskType = taskTypeFilter === 'all' || task.taskType === taskTypeFilter
    
    // Category filter
    const matchesCategory = categoryFilter === 'all' || task.category === categoryFilter
    
    // Assigned to filter
    const matchesAssignedTo = assignedToFilter === 'all' || task.assignedTo?.toString() === assignedToFilter
    
    // Client filter
    const matchesClient = clientFilter === 'all' || task.client?.id.toString() === clientFilter
    
    return matchesSearch && matchesStatus && matchesTaskType && matchesCategory && matchesAssignedTo && matchesClient
  })

  const getTaskTypeBadgeColor = (taskType: string) => {
    return taskType === 'automatic' ? 'purple' : 'orange'
  }

  const getCategoryBadgeColor = (category: string) => {
    switch (category) {
      case 'Payment':
        return 'red'
      case 'Subscription':
        return 'blue'
      case 'Profile':
        return 'yellow'
      case 'Workout':
        return 'green'
      case 'Nutrition':
        return 'pink'
      default:
        return 'zinc'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading tasks...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-sm text-gray-600 mt-1">
          Manage and track tasks for your team. {taskCount} open tasks remaining.
        </p>
      </div>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button 
            onClick={() => setShowFilters(!showFilters)} 
            className="px-4 py-[calc(--spacing(2.5)-1px)] sm:py-[calc(--spacing(1.5)-1px)] border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:bg-gray-50 flex items-center justify-center gap-2 text-gray-500 hover:text-gray-700"
          >
            <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z" />
            </svg>
            <span>Filters</span>
          </button>
        </div>
        <div className="flex gap-2">
          {/* <Button 
            onClick={() => {
              localStorage.removeItem(`tasks_generated_${user?.id}`)
              generateAutomaticTasks()
            }}
            outline
          >
            Generate Tasks
          </Button> */}
          <Button onClick={() => setShowCreateModal(true)}>
            <PlusIcon />
            Create Task
          </Button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Statuses</option>
                <option value="open">Open</option>
                <option value="done">Done</option>
                <option value="delayed">Delayed</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Task Type</label>
              <select
                value={taskTypeFilter}
                onChange={(e) => setTaskTypeFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Types</option>
                <option value="manual">Manual</option>
                <option value="automatic">Automatic</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Categories</option>
                <option value="Payment">Payment</option>
                <option value="Subscription">Subscription</option>
                <option value="Profile">Profile</option>
                <option value="Program">Program</option>
                <option value="Installment">Installment</option>
                <option value="Manual">Manual</option>
                <option value="Workout">Workout</option>
                <option value="Nutrition">Nutrition</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
              <select
                value={assignedToFilter}
                onChange={(e) => setAssignedToFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Assignees</option>
                {teamMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.fullName}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Client</label>
              <select
                value={clientFilter}
                onChange={(e) => setClientFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Clients</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Tasks Table */}
      <Table className="[--gutter:--spacing(6)] lg:[--gutter:--spacing(10)]">
        <TableHead>
          <TableRow>
            <TableHeader>Task</TableHeader>
            <TableHeader>Type</TableHeader>
            <TableHeader>Category</TableHeader>
            <TableHeader>Status</TableHeader>
            <TableHeader>Assigned To</TableHeader>
            <TableHeader>Due Date</TableHeader>
            <TableHeader>Comments</TableHeader>
            <TableHeader className="text-right">Actions</TableHeader>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredTasks.map((task) => (
            <TableRow key={task.id}>
              <TableCell>
                <div>
                  <div className="font-medium text-zinc-950">{task.title}</div>
                  {task.client && (
                    <div className="text-xs text-zinc-400 mt-1">
                      Client: {task.client.fullName}
                    </div>
                  )}
                </div>
              </TableCell>
              <TableCell>
                <Badge color={getTaskTypeBadgeColor(task.taskType)}>
                  {task.taskType}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge color={getCategoryBadgeColor(task.category)}>
                  {task.category}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge 
                  color={
                    task.status === 'open' 
                      ? 'blue' 
                      : task.status === 'done'
                      ? 'zinc'
                      : 'yellow'
                  }
                >
                  {task.status}
                </Badge>
              </TableCell>
              <TableCell>
                {task.assignedTeamMember ? (
                  <div>
                    <div className="font-medium">{task.assignedTeamMember.fullName}</div>
                    <div className="text-sm text-zinc-500">{task.assignedTeamMember.role}</div>
                  </div>
                ) : (
                  <span className="text-zinc-400">Unassigned</span>
                )}
              </TableCell>
              <TableCell>
                {task.dueDate ? (
                  <span className={new Date(task.dueDate) < new Date() ? 'text-red-600' : ''}>
                    {new Date(task.dueDate).toLocaleDateString()}
                  </span>
                ) : (
                  <span className="text-zinc-400">No due date</span>
                )}
              </TableCell>
              <TableCell>
                <button
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                  onClick={() => {
                    setSelectedTask(task)
                    setShowCommentsModal(true)
                  }}
                >
                  <ChatBubbleLeftRightIcon className="h-3 w-3" />
                  {task.comments.length}
                </button>
              </TableCell>
              <TableCell className="text-right">
                <Dropdown>
                  <DropdownButton plain className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                    <EllipsisVerticalIcon className="h-4 w-4" />
                  </DropdownButton>
                  <DropdownMenu>
                    <DropdownItem onClick={() => handleStatusChange(task.id, 'open')}>
                      Mark as Open
                    </DropdownItem>
                    <DropdownItem onClick={() => handleStatusChange(task.id, 'done')}>
                      Mark as Done
                    </DropdownItem>
                    <DropdownItem onClick={() => handleStatusChange(task.id, 'delayed')}>
                      Mark as Delayed
                    </DropdownItem>
                    <DropdownItem onClick={() => {
                      setSelectedTask(task)
                      setShowCreateModal(true)
                    }}>
                      Edit Task
                    </DropdownItem>
                    <DropdownItem onClick={() => confirmDelete(task)}>
                      Delete Task
                    </DropdownItem>
                  </DropdownMenu>
                </Dropdown>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {filteredTasks.length === 0 && (
        <div className="text-center py-12">
          <div className="text-lg font-medium text-zinc-900 mb-2">No tasks found</div>
          <p className="text-zinc-500">
            {searchTerm || statusFilter !== 'all' || taskTypeFilter !== 'all' || categoryFilter !== 'all' || assignedToFilter !== 'all' || clientFilter !== 'all'
              ? 'Try adjusting your filters or search terms.'
              : 'Create your first task to get started.'}
          </p>
        </div>
      )}

      {/* Create Task Modal */}
      {showCreateModal && (
        <CreateTaskModal
          onClose={() => setShowCreateModal(false)}
          onTaskCreated={() => {
            setShowCreateModal(false)
            fetchTasks()
            fetchTaskCount()
          }}
          teamMembers={teamMembers}
          clients={clients}
          trainerId={user?.id}
          editingTask={selectedTask}
        />
      )}

      {/* Comments Modal */}
      {showCommentsModal && selectedTask && (
        <CommentsModal
          task={selectedTask}
          onClose={() => {
            setShowCommentsModal(false)
            setSelectedTask(null)
          }}
          onCommentAdded={() => {
            fetchTasks()
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && taskToDelete && (
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <DialogBody className="bg-white">
            <DialogTitle>Delete Task</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{taskToDelete.title}"? This action cannot be undone.
            </DialogDescription>
            <DialogActions>
              <Button outline onClick={() => setShowDeleteConfirm(false)}>
                Cancel
              </Button>
              <Button color="red" onClick={handleDeleteTask}>
                Delete
              </Button>
            </DialogActions>
          </DialogBody>
        </Dialog>
      )}
    </div>
  )
}

// Create Task Modal Component
function CreateTaskModal({ 
  onClose, 
  onTaskCreated, 
  teamMembers, 
  clients,
  trainerId,
  editingTask
}: { 
  onClose: () => void
  onTaskCreated: () => void
  teamMembers: TeamMember[]
  clients: Client[]
  trainerId?: number
  editingTask?: Task
}) {
  const [title, setTitle] = useState(editingTask?.title || '')
  const [description, setDescription] = useState(editingTask?.description || '')
  const [category, setCategory] = useState(editingTask?.category || 'Manual')
  const [assignedTo, setAssignedTo] = useState(editingTask?.assignedTo?.toString() || '')
  const [clientId, setClientId] = useState(editingTask?.client?.id?.toString() || '')
  const [dueDate, setDueDate] = useState(editingTask?.dueDate ? new Date(editingTask.dueDate).toISOString().split('T')[0] : '')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !trainerId) return

    setLoading(true)
    try {
      const url = editingTask ? `/api/tasks/${editingTask.id}` : '/api/tasks'
      const method = editingTask ? 'PUT' : 'POST'
      
      // Convert assignedTo to number if it's not empty
      const assignedToValue = assignedTo && assignedTo !== '' ? assignedTo : null
      const clientIdValue = clientId && clientId !== '' ? Number(clientId) : null
      
      const requestBody = {
        trainerId,
        title: title.trim(),
        description: description.trim(),
        category,
        assignedTo: assignedToValue,
        clientId: clientIdValue,
        dueDate: dueDate || null,
      }
      
      console.log('Sending task data:', requestBody) // Debug log
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      if (response.ok) {
        console.log('Task saved successfully')
        // Add a small delay to ensure the backend has processed the update
        setTimeout(() => {
          onTaskCreated()
        }, 100)
      } else {
        const errorText = await response.text()
        console.error('Failed to save task:', response.statusText, errorText)
        alert('Failed to save task. Please try again.')
      }
    } catch (error) {
      console.error('Error saving task:', error)
      alert('Error saving task. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <h3 className="text-lg font-semibold mb-4">{editingTask ? 'Edit Task' : 'Create New Task'}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Category</label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="Manual">Manual</option>
              <option value="Payment">Payment</option>
              <option value="Subscription">Subscription</option>
              <option value="Profile">Profile</option>
              <option value="Workout">Workout</option>
              <option value="Nutrition">Nutrition</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Assign To</label>
            <Select 
              value={assignedTo} 
              onChange={(e) => {
                const value = e.target.value
                console.log('Selected assignment:', value, typeof value) // Debug log
                setAssignedTo(value)
              }}
            >
              <option value="">Unassigned</option>
              {teamMembers.map((member) => (
                <option key={member.id} value={member.id.toString()}>
                  {member.fullName} ({member.role})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Client (Optional)</label>
            <Select value={clientId} onChange={(e) => setClientId(e.target.value)}>
              <option value="">No Client</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.fullName}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Due Date</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              Cancel
            </button>
            <Button type="submit" disabled={loading || !title.trim()}>
              {loading ? (editingTask ? 'Updating...' : 'Creating...') : (editingTask ? 'Update Task' : 'Create Task')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

// Comments Modal Component
function CommentsModal({ 
  task, 
  onClose, 
  onCommentAdded 
}: { 
  task: Task
  onClose: () => void
  onCommentAdded: () => void
}) {
  const [comments, setComments] = useState<TaskComment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const user = getStoredUser()

  useEffect(() => {
    fetchComments()
  }, [task.id])

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`)
      if (response.ok) {
        const data = await response.json()
        setComments(data)
      }
    } catch (error) {
      console.error('Error fetching comments:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim() || !user?.id) return

    setSubmitting(true)
    try {
      const response = await fetch(`/api/tasks/${task.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamMemberId: user.id,
          comment: newComment.trim(),
        }),
      })

      if (response.ok) {
        const newCommentData = await response.json()
        setComments(prev => [newCommentData, ...prev])
        setNewComment('')
        onCommentAdded()
      }
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={true} onClose={onClose}>
      <DialogBody className="bg-white">
        <div className="flex justify-between items-center mb-4">
          <DialogTitle>Comments - {task.title}</DialogTitle>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        
        <div className="space-y-4 mb-4 max-h-64 overflow-y-auto">
          {comments.map((comment) => (
            <div key={comment.id} className="border-b border-gray-200 pb-3">
              <div className="flex justify-between items-start mb-1">
                <span className="font-medium text-sm">{comment.teamMember.fullName}</span>
                <span className="text-xs text-gray-500">
                  {new Date(comment.createdAt).toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-700">{comment.comment}</p>
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit} className="border-t pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              disabled={submitting}
            />
            <Button type="submit" disabled={submitting || !newComment.trim()}>
              {submitting ? 'Adding...' : 'Add'}
            </Button>
          </div>
        </form>
      </DialogBody>
    </Dialog>
  )
} 