'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { Select } from '@/components/ui/Select';
import { ChevronLeft } from '@/components/icons';

interface FormState {
  title: string;
  description: string;
  location_id: string;
  scheduled_at: string;
  notes: string;
  worker_ids: string[];
}

interface FormErrors {
  title?: string;
  location_id?: string;
  scheduled_at?: string;
  general?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.title.trim())     errors.title        = 'Job title is required.';
  if (!form.scheduled_at)     errors.scheduled_at = 'Scheduled date is required.';
  return errors;
}

export default function NewJobPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm]     = useState<FormState>({
    title: '', description: '', location_id: '',
    scheduled_at: '', notes: '', worker_ids: [],
  });
  const [errors, setErrors] = useState<FormErrors>({});

  const { data: locations = [] } = useQuery({
    queryKey: ['locations'],
    queryFn: () => api.get('/api/locations').then((r) => r.data),
  });

  const { data: workers = [] } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/users?role=worker').then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: FormState) => api.post('/api/jobs', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs'] });
      router.push('/jobs');
    },
    onError: (err: any) => {
      setErrors({ general: err.response?.data?.error ?? 'Failed to create job.' });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validation = validate(form);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }
    setErrors({});
    createMutation.mutate(form);
  }

  function toggleWorker(id: string) {
    setForm((prev) => ({
      ...prev,
      worker_ids: prev.worker_ids.includes(id)
        ? prev.worker_ids.filter((w) => w !== id)
        : [...prev.worker_ids, id],
    }));
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-2xl">
      {/* Back + title */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">New Job</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a new fumigation task</p>
        </div>
      </div>

      {errors.general && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        {/* Basic info */}
        <Card>
          <CardHeader title="Basic Info" />
          <CardBody className="space-y-4">
            <Input
              label="Job title"
              id="title"
              placeholder="e.g. Monthly fumigation — Lahore Branch"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              error={errors.title}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={3}
                placeholder="Additional details about the job…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 resize-none"
              />
            </div>
          </CardBody>
        </Card>

        {/* Location + Schedule */}
        <Card>
          <CardHeader title="Location & Schedule" />
          <CardBody className="space-y-4">
            <Select
              label="Location"
              id="location"
              value={form.location_id}
              onChange={(e) => set('location_id', e.target.value)}
              error={errors.location_id}
            >
              <option value="">Select a location…</option>
              {(locations as any[]).map((loc: any) => (
                <option key={loc.id} value={loc.id}>{loc.name} — {loc.address}</option>
              ))}
            </Select>

            <Input
              label="Scheduled date & time"
              id="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(e) => set('scheduled_at', e.target.value)}
              error={errors.scheduled_at}
            />
          </CardBody>
        </Card>

        {/* Worker assignment */}
        <Card>
          <CardHeader
            title="Assign Workers"
            subtitle="Select one or more field workers"
          />
          <CardBody>
            {(workers as any[]).length === 0 ? (
              <p className="text-sm text-gray-400">No workers available.</p>
            ) : (
              <div className="space-y-2">
                {(workers as any[]).map((w: any) => (
                  <label key={w.id} className={[
                    'flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors',
                    form.worker_ids.includes(w.id)
                      ? 'border-indigo-600 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300',
                  ].join(' ')}>
                    <input
                      type="checkbox"
                      checked={form.worker_ids.includes(w.id)}
                      onChange={() => toggleWorker(w.id)}
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
          </CardBody>
        </Card>

        {/* Notes */}
        <Card>
          <CardHeader title="Notes" subtitle="Optional internal notes" />
          <CardBody>
            <textarea
              id="notes"
              rows={3}
              placeholder="Any special instructions or notes…"
              value={form.notes}
              onChange={(e) => set('notes', e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 resize-none"
            />
          </CardBody>
        </Card>

        {/* Actions */}
        <div className="flex items-center gap-3 pb-6">
          <Button type="submit" loading={createMutation.isPending}>
            Create Job
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
