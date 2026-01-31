import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  Animated,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import GlassButton from './GlassButton';
import { colors, glass, spacing, typography, radius } from '../utils/theme';

interface NamePromptModalProps {
  visible: boolean;
  onSave: (name: string) => void;
}

const NamePromptModal: React.FC<NamePromptModalProps> = ({
  visible,
  onSave,
}) => {
  const [name, setName] = useState('');
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setName('');
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          damping: 15,
          stiffness: 200,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleAnim.setValue(0.9);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const handleSave = () => {
    const trimmedName = name.trim();
    if (trimmedName.length > 0) {
      onSave(trimmedName);
    }
  };

  const canSave = name.trim().length > 0;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={() => {}}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.backdrop}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <View style={styles.androidBackdrop} />
          )}
        </View>

        <Animated.View
          style={[
            styles.container,
            {
              opacity: opacityAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <LinearGradient
            colors={[glass.backgroundLight, glass.backgroundDark]}
            style={styles.gradient}
          >
            <View style={styles.shine} />

            <View style={styles.iconContainer}>
              <Ionicons name="person" size={40} color={colors.primary} />
            </View>

            <Text style={styles.title}>What's your name?</Text>
            <Text style={styles.subtitle}>We'll use this to personalize your experience</Text>

            <View style={styles.inputContainer}>
              <Ionicons name="person-outline" size={20} color={colors.textSecondary} />
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
                autoFocus
              />
            </View>

            <View style={styles.actions}>
              <GlassButton
                title="Continue"
                onPress={handleSave}
                variant="primary"
                fullWidth
                icon="arrow-forward"
                disabled={!canSave}
              />
            </View>
            {!canSave && (
              <Text style={styles.hint}>Name is required to continue</Text>
            )}
          </LinearGradient>
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
  },
  container: {
    width: '100%',
    maxWidth: 360,
    borderRadius: radius['2xl'],
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: glass.borderLight,
  },
  gradient: {
    padding: spacing['2xl'],
    alignItems: 'center',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: glass.borderAccent,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    backgroundColor: colors.primaryMuted,
  },
  title: {
    fontSize: typography.size['2xl'],
    fontWeight: typography.weight.bold,
    color: colors.text,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
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
    width: '100%',
    marginBottom: spacing.xl,
  },
  input: {
    flex: 1,
    fontSize: typography.size.base,
    color: colors.text,
    paddingVertical: spacing.md,
  },
  actions: {
    width: '100%',
  },
  hint: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

export default NamePromptModal;
