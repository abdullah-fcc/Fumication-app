export type ReportType = 'routine' | 'follow_up' | 'complaint';

export interface PesticideEntry {
  name: string;
  rateLabel: string;
  checked: boolean;
  rate: string;
}

export interface ChecklistEntry {
  name: string;
  checked: boolean;
}

export const TRAP_NUMBERS = Array.from({ length: 25 }, (_, i) => i + 1);

export interface TrapRow {
  status: Record<number, string>;
  count: Record<number, string>;
  action: Record<number, string>;
}

export const STATUS_OPTIONS = [
  { value: '', label: '—' },
  { value: 'okay', label: 'Okay' },
  { value: 'damage', label: 'Damage' },
  { value: 'lost', label: 'Lost' },
  { value: 'na', label: 'N/A' },
];

export const ACTION_OPTIONS = [
  { value: '', label: '—' },
  { value: 'no_need', label: 'No Need' },
  { value: 'replaced', label: 'Replaced' },
  { value: 'new', label: 'New' },
  { value: 'unmount', label: 'Unmount' },
  { value: 'mounted', label: 'Mounted' },
];

export interface ReportFormData {
  date: string;
  client: string;
  time_in: string;
  time_out: string;
  service_address: string;
  report_type: ReportType;

  pesticides: PesticideEntry[];
  methods: ChecklistEntry[];
  targets: ChecklistEntry[];
  area_remarks: string;

  time_of_application: string;
  follow_up_required: string;
  reason_if_not_done: string;

  monitoring: {
    glue_trap: TrapRow;
    live_trap: TrapRow;
    mouse_trap: TrapRow;
  };

  notes: string;
  worker_signature: string;
  client_signature: string;
  client_name: string;
}

export const DEFAULT_PESTICIDES: PesticideEntry[] = [
  { name: 'Alphaguard 10% SC', rateLabel: 'ml/L', checked: false, rate: '' },
  { name: 'Topbait gold gel', rateLabel: 'spots/m3', checked: false, rate: '' },
  { name: 'Fly Bait', rateLabel: 'gm/SFT', checked: false, rate: '' },
  { name: 'Permethrin 0.5% powder', rateLabel: 'gm/SFT', checked: false, rate: '' },
  { name: '', rateLabel: '', checked: false, rate: '' },
  { name: '', rateLabel: '', checked: false, rate: '' },
];

export const DEFAULT_METHODS: ChecklistEntry[] = [
  'Injecting (I)',
  'General Spraying (IRS)',
  'Spot Treatment (SP)',
  'ULV Fogging (ULV)',
  'Thermal Fogging (TF)',
  'Dusting (D)',
  'Gel App./Insect Baiting (B)',
  'Aviciding (AV)',
  'Soil Injecting (SI)',
  'Fumigation (F)',
  '',
  '',
].map((name) => ({ name, checked: false }));

export const DEFAULT_TARGETS: ChecklistEntry[] = [
  'Mosquitoes',
  'Flies',
  'Roaches',
  'Birds',
  'Termites',
  'Bed Bugs',
  'Wasps',
  'Moths',
  'Bees',
  'SGP',
  '',
  '',
].map((name) => ({ name, checked: false }));

function emptyTrapRow(): TrapRow {
  return { status: {}, count: {}, action: {} };
}

export function defaultReportFormData(): ReportFormData {
  return {
    date: new Date().toISOString().slice(0, 10),
    client: '',
    time_in: '',
    time_out: '',
    service_address: '',
    report_type: 'routine',
    pesticides: DEFAULT_PESTICIDES.map((p) => ({ ...p })),
    methods: DEFAULT_METHODS.map((m) => ({ ...m })),
    targets: DEFAULT_TARGETS.map((t) => ({ ...t })),
    area_remarks: '',
    time_of_application: '',
    follow_up_required: '',
    reason_if_not_done: '',
    monitoring: {
      glue_trap: emptyTrapRow(),
      live_trap: emptyTrapRow(),
      mouse_trap: emptyTrapRow(),
    },
    notes: '',
    worker_signature: '',
    client_signature: '',
    client_name: '',
  };
}
