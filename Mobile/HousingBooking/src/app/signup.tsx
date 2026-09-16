import { useState } from 'react';
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Button, Input, Chip } from '@/components/ui';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { authApi } from '@/lib/api';
import { useAuth } from '@/lib/store';

export default function SignupScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [type, setType] = useState<'student' | 'agent'>('student');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [matricNo, setMatricNo] = useState('');
  const [department, setDepartment] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [phone, setPhone] = useState('');
  const [idDocUrl, setIdDocUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');
    setLoading(true);
    try {
      let data;
      if (type === 'student') {
        data = await authApi.signupStudent({ name, email, password, matric_no: matricNo, department });
      } else {
        data = await authApi.signupAgent({ name, email, password, business_name: businessName, phone, id_document_url: idDocUrl || 'https://placeholder.doc' });
      }
      setAuth(data.token, data.user, data.agent || null);
      router.replace('/');
    } catch (e: any) {
      setError(e?.response?.data?.error || 'Signup failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1, backgroundColor: Colors.light.surface }}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Create Account</Text>
        <View style={styles.card}>
          <View style={{ flexDirection: 'row', marginBottom: Spacing.lg }}>
            {(['student', 'agent'] as const).map((t) => (
              <Chip key={t} label={t === 'student' ? 'Student' : 'Housing Agent'} active={type === t} onPress={() => setType(t)} />
            ))}
          </View>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Input label="Full Name" value={name} onChangeText={setName} placeholder="Ade Okafor" />
          <Input label="Email" keyboardType="email-address" autoCapitalize="none" value={email} onChangeText={setEmail} placeholder="you@student.futa.edu.ng" />
          <Input label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="Min 8 characters" />

          {type === 'student' && (
            <>
              <Input label="Matric Number" value={matricNo} onChangeText={setMatricNo} placeholder="FUT/2022/001" />
              <Input label="Department" value={department} onChangeText={setDepartment} placeholder="Computer Science" />
            </>
          )}

          {type === 'agent' && (
            <>
              <Input label="Business Name" value={businessName} onChangeText={setBusinessName} />
              <Input label="Phone" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
              <Input label="ID Document URL" value={idDocUrl} onChangeText={setIdDocUrl} placeholder="https://... (Cloudinary URL)" />
              <Text style={{ color: Colors.light.orange, fontSize: 12, backgroundColor: '#FEF3C7', padding: 10, borderRadius: Radius.sm, marginBottom: Spacing.md }}>
                Agent accounts require admin approval before posting listings.
              </Text>
            </>
          )}

          <Button onPress={handleSubmit} loading={loading}>
            {type === 'agent' ? 'Create Agent Account' : 'Sign Up as Student'}
          </Button>
          <Text style={{ textAlign: 'center', color: Colors.light.textSoft, marginTop: Spacing.lg }}>
            Already have an account?{' '}
            <Text style={{ color: Colors.light.primary, fontWeight: '600' }} onPress={() => router.replace('/login')}>Sign In</Text>
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flexGrow: 1, justifyContent: 'center', padding: Spacing.xl, paddingVertical: Spacing.xxl },
  title: { fontSize: 24, fontWeight: '800', textAlign: 'center', color: Colors.light.text, marginBottom: Spacing.lg },
  card: { width: '100%', maxWidth: 420, alignSelf: 'center', backgroundColor: Colors.light.white, borderRadius: Radius.lg, padding: Spacing.xl, borderWidth: 1, borderColor: Colors.light.line },
  error: { backgroundColor: '#FEE2E2', color: Colors.light.red, fontSize: 13, textAlign: 'center', padding: 10, borderRadius: Radius.sm, marginBottom: Spacing.md },
});