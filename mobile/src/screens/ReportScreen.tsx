import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../lib/api';
import TrapGrid from '../components/TrapGrid';
import {
  defaultReportFormData, type ReportFormData, type ReportType, type TrapRow,
} from '../lib/reportForm';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Report'>;

type TrapKey = 'glue_trap' | 'live_trap' | 'mouse_trap';

const TRAP_SECTIONS: { key: TrapKey; label: string }[] = [
  { key: 'glue_trap', label: 'Glue Trap' },
  { key: 'live_trap', label: 'Live Trap' },
  { key: 'mouse_trap', label: 'Mouse Trap' },
];

const REPORT_TYPES: { value: ReportType; label: string; color: string }[] = [
  { value: 'routine', label: 'Routine', color: '#0369a1' },
  { value: 'follow_up', label: 'Follow Up', color: '#047857' },
  { value: 'complaint', label: 'Complaint', color: '#b91c1c' },
];

function toTimeInputValue(isoString: string): string {
  const d = new Date(isoString);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

export default function ReportScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const [form, setForm] = useState<ReportFormData>(defaultReportFormData());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [jobRes, reportRes] = await Promise.all([
      api.get(`/api/jobs/${jobId}`),
      api.get(`/api/reports/job/${jobId}`),
    ]);
    const job = jobRes.data;
    const existing = reportRes.data;

    if (existing?.form_data) {
      setForm(existing.form_data);
    } else {
      setForm((f) => ({
        ...f,
        client: job.location_name || '',
        service_address: job.address || '',
        time_in: job.started_at ? toTimeInputValue(job.started_at) : '',
        time_out: job.completed_at ? toTimeInputValue(job.completed_at) : '',
      }));
    }
  }, [jobId]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  function set<K extends keyof ReportFormData>(key: K, value: ReportFormData[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function togglePesticide(index: number) {
    setForm((f) => {
      const pesticides = [...f.pesticides];
      pesticides[index] = { ...pesticides[index], checked: !pesticides[index].checked };
      return { ...f, pesticides };
    });
  }

  function setPesticideField(index: number, field: 'name' | 'rate', value: string) {
    setForm((f) => {
      const pesticides = [...f.pesticides];
      pesticides[index] = { ...pesticides[index], [field]: value };
      return { ...f, pesticides };
    });
  }

  function toggleChecklist(list: 'methods' | 'targets', index: number) {
    setForm((f) => {
      const items = [...f[list]];
      items[index] = { ...items[index], checked: !items[index].checked };
      return { ...f, [list]: items };
    });
  }

  function setChecklistName(list: 'methods' | 'targets', index: number, name: string) {
    setForm((f) => {
      const items = [...f[list]];
      items[index] = { ...items[index], name };
      return { ...f, [list]: items };
    });
  }

  function setTrapCell(trap: TrapKey, field: keyof TrapRow, num: number, value: string) {
    setForm((f) => ({
      ...f,
      monitoring: {
        ...f.monitoring,
        [trap]: {
          ...f.monitoring[trap],
          [field]: { ...f.monitoring[trap][field], [num]: value },
        },
      },
    }));
  }

  async function handleSubmit() {
    setSaving(true);
    setError('');
    try {
      await api.post('/api/reports', {
        job_id: jobId,
        client_name: form.client,
        notes: form.notes,
        pests_found: form.targets.filter((t) => t.checked && t.name).map((t) => t.name),
        areas_treated: form.area_remarks ? [form.area_remarks] : [],
        form_data: form,
      });
      navigation.goBack();
    } catch {
      setError('Failed to save report. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Visit details */}
        <Section title="Visit Details">
          <FieldRow>
            <Field label="Date" flex={1}>
              <TextInput style={styles.input} value={form.date} onChangeText={(v) => set('date', v)} placeholder="YYYY-MM-DD" />
            </Field>
            <Field label="Client" flex={1}>
              <TextInput style={styles.input} value={form.client} onChangeText={(v) => set('client', v)} placeholder="Client name" />
            </Field>
          </FieldRow>
          <FieldRow>
            <Field label="Time In" flex={1}>
              <TextInput style={styles.input} value={form.time_in} onChangeText={(v) => set('time_in', v)} placeholder="HH:MM" />
            </Field>
            <Field label="Time Out" flex={1}>
              <TextInput style={styles.input} value={form.time_out} onChangeText={(v) => set('time_out', v)} placeholder="HH:MM" />
            </Field>
          </FieldRow>
          <Field label="Service Address">
            <TextInput style={styles.input} value={form.service_address} onChangeText={(v) => set('service_address', v)} />
          </Field>
          <View style={styles.typeRow}>
            {REPORT_TYPES.map((t) => (
              <TouchableOpacity
                key={t.value}
                onPress={() => set('report_type', t.value)}
                style={[
                  styles.typeButton,
                  { backgroundColor: t.color, opacity: form.report_type === t.value ? 1 : 0.4 },
                ]}
              >
                <Text style={styles.typeButtonText}>{t.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </Section>

        {/* Section I */}
        <Section title="Section I. Pesticide Application" subtitle="Use pesticides only when no other options are left.">
          <Text style={styles.subLabel}>Pesticide / App. Rate</Text>
          {form.pesticides.map((p, i) => (
            <View key={i} style={styles.checklistRow}>
              <TouchableOpacity style={styles.checkbox} onPress={() => togglePesticide(i)}>
                {p.checked ? <View style={styles.checkboxFill} /> : null}
              </TouchableOpacity>
              {i < 4 ? (
                <Text style={styles.checklistLabel}>{p.name}</Text>
              ) : (
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={p.name}
                  onChangeText={(v) => setPesticideField(i, 'name', v)}
                  placeholder="Other pesticide…"
                />
              )}
              <TextInput
                style={[styles.input, styles.rateInput]}
                value={p.rate}
                onChangeText={(v) => setPesticideField(i, 'rate', v)}
                placeholder={p.rateLabel || 'rate'}
              />
            </View>
          ))}

          <Text style={[styles.subLabel, styles.spacedTop]}>Method</Text>
          {form.methods.map((m, i) => (
            <View key={i} style={styles.checklistRow}>
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleChecklist('methods', i)}>
                {m.checked ? <View style={styles.checkboxFill} /> : null}
              </TouchableOpacity>
              {i < 10 ? (
                <Text style={styles.checklistLabel}>{m.name}</Text>
              ) : (
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={m.name}
                  onChangeText={(v) => setChecklistName('methods', i, v)}
                  placeholder="Other method…"
                />
              )}
            </View>
          ))}

          <Text style={[styles.subLabel, styles.spacedTop]}>Target</Text>
          {form.targets.map((t, i) => (
            <View key={i} style={styles.checklistRow}>
              <TouchableOpacity style={styles.checkbox} onPress={() => toggleChecklist('targets', i)}>
                {t.checked ? <View style={styles.checkboxFill} /> : null}
              </TouchableOpacity>
              {i < 10 ? (
                <Text style={styles.checklistLabel}>{t.name}</Text>
              ) : (
                <TextInput
                  style={[styles.input, styles.flex1]}
                  value={t.name}
                  onChangeText={(v) => setChecklistName('targets', i, v)}
                  placeholder="Other target…"
                />
              )}
            </View>
          ))}

          <Field label="Area / Remarks" style={styles.spacedTop}>
            <TextInput
              style={[styles.input, styles.textarea]}
              value={form.area_remarks}
              onChangeText={(v) => set('area_remarks', v)}
              placeholder="Describe the areas treated…"
              multiline
              numberOfLines={3}
            />
          </Field>

          <Field label="Time of Application" style={styles.spacedTop}>
            <TextInput style={styles.input} value={form.time_of_application} onChangeText={(v) => set('time_of_application', v)} />
          </Field>
          <Field label="Follow up (If Req.)" style={styles.spacedTop}>
            <TextInput style={styles.input} value={form.follow_up_required} onChangeText={(v) => set('follow_up_required', v)} />
          </Field>
          <Field label="Reason if not done" style={styles.spacedTop}>
            <TextInput style={styles.input} value={form.reason_if_not_done} onChangeText={(v) => set('reason_if_not_done', v)} />
          </Field>
        </Section>

        {/* Section II */}
        <Section title="Section II. Monitoring & Servicing" subtitle="Tap Status/Action to cycle options. Scroll horizontally.">
          {TRAP_SECTIONS.map(({ key, label }) => (
            <View key={key} style={styles.spacedTop}>
              <TrapGrid label={label} row={form.monitoring[key]} onChange={(field, num, value) => setTrapCell(key, field, num, value)} />
            </View>
          ))}
        </Section>

        {/* Notes */}
        <Section title="Notes (If Any)">
          <TextInput
            style={[styles.input, styles.textarea]}
            value={form.notes}
            onChangeText={(v) => set('notes', v)}
            multiline
            numberOfLines={3}
          />
        </Section>

        {/* Sign-off */}
        <Section title="Sign-off">
          <Field label="Client Name">
            <TextInput
              style={styles.input}
              value={form.client_name}
              onChangeText={(v) => set('client_name', v)}
              placeholder="Client representative name"
            />
          </Field>
          <Text style={styles.note}>
            Signatures can be added from the web dashboard.
          </Text>
        </Section>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit} disabled={saving}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitButtonText}>Save Report</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      <View style={styles.spacedTop}>{children}</View>
    </View>
  );
}

function FieldRow({ children }: { children: React.ReactNode }) {
  return <View style={styles.fieldRow}>{children}</View>;
}

function Field({ label, children, flex, style }: { label: string; children: React.ReactNode; flex?: number; style?: object }) {
  return (
    <View style={[flex ? { flex } : undefined, style]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' },
  content: { padding: 16, paddingBottom: 40, gap: 12 },
  section: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#111827' },
  sectionSubtitle: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  spacedTop: { marginTop: 12 },
  fieldRow: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  fieldLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, paddingHorizontal: 10,
    paddingVertical: 8, fontSize: 14, backgroundColor: '#fff', color: '#111827',
  },
  textarea: { minHeight: 70, textAlignVertical: 'top' },
  flex1: { flex: 1 },
  typeRow: { flexDirection: 'row', gap: 8, marginTop: 12 },
  typeButton: { flex: 1, height: 40, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  typeButtonText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  subLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  checklistRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8 },
  checkbox: {
    width: 20, height: 20, borderRadius: 4, borderWidth: 1.5, borderColor: '#4f46e5',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  checkboxFill: { width: 12, height: 12, borderRadius: 2, backgroundColor: '#4f46e5' },
  checklistLabel: { fontSize: 13, color: '#374151', flex: 1 },
  rateInput: { width: 90 },
  note: { fontSize: 12, color: '#9ca3af', marginTop: 8 },
  error: { fontSize: 12, color: '#b91c1c', textAlign: 'center' },
  submitButton: {
    backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center',
  },
  submitButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
});
