// Generates a downloadable PDF for a Service Report, mirroring the layout
// of the "Daily Service Report (General)" template (Document # IFPCS-IPM-13).

import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
  TRAP_NUMBERS, statusLabel, actionLabel, type ReportFormData,
} from './reportForm';

interface ReportLike {
  id: string;
  created_at: string;
  client_name?: string;
  location_name?: string;
  location_address?: string;
  worker_name?: string;
  notes?: string;
  form_data?: ReportFormData | null;
}

const BORDER: [number, number, number] = [17, 24, 39];
const LIME_600: [number, number, number] = [101, 163, 13];
const SKY_100: [number, number, number] = [224, 242, 254];
const SKY_700: [number, number, number] = [3, 105, 161];
const EMERALD_100: [number, number, number] = [209, 250, 229];
const EMERALD_700: [number, number, number] = [4, 120, 87];
const RED_100: [number, number, number] = [254, 226, 226];
const RED_700: [number, number, number] = [185, 28, 28];
const ORANGE_100: [number, number, number] = [255, 237, 213];
const ORANGE_50: [number, number, number] = [255, 247, 240];
const LIME_50: [number, number, number] = [247, 254, 231];

const TRAP_SECTIONS: { key: 'glue_trap' | 'live_trap' | 'mouse_trap'; label: string }[] = [
  { key: 'glue_trap', label: 'Glue Trap' },
  { key: 'live_trap', label: 'Live Trap' },
  { key: 'mouse_trap', label: 'Mouse Trap' },
];

