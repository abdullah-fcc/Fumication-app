'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Location } from '@/lib/types';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ChevronLeft } from '@/components/icons';

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

export default function EditLocationPage() {
  const { id }      = useParams<{ id: string }>();
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm]     = useState<FormState | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [lat, setLat]       = useState<number | null>(null);
  const [lng, setLng]       = useState<number | null>(null);

  const { data: location, isLoading, isError } = useQuery<Location>({
    queryKey: ['location', id],
    queryFn: () =>
      api.get('/api/locations').then((r) => {
        const found = (r.data as Location[]).find((l) => l.id === id);
        if (!found) throw new Error('Location not found');
        return found;
      }),
  });

  // Prefill form and map pin once data loads
  useEffect(() => {
    if (!location) return;
    setForm({
      name:           location.name,
      address:        location.address,
      contact_person: location.contact_person ?? '',
      contact_phone:  location.contact_phone  ?? '',
    });
    setLat(location.lat ?? null);
    setLng(location.lng ?? null);
  }, [location]);

  const handleMapChange = useCallback((newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
  }, []);

  const mutation = useMutation({
    mutationFn: (data: FormState) =>
      api.put(`/api/locations/${id}`, {
        name:           data.name.trim(),
        address:        data.address.trim(),
        contact_person: data.contact_person.trim() || null,
        contact_phone:  data.contact_phone.trim()  || null,
        lat,
        lng,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      queryClient.removeQueries({ queryKey: ['location', id] });
      router.push('/locations');
    },
    onError: (err: any) => {
      setErrors({ general: err.response?.data?.error ?? 'Failed to update location.' });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form) return;
    const errs = validate(form);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    mutation.mutate(form);
  }

  function set(field: keyof FormState, value: string) {
    setForm((prev) => prev ? { ...prev, [field]: value } : prev);
  }

  if (isLoading || !form) {
    return (
      <div className="max-w-2xl space-y-5">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse" />
        <div className="h-48 bg-gray-100 rounded-xl animate-pulse" />
        <div className="h-80 bg-gray-100 rounded-xl animate-pulse" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-2xl">
        <p className="text-sm text-red-600">Location not found.</p>
        <button onClick={() => router.back()} className="text-sm text-indigo-600 mt-2">Go back</button>
      </div>
    );
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
          <h1 className="text-lg font-semibold text-gray-900">Edit Location</h1>
          <p className="text-sm text-gray-400 mt-0.5">{location?.name}</p>
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
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Address"
              id="address"
              value={form.address}
              onChange={(e) => set('address', e.target.value)}
              error={errors.address}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Pin on Map" subtitle="Search an address or click the map to update GPS coordinates" />
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
              value={form.contact_person}
              onChange={(e) => set('contact_person', e.target.value)}
            />
            <Input
              label="Contact phone"
              id="contact_phone"
              type="tel"
              value={form.contact_phone}
              onChange={(e) => set('contact_phone', e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button type="submit" loading={mutation.isPending}>
            Save Changes
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
