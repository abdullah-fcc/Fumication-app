import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  RefreshControl, ActivityIndicator,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../lib/api';
import { clearAuth, useAuth } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime } from '../lib/format';
import type { RootStackParamList } from '../navigation/AppNavigator';

interface Job {
  id: string;
  title: string;
  status: string;
  scheduled_at: string;
  location_name: string | null;
}

type Props = NativeStackScreenProps<RootStackParamList, 'Jobs'>;

export default function JobsScreen({ navigation }: Props) {
  const { user, setUser } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data } = await api.get('/api/jobs', { params: { worker_id: user.id } });
    setJobs(data);
  }, [user]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
  }

  async function handleLogout() {
    await clearAuth();
    setUser(null);
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>My Jobs</Text>
          <Text style={styles.subtitle}>{user?.name}</Text>
        </View>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.logout}>Sign out</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={jobs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <Text style={styles.empty}>No jobs assigned to you yet.</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => navigation.navigate('JobDetail', { jobId: item.id })}
          >
            <View style={styles.cardHeader}>
              <Text style={styles.cardTitle}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardLocation}>{item.location_name ?? 'No location assigned'}</Text>
            <Text style={styles.cardDate}>{formatDateTime(item.scheduled_at)}</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  logout: { fontSize: 13, color: '#4f46e5', fontWeight: '600' },
  list: { paddingHorizontal: 16, paddingBottom: 24, gap: 10 },
  empty: { textAlign: 'center', color: '#9ca3af', marginTop: 40, fontSize: 14 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
  },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 },
  cardTitle: { fontSize: 15, fontWeight: '600', color: '#111827', flex: 1, marginRight: 8 },
  cardLocation: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  cardDate: { fontSize: 12, color: '#9ca3af' },
});
