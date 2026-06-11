'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ChevronLeft } from '@/components/icons';

// Leaflet cannot run on the server — load it only in the browser
const MapPicker = dynamic(() => import('@/components/MapPicker'), { ssr: false });

interface FormState {
  name: string;
  address: string;
  contact_person: string;
  contact_phone: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  general?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim())    errors.name    = 'Location name is required.';
  if (!form.address.trim()) errors.address = 'Address is required.';
  return errors;
}

const empty: FormState = { name: '', address: '', contact_person: '', contact_phone: '' };

export default function NewLocationPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm]     = useState<FormState>(empty);
  const [errors, setErrors] = useState<FormErrors>({});
  const [lat, setLat]       = useState<number | null>(null);
  const [lng, setLng]       = useState<number | null>(null);

  // useCallback so MapPicker doesn't re-render on every keystroke
  const handleMapChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormState) =>
      api.post('/api/locations', {
        name:           data.name.trim(),
        address:        data.address.trim(),
        contact_person: data.contact_person.trim() || null,
        contact_phone:  data.contact_phone.trim()  || null,
        lat,
        lng,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      router.push('/locations');
    },
    onError: (err: any) => {
      setErrors({ general: err.response?.data?.error ?? 'Failed to create location.' });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate(form);
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => router.back()}
          className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
        >
          <ChevronLeft size={16} />
        </button>
        <div>
          <h1 className="text-lg font-semibold text-gray-900">New Location</h1>
          <p className="text-sm text-gray-400 mt-0.5">Add a client premises for job scheduling</p>
        </div>
      </div>

      {errors.general && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        <Card>
          <CardHeader title="Basic Info" />
          <CardBody className="space-y-4">
            <Input
              label="Location name"
              id="name"
              placeholder="e.g. Lahore Marriott Hotel"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Address"
              id="address"
              placeholder="e.g. 54 Egerton Road, Lahore"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              error={errors.address}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pin on Map" subtitle="Search an address or click the map to set GPS coordinates for worker check-in" />
          <CardBody>
            <MapPicker lat={lat} lng={lng} onChange={handleMapChange} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Contact" subtitle="Optional on-site contact details" />
          <CardBody className="space-y-4">
            <Input
              label="Contact person"
              id="contact_person"
              placeholder="e.g. Ahmed Khan"
              value={form.contact_person}
              onChange={(e) => set('contact_person', e.target.value)}
            />
            <Input
              label="Contact phone"
              id="contact_phone"
              type="tel"
              placeholder="e.g. 0300-1234567"
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button type="submit" loading={mutation.isPending}>
            Create Location
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
