'use client'

import { Avatar } from '../components/avatar'
import {
  Dropdown,
  DropdownButton,
  DropdownDivider,
  DropdownItem,
  DropdownLabel,
  DropdownMenu,
} from '../components/dropdown'
import { Navbar, NavbarItem, NavbarSection, NavbarSpacer } from '../components/navbar'
import {
  Sidebar,
  SidebarBody,
  SidebarFooter,
  SidebarHeader,
  SidebarHeading,
  SidebarItem,
  SidebarLabel,
  SidebarSection,
  SidebarSpacer,
} from '../components/sidebar'
import { SidebarLayout } from '../components/sidebar-layout'
import { getEvents } from '../components/data'
import {
  ArrowRightStartOnRectangleIcon,
  ChevronDownIcon,
  ChevronUpIcon,
  Cog8ToothIcon,
  LightBulbIcon,
  PlusIcon,
  ShieldCheckIcon,
  UserCircleIcon,
} from '@heroicons/react/16/solid'
import {
  Cog6ToothIcon,
  HomeIcon,
  QuestionMarkCircleIcon,
  SparklesIcon,
  Square2StackIcon,
  TicketIcon,
  UsersIcon,
  FireIcon,
  UserGroupIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  HeartIcon,
  ChartBarIcon,
  BellIcon,
} from '@heroicons/react/20/solid'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { getStoredUser, removeUser, storeUser } from '../lib/auth'
import { Disclosure } from '@headlessui/react';
import Link from 'next/link';

// TaskCounter Component
function TaskCounter({ trainerId }: { trainerId?: number }) {
  const [count, setCount] = useState(0)

  useEffect(() => {
    if (!trainerId) return

    const fetchCount = async () => {
      try {
        const response = await fetch(`/api/tasks/count?trainerId=${trainerId}`)
        if (response.ok) {
          const data = await response.json()
          setCount(data.count)
        }
      } catch (error) {
        console.error('Error fetching task count:', error)
      }
    }

    fetchCount()
    
    // Set up polling for real-time updates
    const interval = setInterval(fetchCount, 30000) // Poll every 30 seconds
    
    return () => clearInterval(interval)
  }, [trainerId])

  if (count === 0) return null

  return (
    <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-1.5 py-0.5 min-w-[16px] h-4 flex items-center justify-center text-[10px] font-medium">
      {count}
    </span>
  )
}

function ClientsManagementCollapsible({ pathname }: { pathname: string }) {
  // Closed by default; auto-open when on Clients or Leads pages
  const [isOpen, setIsOpen] = useState(
    pathname.startsWith('/clients') || pathname.startsWith('/leads')
  );

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 hover:bg-zinc-950/5 group"
      >
        <UsersIcon className="size-6 shrink-0 fill-zinc-500 sm:size-5 group-hover:fill-zinc-950" />
        <span className="flex-1">Clients Management</span>
        <span className="ml-auto transition-transform duration-200 ease-in-out">
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-8 flex flex-col gap-0.5 mt-1">
          <SidebarItem href="/clients" current={pathname.startsWith('/clients')}>
            <SidebarLabel>Clients</SidebarLabel>
          </SidebarItem>
          <SidebarItem href="/leads" current={pathname.startsWith('/leads')}>
            <SidebarLabel>Leads</SidebarLabel>
          </SidebarItem>
        </div>
      </div>
    </div>
  );
}

function CheckInsCollapsible({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 hover:bg-zinc-950/5 group"
      >
        <Square2StackIcon className="size-6 shrink-0 fill-zinc-500 sm:size-5 group-hover:fill-zinc-950" />
        <span className="flex-1">Check-ins</span>
        <span className="ml-auto transition-transform duration-200 ease-in-out">
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-8 flex flex-col gap-0.5 mt-1">
          <SidebarItem
            href="/check-ins"
            current={pathname === '/check-ins' || (pathname.startsWith('/check-ins/') && !pathname.startsWith('/check-ins/responses'))}
          >
            <SidebarLabel>My Check-ins</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/check-ins/responses"
            current={pathname.startsWith('/check-ins/responses')}
          >
            <SidebarLabel>Responses</SidebarLabel>
          </SidebarItem>
        </div>
      </div>
    </div>
  );
}

