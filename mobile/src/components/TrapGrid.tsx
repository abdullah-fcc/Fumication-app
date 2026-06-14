import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { ACTION_OPTIONS, STATUS_OPTIONS, TRAP_NUMBERS, type TrapRow } from '../lib/reportForm';

interface Props {
  label: string;
  row: TrapRow;
  onChange: (field: keyof TrapRow, num: number, value: string) => void;
}

function cycle(options: { value: string; label: string }[], current: string): string {
  const i = options.findIndex((o) => o.value === current);
  return options[(i + 1) % options.length].value;
}

export default function TrapGrid({ label, row, onChange }: Props) {
  return (
    <View>
      <Text style={styles.title}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator>
        <View>
          <View style={styles.row}>
            <View style={[styles.cell, styles.headerCell, styles.labelCell]} />
            {TRAP_NUMBERS.map((n) => (
              <View key={n} style={[styles.cell, styles.headerCell]}>
                <Text style={styles.headerText}>{n}</Text>
              </View>
            ))}
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text style={styles.labelText}>Status</Text>
            </View>
            {TRAP_NUMBERS.map((n) => {
              const value = row.status[n] ?? '';
              const label = STATUS_OPTIONS.find((o) => o.value === value)?.label ?? '—';
              return (
                <TouchableOpacity
                  key={n}
                  style={styles.cell}
                  onPress={() => onChange('status', n, cycle(STATUS_OPTIONS, value))}
                >
                  <Text style={styles.cellText}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text style={styles.labelText}>Count</Text>
            </View>
            {TRAP_NUMBERS.map((n) => (
              <TextInput
                key={n}
                style={[styles.cell, styles.input]}
                value={row.count[n] ?? ''}
                onChangeText={(v) => onChange('count', n, v)}
                keyboardType="numeric"
                textAlign="center"
              />
            ))}
          </View>

          <View style={styles.row}>
            <View style={[styles.cell, styles.labelCell]}>
              <Text style={styles.labelText}>Action</Text>
            </View>
            {TRAP_NUMBERS.map((n) => {
              const value = row.action[n] ?? '';
              const label = ACTION_OPTIONS.find((o) => o.value === value)?.label ?? '—';
              return (
                <TouchableOpacity
                  key={n}
                  style={styles.cell}
                  onPress={() => onChange('action', n, cycle(ACTION_OPTIONS, value))}
                >
                  <Text style={styles.cellText} numberOfLines={1}>{label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const CELL_WIDTH = 56;

const styles = StyleSheet.create({
  title: { fontSize: 14, fontWeight: '600', color: '#111827', marginBottom: 8 },
  row: { flexDirection: 'row' },
  cell: {
    width: CELL_WIDTH, height: 36, borderWidth: 0.5, borderColor: '#e5e7eb',
    alignItems: 'center', justifyContent: 'center',
  },
  labelCell: { width: 64, backgroundColor: '#f9fafb' },
  labelText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  headerCell: { backgroundColor: '#fff7ed' },
  headerText: { fontSize: 11, fontWeight: '600', color: '#6b7280' },
  cellText: { fontSize: 10, color: '#374151', paddingHorizontal: 2 },
  input: { fontSize: 12, color: '#111827', padding: 0 },
});
