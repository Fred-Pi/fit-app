import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  SectionList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors, glass, radius, spacing, typography, shadows } from '../utils/theme';
import ModalHeader from './ModalHeader';
import ResponsiveModal from './ResponsiveModal';
import SearchBar from './SearchBar';
import { modalStyles } from '../styles/modalStyles';
import { FoodPreset } from '../types';
import { usePresetStore } from '../stores/presetStore';
import { lightHaptic } from '../utils/haptics';

interface PresetPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectPreset: (preset: FoodPreset) => void;
  onQuickEntry: () => void;
  onCreatePreset: () => void;
  onManagePresets: () => void;
}

interface ActionItem {
  id: string;
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  sublabel: string;
  colors: [string, string];
  onPress: () => void;
}

const PresetPickerModal: React.FC<PresetPickerModalProps> = ({
  visible,
  onClose,
  onSelectPreset,
  onQuickEntry,
  onCreatePreset,
  onManagePresets,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const { presets, fetchPresets, getRecentPresets, searchPresets, isLoading } = usePresetStore();

  useEffect(() => {
    if (visible) {
      fetchPresets();
    }
  }, [visible, fetchPresets]);

  const recentPresets = getRecentPresets(5);
  const filteredPresets = searchQuery ? searchPresets(searchQuery) : presets;

  const handleSelectPreset = (preset: FoodPreset) => {
    lightHaptic();
    onSelectPreset(preset);
  };

  const handleQuickEntry = () => {
    lightHaptic();
    onClose();
    onQuickEntry();
  };

  const handleCreatePreset = () => {
    lightHaptic();
    onClose();
    onCreatePreset();
  };

  const handleManagePresets = () => {
    lightHaptic();
    onClose();
    onManagePresets();
  };

  const actions: ActionItem[] = [
    {
      id: 'quick',
      icon: 'flash',
      label: 'Quick Entry',
      sublabel: 'Log without saving',
      colors: [colors.nutritionLight, colors.nutrition],
      onPress: handleQuickEntry,
    },
    {
      id: 'create',
      icon: 'add-circle',
      label: 'New Preset',
      sublabel: 'Create & save for later',
      colors: [colors.primaryLight, colors.primary],
      onPress: handleCreatePreset,
    },
  ];

  const renderActionItem = (item: ActionItem) => (
    <Pressable
      key={item.id}
      style={({ pressed }) => [
        styles.actionItem,
        pressed && styles.actionItemPressed,
      ]}
      onPress={item.onPress}
    >
      <LinearGradient colors={item.colors} style={styles.actionIcon}>
        <Ionicons name={item.icon} size={22} color={colors.text} />
      </LinearGradient>
      <View style={styles.actionInfo}>
        <Text style={styles.actionLabel}>{item.label}</Text>
        <Text style={styles.actionSublabel}>{item.sublabel}</Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

  const renderPresetItem = ({ item }: { item: FoodPreset }) => (
    <Pressable
      style={({ pressed }) => [
        styles.presetItem,
        pressed && styles.presetItemPressed,
      ]}
      onPress={() => handleSelectPreset(item)}
    >
      <View style={styles.presetInfo}>
        <Text style={styles.presetName}>{item.name}</Text>
        <Text style={styles.presetDetails}>
          {item.servingSize} {item.servingUnit} • {item.calories} cal
        </Text>
      </View>
      <View style={styles.presetMacros}>
        <Text style={styles.presetMacroText}>
          P: {item.protein}g
        </Text>
        <Text style={styles.presetMacroText}>
          C: {item.carbs}g
        </Text>
        <Text style={styles.presetMacroText}>
          F: {item.fats}g
        </Text>
      </View>
      <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
    </Pressable>
  );

  const renderSectionHeader = ({ section }: { section: { title: string } }) => (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{section.title}</Text>
    </View>
  );

  const sections = [
    ...(recentPresets.length > 0 && !searchQuery
      ? [{ title: 'Recent', data: recentPresets }]
      : []),
    ...(filteredPresets.length > 0
      ? [{ title: searchQuery ? 'Results' : 'All Presets', data: filteredPresets }]
      : []),
  ];

  const hasPresets = presets.length > 0;

  return (
    <ResponsiveModal visible={visible} onClose={onClose} size="lg">
      <View style={styles.container}>
        <ModalHeader
          title="Add Meal"
          onCancel={onClose}
          showSave={false}
          rightAccessory={
            hasPresets ? (
              <Pressable
                style={styles.manageButton}
                onPress={handleManagePresets}
              >
                <Ionicons name="settings-outline" size={22} color={colors.primary} />
              </Pressable>
            ) : undefined
          }
        />

        <View style={styles.content}>
          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            {actions.map(renderActionItem)}
          </View>

          {/* Presets Section */}
          {hasPresets ? (
            <>
              <View style={styles.searchContainer}>
                <SearchBar
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  placeholder="Search presets..."
                />
              </View>

              {sections.length > 0 ? (
                <SectionList
                  sections={sections}
                  keyExtractor={(item) => item.id}
                  renderItem={renderPresetItem}
                  renderSectionHeader={renderSectionHeader}
                  contentContainerStyle={styles.listContent}
                  showsVerticalScrollIndicator={false}
                  stickySectionHeadersEnabled={false}
                />
              ) : (
                <View style={styles.noResults}>
                  <Ionicons name="search-outline" size={32} color={colors.textTertiary} />
                  <Text style={styles.noResultsText}>No presets found</Text>
                </View>
              )}
            </>
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
  actionsContainer: {
    padding: spacing.lg,
    gap: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: glass.border,
  },
  actionItem: {
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
  actionItemPressed: {
    backgroundColor: glass.background,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionInfo: {
    flex: 1,
  },
  actionLabel: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.semibold as '600',
    color: colors.text,
    marginBottom: 2,
  },
  actionSublabel: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  searchContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
  },
  sectionHeader: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.size.sm,
    fontWeight: typography.weight.semibold as '600',
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  listContent: {
    paddingBottom: spacing['3xl'],
  },
  presetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: glass.backgroundLight,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    borderWidth: 1,
    borderColor: glass.border,
  },
  presetItemPressed: {
    backgroundColor: glass.background,
  },
  presetInfo: {
    flex: 1,
  },
  presetName: {
    fontSize: typography.size.base,
    fontWeight: typography.weight.medium as '500',
    color: colors.text,
    marginBottom: 4,
  },
  presetDetails: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
  },
  presetMacros: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  presetMacroText: {
    fontSize: typography.size.xs,
    color: colors.textTertiary,
    backgroundColor: glass.background,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radius.sm,
  },
  noResults: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  noResultsText: {
    fontSize: typography.size.base,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['3xl'],
    paddingVertical: spacing['3xl'],
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
  },
  emptySubtitle: {
    fontSize: typography.size.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  manageButton: {
    padding: spacing.sm,
  },
});

export default PresetPickerModal;
