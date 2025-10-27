'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getStoredUser } from '@/lib/auth';
import {
  UsersIcon,
  CreditCardIcon,
  ClipboardDocumentListIcon,
  CurrencyDollarIcon,
  PlusIcon,
  UserPlusIcon,
  PlusCircleIcon,
  BoltIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  BellIcon,
  ChartBarIcon,
  TrendingUpIcon,
  TrendingDownIcon,
  FireIcon,
  HeartIcon,
  CheckIcon,
  ClockIcon,
  UserCircleIcon
} from '@heroicons/react/24/outline';
import { PieChart } from '@/components/pie-chart';

interface DashboardData {
  keyMetrics: {
    totalClients: number;
    activeSubscriptions: number;
    pendingTasks: number;
    monthlyRevenue: number;
  };
  genderDistribution: Array<{ gender: string; _count: { gender: number } }>;
  packagesOverview: Array<{ packageId: number | null; packageName: string; clientCount: number }>;
  recentActivity: {
    checkins: any[];
    leads: any[];
    tasks: any[];
  };
  upcomingAlerts: {
    renewals: any[];
    clientsNeedingFollowup: any[];
    uncompletedTasks: any[];
    newLeads: any[];
  };
  quickStats: {
    totalLeads: number;
    checkinsThisWeek: number;
    totalTeamMembers: number;
    activePrograms: number;
    activeForms: number;
  };
  analytics: {
    clientGrowth: Array<{ month: string; count: number }>;
    subscriptionStatus: Array<{ paymentStatus: string; _count: { paymentStatus: number } }>;
    revenueComparison: { current: number; previous: number };
  };
  workflowStats: {
    totalWorkflows: number;
    recentExecutions: any[];
  };
}