export function generateReportPdf(report: ReportLike) {
  const form = report.form_data ?? null;
  const doc = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 8;
  const usableWidth = pageWidth - margin * 2;

  doc.setLineHeightFactor(1.1);
  doc.setLineWidth(0.15);
  doc.setDrawColor(...BORDER);
  doc.setTextColor(...BORDER);

  // ── Title bar ─────────────────────────────────────────
  const titleHeight = 16;
  const titleLeftWidth = usableWidth - 60;
  doc.rect(margin, margin, titleLeftWidth, titleHeight);
  doc.setFillColor(...LIME_600);
  doc.rect(margin + (titleLeftWidth - 60) / 2, margin + 2, 60, titleHeight - 4, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('SERVICE REPORT', margin + titleLeftWidth / 2, margin + titleHeight / 2, {
    align: 'center', baseline: 'middle',
  });

  doc.setTextColor(...BORDER);
  doc.rect(margin + titleLeftWidth, margin, 60, titleHeight);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  const infoX = margin + titleLeftWidth + 2;
  doc.text('Document #  IFPCS-IPM-13', infoX, margin + 4);
  doc.text('Revision #  01', infoX, margin + 7.5);
  doc.text('Revision Date  01-January-24', infoX, margin + 11);
  doc.text('Effective Date From  02-January-24', infoX, margin + 14.5);

  let y = margin + titleHeight;

  // ── Date / Client / Time / Address ─────────────────────
  const dateStr = new Date(form?.date ?? report.created_at).toLocaleDateString('en-PK', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.2, lineColor: BORDER, textColor: BORDER },
    body: [
      [{ content: 'Date:', styles: { fontStyle: 'bold' } }, dateStr,
        { content: 'Client:', styles: { fontStyle: 'bold' } }, form?.client ?? report.client_name ?? report.location_name ?? ''],
      [{ content: 'Time In', styles: { fontStyle: 'bold' } }, form?.time_in ?? '',
        { content: 'Service\nAddress', rowSpan: 2, styles: { fontStyle: 'bold', valign: 'top' } },
        { content: form?.service_address ?? report.location_address ?? '', rowSpan: 2, styles: { valign: 'top' } }],
      [{ content: 'Time Out', styles: { fontStyle: 'bold' } }, form?.time_out ?? ''],
    ],
    columnStyles: {
      0: { cellWidth: 30, fillColor: undefined },
      1: { cellWidth: usableWidth / 3 - 30 },
      2: { cellWidth: 22 },
      3: { cellWidth: usableWidth - (usableWidth / 3) - 22 },
    },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Report type bar ─────────────────────────────────────
  const reportType = form?.report_type;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: {
      fontSize: 10, fontStyle: 'bold', halign: 'center', cellPadding: 2,
      lineColor: BORDER, textColor: BORDER,
    },
    body: [['ROUTINE', 'FOLLOW UP', 'COMPLAINT']],
    columnStyles: {
      0: { cellWidth: usableWidth / 3 },
      1: { cellWidth: usableWidth / 3 },
      2: { cellWidth: usableWidth / 3 },
    },
    didParseCell: (data) => {
      const col = data.column.index;
      const active = (col === 0 && reportType === 'routine')
        || (col === 1 && reportType === 'follow_up')
        || (col === 2 && reportType === 'complaint');
      const [bg, fg] = col === 0
        ? [SKY_100, SKY_700]
        : col === 1
        ? [EMERALD_100, EMERALD_700]
        : [RED_100, RED_700];
      data.cell.styles.fillColor = active ? fg : bg;
      data.cell.styles.textColor = active ? [255, 255, 255] : fg;
    },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Section I header ─────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: BORDER, textColor: BORDER, fillColor: LIME_50 },
    body: [[
      { content: 'Section I. Pesticide Application', styles: { fontStyle: 'bold', cellWidth: 55 } },
      'As per IPM basic principle, use pesticides only when no other options are left. Pesticides are '
      + 'supplement to IPM plan not stand alone solutions. Use pesticides to rescue emergencies and work on '
      + 'root causes. Ensure pesticide safety by pre & post notifications.',
    ]],
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: usableWidth - 55 } },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Section I table ───────────────────────────────────────
  const pesticideLines = (form?.pesticides ?? []).filter((p) => p.name)
    .map((p) => `${p.checked ? '[x]' : '[ ]'} ${p.name}`).join('\n');
  const rateLines = (form?.pesticides ?? []).filter((p) => p.name)
    .map((p) => p.rate || '-').join('\n');
  const methodLines = (form?.methods ?? []).filter((m) => m.name)
    .map((m) => `${m.checked ? '[x]' : '[ ]'} ${m.name}`).join('\n');
  const targetLines = (form?.targets ?? []).filter((t) => t.name)
    .map((t) => `${t.checked ? '[x]' : '[ ]'} ${t.name}`).join('\n');

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7, cellPadding: 1.2, lineColor: BORDER, textColor: BORDER, valign: 'top' },
    head: [['PESTICIDE', 'APP. RATE', 'METHOD', 'TARGET', 'AREA/REMARKS']],
    headStyles: { fillColor: SKY_100, textColor: BORDER, fontStyle: 'bold' },
    body: [[pesticideLines, rateLines, methodLines, targetLines, form?.area_remarks ?? '']],
    columnStyles: {
      0: { cellWidth: usableWidth * 0.22 },
      1: { cellWidth: usableWidth * 0.1 },
      2: { cellWidth: usableWidth * 0.22 },
      3: { cellWidth: usableWidth * 0.16 },
      4: { cellWidth: usableWidth * 0.3 },
    },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Time row ───────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDER, textColor: BORDER },
    body: [[
      `Time of Application: ${form?.time_of_application ?? ''}`,
      `Follow up (If Req.): ${form?.follow_up_required ?? ''}`,
      `Reason if not done: ${form?.reason_if_not_done ?? ''}`,
    ]],
    columnStyles: {
      0: { cellWidth: usableWidth / 3 },
      1: { cellWidth: usableWidth / 3 },
      2: { cellWidth: usableWidth / 3 },
    },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Section II header + legend ──────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 7.5, cellPadding: 1.5, lineColor: BORDER, textColor: BORDER, fillColor: LIME_50 },
    body: [[
      { content: 'Section II. Monitoring & Servicing', styles: { fontStyle: 'bold', cellWidth: 55 } },
      'Status: Okay / Damage / Lost / N.A\nAction: No Need / Replaced / New / Unmount / Mounted',
    ]],
    columnStyles: { 0: { cellWidth: 55 }, 1: { cellWidth: usableWidth - 55 } },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Trap grids ──────────────────────────────────────────
  const labelColWidth = 22;
  const trapColWidth = (usableWidth - labelColWidth) / TRAP_NUMBERS.length;
  const trapColumnStyles: Record<number, { cellWidth: number }> = {
    0: { cellWidth: labelColWidth },
  };
  TRAP_NUMBERS.forEach((_, i) => { trapColumnStyles[i + 1] = { cellWidth: trapColWidth }; });

  for (const { key, label } of TRAP_SECTIONS) {
    const row = form?.monitoring[key];
    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: { fontSize: 6, cellPadding: 0.8, halign: 'center', lineColor: BORDER, textColor: BORDER },
      head: [[label, ...TRAP_NUMBERS.map((n) => String(n))]],
      headStyles: { fillColor: ORANGE_100, textColor: BORDER, fontStyle: 'bold' },
      body: [
        ['Status', ...TRAP_NUMBERS.map((n) => statusLabel(row?.status[n] ?? ''))],
        ['Count', ...TRAP_NUMBERS.map((n) => row?.count[n] ?? '')],
        ['Action', ...TRAP_NUMBERS.map((n) => actionLabel(row?.action[n] ?? ''))],
      ],
      columnStyles: trapColumnStyles,
      didParseCell: (data) => {
        if (data.column.index === 0 && data.section === 'body') {
          data.cell.styles.fillColor = ORANGE_50;
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.halign = 'left';
        }
      },
    });
    y = (doc as any).lastAutoTable.finalY;
  }

  // ── Notes ─────────────────────────────────────────────
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 2, lineColor: BORDER, textColor: BORDER, minCellHeight: 12, valign: 'top' },
    body: [[`Notes (If Any): ${form?.notes || report.notes || ''}`]],
    columnStyles: { 0: { cellWidth: usableWidth } },
  });
  y = (doc as any).lastAutoTable.finalY;

  // ── Signatures ────────────────────────────────────────
  const sigColWidth = usableWidth / 4;
  const sigRowHeight = 22;
  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    theme: 'grid',
    styles: { fontSize: 8, cellPadding: 1.5, lineColor: BORDER, textColor: BORDER, minCellHeight: sigRowHeight, valign: 'top' },
    body: [[
      `PCO: ${report.worker_name ?? ''}`,
      `Client: ${form?.client_name ?? report.client_name ?? ''}`,
      '',
      '',
    ]],
    columnStyles: {
      0: { cellWidth: sigColWidth }, 1: { cellWidth: sigColWidth },
      2: { cellWidth: sigColWidth }, 3: { cellWidth: sigColWidth },
    },
    didDrawCell: (data) => {
      if (data.section !== 'body') return;
      const imgData = data.column.index === 0 ? form?.worker_signature : data.column.index === 1 ? form?.client_signature : null;
      if (imgData) {
        try {
          doc.addImage(imgData, 'PNG', data.cell.x + 2, data.cell.y + 6, sigColWidth - 4, sigRowHeight - 8);
        } catch {
          // ignore malformed signature image data
        }
      }
    },
  });

  const dateLabel = new Date(form?.date ?? report.created_at).toISOString().slice(0, 10);
  doc.save(`Service-Report-${dateLabel}-${report.id.slice(0, 8)}.pdf`);
}
