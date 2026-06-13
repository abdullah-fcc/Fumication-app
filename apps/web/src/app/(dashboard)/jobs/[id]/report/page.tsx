'use client';

import { useEffect, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import SignaturePad from '@/components/SignaturePad';
import { ChevronLeft } from '@/components/icons';
import {
  TRAP_NUMBERS, STATUS_OPTIONS, ACTION_OPTIONS,
  defaultReportFormData, type ReportFormData, type ReportType, type TrapRow,
} from '@/lib/reportForm';

type TrapKey = 'glue_trap' | 'live_trap' | 'mouse_trap';

const TRAP_SECTIONS: { key: TrapKey; label: string }[] = [
  { key: 'glue_trap', label: 'Glue Trap' },
  { key: 'live_trap', label: 'Live Trap' },
  { key: 'mouse_trap', label: 'Mouse Trap' },
];

const REPORT_TYPES: { value: ReportType; label: string; color: string }[] = [
  { value: 'routine', label: 'Routine', color: 'bg-sky-700' },
  { value: 'follow_up', label: 'Follow Up', color: 'bg-emerald-700' },
  { value: 'complaint', label: 'Complaint', color: 'bg-red-700' },
];

// Converts an ISO timestamp to a "HH:MM" value for an <input type="time">
function toTimeInputValue(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function JobReportPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const currentUser = getStoredUser();
  const [form, setForm] = useState<ReportFormData>(defaultReportFormData());
  const [error, setError] = useState('');

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', id],
    queryFn: () => api.get(`/api/jobs/${id}`).then((r) => r.data),
  });

  const { data: existingReport } = useQuery({
    queryKey: ['report', 'job', id],
    queryFn: () => api.get(`/api/reports/job/${id}`).then((r) => r.data),
  });

  // Prefill from the job/location once loaded
  useEffect(() => {
    if (!job) return;
    setForm((f) => ({
      ...f,
      client: f.client || job.location_name || '',
      service_address: f.service_address || job.address || job.location_address || '',
      time_in: f.time_in || (job.started_at ? toTimeInputValue(job.started_at) : ''),
      time_out: f.time_out || (job.completed_at ? toTimeInputValue(job.completed_at) : ''),
    }));
  }, [job]);

  // If a report already exists, load its saved data so it can be edited
  useEffect(() => {
    if (existingReport?.form_data) {
      setForm(existingReport.form_data);
    }
  }, [existingReport]);

  const submitMutation = useMutation({
    mutationFn: () =>
      api.post('/api/reports', {
        job_id: id,
        client_name: form.client,
        notes: form.notes,
        worker_signature: form.worker_signature,
        client_signature: form.client_signature,
        pests_found: form.targets.filter((t) => t.checked && t.name).map((t) => t.name),
        areas_treated: form.area_remarks ? [form.area_remarks] : [],
        form_data: form,
      }),
    onSuccess: (res) => {
      router.push(`/reports/${res.data.id}`);
    },
    onError: () => setError('Failed to save report. Please try again.'),
  });

  if (isLoading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!job) {
    return <p className="text-sm text-gray-500">Job not found.</p>;
  }

  function set<K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePesticide(index: number) {
    setForm((f) => {
      const pesticides = [...f.pesticides];
      pesticides[index] = { ...pesticides[index], checked: !pesticides[index].checked };
      return { ...f, pesticides };
    });
  }

  function setPesticideField(index: number, field: 'name' | 'rate', value: string) {
    setForm((f) => {
      const pesticides = [...f.pesticides];
      pesticides[index] = { ...pesticides[index], [field]: value };
      return { ...f, pesticides };
    });
  }

  function toggleChecklist(list: 'methods' | 'targets', index: number) {
    setForm((f) => {
      const items = [...f[list]];
      items[index] = { ...items[index], checked: !items[index].checked };
      return { ...f, [list]: items };
    });
  }

  function setChecklistName(list: 'methods' | 'targets', index: number, name: string) {
    setForm((f) => {
      const items = [...f[list]];
      items[index] = { ...items[index], name };
      return { ...f, [list]: items };
    });
  }

  function setTrapCell(trap: TrapKey, field: keyof TrapRow, num: number, value: string) {
    setForm((f) => ({
      ...f,
      monitoring: {
        ...f.monitoring,
        [trap]: {
          ...f.monitoring[trap],
          [field]: { ...f.monitoring[trap][field], [num]: value },
        },
      },
    }));
  }

  return (
    <div className="space-y-5 max-w-5xl">
      <div className="flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Service Report</h1>
          <p className="text-sm text-gray-400 mt-0.5">{job.title} — {job.location_name}</p>
        </div>
      </div>

      {/* Header info */}
      <Card>
        <CardHeader title="Visit Details" />
        <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Date">
            <input type="date" value={form.date} onChange={(e) => set('date', e.target.value)} className="fg-input" />
          </Field>
          <Field label="Client">
            <input type="text" value={form.client} onChange={(e) => set('client', e.target.value)} className="fg-input" placeholder="Client name" />
          </Field>
          <Field label="Time In">
            <input type="time" value={form.time_in} onChange={(e) => set('time_in', e.target.value)} className="fg-input" />
          </Field>
          <Field label="Time Out">
            <input type="time" value={form.time_out} onChange={(e) => set('time_out', e.target.value)} className="fg-input" />
          </Field>
          <Field label="Service Address" className="sm:col-span-2">
            <input type="text" value={form.service_address} onChange={(e) => set('service_address', e.target.value)} className="fg-input" />
          </Field>

          {/* Report type */}
          <div className="sm:col-span-2 flex gap-2">
            {REPORT_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => set('report_type', t.value)}
                className={[
                  'flex-1 h-10 rounded-lg text-sm font-semibold text-white transition-opacity',
                  t.color,
                  form.report_type === t.value ? 'opacity-100 ring-2 ring-offset-2 ring-gray-400' : 'opacity-40 hover:opacity-70',
                ].join(' ')}
              >
                {t.label}
              </button>
            ))}
          </div>
        </CardBody>
      </Card>

      {/* Section I: Pesticide Application */}
      <Card>
        <CardHeader
          title="Section I. Pesticide Application"
          subtitle="As per IPM basic principle, use pesticides only when no other options are left."
        />
        <CardBody className="space-y-5">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Pesticide + App. Rate */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Pesticide / App. Rate</p>
              <div className="space-y-3">
                {form.pesticides.map((p, i) => (
                  <div key={i} className="space-y-1.5">
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={p.checked}
                        onChange={() => togglePesticide(i)}
                        className="rounded text-indigo-600 focus:ring-indigo-600 flex-shrink-0 mt-0.5"
                      />
                      {i < 4 ? (
                        <span className="text-sm text-gray-700">{p.name}</span>
                      ) : (
                        <input
                          type="text"
                          value={p.name}
                          onChange={(e) => setPesticideField(i, 'name', e.target.value)}
                          placeholder="Other pesticide…"
                          className="fg-input flex-1 text-sm -mt-0.5"
                        />
                      )}
                    </label>
                    <input
                      type="text"
                      value={p.rate}
                      onChange={(e) => setPesticideField(i, 'rate', e.target.value)}
                      placeholder={p.rateLabel || 'rate'}
                      className="fg-input text-sm ml-6"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Method */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Method</p>
              <div className="space-y-2">
                {form.methods.map((m, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={m.checked}
                      onChange={() => toggleChecklist('methods', i)}
                      className="rounded text-indigo-600 focus:ring-indigo-600 flex-shrink-0"
                    />
                    {i < 10 ? (
                      <span className="text-sm text-gray-700">{m.name}</span>
                    ) : (
                      <input
                        type="text"
                        value={m.name}
                        onChange={(e) => setChecklistName('methods', i, e.target.value)}
                        placeholder="Other method…"
                        className="fg-input flex-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Target */}
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Target</p>
              <div className="space-y-2">
                {form.targets.map((t, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={t.checked}
                      onChange={() => toggleChecklist('targets', i)}
                      className="rounded text-indigo-600 focus:ring-indigo-600 flex-shrink-0"
                    />
                    {i < 10 ? (
                      <span className="text-sm text-gray-700">{t.name}</span>
                    ) : (
                      <input
                        type="text"
                        value={t.name}
                        onChange={(e) => setChecklistName('targets', i, e.target.value)}
                        placeholder="Other target…"
                        className="fg-input flex-1 text-sm"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <Field label="Area / Remarks">
            <textarea
              value={form.area_remarks}
              onChange={(e) => set('area_remarks', e.target.value)}
              rows={3}
              className="fg-input resize-none"
              placeholder="Describe the areas treated…"
            />
          </Field>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Time of Application">
              <input type="text" value={form.time_of_application} onChange={(e) => set('time_of_application', e.target.value)} className="fg-input" />
            </Field>
            <Field label="Follow up (If Req.)">
              <input type="text" value={form.follow_up_required} onChange={(e) => set('follow_up_required', e.target.value)} className="fg-input" />
            </Field>
            <Field label="Reason if not done">
              <input type="text" value={form.reason_if_not_done} onChange={(e) => set('reason_if_not_done', e.target.value)} className="fg-input" />
            </Field>
          </div>
        </CardBody>
      </Card>

      {/* Section II: Monitoring & Servicing */}
      <Card>
        <CardHeader
          title="Section II. Monitoring & Servicing"
          subtitle="Status: Okay / Damage / Lost / N.A — Action: No Need / Replaced / New / Unmount / Mounted"
        />
        <CardBody className="space-y-6">
          {TRAP_SECTIONS.map(({ key, label }) => (
            <TrapGrid key={key} label={label} row={form.monitoring[key]} onChange={(field, num, value) => setTrapCell(key, field, num, value)} />
          ))}
        </CardBody>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader title="Notes (If Any)" />
        <CardBody>
          <textarea
            value={form.notes}
            onChange={(e) => set('notes', e.target.value)}
            rows={3}
            className="fg-input resize-none"
          />
        </CardBody>
      </Card>

      {/* Signatures */}
      <Card>
        <CardHeader title="Sign-off" />
        <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <p className="text-sm font-medium text-gray-900 mb-2">PCO: {currentUser?.name}</p>
            <SignaturePad label="Sign." value={form.worker_signature} onChange={(v) => set('worker_signature', v)} />
          </div>
          <div>
            <Field label="Client Name" className="mb-2">
              <input type="text" value={form.client_name} onChange={(e) => set('client_name', e.target.value)} className="fg-input" placeholder="Client representative name" />
            </Field>
            <SignaturePad label="Sign." value={form.client_signature} onChange={(v) => set('client_signature', v)} />
          </div>
        </CardBody>
      </Card>

      <div className="flex items-center gap-3 pb-6">
        {error && <p className="text-xs text-red-500">{error}</p>}
        <Button loading={submitMutation.isPending} onClick={() => submitMutation.mutate()}>
          Save Report
        </Button>
      </div>
    </div>
  );
}

function Field({ label, children, className = '' }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</label>
      {children}
    </div>
  );
}

function TrapGrid({ label, row, onChange }: { label: string; row: TrapRow; onChange: (field: keyof TrapRow, num: number, value: string) => void }) {
  return (
    <div>
      <p className="text-sm font-semibold text-gray-900 mb-2">{label}</p>
      <div className="overflow-x-auto">
        <table className="border-collapse text-xs">
          <thead>
            <tr>
              <th className="sticky left-0 bg-white border border-gray-200 px-2 py-1 w-20"></th>
              {TRAP_NUMBERS.map((n) => (
                <th key={n} className="border border-gray-200 bg-orange-50 px-1 py-1 w-14 font-medium text-gray-600">{n}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <th className="sticky left-0 bg-gray-50 border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Status</th>
              {TRAP_NUMBERS.map((n) => (
                <td key={n} className="border border-gray-200 p-0">
                  <select
                    value={row.status[n] ?? ''}
                    onChange={(e) => onChange('status', n, e.target.value)}
                    className="w-14 h-7 text-xs border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                  >
                    {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-gray-50 border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Count</th>
              {TRAP_NUMBERS.map((n) => (
                <td key={n} className="border border-gray-200 p-0">
                  <input
                    type="text"
                    inputMode="numeric"
                    value={row.count[n] ?? ''}
                    onChange={(e) => onChange('count', n, e.target.value)}
                    className="w-14 h-7 text-xs border-0 focus:ring-1 focus:ring-indigo-500 text-center bg-transparent"
                  />
                </td>
              ))}
            </tr>
            <tr>
              <th className="sticky left-0 bg-gray-50 border border-gray-200 px-2 py-1 text-left font-medium text-gray-600">Action</th>
              {TRAP_NUMBERS.map((n) => (
                <td key={n} className="border border-gray-200 p-0">
                  <select
                    value={row.action[n] ?? ''}
                    onChange={(e) => onChange('action', n, e.target.value)}
                    className="w-14 h-7 text-xs border-0 focus:ring-1 focus:ring-indigo-500 bg-transparent"
                  >
                    {ACTION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
