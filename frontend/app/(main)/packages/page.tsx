'use client'

import { useState, useEffect } from 'react'
import { Button } from '../../../components/button'
import { Heading } from '../../../components/heading'
import { Input, InputGroup } from '../../../components/input'
import { Select } from '../../../components/select'
import { Table, TableBody, TableCell, TableHeader, TableRow } from '../../../components/table'
import { Badge } from '../../../components/badge'
import { Dropdown, DropdownButton, DropdownItem, DropdownMenu } from '../../../components/dropdown'
import { EllipsisVerticalIcon, MagnifyingGlassIcon, PlusIcon } from '@heroicons/react/16/solid'
import { getStoredUser } from '../../../lib/auth'
import { Dialog, DialogTitle, DialogDescription, DialogBody, DialogActions } from '../../../components/dialog'

interface Package {
  id: number
  name: string
  durationValue: number
  durationUnit: string
  priceBeforeDisc: number
  discountApplied: boolean
  discountType?: string
  discountValue?: number
  priceAfterDisc?: number
  createdAt: string
  updatedAt: string
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingPackage, setEditingPackage] = useState<Package | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [packageToDelete, setPackageToDelete] = useState<Package | null>(null)
  const [showFilters, setShowFilters] = useState(false)
  const [durationFilter, setDurationFilter] = useState('all')
  const [discountFilter, setDiscountFilter] = useState('all')
  const [priceFilter, setPriceFilter] = useState('all')
  const [showCreatedToast, setShowCreatedToast] = useState(false)
  const [showDeletedToast, setShowDeletedToast] = useState(false)

  const user = getStoredUser()

  useEffect(() => {
    if (user?.id) {
      fetchPackages()
    }
  }, [user?.id])

  const fetchPackages = async () => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages?trainerId=${user?.id}`)
      if (response.ok) {
        const data = await response.json()
        setPackages(data)
      }
    } catch (error) {
      console.error('Error fetching packages:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeletePackage = async () => {
    if (!packageToDelete) return

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages/${packageToDelete.id}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setPackages(packages.filter(pkg => pkg.id !== packageToDelete.id))
        setShowDeleteConfirm(false)
        setPackageToDelete(null)
        setShowDeletedToast(true)
        setTimeout(() => setShowDeletedToast(false), 2000)
      } else {
        const errorData = await response.json()
        alert(errorData.error || 'Failed to delete package')
      }
    } catch (error) {
      console.error('Error deleting package:', error)
      alert('Failed to delete package. Please try again.')
    }
  }

  const confirmDelete = (pkg: Package) => {
    setPackageToDelete(pkg)
    setShowDeleteConfirm(true)
  }

  const handleEdit = (pkg: Package) => {
    setEditingPackage(pkg)
    setShowEditModal(true)
  }

  const filteredPackages = packages.filter(pkg => {
    // Search filter
    const matchesSearch = pkg.name.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Duration filter
    const matchesDuration = durationFilter === 'all' || pkg.durationUnit === durationFilter
    
    // Discount filter
    const matchesDiscount = discountFilter === 'all' || 
      (discountFilter === 'with_discount' && pkg.discountApplied) ||
      (discountFilter === 'without_discount' && !pkg.discountApplied)
    
    // Price filter
    const price = pkg.priceAfterDisc || pkg.priceBeforeDisc
    let matchesPrice = true
    if (priceFilter === 'low') {
      matchesPrice = price <= 100
    } else if (priceFilter === 'medium') {
      matchesPrice = price > 100 && price <= 500
    } else if (priceFilter === 'high') {
      matchesPrice = price > 500
    }
    
    return matchesSearch && matchesDuration && matchesDiscount && matchesPrice
  })

  const getDurationBadgeColor = (unit: string) => {
    switch (unit) {
      case 'day': return 'blue'
      case 'week': return 'green'
      case 'month': return 'yellow'
      case 'year': return 'purple'
      default: return 'zinc'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <Heading level={1}>Packages</Heading>
          <p className="text-zinc-600 mt-1">Manage your subscription packages</p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <PlusIcon className="h-4 w-4 mr-2" />
          Create Package
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4 flex-1">
          <div className="relative flex-1 max-w-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search packages..."
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
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Duration Unit</label>
              <select
                value={durationFilter}
                onChange={(e) => setDurationFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Durations</option>
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Discount Applied</label>
              <select
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Packages</option>
                <option value="with_discount">With Discount</option>
                <option value="without_discount">Without Discount</option>
              </select>
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-gray-700 mb-2">Price Range</label>
              <select
                value={priceFilter}
                onChange={(e) => setPriceFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                                 <option value="all">All Prices</option>
                 <option value="low">EGP 0 - EGP 100</option>
                 <option value="medium">EGP 100 - EGP 500</option>
                 <option value="high">EGP 500+</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Packages Table */}
      <div className="bg-white rounded-lg border border-zinc-200">
        <Table>
          <thead>
            <TableRow>
              <TableHeader>Package Name</TableHeader>
              <TableHeader>Duration</TableHeader>
              <TableHeader>Price</TableHeader>
              <TableHeader>Discount</TableHeader>
              <TableHeader>Final Price</TableHeader>
              <TableHeader>Created</TableHeader>
              <TableHeader className="w-20">Actions</TableHeader>
            </TableRow>
          </thead>
          <TableBody>
            {filteredPackages.map((pkg) => (
              <TableRow key={pkg.id}>
                <TableCell>
                  <div className="font-medium text-zinc-950">{pkg.name}</div>
                </TableCell>
                <TableCell>
                  <Badge color={getDurationBadgeColor(pkg.durationUnit)}>
                    {pkg.durationValue} {pkg.durationUnit}(s)
                  </Badge>
                </TableCell>
                                 <TableCell>
                   <span className="text-zinc-600">EGP {pkg.priceBeforeDisc}</span>
                 </TableCell>
                <TableCell>
                  {pkg.discountApplied ? (
                                         <Badge color="green">
                       {pkg.discountType === 'percentage' ? `${pkg.discountValue}%` : `EGP ${pkg.discountValue}`}
                     </Badge>
                  ) : (
                    <Badge color="zinc">No Discount</Badge>
                  )}
                </TableCell>
                                 <TableCell>
                   <span className="font-medium text-zinc-950">
                     EGP {pkg.priceAfterDisc || pkg.priceBeforeDisc}
                   </span>
                 </TableCell>
                <TableCell>
                  <span className="text-zinc-600">
                    {new Date(pkg.createdAt).toLocaleDateString()}
                  </span>
                </TableCell>
                                 <TableCell>
                   <Dropdown>
                     <DropdownButton plain className="inline-flex items-center justify-center w-8 h-8 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors">
                       <EllipsisVerticalIcon className="h-4 w-4" />
                     </DropdownButton>
                     <DropdownMenu>
                       <DropdownItem onClick={() => handleEdit(pkg)}>
                         Edit Package
                       </DropdownItem>
                       <DropdownItem onClick={() => confirmDelete(pkg)}>
                         Delete Package
                       </DropdownItem>
                     </DropdownMenu>
                   </Dropdown>
                 </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create Package Modal */}
      {showCreateModal && (
        <CreatePackageModal
          onClose={() => setShowCreateModal(false)}
          onPackageCreated={() => {
            setShowCreateModal(false)
            fetchPackages()
            setShowCreatedToast(true)
            setTimeout(() => setShowCreatedToast(false), 2000)
          }}
          trainerId={user?.id}
        />
      )}

      {/* Edit Package Modal */}
      {showEditModal && editingPackage && (
        <EditPackageModal
          package={editingPackage}
          onClose={() => {
            setShowEditModal(false)
            setEditingPackage(null)
          }}
          onPackageUpdated={() => {
            setShowEditModal(false)
            setEditingPackage(null)
            fetchPackages()
          }}
          trainerId={user?.id}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && packageToDelete && (
        <Dialog open={showDeleteConfirm} onClose={() => setShowDeleteConfirm(false)}>
          <DialogTitle>Delete Package</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete "{packageToDelete.name}"? This action cannot be undone.
          </DialogDescription>
          <DialogBody className="bg-white">
            <div className="space-y-4">
              <p className="text-sm text-zinc-600">
                This package will be permanently deleted and cannot be recovered.
              </p>
            </div>
          </DialogBody>
                     <DialogActions>
             <Button
               outline
               onClick={() => setShowDeleteConfirm(false)}
             >
               Cancel
             </Button>
             <Button
               color="red"
               onClick={handleDeletePackage}
             >
               Delete Package
             </Button>
           </DialogActions>
        </Dialog>
      )}

      {/* Success Toasts */}
      {showCreatedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Package created successfully!
          </div>
        </div>
      )}

      {showDeletedToast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Package deleted successfully!
          </div>
        </div>
      )}
    </div>
  )
}

function CreatePackageModal({ onClose, onPackageCreated, trainerId }: {
  onClose: () => void
  onPackageCreated: () => void
  trainerId?: number
}) {
  const [formData, setFormData] = useState({
    name: '',
    durationValue: '',
    durationUnit: 'month',
    priceBeforeDisc: '',
    discountApplied: false,
    discountType: 'fixed',
    discountValue: '',
    priceAfterDisc: '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainerId) return

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          trainerId,
          ...formData,
          durationValue: Number(formData.durationValue),
          priceBeforeDisc: Number(formData.priceBeforeDisc),
          discountValue: formData.discountValue ? Number(formData.discountValue) : null,
          priceAfterDisc: formData.priceAfterDisc ? Number(formData.priceAfterDisc) : null,
        }),
      })

      if (response.ok) {
        onPackageCreated()
      } else {
        console.error('Failed to create package')
      }
    } catch (error) {
      console.error('Error creating package:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePriceAfterDiscount = () => {
    if (!formData.priceBeforeDisc || !formData.discountValue) return

    const priceBefore = Number(formData.priceBeforeDisc)
    const discountValue = Number(formData.discountValue)

    if (formData.discountType === 'percentage') {
      const discountAmount = (priceBefore * discountValue) / 100
      return priceBefore - discountAmount
    } else {
      return priceBefore - discountValue
    }
  }

  useEffect(() => {
    if (formData.discountApplied && formData.priceBeforeDisc && formData.discountValue) {
      const calculatedPrice = calculatePriceAfterDiscount()
      if (calculatedPrice !== undefined) {
        setFormData(prev => ({ ...prev, priceAfterDisc: calculatedPrice.toString() }))
      }
    }
  }, [formData.discountApplied, formData.priceBeforeDisc, formData.discountValue, formData.discountType])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Create New Package</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Package Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter package name"
              required
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration Value *</label>
              <Input
                type="number"
                value={formData.durationValue}
                onChange={(e) => setFormData(prev => ({ ...prev, durationValue: e.target.value }))}
                placeholder="Enter duration"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration Unit *</label>
              <Select
                value={formData.durationUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, durationUnit: e.target.value }))}
                required
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </Select>
            </div>
          </div>

          {/* Price Before Discount */}
          <div>
            <label className="block text-sm font-medium mb-1">Price Before Discount (EGP) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.priceBeforeDisc}
              onChange={(e) => setFormData(prev => ({ ...prev, priceBeforeDisc: e.target.value }))}
              placeholder="Enter price in EGP"
              required
            />
          </div>

          {/* Discount Applied */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.discountApplied}
                onChange={(e) => setFormData(prev => ({ ...prev, discountApplied: e.target.checked }))}
                className="rounded border-zinc-300"
              />
              <span className="text-sm font-medium">Apply Discount</span>
            </label>
          </div>

          {/* Discount Fields */}
          {formData.discountApplied && (
            <div className="space-y-4 border border-zinc-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <Select
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount in EGP'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price After Discount (EGP)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceAfterDisc}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAfterDisc: e.target.value }))}
                  placeholder="Calculated automatically"
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              outline
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}

function EditPackageModal({ package: pkg, onClose, onPackageUpdated, trainerId }: {
  package: Package
  onClose: () => void
  onPackageUpdated: () => void
  trainerId?: number
}) {
  const [formData, setFormData] = useState({
    name: pkg.name,
    durationValue: pkg.durationValue.toString(),
    durationUnit: pkg.durationUnit,
    priceBeforeDisc: pkg.priceBeforeDisc.toString(),
    discountApplied: pkg.discountApplied,
    discountType: pkg.discountType || 'fixed',
    discountValue: pkg.discountValue?.toString() || '',
    priceAfterDisc: pkg.priceAfterDisc?.toString() || '',
  })
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!trainerId) return

    setLoading(true)
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || ''}/api/packages/${pkg.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          durationValue: Number(formData.durationValue),
          priceBeforeDisc: Number(formData.priceBeforeDisc),
          discountValue: formData.discountValue ? Number(formData.discountValue) : null,
          priceAfterDisc: formData.priceAfterDisc ? Number(formData.priceAfterDisc) : null,
        }),
      })

      if (response.ok) {
        onPackageUpdated()
      } else {
        console.error('Failed to update package')
      }
    } catch (error) {
      console.error('Error updating package:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculatePriceAfterDiscount = () => {
    if (!formData.priceBeforeDisc || !formData.discountValue) return

    const priceBefore = Number(formData.priceBeforeDisc)
    const discountValue = Number(formData.discountValue)

    if (formData.discountType === 'percentage') {
      const discountAmount = (priceBefore * discountValue) / 100
      return priceBefore - discountAmount
    } else {
      return priceBefore - discountValue
    }
  }

  useEffect(() => {
    if (formData.discountApplied && formData.priceBeforeDisc && formData.discountValue) {
      const calculatedPrice = calculatePriceAfterDiscount()
      if (calculatedPrice !== undefined) {
        setFormData(prev => ({ ...prev, priceAfterDisc: calculatedPrice.toString() }))
      }
    }
  }, [formData.discountApplied, formData.priceBeforeDisc, formData.discountValue, formData.discountType])

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-4">Edit Package</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Package Name */}
          <div>
            <label className="block text-sm font-medium mb-1">Package Name *</label>
            <Input
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter package name"
              required
            />
          </div>

          {/* Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Duration Value *</label>
              <Input
                type="number"
                value={formData.durationValue}
                onChange={(e) => setFormData(prev => ({ ...prev, durationValue: e.target.value }))}
                placeholder="Enter duration"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Duration Unit *</label>
              <Select
                value={formData.durationUnit}
                onChange={(e) => setFormData(prev => ({ ...prev, durationUnit: e.target.value }))}
                required
              >
                <option value="day">Day</option>
                <option value="week">Week</option>
                <option value="month">Month</option>
                <option value="year">Year</option>
              </Select>
            </div>
          </div>

          {/* Price Before Discount */}
          <div>
            <label className="block text-sm font-medium mb-1">Price Before Discount (EGP) *</label>
            <Input
              type="number"
              step="0.01"
              value={formData.priceBeforeDisc}
              onChange={(e) => setFormData(prev => ({ ...prev, priceBeforeDisc: e.target.value }))}
              placeholder="Enter price in EGP"
              required
            />
          </div>

          {/* Discount Applied */}
          <div>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={formData.discountApplied}
                onChange={(e) => setFormData(prev => ({ ...prev, discountApplied: e.target.checked }))}
                className="rounded border-zinc-300"
              />
              <span className="text-sm font-medium">Apply Discount</span>
            </label>
          </div>

          {/* Discount Fields */}
          {formData.discountApplied && (
            <div className="space-y-4 border border-zinc-200 rounded-lg p-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Type</label>
                  <Select
                    value={formData.discountType}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountType: e.target.value }))}
                  >
                    <option value="fixed">Fixed Amount</option>
                    <option value="percentage">Percentage</option>
                  </Select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Discount Value</label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.discountValue}
                    onChange={(e) => setFormData(prev => ({ ...prev, discountValue: e.target.value }))}
                    placeholder={formData.discountType === 'percentage' ? 'Enter percentage' : 'Enter amount in EGP'}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Price After Discount (EGP)</label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.priceAfterDisc}
                  onChange={(e) => setFormData(prev => ({ ...prev, priceAfterDisc: e.target.value }))}
                  placeholder="Calculated automatically"
                  readOnly
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              outline
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Package'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
} 