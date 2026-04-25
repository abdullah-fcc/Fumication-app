'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import StatusBadge from '@/components/StatusBadge';
import { ChevronLeft, MapPin, Calendar, Users, ClipboardList, User } from '@/components/icons';

type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const statusActions: Record<JobStatus, { next: JobStatus; label: string; variant: 'primary' | 'secondary' | 'ghost' }[]> = {
  scheduled:   [{ next: 'in_progress', label: 'Start Job',    variant: 'primary'   }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  in_progress: [{ next: 'completed',   label: 'Mark Complete', variant: 'primary'  }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  completed:   [],
  cancelled:   [],
};

export default function JobDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const [error, setError] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/api/jobs/${id}`).then((r) => r.data),
  });

  const statusMutation = useMutation({
    mutationFn: (status: JobStatus) =>
      api.patch(`/api/jobs/${id}/status`, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', id] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setError('');
    },
    onError: () => setError('Failed to update status. Please try again.'),
  });

  if (isLoading) {
    return (
      <div className="space-y-5">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          <div className="xl:col-span-2 h-64 bg-gray-100 rounded-xl animate-pulse" />
          <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="text-center py-20">
        <p className="text-sm text-gray-500">Job not found.</p>
        <Link href="/jobs" className="text-indigo-600 text-sm mt-2 inline-block">Back to jobs</Link>
      </div>
    );
  }

  const actions = statusActions[job.status as JobStatus] ?? [];

  return (
    <div className="space-y-5">
      {/* Back + title row */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-semibold text-gray-900">{job.title}</h1>
              <StatusBadge status={job.status} />
            </div>
            <p className="text-sm text-gray-400 mt-0.5">
              {job.location_name ?? 'No location assigned'}
            </p>
          </div>
        </div>

        {/* Status action buttons */}
        {actions.length > 0 && (
          <div className="flex items-center gap-2">
            {error && <p className="text-xs text-red-500">{error}</p>}
            {actions.map(({ next, label, variant }) => (
              <Button
                key={next}
                variant={variant}
                size="sm"
                loading={statusMutation.isPending}
                onClick={() => statusMutation.mutate(next)}
              >
                {label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: Job details */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Job Details" />
            <CardBody>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField icon={<MapPin size={15} />} label="Location" value={job.location_name ?? '—'} />
                <InfoField icon={<Calendar size={15} />} label="Scheduled" value={
                  new Date(job.scheduled_at).toLocaleDateString('en-PK', {
                    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                  })
                } />
                {job.started_at && (
                  <InfoField icon={<Calendar size={15} />} label="Started" value={
                    new Date(job.started_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  } />
                )}
                {job.completed_at && (
                  <InfoField icon={<Calendar size={15} />} label="Completed" value={
                    new Date(job.completed_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })
                  } />
                )}
                {job.address && (
                  <InfoField icon={<MapPin size={15} />} label="Address" value={job.address} />
                )}
              </dl>

              {job.description && (
                <div className="mt-5 pt-5 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Description</p>
                  <p className="text-sm text-gray-700">{job.description}</p>
                </div>
              )}

              {job.notes && (
                <div className="mt-4 pt-4 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">Notes</p>
                  <p className="text-sm text-gray-700">{job.notes}</p>
                </div>
              )}
            </CardBody>
          </Card>

          {/* Location info */}
          {(job.lat || job.geo_fence_radius) && (
            <Card>
              <CardHeader title="Location Info" />
              <CardBody>
                <dl className="grid grid-cols-2 gap-4">
                  {job.lat && <InfoField icon={<MapPin size={15} />} label="Coordinates" value={`${job.lat}, ${job.lng}`} />}
                  {job.geo_fence_radius && <InfoField icon={<MapPin size={15} />} label="Geo-fence radius" value={`${job.geo_fence_radius}m`} />}
                </dl>
              </CardBody>
            </Card>
          )}
        </div>

        {/* Right: Workers + report link */}
        <div className="space-y-5">
          <Card>
            <CardHeader
              title="Assigned Workers"
              subtitle={`${(job.workers ?? []).length} assigned`}
            />
            {(job.workers ?? []).length === 0 ? (
              <CardBody>
                <p className="text-sm text-gray-400">No workers assigned yet.</p>
              </CardBody>
            ) : (
              <ul className="divide-y divide-gray-50">
                {(job.workers as any[]).map((w: any) => (
                  <li key={w.id} className="flex items-center gap-3 px-5 py-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">
                        {w.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{w.name}</p>
                      <p className="text-xs text-gray-400 truncate">{w.email}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card>
            <CardHeader title="Report" />
            <CardBody>
              {job.status === 'completed' ? (
                <Link
                  href={`/reports?job=${id}`}
                  className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  <ClipboardList size={15} />
                  View job report
                </Link>
              ) : (
                <p className="text-sm text-gray-400">
                  Report will be available once the job is completed.
                </p>
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoField({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div>
      <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
        <span className="text-gray-300">{icon}</span>
        {label}
      </dt>
      <dd className="text-sm font-medium text-gray-900">{value}</dd>
    </div>
  );
}
