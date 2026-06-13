'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import StatusBadge from '@/components/StatusBadge';
import {
  ChevronLeft, MapPin, Calendar, ClipboardList, Navigation,
  CheckCircle2, Clock, Pencil, Trash2, X,
} from '@/components/icons';

type JobStatus = 'scheduled' | 'in_progress' | 'completed' | 'cancelled';

interface StatusAction {
  next: JobStatus;
  label: string;
  variant: 'primary' | 'secondary' | 'ghost';
}

// Admin/manager: full control over the lifecycle
const adminStatusActions: Record<JobStatus, StatusAction[]> = {
  scheduled:   [{ next: 'in_progress', label: 'Start Job',     variant: 'primary' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  in_progress: [{ next: 'completed',   label: 'Mark Complete', variant: 'primary' }, { next: 'cancelled', label: 'Cancel', variant: 'ghost' }],
  completed:   [],
  cancelled:   [],
};

// Worker: can only move the job forward through its own lifecycle
const workerStatusActions: Record<JobStatus, StatusAction[]> = {
  scheduled:   [{ next: 'in_progress', label: 'Start Job', variant: 'primary' }],
  in_progress: [{ next: 'completed',   label: 'End Job',   variant: 'primary' }],
  completed:   [],
  cancelled:   [],
};

// ─── Worker: GPS check-in card ────────────────────────────────────────────────

function WorkerCheckInCard({ jobId }: { jobId: string }) {
  const currentUser = getStoredUser();
  const [status, setStatus]   = useState<'idle' | 'locating' | 'done' | 'error'>('idle');
  const [checkedIn, setCheckedIn] = useState<{ lat: number; lng: number; time: string } | null>(null);
  const [errMsg, setErrMsg]   = useState('');
  const queryClient = useQueryClient();

  // Has this worker already checked in for this job (e.g. from a previous session)?
  const { data: checkIns = [] } = useQuery({
    queryKey: ['check-ins', jobId],
    queryFn: () => api.get(`/api/check-ins/job/${jobId}`).then((r) => r.data),
  });
  const existing = (checkIns as any[]).find((c) => c.worker_email === currentUser?.email);
  const alreadyCheckedIn = status === 'done' || !!existing;
  const display = checkedIn ?? (existing
    ? {
        lat: existing.lat,
        lng: existing.lng,
        time: new Date(existing.checked_in_at).toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit', hour12: true }),
      }
    : null);

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
          // Check-in may have auto-started the job — refresh job + status actions
          queryClient.invalidateQueries({ queryKey: ['job', jobId] });
          queryClient.invalidateQueries({ queryKey: ['check-ins', jobId] });
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
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 60000 }
    );
  }

  return (
    <Card>
      <CardHeader title="Check In" subtitle="Confirm you have arrived at the job site" />
      <CardBody>
        {alreadyCheckedIn && display ? (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 text-emerald-600">
              <CheckCircle2 size={18} />
              <span className="text-sm font-semibold">Checked in</span>
            </div>
            <div className="rounded-lg bg-emerald-50 border border-emerald-100 px-4 py-3 space-y-1">
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <Clock size={12} /> {display.time}
              </div>
              <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                <MapPin size={12} /> {display.lat}, {display.lng}
              </div>
            </div>
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
              Tapping the button will request your GPS location, send it to your admin, and start the job timer.
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

// ─── Admin: reschedule (edit scheduled date/time) ─────────────────────────────

function RescheduleControl({ job, jobId }: { job: any; jobId: string }) {
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [value, setValue]     = useState(toDatetimeLocal(job.scheduled_at));

  const mutation = useMutation({
    mutationFn: (scheduled_at: string) =>
      api.patch(`/api/jobs/${jobId}`, {
        title: job.title,
        description: job.description,
        location_id: job.location_id,
        notes: job.notes,
        scheduled_at,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      setEditing(false);
    },
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <dd className="text-sm font-medium text-gray-900">
          {new Date(job.scheduled_at).toLocaleString('en-PK', {
            weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
          })}
        </dd>
        {(job.status === 'scheduled') && (
          <button
            onClick={() => { setValue(toDatetimeLocal(job.scheduled_at)); setEditing(true); }}
            className="text-gray-400 hover:text-indigo-600 transition-colors"
            title="Reschedule"
          >
            <Pencil size={13} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <input
        type="datetime-local"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        className="text-sm border border-gray-300 rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600"
      />
      <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate(value)}>
        Save
      </Button>
      <button onClick={() => setEditing(false)} className="text-gray-400 hover:text-gray-600">
        <X size={14} />
      </button>
    </div>
  );
}

// ─── Admin: job report link ───────────────────────────────────────────────────

function JobReportCard({ jobId, jobStatus }: { jobId: string; jobStatus: JobStatus }) {
  const { data: report } = useQuery({
    queryKey: ['report', 'job', jobId],
    queryFn: () => api.get(`/api/reports/job/${jobId}`).then((r) => r.data),
    enabled: jobStatus === 'completed',
  });

  return (
    <Card>
      <CardHeader title="Report" />
      <CardBody>
        {report ? (
          <Link
            href={`/reports/${report.id}`}
            className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
          >
            <ClipboardList size={15} />
            View / download report
          </Link>
        ) : jobStatus === 'completed' ? (
          <p className="text-sm text-gray-400">
            The worker hasn&apos;t submitted a report for this job yet.
          </p>
        ) : (
          <p className="text-sm text-gray-400">
            Report will be available once the job is completed.
          </p>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Worker: report status / fill / view ──────────────────────────────────────

function WorkerReportCard({ jobId }: { jobId: string }) {
  const { data: report } = useQuery({
    queryKey: ['report', 'job', jobId],
    queryFn: () => api.get(`/api/reports/job/${jobId}`).then((r) => r.data),
  });

  return (
    <Card>
      <CardHeader
        title="Job Report"
        subtitle={report ? 'Report submitted for this job' : 'This job is complete — fill out the fumigation report'}
      />
      <CardBody className="flex items-center gap-2">
        {report ? (
          <>
            <Link href={`/reports/${report.id}`}>
              <Button variant="secondary">
                <ClipboardList size={15} />
                View Report
              </Button>
            </Link>
            <Link href={`/jobs/${jobId}/report`}>
              <Button variant="ghost">Edit Report</Button>
            </Link>
          </>
        ) : (
          <Link href={`/jobs/${jobId}/report`}>
            <Button>
              <ClipboardList size={15} />
              Fill Report
            </Button>
          </Link>
        )}
      </CardBody>
    </Card>
  );
}

// ─── Admin: assigned workers (view + reassign) ────────────────────────────────

function AssignedWorkersCard({ job, jobId }: { job: any; jobId: string }) {
  const queryClient = useQueryClient();
  const currentUser = getStoredUser();
  const isWorker    = currentUser?.role === 'worker';
  const [editing, setEditing]   = useState(false);
  const [selected, setSelected] = useState<string[]>([]);

  const { data: allWorkers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/users?role=worker').then((r) => r.data),
    enabled: editing,
  });

  const mutation = useMutation({
    mutationFn: (worker_ids: string[]) => api.post(`/api/jobs/${jobId}/assign`, { worker_ids }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['job', jobId] });
      setEditing(false);
    },
  });

  function startEditing() {
    setSelected((job.workers ?? []).map((w: any) => w.id));
    setEditing(true);
  }

  function toggle(id: string) {
    setSelected((prev) => prev.includes(id) ? prev.filter((w) => w !== id) : [...prev, id]);
  }

  return (
    <Card>
      <CardHeader
        title="Assigned Workers"
        subtitle={`${(job.workers ?? []).length} assigned`}
        actions={!isWorker && !editing ? (
          <button onClick={startEditing} className="text-gray-400 hover:text-indigo-600 transition-colors" title="Reassign">
            <Pencil size={13} />
          </button>
        ) : undefined}
      />

      {editing ? (
        <CardBody className="space-y-3">
          {(allWorkers as any[]).length === 0 ? (
            <p className="text-sm text-gray-400">No workers available.</p>
          ) : (
            <div className="space-y-2 max-h-56 overflow-auto">
              {(allWorkers as any[]).map((w: any) => (
                <label key={w.id} className={[
                  'flex items-center gap-3 p-2.5 rounded-lg border cursor-pointer transition-colors',
                  selected.includes(w.id) ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300',
                ].join(' ')}>
                  <input
                    type="checkbox"
                    checked={selected.includes(w.id)}
                    onChange={() => toggle(w.id)}
                    className="text-indigo-600 focus:ring-indigo-600 rounded"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900">{w.name}</p>
                    <p className="text-xs text-gray-400">{w.email}</p>
                  </div>
                </label>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <Button size="sm" loading={mutation.isPending} onClick={() => mutation.mutate(selected)}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
              Cancel
            </Button>
          </div>
        </CardBody>
      ) : (job.workers ?? []).length === 0 ? (
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
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function JobDetailPage() {
  const { id }         = useParams<{ id: string }>();
  const router         = useRouter();
  const queryClient    = useQueryClient();
  const currentUser    = getStoredUser();
  const isWorker       = currentUser?.role === 'worker';
  const isAdmin        = currentUser?.role === 'admin';
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

  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/jobs/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      router.push('/jobs');
    },
    onError: () => setError('Failed to delete job. Please try again.'),
  });

  function handleDelete() {
    if (!job) return;
    if (!confirm(`Delete "${job.title}"? This cannot be undone.`)) return;
    deleteMutation.mutate();
  }

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

  const actions = (isWorker ? workerStatusActions : adminStatusActions)[job.status as JobStatus] ?? [];
  const duration = job.started_at && job.completed_at
    ? formatDuration(job.started_at, job.completed_at)
    : null;

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
          {isAdmin && (
            <Button
              variant="ghost"
              size="sm"
              loading={deleteMutation.isPending}
              onClick={handleDelete}
              className="text-red-600 hover:bg-red-50"
            >
              <Trash2 size={14} />
              Delete
            </Button>
          )}
        </div>
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
                <div>
                  <dt className="flex items-center gap-1.5 text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">
                    <span className="text-gray-300"><Calendar size={15} /></span>
                    Scheduled
                  </dt>
                  {isAdmin ? (
                    <RescheduleControl job={job} jobId={id} />
                  ) : (
                    <dd className="text-sm font-medium text-gray-900">
                      {new Date(job.scheduled_at).toLocaleString('en-PK', {
                        weekday: 'short', day: 'numeric', month: 'long', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true,
                      })}
                    </dd>
                  )}
                </div>
                {job.started_at && (
                  <InfoField icon={<Calendar size={15} />} label="Started" value={
                    new Date(job.started_at).toLocaleString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                  } />
                )}
                {job.completed_at && (
                  <InfoField icon={<Calendar size={15} />} label="Completed" value={
                    new Date(job.completed_at).toLocaleString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                      hour: '2-digit', minute: '2-digit', hour12: true,
                    })
                  } />
                )}
                {duration && (
                  <InfoField icon={<Clock size={15} />} label="Time Taken" value={duration} />
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

          {/* Worker check-in button — only while job is in progress */}
          {isWorker && job.status === 'in_progress' && <WorkerCheckInCard jobId={id} />}

          {/* Worker: prompt to fill report once job is done */}
          {isWorker && job.status === 'completed' && (
            <WorkerReportCard jobId={id} />
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">

          {/* Admin sees check-ins list */}
          {!isWorker && <AdminCheckInsCard jobId={id} />}

          <AssignedWorkersCard job={job} jobId={id} />

          {!isWorker && <JobReportCard jobId={id} jobStatus={job.status} />}
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

// "2026-06-20T02:47" — format expected by <input type="datetime-local">
function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatDuration(startIso: string, endIso: string): string {
  const ms = new Date(endIso).getTime() - new Date(startIso).getTime();
  const totalMinutes = Math.max(0, Math.round(ms / 60000));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  if (minutes === 0) return `${hours} hr`;
  return `${hours} hr ${minutes} min`;
}
