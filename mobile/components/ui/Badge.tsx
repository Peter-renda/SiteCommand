import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors } from '../../constants/colors';

type BadgeColor = 'blue' | 'green' | 'yellow' | 'red' | 'gray' | 'cyan';

interface BadgeProps {
  label: string;
  color?: BadgeColor;
  style?: ViewStyle;
}

const colorMap: Record<BadgeColor, { bg: string; text: string }> = {
  blue: { bg: '#1e3a5f', text: Colors.primaryLight },
  green: { bg: Colors.successBg, text: Colors.success },
  yellow: { bg: Colors.warningBg, text: Colors.warning },
  red: { bg: Colors.dangerBg, text: Colors.danger },
  gray: { bg: Colors.surfaceAlt, text: Colors.textMuted },
  cyan: { bg: Colors.infoBg, text: Colors.info },
};

export function Badge({ label, color = 'gray', style }: BadgeProps) {
  const { bg, text } = colorMap[color];
  return (
    <View style={[styles.badge, { backgroundColor: bg }, style]}>
      <Text style={[styles.label, { color: text }]}>{label}</Text>
    </View>
  );
}

// Convenience helpers for domain-specific statuses
export function rfiStatusBadge(status: string) {
  const map: Record<string, BadgeColor> = {
    open: 'blue',
    closed: 'green',
    draft: 'gray',
    overdue: 'red',
  };
  return <Badge label={status.charAt(0).toUpperCase() + status.slice(1)} color={map[status] ?? 'gray'} />;
}

export function taskStatusBadge(status: string) {
  const labelMap: Record<string, string> = {
    not_started: 'Not Started',
    in_progress: 'In Progress',
    completed: 'Completed',
    blocked: 'Blocked',
  };
  const colorMap2: Record<string, BadgeColor> = {
    not_started: 'gray',
    in_progress: 'blue',
    completed: 'green',
    blocked: 'red',
  };
  return (
    <Badge
      label={labelMap[status] ?? status}
      color={colorMap2[status] ?? 'gray'}
    />
  );
}

export function submittalStatusBadge(status: string) {
  const labelMap: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    under_review: 'Under Review',
    approved: 'Approved',
    approved_as_noted: 'Approved as Noted',
    revise_resubmit: 'Revise & Resubmit',
    rejected: 'Rejected',
  };
  const colorMap2: Record<string, BadgeColor> = {
    draft: 'gray',
    submitted: 'cyan',
    under_review: 'blue',
    approved: 'green',
    approved_as_noted: 'yellow',
    revise_resubmit: 'yellow',
    rejected: 'red',
  };
  return (
    <Badge
      label={labelMap[status] ?? status}
      color={colorMap2[status] ?? 'gray'}
    />
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
});
