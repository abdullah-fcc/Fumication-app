'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Briefcase, CheckCircle2, Users, AlertTriangle, Clock } from '@/components/icons';
import api from '@/lib/api';
import StatusBadge from '@/components/StatusBadge';

// ─── Metric card (top row) ────────────────────────────────────────────────────
function MetricCard({
  title, value, sub, subColor = 'text-gray-400', icon, children,
}: {
  title: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm flex flex-col gap-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 leading-none">{value}</p>
          {sub && <p className={`text-xs mt-1.5 font-medium ${subColor}`}>{sub}</p>}
        </div>
        <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
          {icon}
        </div>
      </div>
      {children}
    </div>
  );
}

// ─── Mini bar (used inside cards) ─────────────────────────────────────────────
function MiniBar({ label, count, total, color }: {
  label: string; count: number; total: number; color: string;
}) {
  // Use fixed Tailwind width steps — avoids any inline style for width
  const pct   = total > 0 ? Math.round((count / total) * 100) : 0;
  // Map to nearest 10% Tailwind class
  const steps = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
  const nearest = steps.reduce((a, b) => Math.abs(b - pct) < Math.abs(a - pct) ? b : a, 0);
  const widthMap: Record<number, string> = {
    0: 'w-0', 10: 'w-[10%]', 20: 'w-1/5', 30: 'w-[30%]', 40: 'w-2/5',
    50: 'w-1/2', 60: 'w-3/5', 70: 'w-[70%]', 80: 'w-4/5', 90: 'w-[90%]', 100: 'w-full',
  };

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className="text-gray-500">{label}</span>
        <span className="font-semibold text-gray-700">{count}</span>
      </div>
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} ${widthMap[nearest] ?? 'w-0'}`} />
      </div>
    </div>
  );
}

// ─── CSS-only ring indicator ──────────────────────────────────────────────────
function RingIndicator({ value, label }: { value: number; label: string }) {
  return (
    <div className="flex flex-col items-center gap-2">
      <div className="ring-track">
        <div className="ring-fill" />
        <span className="text-base font-bold text-gray-900 relative z-10">{value}</span>
      </div>
      <p className="text-xs text-gray-400 text-center">{label}</p>
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function RowSkeleton({ count }: { count: number }) {
  return (
    <div className="divide-y divide-gray-50">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center justify-between px-5 py-3.5">
          <div className="space-y-1.5">
            <div className="h-3 w-40 bg-gray-100 rounded animate-pulse" />
            <div className="h-2.5 w-28 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="h-5 w-20 bg-gray-100 rounded-full animate-pulse" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="py-10 text-center">
      <p className="text-sm text-gray-400">{message}</p>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { data: jobs = [], isLoading: jobsLoading } = useQuery({
    queryKey: ['jobs'],
    queryFn: () => api.get('/api/jobs').then((r) => r.data),
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/users?role=worker').then((r) => r.data),
  });

  const { data: lowStock = [], isLoading: stockLoading } = useQuery({
    queryKey: ['low-stock'],
    queryFn: () => api.get('/api/inventory/low-stock').then((r) => r.data),
  });

  const total      = (jobs as any[]).length;
  const scheduled  = (jobs as any[]).filter((j) => j.status === 'scheduled').length;
  const inProgress = (jobs as any[]).filter((j) => j.status === 'in_progress').length;
  const completed  = (jobs as any[]).filter((j) => j.status === 'completed').length;

  const recentJobs = [...(jobs as any[])]
    .sort((a, b) => new Date(b.scheduled_at).getTime() - new Date(a.scheduled_at).getTime())
    .slice(0, 6);

  return (
    <div>
      {/* ── Top metrics row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5 mb-5">

        {/* Card 1 — Total Jobs */}
        <MetricCard
          title="Total Jobs"
          value={total}
          sub={scheduled > 0 ? `${scheduled} scheduled` : 'No upcoming jobs'}
          subColor={scheduled > 0 ? 'text-indigo-600' : 'text-gray-400'}
          icon={<Briefcase size={20} />}
        >
          <div className="space-y-2 pt-1">
            <MiniBar label="Scheduled"   count={scheduled}  total={total} color="bg-indigo-500" />
            <MiniBar label="In Progress" count={inProgress} total={total} color="bg-amber-400" />
            <MiniBar label="Completed"   count={completed}  total={total} color="bg-emerald-400" />
          </div>
        </MetricCard>

        {/* Card 2 — Completed */}
        <MetricCard
          title="Completed Jobs"
          value={completed}
          sub={total > 0 ? `of ${total} total` : 'No jobs yet'}
          subColor="text-emerald-600"
          icon={<CheckCircle2 size={20} />}
        >
          <div className="flex items-center justify-between pt-1">
            <div className="space-y-1">
              <p className="text-xs text-gray-400">In Progress</p>
              <p className="text-xl font-bold text-amber-500">{inProgress}</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <div className="space-y-1">
              <p className="text-xs text-gray-400">Scheduled</p>
              <p className="text-xl font-bold text-indigo-600">{scheduled}</p>
            </div>
            <div className="w-px h-10 bg-gray-100" />
            <RingIndicator value={workers.length} label="Workers" />
          </div>
        </MetricCard>

        {/* Card 3 — Low Stock */}
        <MetricCard
          title="Low Stock Alerts"
          value={(lowStock as any[]).length}
          sub={(lowStock as any[]).length > 0 ? 'Items need restock' : 'All stock healthy'}
          subColor={(lowStock as any[]).length > 0 ? 'text-red-500' : 'text-emerald-600'}
          icon={<AlertTriangle size={20} />}
        >
          <div className="space-y-2 pt-1">
            {stockLoading ? (
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
            ) : (lowStock as any[]).length === 0 ? (
              <p className="text-xs text-gray-400">No alerts right now.</p>
            ) : (
              (lowStock as any[]).slice(0, 3).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between text-xs">
                  <span className="text-gray-600 truncate max-w-[60%]">{item.name}</span>
                  <span className="font-semibold text-red-500 flex-shrink-0">
                    {item.quantity} {item.unit}
                  </span>
                </div>
              ))
            )}
          </div>
        </MetricCard>
      </div>

      {/* ── Bottom section ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Recent Jobs — takes 2 columns */}
        <section className="xl:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">Recent Jobs</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest scheduled activity</p>
            </div>
            <Link href="/jobs" className="text-xs text-indigo-600 hover:text-indigo-700 font-medium">
              View all
            </Link>
          </div>

          {jobsLoading ? (
            <RowSkeleton count={5} />
          ) : recentJobs.length === 0 ? (
            <EmptyState message="No jobs scheduled yet." />
          ) : (
            <div className="divide-y divide-gray-50">
              {/* Table header */}
              <div className="grid grid-cols-12 px-5 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wide">
                <span className="col-span-5">Job</span>
                <span className="col-span-3">Location</span>
                <span className="col-span-2">Date</span>
                <span className="col-span-2 text-right">Status</span>
              </div>
              {recentJobs.map((job: any) => (
                <div
                  key={job.id}
                  className="grid grid-cols-12 items-center px-5 py-3 hover:bg-gray-50 transition-colors"
                >
                  <div className="col-span-5 min-w-0 pr-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{job.title}</p>
                  </div>
                  <div className="col-span-3 min-w-0 pr-3">
                    <p className="text-xs text-gray-500 truncate">{job.location_name ?? '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-xs text-gray-500">
                      {new Date(job.scheduled_at).toLocaleDateString('en-PK', {
                        day: 'numeric', month: 'short',
                      })}
                    </p>
                  </div>
                  <div className="col-span-2 flex justify-end">
                    <StatusBadge status={job.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Right column — Workers + Low Stock cards stacked */}
        <div className="flex flex-col gap-5">

          {/* Workers card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Workers</p>
                <p className="text-3xl font-bold text-gray-900">{workers.length}</p>
                <p className="text-xs text-indigo-600 font-medium mt-1">Field staff</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Users size={20} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex-1 h-1.5 bg-indigo-100 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-600 w-full rounded-full" />
              </div>
              <span className="text-xs text-gray-400 flex-shrink-0">Active</span>
            </div>
          </div>

          {/* Pending jobs card */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Pending</p>
                <p className="text-3xl font-bold text-gray-900">{scheduled + inProgress}</p>
                <p className="text-xs text-amber-500 font-medium mt-1">Need attention</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-500">
                <Clock size={20} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-indigo-600">{scheduled}</p>
                <p className="text-xs text-gray-400 mt-0.5">Scheduled</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3 text-center">
                <p className="text-lg font-bold text-amber-500">{inProgress}</p>
                <p className="text-xs text-gray-400 mt-0.5">In Progress</p>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
