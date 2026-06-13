'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import StatusBadge from '@/components/StatusBadge';
import { Plus, Search, Briefcase, Clock } from '@/components/icons';

export default function JobsPage() {
  const [search, setSearch]             = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const currentUser = getStoredUser();
  const isWorker    = currentUser?.role === 'worker';

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: isWorker ? ['jobs', 'worker', currentUser?.id] : ['jobs'],
    queryFn: () =>
      api
        .get(isWorker ? `/api/jobs?worker_id=${currentUser?.id}` : '/api/jobs')
        .then((r) => r.data),
  });

  const filtered = (jobs as any[]).filter((job) => {
    const matchSearch =
      job.title.toLowerCase().includes(search.toLowerCase()) ||
      job.location_name?.toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter ? job.status === statusFilter : true;
    return matchSearch && matchStatus;
  });

  return (
    <div>
      <PageHeader
        title={isWorker ? 'My Jobs' : 'Jobs'}
        subtitle={
          isWorker
            ? 'Your assigned fumigation tasks'
            : 'Schedule and manage fumigation tasks'
        }
        actions={
          !isWorker ? (
            <Link href="/jobs/new">
              <Button size="sm">
                <Plus size={15} />
                New Job
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card>
        <div className="fg-filters">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs or locations…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 bg-white"
          >
            <option value="">All statuses</option>
            <option value="scheduled">Scheduled</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} result{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="fg-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Location</th>
              <th>{isWorker ? 'Deadline / Time' : 'Scheduled'}</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows rows={5} cols={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<Briefcase size={22} />}
                    title="No jobs found"
                    subtitle={
                      search || statusFilter
                        ? 'Try adjusting your filters'
                        : isWorker
                        ? 'You have no assigned jobs yet'
                        : 'Create your first job to get started'
                    }
                    action={
                      !isWorker && !search && !statusFilter ? (
                        <Link href="/jobs/new">
                          <Button size="sm" variant="secondary">
                            <Plus size={14} /> New Job
                          </Button>
                        </Link>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((job: any) => (
                <tr key={job.id}>
                  <td>
                    <p className="font-medium text-gray-900">{job.title}</p>
                    {job.description && (
                      <p className="text-xs text-gray-400 mt-0.5 truncate max-w-xs">
                        {job.description}
                      </p>
                    )}
                  </td>
                  <td className="text-gray-500">{job.location_name ?? '—'}</td>
                  <td>
                    {isWorker ? (
                      <div className="flex flex-col gap-0.5">
                        <span className="font-medium text-gray-900 whitespace-nowrap">
                          {new Date(job.scheduled_at).toLocaleDateString('en-PK', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                        </span>
                        <span className="inline-flex items-center gap-1 text-xs text-indigo-600 font-medium">
                          <Clock size={11} />
                          {new Date(job.scheduled_at).toLocaleTimeString('en-PK', {
                            hour: '2-digit', minute: '2-digit', hour12: true,
                          })}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-500 whitespace-nowrap">
                        {new Date(job.scheduled_at).toLocaleDateString('en-PK', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })}
                      </span>
                    )}
                  </td>
                  <td>
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="text-right">
                    <Link
                      href={`/jobs/${job.id}`}
                      className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
