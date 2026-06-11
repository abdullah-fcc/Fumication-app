'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import type { Location } from '@/lib/types';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Plus, Search, MapPin, Pencil, Trash2 } from '@/components/icons';

export default function LocationsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [deleteError, setDeleteError] = useState('');

  const { data: locations = [], isLoading, isError } = useQuery<Location[]>({
    queryKey: ['locations'],
    queryFn: () => api.get('/api/locations').then((r) => r.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/api/locations/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['locations'] });
      setDeleteError('');
    },
    onError: () => setDeleteError('Failed to delete location. It may have jobs attached.'),
  });

  const filtered = locations.filter(
    (loc) =>
      loc.name.toLowerCase().includes(search.toLowerCase()) ||
      loc.address.toLowerCase().includes(search.toLowerCase())
  );

  function handleDelete(loc: Location) {
    if (!confirm(`Delete "${loc.name}"? This cannot be undone.`)) return;
    deleteMutation.mutate(loc.id);
  }

  return (
    <div>
      <PageHeader
        title="Locations"
        subtitle="Client premises where fumigation jobs are carried out"
        actions={
          <Link href="/locations/new">
            <Button size="sm">
              <Plus size={15} />
              New Location
            </Button>
          </Link>
        }
      />

      {deleteError && (
        <div role="alert" className="mb-4 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          {deleteError}
        </div>
      )}

      <Card>
        <div className="fg-filters">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or address…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">
            {filtered.length} location{filtered.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isError && (
          <div className="px-5 py-4 text-sm text-red-600">
            Failed to load locations. Please refresh.
          </div>
        )}

        <table className="fg-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Address</th>
              <th>Contact</th>
              <th>GPS</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows rows={4} cols={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<MapPin size={22} />}
                    title="No locations found"
                    subtitle={
                      search
                        ? 'Try a different search term'
                        : 'Add your first client location to start scheduling jobs'
                    }
                    action={
                      !search ? (
                        <Link href="/locations/new">
                          <Button size="sm" variant="secondary">
                            <Plus size={14} /> New Location
                          </Button>
                        </Link>
                      ) : undefined
                    }
                  />
                </td>
              </tr>
            ) : (
              filtered.map((loc) => (
                <tr key={loc.id}>
                  <td>
                    <p className="font-medium text-gray-900">{loc.name}</p>
                  </td>
                  <td className="text-gray-500">{loc.address}</td>
                  <td className="text-gray-500">
                    {loc.contact_person ? (
                      <span>
                        {loc.contact_person}
                        {loc.contact_phone && (
                          <span className="block text-xs text-gray-400">{loc.contact_phone}</span>
                        )}
                      </span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className="text-gray-500 text-xs">
                    {loc.lat != null && loc.lng != null
                      ? `${loc.lat}, ${loc.lng}`
                      : '—'}
                  </td>
                  <td>
                    <div className="flex items-center justify-end gap-2">
                      <Link href={`/locations/${loc.id}/edit`}>
                        <button
                          className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil size={14} />
                        </button>
                      </Link>
                      <button
                        onClick={() => handleDelete(loc)}
                        disabled={deleteMutation.isPending}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
