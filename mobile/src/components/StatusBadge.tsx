import { View, Text, StyleSheet } from 'react-native';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  scheduled:   { bg: '#e0e7ff', text: '#4338ca', label: 'Scheduled' },
  in_progress: { bg: '#fef3c7', text: '#b45309', label: 'In Progress' },
  completed:   { bg: '#d1fae5', text: '#047857', label: 'Completed' },
  cancelled:   { bg: '#fee2e2', text: '#b91c1c', label: 'Cancelled' },
};

export default function StatusBadge({ status }: { status: string }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES.scheduled;
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{s.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  text: { fontSize: 11, fontWeight: '600' },
});
