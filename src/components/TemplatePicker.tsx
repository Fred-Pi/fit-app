import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WorkoutTemplate } from '../types';
import { getTemplates, deleteTemplate } from '../services/storage';

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
    const templateData = await getTemplates();
    setTemplates(templateData);
    setLoading(false);
  };

  const handleSelectTemplate = (template: WorkoutTemplate) => {
    onSelectTemplate(template);
    onClose();
  };

  const handleDeleteTemplate = async (templateId: string, templateName: string) => {
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
      <TouchableOpacity
        style={styles.templateContent}
        onPress={() => handleSelectTemplate(item)}
      >
        <View style={styles.templateInfo}>
          <Text style={styles.templateName}>{item.name}</Text>
          <Text style={styles.templateDetails}>
            {item.exercises.length} {item.exercises.length === 1 ? 'exercise' : 'exercises'}
          </Text>
          <View style={styles.exercisePreview}>
            {item.exercises.slice(0, 3).map((exercise, index) => (
              <Text key={exercise.id} style={styles.exercisePreviewText}>
                • {exercise.exerciseName}
              </Text>
            ))}
            {item.exercises.length > 3 && (
              <Text style={styles.exercisePreviewText}>
                + {item.exercises.length - 3} more
              </Text>
            )}
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#A0A0A8" />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteTemplate(item.id, item.name)}
      >
        <Ionicons name="trash-outline" size={20} color="#FF5E6D" />
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout Templates</Text>
          <View style={styles.placeholder} />
        </View>

        {/* Template List */}
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
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={64} color="#A0A0A8" />
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
  container: {
    flex: 1,
    backgroundColor: '#1E1E22',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3A3A42',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  placeholder: {
    width: 60,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#A0A0A8',
  },
  listContent: {
    padding: 16,
  },
  templateItem: {
    backgroundColor: '#2A2A30',
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#3A3A42',
    overflow: 'hidden',
  },
  templateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  templateInfo: {
    flex: 1,
  },
  templateName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  templateDetails: {
    fontSize: 14,
    color: '#A0A0A8',
    marginBottom: 8,
  },
  exercisePreview: {
    marginTop: 4,
  },
  exercisePreviewText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: 'rgba(255, 94, 109, 0.1)',
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#A0A0A8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default TemplatePicker;