function WorkoutProgramsCollapsible({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 hover:bg-zinc-950/5 group"
      >
        <FireIcon className="size-6 shrink-0 fill-zinc-500 sm:size-5 group-hover:fill-zinc-950" />
        <span className="flex-1">Workout Programs</span>
        <span className="ml-auto transition-transform duration-200 ease-in-out">
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-8 flex flex-col gap-0.5 mt-1">
          <SidebarItem
            href="/workout-programs"
            current={pathname === '/workout-programs'}
          >
            <SidebarLabel>Programs</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/workout-programs/exercises"
            current={pathname === '/workout-programs/exercises'}
          >
            <SidebarLabel>Exercises</SidebarLabel>
          </SidebarItem>
        </div>
      </div>
    </div>
  );
}

function NutritionCollapsible({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 hover:bg-zinc-950/5 group"
      >
        <HeartIcon className="size-6 shrink-0 fill-zinc-500 sm:size-5 group-hover:fill-zinc-950" />
        <span className="flex-1">Nutrition Programs</span>
        <span className="ml-auto transition-transform duration-200 ease-in-out">
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-40 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-8 flex flex-col gap-0.5 mt-1">
          <SidebarItem
            href="/nutrition-programs/ingredients"
            current={pathname === '/nutrition-programs/ingredients'}
          >
            <SidebarLabel>Ingredients</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/nutrition-programs/meals"
            current={pathname === '/nutrition-programs/meals'}
          >
            <SidebarLabel>Meals</SidebarLabel>
          </SidebarItem>
          <SidebarItem
            href="/nutrition-programs"
            current={pathname === '/nutrition-programs'}
          >
            <SidebarLabel>Programs</SidebarLabel>
          </SidebarItem>
        </div>
      </div>
    </div>
  );
}


function ReportsCollapsible({ pathname }: { pathname: string }) {
  const [isOpen, setIsOpen] = useState(pathname.startsWith('/finance'))

  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 rounded-lg px-2 py-2.5 text-left text-base/6 font-medium text-zinc-950 sm:py-2 sm:text-sm/5 hover:bg-zinc-950/5 group"
      >
        <ChartBarIcon className="size-6 shrink-0 fill-zinc-500 sm:size-5 group-hover:fill-zinc-950" />
        <span className="flex-1">Reports</span>
        <span className="ml-auto transition-transform duration-200 ease-in-out">
          <ChevronDownIcon className={`w-4 h-4 transition-transform duration-200 ease-in-out ${isOpen ? 'rotate-180' : ''}`} />
        </span>
      </button>
      <div
        className={`overflow-hidden transition-all duration-200 ease-in-out ${
          isOpen ? 'max-h-32 opacity-100' : 'max-h-0 opacity-0'
        }`}
      >
        <div className="pl-8 flex flex-col gap-0.5 mt-1">
          <SidebarItem href="/finance" current={pathname.startsWith('/finance')}>
            <SidebarLabel>Finance</SidebarLabel>
          </SidebarItem>
        </div>
      </div>
    </div>
  )
}

function AccountDropdownMenu({ 
  anchor, 
  onSignOut 
}: { 
  anchor: 'top start' | 'bottom end'
  onSignOut: () => void
}) {
  return (
    <DropdownMenu className="min-w-64" anchor={anchor}>
      <DropdownItem href="/profile">
        <UserCircleIcon />
        <DropdownLabel>My account</DropdownLabel>
      </DropdownItem>
      <DropdownDivider />
      <DropdownItem onClick={onSignOut}>
        <ArrowRightStartOnRectangleIcon />
        <DropdownLabel>Sign out</DropdownLabel>
      </DropdownItem>
    </DropdownMenu>
  )
}