export default function HomePage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = getStoredUser();
    setUser(currentUser);
    
    if (currentUser) {
      fetchDashboardData(currentUser.id);
    }
  }, []);

  const fetchDashboardData = async (trainerId: number) => {
    try {
      const response = await fetch(`/api/dashboard/stats?trainerId=${trainerId}`);
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-6">
        <p className="text-zinc-600">Failed to load dashboard data.</p>
      </div>
    );
  }

  const revenueChange = data.analytics.revenueComparison.previous > 0
    ? ((data.analytics.revenueComparison.current - data.analytics.revenueComparison.previous) / data.analytics.revenueComparison.previous) * 100
    : 0;

  const genderMaleCount = data.genderDistribution.find(g => g.gender === 'Male')?._count.gender || 0;
  const genderFemaleCount = data.genderDistribution.find(g => g.gender === 'Female')?._count.gender || 0;
  const genderTotal = genderMaleCount + genderFemaleCount;
  const genderMalePercent = genderTotal > 0 ? (genderMaleCount / genderTotal) * 100 : 0;
  const genderFemalePercent = genderTotal > 0 ? (genderFemaleCount / genderTotal) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900">Dashboard</h1>
          <p className="text-sm text-zinc-600 mt-1">Welcome back, {user?.fullName || 'Trainer'}</p>
        </div>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Total Clients"
          value={data.keyMetrics.totalClients}
          icon={UsersIcon}
          iconColor="text-blue-600"
          bgColor="bg-blue-50"
        />
        <MetricCard
          title="Active Subscriptions"
          value={data.keyMetrics.activeSubscriptions}
          icon={CreditCardIcon}
          iconColor="text-green-600"
          bgColor="bg-green-50"
        />
        <MetricCard
          title="Pending Tasks"
          value={data.keyMetrics.pendingTasks}
          icon={ClipboardDocumentListIcon}
          iconColor="text-orange-600"
          bgColor="bg-orange-50"
        />
        <MetricCard
          title="Revenue (This Month)"
          value={`$${data.keyMetrics.monthlyRevenue.toFixed(2)}`}
          icon={CurrencyDollarIcon}
          iconColor="text-purple-600"
          bgColor="bg-purple-50"
          subtitle={revenueChange !== 0 && `${revenueChange > 0 ? '+' : ''}${revenueChange.toFixed(1)}% vs last month`}
        />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <ActionButton
            label="Add Client"
            icon={UserPlusIcon}
            onClick={() => router.push('/clients/create')}
          />
          <ActionButton
            label="Add Lead"
            icon={PlusIcon}
            onClick={() => router.push('/leads')}
          />
          <ActionButton
            label="Create Task"
            icon={ClipboardDocumentListIcon}
            onClick={() => router.push('/tasks')}
          />
          <ActionButton
            label="New Workflow"
            icon={BoltIcon}
            onClick={() => router.push('/workflows')}
          />
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Charts Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Client Gender Distribution */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Client Demographics</h2>
              {genderTotal > 0 ? (
                <div className="flex items-center justify-center">
                  <PieChart
                    data={[
                      { label: 'Male', value: genderMaleCount, color: '#2563eb' },
                      { label: 'Female', value: genderFemaleCount, color: '#ec4899' }
                    ]}
                    size={140}
                  />
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No gender data available yet</p>
              )}
            </div>

            {/* Packages Overview */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-zinc-900 mb-4">Packages Overview</h2>
              {data.packagesOverview.length > 0 ? (
                <div className="flex items-center justify-center">
                  <PieChart
                    data={data.packagesOverview.map((pkg, index) => {
                      const colors = ['#2563eb', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#14b8a6', '#f97316'];
                      return {
                        label: pkg.packageName,
                        value: pkg.clientCount,
                        color: colors[index % colors.length]
                      };
                    })}
                    size={140}
                  />
                </div>
              ) : (
                <p className="text-sm text-zinc-500 text-center py-4">No packages with clients yet</p>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {data.recentActivity.checkins.slice(0, 3).map((checkin, index) => 
                checkin.client ? (
                  <ActivityItem
                    key={index}
                    icon={CheckIcon}
                    iconColor="text-green-600"
                    title={`${checkin.client.fullName} completed check-in`}
                    subtitle={checkin.form?.name || 'Check-in'}
                    time={new Date(checkin.submittedAt).toLocaleDateString()}
                  />
                ) : null
              )}
              {data.recentActivity.leads.slice(0, 2).map((lead, index) => (
                <ActivityItem
                  key={index}
                  icon={UserPlusIcon}
                  iconColor="text-blue-600"
                  title={`New lead: ${lead.fullName || 'Unknown'}`}
                  subtitle={lead.email || ''}
                  time={new Date(lead.createdAt).toLocaleDateString()}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - 1/3 */}
        <div className="space-y-6">
          {/* Upcoming & Alerts */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Upcoming & Alerts</h2>
            <div className="space-y-4">
              {data.upcomingAlerts.renewals.length > 0 && (
                <AlertSection
                  icon={CalendarDaysIcon}
                  iconColor="text-orange-600"
                  title={`${data.upcomingAlerts.renewals.length} Renewals This Month`}
                  items={data.upcomingAlerts.renewals.slice(0, 3).map(r => ({
                    name: r.client.fullName,
                    detail: r.package.name
                  }))}
                />
              )}
              {data.upcomingAlerts.clientsNeedingFollowup.length > 0 && (
                <AlertSection
                  icon={ExclamationTriangleIcon}
                  iconColor="text-yellow-600"
                  title={`${data.upcomingAlerts.clientsNeedingFollowup.length} Clients Need Follow-up`}
                  items={data.upcomingAlerts.clientsNeedingFollowup.slice(0, 3).map(c => ({
                    name: c.fullName,
                    detail: 'No check-in in 30 days'
                  }))}
                />
              )}
              {data.upcomingAlerts.uncompletedTasks.length > 0 && (
                <AlertSection
                  icon={ClipboardDocumentListIcon}
                  iconColor="text-red-600"
                  title={`${data.upcomingAlerts.uncompletedTasks.length} Open Tasks`}
                  items={data.upcomingAlerts.uncompletedTasks
                    .filter(t => t.client) // Only show tasks with clients
                    .slice(0, 3)
                    .map(t => ({
                      name: t.client?.fullName || 'Unknown',
                      detail: t.title
                    }))}
                />
              )}
              {data.upcomingAlerts.newLeads.length > 0 && (
                <AlertSection
                  icon={BellIcon}
                  iconColor="text-blue-600"
                  title={`${data.upcomingAlerts.newLeads.length} New Leads`}
                  items={data.upcomingAlerts.newLeads.slice(0, 3).map(l => ({
                    name: l.fullName,
                    detail: l.email
                  }))}
                />
              )}
              {data.upcomingAlerts.renewals.length === 0 && 
               data.upcomingAlerts.clientsNeedingFollowup.length === 0 && 
               data.upcomingAlerts.uncompletedTasks.length === 0 && 
               data.upcomingAlerts.newLeads.length === 0 && (
                <p className="text-sm text-zinc-500 text-center py-4">No alerts at this time</p>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-semibold text-zinc-900 mb-4">Quick Stats</h2>
            <div className="space-y-3">
              <StatRow label="Total Leads" value={data.quickStats.totalLeads} icon={UsersIcon} />
              <StatRow label="Check-ins This Week" value={data.quickStats.checkinsThisWeek} icon={CheckIcon} />
              <StatRow label="Team Members" value={data.quickStats.totalTeamMembers} icon={UserCircleIcon} />
              <StatRow label="Active Programs" value={data.quickStats.activePrograms} icon={FireIcon} />
              <StatRow label="Active Forms" value={data.quickStats.activeForms} icon={ClipboardDocumentListIcon} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Component: Metric Card
function MetricCard({ 
  title, 
  value, 
  icon: Icon, 
  iconColor, 
  bgColor,
  subtitle 
}: {
  title: string;
  value: string | number;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  subtitle?: string;
}) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-zinc-600">{title}</p>
          <p className="text-2xl font-bold text-zinc-900 mt-1">{value}</p>
          {subtitle && (
            <p className="text-xs text-zinc-500 mt-1">{subtitle}</p>
          )}
        </div>
        <div className={`${bgColor} p-3 rounded-lg`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>
      </div>
    </div>
  );
}

// Component: Action Button
function ActionButton({ 
  label, 
  icon: Icon, 
  onClick 
}: {
  label: string;
  icon: React.ElementType;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 p-3 bg-zinc-50 hover:bg-zinc-100 rounded-lg transition-colors text-left"
    >
      <Icon className="w-5 h-5 text-zinc-700" />
      <span className="text-sm font-medium text-zinc-700">{label}</span>
    </button>
  );
}

// Component: Activity Item
function ActivityItem({ 
  icon: Icon, 
  iconColor, 
  title, 
  subtitle, 
  time 
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  subtitle: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`${iconColor} p-2 bg-zinc-50 rounded-lg`}>
        <Icon className="w-4 h-4" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-medium text-zinc-900">{title}</p>
        <p className="text-xs text-zinc-600">{subtitle}</p>
        <p className="text-xs text-zinc-500 mt-1">{time}</p>
      </div>
    </div>
  );
}

// Component: Alert Section
function AlertSection({ 
  icon: Icon, 
  iconColor, 
  title, 
  items 
}: {
  icon: React.ElementType;
  iconColor: string;
  title: string;
  items: Array<{ name: string; detail: string }>;
}) {
  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <Icon className={`w-5 h-5 ${iconColor}`} />
        <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
      </div>
      <div className="space-y-2 pl-7">
        {items.map((item, index) => (
          <div key={index} className="text-sm">
            <p className="font-medium text-zinc-900">{item.name}</p>
            <p className="text-zinc-600">{item.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component: Stat Row
function StatRow({ 
  label, 
  value, 
  icon: Icon 
}: {
  label: string;
  value: number;
  icon: React.ElementType;
}) {
  return (
    <div className="flex items-center justify-between p-2">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-zinc-500" />
        <span className="text-sm text-zinc-700">{label}</span>
      </div>
      <span className="text-sm font-semibold text-zinc-900">{value}</span>
    </div>
  );
}
