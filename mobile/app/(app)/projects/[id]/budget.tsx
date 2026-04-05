import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, Stack } from 'expo-router';
import { getBudget } from '../../../../lib/api';
import { LoadingSpinner } from '../../../../components/ui/LoadingSpinner';
import { EmptyState } from '../../../../components/ui/EmptyState';
import { Colors } from '../../../../constants/colors';
import type { BudgetLineItem } from '../../../../types';

function fmt(n: number) {
  if (Math.abs(n) >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
  if (Math.abs(n) >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
  return `$${n.toFixed(0)}`;
}

function pct(part: number, total: number) {
  if (!total) return '—';
  return `${Math.round((part / total) * 100)}%`;
}

function SummaryCard({ items }: { items: BudgetLineItem[] }) {
  const revised = items.reduce((s, i) => s + i.original_budget_amount + i.budget_modifications + i.approved_cos, 0);
  const committed = items.reduce((s, i) => s + i.committed_costs, 0);
  const spent = items.reduce((s, i) => s + i.job_to_date_costs, 0);
  const variance = revised - committed;

  return (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Budget Summary</Text>
      <View style={styles.summaryGrid}>
        <SummaryCell label="Revised Budget" value={fmt(revised)} />
        <SummaryCell label="Committed" value={fmt(committed)} />
        <SummaryCell label="Spent to Date" value={fmt(spent)} sub={pct(spent, revised)} />
        <SummaryCell label="Variance" value={fmt(variance)} positive={variance >= 0} />
      </View>
      {revised > 0 && (
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${Math.min((committed / revised) * 100, 100)}%` as any }]} />
        </View>
      )}
    </View>
  );
}

function SummaryCell({ label, value, sub, positive }: { label: string; value: string; sub?: string; positive?: boolean }) {
  return (
    <View style={styles.summaryCell}>
      <Text style={styles.summaryCellLabel}>{label}</Text>
      <Text style={[styles.summaryCellValue, positive === false && { color: Colors.danger }, positive === true && { color: Colors.success }]}>
        {value}
      </Text>
      {sub && <Text style={styles.summaryCellSub}>{sub}</Text>}
    </View>
  );
}

export default function BudgetScreen() {
  const { id: projectId } = useLocalSearchParams<{ id: string }>();
  const [items, setItems] = useState<BudgetLineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getBudget(projectId);
      setItems(data);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [projectId]);

  useEffect(() => { load(); }, [load]);

  if (loading) return <LoadingSpinner />;

  return (
    <>
      <Stack.Screen options={{ title: 'Budget' }} />
      <FlatList
        data={items}
        keyExtractor={(i) => i.id}
        style={{ backgroundColor: Colors.background }}
        contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={Colors.primary} />
        }
        ListHeaderComponent={items.length > 0 ? <SummaryCard items={items} /> : null}
        renderItem={({ item }) => {
          const revisedBudget = item.original_budget_amount + item.budget_modifications + item.approved_cos;
          const isExpanded = expanded === item.id;

          return (
            <TouchableOpacity
              style={styles.lineItem}
              onPress={() => setExpanded(isExpanded ? null : item.id)}
            >
              <View style={styles.lineItemHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.costCode}>{item.cost_code}</Text>
                  <Text style={styles.lineDesc} numberOfLines={isExpanded ? undefined : 1}>{item.description}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.lineAmount}>{fmt(revisedBudget)}</Text>
                  {item.committed_costs > 0 && (
                    <Text style={styles.lineSub}>{pct(item.committed_costs, revisedBudget)} committed</Text>
                  )}
                </View>
              </View>

              {isExpanded && (
                <View style={styles.lineDetail}>
                  <DetailRow label="Original Budget" value={fmt(item.original_budget_amount)} />
                  <DetailRow label="Approved COs" value={fmt(item.approved_cos)} />
                  <DetailRow label="Pending Changes" value={fmt(item.pending_budget_changes)} />
                  <DetailRow label="Committed" value={fmt(item.committed_costs)} />
                  <DetailRow label="Spent to Date" value={fmt(item.job_to_date_costs)} />
                  <DetailRow label="Invoiced" value={fmt(item.commitments_invoiced)} />
                </View>
              )}
            </TouchableOpacity>
          );
        }}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={<EmptyState title="No budget items" message="No budget line items found for this project." />}
      />
    </>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  summaryCard: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    marginBottom: 16,
  },
  summaryTitle: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 12 },
  summaryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 0 },
  summaryCell: { width: '50%', paddingVertical: 8, paddingRight: 8 },
  summaryCellLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 2 },
  summaryCellValue: { color: Colors.text, fontSize: 16, fontWeight: '700' },
  summaryCellSub: { color: Colors.textSubtle, fontSize: 11, marginTop: 1 },
  progressBar: { height: 4, backgroundColor: Colors.surfaceAlt, borderRadius: 2, marginTop: 12 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  lineItem: {
    backgroundColor: Colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  lineItemHeader: { flexDirection: 'row', gap: 8 },
  costCode: { color: Colors.textMuted, fontSize: 11, fontWeight: '600', marginBottom: 2 },
  lineDesc: { color: Colors.text, fontSize: 14, fontWeight: '500' },
  lineAmount: { color: Colors.text, fontSize: 14, fontWeight: '700' },
  lineSub: { color: Colors.textMuted, fontSize: 11, marginTop: 2 },
  lineDetail: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: 6,
  },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailLabel: { color: Colors.textMuted, fontSize: 13 },
  detailValue: { color: Colors.text, fontSize: 13, fontWeight: '500' },
});
