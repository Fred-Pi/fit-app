import React, { useState } from 'react';
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
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import { colors, glass, spacing, typography, radius } from '../../utils/theme';
import { useAuthStore } from '../../stores';
import { AuthStackParamList } from '../../navigation/AuthNavigator';

type ForgotPasswordScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'ForgotPassword'>;
};

const ForgotPasswordScreen: React.FC<ForgotPasswordScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { resetPassword, isLoading } = useAuthStore();

  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleResetPassword = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email');
      return;
    }

    const { error } = await resetPassword(email.trim());

    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setEmailSent(true);
    }
  };

  if (emailSent) {
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
              <Ionicons name="mail-outline" size={48} color={colors.text} />
            </LinearGradient>
          </View>

          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successSubtitle}>
            We've sent a password reset link to{'\n'}
            <Text style={styles.emailText}>{email}</Text>
          </Text>

          <View style={styles.successButtonContainer}>
            <GlassButton
              title="Back to Login"
              onPress={() => navigation.navigate('Login')}
              variant="primary"
              size="lg"
              fullWidth
              icon="arrow-back"
            />
          </View>

          <Pressable onPress={() => setEmailSent(false)} style={styles.resendLink}>
            <Text style={styles.resendText}>Didn't receive the email? </Text>
            <Text style={styles.resendLinkText}>Try again</Text>
          </Pressable>
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

      {/* Decorative elements */}
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
          {/* Back button */}
          <Pressable style={styles.backButton} onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </Pressable>

          <View style={styles.header}>
            <View style={styles.iconContainer}>
              <LinearGradient
                colors={[colors.primary, colors.primaryHover]}
                style={styles.iconGradient}
              >
                <Ionicons name="key-outline" size={40} color={colors.text} />
              </LinearGradient>
            </View>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              No worries! Enter your email and we'll send you a reset link.
            </Text>
          </View>

          <GlassCard accent="none" glowIntensity="none" padding="lg">
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Email</Text>
              <View style={styles.inputContainer}>
                <Ionicons name="mail-outline" size={20} color={colors.textSecondary} />
                <TextInput
                  style={styles.input}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            <GlassButton
              title={isLoading ? 'Sending...' : 'Send Reset Link'}
              onPress={handleResetPassword}
              variant="primary"
              size="lg"
              fullWidth
              disabled={isLoading}
              icon="send-outline"
            />
          </GlassCard>

          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Remember your password? </Text>
            <Pressable onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Sign In</Text>
            </Pressable>
          </View>
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
  } as any,
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing['2xl'],
  },
  loginText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  loginLink: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
  },
  // Success state styles
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
  emailText: {
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
  successButtonContainer: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  resendLink: {
    flexDirection: 'row',
  },
  resendText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  resendLinkText: {
    fontSize: typography.size.base,
    color: colors.primary,
    fontWeight: typography.weight.semibold,
  },
});

export default ForgotPasswordScreen;
