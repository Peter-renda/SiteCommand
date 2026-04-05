import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProjects, getRFIs, getTasks } from '../../lib/api';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { rfiStatusBadge, taskStatusBadge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import type { RFI, Task, Project } from '../../types';

type SectionItem =
  | { kind: 'rfi'; item: RFI; projectId: string; projectName: string }
  | { kind: 'task'; item: Task; projectId: string; projectName: string };

export default function MyItemsScreen() {
  const [sections, setSections] = useState<{ title: string; data: SectionItem[] }[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try {
      const projects = await getProjects();
      const openRFIs: SectionItem[] = [];
      const openTasks: SectionItem[] = [];

      await Promise.all(
        projects.map(async (project: Project) => {
          const [rfis, tasks] = await Promise.all([
            getRFIs(project.id).catch(() => [] as RFI[]),
            getTasks(project.id).catch(() => [] as Task[]),
          ]);
          rfis
            .filter((r: RFI) => r.status === 'open')
            .forEach((r: RFI) =>
              openRFIs.push({ kind: 'rfi', item: r, projectId: project.id, projectName: project.name }),
            );
          tasks
            .filter((t: Task) => t.status !== 'completed')
            .forEach((t: Task) =>
              openTasks.push({ kind: 'task', item: t, projectId: project.id, projectName: project.name }),
            );
        }),
      );

      const built: { title: string; data: SectionItem[] }[] = [];
      if (openRFIs.length > 0) built.push({ title: `Open RFIs (${openRFIs.length})`, data: openRFIs });
      if (openTasks.length > 0) built.push({ title: `Active Tasks (${openTasks.length})`, data: openTasks });
      setSections(built);
    } catch {
      // fail silently
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  if (loading) return <LoadingSpinner message="Loading your items…" />;

  return (
    <View style={styles.root}>
      <SectionList
        sections={sections}
        keyExtractor={(item, i) => `${item.kind}-${item.item.id}-${i}`}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{section.title}</Text>
          </View>
        )}
        renderItem={({ item: si }) => {
          if (si.kind === 'rfi') {
            const rfi = si.item;
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/(app)/projects/${si.projectId}/rfis/${rfi.id}`)}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemLabel}>RFI #{rfi.rfi_number}</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>{rfi.subject}</Text>
                    <Text style={styles.itemProject}>{si.projectName}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {rfiStatusBadge(rfi.status)}
                    {rfi.due_date && (
                      <Text style={styles.itemDue}>
                        Due {new Date(rfi.due_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          } else {
            const task = si.item;
            return (
              <TouchableOpacity
                style={styles.item}
                onPress={() => router.push(`/(app)/projects/${si.projectId}/tasks/${task.id}`)}
              >
                <View style={styles.itemHeader}>
                  <View style={styles.itemLeft}>
                    <Text style={styles.itemLabel}>Task #{task.task_number}</Text>
                    <Text style={styles.itemTitle} numberOfLines={1}>{task.title}</Text>
                    <Text style={styles.itemProject}>{si.projectName}</Text>
                  </View>
                  <View style={styles.itemRight}>
                    {taskStatusBadge(task.status)}
                    {task.due_date && (
                      <Text style={styles.itemDue}>
                        Due {new Date(task.due_date).toLocaleDateString()}
                      </Text>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            );
          }
        }}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="checkmark-circle-outline" size={48} color={Colors.textSubtle} />
            <Text style={styles.emptyTitle}>All clear!</Text>
            <Text style={styles.emptyMsg}>You have no open RFIs or tasks.</Text>
          </View>
        }
        contentContainerStyle={styles.list}
        stickySectionHeadersEnabled
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  list: { flexGrow: 1 },
  sectionHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  sectionTitle: { color: Colors.textMuted, fontSize: 13, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  item: {
    backgroundColor: Colors.surface,
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
  },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
  itemLeft: { flex: 1, gap: 2 },
  itemRight: { alignItems: 'flex-end', gap: 4 },
  itemLabel: { color: Colors.textMuted, fontSize: 11, fontWeight: '600' },
  itemTitle: { color: Colors.text, fontSize: 15, fontWeight: '500' },
  itemProject: { color: Colors.textSubtle, fontSize: 12 },
  itemDue: { color: Colors.textMuted, fontSize: 11 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, gap: 8 },
  emptyTitle: { color: Colors.text, fontSize: 18, fontWeight: '600' },
  emptyMsg: { color: Colors.textMuted, fontSize: 14, textAlign: 'center' },
});
