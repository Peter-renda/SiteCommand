import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTask, updateTask } from '../../../../../lib/api';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { taskStatusBadge } from '../../../../../components/ui/Badge';
import { Colors } from '../../../../../constants/colors';
import type { Task, TaskStatus } from '../../../../../types';

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'not_started', label: 'Not Started' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'completed', label: 'Completed' },
];

export default function TaskDetailScreen() {
  const { id: projectId, taskId } = useLocalSearchParams<{ id: string; taskId: string }>();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [updating, setUpdating] = useState(false);

  async function load() {
    try {
      const data = await getTask(projectId, taskId);
      setTask(data);
    } catch {
      Alert.alert('Error', 'Failed to load task.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function changeStatus(status: TaskStatus) {
    if (!task || task.status === status) return;
    setUpdating(true);
    try {
      const updated = await updateTask(projectId, taskId, { status });
      setTask(updated);
    } catch {
      Alert.alert('Error', 'Failed to update status.');
    } finally {
      setUpdating(false);
    }
  }

  function promptStatusChange() {
    Alert.alert('Update Status', 'Select a new status:', [
      ...STATUS_OPTIONS.map((s) => ({
        text: s.label,
        onPress: () => changeStatus(s.value),
      })),
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  if (loading) return <LoadingSpinner />;
  if (!task) return <View style={styles.root}><Text style={{ color: Colors.text, padding: 16 }}>Not found.</Text></View>;

  return (
    <>
      <Stack.Screen options={{ title: `Task #${task.task_number}` }} />
      <ScrollView
        style={styles.root}
        contentContainerStyle={styles.container}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.taskNum}>Task #{task.task_number}</Text>
          {taskStatusBadge(task.status)}
        </View>

        <Text style={styles.title}>{task.title}</Text>

        {/* Status Change */}
        <TouchableOpacity style={styles.statusBtn} onPress={promptStatusChange} disabled={updating}>
          <Ionicons name="refresh-outline" size={16} color={Colors.primary} />
          <Text style={styles.statusBtnText}>Change Status</Text>
        </TouchableOpacity>

        {/* Details */}
        <View style={styles.detailsCard}>
          {task.category && (
            <DetailRow icon="pricetag-outline" label="Category" value={task.category} />
          )}
          {task.due_date && (
            <DetailRow
              icon="calendar-outline"
              label="Due Date"
              value={new Date(task.due_date).toLocaleDateString()}
            />
          )}
          <DetailRow
            icon="time-outline"
            label="Created"
            value={new Date(task.created_at).toLocaleDateString()}
          />
          {task.assignees?.length > 0 && (
            <DetailRow
              icon="people-outline"
              label="Assignees"
              value={`${task.assignees.length} person${task.assignees.length > 1 ? 's' : ''}`}
            />
          )}
        </View>

        {/* Description */}
        {task.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Description</Text>
            <View style={styles.textBlock}>
              <Text style={styles.bodyText}>{task.description}</Text>
            </View>
          </View>
        )}
      </ScrollView>
    </>
  );
}

function DetailRow({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailLeft}>
        <Ionicons name={icon} size={14} color={Colors.textMuted} />
        <Text style={styles.detailLabel}>{label}</Text>
      </View>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 },
  taskNum: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  title: { color: Colors.text, fontSize: 20, fontWeight: '700', lineHeight: 26, marginBottom: 16 },
  statusBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: Colors.primary + '22',
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginBottom: 20,
  },
  statusBtnText: { color: Colors.primary, fontSize: 14, fontWeight: '600' },
  detailsCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 13,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  detailLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailLabel: { color: Colors.textMuted, fontSize: 14 },
  detailValue: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  section: { marginBottom: 16 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  textBlock: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  bodyText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
});
