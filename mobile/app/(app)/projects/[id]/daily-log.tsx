import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  FlatList,
  RefreshControl,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getDailyLogs, createDailyLog } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { Button } from '../../../../components/ui/Button';
import { Colors } from '../../../../constants/colors';
import type { DailyLog } from '../../../../types';

type View = 'list' | 'create';

function LogCard({ log, onPress }: { log: DailyLog; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.logCard} onPress={onPress}>
      <View style={styles.logCardHeader}>
        <Text style={styles.logDate}>{new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</Text>
        {log.weather_conditions && (
          <View style={styles.weatherChip}>
            <Ionicons name="partly-sunny-outline" size={12} color={Colors.textMuted} />
            <Text style={styles.weatherText}>{log.weather_conditions}</Text>
            {log.weather_temp && <Text style={styles.weatherText}>{log.weather_temp}</Text>}
          </View>
        )}
      </View>
      {log.manpower?.length > 0 && (
        <View style={styles.manpowerRow}>
          <Ionicons name="people-outline" size={13} color={Colors.textMuted} />
          <Text style={styles.manpowerText}>
            {log.manpower.reduce((sum, m) => sum + m.workers, 0)} workers on site
          </Text>
        </View>
      )}
      {log.notes && <Text style={styles.logNotes} numberOfLines={2}>{log.notes}</Text>}
    </TouchableOpacity>
  );
}

function LogDetail({ log, onBack }: { log: DailyLog; onBack: () => void }) {
  return (
    <ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      <TouchableOpacity onPress={onBack} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 }}>
        <Ionicons name="chevron-back" size={18} color={Colors.primary} />
        <Text style={{ color: Colors.primary, fontSize: 15 }}>Back to Logs</Text>
      </TouchableOpacity>

      <Text style={styles.detailTitle}>
        {new Date(log.log_date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
      </Text>

      {/* Weather */}
      {(log.weather_conditions || log.weather_temp) && (
        <Section title="Weather">
          <Row label="Conditions" value={log.weather_conditions ?? '—'} />
          {log.weather_temp && <Row label="Temperature" value={log.weather_temp} />}
          {log.weather_wind && <Row label="Wind" value={log.weather_wind} />}
        </Section>
      )}

      {/* Manpower */}
      {log.manpower?.length > 0 && (
        <Section title="Manpower">
          {log.manpower.map((m, i) => (
            <View key={i} style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: Colors.border }}>
              <Text style={{ color: Colors.text, flex: 1 }}>{m.company}</Text>
              <Text style={{ color: Colors.textMuted }}>{m.workers} workers · {m.hours}h</Text>
            </View>
          ))}
        </Section>
      )}

      {/* Site Activity */}
      {log.inspections && <Section title="Inspections"><Text style={styles.sectionBody}>{log.inspections}</Text></Section>}
      {log.deliveries && <Section title="Deliveries"><Text style={styles.sectionBody}>{log.deliveries}</Text></Section>}
      {log.visitors && <Section title="Visitors"><Text style={styles.sectionBody}>{log.visitors}</Text></Section>}
      {log.delays && <Section title="Delays"><Text style={styles.sectionBody}>{log.delays}</Text></Section>}
      {log.safety_violations && <Section title="Safety Violations"><Text style={[styles.sectionBody, { color: Colors.danger }]}>{log.safety_violations}</Text></Section>}
      {log.accidents && <Section title="Accidents"><Text style={[styles.sectionBody, { color: Colors.danger }]}>{log.accidents}</Text></Section>}
      {log.notes && <Section title="Notes"><Text style={styles.sectionBody}>{log.notes}</Text></Section>}
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 20 }}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 10, borderWidth: 1, borderColor: Colors.border, padding: 14 }}>
        {children}
      </View>
    </View>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 }}>
      <Text style={{ color: Colors.textMuted, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: Colors.text, fontSize: 13 }}>{value}</Text>
    </View>
  );
}

