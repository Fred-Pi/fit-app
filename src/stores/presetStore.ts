/**
 * Preset Store - Zustand
 *
 * Centralized state for food presets (reusable food items).
 */

import { create } from 'zustand';
import { FoodPreset } from '../types';
import {
  getPresets,
  savePreset,
  deletePreset as deletePresetFromDb,
  updatePresetLastUsed,
  createPreset,
} from '../services/storage';
import { useAuthStore } from './authStore';

const getUserId = (): string | null => {
  const { user } = useAuthStore.getState();
  return user?.id || null;
};

interface PresetState {
  // State
  presets: FoodPreset[];
  isLoading: boolean;
  presetsLoaded: boolean;

  // Actions
  fetchPresets: () => Promise<void>;
  addPreset: (data: Omit<FoodPreset, 'id' | 'userId' | 'createdAt' | 'lastUsedAt'>) => Promise<FoodPreset>;
  updatePreset: (preset: FoodPreset) => Promise<void>;
  deletePreset: (id: string) => Promise<void>;
  markPresetUsed: (id: string) => Promise<void>;

  // Computed
  getRecentPresets: (limit?: number) => FoodPreset[];
  searchPresets: (query: string) => FoodPreset[];
}

export const usePresetStore = create<PresetState>((set, get) => ({
  presets: [],
  isLoading: false,
  presetsLoaded: false,

  fetchPresets: async () => {
    const userId = getUserId();
    if (!userId) return;

    // Skip if already loaded
    if (get().presetsLoaded) return;

    set({ isLoading: true });
    try {
      const presets = await getPresets(userId);
      set({
        presets,
        presetsLoaded: true,
      });
    } catch (error) {
      console.error('Failed to fetch presets:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  addPreset: async (data) => {
    const userId = getUserId();
    if (!userId) throw new Error('User not authenticated');

    const preset = createPreset(userId, data);
    await savePreset(preset);

    set((state) => ({
      presets: [...state.presets, preset].sort((a, b) => a.name.localeCompare(b.name)),
    }));

    return preset;
  },

  updatePreset: async (preset) => {
    await savePreset(preset);

    set((state) => ({
      presets: state.presets
        .map((p) => (p.id === preset.id ? preset : p))
        .sort((a, b) => a.name.localeCompare(b.name)),
    }));
  },

  deletePreset: async (id) => {
    await deletePresetFromDb(id);

    set((state) => ({
      presets: state.presets.filter((p) => p.id !== id),
    }));
  },

  markPresetUsed: async (id) => {
    await updatePresetLastUsed(id);

    const now = new Date().toISOString();
    set((state) => ({
      presets: state.presets.map((p) =>
        p.id === id ? { ...p, lastUsedAt: now } : p
      ),
    }));
  },

  // Computed: Get recent presets sorted by lastUsedAt
  getRecentPresets: (limit = 5) => {
    const { presets } = get();
    return presets
      .filter((p) => p.lastUsedAt !== null)
      .sort((a, b) => {
        if (!a.lastUsedAt) return 1;
        if (!b.lastUsedAt) return -1;
        return new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime();
      })
      .slice(0, limit);
  },

  // Computed: Search presets by name
  searchPresets: (query: string) => {
    const { presets } = get();
    if (!query.trim()) return presets;

    const lowerQuery = query.toLowerCase().trim();
    return presets.filter((p) => p.name.toLowerCase().includes(lowerQuery));
  },
}));
