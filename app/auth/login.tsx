import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const handleLogin = async () => {
    if (submitting) return;
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password,
      });

      if (authError) {
        setError(authError.message);
        return;
      }

      router.back();
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegister = async () => {
    if (submitting) return;
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter email and password.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      setInfo('Check your email to confirm your account, then log in.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const disabled = !email.trim() || !password || submitting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}>
        <View style={[styles.content, { paddingHorizontal: 20 }] }>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={styles.closeButton}>
              <IconSymbol name="xmark" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.title, { color: colors.text }] }>
              Login
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }] }>
            <ThemedText style={[styles.label, { color: colors.textSecondary }] }>
              Email
            </ThemedText>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }] }>
              <IconSymbol name="envelope" size={16} color={colors.textTertiary} />
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="you@example.com"
                placeholderTextColor={colors.textTertiary}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 16 }] }>
              Password
            </ThemedText>
            <View style={[styles.inputRow, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }] }>
              <IconSymbol name="lock.fill" size={16} color={colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry
                autoCapitalize="none"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            {error ? (
              <ThemedText style={[styles.errorText, { color: colors.error }] }>
                {error}
              </ThemedText>
            ) : null}

            {info ? (
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }] }>
                {info}
              </ThemedText>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: disabled ? colors.surfaceElevated : colors.primary }]}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={handleLogin}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <ThemedText
                  style={[
                    styles.primaryButtonText,
                    { color: disabled ? colors.textSecondary : colors.primaryText },
                  ]}>
                  Continue
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              activeOpacity={0.8}
              disabled={submitting}
              onPress={handleRegister}>
              <ThemedText style={[styles.secondaryButtonText, { color: colors.text }] }>
                Register
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  title: {
    fontSize: 22,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 4,
  },
  label: {
    fontSize: 13,
    marginBottom: 4,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 0,
  },
  primaryButton: {
    marginTop: 20,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    marginTop: 10,
    fontSize: 12,
  },
  infoText: {
    marginTop: 8,
    fontSize: 12,
  },
  secondaryButton: {
    marginTop: 12,
    borderRadius: 999,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
