import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  Pressable,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import { modalStyles } from '../styles/modalStyles';
import { WorkoutTemplate } from '../types';
import { getTemplates, deleteTemplate } from '../services/storage';
import { warningHaptic } from '../utils/haptics';
import { useAuthStore } from '../stores/authStore';

interface TemplatePickerProps {
  visible: boolean;
  onClose: () => void;
  onSelectTemplate: (template: WorkoutTemplate) => void;
}

const TemplatePicker: React.FC<TemplatePickerProps> = ({
  visible,
  onClose,
  onSelectTemplate,
}) => {
  const [templates, setTemplates] = useState<WorkoutTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadTemplates();
    }
  }, [visible]);

  const loadTemplates = async () => {
    setLoading(true);
    const userId = useAuthStore.getState().user?.id;
    if (!userId) {
      setLoading(false);
      return;
    }
    const templateData = await getTemplates(userId);
    setTemplates(templateData);
    setLoading(false);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
    warningHaptic();
    Alert.alert(
      'Delete Template',
      `Are you sure you want to delete "${templateName}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteTemplate(templateId);
            loadTemplates();
          },
        },
      ]
    );
  };

  const renderTemplateItem = ({ item }: { item: WorkoutTemplate }) => (
    <View style={styles.templateItem}>
      <Pressable
        style={({ pressed }) => [
          styles.templateContent,
          pressed && styles.templateContentPressed,
        ]}
        onPress={() => handleSelectTemplate(item)}
      >
        <View style={styles.templateIcon}>
          <LinearGradient
            colors={[colors.workoutLight, colors.workout]}
            style={styles.templateIconGradient}
          >
            <Ionicons name="document-text" size={20} color={colors.text} />
          </LinearGradient>
        </View>
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{item.name}</Text>
          <Text style={styles.templateDetails}>
            {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
          <View style={styles.exercisePreview}>
            {item.exercises.slice(0, 3).map((exercise) => (
              <Text key={exercise.id} style={styles.exercisePreviewText}>
                • {exercise.exerciseName}
              </Text>
            ))}
            {item.exercises.length > 3 && (
              <Text style={styles.exercisePreviewMore}>
                + {item.exercises.length - 3} more
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
      <Pressable
        style={({ pressed }) => [
          styles.deleteButton,
          pressed && styles.deleteButtonPressed,
        ]}
        onPress={() => handleDeleteTemplate(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={18} color={colors.error} />
      </Pressable>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={modalStyles.container}>
        <ModalHeader
          title="Workout Templates"
          onCancel={onClose}
          showSave={false}
        />

        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading templates...</Text>
          </View>
        ) : templates.length > 0 ? (
          <FlatList
            data={templates}
            keyExtractor={(item) => item.id}
            renderItem={renderTemplateItem}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
          />
        ) : (
          <View style={modalStyles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="document-text-outline" size={48} color={colors.textTertiary} />
            </View>
            <Text style={styles.emptyText}>No templates yet</Text>
            <Text style={styles.emptySubtext}>
              Create a workout and save it as a template to reuse it later
            </Text>
          </View>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing['3xl'],
  },
  templateItem: {
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
    overflow: 'hidden',
    ...shadows.sm,
  },
  templateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    gap: spacing.md,
  },
  templateContentPressed: {
    backgroundColor: glass.background,
  },
  templateIcon: {
    marginRight: spacing.xs,
  },
  templateIconGradient: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: typography.size.lg,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  exercisePreview: {
    gap: 2,
  },
  exercisePreviewText: {
    fontSize: typography.size.sm,
    color: colors.textTertiary,
  },
  exercisePreviewMore: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: typography.weight.medium,
    marginTop: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.sm,
    backgroundColor: colors.errorMuted,
    borderRadius: radius.md,
  },
  deleteButtonPressed: {
    backgroundColor: colors.error,
  },
  emptyIcon: {
    width: 80,
    height: 80,
    borderRadius: radius.xl,
    backgroundColor: glass.backgroundLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyText: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold,
    color: colors.text,
    marginBottom: spacing.sm,
  },
  emptySubtext: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
    paddingHorizontal: spacing['3xl'],
  },
});

export default TemplatePicker;
