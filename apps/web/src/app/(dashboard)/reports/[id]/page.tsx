'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams, useRouter } from 'next/navigation';
import api from '@/lib/api';
import { ChevronLeft, Download } from '@/components/icons';
import { Button } from '@/components/ui/Button';
import {
  TRAP_NUMBERS, statusLabel, actionLabel, type ReportFormData,
} from '@/lib/reportForm';
import { generateReportPdf } from '@/lib/generateReportPdf';

const TRAP_SECTIONS: { key: 'glue_trap' | 'live_trap' | 'mouse_trap'; label: string }[] = [
  { key: 'glue_trap', label: 'Glue Trap' },
  { key: 'live_trap', label: 'Live Trap' },
  { key: 'mouse_trap', label: 'Mouse Trap' },
];

export default function ReportViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const { data: report, isLoading } = useQuery({
    queryKey: ['report', id],
    queryFn: () => api.get(`/api/reports/${id}`).then((r) => r.data),
  });

  if (isLoading) {
    return <div className="h-64 bg-gray-100 rounded-xl animate-pulse" />;
  }

  if (!report) {
    return <p className="text-sm text-gray-500">Report not found.</p>;
  }

  const form: ReportFormData | null = report.form_data ?? null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.back()}
            className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <h1 className="text-lg font-semibold text-gray-900">Service Report</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" onClick={() => window.print()}>Print</Button>
          <Button onClick={() => generateReportPdf(report)}>
            <Download size={14} className="mr-1.5" /> Download PDF
          </Button>
        </div>
      </div>

      <div className="overflow-x-auto print:overflow-visible">
      <div className="report-sheet bg-white border border-gray-900 text-[11px] text-gray-900 mx-auto max-w-5xl min-w-[900px] print:min-w-0">
        {/* Title bar */}
        <div className="grid grid-cols-[1fr_auto] border-b border-gray-900">
          <div className="flex items-center justify-center p-3">
            <div className="bg-lime-600 text-white font-bold text-xl px-8 py-3 rounded">SERVICE REPORT</div>
          </div>
          <div className="border-l border-gray-900 p-2 text-[10px] leading-tight">
            <p><span className="font-semibold">Document #</span> IFPCS-IPM-13</p>
            <p><span className="font-semibold">Revision #</span> 01</p>
            <p className="mt-1"><span className="font-semibold">Revision Date</span> 01-January-24</p>
            <p><span className="font-semibold">Effective Date From</span> 02-January-24</p>
          </div>
        </div>

        {/* Date / Client / Time / Address */}
        <table className="w-full border-collapse">
          <tbody>
            <tr className="border-b border-gray-900">
              <th className="border-r border-gray-900 px-2 py-1 text-left font-semibold w-28">Date:</th>
              <td className="border-r border-gray-900 px-2 py-1 w-1/3">{report.created_at ? new Date(form?.date ?? report.created_at).toLocaleDateString('en-PK', { day: 'numeric', month: 'long', year: 'numeric' }) : ''}</td>
              <th className="border-r border-gray-900 px-2 py-1 text-left font-semibold w-20">Client:</th>
              <td className="px-2 py-1">{form?.client ?? report.client_name ?? report.location_name}</td>
            </tr>
            <tr className="border-b border-gray-900">
              <th className="border-r border-gray-900 px-2 py-1 text-left font-semibold">Time In</th>
              <td className="border-r border-gray-900 px-2 py-1">{form?.time_in}</td>
              <th rowSpan={2} className="border-r border-gray-900 px-2 py-1 text-left font-semibold align-top">Service<br />Address</th>
              <td rowSpan={2} className="px-2 py-1 align-top">{form?.service_address ?? report.location_address}</td>
            </tr>
            <tr>
              <th className="border-r border-gray-900 px-2 py-1 text-left font-semibold">Time Out</th>
              <td className="border-r border-gray-900 px-2 py-1">{form?.time_out}</td>
            </tr>
          </tbody>
        </table>

        {/* Report type bar */}
        <div className="grid grid-cols-3 border-t border-gray-900">
          <div className={`text-center py-2 font-bold ${form?.report_type === 'routine' ? 'bg-sky-700 text-white' : 'bg-sky-100 text-sky-900'}`}>ROUTINE</div>
          <div className={`text-center py-2 font-bold border-l border-r border-gray-900 ${form?.report_type === 'follow_up' ? 'bg-emerald-700 text-white' : 'bg-emerald-100 text-emerald-900'}`}>FOLLOW UP</div>
          <div className={`text-center py-2 font-bold ${form?.report_type === 'complaint' ? 'bg-red-700 text-white' : 'bg-red-100 text-red-900'}`}>COMPLAINT</div>
        </div>

        {/* Section I */}
        <div className="border-t border-gray-900 grid grid-cols-[220px_1fr] bg-lime-50">
          <div className="p-2 font-semibold border-r border-gray-900">Section I. Pesticide Application</div>
          <div className="p-2 text-[10px]">
            As per IPM basic principle, use pesticides only when no other options are left. Pesticides are
            supplement to IPM plan not stand alone solutions. Use pesticides to rescue emergencies and work on
            root causes. Ensure pesticide safety by pre &amp; post notifications.
          </div>
        </div>

        <table className="w-full border-collapse border-t border-gray-900">
          <thead>
            <tr className="bg-sky-100">
              <th className="border border-gray-900 px-2 py-1 text-left">PESTICIDE</th>
              <th className="border border-gray-900 px-2 py-1 text-left">APP. RATE</th>
              <th className="border border-gray-900 px-2 py-1 text-left">METHOD</th>
              <th className="border border-gray-900 px-2 py-1 text-left">TARGET</th>
              <th className="border border-gray-900 px-2 py-1 text-left">AREA/REMARKS</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="border border-gray-900 px-2 py-1 align-top">
                {form?.pesticides.filter((p) => p.name).map((p, i) => (
                  <div key={i}>{p.checked ? '☑' : '☐'} {p.name}</div>
                ))}
              </td>
              <td className="border border-gray-900 px-2 py-1 align-top">
                {form?.pesticides.filter((p) => p.name).map((p, i) => (
                  <div key={i}>{p.rate || '—'}</div>
                ))}
              </td>
              <td className="border border-gray-900 px-2 py-1 align-top">
                {form?.methods.filter((m) => m.name).map((m, i) => (
                  <div key={i}>{m.checked ? '☑' : '☐'} {m.name}</div>
                ))}
              </td>
              <td className="border border-gray-900 px-2 py-1 align-top">
                {form?.targets.filter((t) => t.name).map((t, i) => (
                  <div key={i}>{t.checked ? '☑' : '☐'} {t.name}</div>
                ))}
              </td>
              <td className="border border-gray-900 px-2 py-1 align-top whitespace-pre-wrap">{form?.area_remarks}</td>
            </tr>
          </tbody>
        </table>

        <table className="w-full border-collapse">
          <tbody>
            <tr>
              <td className="border border-gray-900 px-2 py-1 w-1/3">Time of Application: {form?.time_of_application}</td>
              <td className="border border-gray-900 px-2 py-1 w-1/3">Follow up (If Req.): {form?.follow_up_required}</td>
              <td className="border border-gray-900 px-2 py-1 w-1/3">Reason if not done: {form?.reason_if_not_done}</td>
            </tr>
          </tbody>
        </table>

        {/* Section II */}
        <div className="grid grid-cols-[220px_1fr] border-t border-gray-900 bg-lime-50 text-[10px]">
          <div className="p-2 font-semibold border-r border-gray-900 flex items-center">Section II. Monitoring &amp; Servicing</div>
          <div className="p-2 leading-tight">
            <p><span className="font-semibold">Status:</span> ✅ Okay &nbsp; ⊞ Damage &nbsp; ❓ Lost &nbsp; ⊘ N.A</p>
            <p><span className="font-semibold">Action:</span> ❌ No Need &nbsp; @ Replaced &nbsp; ➕ New &nbsp; ➖ Unmount &nbsp; ++ Mounted</p>
          </div>
        </div>

        {TRAP_SECTIONS.map(({ key, label }) => (
          <div key={key} className="overflow-x-auto border-t border-gray-900">
            <table className="border-collapse text-[10px] w-full">
              <thead>
                <tr>
                  <th className="border border-gray-900 bg-orange-100 px-2 py-1 text-left w-24">{label}</th>
                  {TRAP_NUMBERS.map((n) => (
                    <th key={n} className="border border-gray-900 bg-orange-100 px-1 py-1 w-9 text-center">{n}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <th className="border border-gray-900 bg-orange-50 px-2 py-1 text-left">Status</th>
                  {TRAP_NUMBERS.map((n) => (
                    <td key={n} className="border border-gray-900 px-1 py-1 text-center">{statusLabel(form?.monitoring[key].status[n] ?? '')}</td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-gray-900 bg-orange-50 px-2 py-1 text-left">Count</th>
                  {TRAP_NUMBERS.map((n) => (
                    <td key={n} className="border border-gray-900 px-1 py-1 text-center">{form?.monitoring[key].count[n] ?? ''}</td>
                  ))}
                </tr>
                <tr>
                  <th className="border border-gray-900 bg-orange-50 px-2 py-1 text-left">Action</th>
                  {TRAP_NUMBERS.map((n) => (
                    <td key={n} className="border border-gray-900 px-1 py-1 text-center">{actionLabel(form?.monitoring[key].action[n] ?? '')}</td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        ))}

        {/* Notes */}
        <div className="border-t border-gray-900 p-2 min-h-[3rem]">
          <span className="font-semibold">Notes (If Any):</span> {form?.notes || report.notes}
        </div>

        {/* Signatures */}
        <table className="w-full border-collapse border-t border-gray-900">
          <tbody>
            <tr>
              <td className="border border-gray-900 px-2 py-1 w-1/4 align-top">
                <p className="font-semibold mb-1">PCO: {report.worker_name}</p>
                {form?.worker_signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.worker_signature} alt="PCO signature" className="h-12" />
                ) : (
                  <p className="text-gray-400">Sign.</p>
                )}
              </td>
              <td className="border border-gray-900 px-2 py-1 w-1/4 align-top">
                <p className="font-semibold mb-1">Client: {form?.client_name ?? report.client_name}</p>
                {form?.client_signature ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.client_signature} alt="Client signature" className="h-12" />
                ) : (
                  <p className="text-gray-400">Sign.</p>
                )}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
}