export function ApplicationLayout({
  events,
  children,
}: {
  events: Awaited<ReturnType<typeof getEvents>>
  children: React.ReactNode
}) {
  let pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [blocked, setBlocked] = useState<string | null>(null)

  useEffect(() => {
    const storedUser = getStoredUser()
    setUser(storedUser)
  }, [])

  // Immediate check on route changes
  useEffect(() => {
    const run = async () => {
      try {
        // Skip checks on auth pages EXCEPT the blocked page (we need to auto-exit when unblocked)
        if (pathname?.startsWith('/auth/') && !pathname?.startsWith('/auth/blocked')) return
        const storedUser = getStoredUser()
        if (!storedUser) return
        const targetId = storedUser.isTeamMember ? storedUser.trainerId : storedUser.id
        if (!targetId) return
        const res = await fetch(`/api/clients/profile/${targetId}`, { cache: 'no-store' })
        const data = await res.json().catch(() => ({}))

        // Hydrate local header with server truth (avoid stale placeholder "User/user@example.com")
        try {
          const hydrated = {
            ...storedUser,
            fullName: data?.fullName ?? storedUser.fullName,
            email: data?.email ?? storedUser.email,
          }
          setUser(hydrated)
          storeUser(hydrated, true)
        } catch {}
        const account = (data?.accountStatus || 'approved').toLowerCase()
        const status = (data?.subscriptionStatus || 'active').toLowerCase()
        let blockReason: string | null = null
        if (account !== 'approved') blockReason = `Your account is ${account === 'pending' ? 'under review' : 'rejected'}.`
        else if (status !== 'active') blockReason = `Your subscription is ${status}.`
        if (blockReason) {
          // If account status just changed in DB, avoid stale local cache causing loops
          try {
            const fresh = {
              ...storedUser,
              accountStatus: data?.accountStatus,
              subscriptionStatus: data?.subscriptionStatus,
            }
            storeUser(fresh, true)
            setUser(fresh)
          } catch {}
          const reason = encodeURIComponent(blockReason)
          const email = encodeURIComponent(storedUser.email || '')
          const kind = encodeURIComponent(account !== 'approved' ? `account_${account}` : `subscription_${status}`)
          if (!pathname?.startsWith('/auth/blocked')) {
            router.push(`/auth/blocked?reason=${reason}&email=${email}&kind=${kind}`)
          } else {
            // Already on blocked page; avoid repeated replace loops
            setBlocked(blockReason)
          }
        } else {
          // Clear any previous block state
          setBlocked(null)
          // If currently on blocked page and unblocked now, go home
          if (pathname?.startsWith('/auth/blocked')) router.push('/')
        }
      } catch {}
    }
    run()
    // Also re-check on window focus to reflect DB changes after refresh
    const onFocus = () => run()
    if (typeof window !== 'undefined') {
      window.addEventListener('focus', onFocus)
      document.addEventListener('visibilitychange', onFocus)
    }
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('focus', onFocus)
        document.removeEventListener('visibilitychange', onFocus)
      }
    }
  }, [pathname])

  // Disable periodic checks entirely to prevent refresh loops
  // useEffect(() => {}, [])

  const handleSignOut = () => {
    removeUser()
    router.push('/auth/register')
  }

  return (
    <SidebarLayout
      navbar={
        <Navbar>
          <NavbarSpacer />
          <NavbarSection>
            <Dropdown>
              <DropdownButton as={NavbarItem}>
                <Avatar initials={user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'} square />
              </DropdownButton>
              <AccountDropdownMenu anchor="bottom end" onSignOut={handleSignOut} />
            </Dropdown>
          </NavbarSection>
        </Navbar>
      }
      sidebar={
        <Sidebar>
          <SidebarHeader>
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <img src="/logo.png" alt="Logo" className="h-10 w-auto" />
                <ChevronDownIcon />
              </DropdownButton>
              <DropdownMenu className="min-w-80 lg:min-w-64" anchor="bottom start">
                <DropdownItem href="/settings">
                  <Cog8ToothIcon />
                  <DropdownLabel>Settings</DropdownLabel>
                </DropdownItem>
                {/* <DropdownDivider /> */}
                {/* <DropdownItem href="#">
                  <img slot="icon" src="/logo.svg" alt="Logo" className="h-5 w-auto" />
                </DropdownItem> */}
                {/* <DropdownItem href="#">
                  <Avatar slot="icon" initials="BE" className="bg-purple-500 text-white" />
                  <DropdownLabel>Big Events</DropdownLabel>
                </DropdownItem> */}
                {/* <DropdownDivider /> */}
                {/* <DropdownItem href="#">
                  <PlusIcon />
                  <DropdownLabel>New team&hellip;</DropdownLabel>
                </DropdownItem> */}
              </DropdownMenu>
            </Dropdown>
          </SidebarHeader>

          <SidebarBody>
            <SidebarSection>
              <SidebarItem href="/" current={pathname === '/'}>
                <HomeIcon />
                <SidebarLabel>Home</SidebarLabel>
              </SidebarItem>
              {/* Check-ins collapsible section */}
              <CheckInsCollapsible pathname={pathname} />
              <SidebarItem href="/packages" current={pathname.startsWith('/packages')}>
                <CurrencyDollarIcon />
                <SidebarLabel>Packages</SidebarLabel>
              </SidebarItem>
              <ClientsManagementCollapsible pathname={pathname} />
              <SidebarItem href="/team-members" current={pathname.startsWith('/team-members')}>
                <UserGroupIcon />
                <SidebarLabel>Team Members</SidebarLabel>
              </SidebarItem>
              <SidebarItem href="/tasks" current={pathname.startsWith('/tasks')}>
                <ClipboardDocumentListIcon />
                <SidebarLabel>Tasks</SidebarLabel>
                <TaskCounter trainerId={user?.id} />
              </SidebarItem>
              <SidebarItem href="/services" current={pathname.startsWith('/services')}>
                <SparklesIcon />
                <SidebarLabel>Services</SidebarLabel>
              </SidebarItem>
              {/* Workout Programs collapsible section */}
              <WorkoutProgramsCollapsible pathname={pathname} />
              {/* Nutrition Programs collapsible section */}
              <NutritionCollapsible pathname={pathname} />
              {/* Reports collapsible section */}
              <ReportsCollapsible pathname={pathname} />
              
              <SidebarItem href="/notifications" current={pathname === '/notifications'}>
                <BellIcon />
                <SidebarLabel>Notifications</SidebarLabel>
              </SidebarItem>
            </SidebarSection>

            <SidebarSection className="max-lg:hidden">
              {/* <SidebarHeading>Upcoming Events</SidebarHeading> */}
              {events.map((event) => (
                <SidebarItem key={event.id} href={event.url}>
                  {event.name}
                </SidebarItem>
              ))}
            </SidebarSection>

            <SidebarSpacer />

            <SidebarSection>
              <SidebarItem href="/support">
                <QuestionMarkCircleIcon />
                <SidebarLabel>Support</SidebarLabel>
              </SidebarItem>
            </SidebarSection>
          </SidebarBody>

          <SidebarFooter className="max-lg:hidden">
            <Dropdown>
              <DropdownButton as={SidebarItem}>
                <span className="flex min-w-0 items-center gap-3">
                  <Avatar initials={user?.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || 'U'} className="size-10" square alt="" />
                  <span className="min-w-0">
                    <span className="block truncate text-sm/5 font-medium text-zinc-950">
                      {user?.fullName || 'User'}
                    </span>
                    <span className="block truncate text-xs/5 font-normal text-zinc-500">
                      {user?.email || 'user@example.com'}
                    </span>
                  </span>
                </span>
                <ChevronUpIcon />
              </DropdownButton>
              <AccountDropdownMenu anchor="top start" onSignOut={handleSignOut} />
            </Dropdown>
          </SidebarFooter>
        </Sidebar>
      }
    >
      {children}
    </SidebarLayout>
  )
}
