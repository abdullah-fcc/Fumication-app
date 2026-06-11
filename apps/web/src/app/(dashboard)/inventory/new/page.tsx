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
  description: string;
  unit: string;
  quantity: string;
  low_stock_threshold: string;
  supplier: string;
}

interface FormErrors {
  name?: string;
  unit?: string;
  quantity?: string;
  low_stock_threshold?: string;
  general?: string;
}

function validate(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (!form.name.trim()) errors.name = 'Item name is required.';
  if (!form.unit.trim()) errors.unit = 'Unit is required (e.g. L, kg, pcs).';

  const qty = parseFloat(form.quantity);
  if (form.quantity.trim() === '' || isNaN(qty) || qty < 0)
    errors.quantity = 'Quantity must be a number of 0 or more.';

  if (form.low_stock_threshold.trim() !== '') {
    const t = parseFloat(form.low_stock_threshold);
    if (isNaN(t) || t < 0)
      errors.low_stock_threshold = 'Threshold must be a number of 0 or more.';
  }

  return errors;
}

const empty: FormState = {
  name: '', description: '', unit: '', quantity: '0', low_stock_threshold: '10', supplier: '',
};

export default function NewInventoryPage() {
  const router      = useRouter();
  const queryClient = useQueryClient();

  const [form, setForm]     = useState<FormState>(empty);
  const [errors, setErrors] = useState<FormErrors>({});

  const mutation = useMutation({
    mutationFn: (data: FormState) =>
      api.post('/api/inventory', {
        name:                data.name.trim(),
        description:         data.description.trim() || null,
        unit:                data.unit.trim(),
        quantity:            parseFloat(data.quantity),
        low_stock_threshold: data.low_stock_threshold.trim()
                               ? parseFloat(data.low_stock_threshold)
                               : 10,
        supplier:            data.supplier.trim() || null,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['inventory'] });
      queryClient.invalidateQueries({ queryKey: ['low-stock'] });
      router.push('/inventory');
    },
    onError: (err: any) => {
      setErrors({ general: err.response?.data?.error ?? 'Failed to create item.' });
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
          <h1 className="text-lg font-semibold text-gray-900">New Inventory Item</h1>
          <p className="text-sm text-gray-400 mt-0.5">Add a chemical or piece of equipment</p>
        </div>
      </div>

      {errors.general && (
        <div role="alert" className="mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {errors.general}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-5">

        <Card>
          <CardHeader title="Item Details" />
          <CardBody className="space-y-4">
            <Input
              label="Item name"
              id="name"
              placeholder="e.g. Cypermethrin 10% EC"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              error={errors.name}
            />
            <div className="flex flex-col gap-1">
              <label htmlFor="description" className="text-sm font-medium text-gray-700">
                Description <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                id="description"
                rows={2}
                placeholder="Short description of the item…"
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-600 resize-none"
              />
            </div>
            <Input
              label="Unit"
              id="unit"
              placeholder="e.g. L, ml, kg, g, pcs"
              value={form.unit}
              onChange={(e) => set('unit', e.target.value)}
              error={errors.unit}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Stock Levels" />
          <CardBody className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Input
                label="Current quantity"
                id="quantity"
                type="number"
                min="0"
                step="any"
                value={form.quantity}
                onChange={(e) => set('quantity', e.target.value)}
                error={errors.quantity}
              />
              <Input
                label="Low stock threshold"
                id="low_stock_threshold"
                type="number"
                min="0"
                step="any"
                placeholder="10"
                value={form.low_stock_threshold}
                onChange={(e) => set('low_stock_threshold', e.target.value)}
                error={errors.low_stock_threshold}
              />
            </div>
            <p className="text-xs text-gray-400">
              A "Low" badge appears on the item when quantity falls at or below the threshold.
            </p>
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Supplier" subtitle="Optional" />
          <CardBody>
            <Input
              label="Supplier name"
              id="supplier"
              placeholder="e.g. AgriChem Distributors"
              value={form.supplier}
              onChange={(e) => set('supplier', e.target.value)}
            />
          </CardBody>
        </Card>

        <div className="flex items-center gap-3 pb-6">
          <Button type="submit" loading={mutation.isPending}>
            Add Item
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
