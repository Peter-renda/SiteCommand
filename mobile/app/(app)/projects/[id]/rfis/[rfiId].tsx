import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getRFI, addRFIResponse, updateRFI } from '../../../../../lib/api';
import { LoadingSpinner } from '../../../../../components/ui/LoadingSpinner';
import { rfiStatusBadge } from '../../../../../components/ui/Badge';
import { Button } from '../../../../../components/ui/Button';
import { Colors } from '../../../../../constants/colors';
import type { RFI } from '../../../../../types';

export default function RFIDetailScreen() {
  const { id: projectId, rfiId } = useLocalSearchParams<{ id: string; rfiId: string }>();
  const [rfi, setRFI] = useState<RFI | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [response, setResponse] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    try {
      const data = await getRFI(projectId, rfiId);
      setRFI(data);
    } catch {
      Alert.alert('Error', 'Failed to load RFI.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function handleClose() {
    if (!rfi) return;
    Alert.alert('Close RFI', 'Mark this RFI as closed?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Close RFI',
        onPress: async () => {
          try {
            await updateRFI(projectId, rfiId, { status: 'closed' });
            setRFI((r) => r ? { ...r, status: 'closed' } : r);
          } catch {
            Alert.alert('Error', 'Failed to close RFI.');
          }
        },
      },
    ]);
  }

  async function handleSubmitResponse() {
    if (!response.trim()) return;
    setSubmitting(true);
    try {
      const newResponse = await addRFIResponse(projectId, rfiId, response.trim());
      setRFI((r) => r ? { ...r, responses: [...(r.responses ?? []), newResponse] } : r);
      setResponse('');
    } catch {
      Alert.alert('Error', 'Failed to submit response.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!rfi) return <View style={styles.root}><Text style={{ color: Colors.text, padding: 16 }}>Not found.</Text></View>;

  return (
    <>
      <Stack.Screen options={{ title: `RFI #${rfi.rfi_number}` }} />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          style={styles.root}
          contentContainerStyle={styles.container}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
          }
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Text style={styles.rfiNumber}>RFI #{rfi.rfi_number}</Text>
              {rfiStatusBadge(rfi.status)}
            </View>
            {rfi.status === 'open' && (
              <TouchableOpacity onPress={handleClose} style={styles.closeBtn}>
                <Ionicons name="checkmark-circle-outline" size={18} color={Colors.success} />
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            )}
          </View>

          <Text style={styles.subject}>{rfi.subject}</Text>

          {/* Meta */}
          <View style={styles.metaRow}>
            {rfi.due_date && (
              <MetaChip icon="calendar-outline" label={`Due ${new Date(rfi.due_date).toLocaleDateString()}`} />
            )}
            <MetaChip icon="time-outline" label={new Date(rfi.created_at).toLocaleDateString()} />
          </View>

          {/* Question */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Question</Text>
            <View style={styles.textBlock}>
              <Text style={styles.bodyText}>{rfi.question}</Text>
            </View>
          </View>

          {/* Responses */}
          {(rfi.responses ?? []).length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Responses ({rfi.responses!.length})</Text>
              {rfi.responses!.map((res) => (
                <View key={res.id} style={styles.responseCard}>
                  <View style={styles.responseHeader}>
                    <Ionicons name="person-circle-outline" size={16} color={Colors.textMuted} />
                    <Text style={styles.responseDate}>
                      {new Date(res.created_at).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.responseText}>{res.response}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Add Response */}
          {rfi.status !== 'closed' && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Add Response</Text>
              <TextInput
                style={styles.responseInput}
                placeholder="Type your response…"
                placeholderTextColor={Colors.textSubtle}
                value={response}
                onChangeText={setResponse}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
              />
              <Button
                title="Submit Response"
                onPress={handleSubmitResponse}
                loading={submitting}
                disabled={!response.trim()}
                style={{ marginTop: 10 }}
              />
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function MetaChip({ icon, label }: { icon: keyof typeof Ionicons.glyphMap; label: string }) {
  return (
    <View style={styles.metaChip}>
      <Ionicons name={icon} size={13} color={Colors.textMuted} />
      <Text style={styles.metaChipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 32 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rfiNumber: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  closeBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: Colors.successBg, paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8 },
  closeBtnText: { color: Colors.success, fontSize: 13, fontWeight: '600' },
  subject: { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 12, lineHeight: 26 },
  metaRow: { flexDirection: 'row', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: Colors.surface, borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10, borderWidth: 1, borderColor: Colors.border },
  metaChipText: { color: Colors.textMuted, fontSize: 12 },
  section: { marginBottom: 20 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  textBlock: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14 },
  bodyText: { color: Colors.text, fontSize: 15, lineHeight: 22 },
  responseCard: { backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14, marginBottom: 8 },
  responseHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 },
  responseDate: { color: Colors.textMuted, fontSize: 12 },
  responseText: { color: Colors.text, fontSize: 14, lineHeight: 21 },
  responseInput: { backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border, borderRadius: 10, padding: 12, color: Colors.text, fontSize: 15, minHeight: 100 },
});
