import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import { Button } from '../../components/ui/Button';
import { Colors } from '../../constants/colors';

function Row({ icon, label, value }: { icon: keyof typeof Ionicons.glyphMap; label: string; value: string }) {
  return (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Ionicons name={icon} size={18} color={Colors.textMuted} />
        <Text style={styles.rowLabel}>{label}</Text>
      </View>
      <Text style={styles.rowValue} numberOfLines={1}>{value}</Text>
    </View>
  );
}

const ROLE_LABEL: Record<string, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  member: 'Member',
};

export default function ProfileScreen() {
  const { user, logout, isAdmin, isSuperAdmin } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const org = user?.organizations?.[0];
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ') || 'User';
  const initials = [user?.first_name?.[0], user?.last_name?.[0]].filter(Boolean).join('').toUpperCase() || 'U';
  const roleLabel = ROLE_LABEL[org?.role ?? ''] ?? (isAdmin ? 'Admin' : 'Member');

  async function handleLogout() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          setLoggingOut(true);
          try {
            await logout();
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.container}>
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{user?.email}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleText}>{roleLabel}</Text>
        </View>
      </View>

      {/* Account Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.card}>
          {org && <Row icon="business-outline" label="Organization" value={org.name} />}
          {isSuperAdmin && org?.billing?.subscription_status && (
            <Row
              icon="card-outline"
              label="Subscription"
              value={org.billing.subscription_status.charAt(0).toUpperCase() + org.billing.subscription_status.slice(1)}
            />
          )}
          {org && (
            <Row
              icon="people-outline"
              label="Projects"
              value={`${org.projects.length} project${org.projects.length !== 1 ? 's' : ''}`}
            />
          )}
        </View>
      </View>

      {/* Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        <View style={styles.card}>
          <TouchableOpacity style={styles.actionRow}>
            <Ionicons name="notifications-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.actionLabel}>Notifications</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSubtle} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
          <View style={styles.divider} />
          <TouchableOpacity style={styles.actionRow}>
            <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
            <Text style={styles.actionLabel}>Change Password</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textSubtle} style={{ marginLeft: 'auto' }} />
          </TouchableOpacity>
        </View>
      </View>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="danger"
        loading={loggingOut}
        style={styles.signOut}
      />

      <Text style={styles.version}>SiteCommand v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.background },
  container: { padding: 16, paddingBottom: 40 },
  avatarSection: { alignItems: 'center', paddingVertical: 28 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: { color: Colors.white, fontSize: 28, fontWeight: '700' },
  name: { color: Colors.text, fontSize: 20, fontWeight: '700' },
  email: { color: Colors.textMuted, fontSize: 14, marginTop: 4 },
  roleBadge: {
    marginTop: 10,
    backgroundColor: Colors.surfaceAlt,
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  roleText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },
  section: { marginBottom: 20 },
  sectionTitle: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 8,
    marginLeft: 4,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  rowLabel: { color: Colors.textMuted, fontSize: 14 },
  rowValue: { color: Colors.text, fontSize: 14, fontWeight: '500', maxWidth: '55%' },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 10,
  },
  actionLabel: { color: Colors.text, fontSize: 15 },
  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },
  signOut: { marginTop: 8 },
  version: { color: Colors.textSubtle, fontSize: 12, textAlign: 'center', marginTop: 24 },
});
