import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from '../components/ModalHeader';
import ResponsiveModal from '../components/ResponsiveModal';
import SearchBar from '../components/SearchBar';
import SwipeableRow from '../components/SwipeableRow';
import { FoodPreset } from '../types';
import { usePresetStore } from '../stores/presetStore';
import { warningHaptic, lightHaptic } from '../utils/haptics';

interface ManagePresetsScreenProps {
  visible: boolean;
  onClose: () => void;
  onEditPreset: (preset: FoodPreset) => void;
  onCreatePreset: () => void;
}

const ManagePresetsScreen: React.FC<ManagePresetsScreenProps> = ({
  visible,
  onClose,
  onEditPreset,
  onCreatePreset,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { presets, fetchPresets, deletePreset, searchPresets, isLoading } = usePresetStore();

  useEffect(() => {
    if (visible) {
      fetchPresets();
    }
  }, [visible, fetchPresets]);

  const filteredPresets = searchQuery ? searchPresets(searchQuery) : presets;

  const handleEditPreset = (preset: FoodPreset) => {
    lightHaptic();
    onClose();
    onEditPreset(preset);
  };

  const handleDeletePreset = (preset: FoodPreset) => {
    warningHaptic();
    Alert.alert(
      'Delete Preset',
      `Are you sure you want to delete "${preset.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deletePreset(preset.id);
          },
        },
      ]
    );
  };

  const handleCreatePreset = () => {
    lightHaptic();
    onClose();
    onCreatePreset();
  };

  const renderPresetItem = ({ item }: { item: FoodPreset }) => {
    const content = (
      <Pressable
        style={({ pressed }) => [
          styles.presetItem,
          pressed && styles.presetItemPressed,
        ]}
        onPress={() => handleEditPreset(item)}
      >
        <LinearGradient
          colors={[colors.nutritionLight, colors.nutrition]}
          style={styles.presetIcon}
        >
          <Ionicons name="restaurant" size={20} color={colors.text} />
        </LinearGradient>
        <View style={styles.presetInfo}>
          <Text style={styles.presetName}>{item.name}</Text>
          <Text style={styles.presetDetails}>
            {item.servingSize} {item.servingUnit} • {item.calories} cal
          </Text>
          <View style={styles.macrosRow}>
            <Text style={styles.macroTag}>P: {item.protein}g</Text>
            <Text style={styles.macroTag}>C: {item.carbs}g</Text>
            <Text style={styles.macroTag}>F: {item.fats}g</Text>
          </View>
        </View>
        <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
      </Pressable>
    );

    // Use SwipeableRow on mobile for swipe-to-delete
    if (Platform.OS !== 'web') {
      return (
        <SwipeableRow
          onEdit={() => handleEditPreset(item)}
          onDelete={() => handleDeletePreset(item)}
        >
          {content}
        </SwipeableRow>
      );
    }

    // On web, show edit/delete buttons on hover/press
    return (
      <View style={styles.presetItemWrapper}>
        {content}
        <View style={styles.actionButtons}>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              pressed && styles.actionButtonPressed,
            ]}
            onPress={() => handleEditPreset(item)}
          >
            <Ionicons name="pencil" size={16} color={colors.primary} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.actionButton,
              styles.deleteButton,
              pressed && styles.deleteButtonPressed,
            ]}
            onPress={() => handleDeletePreset(item)}
          >
            <Ionicons name="trash" size={16} color={colors.error} />
          </Pressable>
        </View>
      </View>
    );
  };

  return (
    <ResponsiveModal visible={visible} onClose={onClose} size="lg">
      <View style={styles.container}>
        <ModalHeader
          title="Manage Presets"
          onCancel={onClose}
          showSave={false}
        />

        <View style={styles.content}>
          {presets.length > 0 && (
            <View style={styles.searchContainer}>
              <SearchBar
                value={searchQuery}
                onChangeText={setSearchQuery}
                placeholder="Search presets..."
              />
            </View>
          )}

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading presets...</Text>
            </View>
          ) : filteredPresets.length > 0 ? (
            <FlatList
              data={filteredPresets}
              keyExtractor={(item) => item.id}
              renderItem={renderPresetItem}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            />
          ) : searchQuery ? (
            <View style={styles.emptyState}>
              <Ionicons name="search-outline" size={48} color={colors.textTertiary} />
              <Text style={styles.emptyTitle}>No presets found</Text>
              <Text style={styles.emptySubtitle}>
                Try a different search term
              </Text>
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Ionicons name="restaurant-outline" size={48} color={colors.textTertiary} />
              </View>
              <Text style={styles.emptyTitle}>No presets yet</Text>
              <Text style={styles.emptySubtitle}>
                Create food presets to quickly log your favorite meals
              </Text>
            </View>
          )}

          {/* Floating Add Button */}
          <Pressable
            style={({ pressed }) => [
              styles.fab,
              pressed && styles.fabPressed,
            ]}
            onPress={handleCreatePreset}
          >
            <LinearGradient
              colors={[colors.primaryLight, colors.primary]}
              style={styles.fabGradient}
            >
              <Ionicons name="add" size={28} color={colors.text} />
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    </ResponsiveModal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
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
    paddingBottom: spacing['3xl'] + 60, // Account for FAB
  },
  presetItemWrapper: {
    position: 'relative',
    marginBottom: spacing.md,
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    borderRadius: radius.xl,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
    ...shadows.sm,
  },
  presetItemPressed: {
    backgroundColor: glass.background,
  },
  presetIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold as '600',
    color: colors.text,
    marginBottom: 4,
  },
  presetDetails: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  macrosRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  macroTag: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    backgroundColor: glass.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  actionButtons: {
    position: 'absolute',
    right: spacing.lg + 30,
    top: '50%',
    transform: [{ translateY: -16 }],
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    width: 32,
    height: 32,
    borderRadius: radius.md,
    backgroundColor: glass.background,
    borderWidth: 1,
    borderColor: glass.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonPressed: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  deleteButton: {
    backgroundColor: colors.errorMuted,
    borderColor: colors.errorMuted,
  },
  deleteButtonPressed: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
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
  emptyTitle: {
    fontSize: typography.size.xl,
    fontWeight: typography.weight.semibold as '600',
    color: colors.text,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: spacing.xl,
    right: spacing.xl,
    ...shadows.lg,
  },
  fabPressed: {
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default ManagePresetsScreen;
