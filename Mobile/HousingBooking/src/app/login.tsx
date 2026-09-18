import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRouter } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { Button, Input } from "@/components/ui";
import { Colors, Spacing, Radius } from "@/constants/theme";
import { authApi } from "@/lib/api";
import { useAuth } from "@/lib/store";

export default function LoginScreen() {
  const router = useRouter();
  const { setAuth } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const data = await authApi.login({ email, password });
      setAuth(data.token, data.user, data.agent || null);
      router.replace("/");
    } catch (e: any) {
      setError(e?.response?.data?.error || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={{ flex: 1, backgroundColor: Colors.light.surface }}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.logoWrap}>
          <MaterialIcons name="home" size={34} color={Colors.light.white} />
        </View>
        <Text style={styles.title}>Off Campus</Text>
        <Text style={styles.subtitle}>FUTA Off-Campus Housing</Text>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Sign In</Text>
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <Input
            label="Email"
            keyboardType="email-address"
            autoCapitalize="none"
            placeholder="you@student.futa.edu.ng"
            value={email}
            onChangeText={setEmail}
          />
          <View style={{ position: "relative" }}>
            <Input
              label="Password"
              secureTextEntry={!showPw}
              placeholder="••••••••"
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPw(!showPw)}
              style={{ position: "absolute", right: 12, top: 38 }}
            >
              {showPw ? (
                <MaterialIcons
                  name="visibility-off"
                  size={16}
                  color={Colors.light.textSoft}
                />
              ) : (
                <MaterialIcons
                  name="visibility"
                  size={16}
                  color={Colors.light.textSoft}
                />
              )}
            </TouchableOpacity>
          </View>
          <Button
            onPress={handleLogin}
            loading={loading}
            style={{ marginTop: Spacing.sm }}
          >
            Sign In
          </Button>

          <View
            style={{
              flexDirection: "row",
              justifyContent: "center",
              marginTop: Spacing.lg,
            }}
          >
            <Text style={{ color: Colors.light.textSoft }}>
              Don't have an account?{" "}
            </Text>
            <TouchableOpacity onPress={() => router.push("/signup")}>
              <Text style={{ color: Colors.light.primary, fontWeight: "600" }}>
                Sign Up
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: Spacing.xl,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.light.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  title: { fontSize: 26, fontWeight: "800", color: Colors.light.text },
  subtitle: {
    color: Colors.light.textSoft,
    marginTop: 4,
    marginBottom: Spacing.xxl,
  },
  card: {
    width: "100%",
    maxWidth: 400,
    backgroundColor: Colors.light.white,
    borderRadius: Radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.light.line,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: Spacing.lg,
    color: Colors.light.text,
  },
  error: {
    backgroundColor: "#FEE2E2",
    color: Colors.light.red,
    fontSize: 13,
    textAlign: "center",
    padding: 10,
    borderRadius: Radius.sm,
    marginBottom: Spacing.md,
  },
});
