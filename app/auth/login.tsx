import * as Linking from 'expo-linking';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useTheme } from '@/contexts/theme-context';
import { supabase } from '@/utils/supabase';

export default function LoginScreen() {
  const { colors } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ redirectTo?: string }>();
  const confirmPasswordRef = useRef<TextInput>(null);

  const [authMode, setAuthMode] = useState<'signIn' | 'create'>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [resetting, setResetting] = useState(false);
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const redirectTo =
    typeof params.redirectTo === 'string' && params.redirectTo.startsWith('/')
      ? params.redirectTo
      : '/';

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
  const passwordHintsActive = passwordFocused || password.length > 0;
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
  const confirmPasswordActive = confirmPasswordFocused || confirmPassword.length > 0;
  const passwordsMatch = confirmPassword.length > 0 && password === confirmPassword;

  const close = () => {
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const finishAuth = () => {
    if (redirectTo) {
      router.replace(redirectTo as any);
      return;
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace('/');
  };

  const validateEmail = (value: string) => /\S+@\S+\.\S+/.test(value);
  const validatePassword = (value: string) =>
    value.length >= 12 && /[A-Z]/.test(value) && /[a-z]/.test(value) && /\d/.test(value);
  const switchMode = (mode: 'signIn' | 'create') => {
    setAuthMode(mode);
    setError(null);
    setInfo(null);
  };

  const handleLogin = async () => {
    if (submitting) return;
    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError('Please enter email and password.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
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

      finishAuth();
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
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }
    if (!validatePassword(password)) {
      setError('Use 12+ characters with uppercase, lowercase, and a number.');
      return;
    }
    if (!confirmPassword) {
      setError('Please confirm your password.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      if (data.session) {
        setInfo('Account created. Redirecting…');
        finishAuth();
        return;
      }

      setInfo('Account created. Check your email if confirmation is required, then sign in.');
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (resetting || submitting) return;

    setError(null);
    setInfo(null);

    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Enter your email address first.');
      return;
    }
    if (!validateEmail(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    setResetting(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: Linking.createURL('/auth/update-password'),
      });

      if (resetError) {
        setError(resetError.message);
        return;
      }

      setInfo('Password reset email sent. Open the link on this device/browser to continue.');
    } catch {
      setError('Could not send reset email. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  const disabled = authMode === 'create'
    ? !email.trim() || !password || !confirmPassword || submitting
    : !email.trim() || !password || submitting;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={["top", "right", "left"]}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={24}>
        <View style={[styles.content, { paddingHorizontal: 20 }] }>
          <View style={styles.headerRow}>
            <TouchableOpacity onPress={close} style={styles.closeButton}>
              <IconSymbol name="xmark" size={18} color={colors.text} />
            </TouchableOpacity>
            <ThemedText type="title" style={[styles.title, { color: colors.text }] }>
              {authMode === 'signIn' ? 'Sign in' : 'Create account'}
            </ThemedText>
          </View>

          <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }] }>
            <View style={[styles.authModeTabs, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
              {([
                { key: 'signIn', label: 'Sign in' },
                { key: 'create', label: 'Create account' },
              ] as const).map((mode) => {
                const active = authMode === mode.key;
                return (
                  <TouchableOpacity
                    key={mode.key}
                    style={[
                      styles.authModeTab,
                      {
                        backgroundColor: active ? colors.primary : 'transparent',
                      },
                    ]}
                    activeOpacity={0.9}
                    onPress={() => switchMode(mode.key)}
                  >
                    <ThemedText
                      style={{
                        color: active ? colors.primaryText : colors.textSecondary,
                        fontSize: 13,
                        fontWeight: '700',
                      }}>
                      {mode.label}
                    </ThemedText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <ThemedText style={[styles.modeIntro, { color: colors.textSecondary }]}>
              {authMode === 'signIn'
                ? 'Use your email and password to access the app.'
                : 'Create a tester/admin-ready account with a stronger password.'}
            </ThemedText>

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
                autoComplete="email"
                textContentType="emailAddress"
                returnKeyType="next"
                style={[styles.input, { color: colors.text }]}
              />
            </View>

            <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 16 }] }>
              Password
            </ThemedText>
            <View
              style={[
                styles.inputRow,
                {
                  borderColor:
                    authMode === 'create' && passwordStrengthCount === 4
                      ? colors.success
                      : colors.border,
                  backgroundColor: colors.surfaceElevated,
                },
                authMode === 'create' && passwordStrengthCount === 4 && {
                  shadowColor: colors.success,
                  shadowOpacity: 0.14,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 0 },
                },
              ]}>
              <IconSymbol name="lock.fill" size={16} color={colors.textTertiary} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                onFocus={() => setPasswordFocused(true)}
                onBlur={() => setPasswordFocused(false)}
                placeholder="Your password"
                placeholderTextColor={colors.textTertiary}
                secureTextEntry={!passwordVisible}
                autoCapitalize="none"
                autoComplete="password"
                textContentType="password"
                returnKeyType={authMode === 'create' ? 'next' : 'done'}
                onSubmitEditing={authMode === 'create' ? () => confirmPasswordRef.current?.focus() : handleLogin}
                style={[styles.input, { color: colors.text }]}
              />
              <TouchableOpacity onPress={() => setPasswordVisible((current) => !current)} style={styles.trailingButton}>
                <IconSymbol name={passwordVisible ? 'eye.slash' : 'eye'} size={16} color={colors.textTertiary} />
              </TouchableOpacity>
            </View>

            {authMode === 'create' ? (
              <>
                <View style={[styles.passwordHintCard, { backgroundColor: colors.surfaceElevated, borderColor: colors.border }]}>
                  <View style={styles.passwordHintHeader}>
                    <ThemedText style={[styles.passwordHintTitle, { color: colors.text }]}>
                      Password requirements
                    </ThemedText>
                    <ThemedText style={{ color: passwordHintsActive ? passwordStrengthColor : colors.textTertiary, fontSize: 12, fontWeight: '700' }}>
                      {passwordHintsActive ? passwordStrengthLabel : 'Start typing'}
                    </ThemedText>
                  </View>

                  <View style={styles.passwordStrengthTrack}>
                    {[0, 1, 2, 3].map((index) => {
                      const filled = passwordHintsActive && passwordStrengthCount > index;
                      return (
                        <View
                          key={index}
                          style={[
                            styles.passwordStrengthSegment,
                            {
                              backgroundColor: filled ? passwordStrengthColor : colors.border,
                              opacity: passwordHintsActive ? 1 : 0.45,
                            },
                          ]}
                        />
                      );
                    })}
                  </View>

                  <PasswordRequirement met={passwordChecks.minLength} label="12+ characters" colors={colors} active={passwordHintsActive} />
                  <PasswordRequirement met={passwordChecks.uppercase} label="Uppercase letter" colors={colors} active={passwordHintsActive} />
                  <PasswordRequirement met={passwordChecks.lowercase} label="Lowercase letter" colors={colors} active={passwordHintsActive} />
                  <PasswordRequirement met={passwordChecks.number} label="Number" colors={colors} active={passwordHintsActive} />
                </View>

                <ThemedText style={[styles.label, { color: colors.textSecondary, marginTop: 16 }] }>
                  Confirm password
                </ThemedText>
                <View
                  style={[
                    styles.inputRow,
                    {
                      borderColor: passwordsMatch ? colors.success : colors.border,
                      backgroundColor: colors.surfaceElevated,
                    },
                    passwordsMatch && {
                      shadowColor: colors.success,
                      shadowOpacity: 0.14,
                      shadowRadius: 8,
                      shadowOffset: { width: 0, height: 0 },
                    },
                  ]}>
                  <IconSymbol name="checkmark.seal.fill" size={16} color={colors.textTertiary} />
                  <TextInput
                    ref={confirmPasswordRef}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    onFocus={() => setConfirmPasswordFocused(true)}
                    onBlur={() => setConfirmPasswordFocused(false)}
                    placeholder="Repeat password for new accounts"
                    placeholderTextColor={colors.textTertiary}
                    secureTextEntry={!passwordVisible}
                    autoCapitalize="none"
                    autoComplete="password"
                    textContentType="password"
                    returnKeyType="done"
                    onSubmitEditing={handleRegister}
                    style={[styles.input, { color: colors.text }]}
                  />
                </View>
                <View style={styles.confirmPasswordStatusRow}>
                  <ThemedText
                    style={[
                      styles.passwordRequirementIcon,
                      {
                        color: passwordsMatch
                          ? colors.success
                          : confirmPasswordActive
                            ? colors.danger
                            : colors.textTertiary,
                        opacity: confirmPasswordActive || passwordsMatch ? 1 : 0.65,
                      },
                    ]}>
                    {passwordsMatch ? '✓' : '×'}
                  </ThemedText>
                  <ThemedText
                    style={[
                      styles.passwordRequirementText,
                      {
                        color: passwordsMatch
                          ? colors.text
                          : confirmPasswordActive
                            ? colors.textSecondary
                            : colors.textTertiary,
                      },
                    ]}>
                    {passwordsMatch ? 'Passwords match' : 'Repeat your password for account creation'}
                  </ThemedText>
                </View>
              </>
            ) : null}

            {error ? (
              <ThemedText style={[styles.errorText, { color: colors.danger }] }>
                {error}
              </ThemedText>
            ) : null}

            {info ? (
              <ThemedText style={[styles.infoText, { color: colors.textSecondary }] }>
                {info}
              </ThemedText>
            ) : null}

            {authMode === 'signIn' ? (
              <TouchableOpacity
                style={styles.inlineAction}
                onPress={handleForgotPassword}
                disabled={resetting || submitting}>
                <ThemedText style={{ color: colors.primary, fontSize: 13, fontWeight: '600' }}>
                  {resetting ? 'Sending reset email…' : 'Forgot password?'}
                </ThemedText>
              </TouchableOpacity>
            ) : (
              <ThemedText style={[styles.createModeNote, { color: colors.textSecondary }]}>
                If email confirmation is enabled, you’ll verify the account before signing in.
              </ThemedText>
            )}

            <TouchableOpacity
              style={[styles.primaryButton, { backgroundColor: disabled ? colors.surfaceElevated : colors.primary }]}
              activeOpacity={0.8}
              disabled={disabled}
              onPress={authMode === 'signIn' ? handleLogin : handleRegister}>
              {submitting ? (
                <ActivityIndicator size="small" color={colors.primaryText} />
              ) : (
                <ThemedText
                  style={[
                    styles.primaryButtonText,
                    { color: disabled ? colors.textSecondary : colors.primaryText },
                  ]}>
                  {authMode === 'signIn' ? 'Continue' : 'Create account'}
                </ThemedText>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.secondaryButton, { borderColor: colors.border }]}
              activeOpacity={0.8}
              disabled={submitting}
              onPress={() => switchMode(authMode === 'signIn' ? 'create' : 'signIn')}>
              <ThemedText style={[styles.secondaryButtonText, { color: colors.text }] }>
                {authMode === 'signIn' ? 'Create account instead' : 'Back to sign in'}
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
  authModeTabs: {
    borderWidth: 1,
    borderRadius: 999,
    padding: 4,
    flexDirection: 'row',
    gap: 4,
    marginBottom: 12,
  },
  authModeTab: {
    flex: 1,
    borderRadius: 999,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIntro: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
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
  passwordHintCard: {
    marginTop: 12,
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 8,
  },
  passwordHintTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  passwordHintHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  passwordStrengthTrack: {
    flexDirection: 'row',
    gap: 6,
  },
  passwordStrengthSegment: {
    flex: 1,
    height: 6,
    borderRadius: 999,
  },
  passwordRequirementRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  passwordRequirementIcon: {
    width: 16,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '700',
  },
  passwordRequirementText: {
    fontSize: 13,
    fontWeight: '600',
  },
  confirmPasswordStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 10,
  },
  trailingButton: {
    padding: 4,
  },
  inlineAction: {
    alignSelf: 'flex-start',
    marginTop: 10,
  },
  createModeNote: {
    marginTop: 12,
    fontSize: 12,
    lineHeight: 18,
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

function PasswordRequirement({
  met,
  label,
  colors,
  active,
}: {
  met: boolean;
  label: string;
  colors: ReturnType<typeof useTheme>['colors'];
  active: boolean;
}) {
  const unresolvedColor = active ? colors.danger : colors.textTertiary;
  const textColor = met ? colors.text : active ? colors.textSecondary : colors.textTertiary;

  return (
    <View style={[styles.passwordRequirementRow, !active && !met && { opacity: 0.65 }]}>
      <ThemedText
        style={[
          styles.passwordRequirementIcon,
          { color: met ? colors.success : unresolvedColor },
        ]}>
        {met ? '✓' : '×'}
      </ThemedText>
      <ThemedText
        style={[
          styles.passwordRequirementText,
          { color: textColor },
        ]}>
        {label}
      </ThemedText>
    </View>
  );
}
