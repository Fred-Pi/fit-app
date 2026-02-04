import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import { colors, glass, spacing, typography, radius } from '../../utils/theme';
import { supabase } from '../../services/supabase';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { logError } from '../../utils/logger';

type ResetPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ResetPassword'>;
  route: RouteProp<AuthStackParamList, 'ResetPassword'>;
};

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ navigation, route }) => {
  const insets = useSafeAreaInsets();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // Extract tokens from URL params if present
  useEffect(() => {
    const handleTokens = async () => {
      const accessToken = route.params?.access_token;
      const refreshToken = route.params?.refresh_token;

      if (accessToken && refreshToken) {
        try {
          await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
        } catch (error) {
          logError('Failed to set session from reset link', error);
        }
      }
    };

    handleTokens();
  }, [route.params]);

  const handleUpdatePassword = async () => {
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        Alert.alert('Error', error.message);
      } else {
        setIsSuccess(true);
      }
    } catch (_error) {
      Alert.alert('Error', 'Failed to update password');
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <LinearGradient
          colors={[colors.background, colors.surface, colors.background]}
          style={StyleSheet.absoluteFill}
        />

        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />

        <View style={styles.successContent}>
          <View style={styles.successIconContainer}>
            <LinearGradient
              colors={[colors.success, colors.successLight]}
              style={styles.successIconGradient}
            >
              <Ionicons name="checkmark-circle-outline" size={48} color={colors.text} />
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Password Updated!</Text>
          <Text style={styles.successSubtitle}>
            Your password has been successfully updated.{'\n'}
            You can now sign in with your new password.
          </Text>

          <View style={styles.successButtonContainer}>
            <GlassButton
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              size="lg"
              fullWidth
              icon="log-in-outline"
            />
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <LinearGradient
        colors={[colors.background, colors.surface, colors.background]}
        style={StyleSheet.absoluteFill}
      />

      <View style={styles.decorCircle1} />
      <View style={styles.decorCircle2} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <Pressable style={styles.backButton} onPress={() => navigation.navigate('Login')}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.primary, colors.primaryHover]}
                style={styles.iconGradient}
              >
                <Ionicons name="lock-closed-outline" size={40} color={colors.text} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Set New Password</Text>
            <Text style={styles.subtitle}>
              Enter your new password below.
            </Text>
          </View>

          <GlassCard accent="none" glowIntensity="none" padding="lg">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>New Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter new password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </Pressable>
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Confirm Password</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="lock-closed-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm new password"
                  placeholderTextColor={colors.textTertiary}
                  secureTextEntry={!showPassword}
                />
              </View>
            </View>

            <GlassButton
              title={isLoading ? 'Updating...' : 'Update Password'}
              onPress={handleUpdatePassword}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon="checkmark-outline"
            />
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.lg,
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  decorCircle1: {
    position: 'absolute',
    top: -100,
    right: -100,
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: colors.primaryMuted,
    opacity: 0.5,
  },
  decorCircle2: {
    position: 'absolute',
    bottom: 100,
    left: -150,
    width: 400,
    height: 400,
    borderRadius: 200,
    backgroundColor: colors.analyticsMuted,
    opacity: 0.3,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    backgroundColor: glass.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: glass.border,
    marginBottom: spacing.xl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  iconContainer: {
    marginBottom: spacing.xl,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  inputGroup: {
    marginBottom: spacing.xl,
  },
  inputLabel: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.medium,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
    paddingVertical: spacing.md,
  } as Record<string, unknown>,
  footer: {
    paddingHorizontal: spacing['2xl'],
  },
  successContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  successIconContainer: {
    marginBottom: spacing['2xl'],
  },
  successIconGradient: {
    width: 100,
    height: 100,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: typography.size['3xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  successSubtitle: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing['2xl'],
  },
  successButtonContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
});

export default ResetPasswordScreen;
