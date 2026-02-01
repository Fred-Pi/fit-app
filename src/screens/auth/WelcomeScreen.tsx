import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import GlassCard from '../../components/GlassCard';
import GlassButton from '../../components/GlassButton';
import { colors, spacing, typography, radius } from '../../utils/theme';
import { showAlert } from '../../utils/platform';
import { AuthStackParamList } from '../../navigation/AuthNavigator';
import { signInWithGoogle } from '../../services/supabase';

type WelcomeScreenProps = {
  navigation: NativeStackNavigationProp<AuthStackParamList, 'Welcome'>;
};

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [oauthLoading, setOauthLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    setOauthLoading(true);
    try {
      const { error } = await signInWithGoogle();
      if (error) {
        showAlert('Sign In Failed', error.message);
      }
    } catch (err) {
      showAlert('Sign In Failed', 'An unexpected error occurred. Please try again.');
    } finally {
      setOauthLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.content}>
        {/* Logo and Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <LinearGradient
              colors={[colors.primary, colors.primaryHover]}
              style={styles.logoGradient}
            >
              <Ionicons name="fitness" size={56} color={colors.text} />
            </LinearGradient>
          </View>
          <Text style={styles.title}>FitTrack</Text>
          <Text style={styles.subtitle}>Your fitness journey{'\n'}starts here</Text>
        </View>

        {/* CTAs */}
        <View style={styles.ctaContainer}>
          <GlassCard accent="blue" glowIntensity="subtle" padding="lg">
            <View style={styles.ctaContent}>
              <GlassButton
                title="Get Started"
                onPress={() => navigation.navigate('Register')}
                variant="primary"
                size="lg"
                fullWidth
                icon="rocket-outline"
              />

              <Text style={styles.ctaHint}>Create your free account</Text>

              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
                <Text style={styles.dividerText}>or</Text>
                <View style={styles.divider} />
              </View>

              <GlassButton
                title={oauthLoading ? 'Signing in...' : 'Continue with Google'}
                onPress={handleGoogleSignIn}
                variant="secondary"
                size="lg"
                fullWidth
                icon="logo-google"
                disabled={oauthLoading}
              />
            </View>
          </GlassCard>

          <View style={styles.signInSection}>
            <Text style={styles.signInText}>Already have an account?</Text>
            <GlassButton
              title="Sign In"
              onPress={() => navigation.navigate('Login')}
              variant="ghost"
              size="md"
              fullWidth
              icon="log-in-outline"
            />
          </View>
        </View>

        {/* Features hint */}
        <View style={styles.features}>
          <View style={styles.featureItem}>
            <Ionicons name="barbell-outline" size={20} color={colors.primary} />
            <Text style={styles.featureText}>Track workouts</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="nutrition-outline" size={20} color={colors.nutrition} />
            <Text style={styles.featureText}>Log nutrition</Text>
          </View>
          <View style={styles.featureItem}>
            <Ionicons name="analytics-outline" size={20} color={colors.analytics} />
            <Text style={styles.featureText}>See progress</Text>
          </View>
        </View>
      </View>

      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, spacing.lg) }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: spacing['2xl'],
    justifyContent: 'center',
    maxWidth: 500,
    alignSelf: 'center',
    width: '100%',
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
  },
  logoContainer: {
    marginBottom: spacing.xl,
  },
  logoGradient: {
    width: 120,
    height: 120,
    borderRadius: radius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.size['4xl'],
    fontWeight: typography.weight.extrabold,
    color: colors.text,
    marginBottom: spacing.md,
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: typography.size.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 28,
  },
  ctaContainer: {
    gap: spacing.xl,
  },
  ctaContent: {
    gap: spacing.md,
  },
  ctaHint: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
    textAlign: 'center',
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: colors.border,
  },
  dividerText: {
    marginHorizontal: spacing.md,
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
  signInSection: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  signInText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  features: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing['3xl'],
  },
  featureItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  featureText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
  },
  footer: {
    paddingHorizontal: spacing['2xl'],
  },
});

export default WelcomeScreen;
