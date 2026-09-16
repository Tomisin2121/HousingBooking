import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/store';
import { Colors } from '@/constants/theme';

export default function Index() {
  const { token, user, loading } = useAuth();

  if (loading || (token && !user)) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.light.background }}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (token && user) return <Redirect href="/(tabs)/feed" />;
  return <Redirect href="/login" />;
}