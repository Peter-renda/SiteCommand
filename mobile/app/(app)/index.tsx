import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
} from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getProjects } from '../../lib/api';
import { useAuth } from '../../context/AuthContext';
import { LoadingSpinner } from '../../components/ui/LoadingSpinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Colors } from '../../constants/colors';
import type { Project } from '../../types';

const STATUS_COLOR: Record<string, 'blue' | 'green' | 'yellow' | 'gray' | 'red'> = {
  active: 'green',
  bidding: 'blue',
  planning: 'yellow',
  completed: 'gray',
  on_hold: 'red',
};

function formatCurrency(value: number) {
  if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `$${(value / 1_000).toFixed(0)}K`;
  return `$${value.toFixed(0)}`;
}

function ProjectCard({ project }: { project: Project }) {
  const statusColor = STATUS_COLOR[project.status] ?? 'gray';
  const hasLocation = project.city || project.state;

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => router.push(`/(app)/projects/${project.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardLeft}>
          <Text style={styles.projectName} numberOfLines={1}>
            {project.name}
          </Text>
          {project.project_number && (
            <Text style={styles.projectNumber}>#{project.project_number}</Text>
          )}
        </View>
        <Badge
          label={project.status.replace('_', ' ')}
          color={statusColor}
        />
      </View>

      <View style={styles.cardMeta}>
        {hasLocation && (
          <View style={styles.metaRow}>
            <Ionicons name="location-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              {[project.city, project.state].filter(Boolean).join(', ')}
            </Text>
          </View>
        )}
        {project.value > 0 && (
          <View style={styles.metaRow}>
            <Ionicons name="cash-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>{formatCurrency(project.value)}</Text>
          </View>
        )}
        {project.completion_date && (
          <View style={styles.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.textMuted} />
            <Text style={styles.metaText}>
              Due {new Date(project.completion_date).toLocaleDateString()}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<Project[]>([]);
  const [filtered, setFiltered] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    try {
      const data = await getProjects();
      setProjects(data);
      setFiltered(data);
    } catch {
      // silently fail – user will see empty state
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      q
        ? projects.filter(
            (p) =>
              p.name.toLowerCase().includes(q) ||
              p.city?.toLowerCase().includes(q) ||
              p.project_number?.toLowerCase().includes(q),
          )
        : projects,
    );
  }, [search, projects]);

  if (loading) return <LoadingSpinner message="Loading projects…" />;

  const firstName = user?.first_name ?? 'there';

  return (
    <View style={styles.root}>
      {/* Greeting */}
      <View style={styles.greeting}>
        <Text style={styles.greetingText}>Hey, {firstName}</Text>
        <Text style={styles.greetingSub}>{projects.length} project{projects.length !== 1 ? 's' : ''}</Text>
      </View>

      {/* Search */}
      <View style={styles.searchBar}>
        <Ionicons name="search" size={16} color={Colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search projects…"
          placeholderTextColor={Colors.textSubtle}
          value={search}
          onChangeText={setSearch}
          autoCapitalize="none"
          returnKeyType="search"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch('')}>
            <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={(p) => p.id}
        renderItem={({ item }) => <ProjectCard project={item} />}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => { setRefreshing(true); load(); }}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={
          <EmptyState
            title={search ? 'No matching projects' : 'No projects yet'}
            message={
              search
                ? 'Try a different search term.'
                : 'Projects assigned to you will appear here.'
            }
          />
        }
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  greeting: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 },
  greetingText: { color: Colors.text, fontSize: 22, fontWeight: '700' },
  greetingSub: { color: Colors.textMuted, fontSize: 13, marginTop: 2 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  list: { padding: 16, paddingTop: 0, flexGrow: 1 },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 10,
  },
  cardLeft: { flex: 1 },
  projectName: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  projectNumber: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  cardMeta: { gap: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { color: Colors.textMuted, fontSize: 13 },
});
