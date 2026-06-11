'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import StatusBadge from '@/components/StatusBadge';
import { ChevronLeft, MapPin, Calendar, Users, ClipboardList, Navigation, CheckCircle2, Clock } from '@/components/icons';

type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

const statusActions: Record<JobStatus, { next: JobStatus; label: string; variant: 'primary' | 'secondary' | 'ghost' }[]> = {
  scheduled:   [{ next: 'in_progress', label: 'Start Job',     variant: 'primary' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  in_progress: [{ next: 'completed',   label: 'Mark Complete', variant: 'primary' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  completed:   [],
  cancelled:   [],
};

// ─── Worker: GPS check-in card ────────────────────────────────────────────────

function WorkerCheckInCard({ jobId }: { jobId: string }) {
  const [status, setStatus]   = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [checkedIn, setCheckedIn] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [errMsg, setErrMsg]   = useState('');

  function handleCheckIn() {
    if (!navigator.geolocation) {
      setErrMsg('Your browser does not support GPS location.');
      setStatus('error');
      return;
    }
    setStatus('locating');
    setErrMsg('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = parseFloat(pos.coords.latitude.toFixed(6));
        const lng = parseFloat(pos.coords.longitude.toFixed(6));
        try {
          await api.post('/api/check-ins', { job_id: jobId, lat, lng });
          setCheckedIn({ lat, lng, time: new Date().toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }) });
          setStatus('done');
        } catch {
          setErrMsg('Failed to send check-in. Try again.');
          setStatus('error');
        }
      },
      (err) => {
        setErrMsg(
          err.code === 1
            ? 'Location permission denied. Please allow GPS in your browser.'
            : 'Could not get your location. Make sure GPS is enabled.'
        );
        setStatus('error');
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  return (
    <Card>
      <CardHeader title="Check In" subtitle="Confirm you have arrived at the job site" />
      <CardBody>
        {status === 'done' && checkedIn ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={18} />
              <span className="text-sm font-semibold">Checked in successfully</span>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <Clock size={12} /> {checkedIn.time}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <MapPin size={12} /> {checkedIn.lat}, {checkedIn.lng}
              </div>
            </div>
            <button
              onClick={handleCheckIn}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium text-left"
            >
              Update my location
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            {errMsg && (
              <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {errMsg}
              </p>
            )}
            <Button
              onClick={handleCheckIn}
              loading={status === 'locating'}
              disabled={status === 'locating'}
            >
              <Navigation size={15} />
              {status === 'locating' ? 'Getting your location…' : 'Check In Here'}
            </Button>
            <p className="text-xs text-gray-400">
              Tapping the button will request your GPS location and send it to your admin.
            </p>
          </div>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Admin: check-ins list card ───────────────────────────────────────────────

function AdminCheckInsCard({ jobId }: { jobId: string }) {
  const { data: checkIns = [], isLoading } = useQuery({
    queryKey: ['check-ins', jobId],
    queryFn: () => api.get(`/api/check-ins/job/${jobId}`).then((r) => r.data),
    refetchInterval: 30_000, // auto-refresh every 30 s
  });

  return (
    <Card>
      <CardHeader
        title="Worker Check-ins"
        subtitle="GPS locations sent by workers on-site"
      />
      <CardBody>
        {isLoading ? (
          <div className="space-y-2">
            {[1, 2].map((i) => <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />)}
          </div>
        ) : (checkIns as any[]).length === 0 ? (
          <p className="text-sm text-gray-400">No workers have checked in yet.</p>
        ) : (
          <ul className="space-y-3">
            {(checkIns as any[]).map((ci: any) => (
              <li key={ci.id} className="rounded-lg bg-gray-50 border border-gray-100 px-4 py-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-bold text-indigo-700">
                        {ci.worker_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{ci.worker_name}</p>
                      <p className="text-xs text-gray-400 truncate">{ci.worker_email}</p>
                    </div>
                  </div>
                  <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex-shrink-0">
                    <CheckCircle2 size={11} /> On site
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock size={11} />
                    {new Date(ci.checked_in_at).toLocaleString('en-PK', {
                      day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })}
                  </span>
                  {ci.lat && ci.lng && (
                    <a
                      href={`https://maps.google.com/maps?q=${ci.lat},${ci.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                      <MapPin size={11} />
                      {ci.lat}, {ci.lng} — View on map
                    </a>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const currentUser    = getStoredUser();
  const isWorker       = currentUser?.role === 'worker';
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

  const actions = isWorker ? [] : (statusActions[job.status as JobStatus] ?? []);

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

      {/* Main grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Left: job details */}
        <div className="xl:col-span-2 space-y-5">
          <Card>
            <CardHeader title="Job Details" />
            <CardBody>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <InfoField icon={<MapPin size={15} />} label="Location" value={job.location_name ?? '—'} />
                <InfoField
                  icon={<Calendar size={15} />}
                  label="Scheduled"
                  value={new Date(job.scheduled_at).toLocaleString('en-PK', {
                    weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                    hour: '2-digit', minute: '2-digit', hour12: true,
                  })}
                />
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

          {/* Worker check-in button — only for workers */}
          {isWorker && <WorkerCheckInCard jobId={id} />}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Admin sees check-ins list */}
          {!isWorker && <AdminCheckInsCard jobId={id} />}

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

          {!isWorker && (
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
          )}
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
