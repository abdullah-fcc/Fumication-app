'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { PageHeader } from '@/components/ui/PageHeader';
import { Card } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRows } from '@/components/ui/Skeleton';
import { Search, Package, AlertTriangle } from '@/components/icons';

export default function InventoryPage() {
  const [search, setSearch] = useState('');

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['inventory'],
    queryFn: () => api.get('/api/inventory').then((r) => r.data),
  });

  const filtered = (items as any[]).filter((item) =>
    item.name.toLowerCase().includes(search.toLowerCase()) ||
    item.warehouse_name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowCount = (items as any[]).filter((i) => i.quantity <= i.low_stock_threshold).length;

  return (
    <div>
      <PageHeader
        title="Inventory"
        subtitle="Chemicals and equipment stock levels"
      />

      {/* Summary strip */}
      {lowCount > 0 && (
        <div className="flex items-center gap-2 mb-5 px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
          <AlertTriangle size={15} />
          <span>{lowCount} item{lowCount !== 1 ? 's are' : ' is'} below the restock threshold.</span>
        </div>
      )}

      <Card>
        <div className="fg-filters">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search items or warehouse…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500"
            />
          </div>
          <span className="text-xs text-gray-400 ml-auto">{filtered.length} item{filtered.length !== 1 ? 's' : ''}</span>
        </div>

        <table className="fg-table">
          <thead>
            <tr>
              <th>Item</th>
              <th>Warehouse</th>
              <th>Quantity</th>
              <th>Threshold</th>
              <th>Supplier</th>
              <th>Stock</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <SkeletonRows rows={5} cols={6} />
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-0">
                  <EmptyState
                    icon={<Package size={22} />}
                    title="No inventory items found"
                    subtitle={search ? 'Try a different search term' : 'No items have been added yet'}
                  />
                </td>
              </tr>
            ) : (
              filtered.map((item: any) => {
                const isLow = item.quantity <= item.low_stock_threshold;
                return (
                  <tr key={item.id}>
                    <td className="font-medium text-gray-900">{item.name}</td>
                    <td className="text-gray-500">{item.warehouse_name ?? '—'}</td>
                    <td className="tabular-nums font-medium">
                      {item.quantity} <span className="text-gray-400 font-normal text-xs">{item.unit}</span>
                    </td>
                    <td className="text-gray-500 tabular-nums">
                      {item.low_stock_threshold} {item.unit}
                    </td>
                    <td className="text-gray-500">{item.supplier ?? '—'}</td>
                    <td>
                      {isLow ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-100 px-2.5 py-1 rounded-full">
                          <AlertTriangle size={11} /> Low
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-green-700 bg-green-100 px-2.5 py-1 rounded-full">
                          OK
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
