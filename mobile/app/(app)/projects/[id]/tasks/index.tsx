import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, router, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getTasks } from '../../../../../lib/api';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../../components/ui/EmptyState';
import { taskStatusBadge } from '../../../../../components/ui/Badge';
import { Colors } from '../../../../../constants/colors';
import type { Task, TaskStatus } from '../../../../../types';

type FilterStatus = 'all' | TaskStatus;

const FILTERS: { key: FilterStatus; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'not_started', label: 'Not Started' },
  { key: 'in_progress', label: 'In Progress' },
  { key: 'blocked', label: 'Blocked' },
  { key: 'completed', label: 'Done' },
];

export default function TasksScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState<FilterStatus>('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getTasks(projectId);
      setTasks(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const filtered = filter === 'all' ? tasks : tasks.filter((t) => t.status === filter);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Stack.Screen options={{ title: 'Tasks' }} />
      <View style={styles.root}>
        {/* Filter bar */}
        <View style={styles.filterScroll}>
          {FILTERS.map((f) => {
            const count = f.key === 'all' ? tasks.length : tasks.filter((t) => t.status === f.key).length;
            return (
              <TouchableOpacity
                key={f.key}
                style={[styles.chip, filter === f.key && styles.chipActive]}
                onPress={() => setFilter(f.key)}
              >
                <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
                  {f.label} {count > 0 ? `(${count})` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(t) => t.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
          renderItem={({ item: task }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => router.push(`/(app)/projects/${projectId}/tasks/${task.id}`)}
            >
              <View style={styles.cardTop}>
                <Text style={styles.taskNumber}>Task #{task.task_number}</Text>
                {taskStatusBadge(task.status)}
              </View>
              <Text style={styles.title} numberOfLines={2}>{task.title}</Text>
              <View style={styles.meta}>
                {task.category && (
                  <View style={styles.metaItem}>
                    <Ionicons name="pricetag-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{task.category}</Text>
                  </View>
                )}
                {task.due_date && (
                  <View style={styles.metaItem}>
                    <Ionicons name="calendar-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>Due {new Date(task.due_date).toLocaleDateString()}</Text>
                  </View>
                )}
                {task.assignees?.length > 0 && (
                  <View style={styles.metaItem}>
                    <Ionicons name="people-outline" size={12} color={Colors.textMuted} />
                    <Text style={styles.metaText}>{task.assignees.length}</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          ListEmptyComponent={
            <EmptyState title="No tasks" message="No tasks found for this filter." />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  filterScroll: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    padding: 12,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  chip: { paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20, backgroundColor: Colors.background },
  chipActive: { backgroundColor: Colors.primary + '22' },
  chipText: { color: Colors.textMuted, fontSize: 13 },
  chipTextActive: { color: Colors.primary, fontWeight: '600' },
  list: { padding: 16, flexGrow: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 8,
  },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  taskNumber: { color: Colors.textMuted, fontSize: 12, fontWeight: '600' },
  title: { color: Colors.text, fontSize: 15, fontWeight: '500', lineHeight: 20 },
  meta: { flexDirection: 'row', gap: 12, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { color: Colors.textMuted, fontSize: 12 },
});
