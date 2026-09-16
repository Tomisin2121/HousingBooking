import React from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ActivityIndicator, Image, StyleSheet, ScrollView,
  Modal as RNModal, Platform, KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors, Radius, Spacing } from '@/constants/theme';

export function useColors() {
  return Colors.light;
}

export function Button({
  children, onPress, variant = 'primary', size = 'md', loading, disabled, style, textStyle,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  style?: any;
  textStyle?: any;
}) {
  const C = useColors();
  const variants: Record<string, { bg: string; text: string }> = {
    primary: { bg: C.primary, text: C.white },
    secondary: { bg: C.surface, text: C.text },
    ghost: { bg: 'transparent', text: C.textSoft },
    danger: { bg: C.red, text: C.white },
  };
  const sizes: Record<string, { py: number; px: number; fs: number }> = {
    sm: { py: 8, px: 12, fs: 13 },
    md: { py: 12, px: 16, fs: 14 },
    lg: { py: 15, px: 20, fs: 16 },
  };
  const v = variants[variant];
  const s = sizes[size];
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        {
          backgroundColor: v.bg, borderRadius: Radius.md,
          paddingVertical: s.py, paddingHorizontal: s.px, alignItems: 'center', justifyContent: 'center',
          flexDirection: 'row',
        },
        (disabled || loading) && { opacity: 0.5 },
        style,
      ]}
    >
      {loading && <ActivityIndicator color={v.text} size="small" style={{ marginRight: 8 }} />}
      <Text style={[{ color: v.text, fontSize: s.fs, fontWeight: '600' }, textStyle]}>{children}</Text>
    </TouchableOpacity>
  );
}

export function Input({
  label, error, value, onChangeText, placeholder, secureTextEntry, keyboardType, multiline, autoCapitalize, style,
}: {
  label?: string;
  error?: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder?: string;
  secureTextEntry?: boolean;
  keyboardType?: any;
  multiline?: boolean;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: any;
}) {
  const C = useColors();
  return (
    <View style={[{ marginBottom: Spacing.md }, style]}>
      {label && <Text style={styles.inputLabel}>{label}</Text>}
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={C.textMuted}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[
          styles.input,
          { borderColor: error ? C.red : C.line, color: C.text, backgroundColor: C.white },
          multiline && { minHeight: 80, textAlignVertical: 'top' },
        ]}
      />
      {error && <Text style={{ color: C.red, fontSize: 12, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

export function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  const C = useColors();
  return (
    <TouchableOpacity
      onPress={onPress}
      style={[
        styles.chip,
        { backgroundColor: active ? C.primary : C.surface, borderColor: active ? C.primary : C.line },
      ]}
    >
      <Text style={[styles.chipText, { color: active ? C.white : C.textSoft }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function BadgeView({ children, color = 'default' }: { children: React.ReactNode; color?: 'default' | 'green' | 'blue' | 'orange' | 'red' | 'purple' }) {
  const C = useColors();
  const map: Record<string, string> = {
    default: C.line, green: '#B6F5C0', blue: '#BFDBFE', orange: '#FED7AA', red: '#FECACA', purple: '#DDD6FE',
  };
  const tmap: Record<string, string> = {
    default: C.text, green: C.green, blue: C.blue, orange: C.orange, red: C.red, purple: C.purple,
  };
  return (
    <View style={[styles.badge, { backgroundColor: map[color] }]}>
      <Text style={[styles.badgeText, { color: tmap[color] }]}>{children}</Text>
    </View>
  );
}

export function Avatar({ src, name, size = 'md' }: { src?: string; name: string; size?: 'sm' | 'md' | 'lg' }) {
  const C = useColors();
  const dims = { sm: 32, md: 40, lg: 56 }[size];
  const fs = { sm: 11, md: 14, lg: 20 }[size];
  const initials = name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase();
  return src ? (
    <Image source={{ uri: src }} style={{ width: dims, height: dims, borderRadius: dims / 2 }} />
  ) : (
    <View style={{ width: dims, height: dims, borderRadius: dims / 2, backgroundColor: C.primaryLight, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: C.primary, fontSize: fs, fontWeight: '700' }}>{initials}</Text>
    </View>
  );
}

export function Screen({ children, scroll, bg, plusInset = false }: {
  children: React.ReactNode; scroll?: boolean; bg?: string; plusInset?: boolean;
}) {
  const C = useColors();
  const content = scroll ? (
    <ScrollView contentContainerStyle={{ paddingBottom: plusInset ? 120 : Spacing.xl }}>{children}</ScrollView>
  ) : (
    <View style={{ flex: 1 }}>{children}</View>
  );
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg || C.background }} edges={['top', 'left', 'right']}>
      {content}
    </SafeAreaView>
  );
}

export function ListItem({ children, onPress }: { children: React.ReactNode; onPress?: () => void }) {
  const C = useColors();
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={{
        backgroundColor: C.background, borderRadius: Radius.md, padding: Spacing.md,
        borderWidth: 1, borderColor: C.line, marginBottom: Spacing.sm,
      }}
    >
      {children}
    </TouchableOpacity>
  );
}

export function Modal({ visible, onClose, title, children }: {
  visible: boolean; onClose: () => void; title: string; children: React.ReactNode;
}) {
  const C = useColors();
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} onPress={onClose} />
        <View style={[styles.modalCard, { backgroundColor: C.background }]}>
          <View style={[styles.modalHeader, { borderBottomColor: C.line }]}>
            <Text style={[styles.modalTitle, { color: C.text }]}>{title}</Text>
            <TouchableOpacity onPress={onClose}><Text style={{ fontSize: 20, color: C.textSoft }}>✕</Text></TouchableOpacity>
          </View>
          <View style={{ padding: Spacing.lg }}>{children}</View>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  );
}

const styles = StyleSheet.create({
  inputLabel: { fontSize: 13, fontWeight: '500', marginBottom: 6, color: Colors.light.text },
  input: {
    borderWidth: 1, borderRadius: Radius.md, paddingHorizontal: Spacing.md,
    paddingVertical: Platform.OS === 'ios' ? 12 : 10, fontSize: 14,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.pill,
    marginRight: Spacing.sm, marginBottom: Spacing.xs, borderWidth: 1,
  },
  chipText: { fontSize: 12, fontWeight: '500' },
  badge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: Radius.pill },
  badgeText: { fontSize: 11, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', padding: Spacing.lg },
  modalCard: { borderRadius: Radius.lg, overflow: 'hidden' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: Spacing.lg, borderBottomWidth: 1 },
  modalTitle: { fontSize: 17, fontWeight: '700' },
});