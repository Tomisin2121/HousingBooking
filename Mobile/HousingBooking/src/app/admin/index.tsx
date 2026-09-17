import { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Screen, Button, BadgeView } from '@/components/ui';
import { useAuth } from '@/lib/store';
import { adminApi } from '@/lib/api';
import { Colors, Spacing, Radius } from '@/constants/theme';

interface AdminAgent {
  id: string;
  name?: string;
  email?: string;
  business_name: string;
  phone?: string;
  verified: boolean;
  status: string;
  listing_count: number;
}

export default function AdminPortalScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [agents, setAgents] = useState<AdminAgent[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    try {
      const d = await adminApi.allAgents();
      setAgents(d.agents || []);
    } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (user?.role !== 'admin') router.replace('/(tabs)/feed');
  }, [user]);

  const onRefresh = async () => { setRefreshing(true); await load(); setRefreshing(false); };

  if (user?.role !== 'admin') return null;

  const pending = agents.filter((a) => a.status === 'pending');

  const handleApprove = (a: AdminAgent) => {
    Alert.alert('Approve Agent', `Approve "${a.business_name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Approve', onPress: async () => { await adminApi.reviewAgent(a.id, 'approve'); load(); } },
    ]);
  };

  const handleDelete = (a: AdminAgent) => {
    Alert.alert(
      'Delete Agent',
      `Delete "${a.business_name}" and ALL their listings and bookings? This cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: async () => { await adminApi.deleteAgent(a.id); load(); } },
      ]
    );
  };

  const statusColor = (s: string): 'green' | 'orange' | 'red' => {
    if (s === 'approved') return 'green';
    if (s === 'pending') return 'orange';
    return 'red';
  };

  const renderCard = (a: AdminAgent) => (
    <View key={a.id} style={styles.card}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <View style={{ flex: 1 }}>
          <Text style={{ fontWeight: '700', color: Colors.light.text, fontSize: 14 }}>{a.business_name}</Text>
          <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
            {a.name} | {a.email}
          </Text>
          <Text style={{ color: Colors.light.textSoft, fontSize: 12, marginTop: 2 }}>
            {a.phone} · {a.listing_count} listings
          </Text>
        </View>
        <BadgeView color={statusColor(a.status)}>{a.status}</BadgeView>
      </View>
      <View style={{ flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md }}>
        {a.status !== 'approved' && (
          <Button size="sm" onPress={() => handleApprove(a)}>Approve</Button>
        )}
        <Button size="sm" variant="danger" onPress={() => handleDelete(a)}>Delete</Button>
      </View>
    </View>
  );

  return (
    <Screen>
      <ScrollView contentContainerStyle={{ paddingBottom: 100 }} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}>
        {/* Header */}
        <View style={styles.header}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, alignSelf: 'flex-start' }}>
            <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
              <MaterialIcons name="arrow-back" size={22} color={Colors.light.text} />
            </TouchableOpacity>
            <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.text, flex: 1 }}>Admin Portal</Text>
          </View>
          <Text style={{ color: Colors.light.textSoft, fontSize: 13, marginTop: Spacing.sm }}>{user?.name}</Text>
        </View>

        <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg }}>
          {pending.length > 0 && (
            <>
              <Text style={styles.sectionTitle}>Pending Approvals ({pending.length})</Text>
              {pending.map(renderCard)}
            </>
          )}
          <Text style={styles.sectionTitle}>All Agents</Text>
          {agents.length === 0 ? (
            <Text style={{ textAlign: 'center', color: Colors.light.textMuted, paddingVertical: 40 }}>No agents yet</Text>
          ) : agents.map(renderCard)}
        </View>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { padding: Spacing.lg, backgroundColor: Colors.light.white, borderBottomWidth: 1, borderBottomColor: Colors.light.line },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text, marginBottom: Spacing.md, marginTop: Spacing.lg },
  card: { backgroundColor: Colors.light.white, borderRadius: Radius.md, padding: Spacing.md, borderWidth: 1, borderColor: Colors.light.line, marginBottom: Spacing.md },
});