export default function DailyLogScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [view, setView] = useState<'list' | 'create' | 'detail'>('list');
  const [selectedLog, setSelectedLog] = useState<DailyLog | null>(null);

  // Create form state
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [weather, setWeather] = useState('');
  const [temp, setTemp] = useState('');
  const [notes, setNotes] = useState('');
  const [delays, setDelays] = useState('');
  const [safety, setSafety] = useState('');
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    try {
      const data = await getDailyLogs(projectId);
      setLogs(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  async function handleSave() {
    if (!date) { Alert.alert('Error', 'Date is required.'); return; }
    setSaving(true);
    try {
      const newLog = await createDailyLog(projectId, {
        log_date: date,
        weather_conditions: weather || null,
        weather_temp: temp || null,
        notes: notes || null,
        delays: delays || null,
        safety_violations: safety || null,
        manpower: [],
        photos: [],
      });
      setLogs((prev) => [newLog, ...prev]);
      setView('list');
      setWeather(''); setTemp(''); setNotes(''); setDelays(''); setSafety('');
      Alert.alert('Saved', 'Daily log entry created.');
    } catch {
      Alert.alert('Error', 'Failed to create daily log.');
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  if (view === 'detail' && selectedLog) {
    return (
      <>
        <Stack.Screen options={{ title: 'Daily Log' }} />
        <LogDetail log={selectedLog} onBack={() => setView('list')} />
      </>
    );
  }

  if (view === 'create') {
    return (
      <>
        <Stack.Screen options={{ title: 'New Log Entry' }} />
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
            <Field label="Date">
              <TextInput style={styles.input} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD" placeholderTextColor={Colors.textSubtle} />
            </Field>
            <Field label="Weather Conditions">
              <TextInput style={styles.input} value={weather} onChangeText={setWeather} placeholder="e.g. Partly cloudy" placeholderTextColor={Colors.textSubtle} />
            </Field>
            <Field label="Temperature">
              <TextInput style={styles.input} value={temp} onChangeText={setTemp} placeholder="e.g. 72°F" placeholderTextColor={Colors.textSubtle} />
            </Field>
            <Field label="Delays">
              <TextInput style={[styles.input, { minHeight: 80 }]} value={delays} onChangeText={setDelays} placeholder="Describe any delays…" placeholderTextColor={Colors.textSubtle} multiline textAlignVertical="top" />
            </Field>
            <Field label="Safety Violations">
              <TextInput style={[styles.input, { minHeight: 80 }]} value={safety} onChangeText={setSafety} placeholder="Describe any safety issues…" placeholderTextColor={Colors.textSubtle} multiline textAlignVertical="top" />
            </Field>
            <Field label="Notes">
              <TextInput style={[styles.input, { minHeight: 100 }]} value={notes} onChangeText={setNotes} placeholder="General notes for the day…" placeholderTextColor={Colors.textSubtle} multiline textAlignVertical="top" />
            </Field>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
              <Button title="Cancel" variant="secondary" onPress={() => setView('list')} style={{ flex: 1 }} />
              <Button title="Save Log" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Daily Log',
          headerRight: () => (
            <TouchableOpacity onPress={() => setView('create')} style={{ marginRight: 4 }}>
              <Ionicons name="add-circle-outline" size={26} color={Colors.primary} />
            </TouchableOpacity>
          ),
        }}
      />
      <FlatList
        data={logs}
        keyExtractor={(l) => l.id}
        style={{ backgroundColor: Colors.background }}
        contentContainerStyle={{ padding: 16, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
        renderItem={({ item }) => (
          <LogCard log={item} onPress={() => { setSelectedLog(item); setView('detail'); }} />
        )}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListEmptyComponent={
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 48, gap: 12 }}>
            <Ionicons name="journal-outline" size={48} color={Colors.textSubtle} />
            <Text style={{ color: Colors.text, fontSize: 16, fontWeight: '600' }}>No Log Entries</Text>
            <Text style={{ color: Colors.textMuted, textAlign: 'center', fontSize: 14 }}>Tap + to add today's daily log.</Text>
          </View>
        }
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ marginBottom: 14 }}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 14,
    gap: 6,
  },
  logCardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  logDate: { color: Colors.text, fontSize: 15, fontWeight: '600' },
  weatherChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  weatherText: { color: Colors.textMuted, fontSize: 12 },
  manpowerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  manpowerText: { color: Colors.textMuted, fontSize: 13 },
  logNotes: { color: Colors.textMuted, fontSize: 13, lineHeight: 18 },
  detailTitle: { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 20 },
  sectionTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  sectionBody: { color: Colors.text, fontSize: 14, lineHeight: 21 },
  fieldLabel: { color: Colors.textMuted, fontSize: 13, fontWeight: '500', marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    color: Colors.text,
    fontSize: 15,
  },
});
