'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { getStoredUser } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Plus, Search, Users, UserCheck, UserX } from '@/components/icons';

export default function WorkersPage() {
  const [search, setSearch] = useState('');
  const currentUser = getStoredUser();
  const canAdd = currentUser?.role === 'admin' || currentUser?.role === 'manager';

  const { data: workers = [], isLoading } = useQuery({
    queryKey: ['workers'],
    queryFn: () => api.get('/api/users?role=worker').then((r) => r.data),
  });

  const filtered = (workers as any[]).filter((w) =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <PageHeader
        title="Workers"
        subtitle="Field staff and their assignment status"
        actions={
          canAdd ? (
            <Link href="/workers/new">
              <Button size="sm">
                <Plus size={15} />
                Add Worker
              </Button>
            </Link>
          ) : undefined
        }
      />

      <Card>
        <div className="fg-filters">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} worker{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table className="fg-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Status</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows rows={5} cols={5} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState
                    icon={<Users size={22} />}
                    title="No workers found"
                    subtitle={search ? 'Try a different search term' : 'No workers have been added yet'}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((w: any) => (
                <tr key={w.id}>
                  <td>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">
                          {w.name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="font-medium text-gray-900">{w.name}</span>
                    </div>
                  </td>
                  <td className="text-gray-500">{w.email}</td>
                  <td className="text-gray-500">{w.phone || '—'}</td>
                  <td>
                    {w.is_active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                        <UserCheck size={11} /> Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">
                        <UserX size={11} /> Inactive
                      </span>
                    )}
                  </td>
                  <td className="text-gray-500">
                    {new Date(w.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
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
