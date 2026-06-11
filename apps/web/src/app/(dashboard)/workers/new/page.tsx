'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardHeader, CardBody } from '@/components/ui/Card';
import { ChevronLeft } from '@/components/icons';

interface FormState {
  name: string;
  email: string;
  password: string;
  phone: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  general?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!form.name.trim())     errors.name     = 'Full name is required.';
  if (!form.email.trim())    errors.email    = 'Email address is required.';
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
                             errors.email    = 'Enter a valid email address.';
  if (!form.password.trim()) errors.password = 'Password is required.';
  else if (form.password.length < 8)
                             errors.password = 'Password must be at least 8 characters.';
  return errors;
}

const empty: FormState = { name: '', email: '', password: '', phone: '' };

export default function NewWorkerPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm]     = useState<FormState>(empty);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: (data: FormState) =>
      api.post('/api/auth/register', {
        name:     data.name.trim(),
        email:    data.email.trim().toLowerCase(),
        password: data.password,
        phone:    data.phone.trim() || null,
        role:     'worker',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workers'] });
      router.push('/workers');
    },
    onError: (err: any) => {
      setErrors({ general: err.response?.data?.error ?? 'Failed to create worker account.' });
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
          <h1 className="text-lg font-semibold text-gray-900">Add Worker</h1>
          <p className="text-sm text-gray-400 mt-0.5">Create a field worker account</p>
        </div>
      </div>

      {errors.general && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">
        <Card>
          <CardHeader title="Account Details" subtitle="The worker will use these credentials to log in" />
          <CardBody className="space-y-4">
            <Input
              label="Full name"
              id="name"
              placeholder="e.g. Ali Hassan"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <Input
              label="Email address"
              id="email"
              type="email"
              placeholder="e.g. ali@fumiguard.com"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              error={errors.email}
            />
            <Input
              label="Password"
              id="password"
              type="password"
              placeholder="At least 8 characters"
              value={form.password}
              onChange={(e) => set('password', e.target.value)}
              error={errors.password}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Contact" subtitle="Optional — helps identify worker on-site" />
          <CardBody>
            <Input
              label="Phone number"
              id="phone"
              type="tel"
              placeholder="e.g. 0300-1234567"
              value={form.phone}
              onChange={(e) => set('phone', e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button type="submit" loading={mutation.isPending}>
            Create Worker
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
