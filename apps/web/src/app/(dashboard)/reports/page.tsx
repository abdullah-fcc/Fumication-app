'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import api from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { FileText, Eye } from '@/components/icons';

export default function ReportsPage() {
  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['reports'],
    queryFn: () => api.get('/api/reports').then((r) => r.data),
  });

  return (
    <div>
      <PageHeader
        title="Reports"
        subtitle="Fumigation job reports and digital records"
      />

      <Card>
        <div className="overflow-x-auto">
          <table className="fg-table">
          <thead>
            <tr>
              <th>Job</th>
              <th>Location</th>
              <th>Worker</th>
              <th>Pests Found</th>
              <th>Date</th>
              <th>Signatures</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows rows={5} cols={6} />
            ) : reports.length === 0 ? (
              <tr>
                <td colSpan={7} className="p-0">
                  <EmptyState
                    icon={<FileText size={22} />}
                    title="No reports yet"
                    subtitle="Reports are generated automatically when a job is completed"
                  />
                </td>
              </tr>
            ) : (
              (reports as any[]).map((r) => (
                <tr key={r.id}>
                  <td className="font-medium text-gray-900">{r.job_title ?? '—'}</td>
                  <td className="text-gray-500">{r.location_name ?? '—'}</td>
                  <td className="text-gray-500">{r.worker_name ?? '—'}</td>
                  <td className="text-gray-500">
                    {r.pests_found?.length
                      ? (r.pests_found as string[]).join(', ')
                      : '—'}
                  </td>
                  <td className="text-gray-500 whitespace-nowrap">
                    {new Date(r.created_at).toLocaleDateString('en-PK', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.worker_signature ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        Worker
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${r.client_signature ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                        Client
                      </span>
                    </div>
                  </td>
                  <td>
                    <Link
                      href={`/reports/${r.id}`}
                      className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-700 font-medium whitespace-nowrap"
                    >
                      <Eye size={14} /> View / Download
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
