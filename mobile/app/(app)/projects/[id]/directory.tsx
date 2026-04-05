import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  TextInput,
  Linking,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDirectory } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Colors } from '../../../../constants/colors';
import type { DirectoryContact } from '../../../../types';

export default function DirectoryScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [contacts, setContacts] = useState<DirectoryContact[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDirectory(projectId);
      setContacts(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  const filtered = search
    ? contacts.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.company?.toLowerCase().includes(search.toLowerCase()) ||
          c.role?.toLowerCase().includes(search.toLowerCase()),
      )
    : contacts;

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Stack.Screen options={{ title: 'Directory' }} />
      <View style={styles.root}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={16} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search contacts…"
            placeholderTextColor={Colors.textSubtle}
            value={search}
            onChangeText={setSearch}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')}>
              <Ionicons name="close-circle" size={16} color={Colors.textMuted} />
            </TouchableOpacity>
          )}
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(c) => c.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
          renderItem={({ item: contact }) => (
            <View style={styles.card}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {contact.name
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()}
                </Text>
              </View>
              <View style={styles.info}>
                <Text style={styles.name}>{contact.name}</Text>
                {contact.title && <Text style={styles.title}>{contact.title}</Text>}
                {contact.company && <Text style={styles.company}>{contact.company}</Text>}
                {contact.role && (
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleText}>{contact.role}</Text>
                  </View>
                )}
              </View>
              <View style={styles.actions}>
                {contact.phone && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Linking.openURL(`tel:${contact.phone}`)}
                  >
                    <Ionicons name="call-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                )}
                {contact.email && (
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => Linking.openURL(`mailto:${contact.email}`)}
                  >
                    <Ionicons name="mail-outline" size={18} color={Colors.primary} />
                  </TouchableOpacity>
                )}
              </View>
            </View>
          )}
          contentContainerStyle={styles.list}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          ListEmptyComponent={
            <EmptyState
              title="No contacts"
              message={search ? 'No contacts match your search.' : 'No contacts in the project directory.'}
            />
          }
        />
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: { flex: 1, color: Colors.text, fontSize: 15 },
  list: { padding: 16, flexGrow: 1 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
    gap: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary + '33',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: Colors.primary, fontSize: 15, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  title: { color: Colors.textMuted, fontSize: 13 },
  company: { color: Colors.textSubtle, fontSize: 12 },
  roleBadge: {
    alignSelf: 'flex-start',
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
    marginTop: 2,
  },
  roleText: { color: Colors.textMuted, fontSize: 11, fontWeight: '500' },
  actions: { flexDirection: 'row', gap: 4 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: Colors.primary + '1a',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
