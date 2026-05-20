import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';

export default function UpdatePasswordScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const passwordChecks = useMemo(() => ({
    minLength: password.length >= 12,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /\d/.test(password),
  }), [password]);
  const passwordStrengthCount = useMemo(
    () => Object.values(passwordChecks).filter(Boolean).length,
    [passwordChecks]
  );
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;
  const passwordStrengthLabel = passwordStrengthCount <= 1
    ? 'Weak'
    : passwordStrengthCount <= 3
      ? 'Good'
      : 'Strong';
  const passwordStrengthColor = passwordStrengthCount <= 1
    ? colors.danger
    : passwordStrengthCount <= 3
      ? colors.warning
      : colors.success;

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const handleUpdatePassword = async () => {
    if (submitting) return;

    setError(null);
    setInfo(null);

    if (password.length < 12 || !/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/\d/.test(password)) {
      setError('Use 12+ characters with uppercase, lowercase, and a number.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password,
      });

      if (updateError) {
        setError(updateError.message);
        return;
      }

      setInfo('Password updated. Redirecting…');
      router.replace('/');
    } catch {
      setError('Could not update your password. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}>
        <View style={[styles.content, { paddingHorizontal: 20 }]}>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={close} style={styles.closeButton}>
              <IconSymbol name="chevron.left" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.title, { color: colors.text }]}>
              Update password
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <ThemedText type="subtitle" style={{ color: colors.text, fontSize: 18 }}>
              Set a new password
            </ThemedText>
            <ThemedText style={[styles.body, { color: colors.textSecondary }]}>
              Opened from a password reset email? Set your new password here.
            </ThemedText>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
              New password
            </ThemedText>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor: password && passwordStrengthCount === 4 ? colors.success : colors.border,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            >
              <IconSymbol name="lock.fill" size={16} color={colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="12+ chars, upper/lowercase, number"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="password-new"
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity onPress={() => setPasswordVisible((current) => !current)} style={styles.trailingButton}>
                <IconSymbol name={passwordVisible ? 'eye.slash' : 'eye'} size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            <View style={[styles.passwordGuide, { borderColor: colors.border, backgroundColor: colors.surfaceElevated }]}>
              <View style={styles.passwordGuideHeader}>
                <ThemedText style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                  Password requirements
                </ThemedText>
                <ThemedText style={{ color: passwordStrengthColor, fontWeight: '700', fontSize: 12 }}>
                  {passwordStrengthLabel}
                </ThemedText>
              </View>
              <View style={styles.passwordGuideBars}>
                {[0, 1, 2, 3].map((index) => (
                  <View
                    key={index}
                    style={[
                      styles.passwordGuideBar,
                      {
                        backgroundColor: index < passwordStrengthCount ? passwordStrengthColor : colors.border,
                      },
                    ]}
                  />
                ))}
              </View>
              {[
                { ok: passwordChecks.minLength, label: '12+ characters' },
                { ok: passwordChecks.uppercase, label: 'Uppercase letter' },
                { ok: passwordChecks.lowercase, label: 'Lowercase letter' },
                { ok: passwordChecks.number, label: 'Number' },
              ].map((item) => (
                <View key={item.label} style={styles.passwordRuleRow}>
                  <ThemedText style={{ color: item.ok ? colors.success : colors.textTertiary, fontWeight: '700', width: 16 }}>
                    {item.ok ? '✓' : '×'}
                  </ThemedText>
                  <ThemedText style={{ color: item.ok ? colors.text : colors.textSecondary, fontSize: 13 }}>
                    {item.label}
                  </ThemedText>
                </View>
              ))}
            </View>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 16 }]}>
              Confirm password
            </ThemedText>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor: passwordsMatch ? colors.success : colors.border,
                  backgroundColor: colors.surfaceElevated,
                },
              ]}
            >
              <IconSymbol name="lock.fill" size={16} color={colors.textTertiary} />
              <TextInput
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Repeat your new password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!confirmVisible}
                autoCapitalize="none"
                textContentType="newPassword"
                autoComplete="password-new"
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity onPress={() => setConfirmVisible((current) => !current)} style={styles.trailingButton}>
                <IconSymbol name={confirmVisible ? 'eye.slash' : 'eye'} size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {confirmPassword.length ? (
              <View style={styles.matchRow}>
                <ThemedText style={{ color: passwordsMatch ? colors.success : colors.textTertiary, fontWeight: '700' }}>
                  {passwordsMatch ? '✓' : '×'}
                </ThemedText>
                <ThemedText style={{ color: passwordsMatch ? colors.text : colors.textSecondary, fontSize: 13 }}>
                  {passwordsMatch ? 'Passwords match' : 'Repeat your password exactly'}
                </ThemedText>
              </View>
            ) : null}

            {error ? (
              <ThemedText style={[styles.errorText, { color: colors.danger }]}>
                {error}
              </ThemedText>
            ) : null}

            {info ? (
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }]}>
                {info}
              </ThemedText>
            ) : null}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: submitting ? colors.surfaceElevated : colors.primary }]}
              activeOpacity={0.8}
              disabled={submitting}
              onPress={handleUpdatePassword}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <ThemedText style={[styles.primaryButtonText, { color: colors.primaryText }]}>
                  Save new password
                </ThemedText>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              activeOpacity={0.8}
              disabled={submitting}
              onPress={close}>
              <ThemedText style={[styles.secondaryButtonText, { color: colors.text }]}>
                Back to app
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
    padding: 18,
    gap: 6,
  },
  body: {
    fontSize: 14,
    lineHeight: 20,
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
  passwordGuide: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    padding: 12,
    gap: 10,
  },
  passwordGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  passwordGuideBars: {
    flexDirection: 'row',
    gap: 8,
  },
  passwordGuideBar: {
    flex: 1,
    height: 5,
    borderRadius: 999,
  },
  passwordRuleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  trailingButton: {
    padding: 4,
  },
  matchRow: {
    marginTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
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
  secondaryButton: {
    marginTop: 10,
    borderRadius: 999,
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
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
});
