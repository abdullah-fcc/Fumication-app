import { useCallback, useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator,
  ScrollView, Alert, RefreshControl,
} from 'react-native';
import * as Location from 'expo-location';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import api from '../lib/api';
import { useAuth } from '../lib/auth';
import StatusBadge from '../components/StatusBadge';
import { formatDateTime, formatDuration } from '../lib/format';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;
type ReportSummary = { id: string } | null;

interface Job {
  id: string;
  title: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  scheduled_at: string;
  started_at: string | null;
  completed_at: string | null;
  location_name: string | null;
  address: string | null;
}

interface CheckIn {
  id: string;
  lat: string | number;
  lng: string | number;
  checked_in_at: string;
  worker_email: string;
}

const NEXT_STATUS: Record<string, { next: string; label: string } | undefined> = {
  scheduled: { next: 'in_progress', label: 'Start Job' },
  in_progress: { next: 'completed', label: 'End Job' },
};

export default function JobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { user } = useAuth();
  const [job, setJob] = useState<Job | null>(null);
  const [checkIn, setCheckIn] = useState<CheckIn | null>(null);
  const [report, setReport] = useState<ReportSummary>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [checkInLoading, setCheckInLoading] = useState(false);

  const load = useCallback(async () => {
    const [jobRes, checkInsRes, reportRes] = await Promise.all([
      api.get(`/api/jobs/${jobId}`),
      api.get(`/api/check-ins/job/${jobId}`),
      api.get(`/api/reports/job/${jobId}`),
    ]);
    setJob(jobRes.data);
    const mine = (checkInsRes.data as CheckIn[]).find((c) => c.worker_email === user?.email);
    setCheckIn(mine ?? null);
    setReport(reportRes.data ?? null);
  }, [jobId, user]);

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

  async function handleCheckIn() {
    setCheckInLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Location permission needed', 'Please allow location access to check in.');
        return;
      }
      const pos = await Location.getCurrentPositionAsync({});
      await api.post('/api/check-ins', {
        job_id: jobId,
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
      await load();
    } catch {
      Alert.alert('Check-in failed', 'Please try again.');
    } finally {
      setCheckInLoading(false);
    }
  }

  async function handleStatusChange(next: string) {
    setStatusLoading(true);
    try {
      await api.patch(`/api/jobs/${jobId}/status`, { status: next });
      await load();
    } catch {
      Alert.alert('Update failed', 'Please try again.');
    } finally {
      setStatusLoading(false);
    }
  }

  if (loading || !job) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#4f46e5" />
      </View>
    );
  }

  const action = NEXT_STATUS[job.status];
  const duration = job.started_at && job.completed_at
    ? formatDuration(job.started_at, job.completed_at)
    : null;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{job.title}</Text>
        <StatusBadge status={job.status} />
      </View>
      <Text style={styles.location}>{job.location_name ?? 'No location assigned'}</Text>
      {job.address ? <Text style={styles.address}>{job.address}</Text> : null}

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Scheduled</Text>
        <Text style={styles.cardValue}>{formatDateTime(job.scheduled_at)}</Text>

        {job.started_at && (
          <>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Started</Text>
            <Text style={styles.cardValue}>{formatDateTime(job.started_at)}</Text>
          </>
        )}
        {job.completed_at && (
          <>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Completed</Text>
            <Text style={styles.cardValue}>{formatDateTime(job.completed_at)}</Text>
          </>
        )}
        {duration && (
          <>
            <Text style={[styles.cardLabel, styles.cardLabelSpaced]}>Time Taken</Text>
            <Text style={styles.cardValue}>{duration}</Text>
          </>
        )}
      </View>

      {job.status === 'in_progress' && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Check-in</Text>
          {checkIn ? (
            <View style={styles.checkedIn}>
              <Text style={styles.checkedInText}>✓ Checked in</Text>
              <Text style={styles.cardValue}>{formatDateTime(checkIn.checked_in_at)}</Text>
              <Text style={styles.cardSubvalue}>
                {Number(checkIn.lat).toFixed(5)}, {Number(checkIn.lng).toFixed(5)}
              </Text>
            </View>
          ) : (
            <TouchableOpacity style={styles.secondaryButton} onPress={handleCheckIn} disabled={checkInLoading}>
              {checkInLoading ? <ActivityIndicator color="#4f46e5" /> : <Text style={styles.secondaryButtonText}>Share my location</Text>}
            </TouchableOpacity>
          )}
        </View>
      )}

      {action && (
        <TouchableOpacity style={styles.primaryButton} onPress={() => handleStatusChange(action.next)} disabled={statusLoading}>
          {statusLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>{action.label}</Text>}
        </TouchableOpacity>
      )}

      {job.status === 'completed' && (
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Job Report</Text>
          <Text style={styles.cardSubvalue}>
            {report ? 'Report submitted for this job' : 'This job is complete — fill out the fumigation report'}
          </Text>
          <TouchableOpacity
            style={styles.secondaryButton}
            onPress={() => navigation.navigate('Report', { jobId })}
          >
            <Text style={styles.secondaryButtonText}>{report ? 'Edit Report' : 'Fill Report'}</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f6f8' },
  content: { padding: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#f4f6f8' },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 },
  location: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  address: { fontSize: 13, color: '#9ca3af', marginTop: 2 },
  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#e5e7eb',
    marginTop: 16,
  },
  cardLabel: { fontSize: 11, fontWeight: '700', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: 0.5 },
  cardLabelSpaced: { marginTop: 12 },
  cardValue: { fontSize: 15, fontWeight: '600', color: '#111827', marginTop: 4 },
  cardSubvalue: { fontSize: 12, color: '#9ca3af', marginTop: 2 },
  checkedIn: { marginTop: 4 },
  checkedInText: { fontSize: 14, fontWeight: '600', color: '#047857' },
  primaryButton: {
    backgroundColor: '#4f46e5', borderRadius: 10, paddingVertical: 14,
    alignItems: 'center', marginTop: 16,
  },
  primaryButtonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  secondaryButton: {
    borderWidth: 1, borderColor: '#4f46e5', borderRadius: 10, paddingVertical: 12,
    alignItems: 'center', marginTop: 8,
  },
  secondaryButtonText: { color: '#4f46e5', fontWeight: '600', fontSize: 14 },
});
